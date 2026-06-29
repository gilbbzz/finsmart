let pieChart = null;
let barChart = null;
const EMOJI_DATA = {
  '💰 Keuangan':  ['💰','💵','💳','🏦','💸','🪙','💎','🏧','📈','📉','📊','🤑','💹','🧾','💼'],
  '🍽️ Makanan':   ['🍔','🍕','🍜','🍣','🥗','🍱','🧋','☕','🍩','🥤','🍗','🌮','🍝','🥘','🛒'],
  '🚗 Transport': ['🚗','🚕','🚌','✈️','🚂','⛽','🛵','🚲','🚢','🏍️','🛺','🚁','🚦','🅿️','🗺️'],
  '🏠 Rumah':     ['🏠','🛋️','🪑','🛏️','🪴','💡','🔧','🧹','🪣','🛁','🚿','🪟','🔑','📦','🏗️'],
  '🛍️ Belanja':   ['🛍️','👗','👟','👜','💄','🕶️','⌚','📱','💻','🎮','📷','🎧','🖥️','🪮','🧴'],
  '❤️ Kesehatan': ['❤️','🏥','💊','🩺','🩹','🧬','🦷','💉','🏋️','🧘','🚶','🥦','🫁','🩻','🧠'],
  '📚 Pendidikan':['📚','🎓','✏️','📝','🔬','🎨','🖊️','📐','📏','🗒️','🖥️','🔭','🏫','📖','🎒'],
  '🎉 Hiburan':   ['🎉','🎬','🎵','🎸','⚽','🎯','🎲','🃏','🎭','🎪','🏖️','🌴','🎢','🎠','🎡'],
  '🌿 Lainnya':   ['🌿','🌱','🌸','🌙','⭐','🔥','💧','🌊','🦁','🐶','🐱','🦋','🌈','☀️','🍀'],
};

let _emojiCurrentCat = Object.keys(EMOJI_DATA)[0];

function buildEmojiPicker() {
  const nav  = document.getElementById('emoji-cats-nav');
  const grid = document.getElementById('emoji-grid');
  if (!nav || !grid) return;

  nav.innerHTML = Object.keys(EMOJI_DATA).map(cat =>
    `<button type="button" class="emoji-cat-btn${cat === _emojiCurrentCat ? ' active' : ''}"
      onclick="switchEmojiCat(this,'${cat}')">${cat}</button>`
  ).join('');

  renderEmojiGrid(EMOJI_DATA[_emojiCurrentCat]);
}

function renderEmojiGrid(emojis) {
  const grid    = document.getElementById('emoji-grid');
  const current = document.getElementById('cat-icon').value || '🏷️';
  grid.innerHTML = emojis.map(e =>
    `<button type="button" class="emoji-item${e === current ? ' selected' : ''}"
      onclick="selectEmoji('${e}')">${e}</button>`
  ).join('');
}

function switchEmojiCat(btn, cat) {
  _emojiCurrentCat = cat;
  document.querySelectorAll('.emoji-cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderEmojiGrid(EMOJI_DATA[cat]);
  document.getElementById('emoji-search').value = '';
}

function filterEmoji(q) {
  if (!q.trim()) { renderEmojiGrid(EMOJI_DATA[_emojiCurrentCat]); return; }
  const all     = Object.values(EMOJI_DATA).flat();
  const current = document.getElementById('cat-icon').value || '🏷️';
  const matches = all.filter(e => e.includes(q));
  const grid    = document.getElementById('emoji-grid');
  grid.innerHTML = matches.length
    ? matches.map(e =>
        `<button type="button" class="emoji-item${e === current ? ' selected' : ''}"
          onclick="selectEmoji('${e}')">${e}</button>`
      ).join('')
    : `<div style="grid-column:1/-1;text-align:center;padding:16px;color:var(--text-muted);font-size:13px">Emoji tidak ditemukan</div>`;
}

function selectEmoji(e) {
  document.getElementById('cat-icon').value = e;
  document.getElementById('emoji-preview').textContent = e;
  const lbl = document.querySelector('#emoji-trigger .emoji-trigger-label');
  if (lbl) lbl.textContent = 'Ikon dipilih';
  closeEmojiPicker();
  const q = document.getElementById('emoji-search')?.value || '';
  if (q.trim()) filterEmoji(q); else renderEmojiGrid(EMOJI_DATA[_emojiCurrentCat]);
}

function toggleEmojiPicker() {
  const dropdown = document.getElementById('emoji-dropdown');
  const isOpen   = !dropdown.classList.contains('hidden');
  if (isOpen) { closeEmojiPicker(); return; }
  dropdown.classList.remove('hidden');
  document.getElementById('emoji-trigger').classList.add('open');
  buildEmojiPicker();
  setTimeout(() => document.getElementById('emoji-search')?.focus(), 50);
}

function closeEmojiPicker() {
  document.getElementById('emoji-dropdown')?.classList.add('hidden');
  document.getElementById('emoji-trigger')?.classList.remove('open');
}

document.addEventListener('click', function(e) {
  const w = document.querySelector('.emoji-picker-wrapper');
  if (w && !w.contains(e.target)) closeEmojiPicker();
});


function resetEmojiPicker() {
  document.getElementById('cat-icon').value = '🏷️';
  document.getElementById('emoji-preview').textContent = '🏷️';
  const lbl = document.querySelector('#emoji-trigger .emoji-trigger-label');
  if (lbl) lbl.textContent = 'Pilih Ikon';
  _emojiCurrentCat = Object.keys(EMOJI_DATA)[0];
}





function renderPieChart(categoryData) {
  const canvas   = document.getElementById('pie-chart');
  const emptyEl  = document.getElementById('pie-empty');

  
  if (pieChart) { pieChart.destroy(); pieChart = null; }

  
  if (!categoryData || !categoryData.length) {
    canvas.style.display  = 'none';
    if (emptyEl) emptyEl.classList.remove('hidden');
    return;
  }

  
  canvas.style.display = '';
  if (emptyEl) emptyEl.classList.add('hidden');

  const ctx = canvas.getContext('2d');
  pieChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels:   categoryData.map(c => `${c.category.icon} ${c.category.name}`),
      datasets: [{
        data:            categoryData.map(c => c.total),
        backgroundColor: categoryData.map(c => c.category.color || '#6366f1'),
        borderWidth:  2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { size: 12 }, padding: 10, boxWidth: 12 }
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${new Intl.NumberFormat('id-ID', {
              style: 'currency', currency: 'IDR', minimumFractionDigits: 0
            }).format(ctx.raw)}`
          }
        }
      },
      cutout: '60%'
    }
  });
}





async function loadBarChart() {
  try {
    const data = await request('GET', '/summary/chart?months=6');
    renderBarChart(data);
  } catch {}
}

function renderBarChart(data) {
  const ctx = document.getElementById('bar-chart').getContext('2d');

  if (barChart) barChart.destroy();

  barChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.label),
      datasets: [
        {
          label: 'Pemasukan',
          data: data.map(d => d.income),
          backgroundColor: '#10b98133',
          borderColor: '#10b981',
          borderWidth: 2,
          borderRadius: 6
        },
        {
          label: 'Pengeluaran',
          data: data.map(d => d.expense),
          backgroundColor: '#ef444433',
          borderColor: '#ef4444',
          borderWidth: 2,
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { font: { size: 12 }, boxWidth: 12 } },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(ctx.raw)}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#e2e8f055' },
          ticks: {
            callback: v => 'Rp ' + (v >= 1000000 ? (v/1000000).toFixed(1)+'jt' : v >= 1000 ? (v/1000).toFixed(0)+'rb' : v)
          }
        },
        x: { grid: { display: false } }
      }
    }
  });
}





async function loadCategories() {
  try {
    const cats = await request('GET', '/categories');
    renderCategories(cats);
  } catch (err) {
    showToast('Gagal memuat kategori', 'error');
  }
}

function renderCategories(list) {
  const el = document.getElementById('categories-list');
  if (!list.length) {
    el.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-icon">🏷️</div>
      <p>Belum ada kategori</p>
    </div>`;
    return;
  }

  const typeLabel = { income: 'Pemasukan', expense: 'Pengeluaran', both: 'Semua' };

  el.innerHTML = list.map(c => `
    <div class="cat-card">
      <div class="cat-icon-wrap" style="background:${c.color}22">
        <span>${c.icon || '🏷️'}</span>
      </div>
      <div class="cat-info">
        <div class="cat-name">${c.name}</div>
        <div class="cat-type">${typeLabel[c.type] || 'Semua'}</div>
      </div>
      ${!c.isDefault ? `<button class="cat-delete" onclick="deleteCategory('${c._id}')">✕</button>` : ''}
    </div>
  `).join('');
}

async function saveCategory() {
  const name  = document.getElementById('cat-name').value.trim();
  const icon  = document.getElementById('cat-icon').value.trim() || '🏷️';
  const color = document.getElementById('cat-color').value;
  const type  = document.getElementById('cat-type').value;

  if (!name) return showToast('Nama kategori wajib diisi', 'error');

  try {
    await request('POST', '/categories', { name, icon, color, type });
    showToast('Kategori ditambahkan', 'success');
    closeModal('modal-category');
    document.getElementById('cat-name').value = '';
    resetEmojiPicker();
    loadCategories();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteCategory(id) {
  if (!confirm('Hapus kategori ini?')) return;
  try {
    await request('DELETE', `/categories/${id}`);
    showToast('Kategori dihapus', 'success');
    loadCategories();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
