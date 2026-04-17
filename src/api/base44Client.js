// Design-preview stub. Replaces the live Base44 SDK with an in-memory store so
// the UI runs end-to-end without a backend. Layout.jsx seeds AppRole on first
// load; other pages can create/read/update like a real DB.

const MOCK_USER = {
  id: 'demo-user',
  email: 'demo@local',
  full_name: 'Demo User',
  role: 'admin',
  ai_searches_today: 0,
};

const seed = {
  AdminPricingConfig: [
    { id: 'pc-1', isActive: true, trial_rate: 10, min_rate: 20, max_rate: 200, cancellation_hours: 24, platform_fee_pct: 10 },
  ],
  Country: [
    { id: 'c-us', country_code: 'US', country_name: 'United States', phone_country_code: '+1', timezone: 'America/New_York' },
    { id: 'c-uk', country_code: 'GB', country_name: 'United Kingdom', phone_country_code: '+44', timezone: 'Europe/London' },
    { id: 'c-il', country_code: 'IL', country_name: 'Israel', phone_country_code: '+972', timezone: 'Asia/Jerusalem' },
    { id: 'c-de', country_code: 'DE', country_name: 'Germany', phone_country_code: '+49', timezone: 'Europe/Berlin' },
    { id: 'c-es', country_code: 'ES', country_name: 'Spain', phone_country_code: '+34', timezone: 'Europe/Madrid' },
  ],
  SystemDesignConfig: [
    { id: 'sd-1', isActive: true, theme: 'default' },
  ],
};

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
  },
  integrations: { Core: integrationsCore },
};
