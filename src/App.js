import "./App.css";
import { lazy, Suspense, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import { AuthRoute } from "./AuthRoute";
import { AuthRouteVendor } from "./AuthRouteVendor";
import { AuthRouteAdmin } from "./AuthRouteAdmin";

import AdminAIChatBot from "./components/Admin/AdminAIChatBot";
import VendorAIChatBot from "./components/Vendor/VendorAIChatBot";

const NotFound = lazy(() => import("./components/NotFound"));

// Customer Panel Components
const CustomerLayout = lazy(
  () => import("./components/Customer/CustomerLayout"),
);
const HomePage = lazy(() => import("./components/Customer/HomePage"));
const ShopPage = lazy(() => import("./components/Customer/ShopPage"));
const CategoriesPage = lazy(
  () => import("./components/Customer/CategoriesPage"),
);
const ProductPage = lazy(() => import("./components/Customer/ProductPage"));
const VendorStorePage = lazy(
  () => import("./components/Customer/VendorStorePage"),
);
const VendorsPage = lazy(() => import("./components/Customer/VendorsPage"));
const WishlistPage = lazy(() => import("./components/Customer/WishlistPage"));
const CartPage = lazy(() => import("./components/Customer/CartPage"));
const CheckoutPage = lazy(() => import("./components/Customer/CheckoutPage"));
const ComparePage = lazy(() => import("./components/Customer/ComparePage"));
const OrdersPage = lazy(() => import("./components/Customer/OrdersPage"));
const OrderDetailsPage = lazy(
  () => import("./components/Customer/OrderDetailsPage"),
);
const AboutPage = lazy(() => import("./components/Customer/AboutPage"));
const ContactPage = lazy(() => import("./components/Customer/ContactPage"));
const ProfilePage = lazy(() => import("./components/Customer/ProfilePage"));
const AuthPage = lazy(() => import("./components/Customer/AuthPage"));
const ResetPasswordPage = lazy(
  () => import("./components/Customer/ResetPasswordPage"),
);

// Admin Panel Components
const AdminLogin = lazy(() => import("./components/Admin/AdminLogin"));
const AdminLayout = lazy(() => import("./components/Admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./components/Admin/AdminDashboard"));
const AdminVendors = lazy(() => import("./components/Admin/AdminVendors"));
const AdminViewVendor = lazy(
  () => import("./components/Admin/AdminViewVendor"),
);
const AdminProducts = lazy(() => import("./components/Admin/AdminProducts"));
const AdminProductView = lazy(
  () => import("./components/Admin/AdminProductView"),
);
const AdminCategories = lazy(
  () => import("./components/Admin/AdminCategories"),
);
const AdminAddCategory = lazy(
  () => import("./components/Admin/AdminAddCategory"),
);
const AdminViewCategory = lazy(
  () => import("./components/Admin/AdminViewCategory"),
);
const AdminEditCategory = lazy(
  () => import("./components/Admin/AdminEditCategory"),
);
const AdminOrders = lazy(() => import("./components/Admin/AdminOrders"));
const AdminViewOrder = lazy(() => import("./components/Admin/AdminViewOrder"));
const AdminCustomers = lazy(() => import("./components/Admin/AdminCustomers"));
const AdminViewCustomer = lazy(
  () => import("./components/Admin/AdminViewCustomer"),
);
const AdminPayments = lazy(() => import("./components/Admin/AdminPayments"));
const AdminViewPayment = lazy(
  () => import("./components/Admin/AdminViewPayment"),
);
const AdminPayouts = lazy(() => import("./components/Admin/AdminPayouts"));
const AdminViewPayout = lazy(
  () => import("./components/Admin/AdminViewPayout"),
);
const AdminMakePayout = lazy(
  () => import("./components/Admin/AdminMakePayout"),
);
const AdminProfile = lazy(() => import("./components/Admin/AdminProfile"));
const AdminProfileEdit = lazy(
  () => import("./components/Admin/AdminProfileEdit"),
);
const AdminContactMessages = lazy(
  () => import("./components/Admin/AdminContactMessages"),
);

// Vendor Panel Components
const VendorLayout = lazy(() => import("./components/Vendor/VendorLayout"));
const VendorDashboard = lazy(
  () => import("./components/Vendor/VendorDashboard"),
);
const VendorProducts = lazy(() => import("./components/Vendor/VendorProducts"));
const VendorAddProduct = lazy(
  () => import("./components/Vendor/VendorAddProduct"),
);
const VendorViewProduct = lazy(
  () => import("./components/Vendor/VendorViewProduct"),
);
const VendorEditProduct = lazy(
  () => import("./components/Vendor/VendorEditProduct"),
);
const VendorOrders = lazy(() => import("./components/Vendor/VendorOrders"));
const VendorViewOrder = lazy(
  () => import("./components/Vendor/VendorViewOrder"),
);
const VendorInventory = lazy(
  () => import("./components/Vendor/VendorInventory"),
);
const VendorInventoryLogs = lazy(
  () => import("./components/Vendor/VendorInventoryLogs"),
);
const VendorEarnings = lazy(() => import("./components/Vendor/VendorEarnings"));
const VendorPayouts = lazy(() => import("./components/Vendor/VendorPayouts"));
const VendorPayoutDetail = lazy(
  () => import("./components/Vendor/VendorPayoutDetail"),
);
const VendorCustomers = lazy(
  () => import("./components/Vendor/VendorCustomers"),
);
const VendorViewCustomer = lazy(
  () => import("./components/Vendor/VendorViewCustomer"),
);
const VendorStore = lazy(() => import("./components/Vendor/VendorStore"));
const VendorProfile = lazy(() => import("./components/Vendor/VendorProfile"));
const VendorProfileEdit = lazy(
  () => import("./components/Vendor/VendorProfileEdit"),
);
const VendorLogin = lazy(() => import("./components/Vendor/VendorLogin"));
const VendorRegisterPage = lazy(
  () => import("./components/Vendor/VendorRegisterPage"),
);

function App() {
  const location = useLocation();
  
  // Detect paths to conditionally mount the appropriate chatbot
  const isAdminPath =
    location.pathname.startsWith("/admin") &&
    location.pathname !== "/admin/login";
  const isVendorPath =
    location.pathname.startsWith("/vendor") &&
    location.pathname !== "/vendor/login" &&
    location.pathname !== "/vendor/register";

  return (
    <>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          </div>
        }
      >
        <Routes>
          {/* 404 - Page Not Found */}
          <Route path="*" element={<NotFound />} />

          {/* Authentication */}
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Customer Website */}
          <Route path="/" element={<CustomerLayout />}>
            <Route index element={<HomePage />} />

            <Route path="/shop" element={<ShopPage />} />

            <Route path="/categories" element={<CategoriesPage />} />

            <Route path="product/:productId" element={<ProductPage />} />

            <Route path="/vendors" element={<VendorsPage />} />

            <Route path="/vendor/:vendorId" element={<VendorStorePage />} />

            <Route path="/wishlist" element={<WishlistPage />} />

            <Route path="/cart" element={<CartPage />} />

            <Route path="/compare" element={<ComparePage />} />

            <Route
              path="/checkout"
              element={
                <AuthRoute>
                  {" "}
                  <CheckoutPage />{" "}
                </AuthRoute>
              }
            />

            <Route
              path="/orders"
              element={
                <AuthRoute>
                  {" "}
                  <OrdersPage />{" "}
                </AuthRoute>
              }
            />

            <Route
              path="/orders/:orderId"
              element={
                <AuthRoute>
                  {" "}
                  <OrderDetailsPage />{" "}
                </AuthRoute>
              }
            />

            <Route path="/about" element={<AboutPage />} />

            <Route path="/contact" element={<ContactPage />} />

            <Route
              path="/profile"
              element={
                <AuthRoute>
                  {" "}
                  <ProfilePage />{" "}
                </AuthRoute>
              }
            />
          </Route>

          {/* Admin Authentication */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Admin Website */}
          <Route
            path="/admin"
            element={
              <AuthRouteAdmin>
                {" "}
                <AdminLayout />
              </AuthRouteAdmin>
            }
          >
            <Route path="dashboard" element={<AdminDashboard />} />

            <Route path="vendors" element={<AdminVendors />} />

            <Route path="vendors/:vendorId" element={<AdminViewVendor />} />

            <Route path="products" element={<AdminProducts />} />

            <Route path="products/:productId" element={<AdminProductView />} />

            <Route path="categories" element={<AdminCategories />} />

            <Route path="categories/add" element={<AdminAddCategory />} />

            <Route
              path="categories/:categoryId"
              element={<AdminViewCategory />}
            />

            <Route
              path="categories/:categoryId/edit"
              element={<AdminEditCategory />}
            />

            <Route path="orders" element={<AdminOrders />} />

            <Route path="orders/:orderId" element={<AdminViewOrder />} />

            <Route path="customers" element={<AdminCustomers />} />

            <Route path="customers/:customerId" element={<AdminViewCustomer />} />

            <Route path="contact" element={<AdminContactMessages />} />

            <Route path="payments" element={<AdminPayments />} />

            <Route path="payments/:paymentId" element={<AdminViewPayment />} />

            <Route path="payouts" element={<AdminPayouts />} />

            <Route path="payouts/make" element={<AdminMakePayout />} />

            <Route path="payouts/:payoutId" element={<AdminViewPayout />} />

            <Route path="payouts/:payoutId/make" element={<AdminMakePayout />} />

            <Route path="profile" element={<AdminProfile />} />

            <Route path="profile/edit" element={<AdminProfileEdit />} />
          </Route>

          {/* Vendor Authentication */}
          <Route path="/vendor/login" element={<VendorLogin />} />
          <Route path="/vendor/register" element={<VendorRegisterPage />} />

          {/* VENDOR PANEL ROUTES */}
          <Route
            path="/vendor"
            element={
              <AuthRouteVendor>
                {" "}
                <VendorLayout />{" "}
              </AuthRouteVendor>
            }
          >
            <Route index element={<VendorDashboard />} />
            <Route path="products" element={<VendorProducts />} />
            <Route path="products/add" element={<VendorAddProduct />} />
            <Route path="products/:productId" element={<VendorViewProduct />} />
            <Route
              path="products/:productId/edit"
              element={<VendorEditProduct />}
            />

            <Route path="orders" element={<VendorOrders />} />
            <Route path="orders/:orderId" element={<VendorViewOrder />} />

            <Route path="inventory" element={<VendorInventory />} />

            <Route path="inventory/logs" element={<VendorInventoryLogs />} />

            <Route path="earnings" element={<VendorEarnings />} />
            <Route path="payouts" element={<VendorPayouts />} />
            <Route path="payouts/:payoutId" element={<VendorPayoutDetail />} />

            <Route path="customers" element={<VendorCustomers />} />
            <Route
              path="customers/:customerId"
              element={<VendorViewCustomer />}
            />

            <Route path="store" element={<VendorStore />} />
            <Route path="profile" element={<VendorProfile />} />
            <Route path="profile/edit" element={<VendorProfileEdit />} />
          </Route>
        </Routes>
      </Suspense>
      {/* Conditionally Render Chatbots */}
      {isAdminPath && <AdminAIChatBot />}
      {isVendorPath && <VendorAIChatBot />} 
    </>
  );
}

export default App;
