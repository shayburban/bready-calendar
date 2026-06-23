// HTTP helpers for Vercel functions (Web Request/Response signature).

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

export function error(message, status = 400, extra = {}) {
  return json({ error: message, ...extra }, status);
}

// Vercel cron sends `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is set.
// Reject anything else so the endpoint can't be invoked by the public.
export function isAuthorizedCron(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

// Parse a JSON body, tolerating empty bodies.
export async function readJson(request) {
  try {
    const text = await request.text();
    return text ? JSON.parse(text) : {};
  } catch {
    return null;
  }
}

// The Supabase access token a browser client puts in the Authorization header.
export function bearerToken(request) {
  const h = request.headers.get('authorization') || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}
