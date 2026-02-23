const { pool } = require('../config/db');

class Rating {
  static async create(raterId, ratedUserId, swapId, rating, reviewText) {
    try {
      const [result] = await pool.query(
        'INSERT INTO ratings (rater_id, rated_user_id, swap_id, rating, review_text, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [raterId, ratedUserId, swapId, rating, reviewText]
      );
      return result.insertId;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('You have already rated this user for this swap');
      }
      throw error;
    }
  }

  static async checkExistingRating(raterId, ratedUserId, swapId) {
    const [rows] = await pool.query(
      'SELECT * FROM ratings WHERE rater_id = ? AND rated_user_id = ? AND swap_id = ?',
      [raterId, ratedUserId, swapId]
    );
    return rows[0];
  }

  static async getRatingsForUser(userId) {
    const [rows] = await pool.query(
      'SELECT r.*, u.name as rater_name, req.skill_offer, req.skill_need FROM ratings r JOIN users u ON r.rater_id = u.id JOIN requests req ON r.swap_id = req.id WHERE r.rated_user_id = ? ORDER BY r.created_at DESC',
      [userId]
    );
    return rows;
  }

  static async getAverageRating(userId) {
    const [rows] = await pool.query(
      'SELECT AVG(rating) as average, COUNT(*) as count FROM ratings WHERE rated_user_id = ?',
      [userId]
    );
    return {
      average: rows[0].average || 0,
      count: rows[0].count || 0
    };
  }

  static async getAllRatings() {
    const [rows] = await pool.query(
      'SELECT r.*, ur.name as rater_name, uu.name as rated_user_name FROM ratings r JOIN users ur ON r.rater_id = ur.id JOIN users uu ON r.rated_user_id = uu.id ORDER BY r.created_at DESC'
    );
    return rows;
  }

  static async canUserRate(raterId, ratedUserId, swapId) {
    const [swaps] = await pool.query(
      'SELECT * FROM requests WHERE id = ? AND ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)) AND status = "accepted"',
      [swapId, raterId, ratedUserId, ratedUserId, raterId]
    );

    if (swaps.length === 0) {
      return { canRate: false, reason: 'Invalid swap or swap not accepted' };
    }

    const [existing] = await pool.query(
      'SELECT * FROM ratings WHERE rater_id = ? AND rated_user_id = ? AND swap_id = ?',
      [raterId, ratedUserId, swapId]
    );

    if (existing.length > 0) {
      return { canRate: false, reason: 'You have already rated this user for this swap' };
    }

    return { canRate: true };
  }
}

module.exports = Rating;
