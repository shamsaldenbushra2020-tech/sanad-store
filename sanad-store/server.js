require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const productsRouter = require('./src/routes/products');
const adminRouter = require('./src/routes/admin');
const { requireAuth } = require('./src/middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== مهم جداً لبيئة الاستضافة على Render (الثقة بالبروكسي) =====
app.set('trust proxy', 1);

// تعيين قيم افتراضية آمنة لمتغيرات البيئة لضمان عدم توقف السيرفر أبداً
process.env.ADMIN_USER = process.env.ADMIN_USER || 'shams';
process.env.ADMIN_PASS = process.env.ADMIN_PASS || '10203040';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'change-this-to-a-long-random-string';

const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  proxy: true, // السماح للجلسات بالعمل خلف البروكسي
  cookie: {
    httpOnly: true,
    secure: true, // متوافق تماماً مع حماية HTTPS على Render
    maxAge: 1000 * 60 * 60 * 8 // 8 ساعات
  }
}));

// حماية صفحة لوحة التحكم نفسها (ملف index.html) قبل تقديمها كملف ثابت
app.get('/admin/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});
app.get('/admin/index.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// ملفات ثابتة (المتجر + لوحة التحكم + الصور المرفوعة)
app.use(express.static(path.join(__dirname, 'public')));

// واجهات API
app.use('/api', productsRouter);
app.use('/admin', adminRouter);

app.listen(PORT, () => {
  console.log(`✅ متجر سند يعمل على: http://localhost:${PORT}`);
  console.log(`🔐 لوحة التحكم: http://localhost:${PORT}/admin/login.html`);
});
