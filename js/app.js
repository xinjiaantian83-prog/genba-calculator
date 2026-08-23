const STORAGE_KEY = 'genbaCalc_v1';
const PRIVACY_POLICY_URL = 'https://xinjiaantian83-prog.github.io/genba-calculator/privacy.html';
const HOME_TOP_TOOLS_KEY = 'genbaTopTools_v1';
const FEATURE_REQUEST_EVENT_KEY = 'genbaFeatureRequestEvents_v1';
const DEFAULT_HOME_TOP_TOOLS = ['slope', 'radiusCircle', 'doma', 'gravityWall'];
const HOME_MENU_ITEMS = [
  { id: 'slope', label: '勾配・カーポート' },
  { id: 'radiusCircle', label: 'R・真円' },
  { id: 'doma', label: '土間' },
  { id: 'gravityWall', label: '重力式擁壁' },
  { id: 'ordinary', label: '普通計算' },
  { id: 'rebar', label: '鉄筋拾い' },
  { id: 'blockSupport', label: 'ブロックサポート' },
  { id: 'density', label: '比重早見' },
  { id: 'notes', label: 'メモ' }
];
let homeTopTools = loadHomeTopTools();
let editingHomeTopTools = homeTopTools.slice();

const SAVE_FIELDS = {
  slope: ['slopeH', 'slopeV', 'slopeMode', 'carportSpanMm', 'carportSlopeDeg'],
  doma:  ['domaA', 'domaB', 'domaT', 'meshA', 'meshB', 'meshLap'],
  wall:  ['wallH', 'wallT', 'wallSlope', 'wallB', 'wallH1', 'wallH2', 'wallH3', 'wallL'],
  block: ['blkL', 'blkN', 'blkLen', 'blkVp', 'blkHp']
};

function saveSection(section) {
  try {
    const all = loadAll();
    const data = {};
    SAVE_FIELDS[section].forEach(id => {
      const el = document.getElementById(id);
      if (el) data[id] = el.value;
    });
    all[section] = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (e) {}
}

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch (e) { return {}; }
}

function restoreSection(section) {
  const all = loadAll();
  const data = all[section];
  if (!data) return;
  SAVE_FIELDS[section].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (data[id] !== undefined && data[id] !== null && data[id] !== '') {
      el.value = data[id];
    }
  });
}

function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

function openPrivacyPolicy() {
  window.open(PRIVACY_POLICY_URL, '_blank', 'noopener,noreferrer');
}

function getAppPlatform() {
  try {
    if (window.Capacitor && typeof window.Capacitor.getPlatform === 'function') {
      const platform = window.Capacitor.getPlatform();
      if (platform === 'ios' || platform === 'android') return platform;
    }
  } catch (e) {}
  const userAgent = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
  if (/Android/i.test(userAgent)) return 'android';
  return 'web';
}

function trackFeatureRequest(eventName, source) {
  const eventData = {
    event: eventName,
    source,
    at: new Date().toISOString()
  };
  try {
    const history = JSON.parse(localStorage.getItem(FEATURE_REQUEST_EVENT_KEY) || '[]');
    history.push(eventData);
    localStorage.setItem(FEATURE_REQUEST_EVENT_KEY, JSON.stringify(history.slice(-50)));
  } catch (e) {}
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(eventData);
}

async function resolveAppVersion() {
  let version = 'unknown';
  try {
    const appPlugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
    if (appPlugin && typeof appPlugin.getInfo === 'function') {
      const info = await appPlugin.getInfo();
      version = info.version || version;
    }
  } catch (e) {}
  const field = document.getElementById('featureAppVersion');
  if (field) field.value = version;
  return version;
}

async function openFeatureRequest() {
  const source = getAppPlatform();
  document.getElementById('featureSource').value = source;
  document.getElementById('featureOs').value = navigator.userAgent || source;
  await resolveAppVersion();
  trackFeatureRequest('feature_request_open', source);
  show('featureRequest');
  setTimeout(() => document.getElementById('featureContent')?.focus(), 50);
}

function setupFeatureRequest() {
  const entry = document.getElementById('featureRequestEntry');
  const form = document.getElementById('featureRequestForm');
  if (!entry || !form) return;

  entry.addEventListener('click', openFeatureRequest);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const status = document.getElementById('featureRequestStatus');
    const submitButton = document.getElementById('featureRequestSubmit');
    status.className = 'feature-request-status';

    if (!form.reportValidity()) {
      status.textContent = '必須項目を入力してください。';
      status.classList.add('error');
      return;
    }

    const source = getAppPlatform();
    document.getElementById('featureSource').value = source;
    document.getElementById('featureSentAt').value = new Date().toISOString();
    document.getElementById('featurePageUrl').value = window.location.href;
    document.getElementById('featureOs').value = navigator.userAgent || source;
    await resolveAppVersion();

    status.textContent = '送信中です…';
    submitButton.disabled = true;
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false) throw new Error('request failed');
      trackFeatureRequest('feature_request_submit', source);
      form.reset();
      document.getElementById('featureSource').value = source;
      status.textContent = 'ありがとうございます。今後の開発候補として参考にさせていただきます。';
      status.classList.add('success');
    } catch (e) {
      status.textContent = navigator.onLine
        ? '送信に失敗しました。時間をおいて再度お試しください。'
        : '通信できません。接続を確認して再度お試しください。';
      status.classList.add('error');
    } finally {
      submitButton.disabled = false;
    }
  });
}

function homeMenuElement(itemId) {
  return document.querySelector('[data-menu-id="' + itemId + '"]');
}

function parseHomeMenuStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch (e) {
    return null;
  }
}

function normalizeHomeTopTools(savedTools) {
  const known = new Set(HOME_MENU_ITEMS.map(item => item.id));
  const normalized = Array.isArray(savedTools)
    ? savedTools.filter((id, index, tools) => known.has(id) && tools.indexOf(id) === index).slice(0, 4)
    : [];
  const fallbacks = DEFAULT_HOME_TOP_TOOLS
    .concat(HOME_MENU_ITEMS.map(item => item.id))
    .filter(id => known.has(id) && !normalized.includes(id));
  return normalized.concat(fallbacks).slice(0, 4);
}

function loadHomeTopTools() {
  return normalizeHomeTopTools(parseHomeMenuStorage(HOME_TOP_TOOLS_KEY));
}

function saveHomeTopTools() {
  localStorage.setItem(HOME_TOP_TOOLS_KEY, JSON.stringify(homeTopTools));
}

function applyHomeTopTools() {
  const grid = document.querySelector('.home-grid');
  const tools = document.querySelector('.home-actions');
  if (!grid || !tools) return;

  homeTopTools.forEach((itemId, index) => {
    const item = HOME_MENU_ITEMS.find(candidate => candidate.id === itemId);
    if (!item) return;
    const element = homeMenuElement(item.id);
    if (!element) return;
    element.hidden = false;
    element.classList.add('home-primary');
    element.classList.remove('home-secondary');
    grid.appendChild(element);
    const number = element.querySelector('.num');
    if (number) number.textContent = String(index + 1).padStart(2, '0');
  });

  HOME_MENU_ITEMS.filter(item => !homeTopTools.includes(item.id)).forEach((item, index) => {
    const element = homeMenuElement(item.id);
    if (!element) return;
    element.hidden = false;
    element.classList.remove('home-primary');
    element.classList.add('home-secondary');
    tools.appendChild(element);
    const number = element.querySelector('.num');
    if (number) number.textContent = String(index + 5).padStart(2, '0');
  });

  const details = document.querySelector('.home-tools');
  if (details) details.hidden = tools.children.length === 0;
}

function setCustomizeNotice(message) {
  const notice = document.getElementById('customizeNotice');
  if (notice) notice.textContent = message || '';
}

function renderCustomizeOptions() {
  const list = document.getElementById('menuCustomizeList');
  if (!list) return;
  list.innerHTML = editingHomeTopTools.map((itemId, index) => {
    const selectedItem = HOME_MENU_ITEMS.find(item => item.id === itemId);
    const slotLabel = (index + 1) + '枠目';
    const options = HOME_MENU_ITEMS.map(item =>
      '<option value="' + item.id + '"' + (item.id === itemId ? ' selected' : '') + '>' + item.label + '</option>'
    ).join('');
    return '<div class="customize-slot" data-slot="' + index + '">' +
      '<span class="customize-slot-number">' + slotLabel + '</span>' +
      '<label class="customize-tool-picker">' +
        '<span class="customize-tool-name">' + selectedItem.label + '</span>' +
        '<span class="customize-change">変更 <b aria-hidden="true">›</b></span>' +
        '<select data-slot-select="' + index + '" aria-label="' + slotLabel + 'に表示するツール">' + options + '</select>' +
      '</label>' +
      '</div>';
  }).join('');

  list.querySelectorAll('[data-slot-select]').forEach(select => {
    select.addEventListener('change', () => {
      const slotIndex = Number(select.dataset.slotSelect);
      const duplicateIndex = editingHomeTopTools.indexOf(select.value);
      if (duplicateIndex !== -1 && duplicateIndex !== slotIndex) {
        editingHomeTopTools[duplicateIndex] = editingHomeTopTools[slotIndex];
      }
      editingHomeTopTools[slotIndex] = select.value;
      renderCustomizeOptions();
      setCustomizeNotice('4枠に同じツールは重複しません。');
    });
  });
}

function openCustomizeDialog() {
  editingHomeTopTools = homeTopTools.slice();
  renderCustomizeOptions();
  setCustomizeNotice('');
  const dialog = document.getElementById('customizeDialog');
  if (dialog) dialog.hidden = false;
}

function saveCustomizeDialog() {
  homeTopTools = normalizeHomeTopTools(editingHomeTopTools);
  saveHomeTopTools();
  applyHomeTopTools();
  closeCustomizeDialog();
}

function resetHomeTopTools() {
  if (!confirm('トップ4枠を初期設定に戻しますか？')) return;
  editingHomeTopTools = DEFAULT_HOME_TOP_TOOLS.slice();
  homeTopTools = editingHomeTopTools.slice();
  saveHomeTopTools();
  applyHomeTopTools();
  renderCustomizeOptions();
  setCustomizeNotice('初期設定に戻しました。');
}

function closeCustomizeDialog() {
  const dialog = document.getElementById('customizeDialog');
  if (dialog) dialog.hidden = true;
  const button = document.getElementById('customizeMenuBtn');
  if (button) button.focus();
}

function setupHomeMenuCustomize() {
  const openButton = document.getElementById('customizeMenuBtn');
  const closeButton = document.getElementById('closeCustomizeBtn');
  const saveButton = document.getElementById('saveCustomizeBtn');
  const resetButton = document.getElementById('resetCustomizeBtn');
  const dialog = document.getElementById('customizeDialog');
  if (openButton) openButton.addEventListener('click', openCustomizeDialog);
  if (closeButton) closeButton.addEventListener('click', closeCustomizeDialog);
  if (saveButton) saveButton.addEventListener('click', saveCustomizeDialog);
  if (resetButton) resetButton.addEventListener('click', resetHomeTopTools);
  if (dialog) {
    dialog.addEventListener('click', event => {
      if (event.target === dialog) closeCustomizeDialog();
    });
  }
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && dialog && !dialog.hidden) closeCustomizeDialog();
  });
  applyHomeTopTools();
}
const MEMO_KEY = 'genbaMemo_v1';
function saveMemo() {
  try {
    const el = document.getElementById('memoText');
    if (el) localStorage.setItem(MEMO_KEY, el.value);
  } catch (e) {}
}
function restoreMemo() {
  try {
    const el = document.getElementById('memoText');
    if (!el) return;
    el.value = localStorage.getItem(MEMO_KEY) || '';
    el.addEventListener('input', saveMemo);
  } catch (e) {}
}
function clearMemo() {
  if (!confirm('メモを全消去しますか？')) return;
  const el = document.getElementById('memoText');
  if (el) el.value = '';
  try { localStorage.removeItem(MEMO_KEY); } catch (e) {}
}

let calcCur = '0';
let calcPrev = '';
let calcOp = null;
let calcReset = false;
function updateDisp() {
  document.getElementById('calcDisp').textContent = formatDispNum(calcCur);
  document.getElementById('calcSub').textContent =
    calcPrev !== '' ? (formatDispNum(calcPrev) + ' ' + opSym(calcOp)) : '';
}
function formatDispNum(s) {
  if (s === '' || s === '-') return s || '0';
  if (s.includes('.')) {
    const [a, b] = s.split('.');
    return Number(a).toLocaleString() + '.' + b;
  }
  return Number(s).toLocaleString();
}
function opSym(op) { return ({'+':'＋','-':'−','*':'×','/':'÷','%':'%'})[op] || ''; }
function cIn(v) {
  if (calcReset) { calcCur = '0'; calcReset = false; }
  if (v === '.') { if (!calcCur.includes('.')) calcCur += '.'; }
  else if (v === '00') { if (calcCur === '0') return; calcCur += '00'; }
  else { if (calcCur === '0') calcCur = v; else calcCur += v; }
  updateDisp();
}
function cClear() { calcCur='0'; calcPrev=''; calcOp=null; calcReset=false; updateDisp(); }
function cBack() {
  if (calcReset) return;
  if (calcCur.length <= 1 || (calcCur.length === 2 && calcCur.startsWith('-'))) calcCur = '0';
  else calcCur = calcCur.slice(0, -1);
  updateDisp();
}
function cOp(op) {
  if (calcOp && !calcReset) cEq();
  calcPrev = calcCur; calcOp = op; calcReset = true;
  updateDisp();
}
function cEq() {
  if (calcOp === null) return;
  const a = parseFloat(calcPrev), b = parseFloat(calcCur);
  let r = 0;
  switch (calcOp) {
    case '+': r = a + b; break;
    case '-': r = a - b; break;
    case '*': r = a * b; break;
    case '/': r = b === 0 ? 0 : a / b; break;
    case '%': r = a * b / 100; break;
  }
  r = Math.round(r * 1e10) / 1e10;
  calcCur = String(r); calcPrev = ''; calcOp = null; calcReset = true;
  updateDisp();
}

function setSlopeMode(mode) {
  const nextMode = mode === 'carport' ? 'carport' : 'height';
  const modeEl = document.getElementById('slopeMode');
  const heightBtn = document.getElementById('slopeHeightModeBtn');
  const carportBtn = document.getElementById('slopeCarportModeBtn');
  const heightPanel = document.getElementById('slopeHeightPanel');
  const carportPanel = document.getElementById('slopeCarportPanel');

  if (modeEl) modeEl.value = nextMode;
  if (heightBtn) heightBtn.classList.toggle('active', nextMode === 'height');
  if (carportBtn) carportBtn.classList.toggle('active', nextMode === 'carport');
  if (heightPanel) heightPanel.hidden = nextMode !== 'height';
  if (carportPanel) carportPanel.hidden = nextMode !== 'carport';

  calcSlope();
}

function resetSlope() {
  if (!confirm('リセットしますか？')) return;
  document.getElementById('slopeH').value = '';
  document.getElementById('slopeV').value = '';
  document.getElementById('carportSpanMm').value = '2900';
  document.getElementById('carportSlopeDeg').value = '4';
  setSlopeMode('height');
  try {
    const all = loadAll();
    all.slope = {
      slopeH: '',
      slopeV: '',
      slopeMode: 'height',
      carportSpanMm: '2900',
      carportSlopeDeg: '4'
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (e) {}
  calcSlope();
  alert('reset ok');
}

function calcSlope() {
  const mode = (document.getElementById('slopeMode') || {}).value === 'carport' ? 'carport' : 'height';
  if (mode === 'carport') {
    calcCarportSlope();
    return;
  }

  const h = parseFloat(document.getElementById('slopeH').value);
  const v = parseFloat(document.getElementById('slopeV').value);
  const angle = Math.atan2(v, h) * 180 / Math.PI;

  const primaryLabel = document.getElementById('rSlopePrimaryLabel');
  const secondLabel = document.getElementById('rSlopeSecondLabel');
  if (primaryLabel) primaryLabel.textContent = '斜距離';
  if (secondLabel) secondLabel.textContent = '角度';

  if (!isFinite(h) || !isFinite(v) || !isFinite(angle) || h <= 0 || v < 0 || angle < 0) {
    document.getElementById('rSlope').textContent = '—';
    document.getElementById('rAngle').textContent = '—';
    document.getElementById('rPct').textContent = '—';
    document.getElementById('rRatio').textContent = '—';
    drawSlopeSvg(null, null, null, null, null);
    saveSection('slope');
    return;
  }
  const slope = Math.sqrt(h * h + v * v);
  const pct = (v / h) * 100;
  const ratio = v === 0 ? '∞' : (h / v).toFixed(1);
  document.getElementById('rSlope').textContent = slope.toFixed(1) + ' mm';
  document.getElementById('rAngle').textContent = angle.toFixed(2) + ' °';
  document.getElementById('rPct').textContent = pct.toFixed(2) + ' %';
  document.getElementById('rRatio').textContent = '1/' + ratio;
  drawSlopeSvg(h, v, slope, angle, pct);
  saveSection('slope');
}

function calcCarportSlope() {
  const spanInput = document.getElementById('carportSpanMm');
  const slopeInput = document.getElementById('carportSlopeDeg');
  const spanMm = Number(spanInput ? spanInput.value : NaN);
  const slopeDeg = Number(slopeInput ? slopeInput.value : NaN);
  const hasResult = Number.isFinite(spanMm) && spanMm > 0 && Number.isFinite(slopeDeg) && slopeDeg >= 0;
  const dropMm = hasResult ? Math.round(Math.tan(slopeDeg * Math.PI / 180) * spanMm) : null;

  document.getElementById('carportDropMm').textContent = dropMm === null ? '—' : dropMm.toLocaleString('ja-JP') + ' mm';
  document.getElementById('carportSlopeResult').textContent = Number.isFinite(slopeDeg) && slopeDeg >= 0 ? formatSlopeDeg(slopeDeg) : '—';
  document.getElementById('carportSpanResult').textContent = Number.isFinite(spanMm) && spanMm > 0 ? spanMm.toLocaleString('ja-JP') + ' mm' : '—';
  drawCarportSvg(spanMm, slopeDeg, dropMm);
  saveSection('slope');
}

function formatSlopeDeg(value) {
  const digits = value % 1 === 0 ? 0 : 1;
  return value.toLocaleString('ja-JP', { maximumFractionDigits: digits, minimumFractionDigits: 0 }) + '°';
}

function drawCarportSvg(spanMm, slopeDeg, dropMm) {
  const drawingSpan = Number.isFinite(spanMm) && spanMm > 0 ? spanMm : 2900;
  const drawingDrop = dropMm === null ? 203 : dropMm;
  const spanRatio = Math.min(Math.max((drawingSpan - 2500) / 3500, 0), 1);
  const postDistance = 154 + spanRatio * 64;
  const lowX = 195 - postDistance / 2;
  const highX = 195 + postDistance / 2;
  const roofOverhang = postDistance * (1050 / 2900);
  const roofLowX = Math.max(4, lowX - roofOverhang);
  const roofHighX = Math.min(386, highX + roofOverhang);
  const groundY = 156;
  const postBottomY = groundY + 24;
  const spanY = postBottomY + 12;
  const highPostTop = 50;
  const visualDrop = Math.min(Math.max(drawingDrop / 8, 14), 78);
  const lowPostTop = highPostTop + visualDrop;
  const roofSlope = (highPostTop - lowPostTop) / (highX - lowX);
  const roofLowY = lowPostTop + roofSlope * (roofLowX - lowX);
  const roofHighY = highPostTop + roofSlope * (roofHighX - highX);
  const dimX = Math.min(362, highX + 38);
  const tickLeftX = dimX - 12;
  const tickRightX = Math.min(372, dimX + 12);

  setSvgLine('carportRoofLine', roofLowX, roofLowY, roofHighX, roofHighY);
  setSvgLine('carportLowPost', lowX, lowPostTop, lowX, postBottomY);
  setSvgLine('carportHighPost', highX, highPostTop, highX, postBottomY);
  setSvgLine('carportSpanLine', lowX, spanY, highX, spanY);
  setSvgLine('carportSpanLeftTick', lowX, spanY - 7, lowX, spanY + 7);
  setSvgLine('carportSpanRightTick', highX, spanY - 7, highX, spanY + 7);
  setSvgText('carportSpanLabel', 195, spanY + 17, '柱間寸法 ' + drawingSpan.toLocaleString('ja-JP') + 'mm');
  setSvgLine('carportDropTopGuide', highX + 6, highPostTop, dimX, highPostTop);
  setSvgLine('carportDropBottomGuide', lowX - 6, lowPostTop, dimX, lowPostTop);
  setSvgLine('carportDropLine', dimX, highPostTop, dimX, lowPostTop);
  setSvgLine('carportDropTopTick', tickLeftX, highPostTop, tickRightX, highPostTop);
  setSvgLine('carportDropBottomTick', tickLeftX, lowPostTop, tickRightX, lowPostTop);
  setSvgText('carportDropLabel', Math.min(dimX + 16, 374), lowPostTop + 18, '柱高低差 ' + (dropMm === null ? '—' : dropMm.toLocaleString('ja-JP')) + 'mm');
}

function fmtSvg(value) {
  return Number(value.toFixed(2)).toString();
}

function setSvgLine(id, x1, y1, x2, y2) {
  const line = document.getElementById(id);
  if (!line) return;
  line.setAttribute('x1', fmtSvg(x1));
  line.setAttribute('y1', fmtSvg(y1));
  line.setAttribute('x2', fmtSvg(x2));
  line.setAttribute('y2', fmtSvg(y2));
}

function setSvgText(id, x, y, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.setAttribute('x', fmtSvg(x));
  el.setAttribute('y', fmtSvg(y));
  el.textContent = text;
}

function drawSlopeSvg(h, v, slope, angle, pct) {
  const svg = document.getElementById('slopeSvg');
  if (!svg) return;

  const VB_W = 320, VB_H = 200;
  const padL = 30, padR = 100, padT = 30, padB = 40;
  const drawW = VB_W - padL - padR;
  const drawH = VB_H - padT - padB;

  const valid = isFinite(h) && isFinite(v) && h > 0 && v >= 0;

  if (!valid) {
    svg.innerHTML = `<text x="${VB_W/2}" y="${VB_H/2}" fill="#4ad9c2" font-size="12" font-family="monospace" text-anchor="middle">横・縦を入力してください</text>`;
    return;
  }

  const scale = Math.min(drawW / h, drawH / Math.max(v, 1));
  const x0 = padL;
  const y0 = VB_H - padB;
  const x1 = x0 + h * scale;
  const y1 = y0;
  const x2 = x1;
  const y2 = y0 - v * scale;

  svg.innerHTML = `
    <line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="#00ffd5" stroke-width="3" stroke-linecap="square"/>
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#00ffd5" stroke-width="3" stroke-linecap="square"/>
    <line x1="${x0}" y1="${y0}" x2="${x2}" y2="${y2}" stroke="#00ffd5" stroke-width="3" stroke-linecap="square"/>
    <polyline points="${x1 - 6},${y1} ${x1 - 6},${y1 - 6} ${x1},${y1 - 6}" fill="none" stroke="#00ffd5" stroke-width="3"/>
    <text x="${(x0 + x1) / 2}" y="${y0 + 22}" fill="#4ad9c2" font-size="11" font-family="monospace" text-anchor="middle">横 ${Math.round(h)}</text>
    <text x="${x2 + 8}" y="${(y1 + y2) / 2}" fill="#4ad9c2" font-size="11" font-family="monospace">縦 ${Math.round(v)}</text>
    <text x="${(x0 + x2) / 2 - 8}" y="${(y0 + y2) / 2 - 8}" fill="#00ffd5" font-size="11" font-family="monospace" text-anchor="middle">${Math.round(slope)}mm</text>
  `;
}

function calcDoma() {
  const a_mm  = parseFloat(document.getElementById('domaA').value);
  const b_mm  = parseFloat(document.getElementById('domaB').value);
  const t_mm  = parseFloat(document.getElementById('domaT').value);
  const ma_mm = parseFloat(document.getElementById('meshA').value);
  const mb_mm = parseFloat(document.getElementById('meshB').value);
  const lap_mm = parseFloat(document.getElementById('meshLap').value);

  const a   = isFinite(a_mm)  ? a_mm  / 1000 : NaN;
  const b   = isFinite(b_mm)  ? b_mm  / 1000 : NaN;
  const ma  = isFinite(ma_mm) ? ma_mm / 1000 : NaN;
  const mb  = isFinite(mb_mm) ? mb_mm / 1000 : NaN;
  const t   = t_mm;
  const lap = lap_mm;

  if (!isFinite(a) || !isFinite(b) || a <= 0 || b <= 0) {
    document.getElementById('rArea').textContent = '—';
    document.getElementById('rVol').textContent = '—';
    document.getElementById('rMesh').textContent = '—';
    saveSection('doma');
    return;
  }
  const area = a * b;
  document.getElementById('rArea').textContent = area.toFixed(2) + ' ㎡';

  if (isFinite(t) && t > 0) {
    document.getElementById('rVol').textContent = (area * (t / 1000)).toFixed(2) + ' m³';
  } else {
    document.getElementById('rVol').textContent = '—';
  }

  if (isFinite(ma) && isFinite(mb) && ma > 0 && mb > 0 && isFinite(lap) && lap >= 0) {
    const lapM = lap / 1000;
    let nA, nB;
    if (a <= ma) nA = 1;
    else { const eff = ma - lapM; nA = eff <= 0 ? Infinity : 1 + Math.ceil((a - ma) / eff); }
    if (b <= mb) nB = 1;
    else { const eff = mb - lapM; nB = eff <= 0 ? Infinity : 1 + Math.ceil((b - mb) / eff); }
    document.getElementById('rMesh').textContent =
      (!isFinite(nA) || !isFinite(nB)) ? '—' : (nA * nB) + ' 枚';
  } else {
    document.getElementById('rMesh').textContent = '—';
  }

  saveSection('doma');
}

let wallBManual = false;

function onSlopeInput() {
  wallBManual = false;
  const bEl = document.getElementById('wallB');
  if (bEl) bEl.value = '';
  calcWall();
}

function onBInput() {
  const bEl = document.getElementById('wallB');
  const v = bEl ? bEl.value.trim() : '';
  wallBManual = (v !== '');
  calcWall();
}

function calcWall() {
  const H      = parseFloat(document.getElementById('wallH').value);
  const T      = parseFloat(document.getElementById('wallT').value);
  const slope  = parseFloat(document.getElementById('wallSlope').value);
  const Binput = parseFloat(document.getElementById('wallB').value);
  const h1     = parseFloat(document.getElementById('wallH1').value);
  const h2     = parseFloat(document.getElementById('wallH2').value);
  const h3     = parseFloat(document.getElementById('wallH3').value);
  const L      = parseFloat(document.getElementById('wallL').value);

  let B = null;
  const bEl = document.getElementById('wallB');
  const bBadge = document.getElementById('bBadge');

  if (wallBManual && isFinite(Binput) && Binput > 0) {
    B = Binput;
    if (bBadge) {
      bBadge.textContent = '手入力';
      bBadge.classList.add('manual');
    }
  } else {
    if (isFinite(H) && isFinite(T) && isFinite(slope) && H > 0 && T > 0 && slope >= 0) {
      B = T + H * slope;
    }
    if (bBadge) {
      bBadge.textContent = '自動';
      bBadge.classList.remove('manual');
    }
    if (bEl && document.activeElement !== bEl) {
      bEl.value = (B === null) ? '' : Math.round(B);
    }
  }

  function widthAt(h) {
    if (B === null || H <= 0) return null;
    if (!isFinite(h) || h < 0 || h > H) return null;
    return T + (B - T) * (h / H);
  }
  const w1 = widthAt(h1);
  const w2 = widthAt(h2);
  const w3 = widthAt(h3);

  document.getElementById('rW1').textContent = w1 === null ? '—' : Math.round(w1) + 'mm';
  document.getElementById('rW2').textContent = w2 === null ? '—' : Math.round(w2) + 'mm';
  document.getElementById('rW3').textContent = w3 === null ? '—' : Math.round(w3) + 'mm';

  const areaSecEl  = document.getElementById('rAreaSec');
  const volPerEl   = document.getElementById('rVolPerM');
  const totalRowEl = document.getElementById('rTotalRow');
  const volTotalEl = document.getElementById('rVolTotal');
  const lShowEl    = document.getElementById('rLshow');

  if (B !== null) {
    const areaSec = ((T + B) / 2 / 1000) * (H / 1000);
    areaSecEl.textContent = areaSec.toFixed(3) + ' ㎡';
    volPerEl.textContent = areaSec.toFixed(3) + ' m³';

    if (isFinite(L) && L > 0) {
      lShowEl.textContent = L;
      volTotalEl.textContent = (areaSec * L).toFixed(2) + ' m³';
      totalRowEl.style.display = 'flex';
    } else {
      totalRowEl.style.display = 'none';
    }
  } else {
    areaSecEl.textContent = '— ㎡';
    volPerEl.textContent = '— m³';
    totalRowEl.style.display = 'none';
  }

  drawWallSvg(H, T, B, [
    { h: h1, w: w1, label: 'h1' },
    { h: h2, w: w2, label: 'h2' },
    { h: h3, w: w3, label: 'h3' }
  ]);

  saveSection('wall');
}

function drawWallSvg(H, T, B, marks) {
  const svg = document.getElementById('wallSvg');

  const valid = isFinite(H) && isFinite(T) && B !== null && isFinite(B) && H > 0 && T > 0 && B > 0;

  if (!valid) {
    svg.setAttribute('viewBox', '0 0 280 220');
    svg.innerHTML = `<text x="140" y="110" fill="#4ad9c2" font-size="11" font-family="monospace" text-anchor="middle">H・T・勾配 を入力してください</text>`;
    return;
  }

  // 描画可能エリア
  const maxDrawW = 300;
  const maxDrawH = 300;

  // スケール
  const scale = Math.min(maxDrawW / B, maxDrawH / H);

  // 実寸 × scale
  const drawH = H * scale;
  const drawB = B * scale;
  const drawT = T * scale;

  // パディング(ラベル領域)
  const padL = 40, padR = 100, padT = 24, padB = 30;
  const VB_W = drawB + padL + padR;
  const VB_H = drawH + padT + padB;

  // 4点 (左下基準)
  const xLeft   = padL;
  const yBottom = padT + drawH;
  const yTop    = padT;
  const pBL = [xLeft, yBottom];
  const pBR = [xLeft + drawB, yBottom];
  const pTR = [xLeft + drawT, yTop];
  const pTL = [xLeft, yTop];

  let html = '';
  html += `<line x1="5" y1="${yBottom}" x2="${VB_W - 5}" y2="${yBottom}" stroke="#4ad9c2" stroke-width="1.2" stroke-dasharray="3 3"/>`;
  html += `<polygon points="${pBL.join(',')} ${pBR.join(',')} ${pTR.join(',')} ${pTL.join(',')}"
            fill="#13332e" stroke="#00ffd5" stroke-width="2" stroke-linejoin="round"/>`;

  html += `<text x="${xLeft - 4}" y="${yTop + drawH / 2 + 4}" fill="#7ae6ff" font-size="9" font-family="monospace" text-anchor="end">前面</text>`;
  html += `<text x="${xLeft + (drawT + drawB) / 2 + 6}" y="${yTop + drawH / 2}" fill="#7ae6ff" font-size="9" font-family="monospace">背面</text>`;
  html += `<text x="${xLeft + drawT / 2}" y="${yTop - 6}" fill="#00ffd5" font-size="10" font-family="monospace" text-anchor="middle">T=${Math.round(T)}</text>`;
  html += `<text x="${xLeft + drawB / 2}" y="${yBottom + 16}" fill="#00ffd5" font-size="10" font-family="monospace" text-anchor="middle">B=${Math.round(B)}</text>`;
  html += `<line x1="${xLeft - 12}" y1="${yTop}" x2="${xLeft - 12}" y2="${yBottom}" stroke="#00ff88" stroke-width="1"/>`;
  html += `<line x1="${xLeft - 16}" y1="${yTop}" x2="${xLeft - 8}" y2="${yTop}" stroke="#00ff88" stroke-width="1"/>`;
  html += `<line x1="${xLeft - 16}" y1="${yBottom}" x2="${xLeft - 8}" y2="${yBottom}" stroke="#00ff88" stroke-width="1"/>`;
  html += `<text x="${xLeft - 14}" y="${yTop + drawH / 2}" fill="#00ff88" font-size="10" font-family="monospace" text-anchor="end" transform="rotate(-90 ${xLeft - 14} ${yTop + drawH / 2})">H=${Math.round(H)}</text>`;

  const colors = ['#ff7eb0', '#ffb968', '#7ae6ff'];
  marks.forEach((m, i) => {
    if (m.w === null) return;
    const y = yTop + (m.h / H) * drawH;
    const xR = xLeft + m.w * scale;
    html += `<line x1="${xLeft}" y1="${y}" x2="${xR}" y2="${y}" stroke="${colors[i]}" stroke-width="1.6" stroke-dasharray="4 3"/>`;
    html += `<text x="${xR + 6}" y="${y + 4}" fill="${colors[i]}" font-size="11" font-family="monospace" font-weight="bold">${m.label}: ${Math.round(m.w)}mm</text>`;
    html += `<text x="${xLeft + 4}" y="${y - 3}" fill="${colors[i]}" font-size="9" font-family="monospace">↓${Math.round(m.h)}</text>`;
  });

  svg.setAttribute('viewBox', `0 0 ${VB_W} ${VB_H}`);
  svg.innerHTML = html;
}

function calcBlock() {
  const L_mm = parseFloat(document.getElementById('blkL').value);
  const N    = parseFloat(document.getElementById('blkN').value);
  const len  = parseFloat(document.getElementById('blkLen').value);
  const vp   = parseFloat(document.getElementById('blkVp').value);
  const hp   = parseFloat(document.getElementById('blkHp').value);

  const cbEl   = document.getElementById('rCb');
  const vbarEl = document.getElementById('rVbar');
  const hbarEl = document.getElementById('rHbar');

  if (!isFinite(L_mm) || !isFinite(N) || !isFinite(len) || L_mm <= 0 || N <= 0 || len <= 0) {
    cbEl.textContent = '—';
    vbarEl.textContent = '—';
    hbarEl.textContent = '—';
    saveSection('block');
    return;
  }

  const perRow = Math.ceil(L_mm / len);
  cbEl.textContent = (perRow * N).toLocaleString() + ' 枚';

  if (isFinite(vp) && vp > 0) {
    vbarEl.textContent = (Math.ceil(L_mm / vp) + 1) + ' 本';
  } else {
    vbarEl.textContent = '—';
  }

  if (isFinite(hp) && hp > 0) {
    hbarEl.textContent = (Math.ceil(N / hp) * perRow).toLocaleString() + ' 本';
  } else {
    hbarEl.textContent = '—';
  }

  saveSection('block');
}

function bootRestore() {
  restoreSection('slope');
  restoreSection('doma');
  restoreSection('wall');
  restoreSection('block');
  restoreMemo();

  const bEl = document.getElementById('wallB');
  const Bval = bEl ? parseFloat(bEl.value) : NaN;
  const Hv = parseFloat(document.getElementById('wallH').value);
  const Tv = parseFloat(document.getElementById('wallT').value);
  const Sv = parseFloat(document.getElementById('wallSlope').value);
  if (isFinite(Bval) && Bval > 0) {
    if (isFinite(Hv) && isFinite(Tv) && isFinite(Sv) && Hv > 0 && Tv > 0 && Sv >= 0) {
      const autoB = Math.round(Tv + Hv * Sv);
      wallBManual = (Math.round(Bval) !== autoB);
    } else {
      wallBManual = true;
    }
  } else {
    wallBManual = false;
  }

  setSlopeMode(((document.getElementById('slopeMode') || {}).value) || 'height');
  calcDoma();
  calcWall();
  calcBlock();
  initRLength();
}

function fmtRLength(n, suffix = ' mm') {
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('ja-JP', { maximumFractionDigits: 1, minimumFractionDigits: 1 }) + suffix;
}

function fmtRLengthM2(n) {
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('ja-JP', { maximumFractionDigits: 3, minimumFractionDigits: 3 }) + ' ㎡';
}

function resetRArcResults() {
  ['rArcLength', 'rRadius', 'rAngleOut', 'rDiff', 'rCircumference'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '—';
  });
}

function resetRCircleResults() {
  ['rCircleCircumference', 'rCircleRadius', 'rCircleArea'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '—';
  });
}

function drawRArcEmpty() {
  const fig = document.getElementById('rFig');
  if (!fig) return;
  fig.innerHTML = `
    <line class="r-guide" x1="44" y1="132" x2="316" y2="132"></line>
    <path class="r-arc" d="M44 132 Q180 78 316 132"></path>
    <line class="r-sagitta" x1="180" y1="132" x2="180" y2="78"></line>
    <text class="r-svg-label" x="180" y="154" text-anchor="middle">弦長</text>
    <text class="r-svg-label warn" x="192" y="106">矢高</text>
    <text class="r-svg-label accent" x="180" y="58" text-anchor="middle">R実長</text>
  `;
}

function drawRArcFigure(c, h, arcText) {
  const fig = document.getElementById('rFig');
  if (!fig) return;
  const leftX = 42;
  const rightX = 318;
  const baseY = 136;
  const midX = 180;
  const maxRise = 88;
  const rise = Math.max(18, Math.min(maxRise, (h / c) * 460));
  const topY = baseY - rise;

  fig.innerHTML = `
    <line class="r-guide" x1="${leftX}" y1="${baseY}" x2="${rightX}" y2="${baseY}"></line>
    <path class="r-arc" d="M${leftX} ${baseY} Q${midX} ${topY - rise * 0.18} ${rightX} ${baseY}"></path>
    <line class="r-chord" x1="${leftX}" y1="${baseY}" x2="${rightX}" y2="${baseY}"></line>
    <line class="r-sagitta" x1="${midX}" y1="${baseY}" x2="${midX}" y2="${topY}"></line>
    <text class="r-svg-label" x="${midX}" y="161" text-anchor="middle">弦長 ${fmtRLength(c, '')}mm</text>
    <text class="r-svg-label warn" x="${midX + 10}" y="${(baseY + topY) / 2 + 4}">矢高 ${fmtRLength(h, '')}mm</text>
    <text class="r-svg-label accent" x="${midX}" y="${Math.max(24, topY - 16)}" text-anchor="middle">R実長 ${arcText}</text>
  `;
}

function drawRCircleEmpty() {
  const fig = document.getElementById('rCircleFig');
  if (!fig) return;
  fig.innerHTML = `
    <circle class="r-circle" cx="180" cy="94" r="58"></circle>
    <line class="r-diameter" x1="122" y1="94" x2="238" y2="94"></line>
    <line class="r-radius-line" x1="180" y1="94" x2="238" y2="94"></line>
    <text class="r-svg-label" x="180" y="171" text-anchor="middle">直径</text>
    <text class="r-svg-label warn" x="204" y="82">半径</text>
  `;
}

function drawRCircleFigure(d, radiusText, circumferenceText) {
  const fig = document.getElementById('rCircleFig');
  if (!fig) return;
  fig.innerHTML = `
    <circle class="r-circle" cx="180" cy="92" r="62"></circle>
    <line class="r-diameter" x1="118" y1="92" x2="242" y2="92"></line>
    <line class="r-radius-line" x1="180" y1="92" x2="242" y2="92"></line>
    <text class="r-svg-label" x="180" y="170" text-anchor="middle">直径 ${fmtRLength(d, '')}mm</text>
    <text class="r-svg-label warn" x="204" y="80">${radiusText}</text>
    <text class="r-svg-label accent" x="180" y="25" text-anchor="middle">円周 ${circumferenceText}</text>
  `;
}

function calcRArc() {
  const chordInput = document.getElementById('rChord');
  const sagittaInput = document.getElementById('rSagitta');
  const message = document.getElementById('rMessage');
  if (!chordInput || !sagittaInput || !message) return;

  const c = Number(chordInput.value);
  const h = Number(sagittaInput.value);
  message.textContent = '';

  if (!chordInput.value || !sagittaInput.value) {
    resetRArcResults();
    drawRArcEmpty();
    return;
  }
  if (c <= 0 || !Number.isFinite(c)) {
    resetRArcResults();
    drawRArcEmpty();
    message.textContent = '弦長は0より大きい数値を入力してください。';
    return;
  }
  if (h <= 0 || !Number.isFinite(h)) {
    resetRArcResults();
    drawRArcEmpty();
    message.textContent = '矢高は0より大きい数値を入力してください。';
    return;
  }

  const r = (c * c / (8 * h)) + (h / 2);
  const ratio = c / (2 * r);
  if (ratio > 1 || !Number.isFinite(r)) {
    resetRArcResults();
    drawRArcEmpty();
    message.textContent = '入力値を確認してください。Rが成立しません。';
    return;
  }

  const theta = 2 * Math.asin(ratio);
  const arc = r * theta;
  const angleDeg = theta * 180 / Math.PI;
  const difference = arc - c;
  const circumference = 2 * Math.PI * r;

  document.getElementById('rArcLength').textContent = fmtRLength(arc);
  document.getElementById('rRadius').textContent = fmtRLength(r);
  document.getElementById('rAngleOut').textContent = fmtRLength(angleDeg, '°');
  document.getElementById('rDiff').textContent = fmtRLength(difference);
  document.getElementById('rCircumference').textContent = fmtRLength(circumference);

  if (h > c * 0.35) {
    message.textContent = '矢高が大きめです。現場寸法やR形状を確認してください。';
  }

  drawRArcFigure(c, h, fmtRLength(arc));
}

function calcRCircle() {
  const diameterInput = document.getElementById('rDiameter');
  const message = document.getElementById('rCircleMessage');
  if (!diameterInput || !message) return;

  const d = Number(diameterInput.value);
  message.textContent = '';

  if (!diameterInput.value) {
    resetRCircleResults();
    drawRCircleEmpty();
    return;
  }
  if (d <= 0 || !Number.isFinite(d)) {
    resetRCircleResults();
    drawRCircleEmpty();
    message.textContent = '直径は0より大きい数値を入力してください。';
    return;
  }

  const r = d / 2;
  const circumference = Math.PI * d;
  const areaMm2 = Math.PI * r * r;
  const areaM2 = areaMm2 / 1000000;

  document.getElementById('rCircleCircumference').textContent = fmtRLength(circumference);
  document.getElementById('rCircleRadius').textContent = fmtRLength(r);
  document.getElementById('rCircleArea').textContent = fmtRLengthM2(areaM2);
  drawRCircleFigure(d, '半径 ' + fmtRLength(r), fmtRLength(circumference));
}

function switchRLengthMode(mode) {
  document.querySelectorAll('#rlength .r-mode-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.rMode === mode);
  });
  const arc = document.getElementById('rArcMode');
  const circle = document.getElementById('rCircleMode');
  if (arc) arc.classList.toggle('active', mode === 'arc');
  if (circle) circle.classList.toggle('active', mode === 'circle');
}

function sampleRArc() {
  const chordInput = document.getElementById('rChord');
  const sagittaInput = document.getElementById('rSagitta');
  if (!chordInput || !sagittaInput) return;
  chordInput.value = '5000';
  sagittaInput.value = '300';
  calcRArc();
}

function clearRArc() {
  const chordInput = document.getElementById('rChord');
  const sagittaInput = document.getElementById('rSagitta');
  const message = document.getElementById('rMessage');
  if (chordInput) chordInput.value = '';
  if (sagittaInput) sagittaInput.value = '';
  if (message) message.textContent = '';
  resetRArcResults();
  drawRArcEmpty();
}

function sampleRCircle() {
  const diameterInput = document.getElementById('rDiameter');
  if (!diameterInput) return;
  diameterInput.value = '1000';
  calcRCircle();
}

function clearRCircle() {
  const diameterInput = document.getElementById('rDiameter');
  const message = document.getElementById('rCircleMessage');
  if (diameterInput) diameterInput.value = '';
  if (message) message.textContent = '';
  resetRCircleResults();
  drawRCircleEmpty();
}

function initRLength() {
  const arcBtn = document.getElementById('rArcModeBtn');
  const circleBtn = document.getElementById('rCircleModeBtn');
  if (!arcBtn || !circleBtn) return;
  arcBtn.addEventListener('click', () => switchRLengthMode('arc'));
  circleBtn.addEventListener('click', () => switchRLengthMode('circle'));
  drawRArcEmpty();
  drawRCircleEmpty();
}

updateDisp();
bootRestore();

/* ===== Integrated rebar estimator logic ===== */
(() => {

const $ = (id) => document.getElementById(id);

/* ============================================================
   モード切替
============================================================ */
function switchRebarMode(mode) {
  const isWall = (mode === 'wall');
  $('modeWall').classList.toggle('active', isWall);
  $('modeL').classList.toggle('active', !isWall);
  $('tabWall').classList.toggle('active', isWall);
  $('tabL').classList.toggle('active', !isWall);
  const root = $('rebar');
  if (root) {
    root.classList.toggle('rebar-mode-wall', isWall);
    root.classList.toggle('rebar-mode-L', !isWall);
  }
  try { localStorage.setItem('rebarMode_v1', mode); } catch (e) {}
}

/* ============================================================
   個別フィールドのクリア
============================================================ */
function clearRebarField(id) {
  const el = $(id);
  if (!el) return;
  el.value = '';
  if (/^L/.test(id)) {
    LrecalcAll();
  } else {
    recalcAll();
  }
}

/* ============================================================
   全リセット
============================================================ */
function resetRebarAllInputs() {
  $('cL').value      = '';
  $('cH').value      = '';
  $('cPitchY').value = '200';
  $('cPitchT').value = '200';
  $('cCover').value  = '40';
  $('cStock').value  = '5000';
  currentDia = 'D10';
  document.querySelectorAll('#wallDiaRow .dia-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.dia === 'D10');
  });

  $('LcL').value      = '';
  $('LcH').value      = '';
  $('LcB').value      = '';
  $('LcPitchT').value = '200';
  $('LcPitchY').value = '200';
  $('LcCover').value  = '40';
  $('LcStock').value  = '5000';
  LcurrentDia = 'D10';
  document.querySelectorAll('#lDiaRow .dia-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.dia === 'D10');
  });

  recalcAll();
  LrecalcAll();
}

/* ==========================================================================================
   ========== 直壁モード ==========
========================================================================================== */
let currentDia = 'D10';

function setRebarDiaWall(d) {
  currentDia = d;
  document.querySelectorAll('#wallDiaRow .dia-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.dia === d);
  });
  recalcAll();
  saveAll();
}

function readCommon() {
  return {
    L:      parseFloat($('cL').value),
    H:      parseFloat($('cH').value),
    pitchY: parseFloat($('cPitchY').value),
    pitchT: parseFloat($('cPitchT').value),
    cover:  parseFloat($('cCover').value),
    stock:  parseFloat($('cStock').value)
  };
}

const Y_DIA = {
  D10: { anchor: 400, unit: 0.560 },
  D13: { anchor: 520, unit: 0.995 },
  D16: { anchor: 640, unit: 1.56  },
  D19: { anchor: 760, unit: 2.25  }
};

function calcYoko() {
  const c = readCommon();
  const yoko_L     = c.L;
  const yoko_H     = c.H;
  const yoko_p     = c.pitchY;
  const yoko_stock = c.stock;
  const yoko_d     = Y_DIA[currentDia];

  if (!isFinite(yoko_L) || yoko_L <= 0 || !isFinite(yoko_H) || yoko_H <= 0
      || !isFinite(yoko_p) || yoko_p <= 0 || !isFinite(yoko_stock) || yoko_stock <= 0) {
    $('yRows').textContent = '—';
    $('yPerRow').textContent = '—';
    $('yPerLen').textContent = '—';
    $('yTotal').textContent = '—';
    $('yWeight').textContent = '—';
    return 0;
  }

  const yoko_eff = yoko_stock - yoko_d.anchor;
  if (yoko_eff <= 0) {
    $('yRows').textContent = '—';
    $('yPerRow').textContent = '定尺不足';
    $('yPerLen').textContent = '—';
    $('yTotal').textContent = '—';
    $('yWeight').textContent = '—';
    return 0;
  }

  const yoko_rows   = Math.floor(yoko_H / yoko_p) + 1;
  const yoko_perRow = Math.ceil(yoko_L / yoko_eff);
  const yoko_perLen = yoko_perRow * yoko_stock;
  const yoko_total  = yoko_perLen * yoko_rows;
  const yoko_weight = (yoko_total / 1000) * yoko_d.unit;

  $('yRows').textContent   = yoko_rows.toLocaleString() + ' 段';
  $('yPerRow').textContent = yoko_perRow.toLocaleString() + ' 本';
  $('yPerLen').textContent = Math.round(yoko_perLen).toLocaleString() + ' mm';
  $('yTotal').textContent  = (yoko_total / 1000).toFixed(2) + ' m';
  $('yWeight').textContent = yoko_weight.toFixed(2) + ' kg';

  return yoko_weight;
}

const T_DIA = {
  D10: { unit: 0.560 },
  D13: { unit: 0.995 },
  D16: { unit: 1.56  },
  D19: { unit: 2.25  }
};

function clearTateAll() {
  $('tCount').textContent = '—';
  $('tPerLen').textContent = '—';
  $('tPerStock').textContent = '—';
  $('tStockCount').textContent = '—';
  $('tTotal').textContent = '—';
  $('tWeight').textContent = '—';
  $('tScrapPer').textContent = '—';
  $('tScrapTotal').textContent = '—';
  $('tRowScrapPer').style.display = '';
  $('tRowScrapTotal').style.display = '';
  $('tStockWarn').style.display = 'none';
}

function calcTate() {
  const c = readCommon();
  const tate_L     = c.L;
  const tate_H     = c.H;
  const tate_p     = c.pitchT;
  const tate_cover = c.cover;
  const tate_stock = c.stock;
  const tate_d     = T_DIA[currentDia];

  if (!isFinite(tate_L) || tate_L <= 0 || !isFinite(tate_H) || tate_H <= 0
      || !isFinite(tate_p) || tate_p <= 0 || !isFinite(tate_cover) || tate_cover < 0
      || !isFinite(tate_stock) || tate_stock <= 0) {
    clearTateAll();
    return 0;
  }

  const tate_perLen = tate_H - tate_cover * 2;
  if (tate_perLen <= 0) {
    clearTateAll();
    $('tPerLen').textContent = 'かぶり過大';
    return 0;
  }

  const tate_count = Math.floor(tate_L / tate_p) + 1;

  $('tCount').textContent  = tate_count.toLocaleString() + ' 本';
  $('tPerLen').textContent = Math.round(tate_perLen).toLocaleString() + ' mm';

  const tate_total  = tate_count * tate_perLen;
  const tate_weight = (tate_total / 1000) * tate_d.unit;

  const tate_perStock = Math.floor(tate_stock / tate_perLen);
  if (tate_perStock <= 0) {
    $('tPerStock').textContent = '定尺不足';
    $('tStockCount').textContent = '—';
    $('tTotal').textContent      = (tate_total / 1000).toFixed(2) + ' m';
    $('tWeight').textContent     = tate_weight.toFixed(2) + ' kg';
    $('tScrapPer').textContent = '—';
    $('tScrapTotal').textContent = '—';
    $('tRowScrapPer').style.display = 'none';
    $('tRowScrapTotal').style.display = 'none';
    $('tStockWarn').style.display = '';
    return tate_weight;
  }

  const tate_stockCount = Math.ceil(tate_count / tate_perStock);

  $('tPerStock').textContent   = tate_perStock.toLocaleString() + ' 本';
  $('tStockCount').textContent = tate_stockCount.toLocaleString() + ' 本';
  $('tTotal').textContent      = (tate_total / 1000).toFixed(2) + ' m';
  $('tWeight').textContent     = tate_weight.toFixed(2) + ' kg';

  const tate_scrapPer   = tate_stock - tate_perLen * tate_perStock;
  const tate_scrapTotal = tate_scrapPer * tate_stockCount;

  $('tScrapPer').textContent   = Math.round(tate_scrapPer).toLocaleString() + ' mm';
  $('tScrapTotal').textContent = (tate_scrapTotal / 1000).toFixed(2) + ' m';
  $('tRowScrapPer').style.display = '';
  $('tRowScrapTotal').style.display = '';
  $('tStockWarn').style.display = 'none';

  return tate_weight;
}

function recalcAll() {
  const wY = calcYoko();
  const wT = calcTate();
  const sum = (wY || 0) + (wT || 0);
  $('sumWeight').textContent = sum > 0 ? sum.toFixed(2) + ' kg' : '— kg';
  saveAll();
}

const KEY = 'rebarWall_v1';
function saveAll() {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      dia: currentDia,
      cL:      $('cL').value,
      cH:      $('cH').value,
      cPitchY: $('cPitchY').value,
      cPitchT: $('cPitchT').value,
      cCover:  $('cCover').value,
      cStock:  $('cStock').value
    }));
  } catch (e) {}
}
function loadAll() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    if (d.dia) currentDia = d.dia;
    ['cL','cH','cPitchY','cPitchT','cCover','cStock'].forEach(id => {
      if (d[id] !== undefined && d[id] !== null && d[id] !== '') $(id).value = d[id];
    });
    document.querySelectorAll('#wallDiaRow .dia-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.dia === currentDia);
    });
  } catch (e) {}
}

['cL','cH','cPitchY','cPitchT','cCover','cStock'].forEach(id => {
  $(id).addEventListener('input', recalcAll);
});


/* ==========================================================================================
   ========== L型擁壁モード ==========
========================================================================================== */
let LcurrentDia = 'D10';

function setRebarDiaL(d) {
  LcurrentDia = d;
  document.querySelectorAll('#lDiaRow .dia-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.dia === d);
  });
  LrecalcAll();
  LsaveAll();
}

function LreadCommon() {
  return {
    L:      parseFloat($('LcL').value),
    H:      parseFloat($('LcH').value),
    B:      parseFloat($('LcB').value),
    pitchT: parseFloat($('LcPitchT').value),
    pitchY: parseFloat($('LcPitchY').value),
    cover:  parseFloat($('LcCover').value),
    stock:  parseFloat($('LcStock').value)
  };
}

function drawLTateFig(H_eff, B_eff, bend, total) {
  const svg = document.getElementById('LtFig');
  if (!svg) return;

  const valid = isFinite(H_eff) && H_eff > 0 && isFinite(B_eff) && B_eff > 0
             && isFinite(bend)  && isFinite(total) && total > 0;

  if (!valid) {
    svg.innerHTML = `<text x="160" y="110" fill="#9bd0ff" font-size="13"
      font-family="monospace" text-anchor="middle">H・B・かぶりを入力してください</text>`;
    return;
  }

  const xCorner = 90;
  const yCorner = 160;
  const stemLen = 120;
  const baseLen = 90;

  const xStemTop = xCorner;
  const yStemTop = yCorner - stemLen;
  const xBaseEnd = xCorner + baseLen;
  const yBaseEnd = yCorner;

  let html = '';

  html += `<path d="M ${xStemTop} ${yStemTop} L ${xCorner} ${yCorner} L ${xBaseEnd} ${yBaseEnd}"
            fill="none" stroke="#6bb8ff" stroke-width="4"
            stroke-linecap="round" stroke-linejoin="round"/>`;

  html += `<circle cx="${xCorner}" cy="${yCorner}" r="6"
            fill="#ffd266" stroke="#ffb968" stroke-width="1.5"/>`;

  html += `<text x="${xStemTop - 10}" y="${(yStemTop + yCorner)/2 + 4}"
            fill="#4aa3ff" font-size="13" font-family="monospace"
            font-weight="bold" text-anchor="end">縦 ${Math.round(H_eff)}</text>`;

  html += `<text x="${(xCorner + xBaseEnd)/2}" y="${yBaseEnd + 22}"
            fill="#4aa3ff" font-size="13" font-family="monospace"
            font-weight="bold" text-anchor="middle">横 ${Math.round(B_eff)}</text>`;

  html += `<text x="${xCorner + 12}" y="${yCorner - 8}"
            fill="#ffd266" font-size="12" font-family="monospace"
            font-weight="bold">曲げロス ${Math.round(bend)}</text>`;

  html += `<text x="310" y="22" fill="#ffe9a8" font-size="13"
            font-family="monospace" font-weight="bold" text-anchor="end">合計 ${Math.round(total)} mm</text>`;

  svg.innerHTML = html;
}

const LT_DIA = {
  D10: { unit: 0.560, bend: 50 },
  D13: { unit: 0.995, bend: 60 },
  D16: { unit: 1.56,  bend: 70 },
  D19: { unit: 2.25,  bend: 80 }
};

function clearLTateAll() {
  $('LtCount').textContent = '—';
  $('LtPerLen').textContent = '—';
  $('LtPerStock').textContent = '—';
  $('LtStockCount').textContent = '—';
  $('LtTotal').textContent = '—';
  $('LtWeight').textContent = '—';
  $('LtScrapPer').textContent = '—';
  $('LtScrapTotal').textContent = '—';
  $('LtRowScrapPer').style.display = '';
  $('LtRowScrapTotal').style.display = '';
  $('LtStockWarn').style.display = 'none';
}

function calcLTate() {
  const c = LreadCommon();
  const tate_L     = c.L;
  const tate_H     = c.H;
  const tate_B     = c.B;
  const tate_p     = c.pitchT;
  const tate_cover = c.cover;
  const tate_stock = c.stock;
  const tate_d     = LT_DIA[LcurrentDia];

  if (!isFinite(tate_L) || tate_L <= 0 || !isFinite(tate_H) || tate_H <= 0
      || !isFinite(tate_B) || tate_B <= 0 || !isFinite(tate_p) || tate_p <= 0
      || !isFinite(tate_cover) || tate_cover < 0
      || !isFinite(tate_stock) || tate_stock <= 0) {
    clearLTateAll();
    drawLTateFig(NaN, NaN, NaN, NaN);
    return 0;
  }

  const tate_perLen = (tate_H - tate_cover) + (tate_B - tate_cover) + tate_d.bend;
  if (tate_perLen <= 0) {
    clearLTateAll();
    $('LtPerLen').textContent = 'かぶり過大';
    drawLTateFig(NaN, NaN, NaN, NaN);
    return 0;
  }

  const tate_count = Math.floor(tate_L / tate_p) + 1;

  $('LtCount').textContent  = tate_count.toLocaleString() + ' 本';
  $('LtPerLen').textContent = Math.round(tate_perLen).toLocaleString() + ' mm';

  drawLTateFig(tate_H - tate_cover, tate_B - tate_cover, tate_d.bend, tate_perLen);

  const tate_perStock = Math.floor(tate_stock / tate_perLen);
  if (tate_perStock <= 0) {
    $('LtPerStock').textContent   = '定尺不足';
    $('LtStockCount').textContent = '—';
    $('LtTotal').textContent      = '—';
    $('LtWeight').textContent     = '—';
    $('LtScrapPer').textContent   = '—';
    $('LtScrapTotal').textContent = '—';
    $('LtRowScrapPer').style.display = 'none';
    $('LtRowScrapTotal').style.display = 'none';
    $('LtStockWarn').style.display = '';
    return 0;
  }

  const tate_stockCount = Math.ceil(tate_count / tate_perStock);
  const tate_total      = tate_stockCount * tate_stock;
  const tate_weight     = (tate_total / 1000) * tate_d.unit;

  $('LtPerStock').textContent   = tate_perStock.toLocaleString() + ' 本';
  $('LtStockCount').textContent = tate_stockCount.toLocaleString() + ' 本';
  $('LtTotal').textContent      = (tate_total / 1000).toFixed(2) + ' m';
  $('LtWeight').textContent     = tate_weight.toFixed(2) + ' kg';

  const tate_scrapPer   = tate_stock - tate_perLen * tate_perStock;
  const tate_scrapTotal = tate_scrapPer * tate_stockCount;

  $('LtScrapPer').textContent   = Math.round(tate_scrapPer).toLocaleString() + ' mm';
  $('LtScrapTotal').textContent = (tate_scrapTotal / 1000).toFixed(2) + ' m';
  $('LtRowScrapPer').style.display = '';
  $('LtRowScrapTotal').style.display = '';
  $('LtStockWarn').style.display = 'none';

  return tate_weight;
}

const LY_DIA = {
  D10: { unit: 0.560, anchor: 400 },
  D13: { unit: 0.995, anchor: 520 },
  D16: { unit: 1.56,  anchor: 640 },
  D19: { unit: 2.25,  anchor: 760 }
};

function clearLYokoAll() {
  $('LyCount').textContent = '—';
  $('LyPerRow').textContent = '—';
  $('LyStockCount').textContent = '—';
  $('LyRealTotal').textContent = '—';
  $('LyTotal').textContent = '—';
  $('LyWeight').textContent = '—';
}

function calcLYoko() {
  const c = LreadCommon();
  const yoko_L     = c.L;
  const yoko_H     = c.H;
  const yoko_B     = c.B;
  const yoko_p     = c.pitchY;
  const yoko_stock = c.stock;
  const yoko_d     = LY_DIA[LcurrentDia];

  if (!isFinite(yoko_L) || yoko_L <= 0 || !isFinite(yoko_H) || yoko_H <= 0
      || !isFinite(yoko_B) || yoko_B <= 0 || !isFinite(yoko_p) || yoko_p <= 0
      || !isFinite(yoko_stock) || yoko_stock <= 0) {
    clearLYokoAll();
    return 0;
  }

  const yoko_rowsH = Math.floor(yoko_H / yoko_p) + 1;
  const yoko_rowsB = Math.floor(yoko_B / yoko_p) + 1;
  const yoko_count = yoko_rowsH + yoko_rowsB - 1;

  const yoko_eff = yoko_stock - yoko_d.anchor;
  if (yoko_eff <= 0) {
    clearLYokoAll();
    return 0;
  }

  const yoko_perRow     = Math.ceil(yoko_L / yoko_eff);
  const yoko_stockTotal = yoko_count * yoko_perRow;
  const yoko_total      = yoko_stockTotal * yoko_stock;
  const yoko_weight     = (yoko_total / 1000) * yoko_d.unit;

  const yoko_realTotal = yoko_L * yoko_count;

  $('LyCount').textContent      = yoko_count.toLocaleString() + ' 本';
  $('LyPerRow').textContent     = yoko_perRow.toLocaleString() + ' 本';
  $('LyStockCount').textContent = yoko_stockTotal.toLocaleString() + ' 本';
  $('LyRealTotal').textContent  = (yoko_realTotal / 1000).toFixed(2) + ' m';
  $('LyTotal').textContent      = (yoko_total / 1000).toFixed(2) + ' m';
  $('LyWeight').textContent     = yoko_weight.toFixed(2) + ' kg';

  return yoko_weight;
}

function LrecalcAll() {
  const wT = calcLTate();
  const wY = calcLYoko();
  const sum = (wT || 0) + (wY || 0);
  $('LsumWeight').textContent = sum > 0 ? sum.toFixed(2) + ' kg' : '— kg';
  LsaveAll();
}

const LKEY = 'rebarLWall_v1';
function LsaveAll() {
  try {
    localStorage.setItem(LKEY, JSON.stringify({
      dia: LcurrentDia,
      cL:      $('LcL').value,
      cH:      $('LcH').value,
      cB:      $('LcB').value,
      cPitchT: $('LcPitchT').value,
      cPitchY: $('LcPitchY').value,
      cCover:  $('LcCover').value,
      cStock:  $('LcStock').value
    }));
  } catch (e) {}
}
function LloadAll() {
  try {
    const raw = localStorage.getItem(LKEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    if (d.dia) LcurrentDia = d.dia;
    const map = { cL:'LcL', cH:'LcH', cB:'LcB', cPitchT:'LcPitchT', cPitchY:'LcPitchY', cCover:'LcCover', cStock:'LcStock' };
    Object.keys(map).forEach(k => {
      if (d[k] !== undefined && d[k] !== null && d[k] !== '') $(map[k]).value = d[k];
    });
    document.querySelectorAll('#lDiaRow .dia-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.dia === LcurrentDia);
    });
  } catch (e) {}
}

['LcL','LcH','LcB','LcPitchT','LcPitchY','LcCover','LcStock'].forEach(id => {
  $(id).addEventListener('input', LrecalcAll);
});

/* ============================================================
   起動
============================================================ */
loadAll();
setupHomeMenuCustomize();
setupFeatureRequest();
recalcAll();
LloadAll();
LrecalcAll();

try {
  const m = localStorage.getItem('rebarMode_v1');
  if (m === 'L') switchRebarMode('L');
  else switchRebarMode('wall');
} catch (e) {
  switchRebarMode('wall');
}

window.switchRebarMode = switchRebarMode;
window.clearRebarField = clearRebarField;
window.resetRebarAllInputs = resetRebarAllInputs;
window.setRebarDiaWall = setRebarDiaWall;
window.setRebarDiaL = setRebarDiaL;

})();
