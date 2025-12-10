const Cart = require('../models/Cart');

const cartController = {
  async getCart(req, res, next) {
    try {
      const items = await Cart.findByUserId(req.user.userId);
      res.json(items);
    } catch (error) {
      next(error);
    }
  },

  async addToCart(req, res, next) {
    try {
      const { product_id, quantity } = req.body;
      const item = await Cart.addItem(req.user.userId, product_id, quantity);
      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  },

  async updateCartItem(req, res, next) {
    try {
      const { quantity } = req.body;
      const item = await Cart.updateQuantity(
        req.user.userId,
        req.params.productId,
        quantity
      );
      res.json(item);
    } catch (error) {
      next(error);
    }
  },

  async removeFromCart(req, res, next) {
    try {
      await Cart.removeItem(req.user.userId, req.params.productId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async clearCart(req, res, next) {
    try {
      await Cart.clearCart(req.user.userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
};

module.exports = cartController;
