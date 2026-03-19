import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../utils/api";
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  ArrowRight,
  AlertCircle,
  Loader2,
} from "lucide-react";

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  processing: "bg-purple-100 text-purple-800 border-purple-200",
  shipped: "bg-cyan-100 text-cyan-800 border-cyan-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get("/admin/dashboard");
      setStats(data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-tan animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card flex items-center gap-3 p-6">
        <AlertCircle className="w-5 h-5 text-rust flex-shrink-0" />
        <p className="text-sm text-espresso">{error}</p>
        <button onClick={fetchStats} className="btn-outline text-xs py-2 px-4 ml-auto">
          Retry
        </button>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      color: "text-tan",
      bg: "bg-tan/10",
      link: "/admin/products",
    },
    {
      label: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "text-sienna",
      bg: "bg-sienna/10",
      link: "/admin/orders",
    },
    {
      label: "Total Customers",
      value: stats.totalCustomers,
      icon: Users,
      color: "text-sage",
      bg: "bg-sage/10",
      link: "/admin/customers",
    },
    {
      label: "Pending Orders",
      value: stats.ordersByStatus?.pending || 0,
      icon: TrendingUp,
      color: "text-rust",
      bg: "bg-rust/10",
      link: "/admin/orders?status=pending",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-up">
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
          Dashboard
        </h1>
        <p className="text-fog text-sm mt-1">
          Overview of your wholesale platform.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              to={stat.link}
              className="card hover:shadow-hover group"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}
                >
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <ArrowRight className="w-4 h-4 text-fog opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
              </div>
              <p
                className="text-espresso text-3xl font-light"
                style={{ fontFamily: '"Playfair Display", serif' }}
              >
                {stat.value}
              </p>
              <p className="text-fog text-xs mt-1 tracking-wide uppercase">
                {stat.label}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-espresso text-lg"
            style={{ fontFamily: '"Playfair Display", serif', fontWeight: 400 }}
          >
            Recent Orders
          </h2>
          <Link
            to="/admin/orders"
            className="btn-ghost text-xs"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats.recentOrders?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-3 text-fog text-xs font-medium tracking-wide uppercase">
                    Order
                  </th>
                  <th className="text-left py-3 px-3 text-fog text-xs font-medium tracking-wide uppercase">
                    Customer
                  </th>
                  <th className="text-left py-3 px-3 text-fog text-xs font-medium tracking-wide uppercase">
                    Amount
                  </th>
                  <th className="text-left py-3 px-3 text-fog text-xs font-medium tracking-wide uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr
                    key={order._id}
                    className="border-b border-border/50 hover:bg-linen/40 transition-colors"
                  >
                    <td className="py-3 px-3 font-medium text-espresso">
                      {order.orderNumber}
                    </td>
                    <td className="py-3 px-3 text-fog">
                      {order.user?.username || "—"}
                    </td>
                    <td className="py-3 px-3 text-espresso">
                      ${order.totalAmount?.toFixed(2)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex text-[11px] font-medium px-2.5 py-1 rounded-full border ${
                          STATUS_COLORS[order.status] || ""
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-fog text-sm text-center py-8">
            No orders yet.
          </p>
        )}
      </div>

      {/* Order Status Breakdown */}
      {stats.ordersByStatus && Object.keys(stats.ordersByStatus).length > 0 && (
        <div className="card">
          <h2
            className="text-espresso text-lg mb-5"
            style={{ fontFamily: '"Playfair Display", serif', fontWeight: 400 }}
          >
            Order Status Breakdown
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(stats.ordersByStatus).map(([status, count]) => (
              <div
                key={status}
                className="text-center p-4 rounded-xl bg-linen/50 border border-border/40"
              >
                <p
                  className="text-espresso text-2xl font-light"
                  style={{ fontFamily: '"Playfair Display", serif' }}
                >
                  {count}
                </p>
                <p className="text-fog text-[11px] mt-1 capitalize tracking-wide">
                  {status}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
