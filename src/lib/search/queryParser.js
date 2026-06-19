// Smart Search query parser ($0, no AI). Turns a natural-language tutor query
// into structured filters + a residual free-text blob for FTS, using the live
// catalog as the authoritative backbone. Pure & dependency-free so it is unit
// testable and runs with every AI integration disabled.
//
// Disambiguation order for any token/phrase:
//   1) exact catalog match -> 2) alias/synonym -> 3) phrase -> 4) fuzzy/trigram
//   -> 5) if still ambiguous, keep multiple candidates + lower confidence.
//
// IMPORTANT: only the RESIDUAL text (after consumed tokens are removed) is meant
// for FTS/trigram — never the raw query — so "under 50" can't pollute search.

// ---------------------------------------------------------------------------
// Built-in fallback catalog (used when no live catalog is passed). Mirrors the
// shapes in ServiceContext / registrationCatalog.
// ---------------------------------------------------------------------------
export const DEFAULT_CATALOG = {
  subjects: [
    { subName: 'Mathematics' }, { subName: 'Physics' }, { subName: 'Chemistry' },
    { subName: 'Biology' }, { subName: 'English' }, { subName: 'Spanish' },
    { subName: 'French' }, { subName: 'History' }, { subName: 'Geography' },
    { subName: 'Computer Science' }, { subName: 'Accounting' }, { subName: 'Graphic Design' },
    { subName: 'Economics' },
  ],
  specializations: [
    { spec: 'Organic Chemistry', subject: 'Chemistry' },
    { spec: 'Inorganic Chemistry', subject: 'Chemistry' },
    { spec: 'Physical Chemistry', subject: 'Chemistry' },
    { spec: 'Analytical Chemistry', subject: 'Chemistry' },
    { spec: 'General Chemistry', subject: 'Chemistry' },
    { spec: 'Algebra', subject: 'Mathematics' },
    { spec: 'Calculus', subject: 'Mathematics' },
    { spec: 'Geometry', subject: 'Mathematics' },
    { spec: 'Statistics', subject: 'Mathematics' },
    { spec: 'Microbiology', subject: 'Biology' },
    { spec: 'Genetics', subject: 'Biology' },
    { spec: 'Quantum Physics', subject: 'Physics' },
  ],
  languages: ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
    'Mandarin', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Russian'],
  levels: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
};

// Alias / synonym map for subjects & specializations. A value may be a single
// {type,value} or an array of candidates (=> ambiguous, kept low-confidence).
export const ALIAS_MAP = {
  // specializations
  'orgo': { type: 'specialization', value: 'Organic Chemistry' },
  'ochem': { type: 'specialization', value: 'Organic Chemistry' },
  'o chem': { type: 'specialization', value: 'Organic Chemistry' },
  'organic chem': { type: 'specialization', value: 'Organic Chemistry' },
  'calc': { type: 'specialization', value: 'Calculus' },
  'stats': { type: 'specialization', value: 'Statistics' },
  // subjects
  'bio': { type: 'subject', value: 'Biology' },
  'chem': { type: 'subject', value: 'Chemistry' },
  'cs': { type: 'subject', value: 'Computer Science' },
  'comp sci': { type: 'subject', value: 'Computer Science' },
  'compsci': { type: 'subject', value: 'Computer Science' },
  'cse': { type: 'subject', value: 'Computer Science' },
  'math': { type: 'subject', value: 'Mathematics' },
  'maths': { type: 'subject', value: 'Mathematics' },
  'phys': { type: 'subject', value: 'Physics' },
  'econ': { type: 'subject', value: 'Economics' },
  // intentionally ambiguous (disambiguation step 5)
  'geo': [{ type: 'specialization', value: 'Geometry' }, { type: 'subject', value: 'Geography' }],
};

// Exams (kept in residual so FTS can match bios — there is no exam facet yet).
const EXAM_MAP = {
  ielts: 'IELTS', toefl: 'TOEFL', sat: 'SAT', act: 'ACT', gre: 'GRE', gmat: 'GMAT',
  mcat: 'MCAT', lsat: 'LSAT', neet: 'NEET', jee: 'JEE Main',
};
// Course levels (AP/IB/...) — also kept in residual.
const COURSE_LEVEL_PATTERNS = [
  [/\ba[-\s]?level\b/g, 'A-Level'],
  [/\bigcse\b/g, 'IGCSE'],
  [/\bgcse\b/g, 'GCSE'],
  [/\bhonou?rs\b/g, 'Honors'],
  [/\bap\b/g, 'AP'],
  [/\bib\b/g, 'IB'],
];

const LEVEL_ALIASES = {
  beginner: 'Beginner', beginners: 'Beginner', novice: 'Beginner', elementary: 'Beginner',
  intermediate: 'Intermediate', advanced: 'Advanced', expert: 'Expert',
};

const FILLER = new Set([
  'tutor', 'tutors', 'teacher', 'teachers', 'tuition', 'instructor', 'professor', 'prof',
  'lesson', 'lessons', 'class', 'classes', 'course', 'courses', 'help', 'helps', 'need',
  'needs', 'want', 'wants', 'looking', 'look', 'for', 'a', 'an', 'the', 'please', 'who',
  'that', 'with', 'and', 'or', 'me', 'my', 'i', 'find', 'get', 'good', 'best', 'great',
  'someone', 'somebody', 'near', 'in', 'on', 'of', 'to', 'is', 'am', 'are',
]);

// ---------------------------------------------------------------------------
// Trigram similarity (pg_trgm-style padding + Dice coefficient) for typo
// tolerance, done client-side at $0.
// ---------------------------------------------------------------------------
function trigramSet(s) {
  const p = '  ' + String(s).toLowerCase().replace(/[^a-z0-9]/g, '') + ' ';
  const set = new Set();
  for (let i = 0; i + 3 <= p.length; i++) set.add(p.slice(i, i + 3));
  return set;
}
export function trigramSimilarity(a, b) {
  const A = trigramSet(a), B = trigramSet(b);
  if (!A.size || !B.size) return 0;
  let common = 0;
  for (const t of A) if (B.has(t)) common++;
  return (2 * common) / (A.size + B.size);
}

// ---------------------------------------------------------------------------
// Catalog normalization + surface index.
// ---------------------------------------------------------------------------
function normalizeCatalog(input) {
  const c = input || {};
  const subjects = (c.subjects || DEFAULT_CATALOG.subjects).map((s) =>
    typeof s === 'string' ? s : (s.subName || s.name)).filter(Boolean);
  const specializations = (c.specializations || DEFAULT_CATALOG.specializations).map((s) =>
    typeof s === 'string' ? { spec: s, subject: '' } : { spec: s.spec || s.name, subject: s.subject || '' })
    .filter((s) => s.spec);
  const languages = (c.languages || DEFAULT_CATALOG.languages).map((l) =>
    typeof l === 'string' ? l : (l.name || l.language)).filter(Boolean);
  const levels = (c.levels || DEFAULT_CATALOG.levels).slice();
  return { subjects, specializations, languages, levels };
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
}

// Surfaces for subjects + specializations + their aliases, multiword-first.
function buildSurfaces(cat) {
  const surfaces = [];
  for (const subName of cat.subjects) {
    surfaces.push({ surface: subName.toLowerCase(), type: 'subject', value: subName, conf: 1 });
  }
  for (const sp of cat.specializations) {
    surfaces.push({ surface: sp.spec.toLowerCase(), type: 'specialization', value: sp.spec, parent: sp.subject, conf: 1 });
  }
  const specParent = Object.fromEntries(cat.specializations.map((s) => [s.spec, s.subject]));
  for (const [alias, target] of Object.entries(ALIAS_MAP)) {
    const targets = Array.isArray(target) ? target : [target];
    surfaces.push({
      surface: alias.toLowerCase(),
      type: targets.length > 1 ? 'ambiguous' : targets[0].type,
      value: targets.length > 1 ? null : targets[0].value,
      parent: targets.length > 1 ? null : (targets[0].type === 'specialization' ? specParent[targets[0].value] : undefined),
      candidates: targets.length > 1 ? targets : undefined,
      conf: 0.95,
    });
  }
  // multiword first, then longer surfaces first, so "computer science" beats
  // "science" and "organic chem" beats "chem".
  surfaces.sort((a, b) =>
    b.surface.split(/\s+/).length - a.surface.split(/\s+/).length ||
    b.surface.length - a.surface.length);
  return surfaces;
}

// ---------------------------------------------------------------------------
// Price extraction. Returns the price object and blanks consumed spans.
// ---------------------------------------------------------------------------
function extractPrice(text, price) {
  let t = text;
  const eat = (re, fn) => { t = t.replace(re, (...m) => { fn(...m); return ' '; }); };

  eat(/\bbetween\s*\$?\s*(\d{1,4})\s*(?:and|to|-|–)\s*\$?\s*(\d{1,4})\b/g, (_, a, b) => {
    price.min = Math.min(+a, +b); price.cap = Math.max(+a, +b);
  });
  eat(/\b\$?\s*(\d{1,3})\s*(?:-|–|to)\s*\$?\s*(\d{1,4})\s*(?:\/\s*hr|\/\s*hour|per\s*hour|an?\s*hour|dollars|usd)?\b/g, (_, a, b) => {
    if (price.cap == null) { price.min = Math.min(+a, +b); price.cap = Math.max(+a, +b); }
  });
  eat(/\b(?:around|about|approx(?:imately)?|~|roughly|circa)\s*\$?\s*(\d{1,4})\b/g, (_, n) => {
    if (price.cap == null) { price.cap = +n; price.soft = true; }
  });
  eat(/\b(?:under|below|less\s*than|up\s*to|at\s*most|max(?:imum)?|no\s*more\s*than|cheaper\s*than)\s*\$?\s*(\d{1,4})\b/g, (_, n) => {
    if (price.cap == null) price.cap = +n;
  });
  eat(/\b(?:over|above|at\s*least|min(?:imum)?|more\s*than|starting\s*at)\s*\$?\s*(\d{1,4})\b/g, (_, n) => {
    if (price.min == null) price.min = +n;
  });
  eat(/\$\s*(\d{1,4})\b/g, (_, n) => { if (price.cap == null) price.cap = +n; });
  eat(/\b(\d{1,4})\s*(?:dollars|usd|bucks|\/\s*hr|\/\s*hour|per\s*hour|an?\s*hour|hourly)\b/g, (_, n) => {
    if (price.cap == null) price.cap = +n;
  });
  eat(/\b(?:cheap(?:est)?|affordable|budget|inexpensive|economical|low[-\s]?cost)\b/g, () => {
    price.cheap = true; price.soft = true;
  });
  return t;
}

// ---------------------------------------------------------------------------
// Main entry point.
// ---------------------------------------------------------------------------
export function parseSearchQuery(rawQuery, catalogInput) {
  const cat = normalizeCatalog(catalogInput);
  const surfaces = buildSurfaces(cat);

  const out = {
    raw: String(rawQuery || ''),
    subjects: [], specializations: [], languages: [], exams: [], courseLevels: [],
    level: null, modality: [], availabilityTimes: [], local: false,
    price: { cap: null, min: null, soft: false, cheap: false },
    residualText: '', confidence: 1, summaryChips: [], suggestions: [], ambiguous: [],
  };
  const confParts = [];
  const residualKeep = [];
  const pushUniq = (arr, v) => { if (v && !arr.includes(v)) arr.push(v); };

  // Normalize: lowercase, keep $ + - digits, collapse whitespace.
  let t = ' ' + String(rawQuery || '').toLowerCase().replace(/[^a-z0-9$+\-\s]/g, ' ').replace(/\s+/g, ' ') + ' ';

  // Candidate languages present in the ORIGINAL text (reconciled after subjects).
  const candidateLanguages = cat.languages.filter((l) =>
    new RegExp('\\b' + escapeRe(l.toLowerCase()) + '\\b').test(t));

  // 1) price
  t = extractPrice(t, out.price);

  // 2) modality
  t = t.replace(/\bnear\s*me\b|\bnearby\b|\blocal\b/g, () => { pushUniq(out.modality, 'in-person'); out.local = true; return ' '; });
  t = t.replace(/\bin[-\s]?person\b|\bface[-\s]?to[-\s]?face\b|\bon[-\s]?site\b|\boffline\b/g, () => { pushUniq(out.modality, 'in-person'); return ' '; });
  t = t.replace(/\b(?:online|virtual|remote|zoom)\b/g, () => { pushUniq(out.modality, 'online'); return ' '; });

  // 3) availability times
  t = t.replace(/\b(mornings?|afternoons?|evenings?|nights?|weekends?|weekdays?)\b/g, (w) => {
    pushUniq(out.availabilityTimes, w.replace(/s$/, '')); return ' ';
  });

  // 4) level words
  t = t.replace(/\b(beginners?|novice|elementary|intermediate|advanced|expert)\b/g, (w) => {
    if (!out.level) out.level = LEVEL_ALIASES[w] || null; return ' ';
  });

  // 5) exams + course levels (recorded, but kept in residual for FTS)
  for (const [k, v] of Object.entries(EXAM_MAP)) {
    const re = new RegExp('\\b' + escapeRe(k) + '\\b', 'g');
    if (re.test(t)) { pushUniq(out.exams, v); residualKeep.push(k); t = t.replace(re, ' '); }
  }
  for (const [re, label] of COURSE_LEVEL_PATTERNS) {
    const r = new RegExp(re.source, 'g');
    if (r.test(t)) { pushUniq(out.courseLevels, label); residualKeep.push(label.toLowerCase().replace(/[^a-z0-9]/g, '')); t = t.replace(r, ' '); }
  }

  // 6) subjects / specializations / aliases (exact + alias + phrase)
  for (const s of surfaces) {
    const re = new RegExp('\\b' + escapeRe(s.surface) + '\\b', 'g');
    if (!re.test(t)) continue;
    t = t.replace(re, ' ');
    if (s.type === 'subject') { pushUniq(out.subjects, s.value); confParts.push(s.conf); }
    else if (s.type === 'specialization') {
      pushUniq(out.specializations, s.value);
      if (s.parent) pushUniq(out.subjects, s.parent);
      confParts.push(s.conf);
    } else if (s.type === 'ambiguous') {
      out.ambiguous.push({ token: s.surface, candidates: s.candidates });
      s.candidates.forEach((c) => out.suggestions.push(c.value));
      residualKeep.push(s.surface.replace(/\s+/g, ''));
      confParts.push(0.5);
    }
  }

  // 7) fuzzy/trigram for leftover word-ish tokens (typo tolerance)
  const singleWordCatalog = [
    ...cat.subjects.filter((s) => !s.includes(' ')).map((s) => ({ type: 'subject', value: s })),
    ...cat.specializations.filter((s) => !s.spec.includes(' ')).map((s) => ({ type: 'specialization', value: s.spec, parent: s.subject })),
  ];
  const specParent = Object.fromEntries(cat.specializations.map((s) => [s.spec, s.subject]));
  t = t.replace(/\b([a-z]{4,})\b/g, (word) => {
    if (FILLER.has(word)) return ' ';
    let best = null, second = 0;
    for (const entry of singleWordCatalog) {
      const sim = trigramSimilarity(word, entry.value);
      if (!best || sim > best.sim) { second = best ? best.sim : 0; best = { ...entry, sim }; }
      else if (sim > second) second = sim;
    }
    if (best && best.sim >= 0.45 && best.sim - second >= 0.1) {
      if (best.type === 'subject') pushUniq(out.subjects, best.value);
      else { pushUniq(out.specializations, best.value); if (best.parent || specParent[best.value]) pushUniq(out.subjects, best.parent || specParent[best.value]); }
      out.suggestions.push(best.value);
      confParts.push(0.6);
      return ' ';
    }
    return ' ' + word + ' '; // leave for residual
  });

  // 8) reconcile languages (a name that is also a subject becomes a language
  //    only when another subject/spec is present — else it stays a subject)
  for (const lang of candidateLanguages) {
    const idx = out.subjects.indexOf(lang);
    if (idx !== -1) {
      const others = out.subjects.length + out.specializations.length - 1;
      if (others >= 1) { out.subjects.splice(idx, 1); pushUniq(out.languages, lang); }
    } else {
      pushUniq(out.languages, lang);
    }
    confParts.push(0.9);
    // ensure the language word is not left in residual
    t = t.replace(new RegExp('\\b' + escapeRe(lang.toLowerCase()) + '\\b', 'g'), ' ');
  }

  // 9) residual = leftover non-filler tokens + kept exam/course-level terms
  const leftover = t.split(/\s+/).filter((w) => w && !FILLER.has(w) && !/^\d+$/.test(w) && w.length > 1);
  out.residualText = [...new Set([...residualKeep, ...leftover])].join(' ').trim();

  // confidence
  if (confParts.length) out.confidence = Math.min(...confParts);
  else out.confidence = out.residualText ? 0.5 : 0.3;
  if (out.ambiguous.length) out.confidence = Math.min(out.confidence, 0.55);
  out.confidence = Math.round(out.confidence * 100) / 100;

  out.summaryChips = buildChips(out);
  out.suggestions = [...new Set(out.suggestions)];
  return out;
}

function buildChips(p) {
  const chips = [];
  (p.specializations.length ? p.specializations : p.subjects).forEach((s) => chips.push(s));
  p.courseLevels.forEach((c) => chips.push(c));
  if (p.level) chips.push(p.level);
  p.exams.forEach((e) => chips.push(e));
  if (p.price.cheap) chips.push('Budget-friendly');
  else if (p.price.cap != null && p.price.min != null) chips.push(`$${p.price.min}–${p.price.cap}/hr`);
  else if (p.price.cap != null) chips.push(`≤ $${p.price.cap}/hr`);
  else if (p.price.min != null) chips.push(`≥ $${p.price.min}/hr`);
  p.modality.forEach((m) => chips.push(m === 'online' ? 'Online' : 'In-person'));
  p.availabilityTimes.forEach((tm) => chips.push(tm.charAt(0).toUpperCase() + tm.slice(1) + 's'));
  p.languages.forEach((l) => chips.push(l));
  return chips;
}

// Memoized parse — caches normalized-query → parsed intent for the session
// ($0; avoids re-parsing identical/repeat queries). The catalog is stable per
// session (loaded once + cached), so the query string is a sufficient key.
const _parseCache = new Map();
export function parseSearchQueryCached(rawQuery, catalog) {
  const key = String(rawQuery || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (_parseCache.has(key)) return _parseCache.get(key);
  const result = parseSearchQuery(rawQuery, catalog);
  if (_parseCache.size > 300) _parseCache.clear(); // simple unbounded-growth guard
  _parseCache.set(key, result);
  return result;
}
