const { pool } = require('../config/db');

class Report {
  static async create(reporterId, reportedUserId, requestId, description, screenshotPath) {
    const [result] = await pool.query(
      'INSERT INTO reports (reporter_id, reported_user_id, request_id, description, screenshot_path, status, created_at) VALUES (?, ?, ?, ?, ?, "pending", NOW())',
      [reporterId, reportedUserId, requestId, description, screenshotPath]
    );
    return result.insertId;
  }

  static async findById(reportId) {
    const [rows] = await pool.query(
      'SELECT r.*, ur.name as reporter_name, ur.email as reporter_email, uu.name as reported_user_name, uu.email as reported_user_email FROM reports r JOIN users ur ON r.reporter_id = ur.id JOIN users uu ON r.reported_user_id = uu.id WHERE r.id = ?',
      [reportId]
    );
    return rows[0];
  }

  static async getAllReports() {
    const [rows] = await pool.query(
      'SELECT r.*, ur.name as reporter_name, uu.name as reported_user_name FROM reports r JOIN users ur ON r.reporter_id = ur.id JOIN users uu ON r.reported_user_id = uu.id ORDER BY r.created_at DESC'
    );
    return rows;
  }

  static async getPendingReports() {
    const [rows] = await pool.query(
      'SELECT r.*, ur.name as reporter_name, uu.name as reported_user_name FROM reports r JOIN users ur ON r.reporter_id = ur.id JOIN users uu ON r.reported_user_id = uu.id WHERE r.status = "pending" ORDER BY r.created_at DESC'
    );
    return rows;
  }

  static async updateStatus(reportId, status, adminNotes) {
    await pool.query(
      'UPDATE reports SET status = ?, admin_notes = ?, updated_at = NOW() WHERE id = ?',
      [status, adminNotes, reportId]
    );
  }

  static async getReportCount() {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM reports');
    return rows[0].count;
  }

  static async getPendingCount() {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM reports WHERE status = "pending"');
    return rows[0].count;
  }
}

module.exports = Report;
