import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/authContext";
import {
  ArrowLeft,
  CheckCircle,
  Package,
  Loader2,
  AlertCircle,
  Maximize2,
  Tag,
  Layers,
  Ruler,
  Palette,
  ShoppingCart,
} from "lucide-react";
import { formatCurrency } from "../utils/currency";
import {
  normalizePricingTiers,
  getActivePricingTier,
  getNextPricingTier,
  getTierLabel,
} from "../utils/pricingTiers";

export default function ProductDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [quantityInput, setQuantityInput] = useState("");
  const [quantityError, setQuantityError] = useState("");
  const [productMessage, setProductMessage] = useState("");
  const [productBusy, setProductBusy] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/products/${id}`);
        setProduct(data.data.product);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load product details.",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (product) {
      const minQty = Math.max(1, Number(product.moq) || 1);
      setQuantityInput(String(minQty));
      setQuantityError("");
    }
  }, [product]);

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas pt-24 pb-16 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-tan animate-spin-slow mb-4" />
        <p className="text-fog animate-pulse">Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-canvas pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <Link to="/products" className="btn-ghost mb-8 inline-flex">
            <ArrowLeft className="w-4 h-4" /> Back to Catalog
          </Link>
          <div className="card-linen flex flex-col items-center justify-center py-16 text-center border-rust/20">
            <AlertCircle className="w-10 h-10 text-rust mb-3" />
            <p className="text-espresso font-medium">
              {error || "Product not found"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const formatCategory = (cat) => {
    const categories = {
      "leather-jackets": "Leather Jackets",
      "leather-belts": "Leather Belts",
      "leather-wallets": "Leather Wallets",
    };
    return categories[cat] || cat;
  };

  const sortedTiers = normalizePricingTiers(product.pricingTiers || []);
  const minOrderQty = Math.max(1, Number(product?.moq) || 1);
  const parsedQuantity = quantityInput === "" ? null : Number(quantityInput);
  const quantityValue = Number.isFinite(parsedQuantity) ? parsedQuantity : null;
  const quantityForPricing = quantityValue ?? 0;
  const activeTier = getActivePricingTier(sortedTiers, quantityForPricing);
  const nextTier = getNextPricingTier(sortedTiers, quantityForPricing);
  const basePrice = sortedTiers[0]?.price || 0;
  const unitPrice = activeTier?.price ?? basePrice;
  const totalPrice =
    quantityForPricing > 0 ? quantityForPricing * unitPrice : 0;
  const savingsPercent =
    basePrice > 0
      ? Math.max(0, Math.round(((basePrice - unitPrice) / basePrice) * 100))
      : 0;
  const quantityIsValid =
    Number.isInteger(quantityValue) && quantityValue >= minOrderQty;
  const showTierMessage = Number.isInteger(quantityValue) && quantityValue > 0;
  const nextTierDelta = nextTier
    ? Math.max(
        0,
        nextTier.minQuantity - Math.max(1, Number(quantityForPricing) || 0),
      )
    : 0;

  const handleQuantityChange = (event) => {
    const rawValue = event.target.value;

    if (rawValue === "") {
      setQuantityInput("");
      setQuantityError("Quantity is required.");
      return;
    }

    if (!/^\d+$/.test(rawValue)) {
      return;
    }

    const normalizedValue = rawValue.replace(/^0+(?=\d)/, "");
    setQuantityInput(normalizedValue);

    const nextValue = Number(normalizedValue);
    if (!Number.isInteger(nextValue)) {
      setQuantityError("Quantity must be a whole number.");
      return;
    }

    if (nextValue < minOrderQty) {
      setQuantityError(`Minimum order quantity is ${minOrderQty}.`);
      return;
    }

    setQuantityError("");
  };

  const handleQuantityBlur = () => {
    if (quantityInput === "") {
      setQuantityInput(String(minOrderQty));
      setQuantityError("");
    }
  };

  const addToCart = async () => {
    if (!user) {
      setProductMessage("Please log in to add items to your cart.");
      return;
    }
    if (user.role === "admin") {
      setProductMessage("Admin accounts cannot add items to cart.");
      return;
    }

    const qty = Number(quantityValue);
    if (!Number.isInteger(qty) || qty < minOrderQty) {
      setProductMessage(
        `Minimum order quantity for this product is ${minOrderQty}.`,
      );
      return;
    }

    try {
      setProductBusy(true);
      setProductMessage("");
      await api.post("/cart", { productId: product._id, quantity: qty });
      window.dispatchEvent(new Event("cartUpdated"));
      setProductMessage(`Added ${qty} item${qty > 1 ? "s" : ""} to cart ✔`);
    } catch (err) {
      setProductMessage(
        err.response?.data?.message || "Failed to add to cart.",
      );
    } finally {
      setProductBusy(false);
      setTimeout(() => setProductMessage(""), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-espresso pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Top Navigation */}
        <Link
          to="/products"
          className="btn-ghost mb-8 inline-flex animate-fade-in group text-xs text-fog uppercase tracking-widest hover:text-espresso"
        >
          <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />{" "}
          Back to Catalog
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Images Section */}
          <div className="space-y-4 animate-fade-right">
            <div className="aspect-[4/5] sm:aspect-square lg:aspect-[4/5] bg-linen/50 rounded-3xl overflow-hidden relative border border-border shadow-soft">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[activeImage].url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-16 h-16 text-fog/30" />
                </div>
              )}
              {/* Category Badge overlay on image */}
              <span className="absolute top-4 left-4 bg-paper/90 backdrop-blur-md text-espresso text-[11px] font-semibold tracking-widest uppercase px-4 py-2 rounded-full shadow-sm">
                {formatCategory(product.category)}
              </span>
            </div>

            {/* Thumbnail Gallery */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-5 gap-3">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                      activeImage === idx
                        ? "border-tan ring-2 ring-tan/20 shadow-md transform scale-[1.02]"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info Section */}
          <div className="animate-fade-left lg:py-4 flex flex-col">
            <h1
              className="leading-tight text-3xl md:text-4xl mb-4 text-espresso"
              style={{
                fontFamily: '"Playfair Display", serif',
                fontWeight: 500,
              }}
            >
              {product.name}
            </h1>

            <p className="text-fog text-sm leading-relaxed mb-6">
              {product.description}
            </p>

            <div className="bg-linen/40 border border-border rounded-2xl p-6 mb-8 shadow-sm">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <span className="block text-[10px] text-fog uppercase tracking-widest font-semibold mb-1">
                    Starting wholesale price
                  </span>
                  <span className="text-sienna text-balance font-medium flex items-baseline gap-1">
                    <span className="text-2xl">
                      {formatCurrency(basePrice, user?.preferredCurrency)}
                    </span>
                    <span className="text-sm text-fog font-normal">/ unit</span>
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-fog uppercase tracking-widest font-semibold mb-1">
                    Minimum Order Qty
                  </span>
                  <span className="text-espresso font-medium text-xl flex items-center gap-2">
                    {product.moq}{" "}
                    <span className="text-sm text-fog font-normal">units</span>
                  </span>
                </div>
              </div>
            </div>

            {sortedTiers.length > 0 && (
              <div className="mb-8">
                <h4 className="text-[11px] font-semibold uppercase tracking-widest text-fog mb-3">
                  Bulk Pricing
                </h4>
                <div className="bg-paper border border-border rounded-xl overflow-hidden">
                  <div className="grid grid-cols-2 px-4 py-2 text-[10px] uppercase tracking-widest text-fog/70 bg-linen/40">
                    <span>Quantity</span>
                    <span className="text-right">Price / Unit</span>
                  </div>
                  {sortedTiers.map((tier, idx) => (
                    <div
                      key={idx}
                      className={`grid grid-cols-2 px-4 py-3 text-sm border-t border-border/60 ${
                        activeTier &&
                        tier.minQuantity === activeTier.minQuantity &&
                        tier.maxQuantity === activeTier.maxQuantity
                          ? "bg-sage/10"
                          : nextTier &&
                              tier.minQuantity === nextTier.minQuantity &&
                              tier.maxQuantity === nextTier.maxQuantity
                            ? "bg-tan/10"
                            : ""
                      }`}
                    >
                      <span className="text-espresso">
                        {getTierLabel(tier)}
                        {activeTier &&
                          tier.minQuantity === activeTier.minQuantity &&
                          tier.maxQuantity === activeTier.maxQuantity && (
                            <span className="ml-2 text-[10px] uppercase tracking-widest text-sage font-semibold">
                              Active
                            </span>
                          )}
                        {nextTier &&
                          tier.minQuantity === nextTier.minQuantity &&
                          tier.maxQuantity === nextTier.maxQuantity &&
                          !(
                            activeTier &&
                            tier.minQuantity === activeTier.minQuantity &&
                            tier.maxQuantity === activeTier.maxQuantity
                          ) && (
                            <span className="ml-2 text-[10px] uppercase tracking-widest text-tan font-semibold">
                              Next
                            </span>
                          )}
                      </span>
                      <span className="text-right text-espresso font-medium tabular-nums break-all">
                        {formatCurrency(tier.price, user?.preferredCurrency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-8">
              <h4 className="text-[11px] font-semibold uppercase tracking-widest text-fog mb-3">
                Buy More, Save More
              </h4>
              <div className="bg-linen/40 border border-border rounded-2xl p-5 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="min-w-0">
                    <label className="text-[10px] text-fog uppercase tracking-widest font-semibold mb-1 block">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min={minOrderQty}
                      step="1"
                      value={quantityInput}
                      onChange={handleQuantityChange}
                      onBlur={handleQuantityBlur}
                      className={`field py-2.5 text-sm  tabular-nums ${quantityError ? "field-error" : ""}`}
                    />
                    {quantityError && (
                      <p className="text-rust text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {quantityError}
                      </p>
                    )}
                  </div>
                  <div className="min-w-0">
                    <label className="text-[10px] text-fog uppercase tracking-widest font-semibold mb-1 block">
                      Unit Price
                    </label>
                    <div className="text-espresso font-semibold text-lg tabular-nums break-all leading-tight">
                      {formatCurrency(unitPrice, user?.preferredCurrency)}
                    </div>
                    {savingsPercent > 0 && (
                      <p className="text-xs text-sage mt-1">
                        Save {savingsPercent}% vs base tier
                      </p>
                    )}
                  </div>
                  <div className="min-w-0">
                    <label className="text-[10px] text-fog uppercase tracking-widest font-semibold mb-1 block">
                      Estimated Total
                    </label>
                    <div className="text-espresso font-semibold text-lg tabular-nums break-all leading-tight">
                      {formatCurrency(totalPrice, user?.preferredCurrency)}
                    </div>
                  </div>
                </div>
                {showTierMessage ? (
                  nextTier ? (
                    <p className="text-xs text-fog mt-4">
                      Add {nextTierDelta} more item
                      {nextTierDelta === 1 ? "" : "s"} to unlock{" "}
                      <span className="tabular-nums break-all">
                        {formatCurrency(
                          nextTier.price,
                          user?.preferredCurrency,
                        )}
                      </span>
                      /unit pricing.
                    </p>
                  ) : (
                    <p className="text-xs text-sage mt-4">
                      Best pricing tier unlocked.
                    </p>
                  )
                ) : (
                  <p className="text-xs text-fog mt-4">
                    Enter a valid quantity to see tier pricing.
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-10 mb-8">
              {product.material && (
                <div className="flex gap-3">
                  <Layers className="w-5 h-5 text-tan flex-shrink-0" />
                  <div>
                    <h4 className="text-[11px] font-semibold uppercase tracking-widest text-fog mb-1">
                      Material
                    </h4>
                    <p className="text-sm text-espresso font-medium">
                      {product.material}
                    </p>
                  </div>
                </div>
              )}
              {product.fit && (
                <div className="flex gap-3">
                  <Maximize2 className="w-5 h-5 text-tan flex-shrink-0" />
                  <div>
                    <h4 className="text-[11px] font-semibold uppercase tracking-widest text-fog mb-1">
                      Fit/Cut
                    </h4>
                    <p className="text-sm text-espresso font-medium">
                      {product.fit}
                    </p>
                  </div>
                </div>
              )}
              {product.availableSizes && product.availableSizes.length > 0 && (
                <div className="flex gap-3">
                  <Ruler className="w-5 h-5 text-tan flex-shrink-0" />
                  <div>
                    <h4 className="text-[11px] font-semibold uppercase tracking-widest text-fog mb-1">
                      Available Sizes
                    </h4>
                    <p className="text-sm text-espresso font-medium">
                      {product.availableSizes.join(", ")}
                    </p>
                  </div>
                </div>
              )}
              {product.availableColors &&
                product.availableColors.length > 0 && (
                  <div className="flex gap-3">
                    <Palette className="w-5 h-5 text-tan flex-shrink-0" />
                    <div>
                      <h4 className="text-[11px] font-semibold uppercase tracking-widest text-fog mb-1">
                        Available Colors
                      </h4>
                      <p className="text-sm text-espresso font-medium">
                        {product.availableColors.join(", ")}
                      </p>
                    </div>
                  </div>
                )}
            </div>

            {product.highlights && product.highlights.length > 0 && (
              <div className="mb-8">
                <h4 className="text-[11px] font-semibold uppercase tracking-widest text-fog mb-3">
                  Key Features
                </h4>
                <ul className="space-y-2">
                  {product.highlights.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex gap-3 text-sm text-espresso items-start"
                    >
                      <CheckCircle className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.specifications && product.specifications.length > 0 && (
              <div className="mb-10">
                <h4 className="text-[11px] font-semibold uppercase tracking-widest text-fog mb-3">
                  Technical Specifications
                </h4>
                <div className="bg-paper border border-border rounded-xl divide-y divide-border">
                  {product.specifications.map((spec, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between py-3 px-4 text-sm"
                    >
                      <span className="text-fog">{spec.label}</span>
                      <span className="text-espresso font-medium text-right max-w-[60%]">
                        {spec.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-auto space-y-4 pt-4 border-t border-border">
              {user?.role !== "admin" ? (
                <>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      addToCart();
                    }}
                    disabled={productBusy || !quantityIsValid}
                    className="btn-primary w-full justify-center text-[13px] py-4 shadow-sm"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2 inline" /> Add to Cart
                  </button>
                  {productMessage && (
                    <p className="text-sm text-green-700">{productMessage}</p>
                  )}
                </>
              ) : (
                <div className="text-center p-3.5 bg-linen/50 rounded-full border border-border text-fog text-[11px] uppercase tracking-widest font-semibold cursor-not-allowed">
                  Admin accounts cannot place orders
                </div>
              )}
              <Link
                to="/contact"
                className="btn-outline w-full justify-center text-[13px] py-3.5 border-transparent bg-linen/50"
              >
                Contact Sales Team for Inquiries
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
