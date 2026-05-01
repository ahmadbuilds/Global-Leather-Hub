import React, { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../utils/api";
import toast from "react-hot-toast";
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  Loader2,
  AlertCircle,
  Package,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "leather-jackets", label: "Leather Jackets" },
  { value: "leather-belts", label: "Leather Belts" },
  { value: "leather-wallets", label: "Leather Wallets" },
];

const STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

const STATUS_BADGE = {
  active: "badge-sage",
  draft: "badge-linen",
  archived: "badge-tan",
};

export default function AdminProducts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("page", searchParams.get("page") || "1");
      params.set("limit", "10");
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      if (status) params.set("status", status);

      const { data } = await api.get(`/admin/products?${params.toString()}`);
      setProducts(data.data.products);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  }, [searchParams, search, category, status]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (search) p.set("search", search);
      else p.delete("search");
      if (category) p.set("category", category);
      else p.delete("category");
      if (status) p.set("status", status);
      else p.delete("status");
      p.set("page", "1");
      return p;
    });
  };

  const handleDelete = async (id) => {
    try {
      setDeleting(true);
      await api.delete(`/admin/products/${id}`);
      toast.success("Product deleted successfully.");
      setDeleteConfirm(null);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete product.");
    } finally {
      setDeleting(false);
    }
  };

  const goToPage = (page) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set("page", String(page));
      return p;
    });
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setStatus("");
    setSearchParams({});
  };

  const getCategoryLabel = (cat) =>
    CATEGORIES.find((c) => c.value === cat)?.label || cat;

  return (
    <>
      <div className="space-y-6 animate-fade-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1
              className="text-espresso leading-tight"
              style={{
                fontFamily: '"Playfair Display", serif',
                fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                fontWeight: 400,
              }}
            >
              Products
            </h1>
            <p className="text-fog text-sm mt-1">
              {pagination.total} product{pagination.total !== 1 ? "s" : ""} total
            </p>
          </div>
          <Link
            to="/admin/products/new"
            className="btn-primary text-[13px] py-2.5 px-5"
          >
            <Plus className="w-4 h-4" /> Add Product
          </Link>
        </div>

        {/* Filters */}
        <form onSubmit={handleSearch} className="card p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fog" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="field pl-10"
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="field w-full md:w-48"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="field w-full md:w-40"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <button type="submit" className="btn-primary text-[13px] py-2.5 px-5">
              Filter
            </button>
            {(search || category || status) && (
              <button
                type="button"
                onClick={clearFilters}
                className="btn-outline text-[13px] py-2.5 px-4"
              >
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>
        </form>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-tan animate-spin" />
          </div>
        ) : error ? (
          <div className="card flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rust flex-shrink-0" />
            <p className="text-sm text-espresso">{error}</p>
            <button
              onClick={fetchProducts}
              className="btn-outline text-xs py-2 px-4 ml-auto"
            >
              Retry
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="card text-center py-12">
            <Package className="w-12 h-12 text-fog/30 mx-auto mb-4" />
            <p className="text-fog text-sm">No products found.</p>
            <Link
              to="/admin/products/new"
              className="btn-primary text-[13px] py-2.5 px-5 mt-4 inline-flex"
            >
              <Plus className="w-4 h-4" /> Add Your First Product
            </Link>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-linen/40 border-b border-border">
                    <th className="text-left py-3 px-4 text-fog text-xs font-medium tracking-wide uppercase">
                      Product
                    </th>
                    <th className="text-left py-3 px-4 text-fog text-xs font-medium tracking-wide uppercase">
                      Category
                    </th>
                    <th className="text-left py-3 px-4 text-fog text-xs font-medium tracking-wide uppercase">
                      MOQ
                    </th>
                    <th className="text-left py-3 px-4 text-fog text-xs font-medium tracking-wide uppercase">
                      Price
                    </th>
                    <th className="text-left py-3 px-4 text-fog text-xs font-medium tracking-wide uppercase">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 text-fog text-xs font-medium tracking-wide uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product._id}
                      className="border-b border-border/40 hover:bg-linen/20 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0].url}
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover border border-border"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-linen border border-border flex items-center justify-center">
                              <Package className="w-4 h-4 text-fog/40" />
                            </div>
                          )}
                          <span className="font-medium text-espresso truncate max-w-[200px]">
                            {product.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-fog text-[13px]">
                        {getCategoryLabel(product.category)}
                      </td>
                      <td className="py-3 px-4 text-fog text-[13px]">
                        {product.moq}
                      </td>
                      <td className="py-3 px-4 text-sienna text-[13px] font-medium">
                        $
                        {product.pricingTiers?.[0]?.price?.toFixed(2) ||
                          "—"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`${STATUS_BADGE[product.status] || "badge-linen"} text-[10px]`}
                        >
                          {product.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/products/${product._id}/edit`}
                            className="p-2 rounded-lg hover:bg-linen text-fog hover:text-espresso transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setDeleteConfirm(product)}
                            className="p-2 rounded-lg hover:bg-rust/10 text-fog hover:text-rust transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-fog text-xs">
                  Page {pagination.page} of {pagination.pages}
                </p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => goToPage(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="p-1.5 rounded-lg hover:bg-linen text-fog hover:text-espresso disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => goToPage(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                    className="p-1.5 rounded-lg hover:bg-linen text-fog hover:text-espresso disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => !deleting && setDeleteConfirm(null)}></div>
          <div className="relative z-10 card max-w-sm w-full p-6 animate-scale-in">
            <h3
              className="text-espresso text-lg mb-2"
              style={{
                fontFamily: '"Playfair Display", serif',
                fontWeight: 400,
              }}
            >
              Delete Product
            </h3>
            <p className="text-fog text-sm mb-6">
              Are you sure you want to delete{" "}
              <strong className="text-espresso">{deleteConfirm.name}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="btn-outline text-[13px] py-2.5 px-5"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm._id)}
                disabled={deleting}
                className="inline-flex items-center justify-center gap-2 bg-rust text-paper font-medium text-[13px] px-5 py-2.5 rounded-full transition-all duration-300 hover:bg-rust/90 disabled:opacity-40"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
