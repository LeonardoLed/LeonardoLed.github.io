const DATA = window.CVLEO_DATA || {};
const publications = DATA.publications || [];
const experience = DATA.experience || { professional: [], academic: [], research: [] };
const events = DATA.events || [];
const awards = DATA.awards || [];
const testimonials = DATA.testimonials || [];
const projects = DATA.projects || { featured: [], previous: [] };
const peerReviews = DATA.peerReviews || { published: [], active: [] };
const courses = DATA.courses || [];
const state = { page: 1, perPage: 3, search: '', type: 'all', year: 'all', featured: 'all' };
const moreState = { professional: false, academic: false, research: false, events: false, awards: false };
const courseSeriesState = { offerings: true, students: true };
let testimonialIndex = 0;

function escapeHtml(s){return String(s ?? '').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function sortedPublications(items){return [...items].sort((a,b)=>(b.year-a.year)||Number(b.featured)-Number(a.featured)||a.title.localeCompare(b.title));}
function authorLine(authors=[]){const visible=authors.slice(0,3).map(a=>a.includes('Ledesma')?`<span class="me">${escapeHtml(a)}</span>`:escapeHtml(a)).join(' · ');if(authors.length<=3)return visible;const hidden=authors.slice(3).map(a=>a.includes('Ledesma')?`<span class="me">${escapeHtml(a)}</span>`:escapeHtml(a)).join(' · ');return `${visible} <button class="more-authors" data-more>+${authors.length-3} authors⌄</button><span class="hidden extra-authors"> · ${hidden}</span>`;}
function publicationClass(p){return p.type.includes('Book')?'book':p.type.includes('Conference')?'conference':'journal';}
function publicationIcon(p){const cls=publicationClass(p);return cls==='book'?'BK':cls==='conference'?'CP':'JA';}
function pubLinks(p){return Object.entries(p.links||{}).filter(([,v])=>v&&v!=='#').map(([k,v])=>`<a href="${escapeHtml(v)}" target="_blank" rel="noopener">${escapeHtml(k)}</a>`).join('');}
function showMetrics(p){return p.showMetrics !== false && p.indexed !== false;}
function pubCard(p){const cls=publicationClass(p);const metrics=showMetrics(p);const badges=[p.quartile || (metrics?'Published':'Non-indexed'),p.area].filter(Boolean).map(b=>`<span>${escapeHtml(b)}</span>`).join('');return `<article class="publication-card ${cls} hover-card ${p.featured?'featured':''} ${!metrics?'no-metrics':''}"><div class="pub-icon">${publicationIcon(p)}</div><div class="pub-main"><div class="pub-meta"><span class="date">${p.year}</span><span class="type ${cls}">${escapeHtml(p.type)}</span>${p.featured?'<span class="star" title="Featured publication">★</span>':''}</div><h3>${escapeHtml(p.title)}</h3><p class="journal-name">${escapeHtml(p.venue)}</p><p class="authors">${authorLine(p.authors)}</p>${p.role?`<p class="pub-role">${escapeHtml(p.role)}</p>`:''}<div class="chips">${(p.tags||[]).map(t=>`<span>${escapeHtml(t)}</span>`).join('')}</div><div class="pub-links">${pubLinks(p)}</div></div><aside class="pub-side"><div class="pub-badges">${badges}</div>${metrics?`<div class="citation-box"><div><strong>${escapeHtml(p.wos)}</strong><span>WoS</span></div><div><strong>${escapeHtml(p.scopus)}</strong><span>Scopus</span></div></div>`:''}</aside></article>`;}
function recentPub(p){return `<article class="recent-pub"><span class="date">${p.year}</span><span class="pub-mini-type">${publicationIcon(p)}</span><div><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.venue)}</p><div class="pub-links mini-links">${pubLinks(p)}</div></div>${p.featured?'<span class="star">★</span>':''}</article>`;}
function filtered(){return sortedPublications(publications.filter(p=>{const text=JSON.stringify(p).toLowerCase();const featuredOk=state.featured==='all'||(state.featured==='featured'&&p.featured)||(state.featured==='regular'&&!p.featured);return (state.type==='all'||p.type===state.type)&&(state.year==='all'||String(p.year)===state.year)&&featuredOk&&text.includes(state.search.toLowerCase());}));}
function paginate(items){return items.slice((state.page-1)*state.perPage,state.page*state.perPage);}
function renderChart(items){const chartEl=document.getElementById('publication-chart');if(!chartEl)return;const types=['Journal Article','Book Chapter','Conference Proceeding'];const clsMap={'Journal Article':'journal','Book Chapter':'book','Conference Proceeding':'conference'};const years=[...new Set(items.map(p=>p.year))].sort();const totals=years.map(y=>items.filter(p=>p.year===y).length);const max=Math.max(1,...totals);const bars=years.map((y,yi)=>{let offset=0;const segments=types.map(t=>{const count=items.filter(p=>p.year===y&&p.type===t).length;if(!count)return '';const h=Math.max(34,(count/max)*132);const seg=`<button type="button" class="chart-segment ${clsMap[t]}" data-chart-year="${y}" data-chart-type="${t}" title="${y} · ${t}: ${count}" style="height:${h}px;bottom:${offset}px"><span>${count}</span></button>`;offset+=h;return seg;}).join('');return `<div class="chart-column"><div class="chart-stack">${segments}</div><button type="button" class="chart-year-label" data-chart-year="${y}">${y}<br><strong>${totals[yi]}</strong></button></div>`;}).join('');chartEl.innerHTML=`<div class="chart-legend"><span><i class="journal"></i>Journal Article</span><span><i class="book"></i>Book Chapter</span><span><i class="conference"></i>Conference Proceeding</span></div><div class="chart-combo no-line"><div class="chart-bars">${bars}</div></div><p class="chart-help">Click on a bar segment or year to filter</p>`;}
function renderPublications(){const items=filtered();const published=publications.length;const indexed=publications.filter(showMetrics).length;const count=document.getElementById('publication-count');if(count)count.textContent=`${items.length} records shown · ${indexed} indexed publications · ${published} total publications.`;renderChart(items);const list=document.getElementById('all-publication-list');if(list)list.innerHTML=paginate(items).map(pubCard).join('');const recent=document.getElementById('recent-publication-list');if(recent)recent.innerHTML=sortedPublications(publications).slice(0,4).map(recentPub).join('');const pages=Math.max(1,Math.ceil(items.length/state.perPage));if(state.page>pages)state.page=pages;const pager=document.getElementById('all-pager');if(pager){pager.innerHTML='';for(let i=1;i<=pages;i++){const b=document.createElement('button');b.textContent=i;b.className=i===state.page?'active':'';b.onclick=()=>{state.page=i;renderPublications();document.getElementById('publications')?.scrollIntoView({behavior:'smooth'});};pager.appendChild(b);}}document.getElementById('stat-publications')&&(document.getElementById('stat-publications').textContent=String(indexed));document.getElementById('stat-projects')&&(document.getElementById('stat-projects').textContent=String((projects.featured||[]).length));document.getElementById('stat-awards')&&(document.getElementById('stat-awards').textContent=String(awards.length));}
function initYearFilter(){const yearSelect=document.getElementById('publication-year');if(!yearSelect)return;[...new Set(publications.map(p=>p.year))].sort((a,b)=>b-a).forEach(y=>{const option=document.createElement('option');option.value=String(y);option.textContent=y;yearSelect.appendChild(option);});}
function initPublicationFilters(){initYearFilter();[['publication-search','input','search'],['publication-type','change','type'],['publication-year','change','year'],['publication-featured','change','featured']].forEach(([id,evt,key])=>{const el=document.getElementById(id);if(el)el.addEventListener(evt,e=>{state[key]=e.target.value;state.page=1;renderPublications();});});const chart=document.getElementById('publication-chart');if(chart){chart.addEventListener('click',e=>{const year=e.target.closest('[data-chart-year]')?.dataset.chartYear;const type=e.target.closest('[data-chart-type]')?.dataset.chartType;if(!year&&!type)return;if(year){state.year=state.year===year?'all':year;const y=document.getElementById('publication-year');if(y)y.value=state.year;}if(type){state.type=state.type===type?'all':type;const t=document.getElementById('publication-type');if(t)t.value=state.type;}state.page=1;renderPublications();});}}
function orgFallback(name){return escapeHtml((name||'ORG').split(/\s|,/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase());}
function parentOrgKey(raw){
  const orgs=DATA.organizations||{};
  const key=String(raw||'').trim().toLowerCase();
  if(key && orgs[key]) return key;
  if(key.includes('tec')||key.includes('tecnológico')||key.includes('monterrey')) return 'tec';
  if(key.includes('iimas')) return 'iimas';
  if(key.includes('cellular physiology')||key.includes('ifc')) return 'ifc';
  if(key.includes('faculty of engineering')||key.includes('facultad de ingeniería')||key.includes('fi/')) return 'fi';
  if(key.includes('cpesgi')) return 'cpesgi';
  if(key.includes('dgei')) return 'dgei';
  if(key.includes('unam')||key.includes('unica')||key.includes('faculty')||key.includes('facultad')) return 'unam';
  return key || 'other';
}
function orgCardData(parentKey, sampleOrg){
  const orgs=DATA.organizations||{};
  const org=orgs[parentKey]||{};
  return {name:org.name||sampleOrg||parentKey, logo:org.logo||''};
}
function parseRoleYears(period){
  const text = String(period || '');
  const years = [...text.matchAll(/\d{4}|Present/g)].map(m => m[0]);
  const start = Number(years.find(y => y !== 'Present')) || new Date().getFullYear();
  const hasPresent = text.includes('Present');
  const numericYears = years.filter(y => y !== 'Present').map(Number);
  const end = hasPresent ? new Date().getFullYear() : Math.max(...numericYears, start);
  return { start, end, hasPresent };
}

function experienceSummary(items, total){
  const parsed = items.map(x => parseRoleYears(x[0]));
  const start = Math.min(...parsed.map(p => p.start));
  const hasPresent = parsed.some(p => p.hasPresent);
  const end = Math.max(...parsed.map(p => p.end));
  const endLabel = hasPresent ? 'Present' : String(end);
  const duration = Math.max(1, end - start);
  const durationLabel = hasPresent ? `${duration}+ years` : `${duration} years`;
  return `${total} role${total === 1 ? '' : 's'} • ${start}–${endLabel} (${durationLabel})`;
}

function renderExperience(){
  Object.entries(experience).forEach(([key,items])=>{
    const el=document.getElementById(`${key}-list`);
    if(!el)return;

    // Show only the two most recent roles by default.
    // The arrays in experience.js are already ordered from newest to oldest.
    const displayedItems=moreState[key]?items:items.slice(0,2);
    const groups=[];

    displayedItems.forEach((x,i)=>{
      const parent=parentOrgKey(x[4]||x[2]);
      let g=groups.find(v=>v.parent===parent);
      if(!g){
        const meta=orgCardData(parent,x[2]);
        g={parent,name:meta.name,logo:meta.logo,items:[]};
        groups.push(g);
      }
      g.items.push({data:x,index:i});
    });

    el.innerHTML=groups.map(g=>`<article class="institution-experience-card"><div class="institution-head"><div class="institution-logo-large">${g.logo?`<img src="${escapeHtml(g.logo)}" alt="${escapeHtml(g.name)} logo" loading="lazy">`:orgFallback(g.name)}</div><div><h4>${escapeHtml(g.name)}</h4><p>${experienceSummary(g.items.map(({data}) => data), g.items.length)}</p></div></div><div class="institution-roles">${g.items.map(({data:x})=>`<div class="institution-role-line"><span class="date">${escapeHtml(x[0])}</span><h5>${escapeHtml(x[1])}</h5><p><strong>${escapeHtml(x[2])}</strong></p><p>${escapeHtml(x[3])}</p></div>`).join('')}</div></article>`).join('');

    const btn=document.querySelector(`[data-show-more="${key}"]`);
    if(btn){
      btn.style.display=items.length>2?'inline-flex':'none';
      btn.textContent=moreState[key]?`Show less ${key} experience ↑`:`View more ${key} experience →`;
    }
  });
}
function flagClass(code){return `flag-svg flag-${code}`;}
function renderEvents(){const el=document.getElementById('event-list');if(!el)return;el.innerHTML=events.map((e,i)=>`<article class="event-row ${i>2&&!moreState.events?'hidden-extra':''}"><span class="${flagClass(e[0])}"></span><div><h3>${escapeHtml(e[1])}</h3><p>${escapeHtml(e[2])}</p><small>${escapeHtml(e[3])}</small></div></article>`).join('');const btn=document.querySelector('[data-show-more="events"]');if(btn){btn.style.display=events.length>3?'inline-flex':'none';btn.textContent=moreState.events?'Show fewer events ↑':'View all events & congresses →';}}
let awardOffset=0;
function awardIcon(i){const icons=[
`<svg viewBox="0 0 24 24"><path d="M8 4h8l1 5a5 5 0 1 1-10 0l1-5Z"/><path d="M9 14 7 21l5-3 5 3-2-7"/><path d="M8 4h8"/></svg>`,
`<svg viewBox="0 0 24 24"><path d="M7 4h10v4a5 5 0 0 1-10 0V4Z"/><path d="M5 5H3v2a3 3 0 0 0 4 2M19 5h2v2a3 3 0 0 1-4 2"/><path d="M12 13v5M8 21h8"/></svg>`,
`<svg viewBox="0 0 24 24"><path d="M22 9 12 4 2 9l10 5 10-5Z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/><path d="M22 9v6"/></svg>`,
`<svg viewBox="0 0 24 24"><path d="M4 18V8l4 4 4-7 4 7 4-4v10"/><path d="M3 21h18"/></svg>`,
`<svg viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="1"/><path d="M4 10h3M4 14h3M17 10h3M17 14h3M10 4v3M14 4v3M10 17v3M14 17v3"/></svg>`,
`<svg viewBox="0 0 24 24"><path d="M4 18V8l4 4 4-7 4 7 4-4v10"/><path d="M3 21h18"/></svg>`];return icons[i%icons.length];}
function renderAwards(){
  const el=document.getElementById('award-list');
  if(!el)return;

  const visibleCount=6;
  const start=Math.max(0,Math.min(awardOffset,Math.max(0,awards.length-visibleCount)));
  awardOffset=start;

  const visible=awards.slice(start,start+visibleCount);

  el.innerHTML=visible.map((a,i)=>`
    <article class="award-card">
      <div class="award-icon">${awardIcon(start+i)}</div>

      <span class="date">${escapeHtml(a[0])}</span>

      <h3>${escapeHtml(a[1])}</h3>

      ${a[3] ? `<h4 class="award-institution">${escapeHtml(a[3])}</h4>` : ''}

      <p>${escapeHtml(a[2])}</p>
    </article>
  `).join('');

  const prev=document.getElementById('award-prev');
  const next=document.getElementById('award-next');

  if(prev){
    prev.disabled=start===0;
    prev.onclick=()=>{
      awardOffset=Math.max(0,awardOffset-visibleCount);
      renderAwards();
    };
  }

  if(next){
    next.disabled=start+visibleCount>=awards.length;
    next.onclick=()=>{
      awardOffset=Math.min(Math.max(0,awards.length-visibleCount),awardOffset+visibleCount);
      renderAwards();
    };
  }
}

function safeImageTag(src,alt,fallback=''){const onError=fallback?` onerror="this.onerror=null;this.src='${escapeHtml(fallback)}';"`:'';return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy"${onError}>`;}
function renderProjects(){const featuredEl=document.getElementById('featured-project-list');const previousEl=document.getElementById('previous-project-list');if(featuredEl){featuredEl.innerHTML=(projects.featured||[]).map(p=>`<article class="project-card dash-project portfolio-card-wide"><div class="project-cover">${safeImageTag(p.image,p.title,p.fallbackImage||'')}</div><div class="project-body"><h3>${escapeHtml(p.title)}</h3>${p.subtitle?`<p>${escapeHtml(p.subtitle)}</p>`:''}${p.status?`<p class="project-status">${escapeHtml(p.status)}</p>`:''}<span class="date">${escapeHtml(p.period||'Featured')}</span><div class="chips project-keywords">${(p.keywords||[]).slice(0,4).map(k=>`<span>${escapeHtml(k)}</span>`).join('')}</div>${p.url?`<a class="text-link" href="${escapeHtml(p.url)}" target="_blank" rel="noopener">${escapeHtml(p.linkLabel||'View project')} →</a>`:''}</div></article>`).join('');}if(previousEl){previousEl.innerHTML=(projects.previous||[]).map(p=>`<article class="project-card previous-project-card">${safeImageTag(p.image,p.title,p.fallbackImage||'')}<div><h3>${escapeHtml(p.title)}</h3>${p.description?`<p>${escapeHtml(p.description)}</p>`:''}${p.url?`<a class="text-link" href="${escapeHtml(p.url)}" target="_blank" rel="noopener">Open project →</a>`:''}</div></article>`).join('');}}

function peerReviewCard(item,type){
  const isPublished=type==='published';
  const links=[];
  if(isPublished&&item.articleUrl)links.push(`<a href="${escapeHtml(item.articleUrl)}" target="_blank" rel="noopener">View article ↗</a>`);
  if(isPublished&&item.certificateUrl&&item.certificateUrl!=='#')links.push(`<a href="${escapeHtml(item.certificateUrl)}" target="_blank" rel="noopener">Review recognition ↗</a>`);
  return `<article class="peer-review-card ${isPublished?'published':'active'}">
    <div class="peer-year"><strong>${escapeHtml(item.year)}</strong><span>${isPublished?escapeHtml(item.date||'Published'):'In review'}</span></div>
    <div class="peer-logo">${item.logo?`<img src="${escapeHtml(item.logo)}" alt="${escapeHtml(item.publisher)} logo" loading="lazy">`:`<strong>${escapeHtml(item.publisher)}</strong>`}</div>
    <div class="peer-info"><h4>${escapeHtml(item.journal)}</h4>${item.section?`<p>Section: ${escapeHtml(item.section)}</p>`:''}<small>Role: ${escapeHtml(item.role||'Peer Reviewer')}</small></div>
    <div class="peer-title"><h4>${isPublished?escapeHtml(item.title):'Manuscript title confidential'}</h4>${!isPublished?`<p>${escapeHtml(item.note||'Under peer review process')}</p>`:''}</div>
    <div class="peer-status"><strong>${escapeHtml(item.status)}</strong>${links.join('')}</div>
  </article>`;
}
function renderPeerReviews(){
  const publishedEl=document.getElementById('published-peer-review-list');
  const activeEl=document.getElementById('active-peer-review-list');
  if(publishedEl)publishedEl.innerHTML=(peerReviews.published||[]).map(p=>peerReviewCard(p,'published')).join('');
  if(activeEl)activeEl.innerHTML=(peerReviews.active||[]).map(p=>peerReviewCard(p,'active')).join('');
  const publishers=new Set([...(peerReviews.published||[]).map(p=>p.publisher),...(peerReviews.active||[]).map(p=>p.publisher)].filter(Boolean));
  const pc=document.getElementById('peer-published-count');if(pc)pc.textContent=String((peerReviews.published||[]).length);
  const ac=document.getElementById('peer-active-count');if(ac)ac.textContent=String((peerReviews.active||[]).length);
  const pubc=document.getElementById('peer-publisher-count');if(pubc)pubc.textContent=String(publishers.size);
}

function renderCourses(){
  const chart=document.getElementById('courses-chart');
  const tbody=document.getElementById('courses-table-body');
  if(!chart&&!tbody)return;
  const byYear=[...new Set(courses.map(c=>c.year))].sort((a,b)=>a-b).map(year=>{
    const rows=courses.filter(c=>c.year===year);
    return {year,offerings:rows.length,students:rows.reduce((sum,c)=>sum+Number(c.students||0),0)};
  });
  const maxOfferings=Math.max(1,...byYear.map(d=>d.offerings));
  const maxStudents=Math.max(1,...byYear.map(d=>d.students));
  if(chart){
    const offeringsButton=`<button type="button" class="courses-legend-toggle ${courseSeriesState.offerings?'active':'inactive'}" data-course-series="offerings" aria-pressed="${courseSeriesState.offerings}"><i class="course-bar-swatch"></i>Course offerings</button>`;
    const studentsButton=`<button type="button" class="courses-legend-toggle ${courseSeriesState.students?'active':'inactive'}" data-course-series="students" aria-pressed="${courseSeriesState.students}"><i class="student-bar-swatch"></i>Students served</button>`;
    const bars=byYear.map(d=>`<article class="courses-year-group" title="${d.year}: ${d.offerings} course offerings, ${d.students} students"><div class="courses-bars">${courseSeriesState.offerings?`<div class="courses-bar course-offerings" style="height:${Math.max(24,(d.offerings/maxOfferings)*180)}px"><strong>${d.offerings}</strong></div>`:''}${courseSeriesState.students?`<div class="courses-bar course-students" style="height:${Math.max(24,(d.students/maxStudents)*180)}px"><strong>${d.students}</strong></div>`:''}</div><span>${d.year}</span></article>`).join('');
    const emptyMessage=!courseSeriesState.offerings&&!courseSeriesState.students?'<p class="courses-chart-empty">Select a series to display the chart.</p>':'';
    chart.innerHTML=`<div class="courses-chart-legend" aria-label="Toggle chart series">${offeringsButton}${studentsButton}</div>${emptyMessage}<div class="courses-chart-grid ${!courseSeriesState.offerings&&!courseSeriesState.students?'all-series-hidden':''}">${bars}</div><div class="courses-axis-labels"><span class="${courseSeriesState.offerings?'':'series-label-off'}">Left scale: course offerings</span><span class="${courseSeriesState.students?'':'series-label-off'}">Right scale: students served</span></div>`;
    chart.querySelectorAll('[data-course-series]').forEach(button=>{
      button.addEventListener('click',()=>{
        const series=button.dataset.courseSeries;
        courseSeriesState[series]=!courseSeriesState[series];
        renderCourses();
      });
    });
  }
  if(tbody){
    tbody.innerHTML=[...courses].sort((a,b)=>(b.year-a.year)||String(b.semester).localeCompare(String(a.semester))).map((c,i)=>`<tr><td>${i+1}</td><td><span class="date">${escapeHtml(c.year)}</span></td><td><strong>${escapeHtml(c.course)}</strong><small>${escapeHtml(c.university)}</small></td><td>${escapeHtml(c.program)}</td><td>${escapeHtml(c.semester)}</td><td class="courses-students-cell">${escapeHtml(c.students)}</td></tr>`).join('');
  }
  const totalStudents=courses.reduce((sum,c)=>sum+Number(c.students||0),0);
  const offerings=document.getElementById('courses-total-offerings');if(offerings)offerings.textContent=String(courses.length);
  const students=document.getElementById('courses-total-students');if(students)students.textContent=String(totalStudents);
  const years=document.getElementById('courses-years-active');if(years)years.textContent=String(byYear.length);
  const stat=document.getElementById('stat-courses');if(stat)stat.textContent=String(courses.length);
}

function initShowMore(){document.querySelectorAll('[data-show-more]').forEach(btn=>{btn.addEventListener('click',()=>{const key=btn.dataset.showMore;moreState[key]=!moreState[key];if(key==='events')renderEvents();else if(key==='awards')renderAwards();else renderExperience();});});}
function initNav(){const links=[...document.querySelectorAll('.nav-link')];const sections=links.map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean);const obs=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){links.forEach(l=>l.classList.toggle('active',l.getAttribute('href')==='#'+entry.target.id));}})},{rootMargin:'-20% 0px -70% 0px'});sections.forEach(s=>obs.observe(s));const mobile=document.querySelector('.mobile-nav-toggle');if(mobile)mobile.onclick=()=>document.querySelector('.sidebar')?.classList.toggle('open');links.forEach(a=>a.onclick=()=>document.querySelector('.sidebar')?.classList.remove('open'));const collapse=document.querySelector('.sidebar-collapse');if(collapse){collapse.addEventListener('click',()=>{document.body.classList.toggle('sidebar-collapsed');collapse.textContent=document.body.classList.contains('sidebar-collapsed')?'›':'‹';});}}
function initTestimonials(){const windowEl=document.querySelector('.testimonial-window');const dots=document.getElementById('testimonial-dots');const wrap=document.querySelector('.testimonial-carousel');if(!windowEl||!dots||!Array.isArray(testimonials)||!testimonials.length)return;windowEl.innerHTML=testimonials.map((t,i)=>`<article class="testimonial-card ${i===0?'active':''}">${t.photo?`<img class="testimonial-photo" src="${escapeHtml(t.photo)}" alt="${escapeHtml(t.name)}" loading="lazy" />`:'<div class="quote-mark">“</div>'}<p>“${escapeHtml(t.text)}”</p><h3>${escapeHtml(t.name)}</h3>${t.role?`<small>${escapeHtml(t.role)}</small>`:''}${t.company?`<small>${escapeHtml(t.company)}</small>`:''}</article>`).join('');dots.innerHTML='';const cards=[...windowEl.querySelectorAll('.testimonial-card')];function show(i){testimonialIndex=(i+cards.length)%cards.length;cards.forEach((c,idx)=>c.classList.toggle('active',idx===testimonialIndex));dots.querySelectorAll('button').forEach((d,idx)=>d.classList.toggle('active',idx===testimonialIndex));}cards.forEach((_,i)=>{const b=document.createElement('button');b.setAttribute('aria-label',`Go to testimonial ${i+1}`);b.onclick=()=>show(i);dots.appendChild(b);});document.getElementById('testimonial-prev')?.addEventListener('click',()=>show(testimonialIndex-1));document.getElementById('testimonial-next')?.addEventListener('click',()=>show(testimonialIndex+1));show(0);let timer=setInterval(()=>show(testimonialIndex+1),10000);if(wrap){wrap.addEventListener('mouseenter',()=>clearInterval(timer));wrap.addEventListener('mouseleave',()=>{timer=setInterval(()=>show(testimonialIndex+1),10000);});}}
document.addEventListener('click',e=>{if(e.target.matches('[data-more]')){const extra=e.target.nextElementSibling;extra.classList.toggle('hidden');e.target.textContent=extra.classList.contains('hidden')?e.target.textContent.replace('⌃','⌄'):e.target.textContent.replace('⌄','⌃');}if(e.target.matches('[data-toggle="inventors"]')){const inv=document.getElementById('inventors'); if(inv){inv.classList.toggle('hidden'); e.target.textContent=inv.classList.contains('hidden')?'show all ↓':'hide list ↑';}}});

initNav();
initPublicationFilters();
renderPublications();
renderExperience();
renderEvents();
renderAwards();
renderProjects();
renderPeerReviews();
renderCourses();
initShowMore();
initTestimonials();
