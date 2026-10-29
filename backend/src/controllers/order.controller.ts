import type { Response } from 'express';
import { Prisma } from '@prisma/client';
import type { PaymentMethod, PaymentStatus } from '@prisma/client';
import type { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  PAYMENT_SETTING_FIELD,
  isMobilePayment,
  normalizeBdMobile,
  normalizeTrxId,
} from '../lib/payments.js';
import {
  DEFAULT_SHIPPING_SETTINGS,
  SHIPPING_SETTINGS_SELECT,
  calculateShippingCost,
  type ShippingSettings,
} from '../lib/shipping.js';
import { applyOfferPricingOne } from '../lib/offerPricing.js';

// Generate unique order number
const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp}-${random}`;
};

// Fixed settings ID for the StoreSettings singleton (see settings.controller.ts)
const SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

const getShippingSettings = async (): Promise<ShippingSettings> => {
  const settings = await prisma.storeSettings.findUnique({
    where: { id: SETTINGS_ID },
    select: SHIPPING_SETTINGS_SELECT,
  });

  return settings ?? DEFAULT_SHIPPING_SETTINGS;
};

const isPaymentMethodEnabled = async (method: PaymentMethod): Promise<boolean> => {
  const settings = await prisma.storeSettings.findUnique({ where: { id: SETTINGS_ID } });
  // No settings row yet means schema defaults apply (all methods enabled)
  if (!settings) return true;
  return settings[PAYMENT_SETTING_FIELD[method]];
};

/**
 * Validates mobile banking details (sender number + TrxID) for an order.
 * Returns the normalized values or an error message.
 */
const validateMobilePaymentDetails = (
  sender: unknown,
  trxId: unknown
): { sender: string; trxId: string } | { error: string } => {
  const normalizedSender = normalizeBdMobile(sender);
  if (!normalizedSender) {
    return { error: 'Please enter the valid mobile number you sent the payment from (e.g. 01XXXXXXXXX)' };
  }
  const normalizedTrxId = normalizeTrxId(trxId);
  if (!normalizedTrxId) {
    return { error: 'Please enter a valid Transaction ID (6-30 letters/numbers)' };
  }
  return { sender: normalizedSender, trxId: normalizedTrxId };
};

class InsufficientStockError extends Error {
  constructor(public productName: string) {
    super(`Insufficient stock for ${productName}`);
  }
}

const isDuplicateTrxIdError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === 'P2002' &&
  String(error.meta?.target ?? '').includes('paymentTrxId');

// Create new order
export const createOrder = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;
    const { addressId, items, paymentMethod: rawPaymentMethod = 'COD', paymentSender, paymentTrxId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!addressId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Address and items are required' });
    }

    if (!PAYMENT_METHODS.includes(rawPaymentMethod)) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }
    const paymentMethod = rawPaymentMethod as PaymentMethod;

    if (!(await isPaymentMethodEnabled(paymentMethod))) {
      return res.status(400).json({ error: 'This payment method is currently unavailable' });
    }

    let mobilePayment: { sender: string; trxId: string } | null = null;
    if (isMobilePayment(paymentMethod)) {
      const result = validateMobilePaymentDetails(paymentSender, paymentTrxId);
      if ('error' in result) {
        return res.status(400).json({ error: result.error });
      }
      mobilePayment = result;
    }

    // Verify address belongs to user
    const address = await prisma.address.findFirst({
      where: { 
        id: addressId, 
        userId: userId 
      },
    });

    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    // Validate all products and calculate subtotal
    let subtotal = 0;
    let totalQuantity = 0;
    const orderItems: Array<{
      productId: string;
      quantity: number;
      price: number;
      originalPrice: number | null;
      offerId: string | null;
      offerName: string | null;
    }> = [];
    const usedOfferIds = new Set<string>();
    let discountTotal = 0;

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return res.status(404).json({ error: `Product ${item.productId} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for ${product.name}. Only ${product.stock} available`,
        });
      }

      // Running product offers lower the unit price (same rule the cart and product pages show)
      const pricedProduct = await applyOfferPricingOne(product);
      const offer = pricedProduct.appliedOffer;
      const price = pricedProduct.salePrice || pricedProduct.price;
      // Price the customer would have paid without the offer (store sale price, else regular price)
      const originalPrice = product.salePrice || product.price;
      subtotal += price * item.quantity;
      totalQuantity += item.quantity;

      if (offer) {
        usedOfferIds.add(offer.id);
        discountTotal += (originalPrice - price) * item.quantity;
      }

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price,
        originalPrice: offer ? originalPrice : null,
        offerId: offer?.id ?? null,
        offerName: offer?.name ?? null,
      });
    }

    // Calculate shipping cost from the city and the admin's free-shipping rules
    const shippingSettings = await getShippingSettings();
    const shippingCost = calculateShippingCost(subtotal, totalQuantity, address.city, shippingSettings);
    const total = subtotal + shippingCost;

    // Create order with items
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: userId,
        addressId: addressId,
        subtotal: parseFloat(subtotal.toFixed(2)),
        shippingCost: parseFloat(shippingCost.toFixed(2)),
        discountTotal: parseFloat(discountTotal.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        status: 'PENDING',
        paymentMethod,
        // Mobile payments wait for admin to confirm the TrxID; COD is collected on delivery
        paymentStatus: mobilePayment ? 'PENDING_VERIFICATION' : 'UNPAID',
        paymentSender: mobilePayment?.sender ?? null,
        paymentTrxId: mobilePayment?.trxId ?? null,
        OrderItem: {
          create: orderItems,
        },
        OrderStatusHistory: {
          create: { status: 'PENDING' },
        },
      } as Prisma.OrderUncheckedCreateInput,
      include: {
        OrderItem: {
          include: {
            Product: true,
          },
        },
        Address: true,
        OrderStatusHistory: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    // Update product stock
    for (const item of orderItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    // Count one use per order for each offer that discounted it (enforces the offer's usage limit)
    if (usedOfferIds.size > 0) {
      await prisma.offer.updateMany({
        where: { id: { in: [...usedOfferIds] } },
        data: { usageCount: { increment: 1 } },
      });
    }

    // Clear user's cart after order creation
    const cart = await prisma.cart.findUnique({
      where: { userId: userId },
    });

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    res.status(201).json(order);
  } catch (error) {
    if (isDuplicateTrxIdError(error)) {
      return res.status(409).json({ error: 'This Transaction ID has already been used for another order' });
    }
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

// Get all orders for authenticated user
export const getUserOrders = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const orders = await prisma.order.findMany({
      where: { userId: userId },
      include: {
        OrderItem: {
          include: {
            Product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true,
                price: true,
                salePrice: true,
              },
            },
          },
        },
        Address: true,
        OrderStatusHistory: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ orders });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Get order by ID
export const getOrderById = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: id,
        userId: userId,
      },
      include: {
        OrderItem: {
          include: {
            Product: {
              include: {
                Category: true,
                Brand: true,
              },
            },
          },
        },
        Address: true,
        User: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        OrderStatusHistory: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

// Cancel order (only if status is PENDING)
export const cancelOrder = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: id,
        userId: userId,
      },
      include: {
        OrderItem: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'PENDING') {
      return res.status(400).json({
        error: 'Only pending orders can be cancelled',
      });
    }

    // Update order status and get updated order with relations
    const updatedOrder = await prisma.order.update({
      where: { id: id },
      data: {
        status: 'CANCELLED',
        OrderStatusHistory: {
          create: { status: 'CANCELLED', note: 'Cancelled by customer' },
        },
      },
      include: {
        OrderItem: {
          include: {
            Product: true,
          },
        },
        Address: true,
        OrderStatusHistory: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    // Restore product stock
    for (const item of updatedOrder.OrderItem) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
};

// Get all orders (Admin only)
export const getAllOrders = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { status, paymentStatus, paymentMethod, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.OrderWhereInput = {};
    
    if (status && typeof status === 'string') {
      where.status = status as any;
    }

    if (typeof paymentStatus === 'string' && PAYMENT_STATUSES.includes(paymentStatus as PaymentStatus)) {
      where.paymentStatus = paymentStatus as PaymentStatus;
    }

    if (typeof paymentMethod === 'string' && PAYMENT_METHODS.includes(paymentMethod as PaymentMethod)) {
      where.paymentMethod = paymentMethod as PaymentMethod;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          OrderItem: {
            include: {
              Product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: true,
                },
              },
            },
          },
          Address: true,
          User: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          OrderStatusHistory: {
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limitNum,
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      orders,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalOrders: total,
        hasMore: skip + orders.length < total,
      },
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Update order status (Admin only)
export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', '),
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: id },
      include: { OrderItem: { include: { Product: { select: { name: true } } } } },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Cash on delivery is collected when the parcel is handed over
    const codCollected = status === 'DELIVERED' && order.paymentMethod === 'COD' && order.paymentStatus === 'UNPAID';

    // Cancelling releases the order's stock; reopening a cancelled order reserves it again
    const isCancelling = status === 'CANCELLED' && order.status !== 'CANCELLED';
    const isReopening = order.status === 'CANCELLED' && status !== 'CANCELLED';

    const updateData = {
      status: status as any,
      ...(codCollected && { paymentStatus: 'PAID' as const, paidAt: new Date() }),
      ...(status !== order.status && {
        OrderStatusHistory: {
          create: {
            status: status as any,
            ...(isCancelling && { note: 'Cancelled by store' }),
          },
        },
      }),
    };

    if (isCancelling || isReopening) {
      // Stock and status must change together. Only writes go in the transaction (the full
      // order is loaded after it commits) to keep it short on a remote database.
      await prisma.$transaction(async (tx) => {
        for (const item of order.OrderItem) {
          if (isCancelling) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          } else {
            // Conditional decrement so two admins can't oversell the same stock
            const { count } = await tx.product.updateMany({
              where: { id: item.productId, stock: { gte: item.quantity } },
              data: { stock: { decrement: item.quantity } },
            });
            if (count === 0) {
              throw new InsufficientStockError(item.Product.name);
            }
          }
        }

        await tx.order.update({ where: { id }, data: updateData });
      }, { maxWait: 10000, timeout: 20000 });
    } else {
      // A single update (with its nested history record) is already atomic
      await prisma.order.update({ where: { id }, data: updateData });
    }

    const updatedOrder = await prisma.order.findUnique({
      where: { id },
      include: ORDER_DETAIL_INCLUDE,
    });

    res.json({
      message: 'Order status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      return res.status(400).json({
        error: `Can't reopen this order: not enough stock left for ${error.productName}`,
      });
    }
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

// Update shipping cost for a specific order (Admin only) - recalculates total
export const updateOrderShipping = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { shippingCost } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    if (typeof shippingCost !== 'number' || Number.isNaN(shippingCost) || shippingCost < 0) {
      return res.status(400).json({ error: 'A valid non-negative shippingCost is required' });
    }

    const order = await prisma.order.findUnique({ where: { id } });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const newTotal = order.subtotal + shippingCost;

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        shippingCost: parseFloat(shippingCost.toFixed(2)),
        total: parseFloat(newTotal.toFixed(2)),
      },
      include: {
        OrderItem: {
          include: {
            Product: true,
          },
        },
        Address: true,
        User: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        OrderStatusHistory: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    res.json({
      message: 'Order shipping cost updated successfully',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Update order shipping error:', error);
    res.status(500).json({ error: 'Failed to update order shipping cost' });
  }
};
const ORDER_DETAIL_INCLUDE = {
  OrderItem: {
    include: {
      Product: true,
    },
  },
  Address: true,
  User: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
    },
  },
  OrderStatusHistory: {
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.OrderInclude;

// Resubmit mobile payment details (customer) - e.g. after a typo or a rejected TrxID
export const resubmitOrderPayment = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { paymentMethod: rawPaymentMethod, paymentSender, paymentTrxId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const order = await prisma.order.findFirst({ where: { id, userId } });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status === 'CANCELLED') {
      return res.status(400).json({ error: 'This order has been cancelled' });
    }

    if (!isMobilePayment(order.paymentMethod)) {
      return res.status(400).json({ error: 'This order is paid by cash on delivery' });
    }

    if (order.paymentStatus !== 'PENDING_VERIFICATION' && order.paymentStatus !== 'FAILED') {
      return res.status(400).json({ error: 'Payment details can no longer be changed for this order' });
    }

    // Customers may switch between mobile wallets (e.g. paid with Nagad instead of bKash)
    const paymentMethod = (rawPaymentMethod ?? order.paymentMethod) as PaymentMethod;
    if (!PAYMENT_METHODS.includes(paymentMethod) || !isMobilePayment(paymentMethod)) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    if (paymentMethod !== order.paymentMethod && !(await isPaymentMethodEnabled(paymentMethod))) {
      return res.status(400).json({ error: 'This payment method is currently unavailable' });
    }

    const result = validateMobilePaymentDetails(paymentSender, paymentTrxId);
    if ('error' in result) {
      return res.status(400).json({ error: result.error });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        paymentMethod,
        paymentStatus: 'PENDING_VERIFICATION',
        paymentSender: result.sender,
        paymentTrxId: result.trxId,
      },
      include: ORDER_DETAIL_INCLUDE,
    });

    res.json(updatedOrder);
  } catch (error) {
    if (isDuplicateTrxIdError(error)) {
      return res.status(409).json({ error: 'This Transaction ID has already been used for another order' });
    }
    console.error('Resubmit order payment error:', error);
    res.status(500).json({ error: 'Failed to update payment details' });
  }
};

// Update payment status (Admin only) - verify / reject a mobile payment, mark COD paid, or refund
export const updateOrderPaymentStatus = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body as { paymentStatus?: PaymentStatus };

    if (!id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    if (!paymentStatus || !PAYMENT_STATUSES.includes(paymentStatus)) {
      return res.status(400).json({
        error: 'Invalid payment status. Must be one of: ' + PAYMENT_STATUSES.join(', '),
      });
    }

    const order = await prisma.order.findUnique({ where: { id } });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (paymentStatus === 'PENDING_VERIFICATION' && !isMobilePayment(order.paymentMethod)) {
      return res.status(400).json({ error: 'Cash on delivery orders have no payment to verify' });
    }

    if (paymentStatus === 'REFUNDED' && order.paymentStatus !== 'PAID') {
      return res.status(400).json({ error: 'Only paid orders can be refunded' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        paymentStatus,
        paidAt: paymentStatus === 'PAID' ? order.paidAt ?? new Date() : paymentStatus === 'REFUNDED' ? order.paidAt : null,
      },
      include: ORDER_DETAIL_INCLUDE,
    });

    res.json({
      message: 'Payment status updated successfully',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
};
