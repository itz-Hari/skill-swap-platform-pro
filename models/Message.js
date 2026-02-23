const { pool } = require('../config/db');

class Message {
  static async create(requestId, senderId, message) {
    const [result] = await pool.query(
      'INSERT INTO messages (request_id, sender_id, message, created_at) VALUES (?, ?, ?, NOW())',
      [requestId, senderId, message]
    );
    return result.insertId;
  }

  static async getByRequestId(requestId) {
    const [rows] = await pool.query(
      'SELECT m.*, u.name as sender_name FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.request_id = ? ORDER BY m.created_at ASC',
      [requestId]
    );
    return rows;
  }

  static async getLatestMessage(requestId) {
    const [rows] = await pool.query(
      'SELECT m.*, u.name as sender_name FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.request_id = ? ORDER BY m.created_at DESC LIMIT 1',
      [requestId]
    );
    return rows[0];
  }
}

module.exports = Message;
