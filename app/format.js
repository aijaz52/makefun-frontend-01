export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
export const number = value => Number(value || 0).toLocaleString('en-US');
export const pageNumber = value => Math.max(1, Math.floor(Number(value) || 1));
export const money = value => Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: Number.isInteger(Number(value)) ? 0 : 2, maximumFractionDigits: 2 });
export const date = iso => iso && Number.isFinite(Date.parse(iso)) ? `${new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })} UTC` : 'Not announced';
export const shortDate = iso => iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : 'Not announced';
export function timeLeft(iso) {
  const ms = Date.parse(iso) - Date.now();
  if (!Number.isFinite(ms)) return 'No deadline';
  if (ms <= 0) return 'Entries closed';
  const d = Math.floor(ms / 86400000), h = Math.floor(ms / 3600000) % 24, m = Math.floor(ms / 60000) % 60;
  return d ? `${d}d ${h}h left` : h ? `${h}h ${m}m left` : m ? `${m}m left` : 'Less than 1m left';
}
export const accepting = b => b.status === 'open' && Date.parse(b.deadline) > Date.now() && b.acceptingSubmissions !== false;
export const state = b => accepting(b) ? 'Accepting entries' : b.status === 'resolved' ? 'Completed' : b.status === 'open' ? 'In judging' : b.status === 'upcoming' ? 'Upcoming' : 'Entries closed';
export const bountyURL = slug => `#/bounty/${encodeURIComponent(slug)}`;
export const profileURL = handle => `#/builder/${encodeURIComponent(handle)}`;
export function imageURL(value) {
  if (!value) return '';
  try { const u = new URL(value, 'https://make.fun'); return ['https:', 'http:'].includes(u.protocol) ? esc(u.href) : ''; } catch { return ''; }
}
export function avatar(handle, image, large = false) {
  const src = imageURL(image);
  return `<span class="avatar${large ? ' avatar-large' : ''}">${src ? `<img crossorigin="anonymous" src="${src}" alt="" loading="lazy" width="${large ? 80 : 32}" height="${large ? 80 : 32}">` : esc((handle || '?').slice(0, 2).toUpperCase())}</span>`;
}
// A deliberately small Markdown reader: escaped first, no raw HTML or remotely loaded content.
export function markdown(text) {
  let inCode = false, inList = false;
  const inline = value => esc(value).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\[([^\]]+)\]\((https:\/\/make\.fun\/[^\s)]+)\)/g, '<a href="$2">$1 ↗</a>');
  const out = String(text || '').split('\n').map(line => {
    if (/^```/.test(line)) { const close = inList ? '</ul>' : ''; inList = false; inCode = !inCode; return close + (inCode ? '<pre><code>' : '</code></pre>'); }
    if (inCode) return esc(line) + '\n';
    const list = /^\s*[-*]\s+(.+)/.exec(line);
    if (list) { const start = inList ? '' : '<ul>'; inList = true; return `${start}<li>${inline(list[1])}</li>`; }
    const close = inList ? '</ul>' : ''; inList = false;
    const heading = /^(#{1,6})\s+(.+)/.exec(line);
    if (heading) return `${close}<h${Math.min(heading[1].length + 1, 4)}>${inline(heading[2])}</h${Math.min(heading[1].length + 1, 4)}>`;
    return close + (line.trim() ? `<p>${inline(line)}</p>` : '');
  }).join('');
  return out + (inList ? '</ul>' : '') + (inCode ? '</code></pre>' : '');
}
