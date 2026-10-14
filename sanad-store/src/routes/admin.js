const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const Product = require('../models/Product');
const Setting = require('../models/Setting');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'public', 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
  }
});
const upload = multer({ storage });

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

// تسجيل الدخول
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

router.use(requireAuth);

// العمليات على المنتجات في MongoDB
const handleGetProducts = async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products);
};

const handleCreateProduct = async (req, res) => {
  const { name, category, price, meta } = req.body;
  const newProduct = new Product({
    name: name.trim(),
    category,
    meta: (meta || '').trim(),
    price: Number(price),
    image: req.file ? '/uploads/' + req.file.filename : ''
  });
  await newProduct.save();
  res.status(201).json(newProduct);
};

const handleUpdateProduct = async (req, res) => {
  const { name, category, price, meta, removeImage } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'المنتج غير موجود' });

  if (req.file) {
    if (product.image) {
      const oldPath = path.join(UPLOAD_DIR, path.basename(product.image));
      fs.unlink(oldPath, () => {});
    }
    product.image = '/uploads/' + req.file.filename;
  } else if (removeImage === 'true' || removeImage === true) {
    if (product.image) {
      const oldPath = path.join(UPLOAD_DIR, path.basename(product.image));
      fs.unlink(oldPath, () => {});
    }
    product.image = '';
  }

  if (name !== undefined) product.name = name.trim();
  if (category !== undefined) product.category = category;
  if (price !== undefined) product.price = Number(price);
  if (meta !== undefined) product.meta = meta.trim();

  await product.save();
  res.json(product);
};

const handleDeleteProduct = async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ error: 'المنتج غير موجود' });

  if (product.image) {
    const imgPath = path.join(UPLOAD_DIR, path.basename(product.image));
    fs.unlink(imgPath, () => {});
  }
  res.json({ success: true });
};

// العمليات على الإعدادات في MongoDB
const handleGetSettings = async (req, res) => {
  let settings = await Setting.findOne();
  if (!settings) settings = await Setting.create({});
  res.json(settings);
};

const handleUpdateSettings = async (req, res) => {
  const { storeName, whatsappNumber, heroTitle, heroSubtitle } = req.body;
  let settings = await Setting.findOne();
  if (!settings) settings = new Setting();

  if (storeName !== undefined) settings.storeName = storeName.trim();
  if (whatsappNumber !== undefined) settings.whatsappNumber = whatsappNumber.trim();
  if (heroTitle !== undefined) settings.heroTitle = heroTitle.trim();
  if (heroSubtitle !== undefined) settings.heroSubtitle = heroSubtitle.trim();

  await settings.save();
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

module.exports = router;
