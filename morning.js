/* ============================================================
   Morning Work — a calm morning routine for autistic classrooms.

   First launch asks which parts to do (Today's date, Yesterday &
   tomorrow, Weather, Feelings). The choice is remembered in
   localStorage and can be changed at any time with the header's
   ⚙️ Settings button. Every part carries a hold-to-skip.

   Palettes: the same 11 as the Work Cycle Timer, Math Playground
   and the Toolshed site. This script applies the shared theme
   (localStorage["workCycleTimer.settings.v1"].theme) before first
   paint and injects the header picker. Keep THEMES in sync with
   app.js (timer), math.js (math) and site.js (site).

   Our settings (chosen parts, today's answers, sound) live in
   localStorage["workCycleTimer.morning.v1"] — a separate key so
   the timer, math and site never see fields they don't know.
   The chosen parts persist forever; the answers reset when the
   calendar day changes, so every morning starts with a fresh
   sheet.

   Design rules (from the research on autistic morning routines):
   no timers, no failure states, no wrong answers in the
   check-ins; one action at a time; player-paced; a Skip on every
   part; wrong calendar answers get gentle neutral text and a
   kindly highlighted answer after two tries — never a buzzer.
   ============================================================ */

'use strict';

const STORAGE_KEY = 'workCycleTimer.settings.v1';   // shared: theme + motifs
const MORNING_KEY = 'workCycleTimer.morning.v1';    // ours: parts, answers, sound

/* Same 11 palettes as the timer's Settings → Display (app.js THEMES).
   chips = [page background, surface, text, accent, second accent]. */
const THEMES = [
  { id: 'calm',     name: 'Calm (soft blue & green)',   chips: ['#f2f6f8', '#ffffff', '#33414d', '#4d84a6', '#628f5d'] },
  { id: 'lavender', name: 'Lavender (soft purple)',     chips: ['#f5f3fb', '#ffffff', '#3d3a52', '#7a6fc0', '#6a9a76'] },
  { id: 'mint',     name: 'Mint (fresh green)',         chips: ['#eef8f3', '#ffffff', '#2f4640', '#35837e', '#6f9a58'] },
  { id: 'peach',    name: 'Peach (warm apricot)',       chips: ['#fdf6ef', '#fffdfb', '#4d3f34', '#c26a3c', '#7a9a5a'] },
  { id: 'rose',     name: 'Rose (soft pink)',           chips: ['#fdf4f6', '#ffffff', '#4f3540', '#c25f7e', '#6f9466'] },
  { id: 'ocean',    name: 'Ocean (aqua blue)',          chips: ['#eef8fa', '#ffffff', '#2c4750', '#2f87a3', '#5f9a6a'] },
  { id: 'low',      name: 'Low contrast (very gentle)', chips: ['#eef1f3', '#f6f8f9', '#5b6570', '#94b4c3', '#a9c5a5'] },
  { id: 'high',     name: 'High contrast',              chips: ['#000000', '#0b0d10', '#ffffff', '#56e0ff', '#b7ff5e'] },
  { id: 'dark',     name: 'Dark (slate)',               chips: ['#151a20', '#1e242b', '#e7edf2', '#6fa9c7', '#8fbf88'] },
  { id: 'midnight', name: 'Midnight (deep blue)',       chips: ['#0a0f1e', '#121a30', '#e3e9f7', '#6fa8ff', '#67d6a5'] },
  { id: 'warm',     name: 'Warm dark (sepia)',          chips: ['#211a14', '#2b221a', '#f0e6da', '#d9a05f', '#93b877'] }
];

/* The parts of the routine, in run order. First launch picks
   which of these are on; Settings can change the pick later. */
const PARTS = [
  { id: 'date',     emoji: '\uD83D\uDCC5', name: "Today's date",
    desc: 'Fill in the day of the week, the date and the month — one blank at a time.' },
  { id: 'around',   emoji: '\uD83D\uDDD3\uFE0F', name: 'Yesterday & tomorrow',
    desc: 'What day was it yesterday, and what day will it be tomorrow?' },
  { id: 'weather',  emoji: '\uD83C\uDF24\uFE0F', name: 'Weather',
    desc: 'Look outside and choose today\u2019s weather. Every choice is right.' },
  { id: 'feelings', emoji: '\uD83D\uDC9B', name: 'Feelings',
    desc: 'Find your feeling on the four-color Zones of Regulation chart. Every zone is okay.' }
];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
                'August', 'September', 'October', 'November', 'December'];

/* Weather is a check-in, not a quiz: any tile may be chosen.
   Feelings use the Zones of Regulation chart — the four coloured
   zones with their feelings placed the way the framework places
   them (The Zones of Regulation®, Kuypers — official 2024
   visuals). All four zones are okay; the chart never grades. */
const WEATHER = [
  { id: 'sunny',   emoji: '\u2600\uFE0F',  name: 'Sunny' },
  { id: 'cloudy',  emoji: '\u26C5',        name: 'Cloudy' },
  { id: 'rainy',   emoji: '\uD83C\uDF27\uFE0F', name: 'Rainy' },
  { id: 'snowy',   emoji: '\u2744\uFE0F',  name: 'Snowy' },
  { id: 'windy',   emoji: '\uD83C\uDF2C\uFE0F', name: 'Windy' },
  { id: 'stormy',  emoji: '\u26C8\uFE0F',  name: 'Stormy' }
];

/* The four zones, in chart order. hint = the framework's own
   caption for the zone; bg/border/text/deep are the zone's fixed
   colours (semantic — they deliberately do not follow the
   palette). Feelings follow the official 2024 zone placements. */
const ZONES = [
  { id: 'blue', name: 'Blue zone', dot: '#4a90d9',
    hint: 'Low levels of energy and down feelings',
    bg: '#dcebf9', border: '#5b8db8', text: '#274a66', deep: '#3f6f96',
    feelings: [
      { id: 'sad',     name: 'Sad',     emoji: '\uD83D\uDE22' },
      { id: 'tired',   name: 'Tired',   emoji: '\uD83D\uDE34' },
      { id: 'bored',   name: 'Bored',   emoji: '\uD83D\uDE11' },
      { id: 'sick',    name: 'Sick',    emoji: '\uD83E\uDD12' },
      { id: 'hurt',    name: 'Hurt',    emoji: '\uD83E\uDD15' }
    ] },
  { id: 'green', name: 'Green zone', dot: '#45a163',
    hint: 'Calm energy and a sense of control',
    bg: '#ddf2e4', border: '#5da074', text: '#2f5b41', deep: '#4a8a61',
    feelings: [
      { id: 'happy',   name: 'Happy',   emoji: '\uD83D\uDE0A' },
      { id: 'calm',    name: 'Calm',    emoji: '\uD83D\uDE0C' },
      { id: 'focused', name: 'Focused', emoji: '\uD83C\uDFAF' },
      { id: 'relaxed', name: 'Relaxed', emoji: '\uD83E\uDDD8' },
      { id: 'proud',   name: 'Proud',   emoji: '\u2B50' }
    ] },
  { id: 'yellow', name: 'Yellow zone', dot: '#e0b32a',
    hint: 'Higher energy and stronger feelings',
    bg: '#fdf4d2', border: '#d3a928', text: '#6b5410', deep: '#9a7b12',
    feelings: [
      { id: 'worried',    name: 'Worried',    emoji: '\uD83D\uDE1F' },
      { id: 'frustrated', name: 'Frustrated', emoji: '\uD83D\uDE23' },
      { id: 'silly',      name: 'Silly',      emoji: '\uD83D\uDE1C' },
      { id: 'excited',    name: 'Excited',    emoji: '\uD83E\uDD29' },
      { id: 'nervous',    name: 'Nervous',    emoji: '\uD83D\uDE2C' }
    ] },
  { id: 'red', name: 'Red zone', dot: '#d4615a',
    hint: 'Extremely high energy and strongest feelings',
    bg: '#fbe2e0', border: '#cf6a63', text: '#7a2f2a', deep: '#b3514a',
    feelings: [
      { id: 'angry',          name: 'Angry',          emoji: '\uD83D\uDE20' },
      { id: 'terrified',      name: 'Terrified',      emoji: '\uD83D\uDE31' },
      { id: 'panicked',       name: 'Panicked',       emoji: '\uD83D\uDE30' },
      { id: 'overjoyed',      name: 'Overjoyed',      emoji: '\uD83D\uDE06' },
      { id: 'out-of-control', name: 'Out of control', emoji: '\uD83C\uDF00' }
    ] }
];

function findFeeling(id) {
  for (const z of ZONES) {
    const f = z.feelings.find((x) => x.id === id);
    if (f) return { zone: z, feeling: f };
  }
  return null;
}

/* ---------- Shared settings (theme + motifs) ---------- */

function readTheme() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && THEMES.some((t) => t.id === s.theme)) return s.theme;
    }
  } catch (err) { /* storage blocked — fall through */ }
  return 'calm';
}

/* Patch single fields of the shared setting, never overwrite the
   rest (the timer's durations, music, etc.). */
function patchSettings(fields) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const s = raw ? JSON.parse(raw) : {};
    if (!s || typeof s !== 'object') return false;
    Object.assign(s, fields);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    return true;
  } catch (err) {
    return false;
  }
}

function writeTheme(id) { return patchSettings({ theme: id }); }

function motifsOn() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.homeMotifs === false) return false;
    }
  } catch (err) { /* default on */ }
  return true;
}

function syncMotifs() {
  const on = motifsOn();
  document.documentElement.classList.toggle('motifs-off', !on);
  const btn = document.getElementById('motifBtn');
  if (btn) {
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    const state = document.getElementById('motifState');
    if (state) state.textContent = on ? 'On' : 'Off';
  }
}

function applyTheme(id) {
  document.documentElement.dataset.theme = id;
  syncPicker(id);
}

function syncPicker(id) {
  const panel = document.getElementById('themePanel');
  if (!panel) return;
  for (const row of panel.querySelectorAll('.theme-opt')) {
    const on = row.dataset.theme === id;
    row.classList.toggle('active', on);
    row.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
}

function closePanel() {
  const panel = document.getElementById('themePanel');
  const btn = document.getElementById('themeBtn');
  if (panel) panel.hidden = true;
  if (btn) btn.setAttribute('aria-expanded', 'false');
}

function togglePanel() {
  const panel = document.getElementById('themePanel');
  const btn = document.getElementById('themeBtn');
  if (!panel) return;
  const opening = panel.hidden;
  panel.hidden = !opening;
  if (btn) btn.setAttribute('aria-expanded', opening ? 'true' : 'false');
}

/* Build the header 🎨 button + panel once the header exists. */
function injectPicker() {
  const head = document.querySelector('.site-head');
  if (!head || document.getElementById('themeWrap')) return;

  const wrap = document.createElement('div');
  wrap.className = 'theme-wrap';
  wrap.id = 'themeWrap';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'theme-btn';
  btn.id = 'themeBtn';
  btn.setAttribute('aria-haspopup', 'true');
  btn.setAttribute('aria-expanded', 'false');
  btn.title = 'Change the color palette';
  btn.setAttribute('aria-label', 'Change the color palette');
  btn.innerHTML = '<span aria-hidden="true">\uD83C\uDFA8</span><span>Palette</span>';

  const panel = document.createElement('div');
  panel.className = 'theme-panel';
  panel.id = 'themePanel';
  panel.hidden = true;
  panel.setAttribute('role', 'group');
  panel.setAttribute('aria-label', 'Color palettes');

  for (const t of THEMES) {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'theme-opt';
    row.dataset.theme = t.id;
    row.setAttribute('aria-pressed', 'false');

    const name = document.createElement('span');
    name.className = 'theme-name';
    name.textContent = t.name;

    const chips = document.createElement('span');
    chips.className = 'theme-chips';
    chips.setAttribute('aria-hidden', 'true');
    for (const hex of t.chips) {
      const chip = document.createElement('span');
      chip.className = 'theme-chip';
      chip.style.background = hex;
      chips.appendChild(chip);
    }

    row.append(name, chips);
    row.addEventListener('click', () => {
      writeTheme(t.id);
      applyTheme(t.id);
      closePanel();
    });
    panel.appendChild(row);
  }

  /* Background patterns switch — same homeMotifs setting as the
     site's home page, so one switch runs both. */
  const motifBtn = document.createElement('button');
  motifBtn.type = 'button';
  motifBtn.className = 'motif-btn';
  motifBtn.id = 'motifBtn';
  motifBtn.setAttribute('aria-pressed', 'true');
  motifBtn.title = 'Gentle background patterns';
  const motifLabel = document.createElement('span');
  motifLabel.textContent = 'Background patterns';
  const motifState = document.createElement('span');
  motifState.className = 'motif-state';
  motifState.id = 'motifState';
  motifState.textContent = 'On';
  motifBtn.append(motifLabel, motifState);
  motifBtn.addEventListener('click', () => {
    patchSettings({ homeMotifs: !motifsOn() });
    syncMotifs();
  });
  panel.appendChild(motifBtn);

  btn.addEventListener('click', togglePanel);
  wrap.append(btn, panel);
  head.appendChild(wrap);

  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target)) closePanel();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePanel();
  });

  syncPicker(readTheme());
  syncMotifs();
}

/* ---------- Our settings: chosen parts + today's answers ---------- */

function defaultState() {
  return {
    setupDone: false,
    parts: { date: true, around: true, weather: true, feelings: true },
    day: '',
    answers: {},
    sound: true
  };
}

function todayKey() {
  const d = new Date();
  const p = (n) => (n < 10 ? '0' : '') + n;
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

function readState() {
  let s = defaultState();
  try {
    const raw = localStorage.getItem(MORNING_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p && typeof p === 'object') s = Object.assign(s, p);
    }
  } catch (err) { /* storage blocked — defaults */ }

  /* Validate: known parts only, missing parts default to on (so a
     newly added part is on for everyone). */
  const stored = (s.parts && typeof s.parts === 'object') ? s.parts : {};
  const parts = {};
  for (const p of PARTS) parts[p.id] = stored[p.id] !== false;
  s.parts = parts;
  if (typeof s.setupDone !== 'boolean') s.setupDone = false;
  if (typeof s.sound !== 'boolean') s.sound = true;
  if (!s.answers || typeof s.answers !== 'object') s.answers = {};

  /* A new day means a fresh sheet. The chosen parts always stay. */
  if (s.day !== todayKey()) {
    s.answers = {};
    s.day = todayKey();
    try { localStorage.setItem(MORNING_KEY, JSON.stringify(s)); } catch (err) { /* private mode */ }
  }
  return s;
}

function patchState(fields) {
  const s = Object.assign(readState(), fields);
  try { localStorage.setItem(MORNING_KEY, JSON.stringify(s)); } catch (err) { /* private mode */ }
  return s;
}

function complete(partId, answers) {
  if (partId === 'date') {
    const d = answers.date;
    return !!(d && d.day && d.num && d.month);
  }
  if (partId === 'around') {
    const r = answers.around;
    return !!(r && r.yday && r.tday);
  }
  if (partId === 'weather') return !!answers.weather;
  if (partId === 'feelings') return !!answers.feelings;
  return false;
}

/* ---------- Gentle sound (Web Audio — never starts on load) ---------- */

let actx = null;

function soundOn() { return readState().sound; }

function ensureAudio() {
  if (!soundOn()) return null;
  try {
    if (!actx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      actx = new Ctx();
    }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  } catch (err) {
    return null;
  }
}

function tone(ctx, freq, at, dur, vol) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, ctx.currentTime + at);
  gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + at + 0.02);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + at + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime + at);
  osc.stop(ctx.currentTime + at + dur + 0.05);
}

/* correct = soft two-note rise; done = small arpeggio; reveal is a
   kind "here it is". Wrong is deliberately silent (no failure
   sound — ever). */
function chime(kind) {
  const ctx = ensureAudio();
  if (!ctx) return;
  if (kind === 'correct') {
    tone(ctx, 660, 0, 0.14, 0.07);
    tone(ctx, 880, 0.12, 0.18, 0.06);
  } else if (kind === 'done') {
    tone(ctx, 523, 0, 0.14, 0.07);
    tone(ctx, 659, 0.13, 0.14, 0.07);
    tone(ctx, 784, 0.26, 0.24, 0.06);
  } else if (kind === 'reveal') {
    tone(ctx, 523, 0, 0.16, 0.05);
    tone(ctx, 659, 0.14, 0.2, 0.045);
  }
}

/* ---------- Hold-to-activate (kid-safe buttons) ----------
   Same helper as the timer: a continuous press for `ms`
   milliseconds; releasing early does nothing. Works with mouse,
   touch and keyboard (Enter / Space held down). */

function makeHoldable(el, ms, action) {
  let timeout = null;
  let busy = false;   // stays true after firing until release

  function start(e) {
    if (busy) return;
    if (el.getAttribute('aria-disabled') === 'true') return;
    if (e.type === 'pointerdown' && typeof e.button === 'number' && e.button !== 0) return;
    busy = true;
    el.classList.add('holding');
    timeout = setTimeout(() => {
      timeout = null;
      el.classList.remove('holding');
      action();
    }, ms);
  }

  function cancel() {
    if (timeout) { clearTimeout(timeout); timeout = null; }
    busy = false;
    el.classList.remove('holding');
  }

  el.addEventListener('pointerdown', start);
  el.addEventListener('pointerup', cancel);
  el.addEventListener('pointercancel', cancel);
  el.addEventListener('pointerleave', cancel);
  el.addEventListener('blur', cancel);
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); start(e); }
  });
  el.addEventListener('keyup', cancel);
  el.addEventListener('click', (e) => e.preventDefault());   // hold fires only
}

/* Build a header/stage hold button. kind picks the emoji. */
function makeHoldBtn(kind, label, ms, action) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'hold-btn';
  btn.id = kind + 'Btn';
  btn.style.setProperty('--hold-dur', (ms / 1000) + 's');
  btn.title = label + ' (hold ' + (ms / 1000) + ' second' + (ms === 1000 ? '' : 's') + ')';
  btn.setAttribute('aria-label', btn.title);

  const emoji = kind === 'home' ? '\uD83C\uDFE0' : kind === 'skip' ? '➡️'
    : kind === 'start' ? '▶️' : kind === 'again' ? '\uD83D\uDD04' : '⚙️';
  const span = document.createElement('span');
  span.className = 'hold-emoji';
  span.setAttribute('aria-hidden', 'true');
  span.textContent = emoji;
  const text = document.createElement('span');
  text.textContent = label;

  const track = document.createElement('span');
  track.className = 'hold-track';
  track.setAttribute('aria-hidden', 'true');
  const fill = document.createElement('span');
  fill.className = 'hold-fill';
  track.appendChild(fill);

  btn.append(span, text, track);
  makeHoldable(btn, ms, action);
  return btn;
}

/* ---------- Shared page wiring ---------- */

/* Build the brand + sound/settings/home controls (the palette
   picker arrives separately via injectPicker). */
function injectHeader() {
  const head = document.querySelector('.site-head');
  if (!head || head.dataset.ready) return;
  head.dataset.ready = '1';

  const brand = document.createElement('a');
  brand.className = 'brand';
  brand.href = 'index.html';
  brand.innerHTML = 'Morning Work <span class="brand-sub">\u00B7 Toolshed</span>';
  head.appendChild(brand);

  const tools = document.createElement('div');
  tools.className = 'head-tools';

  /* Sound on/off — a plain tap (it only changes a preference). */
  const snd = document.createElement('button');
  snd.type = 'button';
  snd.className = 'theme-btn';
  snd.id = 'soundBtn';
  snd.addEventListener('click', () => {
    patchState({ sound: !soundOn() });
    syncSoundBtn();
    if (soundOn()) chime('correct');   // confirm you turned it on
  });
  tools.appendChild(snd);

  /* Settings — opens the part chooser so the routine can change. */
  const set = document.createElement('button');
  set.type = 'button';
  set.className = 'theme-btn';
  set.id = 'settingsBtn';
  set.title = 'Change which parts we do';
  set.setAttribute('aria-label', set.title);
  set.innerHTML = '<span aria-hidden="true">⚙️</span><span>Settings</span>';
  set.addEventListener('click', openChooser);
  tools.appendChild(set);

  tools.appendChild(makeHoldBtn('home', 'Home', 1000, () => { location.href = 'index.html'; }));
  head.appendChild(tools);
  syncSoundBtn();   // only once the button is in the document
}

function syncSoundBtn() {
  const b = document.getElementById('soundBtn');
  if (!b) return;
  const on = soundOn();
  b.setAttribute('aria-pressed', on ? 'true' : 'false');
  b.title = (on ? 'Turn sound off' : 'Turn sound on');
  b.setAttribute('aria-label', b.title);
  b.innerHTML = '<span aria-hidden="true">' + (on ? '\uD83D\uDD0A' : '\uD83D\uDD07') +
    '</span><span>' + (on ? 'Sound on' : 'Sound off') + '</span>';
}

/* Footer phrase — same wording as the site's ten pages. */
function injectFooter() {
  const foot = document.querySelector('.site-foot');
  if (!foot || foot.dataset.ready) return;
  foot.dataset.ready = '1';
  foot.innerHTML =
    '<a href="index.html">Home</a> \u00B7 Staff resources for The Learning Toolshed \u00B7 ' +
    '<a href="https://swankymcgee.github.io/">The Learning Toolshed</a> \u00B7 App state: November 2026';
}

/* Round progress dots: `done` filled, `current` outlined. */
function renderProgress(el, done, total) {
  el.textContent = '';
  for (let i = 0; i < total; i++) {
    const dot = document.createElement('span');
    dot.className = 'pdot' + (i < done ? ' done' : i === done ? ' now' : '');
    el.appendChild(dot);
  }
}

/* ---------- Small date helpers ---------- */

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function offsetDay(delta) {
  const d = new Date();
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + delta);
  return DAYS[x.getDay()];
}

/* The real value behind a blank — also what Skip fills in. */
function realValue(key) {
  const d = new Date();
  if (key === 'day') return DAYS[d.getDay()];
  if (key === 'num') return ordinal(d.getDate());
  if (key === 'month') return MONTHS[d.getMonth()];
  if (key === 'yday') return offsetDay(-1);
  if (key === 'tday') return offsetDay(1);
  return '';
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr;
}

/* Three big choices: the answer plus two close, plausible ones
   (the neighbouring day, the neighbouring month, ±1 on the date). */
function choiceSet(kind, correct) {
  let distract = [];
  if (kind === 'day') {
    const i = DAYS.indexOf(correct);
    distract = [DAYS[(i + 6) % 7], DAYS[(i + 1) % 7]];
  } else if (kind === 'month') {
    const i = MONTHS.indexOf(correct);
    distract = [MONTHS[(i + 11) % 12], MONTHS[(i + 1) % 12]];
  } else {
    const n = parseInt(correct, 10);
    const cands = [n - 1, n + 1, n - 2, n + 2].filter((x) => x >= 1 && x <= 31);
    distract = [ordinal(cands[0]), ordinal(cands[1])];
  }
  return shuffle([correct].concat(distract));
}

/* ---------- View switching ---------- */

const els = {};

function cacheEls() {
  for (const id of ['chooser', 'run', 'done', 'partGrid', 'chooserActions', 'chooserNote',
                    'partLabel', 'progress', 'partTitle', 'prompt', 'sentence',
                    'choices', 'feedback', 'actions', 'recap', 'doneActions']) {
    els[id] = document.getElementById(id);
  }
}

function show(name) {
  for (const id of ['chooser', 'run', 'done']) els[id].hidden = (id !== name);
}

/* ---------- The chooser (first launch + Settings) ---------- */

function renderChooser() {
  const s = readState();
  const grid = els.partGrid;
  grid.textContent = '';

  for (const p of PARTS) {
    const on = s.parts[p.id];
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'part-card';
    card.dataset.part = p.id;
    card.setAttribute('aria-pressed', on ? 'true' : 'false');
    card.innerHTML =
      '<span class="pc-top"><span class="pc-emoji" aria-hidden="true">' + p.emoji +
      '</span><span class="pc-name">' + p.name + '</span></span>' +
      '<span class="pc-desc">' + p.desc + '</span>' +
      '<span class="pc-check">' + (on ? '✓ Included' : 'Not included') + '</span>';
    card.addEventListener('click', () => togglePart(p.id));
    grid.appendChild(card);
  }

  renderChooserActions();
}

function togglePart(id) {
  const s = readState();
  const parts = Object.assign({}, s.parts);
  parts[id] = !parts[id];
  patchState({ parts });

  /* Update in place — rebuilding would drop keyboard focus. */
  const card = els.partGrid.querySelector('[data-part="' + id + '"]');
  if (card) {
    card.setAttribute('aria-pressed', parts[id] ? 'true' : 'false');
    const check = card.querySelector('.pc-check');
    if (check) check.textContent = parts[id] ? '✓ Included' : 'Not included';
  }
  syncChooserStart();
}

function anyPartOn() {
  const s = readState();
  return PARTS.some((p) => s.parts[p.id]);
}

function syncChooserStart() {
  const none = !anyPartOn();
  els.chooserNote.hidden = !none;
  const start = document.getElementById('startBtn');
  if (start) start.setAttribute('aria-disabled', none ? 'true' : 'false');
}

function renderChooserActions() {
  const s = readState();
  const box = els.chooserActions;
  box.textContent = '';

  const start = makeHoldBtn('start', 'Start morning work', 1000, startAction);
  start.classList.add('primary');
  box.appendChild(start);

  /* Once the routine exists, Settings can back out of the chooser
     without restarting anything. */
  if (s.setupDone) {
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'btn';
    back.textContent = 'Back';
    back.addEventListener('click', resumeView);
    box.appendChild(back);
  }
  syncChooserStart();
}

function startAction() {
  if (!anyPartOn()) { syncChooserStart(); return; }
  patchState({ setupDone: true });
  buildOrder();
  let i = firstIncomplete();
  /* Pressing Start when today's sheet is already finished means
     "give me a fresh one" — the parts stay as they are. */
  if (i >= order.length) {
    patchState({ answers: {} });
    i = 0;
  }
  idx = i;
  show('run');
  renderPart();
}

function openChooser() {
  renderChooser();
  show('chooser');
}

function resumeView() {
  const s = readState();
  if (!s.setupDone) { openChooser(); return; }
  buildOrder();
  const i = firstIncomplete();
  if (i >= order.length) { showDone(false); return; }
  idx = i;
  show('run');
  renderPart();
}

/* ---------- The run: one part at a time ---------- */

let order = [];
let idx = 0;
let fill = null;          // current blank-filling state, or null

function buildOrder() {
  const s = readState();
  order = PARTS.filter((p) => s.parts[p.id]).map((p) => p.id);
}

function firstIncomplete() {
  const a = readState().answers;
  for (let i = 0; i < order.length; i++) {
    if (!complete(order[i], a)) return i;
  }
  return order.length;
}

function feedback(kind, text) {
  els.feedback.className = 'feedback' + (kind ? ' ' + kind : '');
  els.feedback.textContent = text;
}

function setActions(list) {
  els.actions.textContent = '';
  for (const b of list) els.actions.appendChild(b);
}

function mkNext() {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'btn primary';
  b.textContent = 'Next →';
  b.addEventListener('click', () => {
    if (b.getAttribute('aria-disabled') === 'true') return;
    nextStep();
  });
  return b;
}

function mkSkip() {
  return makeHoldBtn('skip', 'Skip', 1000, skipPart);
}

/* A blank span inside the sentence: dashed box until filled. */
function sp(key, val) {
  return '<span class="blank' + (val ? ' filled' : '') + '" id="blank-' + key + '">' +
    (val || '…') + '</span>';
}

function dateSentence(a) {
  const d = a.date || {};
  return 'Today is ' + sp('day', d.day) + ' the ' + sp('num', d.num) +
    ' of ' + sp('month', d.month) + '.';
}

function aroundSentence(a) {
  const r = a.around || {};
  return '<div class="sentence-line">Yesterday was ' + sp('yday', r.yday) + '.</div>' +
    '<div class="sentence-line">Tomorrow will be ' + sp('tday', r.tday) + '.</div>';
}

function renderPart() {
  const id = order[idx];
  fill = null;
  const s = readState();
  const info = PARTS.find((p) => p.id === id);

  els.partLabel.textContent = 'Part ' + (idx + 1) + ' of ' + order.length;
  els.partTitle.textContent = info.name;
  renderProgress(els.progress, idx, order.length);
  feedback('', '');
  els.choices.textContent = '';
  els.choices.className = 'choices';
  els.sentence.textContent = '';

  if (id === 'date' || id === 'around') {
    els.prompt.textContent = id === 'date'
      ? 'What is today’s date?'
      : 'What day was it yesterday — and what day will it be tomorrow?';
    els.sentence.innerHTML = id === 'date' ? dateSentence(s.answers) : aroundSentence(s.answers);

    const blanks = id === 'date'
      ? [{ key: 'day', kind: 'day' }, { key: 'num', kind: 'num' }, { key: 'month', kind: 'month' }]
      : [{ key: 'yday', kind: 'day' }, { key: 'tday', kind: 'day' }];
    const ans = s.answers[id] || {};
    const i = blanks.findIndex((b) => !ans[b.key]);

    if (i === -1) {            // resumed with every blank already filled
      fill = null;
      setActions([mkNext()]);
      return;
    }
    fill = {
      partId: id, blanks, idx: i, key: blanks[i].key, kind: blanks[i].kind,
      correct: realValue(blanks[i].key), tries: 0, nudged: false, solved: false,
      hint: id === 'date'
        ? 'Not quite — look at the calendar and try again.'
        : 'Not quite — count the days. Try again.'
    };
    renderBlankChoices();
    setActions([mkSkip()]);
    return;
  }

  /* Check-in parts: any pick is right; Next unlocks after one. */
  const chosen = id === 'weather' ? s.answers.weather : s.answers.feelings;
  if (id === 'weather') {
    els.prompt.textContent = 'Look outside — what is the weather like today?';
    buildTiles(WEATHER, chosen, 'weather');
  } else {
    els.prompt.textContent = 'How are you feeling this morning? Tap your feeling — every zone is okay.';
    buildZoneChart(chosen);
  }

  const next = mkNext();
  if (chosen) {
    /* resumed with today's pick already made */
  } else {
    next.setAttribute('aria-disabled', 'true');
  }
  setActions([next, mkSkip()]);
}

function renderBlankChoices() {
  const vals = choiceSet(fill.kind, fill.correct);
  els.choices.textContent = '';
  for (const v of vals) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'choice';
    b.textContent = v;
    b.addEventListener('click', () => pickChoice(b, v));
    els.choices.appendChild(b);
  }
}

function pickChoice(btn, val) {
  if (!fill || fill.solved) return;

  if (fill.nudged && val !== fill.correct) {
    feedback('neutral', 'Tap the highlighted one.');
    return;
  }

  if (val === fill.correct) {
    fill.solved = true;
    chime('correct');
    for (const c of els.choices.children) {
      c.setAttribute('aria-disabled', 'true');
      c.classList.add(c === btn ? 'correct' : 'soft');
    }
    saveAnswer(fill.key, val);
    const span = document.getElementById('blank-' + fill.key);
    if (span) { span.textContent = val; span.classList.add('filled'); }
    feedback('', fill.key === 'num' ? 'Yes — the ' + val + '.' : 'Yes — ' + val + '.');
    setActions([mkNext()]);
    return;
  }

  fill.tries++;
  if (fill.tries >= 2) {
    /* Kindly show it after two tries — highlight, never reveal
       without a tap, so the student still finds it themselves. */
    fill.nudged = true;
    for (const c of els.choices.children) {
      if (c.textContent === fill.correct) c.classList.add('nudge');
    }
    feedback('neutral', 'Here it is — tap the highlighted one.');
  } else {
    feedback('neutral', fill.hint);
  }
}

function buildTiles(opts, chosen, partId) {
  els.choices.textContent = '';
  for (const opt of opts) {
    const t = document.createElement('button');
    t.type = 'button';
    t.className = 'choice tile';
    t.dataset.val = opt.id;
    t.setAttribute('aria-pressed', chosen === opt.id ? 'true' : 'false');
    t.innerHTML = '<span class="t-emoji" aria-hidden="true">' + opt.emoji + '</span>' +
      '<span class="t-name">' + opt.name + '</span>';
    t.addEventListener('click', () => pickTile(opt, partId));
    els.choices.appendChild(t);
  }
}

function pickTile(opt, partId) {
  const s = readState();
  const answers = Object.assign({}, s.answers);
  answers[partId] = opt.id;
  patchState({ answers });

  for (const t of els.choices.children) {
    t.setAttribute('aria-pressed', t.dataset.val === opt.id ? 'true' : 'false');
  }
  chime('correct');
  feedback('', partId === 'weather'
    ? opt.name + ' — thanks for looking outside.'
    : opt.name + ' — thanks for sharing.');

  const next = els.actions.querySelector('.btn.primary');
  if (next) next.setAttribute('aria-disabled', 'false');
}

/* The four-zone feelings chart: every zone visible at once, its
   feelings placed inside it the way the framework places them. */
function buildZoneChart(chosen) {
  els.choices.className = 'choices zone-chart';
  els.choices.textContent = '';

  for (const z of ZONES) {
    const panel = document.createElement('div');
    panel.className = 'zone';
    panel.style.setProperty('--z-bg', z.bg);
    panel.style.setProperty('--z-border', z.border);
    panel.style.setProperty('--z-text', z.text);
    panel.style.setProperty('--z-deep', z.deep);
    panel.style.setProperty('--z-dot', z.dot);

    const head = document.createElement('div');
    head.className = 'zone-head';
    head.innerHTML = '<span class="zone-dot" aria-hidden="true"></span>' +
      '<span class="zone-name">' + z.name + '</span>';
    const hint = document.createElement('p');
    hint.className = 'zone-hint';
    hint.textContent = z.hint;
    panel.append(head, hint);

    const row = document.createElement('div');
    row.className = 'zone-feelings';
    row.setAttribute('role', 'group');
    row.setAttribute('aria-label', z.name + ' feelings');
    for (const f of z.feelings) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'feeling';
      b.dataset.id = f.id;
      b.setAttribute('aria-pressed', chosen === f.id ? 'true' : 'false');
      b.innerHTML = '<span class="f-emoji" aria-hidden="true">' + f.emoji +
        '</span><span class="f-name">' + f.name + '</span>';
      b.addEventListener('click', () => pickFeeling(z, f));
      row.appendChild(b);
    }
    panel.appendChild(row);
    els.choices.appendChild(panel);
  }

  const credit = document.createElement('p');
  credit.className = 'zone-credit';
  credit.textContent = 'Feeling zones follow The Zones of Regulation®.';
  els.choices.appendChild(credit);
}

function pickFeeling(zone, feeling) {
  const s = readState();
  const answers = Object.assign({}, s.answers);
  answers.feelings = feeling.id;
  patchState({ answers });

  for (const b of els.choices.querySelectorAll('.feeling')) {
    b.setAttribute('aria-pressed', b.dataset.id === feeling.id ? 'true' : 'false');
  }
  chime('correct');
  feedback('', feeling.name + ' — ' + zone.name.toLowerCase() + '. Thanks for sharing.');

  const next = els.actions.querySelector('.btn.primary');
  if (next) next.setAttribute('aria-disabled', 'false');
}

function saveAnswer(key, val) {
  const s = readState();
  const answers = Object.assign({}, s.answers);
  answers[fill.partId] = Object.assign({}, answers[fill.partId] || {});
  answers[fill.partId][key] = val;
  patchState({ answers });
}

/* Next: walk the blanks inside a part, then move between parts. */
function nextStep() {
  if (fill && fill.solved && fill.idx + 1 < fill.blanks.length) {
    fill.idx++;
    const b = fill.blanks[fill.idx];
    fill.key = b.key;
    fill.kind = b.kind;
    fill.correct = realValue(b.key);
    fill.tries = 0;
    fill.nudged = false;
    fill.solved = false;
    renderBlankChoices();
    feedback('', '');
    setActions([mkSkip()]);
    return;
  }
  advancePart();
}

/* Skip: fill anything left in this part with the real values (so
   the finished sheet still reads true), then move on. */
function skipPart() {
  if (fill) {
    const s = readState();
    const answers = Object.assign({}, s.answers);
    const bucket = Object.assign({}, answers[fill.partId] || {});
    for (let i = fill.idx; i < fill.blanks.length; i++) {
      const k = fill.blanks[i].key;
      if (!bucket[k]) {
        const v = realValue(k);
        bucket[k] = v;
        const span = document.getElementById('blank-' + k);
        if (span) { span.textContent = v; span.classList.add('filled'); }
      }
    }
    answers[fill.partId] = bucket;
    patchState({ answers });
    chime('reveal');
  }
  advancePart();
}

function advancePart() {
  fill = null;
  idx++;
  if (idx >= order.length) showDone(true);
  else renderPart();
}

/* ---------- Done ---------- */

function buildRecap() {
  const a = readState().answers;
  const lines = [];
  if (a.date && a.date.day) {
    lines.push('Today is ' + a.date.day + ' the ' + a.date.num + ' of ' + a.date.month + '.');
  }
  if (a.around && a.around.yday && a.around.tday) {
    lines.push('Yesterday was ' + a.around.yday + '. Tomorrow will be ' + a.around.tday + '.');
  }
  if (a.weather) {
    const w = WEATHER.find((x) => x.id === a.weather);
    if (w) lines.push('Weather: ' + w.emoji + ' ' + w.name);
  }
  if (a.feelings) {
    const hit = findFeeling(a.feelings);
    if (hit) lines.push('Feeling: ' + hit.feeling.emoji + ' ' + hit.feeling.name +
      ' \u00B7 ' + hit.zone.name);
  }
  els.recap.innerHTML = lines.length
    ? lines.map((l) => '<p class="rd-line">' + l + '</p>').join('')
    : '<p class="rd-line">Nothing was filled in today — that’s okay too.</p>';
}

function showDone(chimeIt) {
  fill = null;
  buildRecap();
  const box = els.doneActions;
  box.textContent = '';

  const again = makeHoldBtn('again', 'Start over', 1000, () => {
    patchState({ answers: {} });
    buildOrder();
    idx = 0;
    show('run');
    renderPart();
  });
  again.classList.add('primary');
  box.appendChild(again);

  const change = document.createElement('button');
  change.type = 'button';
  change.className = 'btn';
  change.textContent = 'Change which parts we do';
  change.addEventListener('click', openChooser);
  box.appendChild(change);

  show('done');
  if (chimeIt) chime('done');
}

/* ---------- Boot ---------- */

applyTheme(readTheme());
if (!motifsOn()) document.documentElement.classList.add('motifs-off');

function initChrome() {
  cacheEls();
  injectHeader();
  injectPicker();
  injectFooter();
  resumeView();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChrome);
} else {
  initChrome();
}

/* Another tab changed the shared palette or patterns — follow it. */
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY) {
    applyTheme(readTheme());
    syncMotifs();
  }
});
