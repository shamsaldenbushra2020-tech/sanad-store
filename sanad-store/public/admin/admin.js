// ===== التبويبات =====
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

// ===== تسجيل الخروج =====
document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('/admin/logout', { method: 'POST' });
  window.location.href = '/admin/login.html';
});

const CATEGORY_LABELS = { phone: 'جوال', stc: 'بطاقة STC' };

// ===== جلب وعرض المنتجات =====
async function loadProducts() {
  const res = await fetch('/admin/api/products');
  if (res.status === 401) return (window.location.href = '/admin/login.html');
  const products = await res.json();
  const tbody = document.getElementById('productsBody');

  if (!products.length) {
    tbody.innerHTML = '<tr><td colspan="6">لا توجد منتجات بعد. اضغط "إضافة منتج" للبدء.</td></tr>';
    return;
  }

  tbody.innerHTML = products.map(p => `
    <tr>
      <td>${p.image ? `<img src="${p.image}" alt="">` : '—'}</td>
      <td>${escapeHtml(p.name)}</td>
      <td>${CATEGORY_LABELS[p.category] || p.category}</td>
      <td>${escapeHtml(p.meta || '')}</td>
      <td>${Number(p.price).toLocaleString('ar-SA')} ر.س</td>
      <td class="row-actions">
        <button class="btn btn-ghost" onclick="editProduct('${p.id}')">تعديل</button>
        <button class="btn btn-danger" onclick="deleteProduct('${p.id}')">حذف</button>
      </td>
    </tr>
  `).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ===== النافذة المنبثقة (إضافة/تعديل) =====
const modal = document.getElementById('productModal');
const productForm = document.getElementById('productForm');
let currentProducts = [];

async function refreshCurrentProducts() {
  const res = await fetch('/admin/api/products');
  currentProducts = await res.json();
}

document.getElementById('addProductBtn').addEventListener('click', () => {
  openModal();
});

document.getElementById('cancelModalBtn').addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

function openModal(product) {
  document.getElementById('productMsg').textContent = '';
  productForm.reset();
  document.getElementById('currentImagePreview').innerHTML = '';
  if (product) {
    document.getElementById('modalTitle').textContent = 'تعديل منتج';
    document.getElementById('productId').value = product.id;
    document.getElementById('pName').value = product.name;
    document.getElementById('pCategory').value = product.category;
    document.getElementById('pPrice').value = product.price;
    document.getElementById('pMeta').value = product.meta || '';
    if (product.image) {
      document.getElementById('currentImagePreview').innerHTML =
        `<img src="${product.image}" alt="الصورة الحالية">`;
    }
  } else {
    document.getElementById('modalTitle').textContent = 'إضافة منتج';
    document.getElementById('productId').value = '';
  }
  modal.classList.add('active');
}

function closeModal() {
  modal.classList.remove('active');
}

window.editProduct = async function (id) {
  await refreshCurrentProducts();
  const product = currentProducts.find(p => p.id === id);
  if (product) openModal(product);
};

window.deleteProduct = async function (id) {
  if (!confirm('هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.')) return;
  const res = await fetch('/admin/api/products/' + id, { method: 'DELETE' });
  if (res.ok) loadProducts();
  else alert('تعذر حذف المنتج');
};

productForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const msgEl = document.getElementById('productMsg');
  msgEl.textContent = '';

  const id = document.getElementById('productId').value;
  const formData = new FormData();
  formData.append('name', document.getElementById('pName').value);
  formData.append('category', document.getElementById('pCategory').value);
  formData.append('price', document.getElementById('pPrice').value);
  formData.append('meta', document.getElementById('pMeta').value);
  const file = document.getElementById('pImage').files[0];
  if (file) formData.append('image', file);

  const url = id ? '/admin/api/products/' + id : '/admin/api/products';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, { method, body: formData });
    const data = await res.json();
    if (!res.ok) {
      msgEl.textContent = data.error || 'حدث خطأ أثناء الحفظ';
      return;
    }
    closeModal();
    loadProducts();
  } catch (err) {
    msgEl.textContent = 'تعذر الاتصال بالخادم';
  }
});

// ===== الإعدادات =====
async function loadSettings() {
  const res = await fetch('/admin/api/settings');
  if (res.status === 401) return (window.location.href = '/admin/login.html');
  const s = await res.json();
  document.getElementById('storeName').value = s.storeName || '';
  document.getElementById('whatsappNumber').value = s.whatsappNumber || '';
  document.getElementById('heroTitle').value = s.heroTitle || '';
  document.getElementById('heroSubtitle').value = s.heroSubtitle || '';
}

document.getElementById('settingsForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msgEl = document.getElementById('settingsMsg');
  msgEl.textContent = '';

  const payload = {
    storeName: document.getElementById('storeName').value,
    whatsappNumber: document.getElementById('whatsappNumber').value,
    heroTitle: document.getElementById('heroTitle').value,
    heroSubtitle: document.getElementById('heroSubtitle').value
  };

  const res = await fetch('/admin/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    msgEl.textContent = 'تم حفظ الإعدادات بنجاح';
  } else {
    msgEl.textContent = 'تعذر حفظ الإعدادات';
    msgEl.classList.add('error-msg');
  }
});

// ===== بدء التشغيل =====
loadProducts();
loadSettings();
