const pool = require('../config/database');

class Cart {
  static async findByUserId(userId) {
    const result = await pool.query(`
      SELECT c.*, p.name, p.price, p.image_url, p.stock_quantity
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1
    `, [userId]);
    return result.rows;
  }

  static async addItem(userId, productId, quantity = 1) {
    const result = await pool.query(
      `INSERT INTO cart (user_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET quantity = cart.quantity + $3, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, productId, quantity]
    );
    return result.rows[0];
  }

  static async updateQuantity(userId, productId, quantity) {
    const result = await pool.query(
      `UPDATE cart 
       SET quantity = $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND product_id = $3
       RETURNING *`,
      [quantity, userId, productId]
    );
    return result.rows[0];
  }

  static async removeItem(userId, productId) {
    await pool.query(
      'DELETE FROM cart WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );
  }

  static async clearCart(userId) {
    await pool.query('DELETE FROM cart WHERE user_id = $1', [userId]);
  }
}

module.exports = Cart;
