import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Package, MapPin, CreditCard, Truck, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import api from '../utils/api';
import { formatCurrency } from '../utils/currency';
import { useAuth } from '../context/authContext';

const OrderDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-50 text-amber-800 border-amber-200',
      confirmed: 'bg-sky-50 text-sky-800 border-sky-200',
      processing: 'bg-purple-50 text-purple-800 border-purple-200',
      shipped: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      delivered: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      cancelled: 'bg-rose-50 text-rose-800 border-rose-200',
    };
    return colors[status] || 'bg-linen text-espresso border-border';
  };

  const getStatusSteps = (status) => {
    const steps = [
      { key: 'pending', label: 'Order Placed', icon: Package, completed: ['pending', 'confirmed', 'processing', 'shipped', 'delivered'].includes(status) },
      { key: 'confirmed', label: 'Confirmed', icon: CheckCircle, completed: ['confirmed', 'processing', 'shipped', 'delivered'].includes(status) },
      { key: 'processing', label: 'Processing', icon: Clock, completed: ['processing', 'shipped', 'delivered'].includes(status) },
      { key: 'shipped', label: 'Shipped', icon: Truck, completed: ['shipped', 'delivered'].includes(status) },
      { key: 'delivered', label: 'Delivered', icon: CheckCircle, completed: ['delivered'].includes(status) },
    ];
    return steps;
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get(`/users/me/orders/${id}`);
        setOrder(response.data.data.order);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-6 lg:px-10">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-tan/20 border-t-tan mx-auto"></div>
            <p className="mt-4 text-fog text-sm">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-canvas pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-6 lg:px-10">
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-rose-600" />
            </div>
            <h3
              className="text-espresso text-xl md:text-2xl mb-3"
              style={{
                fontFamily: '"Playfair Display", serif',
                fontWeight: 400,
              }}
            >
              {error || 'Order not found'}
            </h3>
            <Link to="/orders" className="btn-primary text-sm mt-6 inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusSteps = getStatusSteps(order.status);
  const lineSubtotal = order.items.reduce(
    (sum, item) => sum + item.quantity * (item.price ?? 0),
    0
  );
  const shipping = order.shippingCost ?? 0;
  const tax = order.taxAmount ?? 0;

  return (
    <div className="min-h-screen bg-canvas pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="mb-8 md:mb-10">
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 text-fog hover:text-tan text-sm mb-4 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Orders
          </Link>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1
                className="text-espresso leading-tight mb-2"
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                  fontWeight: 400,
                }}
              >
                Order <em style={{ fontStyle: "italic", color: "#8B5E3C" }}>#{order._id.slice(-8).toUpperCase()}</em>
              </h1>
              <p className="text-fog text-sm md:text-base">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <span className={`inline-flex px-4 py-2 text-xs md:text-sm font-semibold rounded-full border ${getStatusColor(order.status)}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Payment Warning */}
        {order.paymentStatus === 'unpaid' && order.status !== 'cancelled' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 md:p-5 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-900 text-sm font-semibold mb-1">Awaiting payment</p>
              <p className="text-amber-800 text-xs md:text-sm">
                Complete payment in Stripe, or this order may be cancelled if the checkout session expires.
              </p>
            </div>
          </div>
        )}

        {/* Tracking Info */}
        {order.tracking?.number && (
          <div className="card mb-6">
            <div className="flex gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-tan/10 border border-tan/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Truck className="w-5 h-5 md:w-6 md:h-6 text-tan" />
              </div>
              <div className="flex-1">
                <h2 className="text-espresso text-base md:text-lg font-semibold mb-1">Shipment Tracking</h2>
                <p className="text-fog text-sm">
                  {order.tracking.carrier && <span className="font-medium">{order.tracking.carrier} · </span>}
                  <span className="font-mono text-xs md:text-sm">{order.tracking.number}</span>
                </p>
                {order.tracking.url && (
                  <a
                    href={order.tracking.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-tan hover:text-sienna text-sm font-medium transition-colors link-underline"
                  >
                    Track shipment
                    <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Status Progress */}
        <div className="card mb-6 md:mb-8">
          <h2 className="text-espresso text-lg md:text-xl font-semibold mb-6" style={{ fontFamily: '"Playfair Display", serif' }}>
            Order Progress
          </h2>
          
          {/* Desktop Progress */}
          <div className="hidden md:flex items-center justify-between">
            {statusSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                      step.completed 
                        ? 'bg-tan text-paper shadow-soft' 
                        : 'bg-linen border border-border text-fog'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`mt-2 text-xs font-medium text-center ${
                      step.completed ? 'text-espresso' : 'text-fog'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  {index < statusSteps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 transition-all duration-300 ${
                      step.completed ? 'bg-tan' : 'bg-border'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile Progress */}
          <div className="md:hidden space-y-3">
            {statusSteps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    step.completed 
                      ? 'bg-tan text-paper' 
                      : 'bg-linen border border-border text-fog'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-sm font-medium ${
                    step.completed ? 'text-espresso' : 'text-fog'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Items - Takes 2 columns on large screens */}
          <div className="lg:col-span-2 card">
            <h2 className="text-espresso text-lg md:text-xl font-semibold mb-5" style={{ fontFamily: '"Playfair Display", serif' }}>
              Order Items
            </h2>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-start gap-3 md:gap-4 pb-4 border-b border-border last:border-b-0 last:pb-0">
                  <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 bg-linen rounded-xl overflow-hidden border border-border">
                    {item.product?.images?.[0] ? (
                      <img
                        src={item.product.images[0].url || item.product.images[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-tan/40">
                        <Package className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/products/${item.product?._id}`}
                      className="text-espresso text-sm md:text-base font-medium hover:text-tan transition-colors link-underline block"
                    >
                      {item.product?.name || 'Product'}
                    </Link>
                    {item.product?.description && (
                      <p className="text-fog text-xs md:text-sm mt-1 line-clamp-2">{item.product.description}</p>
                    )}
                    <p className="text-fog text-xs md:text-sm mt-1">
                      Qty: {item.quantity} × {formatCurrency(item.price, order.currency || user?.preferredCurrency)}
                    </p>
                  </div>
                  <div
                    className="text-espresso text-sm md:text-base font-semibold flex-shrink-0"
                    style={{ fontFamily: '"Playfair Display", serif' }}
                  >
                    {formatCurrency((item.quantity * (item.price ?? 0)), order.currency || user?.preferredCurrency)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar - Order Summary & Details */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="card">
              <h2 className="text-espresso text-lg font-semibold mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>
                Summary
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-fog">Subtotal</span>
                  <span className="text-espresso font-medium">
                    {formatCurrency(order.subtotal ?? lineSubtotal, order.currency || user?.preferredCurrency)}
                  </span>
                </div>
                {shipping > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-fog">Shipping</span>
                    <span className="text-espresso font-medium">
                      {formatCurrency(shipping, order.currency || user?.preferredCurrency)}
                    </span>
                  </div>
                )}
                {tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-fog">Tax</span>
                    <span className="text-espresso font-medium">
                      {formatCurrency(tax, order.currency || user?.preferredCurrency)}
                    </span>
                  </div>
                )}
                <div className="rule pt-3">
                  <div className="flex justify-between">
                    <span className="text-espresso text-base md:text-lg font-semibold">Total</span>
                    <span
                      className="text-sienna text-lg md:text-xl font-semibold"
                      style={{ fontFamily: '"Playfair Display", serif' }}
                    >
                      {formatCurrency(order.totalAmount, order.currency || user?.preferredCurrency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            {(order.shippingDetails || order.shippingAddress) && (
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-tan" />
                  <h3 className="text-espresso text-base font-semibold">Shipping Address</h3>
                </div>
                <div className="text-sm text-fog space-y-1">
                  {(() => {
                    const addr = order.shippingDetails || order.shippingAddress;
                    return (
                      <>
                        <p className="text-espresso font-medium">{addr.fullName}</p>
                        {addr.company && <p>{addr.company}</p>}
                        <p>{addr.address}</p>
                        <p>{addr.city}, {addr.country} {addr.postalCode || ''}</p>
                        {addr.phone && <p className="mt-2">{addr.phone}</p>}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-tan" />
                <h3 className="text-espresso text-base font-semibold">Payment Method</h3>
              </div>
              <p className="text-sm text-fog">
                {order.paymentMethod === 'stripe' ? 'Card (Stripe)' : order.paymentMethod || '—'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;