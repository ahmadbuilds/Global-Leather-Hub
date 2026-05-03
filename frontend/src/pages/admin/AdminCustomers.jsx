import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../utils/api";
import {
  Search,
  Loader2,
  AlertCircle,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  Mail,
  MapPin,
  Building2,
  Phone,
  CheckCircle,
  Clock,
  ShoppingCart
} from "lucide-react";

export default function AdminCustomers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  
  // Order History state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState(null);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("page", searchParams.get("page") || "1");
      params.set("limit", "12");
      if (search) params.set("search", search);

      const { data } = await api.get(`/admin/customers?${params.toString()}`);
      setCustomers(data.data.customers);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load customers.");
    } finally {
      setLoading(false);
    }
  }, [searchParams, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    if (selectedCustomer) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedCustomer]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (search) p.set("search", search);
      else p.delete("search");
      p.set("page", "1");
      return p;
    });
  };

  const goToPage = (page) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set("page", String(page));
      return p;
    });
  };

  const clearSearch = () => {
    setSearch("");
    setSearchParams({});
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleCustomerClick = async (customer) => {
    setSelectedCustomer(customer);
    setLoadingOrders(true);
    setOrdersError(null);
    try {
      const { data } = await api.get(`/admin/orders?user=${customer._id}&limit=50`);
      setCustomerOrders(data.data.orders);
    } catch (err) {
      setOrdersError(err.response?.data?.message || "Failed to load order history.");
    } finally {
      setLoadingOrders(false);
    }
  };

  const STATUS_COLORS = {
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    confirmed: "bg-blue-50 text-blue-700 border-blue-200",
    processing: "bg-purple-50 text-purple-700 border-purple-200",
    shipped: "bg-cyan-50 text-cyan-700 border-cyan-200",
    delivered: "bg-green-50 text-green-700 border-green-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <>
      <div className="space-y-6 animate-fade-up relative">
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
          Customers
        </h1>
        <p className="text-fog text-sm mt-1">
          {pagination.total} registered buyer{pagination.total !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="card p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fog" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or company..."
              className="field pl-10"
            />
          </div>
          <button type="submit" className="btn-primary text-[13px] py-2.5 px-5">
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={clearSearch}
              className="btn-outline text-[13px] py-2.5 px-4"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </form>

      {/* Customer List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-tan animate-spin" />
        </div>
      ) : error ? (
        <div className="card flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rust flex-shrink-0" />
          <p className="text-sm text-espresso">{error}</p>
          <button
            onClick={fetchCustomers}
            className="btn-outline text-xs py-2 px-4 ml-auto"
          >
            Retry
          </button>
        </div>
      ) : customers.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="w-12 h-12 text-fog/30 mx-auto mb-4" />
          <p className="text-fog text-sm">No customers found.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customers.map((customer) => (
              <div
                key={customer._id}
                onClick={() => handleCustomerClick(customer)}
                className="card hover:shadow-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col"
              >
                <div className="flex items-start gap-3 mb-4 flex-1">
                  {customer.avatar ? (
                    <img
                      src={customer.avatar}
                      alt={customer.username}
                      className="w-10 h-10 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-tan/20 border border-tan/40 flex items-center justify-center flex-shrink-0 group-hover:bg-tan/30 transition-colors">
                      <span className="text-sienna text-sm font-semibold">
                        {customer.username?.[0]?.toUpperCase() || "?"}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-espresso truncate">
                      {customer.username}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {customer.isEmailVerified ? (
                        <CheckCircle className="w-3 h-3 text-sage" />
                      ) : (
                        <Clock className="w-3 h-3 text-fog" />
                      )}
                      <span className="text-[11px] text-fog">
                        {customer.isEmailVerified ? "Verified" : "Unverified"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-[13px] mb-4">
                  <div className="flex items-center gap-2 text-fog">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                  {customer.company && (
                    <div className="flex items-center gap-2 text-fog">
                      <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{customer.company}</span>
                    </div>
                  )}
                  {customer.country && (
                    <div className="flex items-center gap-2 text-fog">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{customer.country}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-fog">
                      <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                </div>

                <div className="rule mt-auto pt-3 flex items-center justify-between text-[11px] text-fog">
                  <span>Joined {formatDate(customer.createdAt)}</span>
                  <span className="text-tan group-hover:underline flex items-center gap-1"><ShoppingCart className="w-3.5 h-3.5"/> View Orders</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-2 pt-4">
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
        </>
      )}
      </div>

      {/* Customer Order History Modal */}
      {selectedCustomer && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedCustomer(null)}
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div 
            className="relative z-10 w-full max-w-3xl h-[90vh] flex flex-col bg-canvas border border-border shadow-2xl rounded-2xl md:rounded-3xl overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between p-4 md:p-6 border-b border-border bg-paper flex-shrink-0">
              <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                {selectedCustomer.avatar ? (
                  <img src={selectedCustomer.avatar} alt={selectedCustomer.username} className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border border-border flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-tan/20 border border-tan/40 flex items-center justify-center flex-shrink-0">
                    <span className="text-sienna text-base md:text-lg font-semibold">{selectedCustomer.username?.[0]?.toUpperCase() || "?"}</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-espresso text-lg md:text-xl truncate" style={{ fontFamily: '"Playfair Display", serif', fontWeight: 500 }}>
                    {selectedCustomer.username}&apos;s Order History
                  </h3>
                  <p className="text-fog text-xs md:text-sm mt-0.5 truncate">{selectedCustomer.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 -mr-2 -mt-2 rounded-full hover:bg-linen/50 text-fog hover:text-espresso transition-colors flex-shrink-0 ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div 
              className="flex-1 overflow-y-auto bg-paper/50 min-h-0"
              data-lenis-prevent="true"
            >
              <div className="p-4 md:p-6">
                {loadingOrders ? (
                  <div className="flex flex-col items-center justify-center py-20 opacity-70">
                    <Loader2 className="w-8 h-8 text-tan animate-spin-slow mb-4" />
                    <p className="text-fog text-sm animate-pulse">Fetching orders...</p>
                  </div>
                ) : ordersError ? (
                  <div className="card-linen flex flex-col items-center justify-center py-12 text-center border-rust/20">
                    <AlertCircle className="w-8 h-8 text-rust mb-3" />
                    <p className="text-espresso font-medium text-sm">{ordersError}</p>
                  </div>
                ) : customerOrders.length === 0 ? (
                  <div className="text-center py-16">
                    <ShoppingCart className="w-12 h-12 md:w-16 md:h-16 text-fog/20 mx-auto mb-4" />
                    <p className="text-fog text-sm">No orders found for this customer.</p>
                  </div>
                ) : (
                  <div className="space-y-3 md:space-y-4">
                    {customerOrders.map(order => (
                      <div key={order._id} className="bg-paper border border-border rounded-xl p-3 md:p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-3 mb-3 md:mb-4 pb-3 md:pb-4 border-b border-border/50">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-espresso truncate">{order.orderNumber}</p>
                            <p className="text-[11px] text-fog uppercase tracking-widest mt-0.5">{formatDate(order.createdAt)}</p>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-3 md:gap-4 w-full sm:w-auto flex-shrink-0">
                            <span className={`inline-flex text-[10px] md:text-[11px] font-medium px-2.5 md:px-3 py-1 rounded-full border ${STATUS_COLORS[order.status] || ""}`}>
                              {order.status}
                            </span>
                            <span className="text-base md:text-lg font-medium text-espresso whitespace-nowrap">${order.totalAmount?.toFixed(2)}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start gap-2 text-xs md:text-[13px]">
                              <div className="flex items-start gap-2 min-w-0 flex-1">
                                <span className="text-fog flex-shrink-0">{item.quantity}×</span>
                                <span className="text-espresso font-medium line-clamp-2">{item.productName || item.product?.name || "Unknown Product"}</span>
                              </div>
                              <span className="text-fog flex-shrink-0 whitespace-nowrap">${(item.quantity * item.price).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Modal Footer */}
            {!loadingOrders && !ordersError && customerOrders.length > 0 && (
              <div className="border-t border-border p-3 md:p-4 bg-paper flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 flex-shrink-0">
                <span className="text-xs md:text-sm text-fog">
                  Orders shown: {customerOrders.length} (paid + unpaid)
                </span>
                <span className="text-espresso font-medium text-base md:text-lg whitespace-nowrap">
                  Paid revenue: $
                  {customerOrders
                    .filter((o) => o.paymentStatus === "paid" || o.paymentStatus == null)
                    .reduce((acc, order) => acc + (order.totalAmount || 0), 0)
                    .toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
