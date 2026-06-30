// =============================================================================
// Teacher Discovery — data mapper.
//
// Converts a live `teacher` (the FindTutors / listTeacherCards shape, which is
// the registration-form / search-RPC shape consumed by TeacherCard.jsx) into
// the exact shape the Bumble swipe card renders. Mirrors TeacherCard's
// normalizers + fallbacks so the SAME data drives both the desktop grid card
// and the phone swipe card. Accepts the design's own shape too (pass-through),
// so seeded demo data renders unchanged.
//
// `genProfile()` reproduces the source design's deterministic per-section data
// (Subject-by-level / Experience-by-category / Courses / local About /
// Portfolio) so the scroll-down Details look identical to the Claude Design
// "Teacher Discovery.dc.html". Avatars are deterministic inline-gradient +
// initials (zero network).
// =============================================================================

const GRADIENTS = [
  'linear-gradient(135deg,#34D399,#0F8A5F)',
  'linear-gradient(135deg,#60A5FA,#2563EB)',
  'linear-gradient(135deg,#F0883E,#D9632B)',
  'linear-gradient(135deg,#A78BFA,#7C3AED)',
  'linear-gradient(135deg,#F472B6,#DB2777)',
  'linear-gradient(135deg,#FBBF24,#D97706)',
  'linear-gradient(135deg,#22D3EE,#0891B2)',
  'linear-gradient(135deg,#FB7185,#E11D48)',
];

const FALLBACK = {
  reviewCount: 10,
  location: 'New York, USA',
  speaks: [
    { language: 'English', level: 'Native' },
    { language: 'Italian', level: 'Fluent' },
  ],
  specializations: ['Organic Chemistry', 'Bio Chemistry', 'Analytical', 'Physical Chem', 'Polymers'],
  experience: { online: 1, offline: 3, industry: 3 },
  bio: 'PhD chemist who turns intimidating reactions into clear, step-by-step logic. I shape every session around your exam board, gaps and pace.',
  reviews: [
    { author: 'Sara K.', rating: 5, text: 'Went from a C to an A in one term. Endlessly patient.' },
    { author: 'Tom B.', rating: 5, text: 'Makes organic chemistry actually click.' },
  ],
  cancellation: '70% refund · Free before 10 days & 3 hr',
  subject: 'Chemistry',
};

// deterministic hash → palette index (stable across renders / sessions)
function hashString(str) {
  let h = 0;
  const s = String(str || '');
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function gradientFor(seedKey) {
  return GRADIENTS[hashString(seedKey) % GRADIENTS.length];
}

function initialsFor(name) {
  return String(name || 'T').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function subjectName(value, fallback) {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  return value.subject || value.name || fallback;
}

function normSpeaks(teacher) {
  const langs = Array.isArray(teacher.speaks)
    ? teacher.speaks
    : Array.isArray(teacher.languages)
      ? teacher.languages
      : [];
  const norm = langs
    .map((l) => (typeof l === 'string'
      ? { language: l, level: '' }
      : { language: l.language || l.name || '', level: l.level || l.proficiency || '' }))
    .filter((l) => l.language);
  return norm.length ? norm : FALLBACK.speaks;
}

function normSpecs(teacher) {
  const raw = Array.isArray(teacher.specializations) && teacher.specializations.length
    ? teacher.specializations
    : FALLBACK.specializations;
  return raw.map((s) => (typeof s === 'string' ? s : s.specialization || s.name)).filter(Boolean);
}

function fmtYears(v, fallback) {
  if (v == null || v === '') return fallback;
  return typeof v === 'number' ? v : (parseFloat(v) || fallback);
}

function normExperience(teacher) {
  const e = teacher.experience || {};
  return {
    online: fmtYears(e.online ?? e.online_years, FALLBACK.experience.online),
    offline: fmtYears(e.offline ?? e.offline_years, FALLBACK.experience.offline),
    industry: fmtYears(e.industry ?? e.industry_years, FALLBACK.experience.industry),
  };
}

// Trial first, then each enabled non-trial service → {label, amount}.
function normPrices(teacher) {
  if (Array.isArray(teacher.prices) && teacher.prices.length) return teacher.prices;

  const out = [];
  const trial = teacher.hourlyRate?.trial ?? teacher.trialPrice;
  out.push({ label: 'Trial Lesson', amount: trial != null ? trial : 18 });

  if (Array.isArray(teacher.services) && teacher.services.length) {
    teacher.services
      .filter((s) => s && s.enabled !== false && !s.isTrial)
      .forEach((s) => out.push({ label: s.title || s.name || 'Service', amount: s.price }));
  } else {
    const hr = teacher.hourlyRate || {};
    const regular = hr.online ?? hr.regular;
    if (regular != null) out.push({ label: 'Online Class', amount: regular });
  }
  if (out.length === 1) out.push({ label: 'Online Class', amount: 25 }, { label: 'Consulting', amount: 40 });
  return out;
}

function normCancellation(teacher) {
  if (typeof teacher.cancellation === 'string') return teacher.cancellation;
  const c = teacher.cancellation || {};
  const refundPct = c.refundPct != null
    ? c.refundPct
    : (c.percentage != null ? 100 - c.percentage : 70);
  if (c.noRefund || refundPct <= 0) return 'No refund on cancellation';
  const days = c.freeCancellationDays ?? c.freeBeforeDays ?? 10;
  const hours = c.freeCancellationHours ?? c.freeBeforeHours ?? 3;
  return `${refundPct}% refund · Free before ${days} days & ${hours} hr`;
}

function normReviews(teacher) {
  const list = Array.isArray(teacher.reviews)
    ? teacher.reviews
    : Array.isArray(teacher.reviewsList)
      ? teacher.reviewsList
      : FALLBACK.reviews;
  // design augments each review with a deterministic "reviewer count"
  return list.map((r) => ({ ...r, reviewerCount: 12 + (String(r.author || '').length % 9) }));
}

function reviewCountOf(teacher, reviewsList) {
  if (teacher.reviewCount != null) return teacher.reviewCount;
  if (typeof teacher.reviews === 'number') return teacher.reviews;
  return reviewsList.length || FALLBACK.reviewCount;
}

// Reproduce the design's genProfile(): deterministic Subject/Experience/Courses/
// local-About/Portfolio data derived from subject + specializations.
function genProfile(subject, sp, speaks) {
  const subj = (subject || '').split(' / ')[0];
  const lang = (speaks && speaks[0] && speaks[0].language) || 'your language';
  return {
    subjectsByLevel: {
      Expert: [sp[0] || subj, sp[1] || `Advanced ${subj}`, sp[2] || `${subj} Mastery`],
      Intermediate: [sp[3] || `${subj} Foundations`, sp[4] || `Applied ${subj}`, sp[1] || subj],
      Beginner: [`${subj} Basics`, `Intro to ${subj}`, `Starter ${subj}`],
    },
    experienceByCat: {
      Teaching: [
        { title: 'Senior Tutor', period: 'Jan 2016 – Present · BREADY' },
        { title: `${subj} Coach`, period: '2012 – 2016 · Online Academy' },
        { title: 'Private Tutor', period: '2009 – 2012 · Self-employed' },
      ],
      Industry: [
        { title: `${subj} Specialist`, period: '2014 – 2020 · Industry' },
        { title: 'Consultant', period: '2011 – 2014 · Freelance' },
      ],
      Education: [
        { title: `M.Sc. ${subj}`, period: '2007 – 2009 · University' },
        { title: `B.Sc. ${subj}`, period: '2003 – 2007 · University' },
      ],
    },
    courses: {
      Board: { tabName: 'Board Name', more: '+50 More', subjects: [subj, sp[1] || subj, sp[2] || subj] },
      Exam: { tabName: 'Exam Name', more: '+12 More', subjects: [`${subj} Exam`, 'Mock Tests', 'Final Prep'] },
    },
    aboutLocal: `Lessons also available in ${lang}. I keep every session relaxed and judgement-free, mixing real practice with the theory you need to progress quickly.`,
    portfolioCount: 4,
  };
}

/** Map one live teacher → the discovery card shape (incl. all design section data). */
export function mapTeacherToDiscovery(teacher) {
  const t = teacher || {};
  const id = t.id != null ? String(t.id) : (t.name || 'teacher');
  const name = t.name || t.fullName || 'Teacher';
  const rating = Number(t.rating) || 4.6;
  const subject = subjectName(Array.isArray(t.subjects) ? t.subjects[0] : t.subject, FALLBACK.subject);
  const speaks = normSpeaks(t);
  const specializations = normSpecs(t);
  const prices = normPrices(t);
  const reviews = normReviews(t);

  return {
    id,
    name,
    first: t.first || name.split(/\s+/)[0],
    online: t.online != null ? t.online : true,
    subject,
    location: t.location || FALLBACK.location,
    rating,
    reviewCount: reviewCountOf(t, reviews),
    topRated: t.topRated != null ? t.topRated : (t.tag === 'Top Rated' || rating >= 4.8),
    grad: t.grad || gradientFor(id + name),
    initials: t.initials || initialsFor(name),
    prices,
    fromPrice: Math.min(...prices.map((p) => p.amount)),
    speaks,
    specializations,
    experience: normExperience(t),
    cancellation: normCancellation(t),
    bio: t.bio || FALLBACK.bio,
    reviews,
    seed: t.seed != null ? t.seed : (hashString(id) % 97) + 1,
    ...genProfile(subject, specializations, speaks),
  };
}

// ---- availability grid (inline section + booking sheet), exact to the design --

export const BOOKING_DAYS = [
  { dow: 'SUN', date: 12 },
  { dow: 'MON', date: 13 },
  { dow: 'TUE', date: 14 },
  { dow: 'WED', date: 15 },
  { dow: 'THU', date: 16 },
  { dow: 'FRI', date: 17 },
  { dow: 'SAT', date: 18 },
];

export const BOOKING_TIMES = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

/** Design's deterministic availability: `((di*3 + ri*2 + seed) % 6) !== 0`. */
export function isSlotAvailable(seed, dayIdx, timeIdx) {
  return ((dayIdx * 3 + timeIdx * 2 + (seed || 1)) % 6) !== 0;
}
