const API_BASE = ''; // relative base

const els = {
  counterTitle: document.getElementById('counterTitle'),
  currentCounterLabel: document.getElementById('currentCounterLabel'),
  adminBadge: document.getElementById('adminBadge'),
  daysCount: document.getElementById('daysCount'),
  timeDetail: document.getElementById('timeDetail'),
  startInfo: document.getElementById('startInfo'),
  statusMsg: document.getElementById('statusMsg'),
  progressFill: document.getElementById('progressFill'),
  progressText: document.getElementById('progressText'),
  adminControls: document.getElementById('adminControls'),
  btnStartNow: document.getElementById('btnStartNow'),
  btnReset: document.getElementById('btnReset'),
  manualStart: document.getElementById('manualStart'),
  btnSetManual: document.getElementById('btnSetManual'),
  loginForm: document.getElementById('loginForm'),
  username: document.getElementById('username'),
  password: document.getElementById('password'),
  btnLogout: document.getElementById('btnLogout'),
  urlDisplay: document.getElementById('urlDisplay'),
  idDisplay: document.getElementById('idDisplay'),
};

let counterId = 'default';
let startTime = null;
let isAdmin = false;

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

function updateAdminUI() {
  if (isAdmin) {
    els.adminBadge.textContent = 'Admin';
    els.adminBadge.classList.remove('badge-viewer');
    els.adminBadge.classList.add('badge-admin');
    els.adminControls.classList.remove('hidden');
  } else {
    els.adminBadge.textContent = 'Viewer';
    els.adminBadge.classList.remove('badge-admin');
    els.adminBadge.classList.add('badge-viewer');
    els.adminControls.classList.add('hidden');
  }
}

async function fetchMe() {
  try {
    const res = await fetch(`${API_BASE}/api/me`);
    if (!res.ok) throw new Error('fail');
    const data = await res.json();
    isAdmin = !!data.isAdmin;
    updateAdminUI();
  } catch (e) {
    // ignore
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
    els.startInfo.textContent = 'Belum ada data. Admin bisa mulai counter ini.';
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

async function login(e) {
  e.preventDefault();
  const username = els.username.value.trim();
  const password = els.password.value;
  if (!username || !password) {
    setStatus('Isi username & password.', true);
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || 'Login gagal', true);
      return;
    }
    setStatus('Login berhasil.');
    els.password.value = '';
    await fetchMe();
  } catch (e) {
    console.error(e);
    setStatus('Terjadi error saat login.', true);
  }
}

async function logout() {
  try {
    const res = await fetch(`${API_BASE}/api/logout`, { method: 'POST' });
    if (!res.ok) throw new Error('fail');
    isAdmin = false;
    updateAdminUI();
    setStatus('Logout berhasil.');
  } catch (e) {
    setStatus('Gagal logout.', true);
  }
}

async function startNow() {
  if (!isAdmin) {
    setStatus('Hanya admin yang bisa mulai.', true);
    return;
  }
  try {
    const res = await fetch(
      `${API_BASE}/api/counter?id=${encodeURIComponent(counterId)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'startNow' }),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || 'Gagal mulai counter.', true);
      return;
    }
    startTime = data.startTime;
    setStatus('Counter dimulai dari sekarang.');
  } catch (e) {
    console.error(e);
    setStatus('Terjadi error saat mulai.', true);
  }
}

async function setManual() {
  if (!isAdmin) {
    setStatus('Hanya admin yang bisa set manual.', true);
    return;
  }
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

  try {
    const res = await fetch(
      `${API_BASE}/api/counter?id=${encodeURIComponent(counterId)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setStart', startTime: ts }),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || 'Gagal set waktu.', true);
      return;
    }
    startTime = data.startTime;
    setStatus('Waktu mulai diperbarui.');
  } catch (e) {
    console.error(e);
    setStatus('Terjadi error saat set waktu.', true);
  }
}

async function resetCounter() {
  if (!isAdmin) {
    setStatus('Hanya admin yang bisa reset.', true);
    return;
  }
  if (!confirm('Yakin reset counter ini?')) return;

  try {
    const res = await fetch(
      `${API_BASE}/api/counter?id=${encodeURIComponent(counterId)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || 'Gagal reset.', true);
      return;
    }
    startTime = null;
    setStatus('Counter di-reset.');
  } catch (e) {
    console.error(e);
    setStatus('Terjadi error saat reset.', true);
  }
}

async function init() {
  counterId = deriveCounterIdFromPath();

  els.counterTitle.textContent = prettifyId(counterId);
  els.currentCounterLabel.textContent = `Counter: ${counterId}`;
  els.urlDisplay.textContent = window.location.href;
  els.idDisplay.textContent = counterId;

  els.loginForm.addEventListener('submit', login);
  els.btnLogout.addEventListener('click', logout);
  els.btnStartNow.addEventListener('click', startNow);
  els.btnSetManual.addEventListener('click', setManual);
  els.btnReset.addEventListener('click', resetCounter);

  await fetchMe();
  await fetchCounter();
  updateDisplay();

  setInterval(updateDisplay, 1000);
  setInterval(fetchCounter, 10000);
}

init();
