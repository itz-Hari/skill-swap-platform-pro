const { pool } = require('../config/db');

const checkBlockStatus = async (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const currentUserId = req.session.userId;
  const targetUserId = req.body.targetUserId || req.params.userId || req.body.receiverId;

  if (!targetUserId) {
    return next();
  }

  try {
    const [blocks] = await pool.query(
      'SELECT id FROM blocked_users WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)',
      [currentUserId, targetUserId, targetUserId, currentUserId]
    );

    if (blocks.length > 0) {
      return res.status(403).json({ 
        error: 'Action blocked. One user has blocked the other.' 
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  checkBlockStatus
};
