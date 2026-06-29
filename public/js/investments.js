let _investments = [];
let _investPieChart = null;

const INSTRUMENT_LABELS = {
  saham:     '📊 Saham',
  reksa_dana:'📁 Reksa Dana',
  deposito:  '🏦 Deposito',
  emas:      '🥇 Emas',
  kripto:    '🪙 Kripto',
  obligasi:  '📜 Obligasi',
  properti:  '🏠 Properti',
  lainnya:   '📦 Lainnya'
};

const INSTRUMENT_COLORS = {
  saham:     '#6366f1',
  reksa_dana:'#22c55e',
  deposito:  '#3b82f6',
  emas:      '#f59e0b',
  kripto:    '#f97316',
  obligasi:  '#8b5cf6',
  properti:  '#14b8a6',
  lainnya:   '#9ca3af'
};



async function loadInvestments() {
  try {
    const data = await request('GET', '/investments');
    _investments = data.investments;
    renderInvestSummary(data.summary);
    renderInvestList(_investments);
    renderInvestPieChart(data.summary.byInstrument);
  } catch (err) {
    showToast('Gagal memuat portofolio: ' + err.message, 'error');
  }
}

function renderInvestSummary(summary) {
  document.getElementById('invest-total-principal').textContent = formatRupiah(summary.totalPrincipal);
  document.getElementById('invest-total-current').textContent  = formatRupiah(summary.totalCurrentValue);
  document.getElementById('invest-count').textContent          = `${summary.count} instrumen aktif`;

  const pl    = summary.totalProfitLoss;
  const pct   = summary.totalReturnPercent;
  const plEl  = document.getElementById('invest-total-pl');
  const pctEl = document.getElementById('invest-return-pct');
  const card  = document.getElementById('invest-pl-card');

  plEl.textContent  = (pl >= 0 ? '+' : '') + formatRupiah(pl);
  pctEl.textContent = (pct >= 0 ? '+' : '') + pct + '%';
  plEl.style.color  = pl >= 0 ? 'var(--success)' : 'var(--danger)';
  card.className    = `card ${pl >= 0 ? 'card-income' : 'card-expense'}`;
}

function renderInvestList(list) {
  const el = document.getElementById('invest-list');
  if (!list.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">📈</div><p>Belum ada investasi.<br>Mulai tambahkan portofolio kamu!</p></div>`;
    return;
  }

  el.innerHTML = list.map(inv => {
    const pl        = inv.currentValue - inv.principalAmount;
    const pct       = inv.returnPercent ?? (inv.principalAmount > 0 ? ((pl / inv.principalAmount) * 100).toFixed(2) : 0);
    const isProfit  = pl >= 0;
    const plColor   = isProfit ? 'var(--success)' : 'var(--danger)';
    const instrLabel = INSTRUMENT_LABELS[inv.instrumentType] || inv.instrumentType;
    const inactive  = !inv.isActive ? ' invest-inactive' : '';

    return `
    <div class="invest-item${inactive}">
      <div class="invest-item-left">
        <div class="invest-icon" style="background:${INSTRUMENT_COLORS[inv.instrumentType] || '#9ca3af'}20;color:${INSTRUMENT_COLORS[inv.instrumentType] || '#9ca3af'}">
          ${instrLabel.split(' ')[0]}
        </div>
        <div>
          <div class="invest-name">${inv.name}${inv.ticker ? ` <span class="invest-ticker">${inv.ticker}</span>` : ''}</div>
          <div class="invest-meta">${instrLabel} · Modal: ${formatRupiah(inv.principalAmount)}</div>
          ${!inv.isActive ? '<span class="badge badge-neutral" style="font-size:0.75rem">Tidak Aktif</span>' : ''}
        </div>
      </div>
      <div class="invest-item-right">
        <div class="invest-current">${formatRupiah(inv.currentValue)}</div>
        <div class="invest-pl" style="color:${plColor}">${isProfit?'+':''}${formatRupiah(pl)} (${isProfit?'+':''}${pct}%)</div>
        <div style="display:flex;gap:6px;margin-top:8px;justify-content:flex-end;flex-wrap:wrap">
          <button class="btn btn-primary btn-sm" onclick="openInvestValueModal('${inv._id}', ${inv.currentValue}, '${inv.name}')">📊 Update Nilai</button>
          <button class="btn btn-outline btn-sm" onclick="openInvestModal('${inv._id}')">✏️</button>
          <button class="btn btn-outline btn-sm btn-danger" onclick="deleteInvestment('${inv._id}')">🗑️</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function renderInvestPieChart(byInstrument) {
  const ctx = document.getElementById('invest-pie-chart');
  if (!ctx) return;

  const labels = [];
  const values = [];
  const colors = [];

  Object.entries(byInstrument).forEach(([key, val]) => {
    labels.push(INSTRUMENT_LABELS[key] || key);
    values.push(val.currentValue);
    colors.push(INSTRUMENT_COLORS[key] || '#9ca3af');
  });

  if (_investPieChart) _investPieChart.destroy();

  if (!values.length) {
    ctx.parentElement.innerHTML = '<div class="empty-state" style="height:180px"><div class="empty-icon">📊</div><p>Belum ada data</p></div>';
    return;
  }

  _investPieChart = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: 'var(--bg-card)' }] },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: 'bottom', labels: { color: 'var(--text-primary)', font: { size: 12 } } },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label}: ${formatRupiah(ctx.raw)}`
          }
        }
      }
    }
  });
}



function openInvestModal(id = null) {
  document.getElementById('edit-invest-id').value    = '';
  document.getElementById('invest-name').value       = '';
  document.getElementById('invest-type').value       = 'saham';
  document.getElementById('invest-ticker').value     = '';
  document.getElementById('invest-principal').value  = '';
  document.getElementById('invest-current').value    = '';
  document.getElementById('invest-start').value      = new Date().toISOString().split('T')[0];
  document.getElementById('invest-notes').value      = '';
  document.getElementById('modal-invest-title').textContent = 'Tambah Investasi';

  if (id) {
    const inv = _investments.find(x => x._id === id);
    if (!inv) return;
    document.getElementById('edit-invest-id').value    = inv._id;
    document.getElementById('invest-name').value       = inv.name;
    document.getElementById('invest-type').value       = inv.instrumentType;
    document.getElementById('invest-ticker').value     = inv.ticker || '';
    document.getElementById('invest-principal').value  = inv.principalAmount;
    document.getElementById('invest-current').value    = inv.currentValue;
    document.getElementById('invest-start').value      = inv.startDate?.split('T')[0] || '';
    document.getElementById('invest-notes').value      = inv.notes || '';
    document.getElementById('modal-invest-title').textContent = 'Edit Investasi';
  }

  openModal('modal-investment');
}

async function saveInvestment() {
  const id        = document.getElementById('edit-invest-id').value;
  const name      = document.getElementById('invest-name').value.trim();
  const instType  = document.getElementById('invest-type').value;
  const ticker    = document.getElementById('invest-ticker').value.trim();
  const principal = document.getElementById('invest-principal').value;
  const current   = document.getElementById('invest-current').value;
  const startDate = document.getElementById('invest-start').value;
  const notes     = document.getElementById('invest-notes').value.trim();

  if (!name || principal === '' || current === '' || !startDate) {
    showToast('Nama, modal, nilai saat ini, dan tanggal mulai wajib diisi', 'error');
    return;
  }

  try {
    const body = { name, instrumentType: instType, ticker, principalAmount: principal, currentValue: current, startDate, notes };
    if (id) {
      await request('PUT', `/investments/${id}`, body);
      showToast('Investasi berhasil diperbarui', 'success');
    } else {
      await request('POST', '/investments', body);
      showToast('Investasi berhasil ditambahkan', 'success');
    }
    closeModal('modal-investment');
    loadInvestments();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteInvestment(id) {
  if (!confirm('Hapus data investasi ini?')) return;
  try {
    await request('DELETE', `/investments/${id}`);
    showToast('Investasi dihapus', 'success');
    loadInvestments();
  } catch (err) {
    showToast(err.message, 'error');
  }
}



function openInvestValueModal(id, currentValue, name) {
  document.getElementById('update-invest-id').value   = id;
  document.getElementById('invest-new-value').value   = currentValue;
  document.getElementById('invest-value-note').value  = '';
  document.getElementById('invest-current-info').innerHTML =
    `<strong>${name}</strong><br>Nilai sekarang: <strong>${formatRupiah(currentValue)}</strong>`;
  openModal('modal-invest-value');
}

async function updateInvestValue() {
  const id       = document.getElementById('update-invest-id').value;
  const newValue = document.getElementById('invest-new-value').value;
  const note     = document.getElementById('invest-value-note').value.trim();

  if (newValue === '' || isNaN(Number(newValue))) {
    showToast('Nilai investasi tidak valid', 'error'); return;
  }

  try {
    await request('PATCH', `/investments/${id}/update-value`, { currentValue: newValue, note });
    showToast('Nilai investasi berhasil diperbarui', 'success');
    closeModal('modal-invest-value');
    loadInvestments();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
