// The single seam between live wizard state and any persisted snapshot.
//
// serializeFormState : live context pieces -> compact, JSON-safe snapshot
//   - strips transient/UI-only fields (slot `error`, blob: object URLs)
//   - normalizes `preferenceType` casing
//   - never embeds files/base64 (photos are already Storage URLs)
//
// hydrateFormState   : snapshot -> the `savedData` shape loadProgress consumes
//   - defensive about missing/old fields
//   - re-adds transient `error: null` the scheduler expects
//   - maps legacy slot keys ({startHour,endHour} -> {start,end})
//   - normalizes legacy capitalized `preferenceType`
//
// Keep these two the ONLY place state <-> persistence conversion happens.

const DEFAULT_WINDOW = { preference: 2, preferenceType: 'weeks' };
const DEFAULT_ADVANCE = { preference: 4, preferenceType: 'weeks' };

function normalizePair(pair) {
  if (pair == null || typeof pair !== 'object') return pair ?? null;
  const out = { ...pair };
  if (typeof out.preferenceType === 'string') {
    out.preferenceType = out.preferenceType.toLowerCase();
  }
  return out;
}

function sanitizePersonalInfo(pi = {}) {
  const out = { ...pi };
  // A blob: object URL is meaningless after a refresh — never persist it.
  if (typeof out.profilePicture === 'string' && out.profilePicture.startsWith('blob:')) {
    out.profilePicture = '';
  }
  return out;
}

function sanitizeAvailability(av = {}) {
  const slots = {};
  for (const [day, arr] of Object.entries(av.slots || {})) {
    // Drop the transient per-slot `error`; keep the real {start,end} (+ id).
    slots[day] = (arr || []).map(({ error, ...rest }) => ({ ...rest }));
  }
  return {
    timezone: av.timezone || '',
    slots,
    availabilityWindow: normalizePair(av.availabilityWindow),
    farAdvanceBookingFromStudent: normalizePair(av.farAdvanceBookingFromStudent),
    breakAfterClassInHours: normalizePair(av.breakAfterClassInHours ?? null),
  };
}

export function serializeFormState(parts = {}) {
  const {
    personalInfo, isAgeConfirmed, teachingSubjects, allSpecs,
    allBoards, allExams, availability, services, packages,
  } = parts;

  return {
    personalInfo: sanitizePersonalInfo(personalInfo),
    isAgeConfirmed: !!isAgeConfirmed,
    teachingSubjects: teachingSubjects || [],
    allSpecs: allSpecs || [],
    allBoards: allBoards || [],
    allExams: allExams || [],
    availability: sanitizeAvailability(availability),
    services: services || [],
    packages: packages || [],
  };
}

function normalizeSlot(slot = {}) {
  const s = { ...slot };
  // Legacy drafts may have used {startHour,endHour}; the live scheduler uses
  // {start,end}. Canonicalize so both validation and the scheduler agree.
  const start = s.start != null ? s.start : (s.startHour != null ? s.startHour : '');
  const end = s.end != null ? s.end : (s.endHour != null ? s.endHour : '');
  const out = { start, end, error: null };
  if (s.id != null) out.id = s.id;
  return out;
}

export function hydrateFormState(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return null;

  const av = snapshot.availability || {};
  const slots = {};
  for (const [day, arr] of Object.entries(av.slots || {})) {
    slots[day] = (arr || []).map(normalizeSlot);
  }

  return {
    personalInfo: snapshot.personalInfo || {},
    isAgeConfirmed: !!snapshot.isAgeConfirmed,
    teachingSubjects: snapshot.teachingSubjects || [],
    allSpecs: snapshot.allSpecs || [],
    allBoards: snapshot.allBoards || [],
    allExams: snapshot.allExams || [],
    availability: {
      timezone: av.timezone || '',
      slots,
      availabilityWindow: normalizePair(av.availabilityWindow) || { ...DEFAULT_WINDOW },
      farAdvanceBookingFromStudent: normalizePair(av.farAdvanceBookingFromStudent) || { ...DEFAULT_ADVANCE },
      breakAfterClassInHours: normalizePair(av.breakAfterClassInHours ?? null),
    },
    services: snapshot.services || [],
    packages: snapshot.packages || [],
  };
}

// Cheap, stable fingerprint for change-detection (skip identical writes).
// Stable key order so logically-equal snapshots hash identically.
export function fingerprint(snapshot) {
  return stableStringify(snapshot);
}

function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
}
