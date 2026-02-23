const { pool } = require('../config/db');

class Profile {
  static async create(userId) {
    const [result] = await pool.query(
      'INSERT INTO profiles (user_id, bio, skills_teach, skills_learn, average_rating, rating_count, updated_at) VALUES (?, "", "", "", 0.00, 0, NOW())',
      [userId]
    );
    return result.insertId;
  }

  static async findByUserId(userId) {
    const [rows] = await pool.query(
      'SELECT * FROM profiles WHERE user_id = ?',
      [userId]
    );
    return rows[0];
  }

  static async update(userId, bio, skillsTeach, skillsLearn) {
    await pool.query(
      'UPDATE profiles SET bio = ?, skills_teach = ?, skills_learn = ?, updated_at = NOW() WHERE user_id = ?',
      [bio, skillsTeach, skillsLearn, userId]
    );
  }

  static async getProfileWithUser(userId) {
    const [rows] = await pool.query(
      'SELECT u.id, u.name, u.email, u.is_online, u.created_at, p.bio, p.skills_teach, p.skills_learn, p.average_rating, p.rating_count, p.updated_at FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE u.id = ?',
      [userId]
    );
    return rows[0];
  }

  static async updateRating(userId) {
    const [stats] = await pool.query(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM ratings WHERE rated_user_id = ?',
      [userId]
    );

    const avgRating = stats[0].avg_rating || 0;
    const count = stats[0].count || 0;

    await pool.query(
      'UPDATE profiles SET average_rating = ?, rating_count = ? WHERE user_id = ?',
      [avgRating, count, userId]
    );

    return { avgRating, count };
  }
}

module.exports = Profile;
