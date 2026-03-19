import React, { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  ChevronLeft,
  ChevronRight,
  Shield
} from "lucide-react";

const ADMIN_NAV = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Customers", href: "/admin/customers", icon: Users },
];

export default function AdminLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href) => {
    if (href === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col md:flex-row pt-16 md:pt-20">
      
      {/* ── Mobile Tab Navigation (Horizontal Scroll) ── */}
      <div className="md:hidden sticky top-16 z-30 bg-paper border-b border-border shadow-soft w-full overflow-x-auto no-scrollbar">
        <div className="flex px-4 py-2 gap-2 min-w-max">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-medium transition-all duration-200 ${
                  active
                    ? "bg-espresso text-paper shadow-soft"
                    : "text-fog bg-linen/50 hover:text-espresso hover:bg-linen"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? "text-paper" : "text-fog"}`} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Desktop Sidebar ── */}
      <aside
        className={`hidden md:flex fixed left-0 top-20 bottom-0 bg-paper border-r border-border z-40 flex-col transition-all duration-300 ${
          collapsed ? "w-[68px]" : "w-64"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-tan" />
              <span className="text-xs font-semibold tracking-[0.12em] uppercase text-espresso">
                Admin Panel
              </span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-linen text-fog hover:text-espresso transition-all duration-200"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group ${
                  active
                    ? "bg-espresso text-paper shadow-soft"
                    : "text-fog hover:text-espresso hover:bg-linen"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${
                    active ? "text-paper" : "text-fog group-hover:text-espresso"
                  }`}
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="p-4 border-t border-border">
            <Link
              to="/"
              className="text-[11px] text-fog hover:text-espresso transition-colors flex items-center gap-1.5"
            >
              <ChevronLeft className="w-3 h-3" />
              Back to Store
            </Link>
          </div>
        )}
      </aside>

      {/* ── Main content ── */}
      <main
        className={`flex-1 transition-all duration-300 w-full md:w-auto ml-0 ${
          collapsed ? "md:ml-[68px]" : "md:ml-64"
        }`}
      >
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
