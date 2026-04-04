import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/authContext";
import { ShoppingCart, X, Minus, Plus } from "lucide-react";
import toast from "react-hot-toast";

export default function CartPage() {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], totalAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [updateBusy, setUpdateBusy] = useState(false);
  const [shipping, setShipping] = useState({
    fullName: user?.username || "",
    address: "",
    city: "",
    country: "",
    phone: "",
    postalCode: "",
  });
  const [shippingProfiles, setShippingProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [notes, setNotes] = useState("");

  const fetchCart = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/cart');
      setCart({ items: data.data.items, totalAmount: data.data.totalAmount });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not fetch cart.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/users/me');
      const userData = data.data.user;
      setShippingProfiles(userData.shippingProfiles || []);
      if (userData.shippingProfiles && userData.shippingProfiles.length > 0) {
        const defaultProfile = userData.shippingProfiles.find((p) => p.isDefault) || userData.shippingProfiles[0];
        setSelectedProfileId(defaultProfile._id);
        setShipping({
          fullName: defaultProfile.fullName,
          company: defaultProfile.company,
          address: defaultProfile.address,
          city: defaultProfile.city,
          country: defaultProfile.country,
          phone: defaultProfile.phone,
          postalCode: defaultProfile.postalCode,
        });
      }
    } catch (err) {
      // ignore non-critical
    }
  };

  useEffect(() => {
    fetchCart();
    fetchProfile();
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'cancelled') {
      toast(
        'Payment cancelled. If you had started checkout, your cart was cleared—check My Orders for any unpaid order.',
        { duration: 6000 }
      );
    }
  }, []);

  const changeQuantity = async (productId, newQuantity) => {
    try {
      setUpdateBusy(true);
      await api.patch(`/cart/item/${productId}`, { quantity: newQuantity });
      toast.success('Cart updated');
      await fetchCart();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update cart item');
    } finally {
      setUpdateBusy(false);
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart');
      toast.success('Cart cleared');
      window.dispatchEvent(new Event('cartUpdated'));
      await fetchCart();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clear cart');
    }
  };

  const removeItem = async (productId) => {
    try {
      await api.delete(`/cart/item/${productId}`);
      toast.success('Item removed');
      window.dispatchEvent(new Event('cartUpdated'));
      await fetchCart();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove item');
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    try {
      setCheckoutBusy(true);
      const { data } = await api.post('/cart/checkout-session', {
        shippingDetails: shipping,
        shippingProfileId: selectedProfileId || undefined,
        notes,
      });
      const url = data.data?.url;
      if (url) {
        window.location.href = url;
        return;
      }
      toast.error('No payment URL returned.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout failed');
    } finally {
      setCheckoutBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas pt-24 pb-16 flex items-center justify-center">
        <div className="text-fog">Loading cart...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-espresso pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-6 lg:px-10"> 
        <div className="mb-6 flex items-center gap-3 text-lg font-semibold">
          <ShoppingCart className="w-5 h-5" />
          My Cart
        </div>

        {cart.items.length === 0 ? (
          <div className="card-linen border border-border rounded-2xl p-10 text-center">
            <p className="text-fog mb-4">Your cart is empty.</p>
            <Link to="/products" className="btn-primary px-6 py-2.5 text-sm">Continue Shopping</Link>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {cart.items.map((item) => {
                const itemProduct = item.product || {};
                return (
                  <div key={item.product?._id || item.product} className="bg-paper border border-border rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-3 md:gap-4 flex-1">
                      <div className="w-16 h-16 rounded-xl bg-linen/70 flex items-center justify-center overflow-hidden border border-border">
                        {itemProduct.images?.length > 0 ? (
                          <img src={itemProduct.images[0].url} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-fog text-xs">No image</span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-espresso">{item.productName}</h3>
                        <p className="text-xs text-fog mt-1">${item.pricePerUnit.toFixed(2)} / unit</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2"> 
                      <button
                        disabled={updateBusy || item.quantity <= (itemProduct.moq || 1)}
                        onClick={() => changeQuantity(item.product?._id || item.product, Math.max(item.quantity - 1, itemProduct.moq || 1))}
                        className="w-8 h-8 border border-border rounded-full flex items-center justify-center text-fog hover:border-espresso"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        min={itemProduct.moq || 1}
                        value={item.quantity}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          if (!Number.isNaN(value) && value >= (itemProduct.moq || 1)) {
                            changeQuantity(item.product?._id || item.product, value);
                          }
                        }}
                        className="w-16 border border-border rounded-lg text-center py-1"
                      />
                      <button
                        disabled={updateBusy}
                        onClick={() => changeQuantity(item.product?._id || item.product, item.quantity + 1)}
                        className="w-8 h-8 border border-border rounded-full flex items-center justify-center text-fog hover:border-espresso"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 text-sm md:ml-8">
                      <span className="font-semibold">${(item.quantity * item.pricePerUnit).toFixed(2)}</span>
                      <button
                        onClick={() => removeItem(item.product?._id || item.product)}
                        className="text-rust hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <button
                onClick={clearCart}
                className="btn-outline px-5 py-2.5 text-sm"
              >
                Clear Cart
              </button>
              <div className="text-right">
                <p className="text-fog text-sm">Total</p>
                <p className="text-2xl font-semibold text-espresso">${cart.totalAmount.toFixed(2)}</p>
              </div>
            </div>

            <form onSubmit={handleCheckout} className="mt-8 bg-paper border border-border p-5 rounded-2xl space-y-4">
              <h3 className="text-lg font-semibold">Shipping Information</h3>

              {shippingProfiles.length > 0 && (
                <div>
                  <label className="text-xs text-fog uppercase tracking-wide">Saved Shipping Profile</label>
                  <select
                    value={selectedProfileId}
                    onChange={(e) => {
                      const selected = shippingProfiles.find((p) => p._id === e.target.value);
                      if (selected) {
                        setSelectedProfileId(selected._id);
                        setShipping({
                          fullName: selected.fullName,
                          company: selected.company,
                          address: selected.address,
                          city: selected.city,
                          country: selected.country,
                          phone: selected.phone,
                          postalCode: selected.postalCode,
                        });
                      }
                    }}
                    className="field"
                  >
                    {shippingProfiles.map((profile) => (
                      <option key={profile._id} value={profile._id}>{profile.name || profile.fullName}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={shipping.fullName}
                  onChange={(e) => setShipping((prev) => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Full name"
                  required
                  className="field"
                />
                <input
                  type="text"
                  value={shipping.phone}
                  onChange={(e) => setShipping((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="Phone"
                  required
                  className="field"
                />
                <input
                  type="text"
                  value={shipping.address}
                  onChange={(e) => setShipping((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="Address"
                  required
                  className="field md:col-span-2"
                />
                <input
                  type="text"
                  value={shipping.city}
                  onChange={(e) => setShipping((prev) => ({ ...prev, city: e.target.value }))}
                  placeholder="City"
                  required
                  className="field"
                />
                <input
                  type="text"
                  value={shipping.country}
                  onChange={(e) => setShipping((prev) => ({ ...prev, country: e.target.value }))}
                  placeholder="Country"
                  required
                  className="field"
                />
                <input
                  type="text"
                  value={shipping.postalCode}
                  onChange={(e) => setShipping((prev) => ({ ...prev, postalCode: e.target.value }))}
                  placeholder="Postal Code"
                  className="field"
                />
              </div>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Order notes (optional)"
                className="field h-24"
              />

              <button
                type="submit"
                disabled={checkoutBusy}
                className="btn-primary w-full py-3"
              >
                {checkoutBusy ? 'Redirecting to secure payment…' : `Pay with card ($${cart.totalAmount.toFixed(2)})`}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
