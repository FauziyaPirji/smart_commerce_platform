import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import axios from "axios";
import CustomerNav from "./CustomerNav";
import Footer from "./Footer";
import { handleAuthError } from "../../AuthRoute";

const API_BASE_URL = "https://smart-commerce-platform-backend.onrender.com/api/customer";

const getToken = () => localStorage.getItem("token") || null;
const isLoggedIn = () => Boolean(getToken());

const CustomerLayout = () => {
  const [cartCount, setCartCount] = useState(0);
  const [wishCount, setWishCount] = useState(0);

  const loadCounts = async () => {
    try {
      if (isLoggedIn()) {
        // Fetch counts from DB
        const [cartRes, wishRes] = await Promise.all([
          axios
            .get(`${API_BASE_URL}/cart`, {
              headers: {
                "Content-Type": "Application/json",
                Authorization: `Bearer ${getToken()}`,
              },
            })
            .catch(() => null),
          axios
            .get(`${API_BASE_URL}/wishlist`, {
              headers: {
                "Content-Type": "Application/json",
                Authorization: `Bearer ${getToken()}`,
              },
            })
            .catch(() => null),
        ]);

        setCartCount(cartRes?.data?.cart?.length || 0);
        setWishCount(wishRes?.data?.wishlist?.length || 0);
      } else {
        // Read counts from localStorage (guest)
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        const wish = JSON.parse(localStorage.getItem("wishlist") || "[]");
        setCartCount(cart.length);
        setWishCount(wish.length);
      }
    } catch (err) {
      handleAuthError(err);

      console.error("Failed to load cart/wishlist counts:", err);
    }
  };

  useEffect(() => {
    loadCounts();

    // Listen for cart/wishlist update events dispatched by child pages
    window.addEventListener("cartUpdated", loadCounts);
    window.addEventListener("wishlistUpdated", loadCounts);

    return () => {
      window.removeEventListener("cartUpdated", loadCounts);
      window.removeEventListener("wishlistUpdated", loadCounts);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <CustomerNav cartCount={cartCount} wishCount={wishCount} />

      <main>
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default CustomerLayout;
