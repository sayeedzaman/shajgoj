const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async findAll() {
    const result = await pool.query(
      'SELECT id, email, full_name, phone, address, created_at FROM users'
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT id, email, full_name, phone, address, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  static async create(userData) {
    const { email, password, full_name, phone, address } = userData;
    const password_hash = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, phone, address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, full_name, phone, address, created_at`,
      [email, password_hash, full_name, phone, address]
    );
    return result.rows[0];
  }

  static async update(id, userData) {
    const { full_name, phone, address } = userData;
    const result = await pool.query(
      `UPDATE users 
       SET full_name = $1, phone = $2, address = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, email, full_name, phone, address, created_at`,
      [full_name, phone, address, id]
    );
    return result.rows[0];
  }

  static async verifyPassword(user, password) {
    return await bcrypt.compare(password, user.password_hash);
  }
}

module.exports = User;
