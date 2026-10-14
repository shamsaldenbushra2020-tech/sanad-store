async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    const s = await res.json();
    document.getElementById('brandName').textContent = s.storeName || 'سند';
    document.getElementById('footerBrand').textContent = s.storeName || 'سند';
    document.getElementById('heroTitle').textContent = s.heroTitle || '';
    document.getElementById('heroSubtitle').textContent = s.heroSubtitle || '';
    document.title = (s.storeName || 'سند') + ' | جوالات وبطاقات اتصال';
    window.__whatsappNumber = s.whatsappNumber || '';
  } catch (e) {
    console.error('تعذر تحميل الإعدادات', e);
  }
}

function productCard(p) {
  const img = p.image
    ? `<img src="${p.image}" alt="${p.name}">`
    : `<svg class="ph-icon" viewBox="0 0 24 24" fill="none" stroke-width="2"><rect x="6" y="2" width="12" height="20" rx="2"/></svg>`;
  return `
    <div class="card">
      <div class="thumb">${img}</div>
      <div class="body">
        <h3>${escapeHtml(p.name)}</h3>
        <div class="meta">${escapeHtml(p.meta || '')}</div>
        <div class="price">${formatPrice(p.price)} ر.س</div>
        <a class="order" href="#order" data-product="${escapeHtml(p.name)}">اطلب هذا المنتج ←</a>
      </div>
    </div>`;
}

function stcCard(p) {
  return `
    <div class="stc-card">
      <div class="amt">${formatPrice(p.price)} ر.س</div>
      <div class="label">${escapeHtml(p.name)}</div>
    </div>`;
}

function formatPrice(n) {
  return Number(n).toLocaleString('ar-SA');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function loadProducts() {
  const phonesGrid = document.getElementById('phonesGrid');
  const stcGrid = document.getElementById('stcGrid');
  const select = document.getElementById('product');

  try {
    const res = await fetch('/api/products');
    const products = await res.json();

    const phones = products.filter(p => p.category === 'phone');
    const stc = products.filter(p => p.category === 'stc');

    phonesGrid.innerHTML = phones.length
      ? phones.map(productCard).join('')
      : '<p class="empty-msg">لا توجد جوالات متاحة حاليًا.</p>';

    stcGrid.innerHTML = stc.length
      ? stc.map(stcCard).join('')
      : '<p class="empty-msg">لا توجد بطاقات متاحة حاليًا.</p>';

    select.innerHTML = products.map(p => `<option value="${escapeHtml(p.name)}">${escapeHtml(p.name)}</option>`).join('')
      + '<option value="أخرى">أخرى (أذكرها في الملاحظات)</option>';

    // الضغط على "اطلب" في بطاقة منتج يحدد المنتج تلقائيًا في النموذج
    document.querySelectorAll('.order[data-product]').forEach(link => {
      link.addEventListener('click', () => {
        select.value = link.dataset.product;
      });
    });
  } catch (e) {
    phonesGrid.innerHTML = '<p class="empty-msg">تعذر تحميل المنتجات.</p>';
    stcGrid.innerHTML = '<p class="empty-msg">تعذر تحميل المنتجات.</p>';
    console.error(e);
  }
}

document.getElementById('orderForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const product = document.getElementById('product').value;
  const notes = document.getElementById('notes').value.trim();

  if (!name || !/^05[0-9]{8}$/.test(phone)) {
    alert('الرجاء إدخال الاسم ورقم جوال سعودي صحيح (05xxxxxxxx)');
    return;
  }

  const whatsappNumber = window.__whatsappNumber;
  if (!whatsappNumber) {
    alert('رقم واتساب المتجر غير مُعدّ بعد. يرجى ضبطه من لوحة التحكم.');
    return;
  }

  let msg = 'مرحباً، أرغب بطلب التالي:\n';
  msg += 'الاسم: ' + name + '\n';
  msg += 'الجوال: ' + phone + '\n';
  msg += 'المنتج: ' + product + '\n';
  if (notes) msg += 'ملاحظات: ' + notes + '\n';

  const url = 'https://wa.me/' + whatsappNumber + '?text=' + encodeURIComponent(msg);
  window.open(url, '_blank');
});

loadSettings();
loadProducts();
