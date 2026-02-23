const { pool } = require('../config/db');

class BlockedUser {
  static async block(blockerId, blockedId) {
    try {
      const [result] = await pool.query(
        'INSERT INTO blocked_users (blocker_id, blocked_id, created_at) VALUES (?, ?, NOW())',
        [blockerId, blockedId]
      );
      return result.insertId;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('User is already blocked');
      }
      throw error;
    }
  }

  static async unblock(blockerId, blockedId) {
    const [result] = await pool.query(
      'DELETE FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?',
      [blockerId, blockedId]
    );
    return result.affectedRows > 0;
  }

  static async isBlocked(blockerId, blockedId) {
    const [rows] = await pool.query(
      'SELECT * FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?',
      [blockerId, blockedId]
    );
    return rows.length > 0;
  }

  static async checkBlockBetweenUsers(user1Id, user2Id) {
    const [rows] = await pool.query(
      'SELECT * FROM blocked_users WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)',
      [user1Id, user2Id, user2Id, user1Id]
    );
    return rows.length > 0;
  }

  static async getBlockedUsers(blockerId) {
    const [rows] = await pool.query(
      'SELECT u.id, u.name, u.email, b.created_at as blocked_at FROM blocked_users b JOIN users u ON b.blocked_id = u.id WHERE b.blocker_id = ? ORDER BY b.created_at DESC',
      [blockerId]
    );
    return rows;
  }

  static async getUsersWhoBlocked(blockedId) {
    const [rows] = await pool.query(
      'SELECT u.id, u.name, u.email, b.created_at as blocked_at FROM blocked_users b JOIN users u ON b.blocker_id = u.id WHERE b.blocked_id = ? ORDER BY b.created_at DESC',
      [blockedId]
    );
    return rows;
  }
}

module.exports = BlockedUser;
