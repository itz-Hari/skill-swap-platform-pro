const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { isAuthenticated, checkBanned } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Request = require('../models/Request');
const Rating = require('../models/Rating');
const BlockedUser = require('../models/BlockedUser');

router.get('/profile', isAuthenticated, checkBanned, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const profile = await Profile.findByUserId(req.session.userId);

    res.render('profile', {
      title: 'My Profile',
      user: user,
      profile: profile,
      errors: [],
      isOwnProfile: true,
      viewedUser: null
    });
  } catch (error) {
    req.flash('error', 'Error loading profile');
    res.redirect('/dashboard');
  }
});

router.post('/profile', isAuthenticated, checkBanned, [
  body('bio')
    .trim()
    .isLength({ max: 500 }).withMessage('Bio must not exceed 500 characters')
    .escape(),
  body('skills_teach')
    .trim()
    .notEmpty().withMessage('Please specify skills you can teach')
    .isLength({ max: 300 }).withMessage('Skills to teach must not exceed 300 characters')
    .escape(),
  body('skills_learn')
    .trim()
    .notEmpty().withMessage('Please specify skills you want to learn')
    .isLength({ max: 300 }).withMessage('Skills to learn must not exceed 300 characters')
    .escape()
], async (req, res) => {
  const errors = validationResult(req);
  
  try {
    const user = await User.findById(req.session.userId);
    const profile = await Profile.findByUserId(req.session.userId);

    if (!errors.isEmpty()) {
      return res.render('profile', {
        title: 'My Profile',
        user: user,
        profile: {
          ...profile,
          bio: req.body.bio,
          skills_teach: req.body.skills_teach,
          skills_learn: req.body.skills_learn
        },
        errors: errors.array(),
        isOwnProfile: true,
        viewedUser: null
      });
    }

    const { bio, skills_teach, skills_learn } = req.body;
    await Profile.update(req.session.userId, bio, skills_teach, skills_learn);

    req.flash('success', 'Profile updated successfully');
    res.redirect('/profile');
  } catch (error) {
    req.flash('error', 'Error updating profile');
    res.redirect('/profile');
  }
});

router.get('/search', isAuthenticated, checkBanned, async (req, res) => {
  const searchTerm = req.query.q || '';
  
  try {
    const user = await User.findById(req.session.userId);
    let searchResults = [];

    if (searchTerm.trim().length > 0) {
      searchResults = await User.searchByName(searchTerm, req.session.userId);
    } else {
      searchResults = await User.searchByName('', req.session.userId);
    }

    res.render('search', {
      title: 'Search Users',
      user: user,
      searchTerm,
      searchResults
    });
  } catch (error) {
    req.flash('error', 'Error performing search');
    res.redirect('/dashboard');
  }
});

router.get('/user/:id', isAuthenticated, checkBanned, async (req, res) => {
  const userId = parseInt(req.params.id);

  if (userId === req.session.userId) {
    return res.redirect('/profile');
  }

  try {
    const user = await User.findById(req.session.userId);
    const viewedUserData = await Profile.getProfileWithUser(userId);

    if (!viewedUserData) {
      req.flash('error', 'User not found');
      return res.redirect('/search');
    }

    const existingRequest = await Request.checkExistingRequest(req.session.userId, userId);
    const ratings = await Rating.getRatingsForUser(userId);
    const isBlocked = await BlockedUser.checkBlockBetweenUsers(req.session.userId, userId);
    const acceptedSwap = await Request.getAcceptedSwapBetweenUsers(req.session.userId, userId);

    let canRate = false;
    let hasRated = false;
    
    if (acceptedSwap) {
      const ratingCheck = await Rating.canUserRate(req.session.userId, userId, acceptedSwap.id);
      canRate = ratingCheck.canRate;
      
      const existingRating = await Rating.checkExistingRating(req.session.userId, userId, acceptedSwap.id);
      hasRated = !!existingRating;
    }

    res.render('user-profile', {
      title: `${viewedUserData.name}'s Profile`,
      user: user,
      viewedUser: viewedUserData,
      existingRequest: existingRequest,
      ratings: ratings,
      isBlocked: isBlocked,
      canRate: canRate,
      hasRated: hasRated,
      swapId: acceptedSwap ? acceptedSwap.id : null
    });
  } catch (error) {
    req.flash('error', 'Error loading user profile');
    res.redirect('/search');
  }
});

router.post('/request/send/:userId', isAuthenticated, checkBanned, [
  body('skill_offer')
    .trim()
    .notEmpty().withMessage('Please specify what skill you can offer')
    .isLength({ max: 200 }).withMessage('Skill offer must not exceed 200 characters')
    .escape(),
  body('skill_need')
    .trim()
    .notEmpty().withMessage('Please specify what skill you need')
    .isLength({ max: 200 }).withMessage('Skill need must not exceed 200 characters')
    .escape(),
  body('message')
    .trim()
    .notEmpty().withMessage('Please include a message')
    .isLength({ max: 500 }).withMessage('Message must not exceed 500 characters')
    .escape()
], async (req, res) => {
  const receiverId = parseInt(req.params.userId);
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    return res.redirect(`/user/${receiverId}`);
  }

  try {
    const isBlocked = await BlockedUser.checkBlockBetweenUsers(req.session.userId, receiverId);
    
    if (isBlocked) {
      req.flash('error', 'Cannot send request. User blocked.');
      return res.redirect(`/user/${receiverId}`);
    }

    const existingRequest = await Request.checkExistingRequest(req.session.userId, receiverId);

    if (existingRequest) {
      req.flash('error', 'You already have a pending or active request with this user');
      return res.redirect(`/user/${receiverId}`);
    }

    const { skill_offer, skill_need, message } = req.body;
    await Request.create(req.session.userId, receiverId, skill_offer, skill_need, message);

    req.flash('success', 'Skill swap request sent successfully');
    res.redirect('/dashboard');
  } catch (error) {
    req.flash('error', 'Error sending request');
    res.redirect(`/user/${receiverId}`);
  }
});

router.post('/request/accept/:requestId', isAuthenticated, checkBanned, async (req, res) => {
  const requestId = parseInt(req.params.requestId);

  try {
    const request = await Request.findById(requestId);

    if (!request || request.receiver_id !== req.session.userId) {
      req.flash('error', 'Invalid request');
      return res.redirect('/dashboard');
    }

    if (request.status !== 'pending') {
      req.flash('error', 'Request has already been processed');
      return res.redirect('/dashboard');
    }

    await Request.updateStatus(requestId, 'accepted');
    req.flash('success', 'Request accepted! You can now chat.');
    res.redirect('/dashboard');
  } catch (error) {
    req.flash('error', 'Error accepting request');
    res.redirect('/dashboard');
  }
});

router.post('/request/reject/:requestId', isAuthenticated, checkBanned, async (req, res) => {
  const requestId = parseInt(req.params.requestId);

  try {
    const request = await Request.findById(requestId);

    if (!request || request.receiver_id !== req.session.userId) {
      req.flash('error', 'Invalid request');
      return res.redirect('/dashboard');
    }

    if (request.status !== 'pending') {
      req.flash('error', 'Request has already been processed');
      return res.redirect('/dashboard');
    }

    await Request.updateStatus(requestId, 'rejected');
    req.flash('success', 'Request rejected');
    res.redirect('/dashboard');
  } catch (error) {
    req.flash('error', 'Error rejecting request');
    res.redirect('/dashboard');
  }
});

router.post('/request/complete/:requestId', isAuthenticated, checkBanned, async (req, res) => {
  const requestId = parseInt(req.params.requestId);

  try {
    const request = await Request.verifyUserInRequest(requestId, req.session.userId);

    if (!request) {
      req.flash('error', 'Invalid request');
      return res.redirect('/dashboard');
    }

    if (request.status !== 'accepted') {
      req.flash('error', 'Only accepted requests can be completed');
      return res.redirect('/dashboard');
    }

    await Request.updateStatus(requestId, 'completed');
    req.flash('success', 'Skill swap marked as completed');
    res.redirect('/dashboard');
  } catch (error) {
    req.flash('error', 'Error completing request');
    res.redirect('/dashboard');
  }
});

router.post('/rate/:userId', isAuthenticated, checkBanned, [
  body('rating')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review')
    .trim()
    .isLength({ max: 500 }).withMessage('Review must not exceed 500 characters')
    .escape(),
  body('swapId')
    .isInt().withMessage('Invalid swap ID')
], async (req, res) => {
  const ratedUserId = parseInt(req.params.userId);
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    return res.redirect(`/user/${ratedUserId}`);
  }

  try {
    const { rating, review, swapId } = req.body;
    
    const canRate = await Rating.canUserRate(req.session.userId, ratedUserId, swapId);
    
    if (!canRate.canRate) {
      req.flash('error', canRate.reason);
      return res.redirect(`/user/${ratedUserId}`);
    }

    await Rating.create(req.session.userId, ratedUserId, swapId, rating, review);
    await Profile.updateRating(ratedUserId);

    req.flash('success', 'Rating submitted successfully');
    res.redirect(`/user/${ratedUserId}`);
  } catch (error) {
    req.flash('error', error.message || 'Error submitting rating');
    res.redirect(`/user/${ratedUserId}`);
  }
});

router.post('/block/:userId', isAuthenticated, checkBanned, async (req, res) => {
  const blockedId = parseInt(req.params.userId);

  if (blockedId === req.session.userId) {
    return res.status(400).json({ error: 'Cannot block yourself' });
  }

  try {
    await BlockedUser.block(req.session.userId, blockedId);
    res.json({ success: true, message: 'User blocked successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Error blocking user' });
  }
});

router.post('/unblock/:userId', isAuthenticated, checkBanned, async (req, res) => {
  const blockedId = parseInt(req.params.userId);

  try {
    await BlockedUser.unblock(req.session.userId, blockedId);
    res.json({ success: true, message: 'User unblocked successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Error unblocking user' });
  }
});

module.exports = router;
