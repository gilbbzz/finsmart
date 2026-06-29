async function loadHealthScore() {
  const month = document.getElementById('health-month')?.value || getCurrentMonth();

  document.getElementById('health-score-num').textContent   = '--';
  document.getElementById('health-grade').textContent       = '-';
  document.getElementById('health-score-emoji').textContent = '⏳';
  document.getElementById('health-grade-label').textContent = 'Menghitung skor...';
  document.getElementById('health-components').innerHTML    = '<div class="loading-dots">Menganalisis data keuanganmu...</div>';
  document.getElementById('health-recommendations').innerHTML = '';

  try {
    const data = await request('GET', `/health/score?month=${month}`);
    renderHealthScore(data);
  } catch (err) {
    showToast('Gagal menghitung skor: ' + err.message, 'error');
    document.getElementById('health-grade-label').textContent = 'Gagal memuat skor';
    document.getElementById('health-components').innerHTML = '';
  }
}

function renderHealthScore(data) {
  
  const scoreEl  = document.getElementById('health-score-num');
  const gradeEl  = document.getElementById('health-grade');
  const emojiEl  = document.getElementById('health-score-emoji');
  const labelEl  = document.getElementById('health-grade-label');
  const monthEl  = document.getElementById('health-month-label');
  const cardEl   = document.getElementById('health-score-card');

  
  animateCounter(scoreEl, 0, data.totalScore, 900);

  gradeEl.textContent       = data.grade;
  gradeEl.style.color       = data.gradeColor;
  emojiEl.textContent       = data.gradeEmoji;
  cardEl.style.borderColor  = data.gradeColor;

  const gradeDescriptions = {
    A: 'Keuangan kamu sangat sehat! Pertahankan kebiasaan baik ini.',
    B: 'Keuangan kamu cukup baik. Ada beberapa area yang bisa ditingkatkan.',
    C: 'Keuangan kamu rata-rata. Mulai fokus pada perbaikan yang direkomendasikan.',
    D: 'Perhatian! Ada beberapa masalah keuangan yang perlu segera ditangani.',
    E: 'Keuangan kamu membutuhkan perhatian serius. Ikuti semua rekomendasi.'
  };
  labelEl.textContent = gradeDescriptions[data.grade] || '';

  
  const [yr, mn] = data.month.split('-');
  const bulanNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  monthEl.textContent = `Analisis bulan ${bulanNames[parseInt(mn)-1]} ${yr}`;

  
  const compEl = document.getElementById('health-components');
  compEl.innerHTML = Object.values(data.components).map(comp => {
    const pct        = Math.round((comp.score / comp.maxScore) * 100);
    const barColor   = pct >= 70 ? '#22c55e' : pct >= 40 ? '#eab308' : '#ef4444';
    const scoreClass = pct >= 70 ? 'comp-good' : pct >= 40 ? 'comp-medium' : 'comp-bad';

    return `
    <div class="health-comp-item">
      <div class="health-comp-header">
        <span class="health-comp-label">${comp.label}</span>
        <span class="health-comp-score ${scoreClass}">${comp.score} / ${comp.maxScore}</span>
      </div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" style="width:${pct}%;background:${barColor};transition:width 0.8s ease"></div>
      </div>
      <p class="health-comp-detail">${comp.detail}</p>
    </div>`;
  }).join('');

  
  const recEl = document.getElementById('health-recommendations');
  const priorityColor = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };
  const priorityLabel = { high: 'Prioritas Tinggi', medium: 'Sedang', low: 'Opsional' };

  recEl.innerHTML = data.recommendations.map(rec => `
    <div class="health-rec-item">
      <div class="health-rec-icon">${rec.icon}</div>
      <div class="health-rec-body">
        <div class="health-rec-header">
          <span class="health-rec-title">${rec.title}</span>
          <span class="health-rec-priority" style="background:${priorityColor[rec.priority]}20;color:${priorityColor[rec.priority]}">
            ${priorityLabel[rec.priority]}
          </span>
        </div>
        <p class="health-rec-detail">${rec.detail}</p>
      </div>
    </div>
  `).join('');
}


function animateCounter(el, from, to, duration) {
  const start = performance.now();
  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    
    const value = Math.round(from + (to - from) * (1 - Math.pow(1 - progress, 3)));
    el.textContent = value;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}


function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
}
