const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getProducts, saveProducts, getSettings, saveSettings, genId } = require('../data');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'public', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
  }
});

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(new Error('نوع الصورة غير مدعوم. استخدم JPG أو PNG أو WEBP أو GIF.'));
    }
    cb(null, true);
  }
});

const uploadMiddleware = (req, res, next) => {
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    upload.single('image')(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message });
      next();
    });
  } else {
    next();
  }
};

// ===== تسجيل الدخول =====
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    req.session.loggedIn = true;
    return res.json({ success: true });
  }
  return res.status(401).json({ success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

router.get('/check', (req, res) => {
  res.json({ loggedIn: !!(req.session && req.session.loggedIn) });
});

// ===== حماية المسارات التالية =====
router.use(requireAuth);

const handleGetProducts = (req, res) => res.json(getProducts());

const handleCreateProduct = (req, res) => {
  const { name, category, price, meta } = req.body;
  if (!name || !category || !price) {
    return res.status(400).json({ error: 'الاسم والتصنيف والسعر مطلوبة' });
  }
  const products = getProducts();
  const newProduct = {
    id: genId(),
    name: name.trim(),
    category,
    meta: (meta || '').trim(),
    price: Number(price),
    image: req.file ? '/uploads/' + req.file.filename : ''
  };
  products.push(newProduct);
  saveProducts(products);
  res.status(201).json(newProduct);
};

const handleUpdateProduct = (req, res) => {
  const products = getProducts();
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'المنتج غير موجود' });

  const { name, category, price, meta, removeImage } = req.body;
  const existing = products[idx];

  if (req.file) {
    if (existing.image) {
      const oldPath = path.join(UPLOAD_DIR, path.basename(existing.image));
      fs.unlink(oldPath, () => {});
    }
    existing.image = '/uploads/' + req.file.filename;
  } else if (removeImage === 'true' || removeImage === true) {
    if (existing.image) {
      const oldPath = path.join(UPLOAD_DIR, path.basename(existing.image));
      fs.unlink(oldPath, () => {});
    }
    existing.image = '';
  }

  if (name !== undefined) existing.name = name.trim();
  if (category !== undefined) existing.category = category;
  if (price !== undefined) existing.price = Number(price);
  if (meta !== undefined) existing.meta = meta.trim();

  products[idx] = existing;
  saveProducts(products);
  res.json(existing);
};

const handleDeleteProduct = (req, res) => {
  const products = getProducts();
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'المنتج غير موجود' });

  const [removed] = products.splice(idx, 1);
  if (removed.image) {
    const imgPath = path.join(UPLOAD_DIR, path.basename(removed.image));
    fs.unlink(imgPath, () => {});
  }
  saveProducts(products);
  res.json({ success: true });
};

const handleGetSettings = (req, res) => res.json(getSettings());

const handleUpdateSettings = (req, res) => {
  const { storeName, whatsappNumber, heroTitle, heroSubtitle } = req.body;
  const settings = getSettings();
  if (storeName !== undefined) settings.storeName = storeName.trim();
  if (whatsappNumber !== undefined) settings.whatsappNumber = whatsappNumber.trim();
  if (heroTitle !== undefined) settings.heroTitle = heroTitle.trim();
  if (heroSubtitle !== undefined) settings.heroSubtitle = heroSubtitle.trim();
  saveSettings(settings);
  res.json(settings);
};

['/api/products', '/products'].forEach(p => {
  router.get(p, handleGetProducts);
  router.post(p, uploadMiddleware, handleCreateProduct);
});

['/api/products/:id', '/products/:id'].forEach(p => {
  router.put(p, uploadMiddleware, handleUpdateProduct);
  router.delete(p, handleDeleteProduct);
});

['/api/settings', '/settings'].forEach(p => {
  router.get(p, handleGetSettings);
  router.put(p, handleUpdateSettings);
});

router.use((err, req, res, next) => {
  if (err) {
    return res.status(400).json({ error: err.message || 'حدث خطأ أثناء معالجة الطلب' });
  }
  next();
});

module.exports = router;
