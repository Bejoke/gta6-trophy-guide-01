// Leonida Trophy Guide — tracker, filters, spoiler mode, roadmap, export/import.
// Data lives in data/trophies.json. Progress is saved in localStorage only;
// nothing leaves the browser except the file the user exports on purpose.

const DATA_URL = 'data/trophies.json';
const CHECKED_KEY = 'leonida-checked-v1';
const SPOILER_KEY = 'leonida-spoiler-v1';
// Deterministic demo progress, used by screenshots (?demo=1) and share links.
const DEMO_CHECKED = [2, 3, 4, 5, 8, 15, 20, 28, 35, 42, 44, 54];

const $ = (id) => document.getElementById(id);
const listEl = $('trophyList');
const hintEl = $('listHint');
const emptyEl = $('emptyState');
const detailEl = $('detailPanel');
const detailBody = $('detailBody');

let data = null;
let checked = new Set();
let filter = 'all';
let query = '';
let spoiler = false;
let view = 'checklist';
let selectedId = null;

function params() {
  return new URLSearchParams(window.location.search);
}

function loadChecked() {
  try {
    const raw = localStorage.getItem(CHECKED_KEY);
    if (!raw) return new Set();
    const ids = JSON.parse(raw);
    return new Set(Array.isArray(ids) ? ids.filter((n) => Number.isInteger(n)) : []);
  } catch {
    return new Set();
  }
}

function saveChecked() {
  try {
    localStorage.setItem(CHECKED_KEY, JSON.stringify([...checked].sort((a, b) => a - b)));
  } catch {
    // Storage full or unavailable (private mode): progress still works in memory.
  }
}

function loadSpoiler() {
  try {
    return localStorage.getItem(SPOILER_KEY) === '1';
  } catch {
    return false;
  }
}

function saveSpoiler() {
  try {
    localStorage.setItem(SPOILER_KEY, spoiler ? '1' : '0');
  } catch {
    // Ignore storage errors; the toggle still works in memory.
  }
}

function trophyById(id) {
  return data.trophies.find((t) => t.id === id) || null;
}

function isEarned(t) {
  return checked.has(t.id);
}

// Spoiler mode hides the name and description of story trophies that are
// flagged hidden until the player earns them.
function isHidden(t) {
  return spoiler && t.kind === 'story' && t.hidden && !isEarned(t);
}

function displayName(t) {
  return isHidden(t) ? 'Hidden trophy' : t.name;
}

function displayDesc(t) {
  return isHidden(t) ? 'Earn this trophy to reveal its name and description.' : t.description;
}

function matchesFilter(t) {
  if (filter === 'story') return t.kind === 'story';
  if (filter === 'missable') return t.missable === true;
  if (filter === 'collectibles') return t.kind === 'collectibles';
  if (filter === 'activities') return t.kind === 'activities';
  if (filter === 'online') return t.kind === 'online';
  return true;
}

function matchesQuery(t) {
  if (!query) return true;
  const hay = isHidden(t) ? '' : (t.name + ' ' + t.description).toLowerCase();
  return hay.includes(query);
}

function visibleTrophies() {
  return data.trophies.filter((t) => matchesFilter(t) && matchesQuery(t));
}

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function renderProgress() {
  const total = data.trophies.length;
  const done = checked.size;
  const pct = total ? Math.round((done / total) * 100) : 0;
  $('progressCount').textContent = done + ' / ' + total;
  $('progressPct').textContent = pct + '%';
  $('progressFill').style.width = pct + '%';
  const grades = ['platinum', 'gold', 'silver', 'bronze'];
  $('progressGrades').textContent = grades
    .map((g) => {
      const all = data.trophies.filter((t) => t.grade === g).length;
      const got = data.trophies.filter((t) => t.grade === g && isEarned(t)).length;
      return gradeLabel(g) + ' ' + got + '/' + all;
    })
    .join(' · ');
}

function trophyCard(t) {
  const li = document.createElement('li');
  li.className = 'trophy' + (isEarned(t) ? ' earned' : '');
  li.dataset.id = String(t.id);

  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = isEarned(t);
  box.setAttribute('aria-label', 'Earned: ' + displayName(t));
  box.addEventListener('click', (ev) => ev.stopPropagation());
  box.addEventListener('change', () => {
    if (box.checked) checked.add(t.id);
    else checked.delete(t.id);
    saveChecked();
    renderAll();
  });

  const body = document.createElement('div');
  const name = document.createElement('div');
  name.className = 'trophy-name' + (isHidden(t) ? ' spoiler-text' : '');
  name.textContent = displayName(t);
  const desc = document.createElement('div');
  desc.className = 'trophy-desc' + (isHidden(t) ? ' spoiler-text' : '');
  desc.textContent = displayDesc(t);
  const meta = document.createElement('div');
  meta.className = 'trophy-meta';
  const grade = document.createElement('span');
  grade.className = 'badge ' + t.grade;
  grade.textContent = gradeLabel(t.grade);
  meta.appendChild(grade);
  if (t.missable) {
    const miss = document.createElement('span');
    miss.className = 'badge missable';
    miss.textContent = 'Missable';
    meta.appendChild(miss);
  }
  const kind = document.createElement('span');
  kind.className = 'badge';
  kind.textContent = t.kind;
  meta.appendChild(kind);
  const stage = document.createElement('span');
  stage.className = 'badge';
  stage.textContent = 'Stage ' + t.stage;
  meta.appendChild(stage);
  if (isHidden(t)) {
    const hid = document.createElement('span');
    hid.className = 'badge spoiler-hidden';
    hid.textContent = 'Spoiler hidden';
    meta.appendChild(hid);
  }
  body.appendChild(name);
  body.appendChild(desc);
  body.appendChild(meta);

  const count = document.createElement('div');
  count.className = 'trophy-count';
  count.textContent = t.count ? 'Target: ' + t.count : '';

  li.appendChild(box);
  li.appendChild(body);
  li.appendChild(count);
  li.tabIndex = 0;
  li.setAttribute('role', 'button');
  li.setAttribute('aria-label', 'Open guide: ' + displayName(t));
  li.addEventListener('click', () => selectTrophy(t.id));
  li.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      selectTrophy(t.id);
    }
  });
  return li;
}

function renderList() {
  const shown = visibleTrophies();
  listEl.replaceChildren(...shown.map(trophyCard));
  const missableCount = data.trophies.filter((t) => t.missable).length;
  hintEl.textContent =
    'Showing ' + shown.length + ' of ' + data.trophies.length + ' trophies' +
    (filter === 'missable' ? ' — ' + missableCount + ' missable in total; finish them before the final mission.' : '') +
    (filter === 'online' ? ' — the official list has no online trophies.' : '');
  emptyEl.hidden = shown.length !== 0;
}

function stageChips(stage) {
  const wrap = document.createElement('div');
  wrap.className = 'stage-trophies';
  const members = data.trophies.filter((t) => t.stage === stage.stage);
  for (const t of members) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip' + (isEarned(t) ? ' earned' : '') + (t.missable ? ' missable' : '');
    chip.textContent = (isHidden(t) ? 'Hidden' : t.name) + (t.missable ? ' ⚠' : '');
    chip.addEventListener('click', () => selectTrophy(t.id));
    wrap.appendChild(chip);
  }
  return wrap;
}

function renderRoadmap() {
  const list = $('roadmapList');
  list.replaceChildren();
  for (const stage of data.roadmap) {
    const members = data.trophies.filter((t) => t.stage === stage.stage);
    const done = members.filter((t) => isEarned(t)).length;
    const li = document.createElement('li');
    li.className = 'stage';
    const head = document.createElement('h3');
    head.textContent = 'Stage ' + stage.stage + ' — ' + stage.title + ' ';
    const prog = document.createElement('span');
    prog.className = 'stage-progress';
    prog.textContent = done + '/' + members.length;
    head.appendChild(prog);
    const blurb = document.createElement('p');
    blurb.textContent = stage.blurb;
    li.appendChild(head);
    li.appendChild(blurb);
    li.appendChild(stageChips(stage));
    list.appendChild(li);
  }
}

function renderDetail() {
  if (selectedId === null) {
    detailEl.hidden = true;
    detailBody.replaceChildren();
    return;
  }
  const t = trophyById(selectedId);
  if (!t) {
    selectedId = null;
    detailEl.hidden = true;
    return;
  }
  detailEl.hidden = false;
  detailBody.replaceChildren();
  const title = document.createElement('h2');
  title.textContent = displayName(t);
  detailBody.appendChild(title);
  if (isHidden(t)) {
    const note = document.createElement('p');
    note.className = 'spoiler-note';
    note.textContent = 'This is a hidden story trophy. Its guide stays hidden until you earn it — turn the spoiler setting off, or tick it earned, to reveal it.';
    detailBody.appendChild(note);
    return;
  }
  const desc = document.createElement('p');
  desc.textContent = t.description;
  detailBody.appendChild(desc);
  const guide = document.createElement('p');
  guide.className = 'guide';
  guide.textContent = t.guide;
  detailBody.appendChild(guide);
  const source = document.createElement('p');
  source.className = 'source';
  source.textContent = 'Source: ' + t.source + '. Trophy name, description and grade are the official PlayStation list.';
  detailBody.appendChild(source);
  const dl = document.createElement('dl');
  const rows = [
    ['Grade', gradeLabel(t.grade)],
    ['Kind', t.kind],
    ['Missable', t.missable ? 'Yes — finish before the final mission' : 'No'],
    ['Roadmap', 'Stage ' + t.stage],
    ['Target', t.count ? String(t.count) : '—'],
    ['Status', isEarned(t) ? 'Earned' : 'Not earned yet'],
  ];
  for (const [k, v] of rows) {
    const dt = document.createElement('dt');
    dt.textContent = k;
    const dd = document.createElement('dd');
    dd.textContent = v;
    dl.appendChild(dt);
    dl.appendChild(dd);
  }
  detailBody.appendChild(dl);
}

function renderSources() {
  const ul = $('sourceList');
  ul.replaceChildren(...data.sources.map((s) => {
    const li = document.createElement('li');
    li.textContent = s;
    return li;
  }));
}

function renderTabs() {
  $('tabChecklist').classList.toggle('active', view === 'checklist');
  $('tabRoadmap').classList.toggle('active', view === 'roadmap');
  $('tabChecklist').setAttribute('aria-selected', String(view === 'checklist'));
  $('tabRoadmap').setAttribute('aria-selected', String(view === 'roadmap'));
  $('checklistView').hidden = view !== 'checklist';
  $('roadmapView').hidden = view !== 'roadmap';
}

function renderFilters() {
  for (const btn of document.querySelectorAll('#filters .filter')) {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  }
  $('spoilerToggle').checked = spoiler;
}

function renderAll() {
  renderProgress();
  renderTabs();
  renderFilters();
  renderList();
  renderRoadmap();
  renderDetail();
}

function selectTrophy(id) {
  selectedId = id;
  renderDetail();
  detailEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function exportProgress() {
  const payload = {
    game: 'Grand Theft Auto VI',
    exportedAt: new Date().toISOString(),
    checked: [...checked].sort((a, b) => a - b),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leonida-progress.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const ids = Array.isArray(parsed) ? parsed : parsed.checked;
      if (!Array.isArray(ids)) throw new Error('no checked list');
      const valid = new Set(data.trophies.map((t) => t.id));
      const next = new Set(ids.filter((n) => Number.isInteger(n) && valid.has(n)));
      checked = next;
      saveChecked();
      renderAll();
    } catch {
      alert('That file is not a Leonida progress export.');
    }
  };
  reader.readAsText(file);
}

function applyUrlParams() {
  const p = params();
  const v = p.get('view');
  if (v === 'roadmap' || v === 'checklist') view = v;
  const f = p.get('filter');
  if (['all', 'story', 'missable', 'collectibles', 'activities', 'online'].includes(f)) filter = f;
  const s = p.get('spoiler');
  if (s === 'on') spoiler = true;
  if (s === 'off') spoiler = false;
  if (p.get('demo') === '1') {
    for (const id of DEMO_CHECKED) checked.add(id);
    saveChecked();
  }
  const q = p.get('q');
  if (q) {
    query = q.toLowerCase();
    $('search').value = q;
  }
  const sel = p.get('select');
  if (sel && trophyById(Number(sel))) selectedId = Number(sel);
}

async function init() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error('Could not load ' + DATA_URL);
  data = await res.json();
  checked = loadChecked();
  spoiler = loadSpoiler();
  applyUrlParams();

  $('search').addEventListener('input', (ev) => {
    query = ev.target.value.trim().toLowerCase();
    renderList();
  });
  for (const btn of document.querySelectorAll('#filters .filter')) {
    btn.addEventListener('click', () => {
      filter = btn.dataset.filter;
      renderFilters();
      renderList();
    });
  }
  $('spoilerToggle').addEventListener('change', (ev) => {
    spoiler = ev.target.checked;
    saveSpoiler();
    renderAll();
  });
  $('tabChecklist').addEventListener('click', () => {
    view = 'checklist';
    renderTabs();
  });
  $('tabRoadmap').addEventListener('click', () => {
    view = 'roadmap';
    renderTabs();
  });
  $('exportBtn').addEventListener('click', exportProgress);
  $('importBtn').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', (ev) => {
    if (ev.target.files && ev.target.files[0]) importProgress(ev.target.files[0]);
    ev.target.value = '';
  });
  $('resetBtn').addEventListener('click', () => {
    if (window.confirm('Clear all checked trophies?')) {
      checked = new Set();
      selectedId = null;
      saveChecked();
      renderAll();
    }
  });
  $('detailClose').addEventListener('click', () => {
    selectedId = null;
    renderDetail();
  });

  renderSources();
  renderAll();
}

init().catch((err) => {
  listEl.replaceChildren();
  const li = document.createElement('li');
  li.textContent = 'Could not load the trophy list: ' + err.message;
  listEl.appendChild(li);
});
