'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, Package, X, ChevronLeft, Star } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  Product: {
    id: string;
    name: string;
    slug: string;
    images: string[];
    price: number;
    salePrice: number | null;
  };
}

interface ProductReview {
  productId: string;
  rating: number;
  comment: string;
  hasReviewed: boolean;
}

interface Order {
  id: string;
  orderNumber: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  total: number;
  createdAt: string;
  updatedAt: string;
  Address: {
    id: string;
    fullName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  OrderItem: OrderItem[];
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [reviewStates, setReviewStates] = useState<{ [productId: string]: ProductReview }>({});
  const [submittingReview, setSubmittingReview] = useState<string | null>(null);
  const [userReviews, setUserReviews] = useState<{ [productId: string]: boolean }>({});

  useEffect(() => {
    fetchOrders();
    fetchUserReviews();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setErrorMessage('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserReviews = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/reviews/user/my-reviews`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const reviews = await response.json();
        const reviewMap: { [productId: string]: boolean } = {};
        reviews.forEach((review: any) => {
          reviewMap[review.productId] = true;
        });
        setUserReviews(reviewMap);
      }
    } catch (error) {
      console.error('Error fetching user reviews:', error);
    }
  };

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/orders/${orderId}/cancel`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to cancel order');
      }

      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setShowModal(false);
      }
    } catch (error) {
      alert('Failed to cancel order. Please try again.');
    }
  };

  const handleRatingChange = (productId: string, rating: number) => {
    setReviewStates(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        productId,
        rating,
        comment: prev[productId]?.comment || '',
        hasReviewed: false,
      }
    }));
  };

  const handleCommentChange = (productId: string, comment: string) => {
    setReviewStates(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        productId,
        rating: prev[productId]?.rating || 0,
        comment,
        hasReviewed: false,
      }
    }));
  };

  const handleSubmitReview = async (productId: string) => {
    const reviewState = reviewStates[productId];

    if (!reviewState || reviewState.rating === 0) {
      alert('Please select a rating before submitting.');
      return;
    }

    try {
      setSubmittingReview(productId);
      const token = localStorage.getItem('token');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/reviews`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          rating: reviewState.rating,
          comment: reviewState.comment || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit review');
      }

      // Update user reviews to mark this product as reviewed
      setUserReviews(prev => ({ ...prev, [productId]: true }));

      // Clear the review state for this product
      setReviewStates(prev => {
        const newState = { ...prev };
        delete newState[productId];
        return newState;
      });

      alert('Review submitted successfully!');
    } catch (error: any) {
      console.error('Error submitting review:', error);
      alert(error.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(null);
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      PROCESSING: 'bg-blue-100 text-blue-800 border-blue-200',
      SHIPPED: 'bg-purple-100 text-purple-800 border-purple-200',
      DELIVERED: 'bg-green-100 text-green-800 border-green-200',
      CANCELLED: 'bg-red-100 text-red-800 border-red-200',
    };

    return (
      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-medium mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-red-600" />
            My Orders
          </h1>
          <p className="text-gray-600 mt-2">Track and manage your orders</p>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            {errorMessage}
          </div>
        )}

        {/* Orders List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-lg p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              <p className="text-gray-600 mt-4">Loading your orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <ShoppingBag className="w-5 h-5" />
                Browse Products
              </Link>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Order Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-6">
                      <div>
                        <p className="text-xs text-gray-600 uppercase">Order Number</p>
                        <p className="text-sm font-bold text-gray-900">{order.orderNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 uppercase">Date</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(order.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 uppercase">Total</p>
                        <p className="text-sm font-bold text-red-600">৳{order.total.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(order.status)}
                      <button
                        onClick={() => viewOrderDetails(order)}
                        className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="p-6">
                  <div className="flex flex-wrap gap-4">
                    {order.OrderItem.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {item.Product.images && item.Product.images[0] ? (
                            <img
                              src={item.Product.images[0]}
                              alt={item.Product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">
                            {item.Product.name}
                          </p>
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                    {order.OrderItem.length > 3 && (
                      <div className="flex items-center text-sm text-gray-600">
                        +{order.OrderItem.length - 3} more items
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Actions */}
                {order.status === 'PENDING' && (
                  <div className="px-6 pb-4">
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Cancel Order
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Order Details Modal */}
        {showModal && selectedOrder && (
          <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-4xl w-full my-8">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  Order Details
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Order Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Order Number</p>
                    <p className="text-lg font-bold text-gray-900">{selectedOrder.orderNumber}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Order Date</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Status</p>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Shipping Address</h3>
                  <div className="flex flex-col gap-1 text-sm text-gray-900">
                    <p className="font-medium">{selectedOrder.Address.fullName}</p>
                    <p>{selectedOrder.Address.phone}</p>
                    <p>{selectedOrder.Address.address}</p>
                    <p className="flex flex-col sm:flex-row sm:gap-1">
                      <span>{selectedOrder.Address.city},</span>
                      <span>{selectedOrder.Address.state} {selectedOrder.Address.zipCode}</span>
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Order Items</h3>
                  <div className="space-y-4">
                    {selectedOrder.OrderItem.map((item) => {
                      const hasReviewed = userReviews[item.Product.id];
                      const currentReview = reviewStates[item.Product.id];
                      const isSubmitting = submittingReview === item.Product.id;

                      return (
                        <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                          {/* Product Info */}
                          <div className="bg-gray-50 p-4">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                  {item.Product.images && item.Product.images[0] ? (
                                    <img
                                      src={item.Product.images[0]}
                                      alt={item.Product.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Package className="w-6 h-6 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <Link
                                    href={`/products/${item.Product.slug}`}
                                    className="text-sm font-medium text-gray-900 hover:text-red-600 block"
                                  >
                                    {item.Product.name}
                                  </Link>
                                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                                    <span>Price: ৳{item.price.toFixed(2)}</span>
                                    <span>Qty: {item.quantity}</span>
                                    <span className="font-bold text-red-600">Total: ৳{(item.price * item.quantity).toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Review Section - Only show for DELIVERED orders */}
                          {selectedOrder.status === 'DELIVERED' && (
                            <div className="p-4 bg-white border-t border-gray-200">
                              {hasReviewed ? (
                                <div className="flex items-center gap-2 text-green-600 text-sm">
                                  <Star className="w-4 h-4 fill-current" />
                                  <span>You have already reviewed this product</span>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <h4 className="text-sm font-semibold text-gray-700">Rate this product</h4>

                                  {/* Star Rating */}
                                  <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        key={star}
                                        type="button"
                                        onClick={() => handleRatingChange(item.Product.id, star)}
                                        className="focus:outline-none"
                                        disabled={isSubmitting}
                                      >
                                        <Star
                                          className={`w-6 h-6 transition-colors ${
                                            star <= (currentReview?.rating || 0)
                                              ? 'fill-yellow-400 text-yellow-400'
                                              : 'text-gray-300'
                                          }`}
                                        />
                                      </button>
                                    ))}
                                    {currentReview?.rating > 0 && (
                                      <span className="ml-2 text-sm text-gray-600">
                                        {currentReview.rating} star{currentReview.rating > 1 ? 's' : ''}
                                      </span>
                                    )}
                                  </div>

                                  {/* Comment */}
                                  <div>
                                    <textarea
                                      value={currentReview?.comment || ''}
                                      onChange={(e) => handleCommentChange(item.Product.id, e.target.value)}
                                      placeholder="Write your review (optional)..."
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-sm"
                                      rows={3}
                                      disabled={isSubmitting}
                                    />
                                  </div>

                                  {/* Submit Button */}
                                  <button
                                    onClick={() => handleSubmitReview(item.Product.id)}
                                    disabled={!currentReview?.rating || isSubmitting}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                                  >
                                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-red-600">৳{selectedOrder.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Cancel Order */}
                {selectedOrder.status === 'PENDING' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700 mb-3">
                      You can cancel this order while it&apos;s still pending.
                    </p>
                    <button
                      onClick={() => handleCancelOrder(selectedOrder.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      Cancel Order
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
