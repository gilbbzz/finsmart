let _debts = [];
async function loadDebts() {
  try {
    const type   = document.getElementById('debt-filter-type').value;
    const isPaid = document.getElementById('debt-filter-paid').value;

    let url = '/debts?';
    if (type)   url += `type=${type}&`;
    if (isPaid !== '') url += `isPaid=${isPaid}&`;

    const data = await request('GET', url);
    _debts = data.debts;
    renderDebtSummary(data.summary);
    renderDebtList(_debts);
  } catch (err) {
    showToast('Gagal memuat hutang piutang: ' + err.message, 'error');
  }
}

function renderDebtSummary(summary) {
  document.getElementById('debt-total-hutang').textContent  = formatRupiah(summary.totalDebt);
  document.getElementById('debt-total-piutang').textContent = formatRupiah(summary.totalReceivable);
  document.getElementById('debt-paid-count').textContent    = summary.paidCount;
}

function renderDebtList(list) {
  const el = document.getElementById('debt-list');
  if (!list.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">💸</div><p>Belum ada data hutang piutang</p></div>`;
    return;
  }

  el.innerHTML = list.map(d => {
    const isDebt       = d.type === 'debt';
    const paidPct      = d.paidPercent ?? Math.min(Math.round((d.paidAmount / d.amount) * 100), 100);
    const remaining    = d.remainingAmount ?? Math.max(d.amount - d.paidAmount, 0);
    const isOverdue    = !d.isPaid && d.dueDate && new Date(d.dueDate) < new Date();
    const dueDateLabel = d.dueDate ? formatDate(d.dueDate) : '-';
    const typeLabel    = isDebt ? '📤 Hutangku ke' : '📥 Piutangku dari';
    const typeColor    = isDebt ? 'var(--danger)' : 'var(--success)';

    return `
    <div class="debt-card ${d.isPaid ? 'debt-paid' : ''} ${isOverdue ? 'debt-overdue' : ''}">
      <div class="debt-card-header">
        <div>
          <span class="debt-type-badge" style="color:${typeColor};font-size:0.8rem;font-weight:600">${typeLabel}</span>
          <h4 class="debt-name">${d.personName}</h4>
        </div>
        <div style="text-align:right">
          <div class="debt-amount">${formatRupiah(d.amount)}</div>
          ${d.isPaid
            ? `<span class="badge badge-success">✅ Lunas</span>`
            : isOverdue
              ? `<span class="badge badge-danger">⚠️ Jatuh Tempo ${dueDateLabel}</span>`
              : `<span class="badge badge-neutral">Jatuh Tempo: ${dueDateLabel}</span>`
          }
        </div>
      </div>
      ${d.description ? `<p class="debt-desc">${d.description}</p>` : ''}
      ${!d.isPaid ? `
      <div class="progress-wrap" style="margin:10px 0">
        <div style="display:flex;justify-content:space-between;font-size:0.8rem;color:var(--text-secondary);margin-bottom:4px">
          <span>Terbayar: ${formatRupiah(d.paidAmount)}</span>
          <span>Sisa: ${formatRupiah(remaining)}</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width:${paidPct}%;background:${typeColor}"></div>
        </div>
        <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:2px">${paidPct}% terbayar</div>
      </div>` : ''}
      <div class="debt-actions" style="display:flex;gap:8px;margin-top:12px">
        ${!d.isPaid ? `<button class="btn btn-primary btn-sm" onclick="openPayModal('${d._id}', ${remaining})">💰 Bayar</button>` : ''}
        ${!d.isPaid ? `<button class="btn btn-outline btn-sm" onclick="openDebtModal('${d._id}')">✏️</button>` : ''}
        <button class="btn btn-outline btn-sm btn-danger" onclick="deleteDebt('${d._id}')">🗑️</button>
      </div>
    </div>`;
  }).join('');
}



function openDebtModal(id = null) {
  document.getElementById('edit-debt-id').value = '';
  document.getElementById('debt-type').value    = 'debt';
  document.getElementById('debt-person').value  = '';
  document.getElementById('debt-amount').value  = '';
  document.getElementById('debt-due').value     = '';
  document.getElementById('debt-desc').value    = '';
  setDebtType('debt');

  if (id) {
    const d = _debts.find(x => x._id === id);
    if (!d) return;
    document.getElementById('edit-debt-id').value = d._id;
    document.getElementById('debt-person').value  = d.personName;
    document.getElementById('debt-amount').value  = d.amount;
    document.getElementById('debt-due').value     = d.dueDate ? d.dueDate.split('T')[0] : '';
    document.getElementById('debt-desc').value    = d.description || '';
    setDebtType(d.type);
    document.getElementById('modal-debt-title').textContent = 'Edit Hutang / Piutang';
  } else {
    document.getElementById('modal-debt-title').textContent = 'Tambah Hutang / Piutang';
  }
  openModal('modal-debt');
}

function setDebtType(type) {
  document.getElementById('debt-type').value = type;
  document.getElementById('btn-debt').classList.toggle('active', type === 'debt');
  document.getElementById('btn-receivable').classList.toggle('active', type === 'receivable');
  document.getElementById('debt-person-label').textContent =
    type === 'debt' ? 'Nama Kreditur (yang memberi hutang)' : 'Nama Debitur (yang berhutang ke kamu)';
}

async function saveDebt() {
  const id     = document.getElementById('edit-debt-id').value;
  const type   = document.getElementById('debt-type').value;
  const person = document.getElementById('debt-person').value.trim();
  const amount = document.getElementById('debt-amount').value;
  const due    = document.getElementById('debt-due').value;
  const desc   = document.getElementById('debt-desc').value.trim();

  if (!person || !amount) { showToast('Nama orang dan nominal wajib diisi', 'error'); return; }

  try {
    const body = { type, personName: person, amount, dueDate: due || undefined, description: desc };
    if (id) {
      await request('PUT', `/debts/${id}`, body);
      showToast('Data berhasil diperbarui', 'success');
    } else {
      await request('POST', '/debts', body);
      showToast('Data berhasil ditambahkan', 'success');
    }
    closeModal('modal-debt');
    loadDebts();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteDebt(id) {
  if (!confirm('Hapus data ini?')) return;
  try {
    await request('DELETE', `/debts/${id}`);
    showToast('Data dihapus', 'success');
    loadDebts();
  } catch (err) {
    showToast(err.message, 'error');
  }
}



function openPayModal(id, remaining) {
  document.getElementById('pay-debt-id').value    = id;
  document.getElementById('pay-amount').value     = '';
  document.getElementById('pay-note').value       = '';
  document.getElementById('pay-remaining-info').innerHTML =
    `Sisa yang perlu dibayar: <strong>${formatRupiah(remaining)}</strong>`;
  const d = _debts.find(x => x._id === id);
  document.getElementById('modal-pay-title').textContent =
    d ? `Catat Pembayaran – ${d.personName}` : 'Catat Pembayaran';
  openModal('modal-debt-pay');
}

async function payDebt() {
  const id     = document.getElementById('pay-debt-id').value;
  const amount = document.getElementById('pay-amount').value;
  const note   = document.getElementById('pay-note').value.trim();

  if (!amount || Number(amount) <= 0) { showToast('Nominal pembayaran tidak valid', 'error'); return; }

  try {
    const res = await request('POST', `/debts/${id}/pay`, { amount, note });
    showToast(res.isPaid ? '🎉 Lunas! Transaksi otomatis dibuat.' : 'Pembayaran berhasil dicatat', 'success');
    closeModal('modal-debt-pay');
    loadDebts();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
