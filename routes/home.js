const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  if (req.session && req.session.userId) {
    if (req.session.userRole === 'admin') {
      return res.redirect('/admin/dashboard');
    }
    return res.redirect('/dashboard');
  }
  
  res.render('home', {
    title: 'Skill Swap Platform',
    user: null
  });
});

module.exports = router;
