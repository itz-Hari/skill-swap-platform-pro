const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  req.flash('error', 'Please log in to access this page');
  return res.redirect('/login');
};

const isGuest = (req, res, next) => {
  if (req.session && req.session.userId) {
    return res.redirect('/dashboard');
  }
  return next();
};

const checkBanned = async (req, res, next) => {
  if (req.session && req.session.userId) {
    try {
      const { pool } = require('../config/db');
      const [users] = await pool.query(
        'SELECT is_banned FROM users WHERE id = ?',
        [req.session.userId]
      );
      
      if (users.length > 0 && users[0].is_banned === 1) {
        req.session.destroy();
        req.flash('error', 'Your account has been banned');
        return res.redirect('/login');
      }
    } catch (error) {
      return res.status(500).send('Server error');
    }
  }
  return next();
};

module.exports = {
  isAuthenticated,
  isGuest,
  checkBanned
};
