import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/authContext";
import api from "../utils/api";
import { Menu, X, User, LogOut, ChevronDown, Shield, ShoppingCart } from "lucide-react";
import toast from "react-hot-toast";

const NAV_LINKS = [
  { label: "Products", href: "/products" },
  { label: "Bulk Orders", href: "/bulk-orders" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [prevLink, setPrevLink] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location]);

  useEffect(() => {
    const fetchCart = async () => {
      if (!isAuthenticated) {
        setCartCount(0);
        return;
      }

      try {
        const { data } = await api.get('/cart');
        setCartCount(data.data.items.length || 0);
      } catch (err) {
        console.warn('Cart count failed', err);
      }
    };

    fetchCart();

    const refreshCartCount = () => {
      fetchCart();
    };

    window.addEventListener('cartUpdated', refreshCartCount);
    return () => window.removeEventListener('cartUpdated', refreshCartCount);
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    toast.success("Signed out");
    navigate("/");
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 ${
        scrolled
          ? "bg-paper/95 backdrop-blur-xl border-b border-border shadow-soft"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* ── Wordmark ── */}
          <Link
            to="/"
            className="group flex flex-col leading-none animate-fade-down"
          >
            <span
              className="text-espresso font-normal text-xl tracking-tight transition-all duration-300 group-hover:opacity-70 group-hover:translate-y-[-1px]"
              style={{
                fontFamily: '"Playfair Display", serif',
                letterSpacing: "-0.01em",
              }}
            >
              Global Leather Hub
            </span>
            <span className="text-fog text-[9px] tracking-[0.28em] uppercase mt-0.5 font-medium transition-all duration-300 group-hover:text-tan">
              Wholesale
            </span>
          </Link>

          {/* ── Desktop links ── */}
          <div className="hidden md:flex items-center gap-0.5 animate-fade-down stagger-1">
            {NAV_LINKS.filter(link => !(link.label === "Bulk Orders" && user?.role === "admin")).map((link) => {
              const active = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`relative px-4 py-2 text-[13px] font-medium rounded-full transition-all duration-250 group ${
                    active
                      ? "text-espresso bg-linen"
                      : "text-fog hover:text-espresso hover:bg-linen/60"
                  }`}
                >
                  {link.label}
                  {/* Underline slide-in */}
                  <span
                    className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 bg-tan rounded-full transition-all duration-300 ${
                      active
                        ? "w-4 opacity-100"
                        : "w-0 opacity-0 group-hover:w-4 group-hover:opacity-100"
                    }`}
                  />
                </Link>
              );
            })}
          </div>

          {/* ── Auth ── */}
          <div className="hidden md:flex items-center gap-3 animate-fade-down stagger-2">
            {isAuthenticated ? (
              <>
                <Link
                  to="/cart"
                  className="relative flex items-center justify-center w-9 h-9 rounded-full bg-paper border border-border hover:border-tan/60 transition-all duration-300"
                >
                  <ShoppingCart className="w-4 h-4 text-espresso" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-rust text-white text-[10px] font-semibold flex items-center justify-center px-1">
                      {cartCount}
                    </span>
                  )}
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2.5 border border-border bg-paper hover:border-tan/60 rounded-full px-3 py-2 transition-all duration-300 shadow-soft hover:shadow-card"
                  >
                    <div className="w-7 h-7 rounded-full bg-tan/20 border border-tan/40 flex items-center justify-center flex-shrink-0 transition-all duration-300">
                      <span className="text-sienna text-xs font-semibold">
                        {user?.username?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-espresso text-[13px] font-medium pr-0.5">
                      {user?.username}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-fog transition-transform duration-300 ${dropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-44 bg-paper border border-border rounded-2xl shadow-card overflow-hidden animate-fade-down"
                    style={{ animationDuration: "0.25s" }}
                  >
                    <Link
                      to="/profile"
                      className="flex items-center gap-2.5 px-4 py-3 text-[13px] text-espresso hover:bg-linen transition-all duration-200 hover:pl-5"
                    >
                      <User className="w-3.5 h-3.5 text-fog" />
                      My Account
                    </Link>
                    <Link
                      to="/orders"
                      className="flex items-center gap-2.5 px-4 py-3 text-[13px] text-espresso hover:bg-linen transition-all duration-200 hover:pl-5"
                    >
                      <svg className="w-3.5 h-3.5 text-fog" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      My Orders
                    </Link>
                    {user?.role === "admin" && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2.5 px-4 py-3 text-[13px] text-espresso hover:bg-linen transition-all duration-200 hover:pl-5"
                      >
                        <Shield className="w-3.5 h-3.5 text-tan" />
                        Admin Panel
                      </Link>
                    )}
                    <div className="rule" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] text-rust hover:bg-linen transition-all duration-200 hover:pl-5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-[13px] font-medium text-fog hover:text-espresso transition-all duration-200 px-3 py-2 rounded-full hover:bg-linen/60"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-[13px] py-2.5 px-5"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* ── Mobile toggle ── */}
          <button
            className="md:hidden p-2 text-espresso/70 hover:text-espresso transition-all duration-200 hover:rotate-90"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="w-5 h-5 transition-transform duration-200" />
            ) : (
              <Menu className="w-5 h-5 transition-transform duration-200" />
            )}
          </button>
        </div>

        {/* ── Mobile drawer ── */}
        {mobileOpen && (
          <div
            className="md:hidden bg-paper border-t border-border py-4 animate-fade-down"
            style={{ animationDuration: "0.3s" }}
          >
            {NAV_LINKS.filter(link => !(link.label === "Bulk Orders" && user?.role === "admin")).map((link, i) => (
              <Link
                key={link.href}
                to={link.href}
                className={`block px-4 py-3 text-[13px] rounded-xl transition-all duration-200 ${
                  location.pathname === link.href
                    ? "text-espresso bg-linen font-medium"
                    : "text-espresso/80 hover:text-espresso hover:bg-linen hover:pl-5"
                }`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {link.label}
              </Link>
            ))}
            <div className="rule mt-3 pt-3 mx-4 flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    className="block py-2.5 text-[13px] text-espresso font-medium hover:text-sienna transition-colors"
                  >
                    My Account
                  </Link>
                  <Link
                    to="/orders"
                    className="block py-2.5 text-[13px] text-espresso font-medium hover:text-sienna transition-colors"
                  >
                    My Orders
                  </Link>
                  {user?.role === "admin" && (
                    <Link
                      to="/admin"
                      className="block py-2.5 text-[13px] text-tan font-medium hover:text-sienna transition-colors"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="text-left py-2.5 text-[13px] text-rust font-medium"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block py-2.5 text-[13px] text-espresso hover:text-tan transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="btn-primary text-[13px] py-2.5 text-center"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
