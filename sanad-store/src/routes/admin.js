// ===== التبويبات =====
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const targetTab = document.getElementById('tab-' + btn.dataset.tab);
    if (targetTab) targetTab.classList.add('active');
  });
});

// ===== نظام النافذة المنبثقة (Popup Toast) الفاخر =====
function showSuccessPopup(message = 'تمت العملية بنجاح') {
  let popup = document.getElementById('successPopupToast');
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'successPopupToast';
    popup.style.cssText = `
      position: fixed;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: #0D9488;
      color: #FFFFFF;
      padding: 14px 28px;
      border-radius: 14px;
      font-weight: 700;
      font-size: 1rem;
      box-shadow: 0 15px 35px rgba(13, 148, 136, 0.3);
      z-index: 9999;
      transition: transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease;
      opacity: 0;
      font-family: 'IBM Plex Sans Arabic', sans-serif;
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    popup.innerHTML = `<span>✨</span> <span id="popupText"></span>`;
    document.body.appendChild(popup);
  }
  
  document.getElementById('popupText').textContent = message;
  
  // ظهور سلس
  setTimeout(() => {
    popup.style.transform = 'translateX(-50%) translateY(0)';
    popup.style.opacity = '1';
  }, 20);

  // اختفاء بعد 3 ثوانٍ
  setTimeout(() => {
    popup.style.transform = 'translateX(-50%) translateY(100px)';
    popup.style.opacity = '0';
  }, 3000);
}

// ===== تسجيل الخروج =====
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await fetch('/admin/logout', { method: 'POST' });
    window.location.href = '/admin/login.html';
  });
}

const CATEGORY_LABELS = { phone: 'جوال', stc: 'بطاقة STC' };

// ===== جلب وعرض المنتجات =====
async function loadProducts() {
  try {
    const res = await fetch('/admin/api/products');
    if (res.status === 401) return (window.location.href = '/admin/login.html');
    const products = await res.json();
    const tbody = document.getElementById('productsBody');
    if (!tbody) return;

    if (!products.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">لا توجد منتجات بعد. اضغط "إضافة منتج" للبدء.</td></tr>';
      return;
    }

    tbody.innerHTML = products.map(p => `
      <tr>
        <td>${p.image ? `<img src="${p.image}" alt="" style="width:40px;height:40px;object-fit:cover;border-radius:8px;">` : '—'}</td>
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
  } catch (err) {
    console.error('تعذر جلب المنتجات', err);
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ===== النافذة المنبثقة للنموذج (إضافة/تعديل) =====
const modal = document.getElementById('productModal');
const productForm = document.getElementById('productForm');
let currentProducts = [];

async function refreshCurrentProducts() {
  const res = await fetch('/admin/api/products');
  currentProducts = await res.json();
}

const addProductBtn = document.getElementById('addProductBtn');
if (addProductBtn) {
  addProductBtn.addEventListener('click', () => openModal());
}

const cancelModalBtn = document.getElementById('cancelModalBtn');
if (cancelModalBtn) {
  cancelModalBtn.addEventListener('click', closeModal);
}

if (modal) {
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
}

function openModal(product) {
  const msgEl = document.getElementById('productMsg');
  if (msgEl) msgEl.textContent = '';
  if (productForm) productForm.reset();
  const preview = document.getElementById('currentImagePreview');
  if (preview) preview.innerHTML = '';

  if (product) {
    document.getElementById('modalTitle').textContent = 'تعديل منتج';
    document.getElementById('productId').value = product.id;
    document.getElementById('pName').value = product.name;
    document.getElementById('pCategory').value = product.category;
    document.getElementById('pPrice').value = product.price;
    document.getElementById('pMeta').value = product.meta || '';
    if (product.image && preview) {
      preview.innerHTML = `<img src="${product.image}" alt="الصورة الحالية" style="width:60px;height:60px;object-fit:cover;border-radius:8px;margin-top:8px;">`;
    }
  } else {
    document.getElementById('modalTitle').textContent = 'إضافة منتج';
    document.getElementById('productId').value = '';
  }
  if (modal) modal.classList.add('active');
}

function closeModal() {
  if (modal) modal.classList.remove('active');
}

window.editProduct = async function (id) {
  await refreshCurrentProducts();
  const product = currentProducts.find(p => p.id === id);
  if (product) openModal(product);
};

window.deleteProduct = async function (id) {
  if (!confirm('هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.')) return;
  const res = await fetch('/admin/api/products/' + id, { method: 'DELETE' });
  if (res.ok) {
    loadProducts();
    showSuccessPopup('تم حذف المنتج بنجاح');
  } else {
    alert('تعذر حذف المنتج');
  }
};

if (productForm) {
  productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msgEl = document.getElementById('productMsg');
    if (msgEl) msgEl.textContent = '';

    const id = document.getElementById('productId').value;
    const formData = new FormData();
    formData.append('name', document.getElementById('pName').value);
    formData.append('category', document.getElementById('pCategory').value);
    formData.append('price', document.getElementById('pPrice').value);
    formData.append('meta', document.getElementById('pMeta').value);
    
    const fileInput = document.getElementById('pImage');
    if (fileInput && fileInput.files[0]) {
      formData.append('image', fileInput.files[0]);
    }

    const url = id ? '/admin/api/products/' + id : '/admin/api/products';
    const method = id ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, { method, body: formData });
      const data = await res.json();
      if (!res.ok) {
        if (msgEl) msgEl.textContent = data.error || 'حدث خطأ أثناء الحفظ';
        return;
      }
      closeModal();
      loadProducts();
      showSuccessPopup('تمت العملية بنجاح');
    } catch (err) {
      if (msgEl) msgEl.textContent = 'تعذر الاتصال بالخادم';
    }
  });
}

// ===== الإعدادات =====
async function loadSettings() {
  try {
    const res = await fetch('/admin/api/settings');
    if (res.status === 401) return (window.location.href = '/admin/login.html');
    const s = await res.json();
    if (document.getElementById('storeName')) document.getElementById('storeName').value = s.storeName || '';
    if (document.getElementById('whatsappNumber')) document.getElementById('whatsappNumber').value = s.whatsappNumber || '';
    if (document.getElementById('heroTitle')) document.getElementById('heroTitle').value = s.heroTitle || '';
    if (document.getElementById('heroSubtitle')) document.getElementById('heroSubtitle').value = s.heroSubtitle || '';
  } catch (err) {
    console.error('تعذر جلب الإعدادات', err);
  }
}

const settingsForm = document.getElementById('settingsForm');
if (settingsForm) {
  settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msgEl = document.getElementById('settingsMsg');
    if (msgEl) msgEl.textContent = '';

    const payload = {
      storeName: document.getElementById('storeName').value,
      whatsappNumber: document.getElementById('whatsappNumber').value,
      heroTitle: document.getElementById('heroTitle').value,
      heroSubtitle: document.getElementById('heroSubtitle').value
    };

    try {
      const res = await fetch('/admin/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showSuccessPopup('تمت العملية بنجاح');
      } else {
        if (msgEl) {
          msgEl.textContent = 'تعذر حفظ الإعدادات';
          msgEl.classList.add('error-msg');
        }
      }
    } catch (err) {
      console.error(err);
    }
  });
}

// ===== بدء التشغيل =====
loadProducts();
loadSettings();