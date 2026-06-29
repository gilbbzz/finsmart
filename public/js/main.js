const API = '/api';
async function request(method, url, body = null) {
  const opts = {
    method,
    headers:     { 'Content-Type': 'application/json' },
    credentials: 'include'   
  };
  if (body) opts.body = JSON.stringify(body);
  const res  = await fetch(API + url, opts);
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

function formatRupiah(n) {
  return new Intl.NumberFormat('id-ID', {
    style:                 'currency',
    currency:              'IDR',
    minimumFractionDigits: 0
  }).format(n);
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

let _toastTimer = null;
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  
  if (_toastTimer) { clearTimeout(_toastTimer); _toastTimer = null; }
  t.style.animation = 'none';
  t.offsetHeight;   
  t.textContent  = msg;
  t.className    = 'toast' + (type ? ' ' + type : '');
  t.style.animation = '';
  t.classList.remove('hidden');
  _toastTimer = setTimeout(() => {
    t.style.animation = 'toast-fade-out .3s ease forwards';
    setTimeout(() => t.classList.add('hidden'), 280);
  }, 4000);
}

function openModal(id)  { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.add('hidden');
  });
});





async function login() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn      = document.querySelector('#login-form .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Memproses...'; }
  try {
    const data = await request('POST', '/auth/login', { email, password });
    setUser(data);
    showApp();
  } catch (err) {
    showToast('Login gagal: ' + err.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Masuk'; }
  }
}

async function register() {
  const name     = document.getElementById('reg-name').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const btn      = document.querySelector('#register-form .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Mendaftar...'; }
  try {
    const data = await request('POST', '/auth/register', { name, email, password });
    setUser(data);
    showApp();
  } catch (err) {
    showToast('Pendaftaran gagal: ' + err.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Buat Akun'; }
  }
}

async function logout() {
  try {
    
    await fetch(API + '/auth/logout', { method: 'POST', credentials: 'include' });
  } catch {
    
  }
  
  localStorage.removeItem('finsmart_user');
  document.getElementById('app').classList.add('hidden');
  document.getElementById('auth-page').classList.remove('hidden');
}




function setUser(data) {
  const safeData = { _id: data._id, name: data.name, email: data.email };
  localStorage.setItem('finsmart_user', JSON.stringify(safeData));
  document.getElementById('user-name').textContent   = data.name;
  document.getElementById('user-avatar').textContent = data.name.charAt(0).toUpperCase();
}





function pushRoute(path, replace = false) {
  if (replace) {
    window.history.replaceState(null, '', path);
  } else {
    window.history.pushState(null, '', path);
  }
}

function showTab(tab, updateUrl = true) {
  document.getElementById('login-form').classList.toggle('hidden',    tab !== 'login');
  document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
  document.querySelectorAll('.tab-btn').forEach((b, i) => {
    b.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'register'));
  });

  if (updateUrl) pushRoute(tab === 'register' ? '/register' : '/login');
}

function showApp() {
  document.getElementById('auth-page').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  initApp();
}

function openDashMonthPicker() {
  const picker = document.getElementById('dash-month');
  if (!picker) return;
  if (picker.showPicker) { picker.showPicker(); } else { picker.focus(); picker.click(); }
}

function navigate(page) {
  document.querySelectorAll('#main-primary .page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  ['debts','recurring','investments','health'].forEach(p => {
    const wrap = document.getElementById(`page-${p}-wrap`);
    if (wrap) wrap.style.display = 'none';
  });

  const mainPrimary = document.getElementById('main-primary');
  const newPages    = ['debts','recurring','investments','health'];

  if (newPages.includes(page)) {
    if (mainPrimary) mainPrimary.style.display = 'none';
    const wrap = document.getElementById(`page-${page}-wrap`);
    if (wrap) wrap.style.display = '';
  } else {
    if (mainPrimary) mainPrimary.style.display = '';
    const el = document.getElementById('page-' + page);
    if (el) el.classList.add('active');
  }

  const navEl = document.querySelector(`[data-page="${page}"]`);
  if (navEl) navEl.classList.add('active');

  const routePaths = {
    dashboard:    '/dashboard',
    transactions: '/transaksi',
    budget:       '/budget',
    goals:        '/target-tabungan',
    categories:   '/kategori',
    debts:        '/hutang-piutang',
    recurring:    '/transaksi-berulang',
    investments:  '/portofolio',
    health:       '/kesehatan-finansial'
  };
  pushRoute(routePaths[page] || `/${page}`);

  const loaders = {
    dashboard:    loadDashboard,
    transactions: () => { loadTransactions(); loadCategoryFilter(); },
    budget:       () => { loadBudget(); loadBudgetCategorySelect(); },
    goals:        loadGoals,
    categories:   loadCategories,
    debts:        loadDebts,
    recurring:    () => { loadRecurring(); },
    investments:  loadInvestments,
    health:       loadHealthScore
  };
  if (loaders[page]) loaders[page]();
  return false;
}

function handleRoute() {
  const path    = window.location.pathname;

  
  const params = new URLSearchParams(window.location.search);
  const oauthError = params.get('error');
  if (oauthError) {
    const errorMsg = {
      google_auth_failed: 'Login Google gagal. Silakan coba lagi.',
      server_error:       'Terjadi kesalahan server. Silakan coba lagi.'
    }[oauthError] || 'Terjadi kesalahan. Silakan coba lagi.';
    
    window.history.replaceState(null, '', window.location.pathname);
    
    setTimeout(() => showToast(oauthError === 'server_error' ? errorMsg : errorMsg, 'error'), 100);
  }
  const pathMap = {
    '/dashboard':           'dashboard',
    '/transaksi':           'transactions',
    '/budget':              'budget',
    '/target-tabungan':     'goals',
    '/kategori':            'categories',
    '/hutang-piutang':      'debts',
    '/transaksi-berulang':  'recurring',
    '/portofolio':          'investments',
    '/kesehatan-finansial': 'health'
  };

  if (path === '/login' || path === '/register') {
    document.getElementById('auth-page').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
    showTab(path === '/register' ? 'register' : 'login', false);
    return;
  }

  const page = pathMap[path] || 'dashboard';
  if (!document.getElementById('app').classList.contains('hidden')) {
    navigate(page);
  }
}





async function initApp() {
  const now      = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

  document.getElementById('dash-month').value   = monthStr;
  document.getElementById('budget-month').value = monthStr;
  const healthMonthEl = document.getElementById('health-month');
  if (healthMonthEl) healthMonthEl.value = monthStr;

  document.getElementById('trans-date').value = now.toISOString().split('T')[0];
  loadDashboard();
}








async function loadDashboard() {
  const month = document.getElementById('dash-month').value;
  try {
    const data = await request('GET', `/summary?month=${month}`);

    document.getElementById('total-income').textContent  = formatRupiah(data.income.total);
    document.getElementById('total-expense').textContent = formatRupiah(data.expense.total);
    document.getElementById('total-balance').textContent = formatRupiah(data.balance);
    document.getElementById('count-income').textContent  = `${data.income.count} transaksi`;
    document.getElementById('count-expense').textContent = `${data.expense.count} transaksi`;

    const balEl = document.getElementById('total-balance');
    balEl.style.color = data.balance >= 0 ? 'var(--success)' : 'var(--danger)';

    renderTopTransactions(data.topTransactions);
    renderPieChart(data.categoryData);    
    await loadBarChart();                 

  } catch (err) {
    showToast('Gagal memuat dashboard: ' + err.message, 'error');
  }
}

function renderTopTransactions(list) {
  const el = document.getElementById('top-transactions');
  if (!list || !list.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><p>Belum ada transaksi bulan ini</p></div>';
    return;
  }
  el.innerHTML = list.map(t => `
    <div class="top-trans-item">
      <span style="font-size:24px">${t.category?.icon || '📦'}</span>
      <div class="top-trans-info">
        <div class="top-trans-name">${t.note || t.category?.name || '-'}</div>
        <div class="top-trans-date">${formatDate(t.date)} · ${t.category?.name || '-'}</div>
      </div>
      <span class="top-trans-amount" style="color:${t.type==='income'?'var(--success)':'var(--danger)'}">
        ${t.type==='income'?'+':'-'}${formatRupiah(t.amount)}
      </span>
    </div>
  `).join('');
}




(async () => {
  try {
    
    
    const res  = await fetch(API + '/auth/me', { credentials: 'include' });
    const json = await res.json();
    if (json.success && json.data) {
      setUser(json.data);
      showApp();
      handleRoute();
    } else {
      handleRoute();
    }
  } catch {
    handleRoute();
  }
})();

window.addEventListener('popstate', handleRoute);
