let _recurringList = [];

async function loadRecurring() {
  try {
    _recurringList = await request('GET', '/recurring');
    renderRecurringList(_recurringList);
  } catch (err) {
    showToast('Gagal memuat transaksi berulang: ' + err.message, 'error');
  }
}

function renderRecurringList(list) {
  const el = document.getElementById('recurring-list');
  if (!list.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">🔁</div><p>Belum ada transaksi berulang.<br>Tambahkan gaji, tagihan, atau cicilan rutin.</p></div>`;
    return;
  }

  el.innerHTML = list.map(r => {
    const isIncome     = r.type === 'income';
    const typeColor    = isIncome ? 'var(--success)' : 'var(--danger)';
    const typeIcon     = isIncome ? '📈' : '📉';
    const catIcon      = r.category?.icon || '📦';
    const catName      = r.category?.name || '-';
    const freqLabel    = r.frequencyLabel || r.frequency;
    const execCount    = r.executionCount ?? 0;
    const lastExec     = r.lastExecuted ? formatDate(r.lastExecuted) : 'Belum pernah';
    const nextExec     = r.nextExecution || '-';

    return `
    <div class="recurring-card ${!r.isActive ? 'recurring-inactive' : ''}">
      <div class="recurring-card-left">
        <span style="font-size:28px">${catIcon}</span>
        <div>
          <h4 class="recurring-title">${r.title}</h4>
          <div style="font-size:0.83rem;color:var(--text-secondary);margin-top:2px">
            ${catName} · ${typeIcon} ${isIncome ? 'Pemasukan' : 'Pengeluaran'} · 🔁 ${freqLabel}
          </div>
          <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:2px">
            Berikutnya: <strong>${nextExec}</strong> · Terakhir: ${lastExec} · ${execCount}x dieksekusi
          </div>
        </div>
      </div>
      <div class="recurring-card-right">
        <span class="recurring-amount" style="color:${typeColor}">${isIncome ? '+' : '-'}${formatRupiah(r.amount)}</span>
        <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;justify-content:flex-end">
          ${r.isActive ? `
            <button class="btn btn-primary btn-sm" onclick="executeRecurring('${r._id}', '${r.title}')" title="Jalankan sekarang">▶ Jalankan</button>
            <button class="btn btn-outline btn-sm" onclick="toggleRecurring('${r._id}', false)">⏸ Nonaktif</button>
          ` : `
            <button class="btn btn-outline btn-sm" onclick="toggleRecurring('${r._id}', true)">▶ Aktifkan</button>
          `}
          <button class="btn btn-outline btn-sm" onclick="openRecurringModal('${r._id}')">✏️</button>
          <button class="btn btn-outline btn-sm btn-danger" onclick="deleteRecurring('${r._id}')">🗑️</button>
        </div>
      </div>
    </div>`;
  }).join('');
}



async function openRecurringModal(id = null) {
  
  document.getElementById('edit-recurring-id').value  = '';
  document.getElementById('recurring-title').value    = '';
  document.getElementById('recurring-type').value     = 'income';
  document.getElementById('recurring-amount').value   = '';
  document.getElementById('recurring-frequency').value = 'monthly';
  document.getElementById('recurring-day').value      = '1';
  document.getElementById('recurring-start').value    = new Date().toISOString().split('T')[0];
  document.getElementById('recurring-end').value      = '';
  setRecType('income');
  toggleDayOfMonth();

  
  await loadRecurringCategorySelect();

  if (id) {
    const r = _recurringList.find(x => x._id === id);
    if (!r) return;
    document.getElementById('edit-recurring-id').value   = r._id;
    document.getElementById('recurring-title').value     = r.title;
    document.getElementById('recurring-amount').value    = r.amount;
    document.getElementById('recurring-frequency').value = r.frequency;
    document.getElementById('recurring-day').value       = r.dayOfMonth || 1;
    document.getElementById('recurring-start').value     = r.startDate?.split('T')[0] || '';
    document.getElementById('recurring-end').value       = r.endDate?.split('T')[0] || '';
    setRecType(r.type);
    toggleDayOfMonth();
    document.getElementById('recurring-category').value  = r.category?._id || r.category || '';
    document.getElementById('modal-recurring-title').textContent = 'Edit Transaksi Berulang';
  } else {
    document.getElementById('modal-recurring-title').textContent = 'Tambah Transaksi Berulang';
  }

  openModal('modal-recurring');
}

async function loadRecurringCategorySelect() {
  try {
    const categories = await request('GET', '/categories');
    const sel = document.getElementById('recurring-category');
    sel.innerHTML = categories.map(c => `<option value="${c._id}">${c.icon} ${c.name}</option>`).join('');
  } catch (err) {
    console.error('Gagal load kategori recurring:', err);
  }
}

function setRecType(type) {
  document.getElementById('recurring-type').value = type;
  document.getElementById('btn-rec-income').classList.toggle('active', type === 'income');
  document.getElementById('btn-rec-expense').classList.toggle('active', type === 'expense');
}

function toggleDayOfMonth() {
  const freq  = document.getElementById('recurring-frequency').value;
  const group = document.getElementById('recurring-day-group');
  group.style.display = freq === 'monthly' ? '' : 'none';
}

async function saveRecurring() {
  const id        = document.getElementById('edit-recurring-id').value;
  const title     = document.getElementById('recurring-title').value.trim();
  const type      = document.getElementById('recurring-type').value;
  const amount    = document.getElementById('recurring-amount').value;
  const category  = document.getElementById('recurring-category').value;
  const frequency = document.getElementById('recurring-frequency').value;
  const dayOfMonth = document.getElementById('recurring-day').value;
  const startDate = document.getElementById('recurring-start').value;
  const endDate   = document.getElementById('recurring-end').value;

  if (!title || !amount || !category || !startDate) {
    showToast('Judul, nominal, kategori, dan tanggal mulai wajib diisi', 'error');
    return;
  }

  try {
    const body = { title, type, amount, category, frequency, dayOfMonth, startDate, endDate: endDate || undefined };
    if (id) {
      await request('PUT', `/recurring/${id}`, body);
      showToast('Berhasil diperbarui', 'success');
    } else {
      await request('POST', '/recurring', body);
      showToast('Transaksi berulang berhasil dibuat', 'success');
    }
    closeModal('modal-recurring');
    loadRecurring();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function executeRecurring(id, title) {
  if (!confirm(`Jalankan transaksi "${title}" sekarang?`)) return;
  try {
    await request('POST', `/recurring/${id}/execute`);
    showToast(`✅ Transaksi "${title}" berhasil dieksekusi`, 'success');
    loadRecurring();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function executeAllDue() {
  try {
    const result = await request('POST', '/recurring/execute-due/all');
    showToast(Array.isArray(result) && result.length > 0
      ? `✅ ${result.length} transaksi berhasil dieksekusi`
      : 'Tidak ada transaksi yang jatuh tempo hari ini', 'success');
    loadRecurring();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function toggleRecurring(id, isActive) {
  try {
    await request('PUT', `/recurring/${id}`, { isActive });
    showToast(isActive ? 'Transaksi diaktifkan' : 'Transaksi dinonaktifkan', 'success');
    loadRecurring();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteRecurring(id) {
  if (!confirm('Hapus transaksi berulang ini?')) return;
  try {
    await request('DELETE', `/recurring/${id}`);
    showToast('Berhasil dihapus', 'success');
    loadRecurring();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
