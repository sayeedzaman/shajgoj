'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/src/lib/CartContext';
import { useAuth } from '@/src/lib/AuthContext';
import { addressesAPI, ordersAPI, settingsAPI } from '@/src/lib/api';
import { Address, CreateAddressRequest } from '@/src/types/index';
import MobilePaymentPanel from '@/src/components/payments/MobilePaymentPanel';
import {
  DEFAULT_SHIPPING_SETTINGS,
  freeShippingHint,
  qualifiesForFreeShipping,
  type ShippingSettings,
} from '@/src/lib/shipping';
import PaymentMethodOption from '@/src/components/payments/PaymentMethodOption';
import {
  DEFAULT_PAYMENT_NUMBER,
  MOBILE_PAYMENT_METHODS,
  PAYMENT_METHOD_INFO,
  PAYMENT_SETTING_FIELD,
  isMobilePayment,
  isValidBdMobile,
  isValidTrxId,
  type PaymentMethod,
  type PaymentSettings,
} from '@/src/lib/payments';
import {
  MapPin,
  Plus,
  CreditCard,
  Truck,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  ShoppingBag,
  Loader2,
  Smartphone,
  X,
} from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, isLoading: cartLoading, refreshCart, clearCart } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [paymentSender, setPaymentSender] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [paymentTrxId, setPaymentTrxId] = useState('');
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>(DEFAULT_SHIPPING_SETTINGS);

  // Address form state
  const [addressForm, setAddressForm] = useState<CreateAddressRequest>({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    isDefault: false,
  });

  const cartItems = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Calculate shipping based on selected address city and order amount/quantity
  const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
  const isDhaka = selectedAddress?.city.toLowerCase().includes('dhaka');
  const baseShipping = isDhaka ? shippingSettings.dhakaShippingFee : shippingSettings.outsideDhakaShippingFee;
  const isFreeShipping = qualifiesForFreeShipping(subtotal, totalQuantity, shippingSettings);
  const shipping = isFreeShipping ? 0 : baseShipping;
  const shippingHint = freeShippingHint(subtotal, totalQuantity, shippingSettings);
  const total = subtotal + shipping;

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/checkout');
      return;
    }

    fetchAddresses();
  }, [user]);

  useEffect(() => {
    settingsAPI.getShipping()
      .then((settings) => setShippingSettings(settings))
      .catch((error) => console.error('Error fetching shipping fees:', error));

    settingsAPI.getPayment()
      .then((settings) => setPaymentSettings(settings))
      .catch((error) => console.error('Error fetching payment settings:', error));
  }, []);

  // Before settings load, only COD is shown; afterwards follow the admin's toggles
  const isMethodEnabled = (method: PaymentMethod) =>
    paymentSettings ? paymentSettings[PAYMENT_SETTING_FIELD[method]] : method === 'COD';
  const enabledMobileMethods = MOBILE_PAYMENT_METHODS.filter(isMethodEnabled);
  const noPaymentMethods = !!paymentSettings && !isMethodEnabled('COD') && enabledMobileMethods.length === 0;
  const paymentNumber = paymentSettings?.mobilePaymentNumber || DEFAULT_PAYMENT_NUMBER;

  // If the selected method gets disabled (e.g. COD turned off), switch to an available one
  useEffect(() => {
    if (!paymentSettings || isMethodEnabled(paymentMethod)) return;
    const fallback = (['COD', ...MOBILE_PAYMENT_METHODS] as PaymentMethod[]).find(isMethodEnabled);
    if (fallback) setPaymentMethod(fallback);
  }, [paymentSettings]);

  useEffect(() => {
    if (cartItems.length === 0 && !cartLoading) {
      router.push('/cart');
    }
  }, [cartItems, cartLoading]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const data = await addressesAPI.getAll();
      setAddresses(data);

      const defaultAddress = data.find(addr => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      } else if (data.length > 0) {
        setSelectedAddressId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setError('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const newAddress = await addressesAPI.create(addressForm);
      setAddresses([...addresses, newAddress]);
      setSelectedAddressId(newAddress.id);
      setShowAddressForm(false);
      setAddressForm({
        fullName: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        isDefault: false,
      });
    } catch (error: any) {
      setError(error.message || 'Failed to add address');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setError('Please select a delivery address');
      return;
    }

    if (cartItems.length === 0) {
      setError('Your cart is empty');
      return;
    }

    if (!isMethodEnabled(paymentMethod)) {
      setError('Please choose a payment method');
      return;
    }

    if (isMobilePayment(paymentMethod)) {
      const label = PAYMENT_METHOD_INFO[paymentMethod].label;
      if (!isValidBdMobile(paymentSender)) {
        setError(`Please enter the ${label} number you sent the money from (e.g. 01XXXXXXXXX)`);
        return;
      }
      if (!isValidTrxId(paymentTrxId)) {
        setError(`Please enter the ${label} Transaction ID (TrxID) from your confirmation SMS`);
        return;
      }
    }

    // Details are valid: ask the shopper to review and confirm before the order is created
    setError(null);
    setShowConfirm(true);
  };

  const submitOrder = async () => {
    try {
      setPlacingOrder(true);
      setError(null);

      const orderData = {
        addressId: selectedAddressId,
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        paymentMethod,
        ...(isMobilePayment(paymentMethod) && {
          paymentSender: paymentSender.trim(),
          paymentTrxId: paymentTrxId.trim().toUpperCase(),
        }),
      };

      const order = await ordersAPI.create(orderData);

      // Clear cart immediately for instant UI feedback
      clearCart();

      // Refresh cart to sync with backend state
      await refreshCart();

      // Redirect to order success page
      router.push(`/orders/${order.id}?success=true`);
    } catch (error: any) {
      setError(error.message || 'Failed to place order');
      setPlacingOrder(false);
      setShowConfirm(false);
    }
  };

  if (loading || cartLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (cartItems.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-pink-600">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/cart" className="hover:text-pink-600">Cart</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">Checkout</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your order</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-pink-50 border border-pink-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-pink-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-pink-900">Error</h3>
              <p className="text-sm text-pink-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-pink-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Delivery Address</h2>
                </div>
                {!showAddressForm && (
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="flex items-center gap-2 text-pink-600 hover:text-pink-700 font-medium text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add New
                  </button>
                )}
              </div>

              {/* Add Address Form */}
              {showAddressForm && (
                <form onSubmit={handleAddressSubmit} className="mb-6 space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={addressForm.fullName}
                        onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={addressForm.address}
                      onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State/Division *
                      </label>
                      <input
                        type="text"
                        required
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Zip Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={addressForm.zipCode}
                        onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={addressForm.isDefault}
                      onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                      className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500"
                    />
                    <label htmlFor="isDefault" className="text-sm text-gray-700">
                      Set as default address
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 transition-colors disabled:opacity-50"
                    >
                      Save Address
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Address List */}
              {addresses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No saved addresses. Add one to continue.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedAddressId === address.id
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="address"
                          value={address.id}
                          checked={selectedAddressId === address.id}
                          onChange={(e) => setSelectedAddressId(e.target.value)}
                          className="mt-1 w-4 h-4 text-pink-600 focus:ring-pink-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">{address.fullName}</span>
                            {address.isDefault && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{address.phone}</p>
                          <p className="text-sm text-gray-600">
                            {address.address}, {address.city}, {address.state} - {address.zipCode}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Method Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-pink-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Payment Method</h2>
              </div>

              {noPaymentMethods && (
                <p className="text-sm text-pink-700 bg-pink-50 border border-pink-200 rounded-lg p-3 mb-3">
                  Online ordering is temporarily unavailable. Please contact us to place your order.
                </p>
              )}

              <div className="space-y-3">
                {isMethodEnabled('COD') && (
                  <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentMethod === 'COD'
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="COD"
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                      className="mt-1 w-4 h-4 text-pink-600 focus:ring-pink-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Truck className="w-5 h-5 text-gray-600" />
                        <span className="font-semibold text-gray-900">Cash on Delivery</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Pay with cash when your order is delivered
                      </p>
                    </div>
                  </label>
                )}

                {enabledMobileMethods.length > 0 && (
                  <div className={`p-4 border-2 rounded-lg transition-all ${
                    isMobilePayment(paymentMethod) ? 'border-pink-500 bg-pink-50/40' : 'border-gray-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Smartphone className="w-5 h-5 text-gray-600" />
                      <span className="font-semibold text-gray-900">Mobile Banking</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Pay now with {enabledMobileMethods.map((m) => PAYMENT_METHOD_INFO[m].label).join(', ')}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {enabledMobileMethods.map((method) => (
                        <PaymentMethodOption
                          key={method}
                          method={method}
                          selected={paymentMethod === method}
                          onSelect={() => setPaymentMethod(method)}
                        />
                      ))}
                    </div>

                    {isMobilePayment(paymentMethod) && (
                      <MobilePaymentPanel
                        method={paymentMethod}
                        amount={total}
                        paymentNumber={paymentNumber}
                        sender={paymentSender}
                        trxId={paymentTrxId}
                        onSenderChange={setPaymentSender}
                        onTrxIdChange={setPaymentTrxId}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

              {/* Cart Items */}
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.product.imageUrl || item.product.images?.[0] ? (
                        <img
                          src={item.product.imageUrl || item.product.images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                        {item.product.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Qty: {item.quantity} × ৳{(item.product.salePrice || item.product.price).toFixed(0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between text-base">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">৳{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-gray-900">
                    {shipping === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      <>
                        ৳{shipping.toFixed(2)}
                        {selectedAddress && (
                          <span className="text-xs text-gray-500 ml-2">
                            ({isDhaka ? 'Dhaka' : 'Outside Dhaka'})
                          </span>
                        )}
                      </>
                    )}
                  </span>
                </div>
                {shippingHint && (
                  <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">{shippingHint}</p>
                )}
                <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-200">
                  <span className="text-gray-900">Total</span>
                  <span className="text-pink-600">৳{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={placingOrder || !selectedAddressId || cartItems.length === 0 || noPaymentMethods}
                className="w-full py-3 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {placingOrder ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Place Order
                  </>
                )}
              </button>

              {/* Security Notice */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Secure checkout</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>7-day easy returns</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>100% authentic products</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order confirmation popup */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-order-title"
          onClick={() => !placingOrder && setShowConfirm(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 id="confirm-order-title" className="text-xl font-bold text-gray-900">Confirm your order</h2>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={placingOrder}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="space-y-2">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between gap-3 text-sm">
                    <span className="text-gray-700 line-clamp-1">{item.product.name} × {item.quantity}</span>
                    <span className="font-medium text-gray-900 whitespace-nowrap">
                      ৳{((item.product.salePrice || item.product.price) * item.quantity).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">৳{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-900">{shipping === 0 ? 'FREE' : `৳${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-1">
                  <span className="text-gray-900">Total</span>
                  <span className="text-pink-600">৳{total.toFixed(2)}</span>
                </div>
              </div>

              {selectedAddress && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <p className="text-gray-500 mb-1">Deliver to</p>
                  <p className="font-medium text-gray-900">{selectedAddress.fullName} · {selectedAddress.phone}</p>
                  <p className="text-gray-700">
                    {selectedAddress.address}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.zipCode}
                  </p>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="text-gray-500 mb-1">Payment</p>
                <p className="font-medium text-gray-900">{PAYMENT_METHOD_INFO[paymentMethod].label}</p>
                {isMobilePayment(paymentMethod) && (
                  <p className="text-gray-700">
                    From {paymentSender.trim()} · TrxID <span className="font-mono">{paymentTrxId.trim().toUpperCase()}</span>
                  </p>
                )}
              </div>

              <p className="text-xs text-gray-500">
                After you confirm, your order will be <span className="font-semibold">Placed</span>. We&apos;ll confirm it shortly and keep you updated.
              </p>
            </div>

            <div className="flex gap-3 p-5 border-t border-gray-200">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={placingOrder}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Go Back
              </button>
              <button
                onClick={submitOrder}
                disabled={placingOrder}
                className="flex-1 py-3 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {placingOrder ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Placing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Confirm Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
