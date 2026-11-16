const API = 'https://make.fun/api';
const cache = new Map();
const pending = new Map();
export function clearCache() { cache.clear(); }

// Reuse answers and in-flight requests. Minute-bound ETags are only useful within a minute.
export async function get(path) {
  const old = cache.get(path);
  if (old && Date.now() - old.at < 45000) return old.data;
  if (pending.has(path)) return pending.get(path);
  const request = (async () => {
    const headers = { Accept: 'application/json' };
    if (old?.etag) headers['If-None-Match'] = old.etag;
    const response = await fetch(API + path, { headers, credentials: 'omit', signal: AbortSignal.timeout(20000) });
    if (response.status === 304 && old) { old.at = Date.now(); return old.data; }
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(response.status === 404 ? 'This page could not be found.' : response.status === 429 ? 'Too many requests. Please try again in a minute.' : data.detail || 'make.fun is taking a moment. Please try again.');
    }
    const data = await response.json();
    cache.set(path, { data, etag: response.headers.get('etag'), at: Date.now() });
    return data;
  })();
  pending.set(path, request);
  try { return await request; } finally { pending.delete(path); }
}
export const getBounties = () => get('/competitions?activity=times');
export const getBounty = slug => get(`/competitions/${encodeURIComponent(slug)}?submissions=summary`);
export const getLeaderboard = (slug, phase = '', view = '') => get(`/competitions/${encodeURIComponent(slug)}/leaderboard?rows=first&ties=runs${phase ? `&phase=${encodeURIComponent(phase)}` : ''}${view ? `&view=${encodeURIComponent(view)}` : ''}`);
export const getProfile = handle => get(`/profiles/${encodeURIComponent(handle)}`);
