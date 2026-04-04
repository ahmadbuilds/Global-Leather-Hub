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
  DollarSign,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

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
  const [analytics, setAnalytics] = useState(null);
  const [period, setPeriod] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/admin/dashboard/analytics?period=${period}`);
        setAnalytics(data.data);
      } catch {
        setAnalytics(null);
      }
    };
    load();
  }, [period]);

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
      label: "Revenue (paid)",
      value: `$${(stats.totalRevenue ?? 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: DollarSign,
      color: "text-sage",
      bg: "bg-sage/10",
      link: "/admin/orders",
    },
    {
      label: "Total Customers",
      value: stats.totalCustomers,
      icon: Users,
      color: "text-sienna",
      bg: "bg-sienna/10",
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

  const chartData =
    analytics?.series?.map((row) => ({
      date: row.date,
      revenue: Math.round(row.revenue * 100) / 100,
      orders: row.orders,
    })) || [];

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
                className="text-espresso text-3xl font-light truncate"
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

      {/* Revenue & orders over time */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <h2
            className="text-espresso text-lg"
            style={{ fontFamily: '"Playfair Display", serif', fontWeight: 400 }}
          >
            Earnings & orders
          </h2>
          <div className="flex rounded-full border border-border p-1 bg-linen/30">
            {[
              { id: "7d", label: "7d" },
              { id: "30d", label: "30d" },
              { id: "12w", label: "12 wk" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  period === p.id ? "bg-espresso text-paper shadow-soft" : "text-fog hover:text-espresso"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {chartData.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(44,26,14,0.08)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#8a7a6a" }} />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 10, fill: "#8a7a6a" }}
                  tickFormatter={(v) => `$${v}`}
                />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#8a7a6a" }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e8e0d6",
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#8b6914"
                  fill="#c4a574"
                  fillOpacity={0.15}
                />
                <Bar yAxisId="right" dataKey="orders" name="Orders placed" fill="#5E7A5A" radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-fog text-sm text-center py-8">No paid orders in this period yet.</p>
        )}
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
