const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Profile = require('../models/Profile');
const { isGuest } = require('../middleware/authMiddleware');

router.get('/register', isGuest, (req, res) => {
  res.render('register', {
    title: 'Register',
    user: null,
    errors: [],
    oldInput: {}
  });
});

router.post('/register', isGuest, [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .escape(),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('confirmPassword')
    .notEmpty().withMessage('Please confirm your password')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
], async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.render('register', {
      title: 'Register',
      user: null,
      errors: errors.array(),
      oldInput: {
        name: req.body.name,
        email: req.body.email
      }
    });
  }

  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findByEmail(email);
    
    if (existingUser) {
      return res.render('register', {
        title: 'Register',
        user: null,
        errors: [{ msg: 'Email already registered' }],
        oldInput: { name, email }
      });
    }

    const userId = await User.create(name, email, password);
    await Profile.create(userId);

    req.flash('success', 'Registration successful! Please log in.');
    res.redirect('/login');
  } catch (error) {
    return res.render('register', {
      title: 'Register',
      user: null,
      errors: [{ msg: 'Server error. Please try again.' }],
      oldInput: { name, email }
    });
  }
});

router.get('/login', isGuest, (req, res) => {
  res.render('login', {
    title: 'Login',
    user: null,
    errors: [],
    oldInput: {}
  });
});

router.post('/login', isGuest, [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.render('login', {
      title: 'Login',
      user: null,
      errors: errors.array(),
      oldInput: { email: req.body.email }
    });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findByEmail(email);

    if (!user) {
      return res.render('login', {
        title: 'Login',
        user: null,
        errors: [{ msg: 'Invalid email or password' }],
        oldInput: { email }
      });
    }

    if (user.is_banned === 1) {
      return res.render('login', {
        title: 'Login',
        user: null,
        errors: [{ msg: 'Your account has been banned' }],
        oldInput: { email }
      });
    }

    const isValidPassword = await User.verifyPassword(password, user.password);

    if (!isValidPassword) {
      return res.render('login', {
        title: 'Login',
        user: null,
        errors: [{ msg: 'Invalid email or password' }],
        oldInput: { email }
      });
    }

    req.session.userId = user.id;
    req.session.userName = user.name;
    req.session.userRole = user.role;

    await User.setOnlineStatus(user.id, true);

    if (user.role === 'admin') {
      req.flash('success', 'Welcome back, Admin!');
      return res.redirect('/admin/dashboard');
    }

    req.flash('success', `Welcome back, ${user.name}!`);
    res.redirect('/dashboard');
  } catch (error) {
    return res.render('login', {
      title: 'Login',
      user: null,
      errors: [{ msg: 'Server error. Please try again.' }],
      oldInput: { email }
    });
  }
});

router.get('/logout', async (req, res) => {
  if (req.session && req.session.userId) {
    await User.setOnlineStatus(req.session.userId, false);
  }
  
  req.session.destroy((err) => {
    if (err) {
      return res.redirect('/dashboard');
    }
    res.redirect('/login');
  });
});

module.exports = router;
