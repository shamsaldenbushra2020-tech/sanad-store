require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const productsRouter = require('./src/routes/products');
const adminRouter = require('./src/routes/admin');
const { requireAuth } = require('./src/middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== الاتصال بقاعدة بيانات MongoDB =====
const MONGO_URI = process.env.MONGODB_URI;
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ تم الاتصال بقاعدة بيانات MongoDB بنجاح'))
  .catch(err => console.error('❌ فشل الاتصال بقاعدة البيانات:', err));

app.set('trust proxy', 1);

process.env.ADMIN_USER = process.env.ADMIN_USER || 'shams';
process.env.ADMIN_PASS = process.env.ADMIN_PASS || '10203040';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'change-this-to-a-long-random-string';

const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// إعداد الجلسات لتُحفظ في MongoDB السحابي
// دعم ذكي لمكتبة الجلسات لتعمل مع جميع الإصدارات (الحديثة والقديمة)
const sessionStore = typeof MongoStore.create === 'function'
  ? MongoStore.create({ mongoUrl: MONGO_URI })
  : new (require('connect-mongo')(session))({ url: MONGO_URI });

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  proxy: true,
  store: sessionStore,
  cookie: {
    httpOnly: true,
    secure: false, 
    maxAge: 1000 * 60 * 60 * 8 // 8 ساعات
  }
}));

app.get('/admin/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});
app.get('/admin/index.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', productsRouter);
app.use('/admin', adminRouter);

app.listen(PORT, () => {
  console.log(`✅ متجر سند يعمل على: http://localhost:${PORT}`);
});
