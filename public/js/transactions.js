let searchTimer = null;

function debounceSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadTransactions, 400);
}

async function loadTransactions() {
  const type     = document.getElementById('filter-type').value;
  const category = document.getElementById('filter-category').value;
  const start    = document.getElementById('filter-start').value;
  const end      = document.getElementById('filter-end').value;
  const search   = document.getElementById('filter-search').value.trim();

  const params = new URLSearchParams();
  if (type)     params.append('type', type);
  if (category) params.append('category', category);
  if (start)    params.append('startDate', start);
  if (end)      params.append('endDate', end);
  if (search)   params.append('search', search);

  try {
    const list = await request('GET', `/transactions?${params}`);
    renderTransactions(list);
  } catch (err) {
    showToast('Gagal memuat transaksi', 'error');
  }
}

function renderTransactions(list) {
  const el = document.getElementById('transactions-list');
  if (!list.length) {
    el.innerHTML = `<div class="empty-state">
      <div class="empty-icon">💳</div>
      <p>Tidak ada transaksi ditemukan</p>
    </div>`;
    return;
  }

  el.innerHTML = list.map(t => `
    <div class="trans-item">
      <div class="trans-cat-icon" style="background:${t.category?.color || '#e2e8f0'}22">
        <span style="font-size:20px">${t.category?.icon || '📦'}</span>
      </div>
      <div class="trans-info">
        <div class="trans-note">${t.note || t.category?.name || 'Tanpa catatan'}</div>
        <div class="trans-meta">${formatDate(t.date)} · ${t.category?.name || '-'}</div>
      </div>
      <span class="trans-amount ${t.type}">
        ${t.type === 'income' ? '+' : '-'}${formatRupiah(t.amount)}
      </span>
      <div class="trans-actions">
        <button class="btn btn-outline btn-sm" onclick="editTransaction('${t._id}')">✏️</button>
        <button class="btn btn-danger btn-sm"  onclick="deleteTransaction('${t._id}')">🗑</button>
      </div>
    </div>
  `).join('');
}

async function loadCategoryFilter() {
  try {
    const cats = await request('GET', '/categories');
    const sel  = document.getElementById('filter-category');
    const opts = cats.map(c => `<option value="${c._id}">${c.icon} ${c.name}</option>`).join('');
    sel.innerHTML = '<option value="">Semua Kategori</option>' + opts;

    
    const transSel = document.getElementById('trans-category');
    transSel.innerHTML = cats.map(c => `<option value="${c._id}">${c.icon} ${c.name}</option>`).join('');
  } catch {}
}

function openTransactionModal() {
  document.getElementById('edit-trans-id').value = '';
  document.getElementById('modal-trans-title').textContent = 'Tambah Transaksi';
  document.getElementById('trans-amount').value = '';
  document.getElementById('trans-note').value   = '';
  document.getElementById('trans-date').value   = new Date().toISOString().split('T')[0];
  setType('income');
  loadCategoryFilter();
  openModal('modal-transaction');
}


document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('[onclick="openModal(\'modal-transaction\')"]');
  if (btn) btn.setAttribute('onclick', 'openTransactionModal()');
});

function setType(type) {
  document.getElementById('trans-type').value = type;
  document.getElementById('btn-income').classList.toggle('active', type === 'income');
  document.getElementById('btn-expense').classList.toggle('active', type === 'expense');
}

async function saveTransaction() {
  const id       = document.getElementById('edit-trans-id').value;
  const type     = document.getElementById('trans-type').value;
  const amount   = document.getElementById('trans-amount').value;
  const category = document.getElementById('trans-category').value;
  const note     = document.getElementById('trans-note').value.trim();
  const date     = document.getElementById('trans-date').value;

  if (!amount || Number(amount) <= 0) return showToast('Nominal harus diisi', 'error');
  if (!category) return showToast('Pilih kategori', 'error');

  try {
    if (id) {
      await request('PUT', `/transactions/${id}`, { type, amount, category, note, date });
      showToast('Transaksi diperbarui', 'success');
    } else {
      await request('POST', '/transactions', { type, amount, category, note, date });
      showToast('Transaksi ditambahkan', 'success');
    }
    closeModal('modal-transaction');
    loadTransactions();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function editTransaction(id) {
  try {
    
    const list = await request('GET', '/transactions');
    const t    = list.find(x => x._id === id);
    if (!t) return;

    await loadCategoryFilter();

    document.getElementById('edit-trans-id').value  = t._id;
    document.getElementById('modal-trans-title').textContent = 'Edit Transaksi';
    document.getElementById('trans-amount').value   = t.amount;
    document.getElementById('trans-note').value     = t.note || '';
    document.getElementById('trans-date').value     = t.date.split('T')[0];
    document.getElementById('trans-category').value = t.category?._id || '';
    setType(t.type);

    openModal('modal-transaction');
  } catch (err) {
    showToast('Gagal memuat data', 'error');
  }
}

async function deleteTransaction(id) {
  if (!confirm('Hapus transaksi ini?')) return;
  try {
    await request('DELETE', `/transactions/${id}`);
    showToast('Transaksi dihapus', 'success');
    loadTransactions();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function exportCSV() {
  try {
    const res = await fetch('/api/transactions/export', { credentials: 'include' });
    if (!res.ok) throw new Error('Gagal export');
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'transaksi-finsmart.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Export berhasil', 'success');
  } catch (err) {
    showToast('Gagal export: ' + err.message, 'error');
  }
}

function clearFilters() {
  ['filter-type','filter-category'].forEach(id => document.getElementById(id).value = '');
  ['filter-start','filter-end','filter-search'].forEach(id => document.getElementById(id).value = '');
  loadTransactions();
}
