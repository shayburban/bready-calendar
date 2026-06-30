// =============================================================================
// Teacher Discovery — data mapper.
//
// Converts a live `teacher` (the FindTutors / listTeacherCards shape, which is
// the registration-form / search-RPC shape consumed by TeacherCard.jsx) into
// the richer shape the Bumble swipe card renders. Mirrors TeacherCard's
// normalizers + fallbacks so the SAME data drives both the desktop grid card
// and the phone swipe card. Accepts the design's own shape too (pass-through),
// so seeded demo data renders unchanged.
//
// Avatars are deterministic inline-gradient + initials (zero network) per the
// design — no external image calls.
// =============================================================================

const GRADIENTS = [
  'linear-gradient(135deg,#F0883E,#D9632B)',
  'linear-gradient(135deg,#60A5FA,#2563EB)',
  'linear-gradient(135deg,#34D399,#059669)',
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
  specializations: ['Organic Chemistry', 'Bio Chemistry', 'Analytical Chemistry', 'Physical Chemistry'],
  experience: { online: 1, offline: 3, industry: 3 },
  bio: 'Patient tutor focused on building intuition, not memorisation. Structured lessons with worked examples and a clear path to your goal.',
  whyThisTeacher: 'Highly rated by students for clarity and patience',
  whyStudentsPick: [
    'Breaks hard ideas into digestible steps',
    'Lessons mapped to your exact syllabus',
    'Detailed written feedback between sessions',
  ],
  reviews: [
    { author: 'Sara K.', rating: 5, text: 'Endlessly patient and made it finally click.' },
    { author: 'Tom B.', rating: 5, text: 'Clear, structured and genuinely encouraging.' },
  ],
  badges: ['Verified', 'Responds fast', 'Available today'],
  nextAvailable: 'Today, 15:00',
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
  const parts = String(name || 'T').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'T';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
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
  out.push({ label: 'Trial Lesson', amount: trial != null ? trial : 1 });

  if (Array.isArray(teacher.services) && teacher.services.length) {
    teacher.services
      .filter((s) => s && s.enabled !== false && !s.isTrial)
      .forEach((s) => out.push({ label: s.title || s.name || 'Service', amount: s.price }));
  } else {
    const hr = teacher.hourlyRate || {};
    const regular = hr.online ?? hr.regular;
    if (regular != null) out.push({ label: 'Online Class', amount: regular });
  }
  return out.length > 1 ? out : [...out, { label: 'Online Class', amount: 25 }];
}

function normCancellation(teacher) {
  if (typeof teacher.cancellation === 'string') return teacher.cancellation;
  const c = teacher.cancellation || {};
  const refundPct = c.refundPct != null
    ? c.refundPct
    : (c.percentage != null ? 100 - c.percentage : 70);
  if (c.noRefund || refundPct <= 0) return 'No refund on cancellation';
  const days = c.freeCancellationDays ?? c.freeBeforeDays ?? 1;
  const hours = c.freeCancellationHours ?? c.freeBeforeHours;
  const free = hours != null ? `Free before ${days} days & ${hours} hr` : `Free before ${days} days`;
  return `${refundPct}% refund · ${free}`;
}

function normReviews(teacher) {
  if (Array.isArray(teacher.reviews)) return teacher.reviews;
  if (Array.isArray(teacher.reviewsList)) return teacher.reviewsList;
  return FALLBACK.reviews;
}

function reviewCountOf(teacher, reviewsList) {
  if (teacher.reviewCount != null) return teacher.reviewCount;
  if (typeof teacher.reviews === 'number') return teacher.reviews;
  return reviewsList.length || FALLBACK.reviewCount;
}

function nextAvailableOf(teacher) {
  if (teacher.nextAvailable) return teacher.nextAvailable;
  const av = teacher.availability;
  if (Array.isArray(av) && av.length) return `${av[0]}, 15:00`;
  return FALLBACK.nextAvailable;
}

function badgesOf(teacher, rating) {
  if (Array.isArray(teacher.badges) && teacher.badges.length) return teacher.badges;
  const out = ['Verified'];
  if (teacher.tag) out.push(teacher.tag);
  else if (rating >= 4.8) out.push('Top Rated');
  return out;
}

/** Map one live teacher → the discovery card shape. */
export function mapTeacherToDiscovery(teacher) {
  const t = teacher || {};
  const id = t.id != null ? String(t.id) : (t.name || 'teacher');
  const name = t.name || t.fullName || 'Teacher';
  const rating = Number(t.rating) || 4.8;
  const reviewsList = normReviews(t);

  return {
    id,
    name,
    first: t.first || name.split(/\s+/)[0],
    flag: t.flag || '',
    online: t.online != null ? t.online : true,
    subject: subjectName(Array.isArray(t.subjects) ? t.subjects[0] : t.subject, FALLBACK.subject),
    location: t.location || FALLBACK.location,
    rating,
    reviewCount: reviewCountOf(t, reviewsList),
    topRated: t.topRated != null ? t.topRated : (t.tag === 'Top Rated' || rating >= 4.8),
    grad: t.grad || gradientFor(id + name),
    initials: t.initials || initialsFor(name),
    prices: normPrices(t),
    speaks: normSpeaks(t),
    specializations: normSpecs(t),
    experience: normExperience(t),
    cancellation: normCancellation(t),
    whyThisTeacher: t.whyThisTeacher || FALLBACK.whyThisTeacher,
    bio: t.bio || FALLBACK.bio,
    whyStudentsPick: Array.isArray(t.whyStudentsPick) && t.whyStudentsPick.length
      ? t.whyStudentsPick
      : FALLBACK.whyStudentsPick,
    reviews: reviewsList,
    badges: badgesOf(t, rating),
    nextAvailable: nextAvailableOf(t),
    // deterministic seed for the availability grid (stable per teacher)
    seed: t.seed != null ? t.seed : (hashString(id) % 97) + 1,
  };
}

/** Build the day/time availability grid for the booking sheet, deterministic per seed. */
export const BOOKING_DAYS = [
  { dow: 'SUN', date: 12 },
  { dow: 'MON', date: 13 },
  { dow: 'TUE', date: 14 },
  { dow: 'WED', date: 15 },
  { dow: 'THU', date: 16 },
  { dow: 'FRI', date: 17 },
  { dow: 'SAT', date: 18 },
];

export const BOOKING_TIMES = ['09:00', '10:00', '11:00', '13:00', '15:00'];

/** A cell is "available" via a stable hash of (seed, day, time) — no randomness. */
export function isSlotAvailable(seed, dayIdx, timeIdx) {
  return hashString(`${seed}-${dayIdx}-${timeIdx}`) % 10 > 3; // ~60% available
}
