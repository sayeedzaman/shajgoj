const Order = require('../models/Order');
const Cart = require('../models/Cart');

const orderController = {
  async getAllOrders(req, res, next) {
    try {
      const orders = await Order.findAll();
      res.json(orders);
    } catch (error) {
      next(error);
    }
  },

  async getUserOrders(req, res, next) {
    try {
      const orders = await Order.findByUserId(req.user.userId);
      res.json(orders);
    } catch (error) {
      next(error);
    }
  },

  async getOrderById(req, res, next) {
    try {
      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      const items = await Order.getOrderItems(req.params.id);
      res.json({ ...order, items });
    } catch (error) {
      next(error);
    }
  },

  async createOrder(req, res, next) {
    try {
      const { items, shipping_address } = req.body;
      
      // Calculate total amount
      const total_amount = items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);

      const order = await Order.create({
        user_id: req.user.userId,
        items,
        total_amount,
        shipping_address
      });

      // Clear cart after order
      await Cart.clearCart(req.user.userId);

      res.status(201).json(order);
    } catch (error) {
      next(error);
    }
  },

  async updateOrderStatus(req, res, next) {
    try {
      const { status } = req.body;
      const order = await Order.updateStatus(req.params.id, status);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json(order);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = orderController;
