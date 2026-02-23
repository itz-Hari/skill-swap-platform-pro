const { pool } = require('../config/db');

class Request {
  static async create(senderId, receiverId, skillOffer, skillNeed, message) {
    const [result] = await pool.query(
      'INSERT INTO requests (sender_id, receiver_id, skill_offer, skill_need, message, status, created_at) VALUES (?, ?, ?, ?, ?, "pending", NOW())',
      [senderId, receiverId, skillOffer, skillNeed, message]
    );
    return result.insertId;
  }

  static async findById(requestId) {
    const [rows] = await pool.query(
      'SELECT r.*, us.name as sender_name, us.email as sender_email, ur.name as receiver_name, ur.email as receiver_email FROM requests r JOIN users us ON r.sender_id = us.id JOIN users ur ON r.receiver_id = ur.id WHERE r.id = ?',
      [requestId]
    );
    return rows[0];
  }

  static async getSentRequests(userId) {
    const [rows] = await pool.query(
      'SELECT r.*, u.name as receiver_name, u.email as receiver_email FROM requests r JOIN users u ON r.receiver_id = u.id WHERE r.sender_id = ? ORDER BY r.created_at DESC',
      [userId]
    );
    return rows;
  }

  static async getReceivedRequests(userId) {
    const [rows] = await pool.query(
      'SELECT r.*, u.name as sender_name, u.email as sender_email FROM requests r JOIN users u ON r.sender_id = u.id WHERE r.receiver_id = ? ORDER BY r.created_at DESC',
      [userId]
    );
    return rows;
  }

  static async updateStatus(requestId, status) {
    await pool.query(
      'UPDATE requests SET status = ? WHERE id = ?',
      [status, requestId]
    );
  }

  static async getActiveSwaps(userId) {
    const [rows] = await pool.query(
      'SELECT r.*, us.name as sender_name, ur.name as receiver_name FROM requests r JOIN users us ON r.sender_id = us.id JOIN users ur ON r.receiver_id = ur.id WHERE (r.sender_id = ? OR r.receiver_id = ?) AND r.status = "accepted" ORDER BY r.created_at DESC',
      [userId, userId]
    );
    return rows;
  }

  static async checkExistingRequest(senderId, receiverId) {
    const [rows] = await pool.query(
      'SELECT * FROM requests WHERE sender_id = ? AND receiver_id = ? AND status IN ("pending", "accepted")',
      [senderId, receiverId]
    );
    return rows[0];
  }

  static async getAllRequests() {
    const [rows] = await pool.query(
      'SELECT r.*, us.name as sender_name, ur.name as receiver_name FROM requests r JOIN users us ON r.sender_id = us.id JOIN users ur ON r.receiver_id = ur.id ORDER BY r.created_at DESC'
    );
    return rows;
  }

  static async getTotalCount() {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM requests');
    return rows[0].count;
  }

  static async getActiveSwapsCount() {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM requests WHERE status = "accepted"');
    return rows[0].count;
  }

  static async verifyUserInRequest(requestId, userId) {
    const [rows] = await pool.query(
      'SELECT * FROM requests WHERE id = ? AND (sender_id = ? OR receiver_id = ?)',
      [requestId, userId, userId]
    );
    return rows[0];
  }

  static async getAcceptedSwapBetweenUsers(user1Id, user2Id) {
    const [rows] = await pool.query(
      'SELECT * FROM requests WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)) AND status = "accepted"',
      [user1Id, user2Id, user2Id, user1Id]
    );
    return rows[0];
  }
}

module.exports = Request;
