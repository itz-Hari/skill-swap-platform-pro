const express = require('express');
const router = express.Router();
const { isAuthenticated, checkBanned } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Request = require('../models/Request');
const Message = require('../models/Message');
const BlockedUser = require('../models/BlockedUser');
const Report = require('../models/Report');
const upload = require('../config/multer');

router.get('/chat/:requestId', isAuthenticated, checkBanned, async (req, res) => {
  const requestId = parseInt(req.params.requestId);

  try {
    const user = await User.findById(req.session.userId);
    const request = await Request.findById(requestId);

    if (!request) {
      req.flash('error', 'Chat not found');
      return res.redirect('/dashboard');
    }

    if (request.sender_id !== req.session.userId && request.receiver_id !== req.session.userId) {
      req.flash('error', 'Access denied');
      return res.redirect('/dashboard');
    }

    if (request.status !== 'accepted') {
      req.flash('error', 'Chat is only available for accepted requests');
      return res.redirect('/dashboard');
    }

    const isBlocked = await BlockedUser.checkBlockBetweenUsers(req.session.userId, 
      request.sender_id === req.session.userId ? request.receiver_id : request.sender_id);

    if (isBlocked) {
      req.flash('error', 'Cannot access chat. User blocked.');
      return res.redirect('/dashboard');
    }

    const messages = await Message.getByRequestId(requestId);

    res.render('chat', {
      title: 'Chat',
      user: user,
      request: request,
      messages: messages
    });
  } catch (error) {
    req.flash('error', 'Error loading chat');
    res.redirect('/dashboard');
  }
});

router.post('/report/submit', isAuthenticated, checkBanned, upload.single('screenshot'), async (req, res) => {
  try {
    const { reportedUserId, requestId, description } = req.body;
    
    if (!description || description.trim().length === 0) {
      return res.status(400).json({ error: 'Description is required' });
    }

    if (description.length > 1000) {
      return res.status(400).json({ error: 'Description too long' });
    }

    const screenshotPath = req.file ? `/uploads/reports/${req.file.filename}` : null;

    await Report.create(
      req.session.userId,
      parseInt(reportedUserId),
      requestId ? parseInt(requestId) : null,
      description,
      screenshotPath
    );

    res.json({ success: true, message: 'Report submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error submitting report' });
  }
});

module.exports = router;
