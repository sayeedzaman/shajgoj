'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, Search, Filter, ChevronDown, Eye, Package, Truck, Pencil, Check, X, Wallet, AlertCircle } from 'lucide-react';
import { adminAPI, type Order } from '@/src/lib/adminApi';
import OrderTracker from '@/src/components/orders/OrderTracker';
import OrderItemPrice from '@/src/components/orders/OrderItemPrice';
import { ORDER_STATUSES, ORDER_STATUS_INFO } from '@/src/lib/orderStatus';
import { PaymentMethodBadge, PaymentStatusBadge } from '@/src/components/payments/PaymentBadges';
import { PAYMENT_METHOD_INFO, PAYMENT_STATUS_INFO, isMobilePayment, type PaymentStatus } from '@/src/lib/payments';

export default function OrderManagementPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Delivery charge settings (Dhaka / Outside Dhaka)
  const [shippingFees, setShippingFees] = useState({ dhakaShippingFee: 60, outsideDhakaShippingFee: 120 });
  const [shippingFeesLoading, setShippingFeesLoading] = useState(true);
  const [shippingFeesSaving, setShippingFeesSaving] = useState(false);

  // Per-order shipping override
  const [editingShipping, setEditingShipping] = useState(false);
  const [shippingInput, setShippingInput] = useState('');
  const [shippingSaving, setShippingSaving] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [currentPage, searchQuery, statusFilter, paymentStatusFilter]);

  useEffect(() => {
    fetchShippingFees();
  }, []);

  const fetchShippingFees = async () => {
    try {
      setShippingFeesLoading(true);
      const settings = await adminAPI.settings.get();
      setShippingFees({
        dhakaShippingFee: settings.dhakaShippingFee,
        outsideDhakaShippingFee: settings.outsideDhakaShippingFee,
      });
    } catch (error) {
      console.error('Failed to fetch shipping settings:', error);
    } finally {
      setShippingFeesLoading(false);
    }
  };

  const handleShippingFeesSave = async () => {
    try {
      setShippingFeesSaving(true);
      await adminAPI.settings.update(shippingFees);
      showSuccess('Delivery charges updated successfully');
    } catch (error) {
      console.error('Failed to update shipping settings:', error);
      showError('Failed to update delivery charges');
    } finally {
      setShippingFeesSaving(false);
    }
  };

  const startEditingShipping = (order: Order) => {
    setShippingInput(String(order.shippingCost));
    setEditingShipping(true);
  };

  const cancelEditingShipping = () => {
    setEditingShipping(false);
    setShippingInput('');
  };

  const handleShippingCostUpdate = async (orderId: string) => {
    const value = Number(shippingInput);
    if (Number.isNaN(value) || value < 0) {
      showError('Please enter a valid shipping cost');
      return;
    }

    try {
      setShippingSaving(true);
      const response = await adminAPI.orders.updateShipping(orderId, value);
      showSuccess('Shipping cost updated successfully');

      setOrders(orders.map(order => (order.id === orderId ? response.order : order)));
      setSelectedOrder(response.order);
      setEditingShipping(false);
    } catch (error: unknown) {
      console.error('Shipping cost update error:', error);
      showError(error instanceof Error ? error.message : 'Failed to update shipping cost');
    } finally {
      setShippingSaving(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.orders.getAll({
        page: currentPage,
        limit: 10,
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        paymentStatus: paymentStatusFilter || undefined,
      });
      setOrders(response.orders);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      showError('Failed to fetch orders');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 3000);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    try {
      setUpdatingOrderId(orderId);
      const response = await adminAPI.orders.updateStatus(orderId, newStatus);
      showSuccess('Order status updated successfully');

      // Update the order in the list with the response
      setOrders(orders.map(order =>
        order.id === orderId ? response.order : order
      ));

      // Update selected order if it's open in modal
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(response.order);
      }
    } catch (error: unknown) {
      console.error('Status update error:', error);
      if (error instanceof Error) {
        showError(error.message);
      } else {
        showError('Failed to update order status');
      }
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handlePaymentStatusUpdate = async (order: Order, paymentStatus: PaymentStatus) => {
    const confirmations: Partial<Record<PaymentStatus, string>> = {
      FAILED: `Reject this payment? The customer will be asked to resubmit their ${PAYMENT_METHOD_INFO[order.paymentMethod].label} Transaction ID.`,
      REFUNDED: `Mark ৳${order.total.toFixed(2)} as refunded to the customer?`,
    };
    const message = confirmations[paymentStatus];
    if (message && !confirm(message)) return;

    try {
      setUpdatingPaymentId(order.id);
      const response = await adminAPI.orders.updatePaymentStatus(order.id, paymentStatus);
      showSuccess(`Payment marked as ${PAYMENT_STATUS_INFO[paymentStatus].label.toLowerCase()}`);
      setOrders(orders.map(o => (o.id === order.id ? response.order : o)));
      if (selectedOrder?.id === order.id) {
        setSelectedOrder(response.order);
      }
    } catch (error: unknown) {
      console.error('Payment status update error:', error);
      showError(error instanceof Error ? error.message : 'Failed to update payment status');
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowModal(true);
    setEditingShipping(false);
  };

  const getStatusBadge = (status: Order['status']) => (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${ORDER_STATUS_INFO[status].badge}`}>
      {ORDER_STATUS_INFO[status].label}
    </span>
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <ShoppingBag className="w-8 h-8 text-pink-600" />
          Order Management
        </h1>
        <p className="text-gray-600 mt-2">Manage customer orders and fulfillment</p>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-pink-50 border border-pink-200 text-pink-800 px-4 py-3 rounded-lg">
          {errorMessage}
        </div>
      )}

      {/* Delivery Charges */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Truck className="w-5 h-5 text-pink-600" />
          <h2 className="text-lg font-semibold text-gray-900">Delivery Charges</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dhaka (৳)</label>
            <input
              type="number"
              min={0}
              value={shippingFees.dhakaShippingFee}
              onChange={(e) => setShippingFees({ ...shippingFees, dhakaShippingFee: Number(e.target.value) })}
              disabled={shippingFeesLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Outside Dhaka (৳)</label>
            <input
              type="number"
              min={0}
              value={shippingFees.outsideDhakaShippingFee}
              onChange={(e) => setShippingFees({ ...shippingFees, outsideDhakaShippingFee: Number(e.target.value) })}
              disabled={shippingFeesLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50"
            />
          </div>
          <button
            onClick={handleShippingFeesSave}
            disabled={shippingFeesLoading || shippingFeesSaving}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {shippingFeesSaving ? 'Saving...' : 'Save Charges'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Applied automatically to new orders based on the delivery city. Existing orders keep their original shipping cost unless edited individually below.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order number or customer..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 appearance-none bg-white"
              aria-label='status'
            >
              <option value="">All Status</option>
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>{ORDER_STATUS_INFO[status].label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Payment Status Filter */}
          <div className="relative">
            <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={paymentStatusFilter}
              onChange={(e) => {
                setPaymentStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 appearance-none bg-white"
              aria-label="payment status"
            >
              <option value="">All Payments</option>
              {(Object.keys(PAYMENT_STATUS_INFO) as PaymentStatus[]).map((status) => (
                <option key={status} value={status}>{PAYMENT_STATUS_INFO[status].label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
            <p className="text-gray-600 mt-4">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No orders found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {order.User.firstName} {order.User.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{order.User.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(order.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-pink-600">৳{order.total.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1">
                          <PaymentMethodBadge method={order.paymentMethod} />
                          <PaymentStatusBadge status={order.paymentStatus} />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => viewOrderDetails(order)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          {order.status === 'PENDING' && (
                            <button
                              onClick={() => handleStatusUpdate(order.id, 'CONFIRMED')}
                              disabled={updatingOrderId === order.id}
                              className="px-2.5 py-1 rounded text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                              title="Confirm this order"
                            >
                              Confirm
                            </button>
                          )}
                          <div className="relative flex items-center gap-1">
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusUpdate(order.id, e.target.value as Order['status'])}
                              disabled={updatingOrderId === order.id}
                              className="text-xs border border-gray-300 rounded px-2 py-1 pr-6 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {ORDER_STATUSES.map((status) => (
                                <option key={status} value={status}>{ORDER_STATUS_INFO[status].label}</option>
                              ))}
                            </select>
                            {updatingOrderId === order.id && (
                              <div className="w-4 h-4 border-2 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 z-10">
              <h2 className="text-2xl font-bold text-gray-900">
                Order Details - {selectedOrder.orderNumber}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Customer Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Customer Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {selectedOrder.User.firstName} {selectedOrder.User.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium text-gray-900">{selectedOrder.User.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <span className="ml-2 font-medium text-gray-900">{selectedOrder.User.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Shipping Address</h3>
                <div className="space-y-1 text-sm text-gray-900">
                  <p className="font-medium">{selectedOrder.Address.fullName}</p>
                  <p>{selectedOrder.Address.phone}</p>
                  <p>{selectedOrder.Address.address}</p>
                  <p>{selectedOrder.Address.city}, {selectedOrder.Address.state} {selectedOrder.Address.zipCode}</p>
                </div>
              </div>

              {/* Order Status & Dates */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Status</h3>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Order Date</h3>
                  <p className="text-sm text-gray-900">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Last Updated</h3>
                  <p className="text-sm text-gray-900">{formatDate(selectedOrder.updatedAt)}</p>
                </div>
              </div>

              {/* Payment */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Payment</h3>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <PaymentMethodBadge method={selectedOrder.paymentMethod} />
                  <PaymentStatusBadge status={selectedOrder.paymentStatus} />
                  {selectedOrder.paidAt && (
                    <span className="text-xs text-gray-500">Paid {formatDate(selectedOrder.paidAt)}</span>
                  )}
                </div>

                {isMobilePayment(selectedOrder.paymentMethod) && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mb-3">
                    <div>
                      <span className="text-gray-600 block">Sent from</span>
                      <span className="font-medium text-gray-900">{selectedOrder.paymentSender || '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 block">Transaction ID</span>
                      <span className="font-mono font-medium text-gray-900 select-all">{selectedOrder.paymentTrxId || '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 block">Amount due</span>
                      <span className="font-medium text-gray-900">৳{selectedOrder.total.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {selectedOrder.paymentStatus === 'PENDING_VERIFICATION' && (
                  <p className="text-xs text-yellow-800 bg-yellow-50 border border-yellow-200 rounded p-2 mb-3">
                    Check your {PAYMENT_METHOD_INFO[selectedOrder.paymentMethod].label} account for a payment of ৳{selectedOrder.total.toFixed(2)} from {selectedOrder.paymentSender} with this TrxID before processing the order.
                  </p>
                )}
                {selectedOrder.status === 'CANCELLED' && selectedOrder.paymentStatus === 'PAID' && (
                  <p className="text-xs text-pink-800 bg-pink-50 border border-pink-200 rounded p-2 mb-3 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    This order was cancelled after payment. Refund the customer and mark it refunded.
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  {(selectedOrder.paymentStatus === 'PENDING_VERIFICATION' || selectedOrder.paymentStatus === 'FAILED'
                    || (selectedOrder.paymentMethod === 'COD' && selectedOrder.paymentStatus === 'UNPAID')) && (
                    <button
                      onClick={() => handlePaymentStatusUpdate(selectedOrder, 'PAID')}
                      disabled={updatingPaymentId === selectedOrder.id}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {isMobilePayment(selectedOrder.paymentMethod) ? 'Verify Payment' : 'Mark Cash Received'}
                    </button>
                  )}
                  {selectedOrder.paymentStatus === 'PENDING_VERIFICATION' && (
                    <button
                      onClick={() => handlePaymentStatusUpdate(selectedOrder, 'FAILED')}
                      disabled={updatingPaymentId === selectedOrder.id}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-pink-300 text-pink-700 hover:bg-pink-50 disabled:opacity-50"
                    >
                      Reject Payment
                    </button>
                  )}
                  {selectedOrder.paymentStatus === 'PAID' && (
                    <button
                      onClick={() => handlePaymentStatusUpdate(selectedOrder, 'REFUNDED')}
                      disabled={updatingPaymentId === selectedOrder.id}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                      Mark Refunded
                    </button>
                  )}
                  {updatingPaymentId === selectedOrder.id && (
                    <div className="w-5 h-5 border-2 border-pink-600 border-t-transparent rounded-full animate-spin self-center"></div>
                  )}
                </div>
              </div>

              {/* Order Tracking Preview (what the customer sees) */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Tracking Preview</h3>
                <div className="overflow-x-auto">
                  <div className="min-w-[420px]">
                    <OrderTracker
                      status={selectedOrder.status}
                      history={selectedOrder.OrderStatusHistory}
                      createdAt={selectedOrder.createdAt}
                    />
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Order Items</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedOrder.OrderItem.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
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
                                <div className="text-sm font-medium text-gray-900">{item.Product.name}</div>
                                <div className="text-xs text-gray-500">{item.Product.slug}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900"><OrderItemPrice item={item} /></td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm font-bold text-pink-600">
                            ৳{(item.price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium text-gray-900">৳{selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedOrder.discountTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-700">Offer discount (included in subtotal):</span>
                      <span className="font-medium text-green-700">−৳{selectedOrder.discountTotal.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Shipping:</span>
                    {editingShipping ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          value={shippingInput}
                          onChange={(e) => setShippingInput(e.target.value)}
                          autoFocus
                          className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-pink-500 text-right"
                        />
                        <button
                          onClick={() => handleShippingCostUpdate(selectedOrder.id)}
                          disabled={shippingSaving}
                          title="Save"
                          className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEditingShipping}
                          disabled={shippingSaving}
                          title="Cancel"
                          className="p-1 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">৳{selectedOrder.shippingCost.toFixed(2)}</span>
                        <button
                          onClick={() => startEditingShipping(selectedOrder)}
                          title="Edit shipping cost"
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-pink-600">৳{selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.status === 'PENDING' && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-indigo-900">This order is waiting for your confirmation</p>
                    <p className="text-xs text-indigo-700">
                      {selectedOrder.paymentStatus === 'PENDING_VERIFICATION'
                        ? 'Verify the mobile payment above before confirming.'
                        : 'Check stock and the delivery details, then confirm.'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleStatusUpdate(selectedOrder.id, 'CONFIRMED')}
                    disabled={updatingOrderId === selectedOrder.id}
                    className="px-5 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap"
                  >
                    Confirm Order
                  </button>
                </div>
              )}

              {/* Update Status */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Update Order Status</h3>
                <div className="flex gap-2 flex-wrap">
                  {ORDER_STATUSES.map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusUpdate(selectedOrder.id, status as Order['status'])}
                      disabled={selectedOrder.status === status || updatingOrderId === selectedOrder.id}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                        selectedOrder.status === status
                          ? 'bg-pink-600 text-white cursor-not-allowed'
                          : updatingOrderId === selectedOrder.id
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }`}
                    >
                      {updatingOrderId === selectedOrder.id && (
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      )}
                      {ORDER_STATUS_INFO[status].label}
                    </button>
                  ))}
                </div>
                {updatingOrderId === selectedOrder.id && (
                  <p className="text-xs text-blue-600 mt-2">Updating status...</p>
                )}
              </div>
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
  );
}
