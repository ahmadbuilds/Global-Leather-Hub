import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/authContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AdminLayout from "./components/AdminLayout";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import BulkOrderPage from "./pages/BulkOrderPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminProductForm from "./pages/admin/AdminProductForm";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCustomers from "./pages/admin/AdminCustomers";
import CartPage from "./pages/CartPage";
import CheckoutSuccessPage from "./pages/CheckoutSuccessPage";
import AdminBulkOrders from "./pages/admin/AdminBulkOrders";
import Lenis from "lenis";

const AppLayout = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    if (window.lenis) {
      window.lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.search]);

  const hideNavbar = ["/login", "/register"].includes(location.pathname);
  const isAdmin = location.pathname.startsWith("/admin");
  return (
    <>
      {!hideNavbar && <Navbar />}
      {children}
    </>
  );
};

export default function App() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: "vertical",
      gestureDirection: "vertical",
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
    window.lenis = lenis;

    return () => {
      lenis.destroy();
      delete window.lenis;
    };
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#FDFAF5",
              color: "#2C1A0E",
              border: "1px solid #D9CEBE",
              borderRadius: "16px",
              fontSize: "13px",
              fontFamily: '"Inter", system-ui, sans-serif',
              fontWeight: 400,
              boxShadow: "0 4px 24px rgba(44,26,14,0.10)",
            },
            success: {
              iconTheme: { primary: "#5E7A5A", secondary: "#FDFAF5" },
            },
            error: {
              iconTheme: { primary: "#C0542A", secondary: "#FDFAF5" },
            },
          }}
        />
        <AppLayout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <CartPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout/success"
              element={
                <ProtectedRoute>
                  <CheckoutSuccessPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bulk-orders"
              element={
                <ProtectedRoute>
                  <BulkOrderPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <OrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute>
                  <OrderDetailPage />
                </ProtectedRoute>
              }
            />
            {/* Admin Routes - Only accessible by admin role */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="products/new" element={<AdminProductForm />} />
              <Route path="products/:id/edit" element={<AdminProductForm />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="bulk-orders" element={<AdminBulkOrders />} />
              <Route path="customers" element={<AdminCustomers />} />
            </Route>
            <Route
              path="*"
              element={
                <div className="min-h-screen bg-canvas flex items-center justify-center">
                  <div className="text-center">
                    <p
                      className="text-tan/30 mb-4"
                      style={{
                        fontFamily: '"Playfair Display", serif',
                        fontSize: "8rem",
                        fontWeight: 400,
                        lineHeight: 1,
                      }}
                    >
                      404
                    </p>
                    <p className="text-fog text-sm tracking-widest uppercase mb-8">
                      Page not found
                    </p>
                    <a href="/" className="btn-primary inline-flex px-8 py-3.5">
                      Back to Home
                    </a>
                  </div>
                </div>
              }
            />
          </Routes>
        </AppLayout>
      </AuthProvider>
    </BrowserRouter>
  );
}

