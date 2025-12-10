const pool = require('../config/database');

class Product {
  static async findAll() {
    const result = await pool.query(
      'SELECT * FROM products ORDER BY created_at DESC'
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findByCategory(category) {
    const result = await pool.query(
      'SELECT * FROM products WHERE category = $1 ORDER BY created_at DESC',
      [category]
    );
    return result.rows;
  }

  static async create(productData) {
    const { name, description, price, category, image_url, stock_quantity } = productData;
    const result = await pool.query(
      `INSERT INTO products (name, description, price, category, image_url, stock_quantity)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, description, price, category, image_url, stock_quantity]
    );
    return result.rows[0];
  }

  static async update(id, productData) {
    const { name, description, price, category, image_url, stock_quantity } = productData;
    const result = await pool.query(
      `UPDATE products 
       SET name = $1, description = $2, price = $3, category = $4, 
           image_url = $5, stock_quantity = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [name, description, price, category, image_url, stock_quantity, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
  }

  static async updateStock(id, quantity) {
    const result = await pool.query(
      `UPDATE products 
       SET stock_quantity = stock_quantity + $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [quantity, id]
    );
    return result.rows[0];
  }
}

module.exports = Product;
