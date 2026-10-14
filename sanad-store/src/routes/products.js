const express = require('express');
const router = express.Router();
const { getProducts, getSettings } = require('../data');

// قائمة المنتجات العامة (للمتجر)
router.get('/products', (req, res) => {
  res.json(getProducts());
});

// إعدادات المتجر العامة (اسم المتجر، رقم واتساب، نصوص الواجهة)
router.get('/settings', (req, res) => {
  res.json(getSettings());
});

module.exports = router;
