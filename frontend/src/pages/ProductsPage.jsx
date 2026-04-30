import React, { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle,
  Search,
  FileX,
  ChevronLeft,
  ChevronRight,
  Package,
  Loader2,
  AlertCircle,
  X,
  Filter,
  ShoppingCart,
} from "lucide-react";
import api from "../utils/api";
import { formatCurrency } from "../utils/currency";
import { useAuth } from "../context/authContext";
import toast from "react-hot-toast";

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "leather-jackets", label: "Leather Jackets" },
  { value: "leather-belts", label: "Leather Belts" },
  { value: "leather-wallets", label: "Leather Wallets" },
];

const SORT_OPTIONS = [
  { value: "createdAt-desc", label: "Newest Arrivals" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
];

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [cartBusy, setCartBusy] = useState(false);
  const { user } = useAuth();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [sort, setSort] = useState(
    searchParams.get("sort") || "createdAt-desc",
  );

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("page", searchParams.get("page") || "1");
      params.set("limit", "12");
      if (searchParams.get("search"))
        params.set("search", searchParams.get("search"));
      if (searchParams.get("category"))
        params.set("category", searchParams.get("category"));
      if (searchParams.get("minPrice"))
        params.set("minPrice", searchParams.get("minPrice"));
      if (searchParams.get("maxPrice"))
        params.set("maxPrice", searchParams.get("maxPrice"));
      if (searchParams.get("sort"))
        params.set("sort", searchParams.get("sort"));

      const { data } = await api.get(`/products?${params.toString()}`);
      setProducts(data.data.products);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Sync state when URL params change
  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setCategory(searchParams.get("category") || "");
    setMinPrice(searchParams.get("minPrice") || "");
    setMaxPrice(searchParams.get("maxPrice") || "");
    setSort(searchParams.get("sort") || "createdAt-desc");
  }, [searchParams]);

  const handleFilter = (e) => {
    if (e) e.preventDefault();
    setSearchParams((prev) => {
      const p = new URLSearchParams();
      if (search) p.set("search", search);
      if (category) p.set("category", category);
      if (minPrice) p.set("minPrice", minPrice);
      if (maxPrice) p.set("maxPrice", maxPrice);
      if (sort) p.set("sort", sort);
      p.set("page", "1");
      return p;
    });
    setShowMobileFilters(false);
  };

  const addToCart = async (productId, minQty = 1) => {
    if (!user) {
      toast.error("Please log in to add items to your cart.");
      return;
    }

    const quantity = Number(minQty) || 1;

    try {
      setCartBusy(true);
      await api.post("/cart", { productId, quantity });
      toast.success(`Added ${quantity} item${quantity > 1 ? "s" : ""} to cart`);
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add to cart.");
    } finally {
      setCartBusy(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setSort("createdAt-desc");
    setSearchParams({});
    setShowMobileFilters(false);
  };

  const goToPage = (page) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set("page", String(page));
      return p;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hasActiveFilters =
    searchParams.get("search") ||
    searchParams.get("category") ||
    searchParams.get("minPrice") ||
    searchParams.get("maxPrice");

  return (
    <div className="min-h-screen bg-canvas text-espresso pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Header Section */}
        <div className="mb-10 reveal visible">
          <p className="eyebrow mb-3">Full Catalogue</p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1
                className="leading-tight"
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: "clamp(2rem, 4vw, 3.25rem)",
                  fontWeight: 400,
                }}
              >
                Wholesale Product
                <em style={{ fontStyle: "italic", color: "#8B5E3C" }}>
                  {" "}
                  Catalogue
                </em>
              </h1>
              <p className="text-fog text-sm mt-4 max-w-2xl leading-relaxed">
                Explore our high-margin leather products curated for
                wholesalers. Request quotes with your MOQ and branding
                requirements.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-fog">
              {pagination.total} Product{pagination.total !== 1 ? "s" : ""}
            </span>
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="btn-outline py-2 px-4 shadow-soft inline-flex text-xs"
            >
              <Filter className="w-4 h-4 mr-2" />
              {showMobileFilters ? "Hide Filters" : "Show Filters"}
            </button>
          </div>

          {/* Sidebar Filters */}
          <aside
            className={`w-full lg:w-64 flex-shrink-0 transition-all duration-300 overflow-hidden lg:overflow-visible ${showMobileFilters ? "max-h-[1000px] opacity-100 mb-6" : "max-h-0 lg:max-h-none opacity-0 lg:opacity-100 m-0"}`}
          >
            <div className="sticky top-28 space-y-6 bg-paper p-6 rounded-2xl border border-border shadow-soft">
              <div className="flex items-center justify-between">
                <h3
                  className="text-lg font-medium tracking-wide"
                  style={{ fontFamily: '"Playfair Display", serif' }}
                >
                  Filters
                </h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-[11px] text-rust hover:underline transition-all"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <form onSubmit={handleFilter} className="space-y-6">
                {/* Search */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold tracking-widest uppercase text-fog">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fog/60" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Keyword..."
                      className="field pl-9 text-[13px] py-2.5 shadow-sm"
                    />
                  </div>
                </div>

                <div className="rule"></div>

                {/* Category */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold tracking-widest uppercase text-fog">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="field text-[13px] py-2.5 w-full shadow-sm"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rule"></div>

                {/* Price Range */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold tracking-widest uppercase text-fog">
                    Price Range (USD)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="Min"
                      className="field text-[13px] py-2 px-3 text-center shadow-sm w-full"
                    />
                    <span className="text-fog">-</span>
                    <input
                      type="number"
                      min="0"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="Max"
                      className="field text-[13px] py-2 px-3 text-center shadow-sm w-full"
                    />
                  </div>
                </div>

                <div className="rule"></div>

                {/* Sort */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold tracking-widest uppercase text-fog">
                    Sort By
                  </label>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="field text-[13px] py-2.5 w-full shadow-sm"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full py-3 justify-center text-xs mt-4"
                >
                  Apply Filters
                </button>
              </form>
            </div>
          </aside>

          {/* Product Grid Area */}
          <main className="flex-1">
            <div className="hidden lg:flex justify-between items-center mb-6">
              <span className="text-sm font-medium text-fog ml-1">
                Showing{" "}
                {products.length > 0 ? (pagination.page - 1) * 12 + 1 : 0} -{" "}
                {Math.min(pagination.page * 12, pagination.total)} of{" "}
                {pagination.total} Products
              </span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 opacity-70">
                <Loader2 className="w-10 h-10 text-tan animate-spin-slow mb-4" />
                <p className="text-fog text-sm animate-pulse">
                  Curating catalogue...
                </p>
              </div>
            ) : error ? (
              <div className="card-linen flex flex-col items-center justify-center py-16 text-center border-rust/20">
                <AlertCircle className="w-10 h-10 text-rust mb-3" />
                <p className="text-espresso font-medium">{error}</p>
                <button
                  onClick={fetchProducts}
                  className="btn-outline mt-4 text-xs py-2"
                >
                  Try Again
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="card text-center py-20 border-dashed border-2">
                <FileX className="w-16 h-16 text-fog/30 mx-auto mb-5" />
                <h3
                  className="text-espresso text-xl mb-2"
                  style={{ fontFamily: '"Playfair Display", serif' }}
                >
                  No Models Found
                </h3>
                <p className="text-fog text-sm max-w-sm mx-auto mb-6">
                  We couldn't find any products matching your current filters.
                  Try adjusting your search or clearing the filters.
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="btn-primary text-xs py-2.5 px-6"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-up">
                {products.map((item, idx) => (
                  <article
                    key={item._id}
                    className="bg-paper border border-border rounded-3xl overflow-hidden shadow-soft hover:shadow-hover transition-all duration-500 hover:-translate-y-1 group flex flex-col"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="h-64 overflow-hidden relative bg-linen/50">
                      {item.images && item.images.length > 0 ? (
                        <img
                          src={item.images[0].url}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-fog/30" />
                        </div>
                      )}
                      {/* MOQ Badge overlay on image */}
                      <span className="absolute top-4 right-4 bg-paper/90 backdrop-blur-md text-espresso text-[10px] font-semibold tracking-wide uppercase px-3 py-1.5 rounded-full shadow-sm">
                        MOQ {item.moq}
                      </span>
                    </div>

                    <div className="p-6 flex flex-col flex-grow">
                      <p className="text-fog text-[10px] tracking-widest uppercase mb-1.5">
                        {CATEGORIES.find((c) => c.value === item.category)
                          ?.label || item.category}
                      </p>

                      <h2
                        className="text-espresso text-lg mb-2 leading-tight flex-grow"
                        style={{
                          fontFamily: '"Playfair Display", serif',
                          fontWeight: 500,
                        }}
                      >
                        {item.name}
                      </h2>

                      <p className="text-fog text-xs mb-5 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>

                      <div className="rule mb-4 -mx-2"></div>

                      <div className="flex items-end justify-between mb-5">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-fog uppercase tracking-widest font-medium mb-0.5">
                            Price
                          </span>
                          <span className="text-sienna text-balance font-medium flex items-baseline gap-1">
                            <span className="text-sm">from</span>
                            <span className="text-lg">
                              {formatCurrency(
                                item.pricingTiers?.[0]?.pricePerUnit || 0,
                                user?.preferredCurrency,
                                true,
                              )}
                            </span>
                            <span className="text-xs text-fog font-normal">
                              /ea
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="grid  gap-2">
                        <button
                          onClick={async () =>
                            addToCart(item._id, item.moq || 1)
                          }
                          disabled={cartBusy}
                          className="btn-primary w-full justify-center text-[12px] py-2.5"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Add to Cart
                        </button>
                        <Link
                          to={`/products/${item._id}`}
                          className="btn-outline w-full justify-center text-[12px] py-2.5 transition-colors hover:bg-espresso hover:text-paper hover:border-espresso"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {pagination.pages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-4">
                <button
                  onClick={() => goToPage(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="p-2.5 rounded-full bg-paper border border-border text-espresso hover:border-tan hover:text-sienna disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <span className="text-sm font-medium text-fog px-4 bg-paper py-2 rounded-full border border-border shadow-soft">
                  <span className="text-espresso">{pagination.page}</span> /{" "}
                  {pagination.pages}
                </span>

                <button
                  onClick={() => goToPage(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="p-2.5 rounded-full bg-paper border border-border text-espresso hover:border-tan hover:text-sienna disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </main>
        </div>

        {/* Private Label Section */}
        <div className="mt-16 card-linen rounded-2xl p-6 md:p-8 animate-fade-up style-delay-300">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3
                className="text-espresso text-xl mb-1"
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontWeight: 400,
                }}
              >
                Need Custom Branding?
              </h3>
              <p className="text-fog text-sm">
                Private label, debossing, and custom hardware options available
                across all lines.
              </p>
            </div>
            <div className="flex gap-3 flex-wrap items-center">
              <span className="badge-sage text-[11px] h-fit">
                <CheckCircle className="w-3 h-3" /> OEM Supported
              </span>
              <Link
                to="/contact"
                className="btn-espresso bg-espresso text-paper px-6 py-2.5 rounded-full text-[13px] font-medium hover:bg-sienna transition-all shadow-sm"
              >
                Talk to Sales
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
