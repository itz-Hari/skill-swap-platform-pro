const isAdmin = async (req, res, next) => {
  if (!req.session || !req.session.userId) {
    req.flash('error', 'Please log in to access this page');
    return res.redirect('/login');
  }

  try {
    const { pool } = require('../config/db');
    const [users] = await pool.query(
      'SELECT role, is_banned FROM users WHERE id = ?',
      [req.session.userId]
    );

    if (users.length === 0) {
      req.session.destroy();
      req.flash('error', 'Invalid session');
      return res.redirect('/login');
    }

    const user = users[0];

    if (user.is_banned === 1) {
      req.session.destroy();
      req.flash('error', 'Your account has been banned');
      return res.redirect('/login');
    }

    if (user.role !== 'admin') {
      req.flash('error', 'Access denied. Admin privileges required.');
      return res.redirect('/dashboard');
    }

    return next();
  } catch (error) {
    return res.status(500).send('Server error');
  }
};

module.exports = {
  isAdmin
};
