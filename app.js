const API_BASE = ''; // relative base

const els = {
  counterTitle: document.getElementById('counterTitle'),
  currentCounterLabel: document.getElementById('currentCounterLabel'),
  daysCount: document.getElementById('daysCount'),
  timeDetail: document.getElementById('timeDetail'),
  startInfo: document.getElementById('startInfo'),
  statusMsg: document.getElementById('statusMsg'),
  progressFill: document.getElementById('progressFill'),
  progressText: document.getElementById('progressText'),
  adminForm: document.getElementById('adminForm'),
  username: document.getElementById('username'),
  password: document.getElementById('password'),
  manualStart: document.getElementById('manualStart'),
  btnStartNow: document.getElementById('btnStartNow'),
  btnSetManual: document.getElementById('btnSetManual'),
  btnReset: document.getElementById('btnReset'),
  urlDisplay: document.getElementById('urlDisplay'),
  idDisplay: document.getElementById('idDisplay'),
};

let counterId = 'default';
let startTime = null;

function deriveCounterIdFromPath() {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  return path || 'default';
}

function prettifyId(id) {
  if (id === 'default') return 'Default Counter';
  return id
    .split('-')
    .join(' ')
    .split('_')
    .join(' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function setStatus(message, isError = false) {
  els.statusMsg.textContent = message || '';
  els.statusMsg.classList.toggle('error', !!isError);
  if (message) {
    setTimeout(() => {
      if (els.statusMsg.textContent === message) {
        els.statusMsg.textContent = '';
        els.statusMsg.classList.remove('error');
      }
    }, 2500);
  }
}

async function fetchCounter() {
  try {
    const res = await fetch(
      `${API_BASE}/api/counter?id=${encodeURIComponent(counterId)}`
    );
    if (!res.ok) throw new Error('Gagal fetch counter');
    const data = await res.json();
    startTime = typeof data.startTime === 'number' ? data.startTime : null;
  } catch (e) {
    console.error(e);
  }
}

function updateDisplay() {
  if (!startTime) {
    els.daysCount.textContent = '0';
    els.timeDetail.textContent = '0 jam 0 menit 0 detik';
    els.startInfo.textContent = 'Belum ada data. Gunakan panel admin untuk mulai.';
    els.progressFill.style.width = '0%';
    els.progressText.textContent = '0%';
    return;
  }

  const now = Date.now();
  let diffMs = now - startTime;
  if (diffMs < 0) diffMs = 0;

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  const remMinutes = minutes % 60;
  const remSeconds = seconds % 60;

  els.daysCount.textContent = String(days);
  els.timeDetail.textContent = `${remHours} jam ${remMinutes} menit ${remSeconds} detik`;

  const d = new Date(startTime);
  els.startInfo.textContent =
    'Mulai dihitung sejak: ' +
    d.toLocaleString('id-ID', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  const goal = 365;
  let pct = (days / goal) * 100;
  if (pct > 100) pct = 100;
  if (pct < 0) pct = 0;
  els.progressFill.style.width = `${pct.toFixed(1)}%`;
  els.progressText.textContent = `${pct.toFixed(1)}%`;
}

function getAdminCreds() {
  return {
    username: els.username.value.trim(),
    password: els.password.value,
  };
}

async function callAction(action, extra = {}) {
  const { username, password } = getAdminCreds();
  if (!username || !password) {
    setStatus('Isi username dan password dulu.', true);
    return;
  }

  try {
    const res = await fetch(
      `${API_BASE}/api/counter?id=${encodeURIComponent(counterId)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, username, password, ...extra }),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || 'Gagal menjalankan aksi.', true);
      return;
    }

    if (data.startTime) {
      startTime = data.startTime;
    }
    if (action === 'reset') {
      startTime = null;
    }

    if (action === 'startNow') {
      setStatus('Counter dimulai dari sekarang.');
    } else if (action === 'setStart') {
      setStatus('Waktu mulai diperbarui.');
    } else if (action === 'reset') {
      setStatus('Counter di-reset.');
    } else if (action === 'authTest') {
      setStatus('Password benar.');
    }
  } catch (e) {
    console.error(e);
    setStatus('Terjadi error di server.', true);
  }
}

async function init() {
  counterId = deriveCounterIdFromPath();

  els.counterTitle.textContent = prettifyId(counterId);
  els.currentCounterLabel.textContent = `Counter: ${counterId}`;
  els.urlDisplay.textContent = window.location.href;
  els.idDisplay.textContent = counterId;

  els.btnStartNow.addEventListener('click', () => callAction('startNow'));
  els.btnSetManual.addEventListener('click', () => {
    const val = els.manualStart.value;
    if (!val) {
      setStatus('Pilih tanggal & jam dulu.', true);
      return;
    }
    const ts = new Date(val).getTime();
    if (Number.isNaN(ts)) {
      setStatus('Tanggal tidak valid.', true);
      return;
    }
    callAction('setStart', { startTime: ts });
  });
  els.btnReset.addEventListener('click', () => {
    if (!confirm('Yakin reset counter ini?')) return;
    callAction('reset');
  });

  await fetchCounter();
  updateDisplay();

  setInterval(updateDisplay, 1000);
  setInterval(fetchCounter, 10000);
}

init();
