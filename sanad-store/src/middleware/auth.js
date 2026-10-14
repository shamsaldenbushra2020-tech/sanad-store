function requireAuth(req, res, next) {
  if (req.session && req.session.loggedIn) {
    return next();
  }
  // طلبات الـ API ترجع 401، وطلبات الصفحات تُعاد توجيهها لصفحة الدخول
  if (req.path.startsWith('/admin/api')) {
    return res.status(401).json({ error: 'غير مصرح. الرجاء تسجيل الدخول.' });
  }
  return res.redirect('/admin/login.html');
}

module.exports = { requireAuth };
