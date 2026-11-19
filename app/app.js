// Leonida Trophy Guide: checklist tracker for the 55 GTA VI trophies.
// Loads app/data/trophies.json (its own file, no network), renders the list,
// saves earned trophies and the spoiler setting in localStorage, and supports
// export / import of progress as a JSON file. URL params set the starting
// state so a view can be linked or screenshotted: ?view=roadmap, ?grade=,
// ?kind=, ?spoiler=1, ?open=<trophy id>, ?earned=<id,id,...>, ?q=<search>.
const CHECK_KEY = 'leonida-trophy-earned-v1';
const SPOILER_KEY = 'leonida-trophy-spoiler-v1';
const params = new URLSearchParams(location.search);

const listEl = document.getElementById('list');
const detailEl = document.getElementById('detail');
const searchEl = document.getElementById('search');
const gradeEl = document.getElementById('grade');
const kindEl = document.getElementById('kind');
const earnedOnlyEl = document.getElementById('earnedOnly');
const spoilerEl = document.getElementById('spoiler');
const countEl = document.getElementById('count');
const onlineNote = document.getElementById('onlineNote');

let doc = null;
let earned = new Set();
let openId = null;

function loadSaved() {
  try { earned = new Set(JSON.parse(localStorage.getItem(CHECK_KEY) ?? '[]')); } catch { earned = new Set(); }
  earned = new Set([...earned].filter((n) => typeof n === 'string'));
}

function saveEarned() {
  localStorage.setItem(CHECK_KEY, JSON.stringify([...earned].sort()));
}

function saveSpoiler() {
  localStorage.setItem(SPOILER_KEY, spoilerEl.checked ? '1' : '0');
}

function trophyIsStory(t) { return t.kind === 'story'; }

function trophyIsHidden(t) {
  return spoilerEl.checked && trophyIsStory(t) && !earned.has(t.name);
}

function gradeLabel(g) {
  return g === 'platinum' ? 'Platinum' : g === 'gold' ? 'Gold' : g === 'silver' ? 'Silver' : 'Bronze';
}

function kindLabel(k) {
  const labels = { story: 'Story', collectibles: 'Collectibles', activities: 'Activities', characters: 'Character quest', robbery: 'Robbery', exploration: 'Exploration', misc: 'Secret / misc', platinum: 'Platinum' };
  return labels[k] ?? k;
}

function sourceLinks(t) {
  return (t.sources ?? []).map((key) => doc.sources[key]).filter(Boolean);
}

function visibleTrophies() {
  const q = searchEl.value.trim().toLowerCase();
  return doc.trophies.filter((t) => {
    if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
    if (kindEl.value === 'missable' && !t.missable) return false;
    if (kindEl.value === 'online') return false;
    if (kindEl.value !== 'all' && kindEl.value !== 'missable' && t.kind !== kindEl.value) return false;
    if (earnedOnlyEl.checked && !earned.has(t.name)) return false;
    if (q && !(t.name + ' ' + t.description + ' ' + t.guide).toLowerCase().includes(q)) return false;
    return true;
  });
}

function renderProgress() {
  const total = doc.trophies.length;
  const byGrade = {};
  for (const t of doc.trophies) {
    byGrade[t.grade] = byGrade[t.grade] ?? { got: 0, total: 0 };
    byGrade[t.grade].total += 1;
    if (earned.has(t.name)) byGrade[t.grade].got += 1;
  }
  document.getElementById('progressText').textContent = `${earned.size} / ${total} earned`;
  document.getElementById('progressFill').style.width = `${(earned.size / total) * 100}%`;
  const parts = ['platinum', 'gold', 'silver', 'bronze'].map((g) => `${gradeLabel(g)} ${byGrade[g].got}/${byGrade[g].total}`);
  document.getElementById('progressDetail').textContent = parts.join(' · ');
}

function renderList() {
  const shown = visibleTrophies();
  countEl.textContent = `Showing ${shown.length} of ${doc.trophies.length} trophies — ${earned.size} earned`;
  onlineNote.hidden = kindEl.value !== 'online';
  listEl.replaceChildren();
  for (const t of shown) {
    const li = document.createElement('li');
    li.className = `trophy grade-${t.grade}${earned.has(t.name) ? ' earned' : ''}${openId === t.id ? ' selected' : ''}`;
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.name);
    box.setAttribute('aria-label', `Mark ${t.name} earned`);
    box.addEventListener('click', (event) => event.stopPropagation());
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.name); else earned.delete(t.name);
      saveEarned();
      renderProgress();
      renderList();
      renderDetail();
    });
    const body = document.createElement('div');
    const name = document.createElement('h3');
    name.textContent = trophyIsHidden(t) ? 'Hidden story trophy' : t.name;
    const desc = document.createElement('p');
    desc.className = 'desc';
    desc.textContent = trophyIsHidden(t) ? 'Hidden until earned — turn the spoiler setting off, or earn it, to reveal it.' : t.description;
    const meta = document.createElement('p');
    meta.className = 'meta';
    meta.textContent = `${kindLabel(t.kind)} · Roadmap stage ${t.stage}${t.missable ? ' · ' : ''}`;
    if (t.missable) {
      const flag = document.createElement('span');
      flag.className = 'flag-missable';
      flag.textContent = 'POSSIBLY MISSABLE';
      meta.append(flag);
    }
    body.append(name, desc, meta);
    const tag = document.createElement('span');
    tag.className = 'grade-tag';
    tag.textContent = gradeLabel(t.grade);
    li.append(box, body, tag);
    li.addEventListener('click', () => { openId = t.id; renderList(); renderDetail(); });
    listEl.append(li);
  }
  if (!shown.length) {
    const li = document.createElement('li');
    li.textContent = kindEl.value === 'online'
      ? 'No online trophies: GTA VI has none — the whole list is single-player and offline.'
      : 'No trophies match these filters.';
    listEl.append(li);
  }
}

function renderDetail() {
  const t = doc.trophies.find((x) => x.id === openId);
  if (!t) {
    detailEl.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'detail-empty';
    p.textContent = 'Select a trophy to read its guide and sources.';
    detailEl.append(p);
    return;
  }
  detailEl.innerHTML = '';
  const h2 = document.createElement('h2');
  h2.textContent = trophyIsHidden(t) ? 'Hidden story trophy' : t.name;
  const desc = document.createElement('p');
  desc.className = 'desc';
  desc.textContent = trophyIsHidden(t) ? 'Hidden until earned.' : t.description;
  const meta = document.createElement('p');
  meta.className = 'meta';
  meta.textContent = `${gradeLabel(t.grade)} · ${kindLabel(t.kind)} · Roadmap stage ${t.stage}${t.missable ? ' · POSSIBLY MISSABLE' : ''} · ${earned.has(t.name) ? 'Earned ✓' : 'Not earned yet'}`;
  const guideTitle = document.createElement('h3');
  guideTitle.textContent = 'Guide';
  const guide = document.createElement('p');
  guide.className = 'guide';
  guide.textContent = t.guide;
  const srcTitle = document.createElement('h3');
  srcTitle.textContent = 'Sources';
  const srcList = document.createElement('ul');
  for (const s of sourceLinks(t)) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = s.name;
    li.append(a);
    srcList.append(li);
  }
  const earnedBtn = document.createElement('button');
  earnedBtn.type = 'button';
  earnedBtn.textContent = earned.has(t.name) ? 'Mark as not earned' : 'Mark as earned';
  earnedBtn.addEventListener('click', () => {
    if (earned.has(t.name)) earned.delete(t.name); else earned.add(t.name);
    saveEarned();
    renderProgress();
    renderList();
    renderDetail();
  });
  detailEl.append(h2, desc, meta, guideTitle, guide, srcTitle, srcList, earnedBtn);
}

function renderRoadmap() {
  const ol = document.getElementById('roadmapList');
  ol.replaceChildren();
  for (const step of doc.roadmap) {
    const li = document.createElement('li');
    const title = document.createElement('strong');
    title.textContent = `Stage ${step.stage}: ${step.title} `;
    const time = document.createElement('span');
    time.className = 'stage-time';
    time.textContent = `(${step.time})`;
    const text = document.createElement('p');
    text.textContent = step.text;
    li.append(title, time, text);
    ol.append(li);
  }
  const missable = doc.trophies.filter((t) => t.missable);
  document.getElementById('missableSummary').textContent = missable.length
    ? `Only ${missable.length} trophy is possibly missable: ${missable.map((t) => t.name).join(', ')}. ${missable[0].guide}`
    : 'No trophy is flagged missable.';
}

function renderSources() {
  const ul = document.getElementById('sourceList');
  ul.replaceChildren();
  for (const s of Object.values(doc.sources)) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = s.name;
    li.append(a);
    ul.append(li);
  }
}

function setView(view) {
  const roadmap = view === 'roadmap';
  document.getElementById('roadmapView').hidden = !roadmap;
  document.getElementById('checklistView').hidden = roadmap;
  document.getElementById('viewRoadmap').classList.toggle('active', roadmap);
  document.getElementById('viewChecklist').classList.toggle('active', !roadmap);
}

function applyParams() {
  if (params.get('view') === 'roadmap') setView('roadmap');
  if (params.get('grade')) gradeEl.value = params.get('grade');
  if (params.get('kind')) kindEl.value = params.get('kind');
  if (params.get('q')) searchEl.value = params.get('q');
  if (params.get('spoiler') === '1') spoilerEl.checked = true;
  if (params.get('spoiler') === '0') spoilerEl.checked = false;
  if (params.get('earned')) {
    const ids = params.get('earned').split(',').map((s) => Number(s.trim())).filter(Number.isInteger);
    for (const id of ids) {
      const t = doc.trophies.find((x) => x.id === id);
      if (t) earned.add(t.name);
    }
    saveEarned();
  }
  if (params.get('open')) {
    const id = Number(params.get('open'));
    if (doc.trophies.some((t) => t.id === id)) openId = id;
  }
}

document.getElementById('viewChecklist').addEventListener('click', () => setView('checklist'));
document.getElementById('viewRoadmap').addEventListener('click', () => setView('roadmap'));
for (const el of [searchEl, gradeEl, kindEl, earnedOnlyEl, spoilerEl]) {
  el.addEventListener('input', () => { saveSpoiler(); renderList(); renderDetail(); });
}
document.getElementById('export').addEventListener('click', () => {
  const payload = { game: 'Grand Theft Auto VI', exported: new Date().toISOString(), earned: [...earned].sort() };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
document.getElementById('import').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const names = Array.isArray(data) ? data : data.earned;
    const known = new Set(doc.trophies.map((t) => t.name));
    earned = new Set((names ?? []).filter((n) => known.has(n)));
    saveEarned();
    renderProgress();
    renderList();
    renderDetail();
  } catch {
    alert('That file is not a valid trophy-progress export.');
  }
  event.target.value = '';
});
document.getElementById('reset').addEventListener('click', () => {
  if (confirm('Clear all earned trophies?')) {
    earned = new Set();
    saveEarned();
    renderProgress();
    renderList();
    renderDetail();
  }
});

doc = await (await fetch('data/trophies.json')).json();
loadSaved();
spoilerEl.checked = localStorage.getItem(SPOILER_KEY) === '1';
applyParams();
renderRoadmap();
renderSources();
renderProgress();
renderList();
renderDetail();
