// Design-preview stub. Replaces the live Base44 SDK so the UI renders without a
// backend. User.me() returns a mock admin; every entity call resolves to [].
// Swap back to the real createClient() once the backend (Supabase per plan) is live.

const MOCK_USER = {
  id: 'demo-user',
  email: 'demo@local',
  full_name: 'Demo User',
  role: 'admin',
};

const entityMethods = new Proxy({}, {
  get: (_, prop) => {
    if (prop === 'then') return undefined;
    return () => Promise.resolve([]);
  },
});

const entities = new Proxy({}, { get: () => entityMethods });

const integrationsCore = new Proxy({}, {
  get: () => async () => ({ ok: true }),
});

export const base44 = {
  entities,
  auth: {
    me: () => Promise.resolve(MOCK_USER),
    login: () => Promise.resolve(MOCK_USER),
    logout: () => Promise.resolve(),
  },
  integrations: { Core: integrationsCore },
};
