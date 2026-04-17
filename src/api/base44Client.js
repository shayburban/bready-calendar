// Design-preview stub. Replaces the live Base44 SDK with an in-memory store so
// the UI runs end-to-end without a backend. Layout.jsx seeds AppRole on first
// load; other pages can create/read/update like a real DB.

// Dev-only role switch: `?role=student&uid=u-student1` (or teacher/parent/admin).
// The id must match a seeded user so dashboards scoped to that user render data.
// Persisted to localStorage so it survives navigation within the SPA.
const DEFAULT_MOCK_USER = {
  id: 'demo-user',
  email: 'demo@local',
  full_name: 'Demo User',
  role: 'admin',
  ai_searches_today: 0,
  country_code: 'US',
};

const PRESET_USERS = {
  admin: { id: 'demo-user', email: 'demo@local', full_name: 'Demo User', role: 'admin', country_code: 'US' },
  teacher: { id: 'u-sarah', email: 'sarah@example.com', full_name: 'Sarah Johnson', role: 'teacher', country_code: 'US' },
  student: { id: 'u-student1', email: 'alex@example.com', full_name: 'Alex Kim', role: 'student', country_code: 'US' },
  parent: { id: 'u-parent1', email: 'parent@example.com', full_name: 'David Goldberg', role: 'parent', country_code: 'IL' },
};

const applyUidOverride = (preset, uid, seedUsers) => {
  if (!uid) return preset;
  const seeded = seedUsers.find((u) => u.id === uid);
  return seeded
    ? { ...preset, id: seeded.id, email: seeded.email, full_name: seeded.full_name, country_code: seeded.country_code, role: seeded.role || preset.role }
    : { ...preset, id: uid };
};

const resolveMockUser = (seedUsers) => {
  if (typeof window === 'undefined') return { ...DEFAULT_MOCK_USER };
  try {
    const url = new URL(window.location.href);
    const roleParam = url.searchParams.get('role');
    const uidParam = url.searchParams.get('uid');
    if (roleParam && PRESET_USERS[roleParam]) {
      const preset = applyUidOverride({ ...PRESET_USERS[roleParam] }, uidParam, seedUsers);
      window.localStorage.setItem('mock_user_role', roleParam);
      if (uidParam) window.localStorage.setItem('mock_user_uid', uidParam);
      else window.localStorage.removeItem('mock_user_uid');
      return { ...DEFAULT_MOCK_USER, ...preset, ai_searches_today: 0 };
    }
    const storedRole = window.localStorage.getItem('mock_user_role');
    const storedUid = window.localStorage.getItem('mock_user_uid');
    if (storedRole && PRESET_USERS[storedRole]) {
      const preset = applyUidOverride({ ...PRESET_USERS[storedRole] }, storedUid, seedUsers);
      return { ...DEFAULT_MOCK_USER, ...preset, ai_searches_today: 0 };
    }
  } catch {
    // fall through to default
  }
  return { ...DEFAULT_MOCK_USER };
};

const daysFromNow = (d) => new Date(Date.now() + d * 86400000).toISOString();

const seed = {
  AdminPricingConfig: [
    { id: 'pc-1', isActive: true, trial_rate: 10, min_rate: 20, max_rate: 200, cancellation_hours: 24, platform_fee_pct: 10 },
  ],
  AISearchConfig: [
    { id: 'ai-1', isActive: true, daily_limit: 50, model: 'text-embedding-3-small' },
  ],
  Country: [
    { id: 'c-us', country_code: 'US', country_name: 'United States', phone_country_code: '+1', timezone: 'America/New_York' },
    { id: 'c-uk', country_code: 'GB', country_name: 'United Kingdom', phone_country_code: '+44', timezone: 'Europe/London' },
    { id: 'c-il', country_code: 'IL', country_name: 'Israel', phone_country_code: '+972', timezone: 'Asia/Jerusalem' },
    { id: 'c-de', country_code: 'DE', country_name: 'Germany', phone_country_code: '+49', timezone: 'Europe/Berlin' },
    { id: 'c-es', country_code: 'ES', country_name: 'Spain', phone_country_code: '+34', timezone: 'Europe/Madrid' },
    { id: 'c-ca', country_code: 'CA', country_name: 'Canada', phone_country_code: '+1', timezone: 'America/Toronto' },
    { id: 'c-in', country_code: 'IN', country_name: 'India', phone_country_code: '+91', timezone: 'Asia/Kolkata' },
    { id: 'c-ae', country_code: 'AE', country_name: 'United Arab Emirates', phone_country_code: '+971', timezone: 'Asia/Dubai' },
  ],
  SystemDesignConfig: [
    { id: 'sd-1', isActive: true, theme: 'default' },
  ],
  DesignOverride: [],
  User: [
    { id: 'demo-user', email: 'demo@local', full_name: 'Demo User', role: 'admin', country_code: 'US', created_date: daysFromNow(-90) },
    { id: 'u-sarah', email: 'sarah@example.com', full_name: 'Sarah Johnson', role: 'teacher', country_code: 'US', created_date: daysFromNow(-60) },
    { id: 'u-michael', email: 'michael@example.com', full_name: 'Michael Chen', role: 'teacher', country_code: 'US', created_date: daysFromNow(-45) },
    { id: 'u-emma', email: 'emma@example.com', full_name: 'Emma Rodriguez', role: 'teacher', country_code: 'GB', created_date: daysFromNow(-30) },
    { id: 'u-ahmed', email: 'ahmed@example.com', full_name: 'Ahmed Hassan', role: 'teacher', country_code: 'AE', created_date: daysFromNow(-20) },
    { id: 'u-student1', email: 'alex@example.com', full_name: 'Alex Kim', role: 'student', country_code: 'US', created_date: daysFromNow(-15) },
    { id: 'u-student2', email: 'maya@example.com', full_name: 'Maya Patel', role: 'student', country_code: 'IN', created_date: daysFromNow(-10) },
    { id: 'u-parent1', email: 'parent@example.com', full_name: 'David Goldberg', role: 'parent', country_code: 'IL', created_date: daysFromNow(-5) },
  ],
  TeacherProfile: [
    { id: 'tp-1', user_id: 'u-sarah', full_name: 'Sarah Johnson', subjects: ['Chemistry', 'Biology'], location: 'New York, USA', rating: 4.9, hourly_rate: 50, is_approved: true, search_keywords: ['chemistry', 'biology', 'science'] },
    { id: 'tp-2', user_id: 'u-michael', full_name: 'Michael Chen', subjects: ['Programming', 'Computer Science'], location: 'San Francisco, USA', rating: 4.8, hourly_rate: 75, is_approved: true, search_keywords: ['programming', 'python', 'javascript'] },
    { id: 'tp-3', user_id: 'u-emma', full_name: 'Emma Rodriguez', subjects: ['English', 'Literature'], location: 'London, UK', rating: 4.7, hourly_rate: 45, is_approved: true, search_keywords: ['english', 'literature', 'writing'] },
    { id: 'tp-4', user_id: 'u-ahmed', full_name: 'Ahmed Hassan', subjects: ['Mathematics', 'Physics'], location: 'Dubai, UAE', rating: 4.9, hourly_rate: 60, is_approved: true, search_keywords: ['math', 'physics', 'calculus'] },
    { id: 'tp-5', user_id: 'u-pending', full_name: 'Lisa Wang', subjects: ['Art', 'Design'], location: 'Toronto, Canada', rating: 0, hourly_rate: 40, is_approved: false, search_keywords: ['art', 'design'] },
  ],
  Booking: [
    { id: 'bk-1', teacher_id: 'u-sarah', student_id: 'u-student1', subject: 'Chemistry', status: 'confirmed', start_time: daysFromNow(1), end_time: daysFromNow(1.04), price: 50, created_date: daysFromNow(-5) },
    { id: 'bk-2', teacher_id: 'u-michael', student_id: 'u-student1', subject: 'Programming', status: 'confirmed', start_time: daysFromNow(2), end_time: daysFromNow(2.04), price: 75, created_date: daysFromNow(-4) },
    { id: 'bk-3', teacher_id: 'u-emma', student_id: 'u-student2', subject: 'English', status: 'pending', start_time: daysFromNow(3), end_time: daysFromNow(3.04), price: 45, created_date: daysFromNow(-2) },
    { id: 'bk-4', teacher_id: 'u-ahmed', student_id: 'u-student2', subject: 'Mathematics', status: 'completed', start_time: daysFromNow(-7), end_time: daysFromNow(-6.96), price: 60, created_date: daysFromNow(-10) },
    { id: 'bk-5', teacher_id: 'u-sarah', student_id: 'u-student2', subject: 'Biology', status: 'completed', start_time: daysFromNow(-14), end_time: daysFromNow(-13.96), price: 50, created_date: daysFromNow(-20) },
    { id: 'bk-6', teacher_id: 'u-michael', student_id: 'u-student1', subject: 'Programming', status: 'cancelled', start_time: daysFromNow(-3), end_time: daysFromNow(-2.96), price: 75, created_date: daysFromNow(-10) },
  ],
  Availability: [
    { id: 'av-1', teacher_id: 'u-sarah', day_of_week: 1, start_time: '09:00', end_time: '17:00' },
    { id: 'av-2', teacher_id: 'u-sarah', day_of_week: 3, start_time: '09:00', end_time: '17:00' },
    { id: 'av-3', teacher_id: 'u-michael', day_of_week: 2, start_time: '10:00', end_time: '18:00' },
    { id: 'av-4', teacher_id: 'u-emma', day_of_week: 4, start_time: '14:00', end_time: '20:00' },
  ],
  Review: [
    { id: 'rv-1', teacher_id: 'u-sarah', student_id: 'u-student2', rating: 5, comment: 'Excellent chemistry teacher, very clear explanations.', created_date: daysFromNow(-12) },
    { id: 'rv-2', teacher_id: 'u-ahmed', student_id: 'u-student2', rating: 5, comment: 'Helped me pass my calculus exam!', created_date: daysFromNow(-5) },
    { id: 'rv-3', teacher_id: 'u-michael', student_id: 'u-student1', rating: 4, comment: 'Great programming sessions, really knowledgeable.', created_date: daysFromNow(-30) },
  ],
  StudentRequest: [
    { id: 'sr-1', student_id: 'u-student1', subject: 'Chemistry', level: 'High School', description: 'Need help with organic chemistry', budget: 40, status: 'open', created_date: daysFromNow(-3) },
    { id: 'sr-2', student_id: 'u-student2', subject: 'English', level: 'University', description: 'IELTS preparation', budget: 50, status: 'open', created_date: daysFromNow(-1) },
  ],
  PendingData: [
    { id: 'pd-1', status: 'pending', data_type: 'teacher_profile', teacher_id: 'u-pending', submission: { full_name: 'Lisa Wang', subjects: ['Art', 'Design'] }, created_date: daysFromNow(-3) },
    { id: 'pd-2', status: 'pending', data_type: 'subject_request', submission: { name: 'Quantum Computing' }, created_date: daysFromNow(-1) },
  ],
  PendingCity: [
    { id: 'pc-city-1', status: 'pending', city_name: 'Tel Aviv', country_name: 'Israel', created_date: daysFromNow(-2) },
    { id: 'pc-city-2', status: 'pending', city_name: 'Krakow', country_name: 'Poland', created_date: daysFromNow(-1) },
  ],
  SearchQuery: [
    { id: 'sq-1', query: 'chemistry tutor nyc', user_id: 'u-student1', result_count: 3, created_date: daysFromNow(-1) },
    { id: 'sq-2', query: 'python programming online', user_id: 'u-student2', result_count: 5, created_date: daysFromNow(-2) },
    { id: 'sq-3', query: 'IELTS preparation', user_id: 'u-student2', result_count: 4, created_date: daysFromNow(-1) },
    { id: 'sq-4', query: 'math tutor for high school', user_id: 'u-student1', result_count: 8, created_date: daysFromNow(-3) },
  ],
  AdminImpersonationLog: [
    { id: 'ail-1', admin_id: 'demo-user', target_user_id: 'u-student1', action: 'view_dashboard', created_date: daysFromNow(-1) },
  ],
  AdminAction: [
    { id: 'aa-1', admin_id: 'demo-user', action: 'approve_teacher', target_id: 'u-sarah', created_date: daysFromNow(-60) },
    { id: 'aa-2', admin_id: 'demo-user', action: 'approve_teacher', target_id: 'u-michael', created_date: daysFromNow(-45) },
  ],
  TeacherApplication: [],
  TeacherVerification: [],
  TeacherInvite: [],
  TeacherSearchLog: [],
  TeacherEmbedding: [],
  Session: [],
};

const MOCK_USER = resolveMockUser(seed.User);

const store = Object.create(null);

const clone = (v) => (v == null ? v : JSON.parse(JSON.stringify(v)));
const genId = () => `m-${Math.random().toString(36).slice(2, 10)}`;
const nowIso = () => new Date().toISOString();
const matches = (row, where) => Object.entries(where || {}).every(([k, v]) => row[k] === v);

const getArr = (name) => {
  if (!store[name]) store[name] = (seed[name] || []).map(clone);
  return store[name];
};

const makeEntity = (name) => ({
  list: async () => clone(getArr(name)),
  filter: async (where) => clone(getArr(name).filter((r) => matches(r, where))),
  get: async (id) => clone(getArr(name).find((r) => r.id === id) || null),
  create: async (row) => {
    const created = { id: genId(), created_date: nowIso(), updated_date: nowIso(), ...row };
    getArr(name).push(created);
    return clone(created);
  },
  update: async (id, patch) => {
    const arr = getArr(name);
    const i = arr.findIndex((r) => r.id === id);
    if (i === -1) return null;
    arr[i] = { ...arr[i], ...patch, updated_date: nowIso() };
    return clone(arr[i]);
  },
  delete: async (id) => {
    const arr = getArr(name);
    const i = arr.findIndex((r) => r.id === id);
    if (i === -1) return null;
    const [removed] = arr.splice(i, 1);
    return clone(removed);
  },
});

const entities = new Proxy({}, {
  get: (_, name) => {
    if (typeof name !== 'string' || name === 'then') return undefined;
    return makeEntity(name);
  },
});

const integrationsCore = new Proxy({}, {
  get: () => async () => ({ ok: true }),
});

const userEntity = makeEntity('User');

export const base44 = {
  entities,
  auth: {
    me: () => Promise.resolve(clone(MOCK_USER)),
    login: () => Promise.resolve(clone(MOCK_USER)),
    logout: () => Promise.resolve(),
    updateMyUserData: (patch) => {
      Object.assign(MOCK_USER, patch);
      return Promise.resolve(clone(MOCK_USER));
    },
    list: userEntity.list,
    filter: userEntity.filter,
    get: userEntity.get,
    create: userEntity.create,
    update: userEntity.update,
    delete: userEntity.delete,
  },
  integrations: { Core: integrationsCore },
};
