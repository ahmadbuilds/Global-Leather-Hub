import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../utils/api";
import toast from "react-hot-toast";
import {
  Search,
  Loader2,
  AlertCircle,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_COLORS = {
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  processing: "bg-purple-50 text-purple-700 border-purple-200",
  shipped: "bg-cyan-50 text-cyan-700 border-cyan-200",
  delivered: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

const VALID_TRANSITIONS = {
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export default function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "",
  );

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("page", searchParams.get("page") || "1");
      params.set("limit", "10");
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const { data } = await api.get(`/admin/orders?${params.toString()}`);
      setOrders(data.data.orders);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, [searchParams, search, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (search) p.set("search", search);
      else p.delete("search");
      if (statusFilter) p.set("status", statusFilter);
      else p.delete("status");
      p.set("page", "1");
      return p;
    });
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(orderId);
      const response = await api.patch(`/admin/orders/${orderId}/status`, {
        status: newStatus,
      });
      toast.success(`Order status updated to "${newStatus}".`);
      fetchOrders();
    } catch (err) {
      console.error('Status update error:', err.response?.data);
      toast.error(err.response?.data?.message || "Failed to update status.");
    } finally {
      setUpdatingStatus(null);
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
    setStatusFilter("");
    setSearchParams({});
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div>
        <h1
          className="text-espresso leading-tight"
          style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
            fontWeight: 400,
          }}
        >
          Orders
        </h1>
        <p className="text-fog text-sm mt-1">
          {pagination.total} order{pagination.total !== 1 ? "s" : ""} total
        </p>
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
              placeholder="Search by order number..."
              className="field pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="field w-full md:w-48"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-primary text-[13px] py-2.5 px-5">
            Filter
          </button>
          {(search || statusFilter) && (
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

      {/* Orders List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-tan animate-spin" />
        </div>
      ) : error ? (
        <div className="card flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rust flex-shrink-0" />
          <p className="text-sm text-espresso">{error}</p>
          <button
            onClick={fetchOrders}
            className="btn-outline text-xs py-2 px-4 ml-auto"
          >
            Retry
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="card text-center py-12">
          <ShoppingCart className="w-12 h-12 text-fog/30 mx-auto mb-4" />
          <p className="text-fog text-sm">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const isExpanded = expandedOrder === order._id;
            const normalizedStatus = String(
              order.status || "confirmed",
            ).toLowerCase();
            const transitions = VALID_TRANSITIONS[normalizedStatus] || [];
            const displayStatus =
              normalizedStatus.charAt(0).toUpperCase() +
              normalizedStatus.slice(1);
            const displayTotal = Number(order.totalAmount || 0);
            const shipping = order.shipping || {};

            return (
              <div key={order._id} className="card p-0 overflow-hidden">
                {/* Order Header Row */}
                <button
                  onClick={() => {
                    setExpandedOrder(isExpanded ? null : order._id);
                  }}
                  className="w-full flex items-center justify-between p-4 hover:bg-linen/20 transition-colors text-left"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div>
                      <p className="text-sm font-medium text-espresso">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-fog mt-0.5">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap justify-end">
                    <span className="text-sm font-medium text-espresso hidden sm:block">
                      ${displayTotal.toFixed(2)}
                    </span>
                    {order.paymentStatus === "unpaid" && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-amber-300 text-amber-800 bg-amber-50">
                        Awaiting payment
                      </span>
                    )}
                    <span
                      className={`inline-flex text-[11px] font-medium px-2.5 py-1 rounded-full border ${
                        STATUS_COLORS[order.status] || ""
                      }`}
                    >
                      {displayStatus}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-fog" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-fog" />
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-border p-4 bg-linen/20 space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Customer Info */}
                      <div>
                        <p className="text-xs font-medium text-fog tracking-wide uppercase mb-2">
                          Customer
                        </p>
                        <p className="text-sm text-espresso">
                          {order.user?.username || "—"}
                        </p>
                        <p className="text-xs text-fog">
                          {order.user?.email || "—"}
                        </p>
                        {order.user?.company && (
                          <p className="text-xs text-fog">
                            {order.user.company}
                          </p>
                        )}
                      </div>

                      {/* Shipping Details */}
                      <div>
                        <p className="text-xs font-medium text-fog tracking-wide uppercase mb-2">
                          Shipping
                        </p>
                        <p className="text-sm text-espresso">
                          {order.shippingAddress?.fullName ||
                            order.shippingAddressSnapshot?.fullName ||
                            "—"}
                        </p>
                        <p className="text-xs text-fog">
                          {order.shippingAddress?.address ||
                            order.shippingAddressSnapshot?.address ||
                            "—"}
                          ,{" "}
                          {order.shippingAddress?.city ||
                            order.shippingAddressSnapshot?.city ||
                            "—"}
                        </p>
                        <p className="text-xs text-fog">
                          {order.shippingAddress?.country ||
                            order.shippingAddressSnapshot?.country ||
                            "—"}{" "}
                          {order.shippingAddress?.postalCode ||
                            order.shippingAddressSnapshot?.postalCode ||
                            ""}
                        </p>
                        <p className="text-xs text-fog">
                          {order.shippingAddress?.phone ||
                            order.shippingAddressSnapshot?.phone ||
                            ""}
                        </p>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div>
                      <p className="text-xs font-medium text-fog tracking-wide uppercase mb-2">
                        Items
                      </p>
                      <div className="space-y-2">
                        {order.items?.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between text-sm bg-paper p-3 rounded-xl border border-border/40"
                          >
                            <div>
                              <p className="text-espresso font-medium">
                                {item.productName || item.product?.name || "—"}
                              </p>
                              <p className="text-xs text-fog">
                                Qty: {item.quantity} × $
                                {Number(
                                  item.price ?? item.price_usd ?? 0,
                                ).toFixed(2)}
                              </p>
                            </div>
                            <p className="text-espresso font-medium">
                              $
                              {(
                                Number(item.quantity || 0) *
                                Number(item.price ?? item.price_usd ?? 0)
                              ).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end mt-3">
                        <p className="text-sm font-medium text-espresso">
                          Total: ${displayTotal.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {order.notes && (
                      <div>
                        <p className="text-xs font-medium text-fog tracking-wide uppercase mb-1">
                          Notes
                        </p>
                        <p className="text-sm text-espresso">{order.notes}</p>
                      </div>
                    )}

                    {/* Status Update */}
                    {transitions.length > 0 && (
                      <div className="flex items-center gap-3 pt-2 border-t border-border/40">
                        <p className="text-xs text-fog">Update status:</p>
                        <div className="flex gap-2 flex-wrap">
                          {transitions.map((s) => (
                            <button
                              key={s}
                              onClick={() => handleStatusUpdate(order._id, s)}
                              disabled={updatingStatus === order._id}
                              className={`text-[12px] font-medium px-3 py-1.5 rounded-full border transition-all duration-200 capitalize ${
                                s === "cancelled"
                                  ? "border-rose-300 text-rose-700 hover:bg-rose-50"
                                  : s === "delivered"
                                  ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                  : "border-tan/40 text-sienna hover:bg-tan/10"
                              } disabled:opacity-40`}
                            >
                              {updatingStatus === order._id ? (
                                <Loader2 className="w-3 h-3 animate-spin inline" />
                              ) : (
                                s.charAt(0).toUpperCase() + s.slice(1)
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-2 pt-2">
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
  );
}
