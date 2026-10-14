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

async function refresh
