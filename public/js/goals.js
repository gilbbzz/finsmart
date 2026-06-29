let _topupGoalData = null;

async function loadGoals() {
  try {
    const goals = await request('GET', '/goals');
    renderGoals(goals);
  } catch (err) {
    showToast('Gagal memuat target', 'error');
  }
}

function renderGoals(list) {
  const el = document.getElementById('goals-list');
  if (!list.length) {
    el.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-icon">⭐</div>
      <p>Belum ada target tabungan. Buat target pertamamu!</p>
    </div>`;
    return;
  }

  el.innerHTML = list.map(g => {
    const pct      = (g.savedAmount / g.targetAmount * 100).toFixed(2) || 0;
    const deadline = formatDate(g.deadline);
    const daysLeft = Math.ceil((new Date(g.deadline) - new Date()) / 86400000);
    const daysStr  = daysLeft > 0 ? `${daysLeft} hari lagi` : 'Sudah lewat deadline';
    const remaining = g.targetAmount - g.savedAmount;

    
    let statusBadge = '';
    let progressColor = 'var(--primary)';

    if (g.isClaimed) {
      statusBadge = `<span class="goal-badge goal-badge--claimed">✅ Sudah Diklaim</span>`;
      progressColor = '#94a3b8';
    } else if (g.isCompleted) {
      statusBadge = `<span class="goal-badge goal-badge--done">🏆 Target Tercapai!</span>`;
      progressColor = 'var(--success)';
    }

    
    let actionButtons = '';
    if (g.isClaimed) {
      actionButtons = `
        <button class="btn btn-outline btn-sm" onclick="editGoal(${JSON.stringify(g).replace(/"/g,'&quot;')})">✏️</button>
        <button class="btn btn-danger btn-sm"  onclick="deleteGoal('${g._id}')">🗑</button>
      `;
    } else if (g.isCompleted) {
      actionButtons = `
        <button class="btn btn-success btn-sm" onclick="claimGoal('${g._id}', '${g.title.replace(/'/g,"\\'")}', ${g.savedAmount})">🎉 Klaim</button>
        <button class="btn btn-outline btn-sm" onclick="editGoal(${JSON.stringify(g).replace(/"/g,'&quot;')})">✏️</button>
        <button class="btn btn-danger btn-sm"  onclick="deleteGoal('${g._id}')">🗑</button>
      `;
    } else {
      actionButtons = `
        <button class="btn btn-primary btn-sm" onclick="openTopup('${g._id}', ${g.targetAmount}, ${g.savedAmount})">+ Tabung</button>
        <button class="btn btn-outline btn-sm" onclick="editGoal(${JSON.stringify(g).replace(/"/g,'&quot;')})">✏️</button>
        <button class="btn btn-danger btn-sm"  onclick="deleteGoal('${g._id}')">🗑</button>
      `;
    }

    return `
    <div class="goal-card ${g.isCompleted && !g.isClaimed ? 'completed' : ''} ${g.isClaimed ? 'claimed' : ''}">
      <div class="goal-icon-title">
        <span class="goal-icon">${g.icon || '🎯'}</span>
        <div>
          <div class="goal-title">${g.title}</div>
          <div class="goal-deadline">📅 ${deadline} · ${daysStr}</div>
        </div>
      </div>
      ${statusBadge}
      <div class="goal-amounts">
        <span class="goal-saved">${formatRupiah(g.savedAmount)}</span>
        <span class="goal-target">dari ${formatRupiah(g.targetAmount)}</span>
      </div>
      ${!g.isClaimed && !g.isCompleted ? `<div class="goal-remaining">Sisa yang dibutuhkan: <strong>${formatRupiah(remaining)}</strong></div>` : ''}
      <div class="goal-percent">${pct}% tercapai</div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${pct}%;background:${progressColor}"></div>
      </div>
      <div class="goal-actions">
        ${actionButtons}
      </div>
    </div>`;
  }).join('');
}

function selectIcon(el) {
  document.querySelectorAll('.icon-opt').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('goal-icon').value = el.dataset.icon;
}

async function saveGoal() {
  const id      = document.getElementById('edit-goal-id').value;
  const title   = document.getElementById('goal-title').value.trim();
  const icon    = document.getElementById('goal-icon').value;
  const target  = document.getElementById('goal-target').value;
  const deadline= document.getElementById('goal-deadline').value;

  if (!title || !target || !deadline) return showToast('Semua field wajib diisi', 'error');

  try {
    if (id) {
      await request('PUT', `/goals/${id}`, { title, icon, targetAmount: target, deadline });
      showToast('Target diperbarui', 'success');
    } else {
      await request('POST', '/goals', { title, icon, targetAmount: target, deadline });
      showToast('Target dibuat', 'success');
    }
    closeModal('modal-goal');
    loadGoals();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function editGoal(g) {
  document.getElementById('edit-goal-id').value  = g._id;
  document.getElementById('modal-goal-title').textContent = 'Edit Target';
  document.getElementById('goal-title').value    = g.title;
  document.getElementById('goal-target').value   = g.targetAmount;
  document.getElementById('goal-deadline').value = g.deadline.split('T')[0];
  document.getElementById('goal-icon').value     = g.icon;

  document.querySelectorAll('.icon-opt').forEach(el => {
    el.classList.toggle('selected', el.dataset.icon === g.icon);
  });

  openModal('modal-goal');
}


function openTopup(goalId, targetAmount, savedAmount) {
  _topupGoalData = { goalId, targetAmount, savedAmount };

  const remaining = targetAmount - savedAmount;

  document.getElementById('topup-goal-id').value = goalId;
  document.getElementById('topup-amount').value  = '';
  document.getElementById('topup-amount').max    = remaining;

  const infoEl = document.getElementById('topup-remaining-info');
  if (infoEl) {
    infoEl.innerHTML = `Maksimal topup: <strong>${formatRupiah(remaining)}</strong> (sisa yang dibutuhkan)`;
  }

  openModal('modal-topup');
}

async function topupGoal() {
  const id     = document.getElementById('topup-goal-id').value;
  const amount = Number(document.getElementById('topup-amount').value);

  if (!amount || amount <= 0) return showToast('Nominal harus diisi', 'error');

  
  if (_topupGoalData) {
    const { targetAmount, savedAmount } = _topupGoalData;
    const remaining = targetAmount - savedAmount;

    if (amount > targetAmount) {
      return showToast(`Nominal tidak boleh melebihi target tabungan (${formatRupiah(targetAmount)})`, 'error');
    }
    if (amount > remaining) {
      return showToast(`Nominal tidak boleh melebihi sisa yang dibutuhkan (${formatRupiah(remaining)})`, 'error');
    }
  }

  try {
    await request('POST', `/goals/${id}/topup`, { amount });
    showToast('Tabungan berhasil ditambahkan! 🎉', 'success');
    closeModal('modal-topup');
    _topupGoalData = null;
    loadGoals();
  } catch (err) {
    showToast(err.message, 'error');
  }
}


async function claimGoal(id, title, amount) {
  const konfirmasi = confirm(
    `Klaim target tabungan "${title}"?\n\n` +
    `${formatRupiah(amount)} akan dicatat sebagai Pendapatan dengan keterangan:\n` +
    `"Target Tabungan \\"${title}\\"".\n\n` +
    `Tindakan ini tidak bisa dibatalkan.`
  );
  if (!konfirmasi) return;

  try {
    await request('POST', `/goals/${id}/claim`);
    showToast(`🏆 Berhasil diklaim! ${formatRupiah(amount)} masuk ke pendapatan.`, 'success');
    loadGoals();

    
    if (typeof loadDashboard === 'function') loadDashboard();
    if (typeof loadTransactions === 'function') loadTransactions();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteGoal(id) {
  if (!confirm('Hapus target ini?')) return;
  try {
    await request('DELETE', `/goals/${id}`);
    showToast('Target dihapus', 'success');
    loadGoals();
  } catch (err) {
    showToast(err.message, 'error');
  }
}


document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('[onclick="openModal(\'modal-goal\')"]');
  if (btn) btn.setAttribute('onclick', 'resetAndOpenGoal()');
});

function resetAndOpenGoal() {
  document.getElementById('edit-goal-id').value  = '';
  document.getElementById('modal-goal-title').textContent = 'Tambah Target Tabungan';
  document.getElementById('goal-title').value    = '';
  document.getElementById('goal-target').value   = '';
  document.getElementById('goal-deadline').value = '';
  document.getElementById('goal-icon').value     = '🎯';
  document.querySelectorAll('.icon-opt').forEach(el => el.classList.remove('selected'));
  document.querySelector('.icon-opt[data-icon="🎯"]').classList.add('selected');
  openModal('modal-goal');
}
