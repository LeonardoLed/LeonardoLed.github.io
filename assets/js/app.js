(() => {
'use strict';

const DATA = window.CVLEO_DATA || {};
const publications = DATA.publications || [];
const experience = DATA.experience || { professional: [], academic: [], research: [] };
const events = DATA.events || [];
const awards = DATA.awards || [];
const testimonials = DATA.testimonials || [];
const projects = DATA.projects || { featured: [], previous: [] };
const peerReviews = DATA.peerReviews || { published: [], active: [] };
const courses = DATA.courses || [];
const competitions = DATA.competitions || [];
const researchProjects = DATA.researchProjects || [];
const outreach = DATA.outreach || [];

const state = { page: 1, perPage: 4, search: '', type: 'all', year: 'all', featured: 'all', indexed: 'all' };
const moreState = { professional: false, academic: false, research: false, events: false, awards: false };
let testimonialIndex = 0;
const PAGE_SIZE = 3;
let researchProjectPage = 1;
const reviewPage = { published: 1, review: 1, rejected: 1 };
let reviewTab = null;
const courseSeriesState = { offerings: true, students: true };
const courseTableState = { search: '', year: 'all', program: 'all', sortKey: 'year', sortDirection: 'desc', page: 1, perPage: 5 };

const $ = (id) => document.getElementById(id);

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
}

// "A · B · C" strings in the data files become "A, B, C".
function commaList(s) {
  return String(s ?? '').split('·').map((x) => x.trim()).filter(Boolean).join(', ');
}

// "2021-2026" and "2026-Present" use an en dash.
function dash(s) {
  return String(s ?? '').replace(/\s*[-–]\s*/g, '–');
}

function sentenceCase(s) {
  const t = String(s ?? '');
  return t.charAt(0) + t.slice(1).toLowerCase();
}

/* ---------- Publications ---------- */

function sortedPublications(items) {
  return [...items].sort((a, b) => (b.year - a.year) || Number(b.featured) - Number(a.featured) || a.title.localeCompare(b.title));
}

function authorName(a) {
  return a.includes('Ledesma') ? `<span class="me">${escapeHtml(a)}</span>` : escapeHtml(a);
}

function authorLine(authors = []) {
  const visible = authors.slice(0, 3).map(authorName).join('; ');
  if (authors.length <= 3) return visible;
  const hidden = authors.slice(3).map(authorName).join('; ');
  const n = authors.length - 3;
  return `${visible}<span class="hidden extra-authors">; ${hidden}</span> <button type="button" class="text-button inline" data-more data-label="+${n} more">+${n} more</button>`;
}

function pubLinks(p) {
  return Object.entries(p.links || {})
    .filter(([, v]) => v && v !== '#')
    .map(([k, v]) => `<a href="${escapeHtml(v)}" target="_blank" rel="noopener">${escapeHtml(k)}</a>`)
    .join('');
}

function showMetrics(p) {
  return p.showMetrics !== false && p.indexed !== false;
}

function pubFacts(p) {
  const metrics = showMetrics(p);
  const parts = [];
  if (p.quartile) parts.push(`${p.quartile}${p.area ? ` (${p.area})` : ''}`);
  else if (p.area) parts.push(p.area);
  if (metrics && p.wos !== undefined && p.scopus !== undefined) parts.push(`Citations: ${p.wos} in Web of Science, ${p.scopus} in Scopus`);
  return parts.join('. ');
}

function pubCard(p) {
  const facts = pubFacts(p);
  const tags = (p.tags || []).map((t) => `<span>${escapeHtml(t)}</span>`).join('');
  return `<article class="row pub">
    <p class="date">${p.year}</p>
    <div>
      <p class="pub-type">${escapeHtml(sentenceCase(p.type))}<span class="badge ${showMetrics(p) ? 'indexed' : 'not-indexed'}">${showMetrics(p) ? 'Indexed' : 'Not indexed'}</span>${p.featured ? '<span class="badge featured">Featured</span>' : ''}</p>
      <h3>${escapeHtml(p.title)}</h3>
      <p class="venue">${escapeHtml(p.venue)}</p>
      <p class="authors">${authorLine(p.authors)}</p>
      ${(p.role || facts) ? `<p class="muted">${escapeHtml([p.role, facts].filter(Boolean).join('. '))}.</p>` : ''}
      ${tags ? `<p class="tags">${tags}</p>` : ''}
      <p class="entry-links">${pubLinks(p)}</p>
    </div>
  </article>`;
}

function filteredPublications() {
  return sortedPublications(publications.filter((p) => {
    const text = JSON.stringify(p).toLowerCase();
    const featuredOk = state.featured === 'all' || (state.featured === 'featured' && p.featured) || (state.featured === 'regular' && !p.featured);
    return (state.type === 'all' || p.type === state.type)
      && (state.year === 'all' || String(p.year) === state.year)
      && featuredOk
      && (state.indexed === 'all' || (state.indexed === 'yes') === showMetrics(p))
      && text.includes(state.search.toLowerCase());
  }));
}

// A gel: every lane is a year, every band is one publication.
// How far a band has "migrated" tells you its type.
const GEL_TYPES = [
  { type: 'Journal Article', label: 'Journal article', cls: 'journal', top: 62 },
  { type: 'Book Chapter', label: 'Book chapter', cls: 'book', top: 112 },
  { type: 'Conference Proceeding', label: 'Conference paper', cls: 'conference', top: 162 }
];
const GEL_STEP = 14;

function renderChart() {
  const el = $('publication-chart');
  if (!el) return;
  const years = [...new Set(publications.map((p) => p.year))].sort();
  const filtering = state.year !== 'all' || state.type !== 'all';

  const lanes = years.map((y) => {
    const bands = GEL_TYPES.map((t) => publications
      .filter((p) => p.year === y && p.type === t.type)
      .map((p, i) => {
        const on = (state.year === 'all' || String(y) === state.year) && (state.type === 'all' || t.type === state.type);
        return `<button type="button" class="gel-band ${t.cls}${filtering && !on ? ' dim' : ''}" data-chart-year="${y}" data-chart-type="${t.type}" style="top:${t.top + i * GEL_STEP}px" aria-label="${y}, ${t.label}: ${escapeHtml(p.title)}" title="${y}: ${escapeHtml(p.title)}"></button>`;
      }).join('')).join('');
    return `<div class="gel-lane">${bands}</div>`;
  }).join('');

  const ticks = GEL_TYPES.map((t) => `<span class="gel-tick" style="top:${t.top + 4}px">${t.label}</span>`).join('');
  const yearButtons = years.map((y) => `<button type="button" class="gel-year${state.year === String(y) ? ' on' : ''}" data-chart-year="${y}">${y}</button>`).join('');

  el.innerHTML = `<figure class="gel">
      <div class="gel-ladder" aria-hidden="true">${ticks}</div>
      <div class="gel-lanes">${lanes}</div>
      <div></div>
      <div class="gel-years">${yearButtons}</div>
    </figure>
    <p class="gel-help">Each band is one publication, and its height shows the type. Select a band or a year to filter the list.</p>`;
}

function renderTally() {
  const el = $('publication-tally');
  if (!el) return;
  const total = publications.length;
  const indexed = publications.filter(showMetrics).length;
  const types = GEL_TYPES.map((t) => ({ ...t, n: publications.filter((p) => p.type === t.type).length })).filter((t) => t.n);
  const strip = types.map((t) => `<i class="${t.cls}" style="flex:${t.n}"></i>`).join('');
  const typeButtons = types.map((t) => {
    const on = state.type === t.type;
    return `<button type="button" class="tally-item ${t.cls}${on ? ' on' : ''}" data-tally-type="${t.type}" aria-pressed="${on}"><i class="dot"></i><strong>${t.n}</strong> ${t.n === 1 ? t.label : t.label + 's'}</button>`;
  }).join('');
  const idx = (key, n, label) => `<button type="button" class="tally-item idx ${key}${state.indexed === key ? ' on' : ''}" data-tally-indexed="${key}" aria-pressed="${state.indexed === key}"><i class="dot"></i><strong>${n}</strong> ${label}</button>`;
  el.innerHTML = `<p class="lede"><strong>${total}</strong> publications, <strong>${indexed}</strong> of them indexed in Web of Science or Scopus.</p>
    <div class="tally-strip" aria-hidden="true">${strip}</div>
    <div class="tally-items">${typeButtons}</div>
    <div class="tally-items">${idx('yes', indexed, 'indexed')}${total - indexed ? idx('no', total - indexed, 'not indexed') : ''}</div>`;
}

function renderPublications() {
  const items = filteredPublications();
  const indexed = publications.filter(showMetrics).length;
  const count = $('publication-count');
  if (count) count.textContent = `Showing ${items.length} of ${publications.length} publications. ${indexed} are indexed.`;

  renderTally();
  renderChart();

  const list = $('all-publication-list');
  const pages = Math.max(1, Math.ceil(items.length / state.perPage));
  if (state.page > pages) state.page = pages;
  if (list) list.innerHTML = items.slice((state.page - 1) * state.perPage, state.page * state.perPage).map(pubCard).join('') || '<p class="muted">No publications match these filters.</p>';

  const pager = $('all-pager');
  if (pager) {
    pager.innerHTML = '';
    if (pages > 1) {
      for (let i = 1; i <= pages; i++) {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = i;
        b.className = i === state.page ? 'active' : '';
        b.setAttribute('aria-label', `Publications page ${i}`);
        if (i === state.page) b.setAttribute('aria-current', 'page');
        b.onclick = () => {
          state.page = i;
          renderPublications();
          $('publications')?.scrollIntoView({ behavior: 'smooth' });
        };
        pager.appendChild(b);
      }
    }
  }
}

function initPublicationFilters() {
  const yearSelect = $('publication-year');
  if (yearSelect) {
    [...new Set(publications.map((p) => p.year))].sort((a, b) => b - a).forEach((y) => {
      const option = document.createElement('option');
      option.value = String(y);
      option.textContent = y;
      yearSelect.appendChild(option);
    });
  }
  [['publication-search', 'input', 'search'], ['publication-type', 'change', 'type'], ['publication-year', 'change', 'year'], ['publication-featured', 'change', 'featured']].forEach(([id, evt, key]) => {
    $(id)?.addEventListener(evt, (e) => {
      state[key] = e.target.value;
      state.page = 1;
      renderPublications();
    });
  });
  $('publication-tally')?.addEventListener('click', (e) => {
    const typeBtn = e.target.closest('[data-tally-type]');
    const idxBtn = e.target.closest('[data-tally-indexed]');
    if (typeBtn) {
      const type = typeBtn.dataset.tallyType;
      state.type = state.type === type ? 'all' : type;
      if ($('publication-type')) $('publication-type').value = state.type;
    } else if (idxBtn) {
      const key = idxBtn.dataset.tallyIndexed;
      state.indexed = state.indexed === key ? 'all' : key;
    } else return;
    state.page = 1;
    renderPublications();
  });
  $('publication-chart')?.addEventListener('click', (e) => {
    const year = e.target.closest('[data-chart-year]')?.dataset.chartYear;
    const type = e.target.closest('[data-chart-type]')?.dataset.chartType;
    if (!year && !type) return;
    if (year) {
      state.year = state.year === year ? 'all' : year;
      if ($('publication-year')) $('publication-year').value = state.year;
    }
    if (type) {
      state.type = state.type === type ? 'all' : type;
      if ($('publication-type')) $('publication-type').value = state.type;
    }
    state.page = 1;
    renderPublications();
  });
}

/* ---------- Experience ---------- */

function orgFallback(name) {
  return escapeHtml((name || 'ORG').split(/\s|,/).filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase());
}

function parentOrgKey(raw) {
  const orgs = DATA.organizations || {};
  const key = String(raw || '').trim().toLowerCase();
  if (key && orgs[key]) return key;
  if (key.includes('tec') || key.includes('tecnológico') || key.includes('monterrey')) return 'tec';
  if (key.includes('iimas')) return 'iimas';
  if (key.includes('cellular physiology') || key.includes('ifc')) return 'ifc';
  if (key.includes('faculty of engineering') || key.includes('facultad de ingeniería') || key.includes('fi/')) return 'fi';
  if (key.includes('cpesgi')) return 'cpesgi';
  if (key.includes('dgei')) return 'dgei';
  if (key.includes('unam') || key.includes('unica') || key.includes('faculty') || key.includes('facultad')) return 'unam';
  return key || 'other';
}

function orgCardData(parentKey, sampleOrg) {
  const org = (DATA.organizations || {})[parentKey] || {};
  return { name: org.name || sampleOrg || parentKey, logo: org.logo || '' };
}

function parseRoleYears(period) {
  const text = String(period || '');
  const years = [...text.matchAll(/\d{4}|Present/g)].map((m) => m[0]);
  const numeric = years.filter((y) => y !== 'Present').map(Number);
  const start = numeric.length ? Math.min(...numeric) : new Date().getFullYear();
  const hasPresent = text.includes('Present');
  const end = hasPresent ? new Date().getFullYear() : Math.max(...numeric, start);
  return { start, end, hasPresent };
}

function experienceSummary(items) {
  const parsed = items.map((x) => parseRoleYears(x[0]));
  const start = Math.min(...parsed.map((p) => p.start));
  const hasPresent = parsed.some((p) => p.hasPresent);
  const end = Math.max(...parsed.map((p) => p.end));
  return `${items.length} role${items.length === 1 ? '' : 's'}, ${start}–${hasPresent ? 'Present' : end}`;
}

function renderExperience() {
  Object.entries(experience).forEach(([key, items]) => {
    const el = $(`${key}-list`);
    if (!el) return;
    // Arrays are ordered newest first, so two roles is the most recent work.
    const shown = moreState[key] ? items : items.slice(0, 2);
    const groups = [];
    shown.forEach((x) => {
      const parent = parentOrgKey(x[4] || x[2]);
      let g = groups.find((v) => v.parent === parent);
      if (!g) {
        const meta = orgCardData(parent, x[2]);
        g = { parent, name: meta.name, logo: meta.logo, items: [] };
        groups.push(g);
      }
      g.items.push(x);
    });

    el.innerHTML = groups.map((g) => `<article class="org">
      <header class="org-head">
        <span class="org-logo">${g.logo ? `<img src="${escapeHtml(g.logo)}" alt="" loading="lazy">` : orgFallback(g.name)}</span>
        <div><h4>${escapeHtml(g.name)}</h4>${g.items.length > 1 ? `<p class="muted">${experienceSummary(g.items)}</p>` : ''}</div>
      </header>
      <div class="rows">${g.items.map((x) => `<div class="row">
        <p class="date">${escapeHtml(dash(x[0]))}</p>
        <div><h5>${escapeHtml(x[1])}</h5><p>${escapeHtml(x[2].trim())}</p>${commaList(x[3]) ? `<p class="muted">${escapeHtml(commaList(x[3]))}</p>` : ''}</div>
      </div>`).join('')}</div>
    </article>`).join('');

    const btn = document.querySelector(`[data-show-more="${key}"]`);
    if (btn) {
      btn.hidden = items.length <= 2;
      btn.textContent = moreState[key] ? 'Show fewer roles' : `Show all ${items.length} roles`;
    }
  });
}

/* ---------- Events ---------- */

const FLAG_NAMES = { br: 'Brazil', mx: 'Mexico', fr: 'France', cu: 'Cuba', il: 'Israel', ca: 'Canada', gb: 'United Kingdom', ru: 'Russia', us: 'United States' };
function flagHtml(code) {
  return `<span class="flag-svg flag-${escapeHtml(code)}" role="img" aria-label="${escapeHtml(FLAG_NAMES[code] || code)}"></span>`;
}

function renderEvents() {
  const el = $('event-list');
  if (!el) return;
  el.innerHTML = events.map((e, i) => {
    const cut = e[2].lastIndexOf(' · ');
    const place = cut > -1 ? e[2].slice(0, cut) : e[2];
    const when = cut > -1 ? e[2].slice(cut + 3) : '';
    return `<article class="row${i > 2 && !moreState.events ? ' hidden' : ''}">
      <p class="date has-flag">${flagHtml(e[0])}${escapeHtml(when)}</p>
      <div><h3>${escapeHtml(e[1])}</h3><p>${escapeHtml(place)}</p><p class="muted">${escapeHtml(e[3])}</p></div>
    </article>`;
  }).join('');
  const btn = document.querySelector('[data-show-more="events"]');
  if (btn) {
    btn.hidden = events.length <= 3;
    btn.textContent = moreState.events ? 'Show fewer events' : `Show all ${events.length} events`;
  }
}

/* ---------- Awards ---------- */

function renderAwards() {
  const el = $('award-list');
  if (!el) return;
  const shown = moreState.awards ? awards : awards.slice(0, 4);
  el.innerHTML = shown.map((a) => `<article class="row">
    <p class="date">${escapeHtml(a[0])}</p>
    <div><h3>${escapeHtml(a[1])}</h3>${a[3] ? `<p>${escapeHtml(a[3])}</p>` : ''}<p class="muted">${escapeHtml(a[2])}</p></div>
  </article>`).join('');
  const btn = document.querySelector('[data-show-more="awards"]');
  if (btn) {
    btn.hidden = awards.length <= 4;
    btn.textContent = moreState.awards ? 'Show fewer awards' : `Show all ${awards.length} awards`;
  }
}

/* ---------- Small pager used by research projects and peer review ---------- */

function buildPager(el, page, pages, label, onChange) {
  if (!el) return;
  el.innerHTML = '';
  if (pages < 2) return;
  for (let i = 1; i <= pages; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = i;
    b.className = i === page ? 'active' : '';
    b.setAttribute('aria-label', `${label} page ${i}`);
    if (i === page) b.setAttribute('aria-current', 'page');
    b.onclick = () => onChange(i);
    el.appendChild(b);
  }
}

/* ---------- Competitions, outreach and research projects ---------- */

function renderCompetitions() {
  const el = $('competition-list');
  if (!el) return;
  el.innerHTML = competitions.map((c) => `<article class="row">
    <p class="date">${escapeHtml(dash(c[0]))}</p>
    <div><h3>${escapeHtml(c[1])}</h3><p>${escapeHtml(c[2])}</p>${c[3] ? `<p class="muted">${escapeHtml(c[3])}</p>` : ''}</div>
  </article>`).join('');
}

function renderOutreach() {
  const el = $('outreach-list');
  if (!el) return;
  el.innerHTML = outreach.map((o) => `<article class="row">
    <p class="date">${escapeHtml(o.date)}</p>
    <div>
      <h3>${o.url ? `<a href="${escapeHtml(o.url)}" target="_blank" rel="noopener">${escapeHtml(o.title)}</a>` : escapeHtml(o.title)}</h3>
      <p class="muted">${escapeHtml([o.outlet, o.type].filter(Boolean).join('. '))}.</p>
      ${o.note ? `<p>${escapeHtml(o.note)}</p>` : ''}
    </div>
  </article>`).join('');
}

function renderResearchProjects() {
  const section = $('research-projects');
  const link = $('nav-research-projects');
  if (!section || !researchProjects.length) return;
  section.hidden = false;
  if (link) link.hidden = false;
  const pages = Math.ceil(researchProjects.length / PAGE_SIZE);
  researchProjectPage = Math.min(researchProjectPage, pages);
  const start = (researchProjectPage - 1) * PAGE_SIZE;
  $('research-project-list').innerHTML = researchProjects.slice(start, start + PAGE_SIZE).map((r) => `<article class="row">
    <p class="date">${escapeHtml(dash(r.period || ''))}</p>
    <div><h3>${escapeHtml(r.title)}</h3>${r.role ? `<p>${escapeHtml(r.role)}</p>` : ''}${r.institution ? `<p class="muted">${escapeHtml(r.institution)}</p>` : ''}${r.details ? `<p class="muted">${escapeHtml(r.details)}</p>` : ''}</div>
  </article>`).join('');
  buildPager($('research-project-pager'), researchProjectPage, pages, 'Research projects', (i) => {
    researchProjectPage = i;
    renderResearchProjects();
  });
}

/* ---------- Projects ---------- */

function imageTag(src, fallback) {
  const onError = fallback ? ` onerror="this.onerror=null;this.src='${escapeHtml(fallback)}';"` : '';
  return `<img src="${escapeHtml(src)}" alt="" loading="lazy"${onError}>`;
}

function renderProjects() {
  const featuredEl = $('featured-project-list');
  const previousEl = $('previous-project-list');
  if (featuredEl) {
    featuredEl.innerHTML = (projects.featured || []).map((p) => `<article class="project">
      <div class="project-img">${imageTag(p.image, p.fallbackImage || '')}</div>
      <div>
        <h3>${escapeHtml(p.title)}</h3>
        ${p.subtitle ? `<p>${escapeHtml(p.subtitle)}</p>` : ''}
        ${p.status ? `<p class="muted">${escapeHtml(p.status)}</p>` : ''}
        <p class="muted">${escapeHtml(dash(p.period || ''))}</p>
        ${(p.keywords || []).length ? `<p class="tags">${p.keywords.slice(0, 4).map((k) => `<span>${escapeHtml(k)}</span>`).join('')}</p>` : ''}
        ${p.url ? `<p class="entry-links"><a href="${escapeHtml(p.url)}" target="_blank" rel="noopener">${escapeHtml(p.linkLabel || 'View project')}</a></p>` : ''}
      </div>
    </article>`).join('');
  }
  if (previousEl) {
    previousEl.innerHTML = (projects.previous || []).map((p) => `<article class="row project-small">
      <div class="project-img">${imageTag(p.image, p.fallbackImage || '')}</div>
      <div>
        <h3>${p.url ? `<a href="${escapeHtml(p.url)}" target="_blank" rel="noopener">${escapeHtml(p.title)}</a>` : escapeHtml(p.title)}</h3>
        ${p.description ? `<p class="muted">${escapeHtml(p.description)}</p>` : ''}
      </div>
    </article>`).join('');
  }
}

/* ---------- Peer review ---------- */

const REVIEW_LABELS = { published: 'Published', review: 'In review', rejected: 'Rejected' };

function peerReviewCard(item, kind) {
  const detail = [item.publisher, item.section ? `${item.section} section` : '', item.role || 'Peer reviewer'].filter(Boolean).join('. ');
  const when = item.date || item.year;
  let body = '';
  if (kind === 'published') {
    if (item.title) body += `<p class="review-title">${escapeHtml(item.title)}</p>`;
    const links = [];
    if (item.articleUrl) links.push(`<a href="${escapeHtml(item.articleUrl)}" target="_blank" rel="noopener">View the article</a>`);
    if (item.certificateUrl && item.certificateUrl !== '#') links.push(`<a href="${escapeHtml(item.certificateUrl)}" target="_blank" rel="noopener">Review recognition</a>`);
    if (links.length) body += `<p class="entry-links">${links.join('')}</p>`;
  } else {
    body += `<p class="review-title muted">Manuscript title confidential</p>`;
    if (item.note) body += `<p class="muted">${escapeHtml(item.note)}.</p>`;
  }
  return `<article class="review-card ${kind}">
    <p class="review-status"><span class="pill">${REVIEW_LABELS[kind]}</span><span class="date">${escapeHtml(when)}</span></p>
    <h3>${escapeHtml(item.journal)}</h3>
    <p class="muted">${escapeHtml(detail)}.</p>
    ${body}
    ${item.logo ? `<img class="review-mark" src="${escapeHtml(item.logo)}" alt="${escapeHtml(item.publisher)} logo" loading="lazy">` : ''}
  </article>`;
}

function renderReviewPanel(kind) {
  const items = { published: peerReviews.published, review: peerReviews.active, rejected: peerReviews.rejected }[kind] || [];
  const grid = $('review-grid');
  if (!grid) return;
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  reviewPage[kind] = Math.min(reviewPage[kind], pages);
  const start = (reviewPage[kind] - 1) * PAGE_SIZE;
  grid.innerHTML = items.slice(start, start + PAGE_SIZE).map((item) => peerReviewCard(item, kind)).join('');
  buildPager($('review-pager'), reviewPage[kind], pages, `${REVIEW_LABELS[kind]} reviews`, (i) => {
    reviewPage[kind] = i;
    renderReviewPanel(kind);
  });
}

function renderPeerReviews() {
  const published = peerReviews.published || [];
  const active = peerReviews.active || [];
  const rejected = peerReviews.rejected || [];
  const container = $('peer-review-groups');
  if (container) {
    const groups = [['published', published], ['review', active], ['rejected', rejected]].filter(([, items]) => items.length);
    if (!groups.some(([kind]) => kind === reviewTab)) reviewTab = groups[0] ? groups[0][0] : null;
    if (reviewTab) {
      container.innerHTML = `<div class="tabs" role="tablist" aria-label="Review status">${groups.map(([kind, items]) => `<button type="button" role="tab" class="tab ${kind}${kind === reviewTab ? ' on' : ''}" id="tab-${kind}" data-review-tab="${kind}" aria-selected="${kind === reviewTab}" aria-controls="review-panel" tabindex="${kind === reviewTab ? 0 : -1}"><i class="dot ${kind}"></i>${REVIEW_LABELS[kind]} <span>${items.length}</span></button>`).join('')}</div>
        <div id="review-panel" role="tabpanel" aria-labelledby="tab-${reviewTab}"><div class="review-grid" id="review-grid"></div><div class="pager" id="review-pager"></div></div>`;
      renderReviewPanel(reviewTab);
      const tabs = [...container.querySelectorAll('[data-review-tab]')];
      const select = (kind) => { reviewTab = kind; renderPeerReviews(); $(`tab-${kind}`)?.focus(); };
      tabs.forEach((t, i) => {
        t.addEventListener('click', () => select(t.dataset.reviewTab));
        t.addEventListener('keydown', (e) => {
          if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
          e.preventDefault();
          const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
          select(next.dataset.reviewTab);
        });
      });
    }
  }
  const publishers = new Set([...published, ...active, ...rejected].map((p) => p.publisher).filter(Boolean));
  const set = (id, n) => { if ($(id)) $(id).textContent = String(n); };
  set('peer-published-count', published.length);
  set('peer-active-count', active.length);
  set('peer-rejected-count', rejected.length);
  set('peer-publisher-count', publishers.size);
}

/* ---------- Courses ---------- */

function courseFilteredRows() {
  const query = courseTableState.search.trim().toLowerCase();
  return courses.filter((c) => {
    const matchesSearch = !query || [c.course, c.program, c.university, c.entity, c.level, c.semester, c.year, c.students].some((v) => String(v ?? '').toLowerCase().includes(query));
    const matchesYear = courseTableState.year === 'all' || String(c.year) === courseTableState.year;
    const matchesProgram = courseTableState.program === 'all' || String(c.program) === courseTableState.program;
    return matchesSearch && matchesYear && matchesProgram;
  });
}

function compareCourseRows(a, b, key) {
  if (key === 'year' || key === 'students') return Number(a[key] || 0) - Number(b[key] || 0);
  return String(a[key] ?? '').localeCompare(String(b[key] ?? ''), undefined, { numeric: true, sensitivity: 'base' });
}

function sortedCourseRows(rows) {
  const direction = courseTableState.sortDirection === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const primary = compareCourseRows(a, b, courseTableState.sortKey);
    if (primary !== 0) return primary * direction;
    return ((Number(b.year) || 0) - (Number(a.year) || 0)) || String(b.semester ?? '').localeCompare(String(a.semester ?? ''), undefined, { numeric: true });
  });
}

function renderCourseSortIndicators() {
  document.querySelectorAll('[data-course-sort]').forEach((button) => {
    const active = button.dataset.courseSort === courseTableState.sortKey;
    button.classList.toggle('active', active);
    button.closest('th')?.setAttribute('aria-sort', active ? (courseTableState.sortDirection === 'asc' ? 'ascending' : 'descending') : 'none');
    const indicator = button.querySelector('span');
    if (indicator) indicator.textContent = active ? (courseTableState.sortDirection === 'asc' ? '▲' : '▼') : '⇅';
  });
}

function renderCoursesChart(filteredRows) {
  const chart = $('courses-chart');
  if (!chart) return;
  const byYear = [...new Set(filteredRows.map((c) => c.year))].sort((a, b) => a - b).map((year) => {
    const rows = filteredRows.filter((c) => c.year === year);
    return { year, offerings: rows.length, students: rows.reduce((sum, c) => sum + Number(c.students || 0), 0) };
  });
  const maxOfferings = Math.max(1, ...byYear.map((d) => d.offerings));
  const maxStudents = Math.max(1, ...byYear.map((d) => d.students));
  const { offerings, students } = courseSeriesState;

  const legend = `<div class="chart-legend">
    <button type="button" class="legend-toggle${offerings ? ' on' : ''}" data-course-series="offerings" aria-pressed="${offerings}"><i class="swatch offer"></i>Course offerings</button>
    <button type="button" class="legend-toggle${students ? ' on' : ''}" data-course-series="students" aria-pressed="${students}"><i class="swatch students"></i>Students served</button>
  </div>`;

  let body;
  if (!filteredRows.length) body = '<p class="muted">No courses match the current filters.</p>';
  else if (!offerings && !students) body = '<p class="muted">Select a series to show the chart.</p>';
  else {
    body = `<div class="chart-years">${byYear.map((d) => `<div class="chart-year" title="${d.year}: ${d.offerings} course offerings, ${d.students} students">
      <div class="chart-bars">
        ${offerings ? `<div class="cbar offer" style="height:${Math.max(16, (d.offerings / maxOfferings) * 140)}px"><b>${d.offerings}</b></div>` : ''}
        ${students ? `<div class="cbar students" style="height:${Math.max(16, (d.students / maxStudents) * 140)}px"><b>${d.students}</b></div>` : ''}
      </div>
      <span>${d.year}</span>
    </div>`).join('')}</div>
    <p class="gel-help">Each series is scaled to its own maximum.</p>`;
  }
  chart.innerHTML = legend + body;
  chart.querySelectorAll('[data-course-series]').forEach((button) => button.addEventListener('click', () => {
    const series = button.dataset.courseSeries;
    courseSeriesState[series] = !courseSeriesState[series];
    renderCourses();
  }));
}

function renderCourses() {
  const tbody = $('courses-table-body');
  if (!$('courses-chart') && !tbody) return;
  const filteredRows = courseFilteredRows();
  renderCoursesChart(filteredRows);

  const rows = sortedCourseRows(filteredRows);
  const totalPages = Math.max(1, Math.ceil(rows.length / courseTableState.perPage));
  if (courseTableState.page > totalPages) courseTableState.page = totalPages;
  const start = (courseTableState.page - 1) * courseTableState.perPage;
  const pageRows = rows.slice(start, start + courseTableState.perPage);

  if (tbody) {
    tbody.innerHTML = pageRows.length
      ? pageRows.map((c, i) => `<tr><td>${start + i + 1}</td><td>${escapeHtml(c.year)}</td><td><strong>${escapeHtml(c.course)}</strong><small>${escapeHtml(c.university)}</small></td><td>${escapeHtml(c.program)}</td><td>${escapeHtml(c.semester)}</td><td class="num">${escapeHtml(c.students)}</td></tr>`).join('')
      : '<tr><td colspan="6" class="muted">No courses found.</td></tr>';
  }

  const pager = $('courses-pager');
  if (pager) {
    pager.innerHTML = '';
    if (totalPages > 1) {
      const addButton = (label, aria, disabled, onClick, active) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = label;
        b.disabled = disabled;
        b.className = active ? 'active' : '';
        b.setAttribute('aria-label', aria);
        if (active) b.setAttribute('aria-current', 'page');
        b.onclick = onClick;
        pager.appendChild(b);
      };
      addButton('‹', 'Previous courses page', courseTableState.page === 1, () => { courseTableState.page--; renderCourses(); });
      for (let i = 1; i <= totalPages; i++) addButton(String(i), `Courses page ${i}`, false, () => { courseTableState.page = i; renderCourses(); }, i === courseTableState.page);
      addButton('›', 'Next courses page', courseTableState.page === totalPages, () => { courseTableState.page++; renderCourses(); });
    }
  }

  renderCourseSortIndicators();
  if ($('courses-total-offerings')) $('courses-total-offerings').textContent = String(courses.length);
  if ($('courses-total-students')) $('courses-total-students').textContent = String(courses.reduce((sum, c) => sum + Number(c.students || 0), 0));
  if ($('courses-years-active')) $('courses-years-active').textContent = String(new Set(courses.map((c) => c.year)).size);
  const status = $('courses-table-status');
  if (status) {
    const from = rows.length ? start + 1 : 0;
    const to = Math.min(start + courseTableState.perPage, rows.length);
    status.textContent = `Showing ${from} to ${to} of ${rows.length} matching offerings (${courses.length} in total).`;
  }
}

function initCourseTable() {
  const yearSelect = $('courses-year-filter');
  const programSelect = $('courses-program-filter');
  if (yearSelect) {
    [...new Set(courses.map((c) => c.year))].sort((a, b) => b - a).forEach((year) => {
      const option = document.createElement('option');
      option.value = String(year);
      option.textContent = String(year);
      yearSelect.appendChild(option);
    });
    yearSelect.addEventListener('change', (e) => { courseTableState.year = e.target.value; courseTableState.page = 1; renderCourses(); });
  }
  if (programSelect) {
    [...new Set(courses.map((c) => c.program).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b))).forEach((program) => {
      const option = document.createElement('option');
      option.value = String(program);
      option.textContent = String(program);
      programSelect.appendChild(option);
    });
    programSelect.addEventListener('change', (e) => { courseTableState.program = e.target.value; courseTableState.page = 1; renderCourses(); });
  }
  $('courses-search')?.addEventListener('input', (e) => { courseTableState.search = e.target.value; courseTableState.page = 1; renderCourses(); });
  document.querySelectorAll('[data-course-sort]').forEach((button) => button.addEventListener('click', () => {
    const key = button.dataset.courseSort;
    if (courseTableState.sortKey === key) courseTableState.sortDirection = courseTableState.sortDirection === 'asc' ? 'desc' : 'asc';
    else {
      courseTableState.sortKey = key;
      courseTableState.sortDirection = (key === 'year' || key === 'students') ? 'desc' : 'asc';
    }
    courseTableState.page = 1;
    renderCourses();
  }));
}

/* ---------- Testimonials ---------- */

function renderTestimonials() {
  const el = $('testimonial-list');
  if (!el || !testimonials.length) return;
  el.innerHTML = testimonials.map((t) => `<figure class="quote">
    <blockquote><p>${escapeHtml(t.text)}</p></blockquote>
    <figcaption>
      ${t.photo ? `<img src="${escapeHtml(t.photo)}" alt="" width="56" height="56" loading="lazy">` : ''}
      <span><strong>${escapeHtml(t.name)}</strong>${t.role ? `<br>${escapeHtml(t.role)}` : ''}${t.company ? `<br>${escapeHtml(t.company)}` : ''}</span>
    </figcaption>
  </figure>`).join('');
  const figures = [...el.children];
  const count = $('testimonial-count');
  const show = (i) => {
    testimonialIndex = (i + figures.length) % figures.length;
    figures.forEach((f, idx) => { f.hidden = idx !== testimonialIndex; });
    if (count) count.textContent = `${testimonialIndex + 1} of ${figures.length}`;
  };
  $('testimonial-prev')?.addEventListener('click', () => show(testimonialIndex - 1));
  $('testimonial-next')?.addEventListener('click', () => show(testimonialIndex + 1));
  if (figures.length < 2) document.querySelector('.carousel-controls')?.setAttribute('hidden', '');
  show(0);
}

/* ---------- Interactions ---------- */

function initShowMore() {
  document.querySelectorAll('[data-show-more]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.showMore;
      moreState[key] = !moreState[key];
      if (key === 'events') renderEvents();
      else if (key === 'awards') renderAwards();
      else renderExperience();
    });
  });
}

function initRailCollapse() {
  const btn = document.querySelector('.rail-collapse');
  document.querySelectorAll('.nav-link').forEach((a) => { a.title = a.textContent.trim(); });
  if (!btn) return;
  const apply = (collapsed) => {
    document.body.classList.toggle('rail-collapsed', collapsed);
    btn.setAttribute('aria-expanded', String(!collapsed));
    btn.setAttribute('aria-label', collapsed ? 'Expand menu' : 'Collapse menu');
    btn.querySelector('.glyph').textContent = collapsed ? '›' : '‹';
    try { localStorage.setItem('rail-collapsed', collapsed ? '1' : '0'); } catch (e) { /* storage unavailable */ }
  };
  let saved = false;
  try { saved = localStorage.getItem('rail-collapsed') === '1'; } catch (e) { /* storage unavailable */ }
  apply(saved);
  btn.addEventListener('click', () => apply(!document.body.classList.contains('rail-collapsed')));
}

function initNav() {
  const rail = $('rail');
  const toggle = document.querySelector('.menu-toggle');
  const links = [...document.querySelectorAll('.nav-link')];
  const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) links.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === '#' + entry.target.id));
    });
  }, { rootMargin: '-20% 0px -70% 0px' });
  sections.forEach((s) => observer.observe(s));

  const setOpen = (open) => {
    rail?.classList.toggle('open', open);
    toggle?.setAttribute('aria-expanded', String(open));
  };
  toggle?.addEventListener('click', () => setOpen(!rail.classList.contains('open')));
  links.forEach((a) => a.addEventListener('click', () => setOpen(false)));
}

document.addEventListener('click', (e) => {
  const more = e.target.closest('[data-more]');
  if (more) {
    const extra = more.previousElementSibling;
    extra.classList.toggle('hidden');
    more.textContent = extra.classList.contains('hidden') ? more.dataset.label : 'Show fewer';
  }
  const inventors = e.target.closest('[data-toggle="inventors"]');
  if (inventors) {
    const list = $('inventors');
    if (list) {
      list.classList.toggle('hidden');
      inventors.textContent = list.classList.contains('hidden') ? 'Show all' : 'Hide list';
    }
  }
});

initNav();
initRailCollapse();
initPublicationFilters();
renderPublications();
renderExperience();
renderEvents();
renderAwards();
renderProjects();
renderPeerReviews();
renderCompetitions();
renderOutreach();
renderResearchProjects();
initCourseTable();
renderCourses();
initShowMore();
renderTestimonials();
})();
