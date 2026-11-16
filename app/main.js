import { getBounties, clearCache } from './api.js';
import { board, card, filterBounties, savedSlugs } from './views.js';
import { esc, number, timeLeft, pageNumber } from './format.js';

const app = document.getElementById('app');
const announcement = document.getElementById('announcement');
let generation = 0, boardData, params, routePath, searchTimer;
window.__shotReady = false;

function readRoute() {
  const [path, query = ''] = (location.hash.slice(1) || '/').split('?');
  return { path, params: new URLSearchParams(query) };
}
async function setParam(key, value, rerender = true) {
  if (value && !(key === 'category' && value === 'all') && value !== 'recommended') params.set(key, value); else params.delete(key);
  if (key !== 'page') params.delete('page');
  const query = params.toString();
  history.replaceState(null, '', `#${routePath}${query ? '?' + query : ''}`);
  if (rerender) await render(false); else updateCards();
}
function updateCards() {
  if (!boardData || !document.getElementById('cards')) return;
  const rows = filterBounties(boardData.items, params);
  const pageCount = Math.max(1, Math.ceil(rows.length / 9));
  const page = Math.min(pageCount, pageNumber(params.get('page')));
  document.getElementById('cards').innerHTML = rows.slice((page - 1) * 9, page * 9).map(card).join('') || `<div class="empty-state"><span aria-hidden="true">✧</span><h3>${params.has('saved') ? 'A little inspiration belongs here.' : 'No bounties found'}</h3><p>${params.has('saved') ? 'Save a bounty using its bookmark button, then find it here.' : 'Try another search, category, or status.'}</p><button class="secondary-button" id="reset-filters">${params.has('saved') ? 'Explore all bounties' : 'Clear filters'}</button></div>`;
  document.getElementById('result-count').textContent = number(rows.length);
  document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', b.dataset.filter === (params.get('status') || 'live')));
  document.querySelectorAll('[data-category]').forEach(b => b.setAttribute('aria-pressed', b.dataset.category === (params.get('category') || 'all')));
  document.getElementById('sort').value = params.get('sort') || 'recommended';
  document.getElementById('pagination').innerHTML = `<span>Showing ${rows.length ? (page - 1) * 9 + 1 : 0}–${Math.min(page * 9, rows.length)} of ${number(rows.length)} bounties</span>${pageCount > 1 ? `<div class="pager"><button data-page="${page - 1}" ${page === 1 ? 'disabled' : ''} aria-label="Previous page">←</button><span>Page ${page} of ${pageCount}</span><button data-page="${page + 1}" ${page === pageCount ? 'disabled' : ''} aria-label="Next page">→</button></div>` : '<span>Something great is waiting to be made <span class="purple" aria-hidden="true">✳</span></span>'}`;
  announcement.textContent = `${rows.length} bounties found`;
}
async function render(navigate = true) {
  const token = ++generation;
  const route = readRoute(); params = route.params; routePath = route.path;
  window.__shotReady = false;
  document.getElementById('content').setAttribute('aria-busy', 'true');
  if (navigate || routePath !== '/') app.innerHTML = '<p class="loading" role="status">Loading fresh possibilities…</p>';
  document.querySelectorAll('[data-nav]').forEach(a => {
    const active = a.dataset.nav === (routePath === '/' ? params.has('saved') ? 'saved' : 'board' : /^\/(profile|builder)(\/|s$)/.test(routePath) ? 'builders' : 'board');
    if (active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  try {
    let result;
    if (routePath === '/') {
      const data = await getBounties();
      if (token !== generation) return;
      boardData = data;
      result = { title: params.has('saved') ? 'Saved bounties' : 'Bounty board', crumb: params.has('saved') ? 'Saved bounties' : 'Bounty board', html: board(data, params) };
    } else {
      const [detail] = await Promise.all([import('./details.js'), detailStyles()]);
      const match = /^\/bounty\/([^/]+)(?:\/(leaderboard|rules))?\/?$/.exec(routePath);
      const profile = /^\/(?:profile|builder)\/([^/]+)\/?$/.exec(routePath);
      if (match) result = match[2] === 'leaderboard' ? await detail.leaderboardPage(decodeURIComponent(match[1]), params) : await detail.bountyPage(decodeURIComponent(match[1]), match[2]);
      else if (profile) result = await detail.profilePage(decodeURIComponent(profile[1]), params);
      else if (routePath === '/builders') result = await detail.buildersPage();
      else throw new Error('This page could not be found.');
    }
    if (token !== generation) return;
    app.innerHTML = result.html;
    app.querySelectorAll('.table-scroll').forEach(table => { table.tabIndex = 0; table.setAttribute('role', 'region'); table.setAttribute('aria-label', 'Leaderboard table, scroll for more columns'); });
    document.title = `${result.title} · make.fun`;
    document.getElementById('crumb').textContent = result.crumb;
    if (routePath === '/') updateCards();
    announcement.textContent = `${result.crumb} loaded`;
    if (navigate) { window.scrollTo(0, 0); if (location.hash) document.getElementById('content').focus({ preventScroll: true }); }
    else if (document.activeElement === document.body && routePath !== '/') document.getElementById('content').focus({ preventScroll: true });
  } catch (error) {
    if (token !== generation) return;
    app.innerHTML = `<section class="panel error-state" role="alert"><span aria-hidden="true">☁</span><h1>A small pause in the possibilities.</h1><p>${esc(error.message)}</p><div class="button-row"><button class="primary-button" id="retry">Try again ↻</button><a href="#/" class="secondary-button">Back to bounties</a></div></section>`;
    document.title = 'Unable to load · make.fun';
  } finally {
    if (token === generation) { document.getElementById('content').removeAttribute('aria-busy'); window.__shotReady = true; }
  }
}

let stylesReady;
function detailStyles() {
  return stylesReady ||= new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = './details.css';
    link.addEventListener('load', resolve, { once: true });
    link.addEventListener('error', () => { link.remove(); stylesReady = null; reject(new Error('Page styles could not load. Please try again.')); }, { once: true });
    document.head.append(link);
  });
}

app.addEventListener('click', event => {
  const target = event.target.closest('button, a');
  if (!target) return;
  if (target.hasAttribute('data-browse')) { event.preventDefault(); document.getElementById('bounty-list').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }
  if (target.dataset.save) {
    const slug = target.dataset.save, saved = savedSlugs(), active = saved.includes(slug);
    try { localStorage.setItem('makefun-saved', JSON.stringify(active ? saved.filter(s => s !== slug) : [...saved, slug])); }
    catch { announcement.textContent = 'Your browser could not save this bounty. Enable local storage to use bookmarks.'; return; }
    target.classList.toggle('is-saved', !active); target.setAttribute('aria-pressed', String(!active));
    target.setAttribute('aria-label', target.getAttribute('aria-label').replace(/^(?:Unsave|Save)/, active ? 'Save' : 'Unsave'));
    announcement.textContent = active ? 'Bounty removed from saved' : 'Bounty saved';
    if (params.has('saved')) updateCards();
  }
  if (target.dataset.filter) setParam('status', target.dataset.filter, false);
  if (target.dataset.category) setParam('category', target.dataset.category, false);
  if (target.dataset.page) {
    setParam('page', target.dataset.page, routePath !== '/');
    if (routePath === '/') document.getElementById('bounty-list').scrollIntoView({ block: 'start' });
  }
  if (target.id === 'refresh' || target.id === 'retry') { clearCache(); render(false); }
  if (target.id === 'reset-filters') { history.replaceState(null, '', '#/'); render(false); }
});
app.addEventListener('input', event => {
  if (event.target.id === 'search') setParam('q', event.target.value, false);
  if (event.target.id === 'leaderboard-search') {
    const start = event.target.selectionStart;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(async () => { await setParam('q', event.target.value); const input = document.getElementById('leaderboard-search'); if (input) { input.focus(); try { input.setSelectionRange(start, start); } catch {} } }, 300);
  }
});
app.addEventListener('change', event => {
  if (event.target.id === 'sort') setParam('sort', event.target.value, false);
  if (event.target.id === 'leaderboard-phase') setParam('phase', event.target.value);
});
app.addEventListener('submit', event => {
  event.preventDefault();
  if (event.target.id === 'profile-search') { const handle = new FormData(event.target).get('handle').trim().replace(/^@/, ''); if (handle) location.hash = `/builder/${encodeURIComponent(handle)}`; }
});
document.addEventListener('keydown', event => {
  if (event.key === '/' && !event.metaKey && !event.ctrlKey && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) { const search = document.getElementById('search'); if (search) { event.preventDefault(); search.focus(); } }
});
document.querySelector('.skip').addEventListener('click', event => { event.preventDefault(); document.getElementById('content').focus(); });
window.addEventListener('hashchange', () => { clearTimeout(searchTimer); render(); });
setInterval(() => {
  if (document.hidden) return;
  document.querySelectorAll('[data-deadline]').forEach(node => { const value = timeLeft(node.dataset.deadline); if (node.textContent !== value) node.textContent = value; });
}, 30000);
setInterval(() => { if (!document.hidden && !document.activeElement.closest('input, select, button') && (routePath === '/' || routePath.startsWith('/bounty/'))) render(false); }, 90000);
render();
