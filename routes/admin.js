const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/adminMiddleware');
const User = require('../models/User');
const Request = require('../models/Request');
const Report = require('../models/Report');
const Rating = require('../models/Rating');

router.get('/admin/dashboard', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const totalUsers = await User.getTotalCount();
    const totalRequests = await Request.getTotalCount();
    const activeSwaps = await Request.getActiveSwapsCount();
    const pendingReports = await Report.getPendingCount();
    const onlineUsers = await User.getOnlineUsers();

    res.render('admin-dashboard', {
      title: 'Admin Dashboard',
      user: user,
      stats: {
        totalUsers,
        totalRequests,
        activeSwaps,
        pendingReports,
        onlineCount: onlineUsers.length
      }
    });
  } catch (error) {
    req.flash('error', 'Error loading admin dashboard');
    res.redirect('/');
  }
});

router.get('/admin/users', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const users = await User.getAllUsers();

    res.render('admin-users', {
      title: 'Manage Users',
      user: user,
      users: users
    });
  } catch (error) {
    req.flash('error', 'Error loading users');
    res.redirect('/admin/dashboard');
  }
});

router.post('/admin/users/ban/:userId', isAdmin, async (req, res) => {
  const targetUserId = parseInt(req.params.userId);

  if (targetUserId === req.session.userId) {
    req.flash('error', 'You cannot ban yourself');
    return res.redirect('/admin/users');
  }

  try {
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      req.flash('error', 'User not found');
      return res.redirect('/admin/users');
    }

    if (targetUser.role === 'admin') {
      req.flash('error', 'Cannot ban another admin');
      return res.redirect('/admin/users');
    }

    await User.updateBanStatus(targetUserId, 1);
    await User.setOnlineStatus(targetUserId, false);
    
    req.flash('success', 'User banned successfully');
    res.redirect('/admin/users');
  } catch (error) {
    req.flash('error', 'Error banning user');
    res.redirect('/admin/users');
  }
});

router.post('/admin/users/unban/:userId', isAdmin, async (req, res) => {
  const targetUserId = parseInt(req.params.userId);

  try {
    await User.updateBanStatus(targetUserId, 0);
    req.flash('success', 'User unbanned successfully');
    res.redirect('/admin/users');
  } catch (error) {
    req.flash('error', 'Error unbanning user');
    res.redirect('/admin/users');
  }
});

router.post('/admin/users/delete/:userId', isAdmin, async (req, res) => {
  const targetUserId = parseInt(req.params.userId);

  if (targetUserId === req.session.userId) {
    req.flash('error', 'You cannot delete yourself');
    return res.redirect('/admin/users');
  }

  try {
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      req.flash('error', 'User not found');
      return res.redirect('/admin/users');
    }

    if (targetUser.role === 'admin') {
      req.flash('error', 'Cannot delete another admin');
      return res.redirect('/admin/users');
    }

    await User.deleteUser(targetUserId);
    req.flash('success', 'User deleted successfully');
    res.redirect('/admin/users');
  } catch (error) {
    req.flash('error', 'Error deleting user');
    res.redirect('/admin/users');
  }
});

router.get('/admin/requests', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const requests = await Request.getAllRequests();

    res.render('admin-requests', {
      title: 'All Requests',
      user: user,
      requests: requests
    });
  } catch (error) {
    req.flash('error', 'Error loading requests');
    res.redirect('/admin/dashboard');
  }
});

router.get('/admin/reports', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const reports = await Report.getAllReports();

    res.render('admin-reports', {
      title: 'Reports',
      user: user,
      reports: reports
    });
  } catch (error) {
    req.flash('error', 'Error loading reports');
    res.redirect('/admin/dashboard');
  }
});

router.post('/admin/reports/update/:reportId', isAdmin, async (req, res) => {
  const reportId = parseInt(req.params.reportId);
  const { status, adminNotes } = req.body;

  try {
    await Report.updateStatus(reportId, status, adminNotes);
    req.flash('success', 'Report updated successfully');
    res.redirect('/admin/reports');
  } catch (error) {
    req.flash('error', 'Error updating report');
    res.redirect('/admin/reports');
  }
});

router.post('/admin/reports/ban-user/:reportId', isAdmin, async (req, res) => {
  const reportId = parseInt(req.params.reportId);

  try {
    const report = await Report.findById(reportId);
    
    if (!report) {
      req.flash('error', 'Report not found');
      return res.redirect('/admin/reports');
    }

    const targetUser = await User.findById(report.reported_user_id);

    if (targetUser.role === 'admin') {
      req.flash('error', 'Cannot ban another admin');
      return res.redirect('/admin/reports');
    }

    await User.updateBanStatus(report.reported_user_id, 1);
    await User.setOnlineStatus(report.reported_user_id, false);
    await Report.updateStatus(reportId, 'resolved', 'User banned');

    req.flash('success', 'User banned and report resolved');
    res.redirect('/admin/reports');
  } catch (error) {
    req.flash('error', 'Error processing ban');
    res.redirect('/admin/reports');
  }
});

router.get('/admin/ratings', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const ratings = await Rating.getAllRatings();

    res.render('admin-ratings', {
      title: 'All Ratings',
      user: user,
      ratings: ratings
    });
  } catch (error) {
    req.flash('error', 'Error loading ratings');
    res.redirect('/admin/dashboard');
  }
});

module.exports = router;
