async function loadBudget() {
  const month = document.getElementById('budget-month').value;
  try {
    const [budgets, alerts] = await Promise.all([
      request('GET', `/budgets?month=${month}`),
      request('GET', '/budgets/alerts')
    ]);
    renderAlerts(alerts);
    renderBudgets(budgets);
  } catch (err) {
    showToast('Gagal memuat budget', 'error');
  }
}

function renderAlerts(alerts) {
  const el = document.getElementById('alerts-container');
  if (!alerts.length) { el.innerHTML = ''; return; }
  el.innerHTML = alerts.map(a => `
    <div class="alert alert-${a.type}">
      <span>${a.type === 'danger' ? '🚨' : '⚠️'}</span>
      ${a.message}
    </div>
  `).join('');
}

function renderBudgets(list) {
  const el = document.getElementById('budget-list');
  if (!list.length) {
    el.innerHTML = `<div class="empty-state">
      <div class="empty-icon">🎯</div>
      <p>Belum ada budget bulan ini. Klik "+ Set Budget" untuk mulai.</p>
    </div>`;
    return;
  }

  el.innerHTML = list.map(b => {
    const pct  = b.percentUsed;
    const cls  = pct >= 100 ? 'danger' : pct >= 80 ? 'warn' : '';
    return `
    <div class="budget-item">
      <div class="budget-header">
        <div class="budget-cat">
          <span style="font-size:22px">${b.category.icon}</span>
          <span>${b.category.name}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="budget-amounts">
            <strong>${formatRupiah(b.spent)}</strong> / ${formatRupiah(b.limitAmount)}
          </div>
          <button class="btn btn-outline btn-sm" onclick="editBudget('${b._id}', ${b.limitAmount})">✏️</button>
          <button class="btn btn-danger btn-sm"  onclick="deleteBudget('${b._id}')">🗑</button>
        </div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill ${cls}" style="width:${Math.min(pct,100)}%"></div>
      </div>
      <div class="budget-footer">
        <span style="color:var(--text-muted);font-size:13px">
          Sisa: <strong>${formatRupiah(b.remaining)}</strong>
        </span>
        <span style="font-weight:600;font-size:13px;color:${cls==='danger'?'var(--danger)':cls==='warn'?'var(--warning)':'var(--success)'}">
          ${pct}%
        </span>
      </div>
    </div>`;
  }).join('');
}

async function loadBudgetCategorySelect() {
  try {
    const cats = await request('GET', '/categories');
    const sel  = document.getElementById('budget-category');
    sel.innerHTML = cats
      .filter(c => c.type === 'expense' || c.type === 'both')
      .map(c => `<option value="${c._id}">${c.icon} ${c.name}</option>`)
      .join('');
  } catch {}
}

async function saveBudget() {
  const id       = document.getElementById('edit-budget-id').value;
  const category = document.getElementById('budget-category').value;
  const limit    = document.getElementById('budget-limit').value;
  const month    = document.getElementById('budget-month').value;

  if (!limit || Number(limit) <= 0) return showToast('Limit wajib diisi', 'error');

  try {
    if (id) {
      await request('PUT', `/budgets/${id}`, { limitAmount: limit });
      showToast('Budget diperbarui', 'success');
    } else {
      await request('POST', '/budgets', { category, limitAmount: limit, month });
      showToast('Budget disimpan', 'success');
    }
    closeModal('modal-budget');
    document.getElementById('edit-budget-id').value = '';
    loadBudget();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function editBudget(id, currentLimit) {
  document.getElementById('edit-budget-id').value = id;
  document.getElementById('budget-limit').value   = currentLimit;
  openModal('modal-budget');
}

async function deleteBudget(id) {
  if (!confirm('Hapus budget ini?')) return;
  try {
    await request('DELETE', `/budgets/${id}`);
    showToast('Budget dihapus', 'success');
    loadBudget();
  } catch (err) {
    showToast(err.message, 'error');
  }
}


const origOpenBudgetModal = window.openModal;
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('[onclick="openModal(\'modal-budget\')"]');
  if (btn) {
    btn.setAttribute('onclick', "openBudgetModal()");
  }
});

function openBudgetModal() {
  document.getElementById('edit-budget-id').value = '';
  document.getElementById('budget-limit').value   = '';
  loadBudgetCategorySelect();
  openModal('modal-budget');
}
