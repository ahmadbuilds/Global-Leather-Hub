import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/authContext";
import { ShoppingCart, X, Minus, Plus } from "lucide-react";
import { formatCurrency } from "../utils/currency";
import toast from "react-hot-toast";

export default function CartPage() {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], totalAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [updateBusy, setUpdateBusy] = useState(null);
  const [quantityDrafts, setQuantityDrafts] = useState({});
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
      const { data } = await api.get("/cart");
      setCart({ items: data.data.items, totalAmount: data.data.totalAmount });
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not fetch cart.");
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data } = await api.get("/users/me");
      const userData = data.data.user;
      setShippingProfiles(userData.shippingProfiles || []);
      if (userData.shippingProfiles && userData.shippingProfiles.length > 0) {
        const defaultProfile =
          userData.shippingProfiles.find((p) => p.isDefault) ||
          userData.shippingProfiles[0];
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
    if (params.get("checkout") === "cancelled") {
      toast(
        "Payment cancelled. If you had started checkout, your cart was cleared—check My Orders for any unpaid order.",
        { duration: 6000 },
      );
    }
  }, []);

  useEffect(() => {
    setQuantityDrafts((prev) => {
      const next = {};
      cart.items.forEach((item) => {
        const productId = item.product?._id || item.product;
        if (!productId) return;
        const current = prev[productId];
        next[productId] = current ?? String(item.quantity);
      });
      return next;
    });
  }, [cart.items]);

  const changeQuantity = async (productId, newQuantity) => {
    try {
      setUpdateBusy(productId);
      const { data } = await api.patch(`/cart/item/${productId}`, {
        quantity: newQuantity,
      });
      setCart({ items: data.data.items, totalAmount: data.data.totalAmount });
      setQuantityDrafts((prev) => ({
        ...prev,
        [productId]: String(newQuantity),
      }));
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      const existingItem = cart.items.find(
        (entry) => (entry.product?._id || entry.product) === productId,
      );
      if (existingItem) {
        setQuantityDrafts((prev) => ({
          ...prev,
          [productId]: String(existingItem.quantity),
        }));
      }
      toast.error(err.response?.data?.message || "Failed to update cart item");
    } finally {
      setUpdateBusy(null);
    }
  };

  const clearCart = async () => {
    try {
      const { data } = await api.delete("/cart");
      setCart({ items: data.data.items, totalAmount: data.data.totalAmount });
      setQuantityDrafts({});
      toast.success("Cart cleared");
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to clear cart");
    }
  };

  const removeItem = async (productId) => {
    try {
      const { data } = await api.delete(`/cart/item/${productId}`);
      setCart({ items: data.data.items, totalAmount: data.data.totalAmount });
      toast.success("Item removed");
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove item");
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    try {
      setCheckoutBusy(true);
      const { data } = await api.post("/cart/checkout-session", {
        shippingDetails: shipping,
        shippingProfileId: selectedProfileId || undefined,
        notes,
      });
      const url = data.data?.url;
      if (url) {
        window.location.href = url;
        return;
      }
      toast.error("No payment URL returned.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Checkout failed");
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
            <Link to="/products" className="btn-primary px-6 py-2.5 text-sm">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {cart.items.map((item) => {
                const itemProduct =
                  item.product && typeof item.product === "object"
                    ? item.product
                    : {};
                const productId =
                  item.productId || itemProduct._id || item.product;
                const productLink = productId ? `/products/${productId}` : null;
                const minQty = itemProduct.moq || 1;
                const draftValue =
                  quantityDrafts[productId] ?? String(item.quantity);
                const displayName = itemProduct.name || item.productName;
                const productImage =
                  item.productImage || itemProduct.images?.[0]?.url;
                return (
                  <div
                    key={productId}
                    className="bg-paper border border-border rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    {productLink ? (
                      <Link
                        to={productLink}
                        className="flex items-center gap-3 md:gap-4 flex-1 min-w-0"
                      >
                        <div className="w-16 h-16 rounded-xl bg-linen/70 flex items-center justify-center overflow-hidden border border-border">
                          {productImage ? (
                            <img
                              src={productImage}
                              alt={displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-fog text-xs">No image</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-espresso break-words">
                            {displayName}
                          </h3>
                          <p className="text-xs text-fog mt-1 tabular-nums">
                            {formatCurrency(
                              item.price,
                              user?.preferredCurrency,
                            )}{" "}
                            / unit
                          </p>
                        </div>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                        <div className="w-16 h-16 rounded-xl bg-linen/70 flex items-center justify-center overflow-hidden border border-border">
                          {productImage ? (
                            <img
                              src={productImage}
                              alt={displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-fog text-xs">No image</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-espresso break-words">
                            {displayName}
                          </h3>
                          <p className="text-xs text-fog mt-1 tabular-nums">
                            {formatCurrency(
                              item.price,
                              user?.preferredCurrency,
                            )}{" "}
                            / unit
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        disabled={
                          updateBusy === productId || item.quantity <= minQty
                        }
                        onClick={() => {
                          const nextQty = Math.max(item.quantity - 1, minQty);
                          setQuantityDrafts((prev) => ({
                            ...prev,
                            [productId]: String(nextQty),
                          }));
                          changeQuantity(productId, nextQty);
                        }}
                        className="w-8 h-8 border border-border rounded-full flex items-center justify-center text-fog hover:border-espresso"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        min={minQty}
                        value={draftValue}
                        onChange={(e) => {
                          setQuantityDrafts((prev) => ({
                            ...prev,
                            [productId]: e.target.value,
                          }));
                        }}
                        onBlur={() => {
                          const value = Number(quantityDrafts[productId]);
                          if (!Number.isFinite(value)) {
                            setQuantityDrafts((prev) => ({
                              ...prev,
                              [productId]: String(item.quantity),
                            }));
                            return;
                          }
                          const normalizedValue = Math.max(
                            minQty,
                            Math.floor(value),
                          );
                          if (normalizedValue !== item.quantity) {
                            changeQuantity(productId, normalizedValue);
                          } else {
                            setQuantityDrafts((prev) => ({
                              ...prev,
                              [productId]: String(item.quantity),
                            }));
                          }
                        }}
                        className="w-20 border border-border rounded-lg text-center py-1 tabular-nums"
                      />
                      <button
                        disabled={updateBusy === productId}
                        onClick={() => {
                          const nextQty = item.quantity + 1;
                          setQuantityDrafts((prev) => ({
                            ...prev,
                            [productId]: String(nextQty),
                          }));
                          changeQuantity(productId, nextQty);
                        }}
                        className="w-8 h-8 border border-border rounded-full flex items-center justify-center text-fog hover:border-espresso"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 text-sm md:ml-8">
                      <span className="font-semibold tabular-nums break-all">
                        {formatCurrency(
                          item.quantity * item.price,
                          user?.preferredCurrency,
                        )}
                      </span>
                      <button
                        onClick={() => removeItem(productId)}
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
                <p className="text-fog text-sm">
                  Total Estimation (Before Shipping)
                </p>
                <p className="text-2xl font-semibold text-espresso tabular-nums break-all">
                  {formatCurrency(cart.totalAmount, user?.preferredCurrency)}
                </p>
              </div>
            </div>

            <form
              onSubmit={handleCheckout}
              className="mt-8 bg-paper border border-border p-5 rounded-2xl space-y-4"
            >
              <h3 className="text-lg font-semibold">Shipping Information</h3>

              {shippingProfiles.length > 0 && (
                <div>
                  <label className="text-xs text-fog uppercase tracking-wide">
                    Saved Shipping Profile
                  </label>
                  <select
                    value={selectedProfileId}
                    onChange={(e) => {
                      const selected = shippingProfiles.find(
                        (p) => p._id === e.target.value,
                      );
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
                      <option key={profile._id} value={profile._id}>
                        {profile.name || profile.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={shipping.fullName}
                  onChange={(e) =>
                    setShipping((prev) => ({
                      ...prev,
                      fullName: e.target.value,
                    }))
                  }
                  placeholder="Full name"
                  required
                  className="field"
                />
                <input
                  type="text"
                  value={shipping.phone}
                  onChange={(e) =>
                    setShipping((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="Phone"
                  required
                  className="field"
                />
                <input
                  type="text"
                  value={shipping.address}
                  onChange={(e) =>
                    setShipping((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  placeholder="Address"
                  required
                  className="field md:col-span-2"
                />
                <input
                  type="text"
                  value={shipping.city}
                  onChange={(e) =>
                    setShipping((prev) => ({ ...prev, city: e.target.value }))
                  }
                  placeholder="City"
                  required
                  className="field"
                />
                <input
                  type="text"
                  value={shipping.country}
                  onChange={(e) =>
                    setShipping((prev) => ({
                      ...prev,
                      country: e.target.value,
                    }))
                  }
                  placeholder="Country"
                  required
                  className="field"
                />
                <input
                  type="text"
                  value={shipping.postalCode}
                  onChange={(e) =>
                    setShipping((prev) => ({
                      ...prev,
                      postalCode: e.target.value,
                    }))
                  }
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
                {checkoutBusy
                  ? "Redirecting to secure payment…"
                  : `Proceed to Secure Payment`}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
