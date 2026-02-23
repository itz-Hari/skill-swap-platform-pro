const { pool } = require('../config/db');
const bcrypt = require('bcrypt');

class User {
  static async create(name, email, password, role = 'user') {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role, is_banned, is_online, created_at) VALUES (?, ?, ?, ?, 0, 0, NOW())',
      [name, email, hashedPassword, role]
    );
    return result.insertId;
  }

  static async findByEmail(email) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, is_banned, is_online, last_seen, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async getAllUsers() {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, is_banned, is_online, last_seen, created_at FROM users ORDER BY created_at DESC'
    );
    return rows;
  }

  static async updateBanStatus(userId, isBanned) {
    await pool.query(
      'UPDATE users SET is_banned = ? WHERE id = ?',
      [isBanned, userId]
    );
  }

  static async deleteUser(userId) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query('DELETE FROM messages WHERE sender_id = ?', [userId]);
      await connection.query('DELETE FROM requests WHERE sender_id = ? OR receiver_id = ?', [userId, userId]);
      await connection.query('DELETE FROM ratings WHERE rater_id = ? OR rated_user_id = ?', [userId, userId]);
      await connection.query('DELETE FROM reports WHERE reporter_id = ? OR reported_user_id = ?', [userId, userId]);
      await connection.query('DELETE FROM blocked_users WHERE blocker_id = ? OR blocked_id = ?', [userId, userId]);
      await connection.query('DELETE FROM profiles WHERE user_id = ?', [userId]);
      await connection.query('DELETE FROM users WHERE id = ?', [userId]);

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async searchByName(searchTerm, excludeUserId) {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.is_online, u.created_at, p.average_rating, p.rating_count, p.skills_teach, p.skills_learn 
       FROM users u 
       LEFT JOIN profiles p ON u.id = p.user_id 
       WHERE u.name LIKE ? AND u.id != ? AND u.is_banned = 0 AND u.role = "user" 
       ORDER BY u.is_online DESC, u.name ASC 
       LIMIT 50`,
      [`%${searchTerm}%`, excludeUserId]
    );
    return rows;
  }

  static async getTotalCount() {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "user"');
    return rows[0].count;
  }

  static async setOnlineStatus(userId, isOnline) {
    await pool.query(
      'UPDATE users SET is_online = ?, last_seen = NOW() WHERE id = ?',
      [isOnline ? 1 : 0, userId]
    );
  }

  static async getOnlineUsers() {
    const [rows] = await pool.query(
      'SELECT id, name, email FROM users WHERE is_online = 1 AND role = "user" AND is_banned = 0'
    );
    return rows;
  }
}

module.exports = User;
