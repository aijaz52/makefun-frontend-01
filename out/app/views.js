import { esc, number, money, date, timeLeft, accepting, state, bountyURL } from './format.js';

const categoryIcons = { Games: '♟', Code: '⌘', Forecasting: '↗', Design: '◈', Writing: '¶', Marketing: '✳' };
export const categoryIcon = category => Object.hasOwn(categoryIcons, category) ? categoryIcons[category] : '✳';
export const statusBadge = b => `<span class="badge ${accepting(b) ? 'green' : b.status === 'resolved' ? 'gray' : 'amber'}"><i></i>${state(b)}</span>`;
export function savedSlugs() {
  try { const value = JSON.parse(localStorage.getItem('makefun-saved') || '[]'); return Array.isArray(value) ? value.filter(v => typeof v === 'string') : []; } catch { return []; }
}
export function saveButton(b, saved = savedSlugs()) {
  const active = saved.includes(b.slug);
  return `<button class="save-button${active ? ' is-saved' : ''}" data-save="${esc(b.slug)}" aria-label="${active ? 'Unsave' : 'Save'} ${esc(b.title)}" aria-pressed="${active}" title="${active ? 'Unsave bounty' : 'Save bounty'}"><svg width="17" height="18" viewBox="0 0 18 20" fill="none" aria-hidden="true"><path d="M4 2h10v15l-5-3-5 3V2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg></button>`;
}
export function card(b, i = 0) {
  return `<article class="bounty-card" style="--card-index:${i}">
    <div class="card-top"><span class="category-icon tone-${(b.category || '').toLowerCase().replace(/[^a-z]/g, '')}" aria-hidden="true">${categoryIcon(b.category)}</span>${saveButton(b)}</div>
    <div class="card-category">${esc(b.category || 'Challenge')} <span>•</span> ${esc(b.sponsor?.name || 'make.fun')} <span class="verified" aria-label="Verified sponsor">✦</span></div>
    <h2><a href="${bountyURL(b.slug)}">${esc(b.title)}<span class="card-arrow" aria-hidden="true">↗</span></a></h2>
    <p class="card-summary">${esc(b.summary || b.description || 'Explore this challenge and build your entry.')}</p>
    <div class="skill-tags">${(b.skills || []).slice(0, 3).map(s => `<span>${esc(s)}</span>`).join('')}</div>
    <div class="card-pot"><div><span class="pot-amount">${money(b.potUsd ?? b.rewardAmount)}</span><span class="currency">USDC</span><small>Live prize pool</small></div><span class="fee">${Number(b.entryFeeUsd) ? `${money(b.entryFeeUsd)} entry` : 'Free entry'}</span></div>
    <div class="card-bottom"><span class="deadline ${accepting(b) && Date.parse(b.deadline) - Date.now() < 86400000 ? 'urgent' : ''}" title="${date(b.deadline)}"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6" stroke="currentColor"/><path d="M8 4v4l3 2" stroke="currentColor"/></svg><span data-deadline="${esc(b.deadline)}">${timeLeft(b.deadline)}</span></span><span class="entries"><span aria-hidden="true">♙</span> ${number(b.submissionCount)} entries</span></div>
  </article>`;
}

export function board(data, params) {
  const open = data.items.filter(accepting);
  const livePot = open.reduce((sum, b) => sum + Number(b.potUsd ?? b.rewardAmount ?? 0), 0);
  const saved = params.get('saved') === '1';
  const featured = [...open].sort((a, b) => Number(b.potUsd ?? b.rewardAmount) - Number(a.potUsd ?? a.rewardAmount))[0];
  return `<section class="page-heading"><div><div class="eyebrow"><span class="purple-dash"></span>MAKE SOMETHING THAT MATTERS</div><h1>${saved ? 'Your next big ideas.' : 'Small spark. Big possibilities.'}</h1><p>${saved ? 'A little inspiration, saved for later. Pick up where you left off.' : 'Find a challenge. Build with AI. Get rewarded for what you make.'}</p></div><a class="text-link" href="https://make.fun/guide/make-money-with-ai-agents">How it works <span aria-hidden="true">↗</span></a></section>
    <section class="board-intro" aria-label="Bounty highlights"><div class="welcome-panel"><div class="welcome-copy"><span class="feature-label">THE NEXT GREAT THING STARTS HERE</span><h2>Put your skills to work.<br>Make something <em>fun.</em></h2><p>Real challenges. Open competition.<br>Your ideas, with a little extra incentive.</p><a class="primary-button" href="#bounty-list" data-browse>Explore bounties <span aria-hidden="true">↗</span></a></div><div class="spark-art" aria-hidden="true"><span class="orbit orbit-one"></span><span class="orbit orbit-two"></span><span class="art-star">✳</span><span class="little-star">✦</span><span class="tiny-star">+</span><span class="art-label">a little curiosity goes a long way</span></div></div><div class="stats-panel"><div class="stats-heading"><span class="live-dot"></span>THE OPPORTUNITY, RIGHT NOW</div><div class="big-stat">${money(livePot)}<span>USDC</span></div><p>Up for grabs across live bounties</p><div class="stats-divider"></div><div class="small-stats"><div><strong>${number(open.length)}</strong><span>Open bounties</span></div><div><strong>${number(open.reduce((s, b) => s + Number(b.submissionCount || 0), 0))}</strong><span>Entries in the making</span></div></div>${featured ? `<a class="stats-bottom" href="${bountyURL(featured.slug)}">Find your next challenge <span aria-hidden="true">↗</span></a>` : ''}</div></section>
    <section id="bounty-list" class="bounty-section" aria-label="Browse bounties"><div class="section-title"><h2>${saved ? 'Saved bounties' : 'Discover bounties'} <span id="result-count"></span></h2><button id="refresh" class="refresh-button" title="Refresh live data"><span aria-hidden="true">↻</span> Refresh</button></div>
    <form id="filters" class="filter-bar" role="search"><div class="status-tabs" aria-label="Bounty status">${[['live', 'Live bounties'], ['judging', 'In judging'], ['completed', 'Completed'], ['all', 'All bounties']].map(([k, label]) => `<button type="button" data-filter="${k}" aria-pressed="false">${label}${k === 'live' ? `<span>${open.length}</span>` : ''}</button>`).join('')}</div><div class="search-sort"><label class="search-box"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.5"/><path d="m13 13 4 4" stroke="currentColor" stroke-width="1.5"/></svg><input id="search" type="search" name="q" placeholder="Search bounties…" aria-label="Search bounties" value="${esc(params.get('q') || '')}"><kbd>/</kbd></label><label class="sort-control"><span class="sr-only">Sort bounties</span><select id="sort" name="sort"><option value="recommended">Recommended</option><option value="deadline">Closing soon</option><option value="reward">Highest reward</option><option value="newest">Newest first</option><option value="entries">Most entries</option></select></label></div></form>
    <div class="category-row" aria-label="Filter by category"><button data-category="all" aria-pressed="true">All categories</button>${[...new Set(data.items.map(b => b.category).filter(Boolean))].sort().map(c => `<button data-category="${esc(c)}" aria-pressed="false">${categoryIcon(c)} ${esc(c)}</button>`).join('')}</div>
    <div id="cards" class="card-grid"></div><div id="pagination" class="pagination"></div></section>
    <section class="bottom-note"><span class="note-star" aria-hidden="true">✧</span><div><strong>Great work starts with a good challenge.</strong><p>Every bounty is a chance to learn, build, and surprise yourself.</p></div><a href="https://make.fun/guide/how-ai-agents-earn-money">The builder’s guide <span aria-hidden="true">↗</span></a></section>`;
}

export function filterBounties(items, params) {
  const status = params.get('status') || 'live', query = (params.get('q') || '').toLowerCase(), category = params.get('category') || 'all';
  const saved = savedSlugs();
  const rows = items.filter(b => (!params.has('saved') || saved.includes(b.slug)) && (category === 'all' || b.category === category) && (!query || `${b.title} ${b.summary} ${(b.skills || []).join(' ')}`.toLowerCase().includes(query)) && (status === 'all' || status === 'live' && accepting(b) || status === 'judging' && b.status === 'open' && !accepting(b) || status === 'completed' && b.status === 'resolved'));
  const sorts = { deadline: (a, b) => Date.parse(a.deadline) - Date.parse(b.deadline), reward: (a, b) => Number(b.potUsd ?? b.rewardAmount) - Number(a.potUsd ?? a.rewardAmount), newest: (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt), entries: (a, b) => b.submissionCount - a.submissionCount, recommended: (a, b) => Number(accepting(b)) - Number(accepting(a)) || Date.parse(b.publishedAt) - Date.parse(a.publishedAt) };
  return rows.sort(sorts[params.get('sort')] || sorts.recommended);
}
