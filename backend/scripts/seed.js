const pool = require('../src/config/database');

const seedData = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Seed products
    const products = [
      {
        name: 'Wireless Headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        price: 79.99,
        category: 'Electronics',
        image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
        stock_quantity: 50
      },
      {
        name: 'Smart Watch',
        description: 'Feature-rich smartwatch with fitness tracking',
        price: 199.99,
        category: 'Electronics',
        image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
        stock_quantity: 30
      },
      {
        name: 'Laptop Backpack',
        description: 'Durable laptop backpack with multiple compartments',
        price: 49.99,
        category: 'Accessories',
        image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
        stock_quantity: 100
      },
      {
        name: 'USB-C Hub',
        description: 'Multi-port USB-C hub for laptops',
        price: 29.99,
        category: 'Electronics',
        image_url: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=500',
        stock_quantity: 75
      },
      {
        name: 'Mechanical Keyboard',
        description: 'RGB mechanical keyboard with blue switches',
        price: 89.99,
        category: 'Electronics',
        image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500',
        stock_quantity: 40
      },
      {
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse with long battery life',
        price: 24.99,
        category: 'Electronics',
        image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500',
        stock_quantity: 80
      },
      {
        name: 'Phone Case',
        description: 'Premium protective phone case',
        price: 14.99,
        category: 'Accessories',
        image_url: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=500',
        stock_quantity: 200
      },
      {
        name: 'Portable Charger',
        description: '20000mAh power bank with fast charging',
        price: 34.99,
        category: 'Electronics',
        image_url: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500',
        stock_quantity: 60
      }
    ];

    for (const product of products) {
      await client.query(
        `INSERT INTO products (name, description, price, category, image_url, stock_quantity)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING`,
        [product.name, product.description, product.price, product.category, product.image_url, product.stock_quantity]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Database seeded successfully with sample products');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    client.release();
  }
};

seedData()
  .then(() => {
    console.log('Seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
