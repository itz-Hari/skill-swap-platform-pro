const express = require('express');
const router = express.Router();
const { isAuthenticated, checkBanned } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Request = require('../models/Request');

router.get('/dashboard', isAuthenticated, checkBanned, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const sentRequests = await Request.getSentRequests(req.session.userId);
    const receivedRequests = await Request.getReceivedRequests(req.session.userId);
    const activeSwaps = await Request.getActiveSwaps(req.session.userId);

    res.render('dashboard', {
      title: 'Dashboard',
      user: user,
      sentRequests,
      receivedRequests,
      activeSwaps
    });
  } catch (error) {
    req.flash('error', 'Error loading dashboard');
    res.redirect('/');
  }
});

module.exports = router;
