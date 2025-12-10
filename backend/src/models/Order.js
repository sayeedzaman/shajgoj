const pool = require('../config/database');

class Order {
  static async findAll() {
    const result = await pool.query(`
      SELECT o.*, u.email, u.full_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(`
      SELECT o.*, u.email, u.full_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = $1
    `, [id]);
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const result = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  static async create(orderData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const { user_id, items, total_amount, shipping_address } = orderData;
      
      // Create order
      const orderResult = await client.query(
        `INSERT INTO orders (user_id, total_amount, shipping_address)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [user_id, total_amount, shipping_address]
      );
      
      const order = orderResult.rows[0];

      // Insert order items and update stock
      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, price)
           VALUES ($1, $2, $3, $4)`,
          [order.id, item.product_id, item.quantity, item.price]
        );

        // Decrease product stock
        await client.query(
          `UPDATE products 
           SET stock_quantity = stock_quantity - $1
           WHERE id = $2`,
          [item.quantity, item.product_id]
        );
      }

      await client.query('COMMIT');
      return order;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getOrderItems(orderId) {
    const result = await pool.query(`
      SELECT oi.*, p.name, p.image_url
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `, [orderId]);
    return result.rows;
  }

  static async updateStatus(id, status) {
    const result = await pool.query(
      `UPDATE orders 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  }
}

module.exports = Order;
