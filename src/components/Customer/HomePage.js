import React, { useState, useEffect, useMemo } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRoute";
import {
  ArrowRight,
  CheckCircle2,
  Heart,
  TrendingUp,
  Loader2,
  ShoppingBag,
  Truck,
  Sparkles,
  Store,
  AlertCircle,
  X,
  Crown,
} from "lucide-react";
import ProductCard from "./ProductCard";
import { addToCompare } from "../../utils/compareUtils";

const API_BASE_URL = "http://localhost:5000/api/customer";

// AUTH HELPERS
const getToken = () => localStorage.getItem("token") || null;
const isLoggedIn = () => Boolean(getToken());

// FORMATTERS
const formatMoney = (val) => {
  const num = Number(val);
  return isNaN(num) ? "₹0" : `₹${num.toLocaleString("en-IN")}`;
};

const getInitials = (name) => {
  if (!name) return "SC";
  const words = String(name).trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return String(name).slice(0, 2).toUpperCase();
};

// IMAGE RESOLUTION HELPERS
const getProductImage = (product) => {
  if (!product) return null;
  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images[0];
  }
  return (
    product.image ||
    (typeof product.images === "string" ? product.images : null)
  );
};

const getVendorLogo = (vendor) => {
  if (!vendor) return null;
  return (
    vendor.storeLogo ||
    vendor.logo ||
    vendor.image ||
    vendor.user?.image ||
    vendor.user?.avatar ||
    null
  );
};

const getCategoryImage = (category) => {
  if (!category) return null;
  return category.image || category.imageUrl || null;
};

const HomePage = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Wishlist product ID strings
  const [wishedIds, setWishedIds] = useState([]);

  // Vacation Mode toast notification
  const [vacationNotice, setVacationNotice] = useState("");

  // FETCH HOME DATA
  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true);
      try {
        const [prodRes, catRes, venRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/products`).catch(() => ({ data: [] })),
          axios.get(`${API_BASE_URL}/categories`).catch(() => ({ data: [] })),
          axios.get(`${API_BASE_URL}/vendors`).catch(() => ({ data: [] })),
        ]);

        const prodData = prodRes.data;
        setProducts(
          Array.isArray(prodData)
            ? prodData
            : prodData.products || prodData.data || [],
        );

        const catData = catRes.data;
        setCategories(
          Array.isArray(catData)
            ? catData
            : catData.categories || catData.data || [],
        );

        const venData = venRes.data;
        setVendors(
          Array.isArray(venData)
            ? venData
            : venData.vendors || venData.data || [],
        );
      } catch (err) {
        console.error("Error loading home page data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  // DYNAMIC AI BEST PRODUCT IDENTIFIER (REPLACES STATIC index === 1)
  // Evaluates live prices, discounts, stock, and specs among the 4 comparison items
  const bestSuggestedId = useMemo(() => {
    const candidates = products.slice(0, 4);
    if (!candidates || candidates.length === 0) return null;

    let bestItem = candidates[0];
    let highestScore = -1;

    candidates.forEach((p) => {
      const price = Number(p.discountPrice || p.price || 0);
      const mrp = Number(p.mrp || p.price || price);
      const discountPercentage = mrp > price ? ((mrp - price) / mrp) * 100 : 0;
      const inStock = (p.stock ?? 10) > 0 ? 10 : 0;
      const specCount = Array.isArray(p.specifications)
        ? p.specifications.length
        : 0;

      // Smart score: rewards higher discount savings + in-stock availability + rich specs
      const score = discountPercentage * 2 + inStock + specCount * 2;

      if (score > highestScore) {
        highestScore = score;
        bestItem = p;
      }
    });

    return String(bestItem._id || bestItem.id);
  }, [products]);

  // LOAD WISHLIST
  useEffect(() => {
    const loadWishlist = async () => {
      if (isLoggedIn()) {
        try {
          const res = await axios.get(`${API_BASE_URL}/wishlist`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getToken()}`,
            },
          });
          if (res.data.success) {
            const ids = res.data.wishlist.map((item) =>
              String(item.product?._id || item.product),
            );
            setWishedIds(ids);
          }
        } catch (err) {
          handleAuthError(err);
          console.error("Failed to load wishlist from DB:", err);
        }
      } else {
        try {
          const stored = JSON.parse(localStorage.getItem("wishlist") || "[]");
          const ids = stored.map((item) => String(item._id || item.id || item));
          setWishedIds(ids);
        } catch {
          setWishedIds([]);
        }
      }
    };

    loadWishlist();
  }, []);

  // CART HANDLER WITH VACATION MODE GUARD
  const handleCart = async (product) => {
    const pId = product._id || product.id;

    const isVacation =
      product.isVacationMode ||
      product.vendorProfile?.businessStatus === "vacation_mode" ||
      product.vendor?.businessStatus === "vacation_mode";

    if (isVacation) {
      const storeName =
        product.vendorProfile?.storeName ||
        product.vendor?.storeName ||
        "This seller";

      setVacationNotice(
        `"${storeName}" vendor’s products are temporarily unavailable. You can add this item to your Wishlist instead!`,
      );
      setTimeout(() => setVacationNotice(""), 6000);
      return;
    }

    if (isLoggedIn()) {
      try {
        await axios.post(
          `${API_BASE_URL}/cart/add`,
          { productId: pId, quantity: 1 },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getToken()}`,
            },
          },
        );
        window.dispatchEvent(new Event("cartUpdated"));
      } catch (err) {
        handleAuthError(err);
        console.error("Cart DB error:", err);
        if (err.response?.data?.message) {
          setVacationNotice(err.response.data.message);
          setTimeout(() => setVacationNotice(""), 6000);
        }
      }
    } else {
      try {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        const existing = cart.find((item) => (item._id || item.id) === pId);
        const updated = existing
          ? cart.map((item) =>
              (item._id || item.id) === pId
                ? { ...item, quantity: (item.quantity || 1) + 1 }
                : item,
            )
          : [...cart, { ...product, quantity: 1 }];
        localStorage.setItem("cart", JSON.stringify(updated));
        window.dispatchEvent(new Event("cartUpdated"));
      } catch (err) {
        console.error("Cart localStorage error:", err);
      }
    }
  };

  // WISHLIST HANDLER
  const handleWish = async (product) => {
    const pId = String(product._id || product.id);
    if (isLoggedIn()) {
      try {
        const res = await axios.post(
          `${API_BASE_URL}/wishlist/toggle`,
          { productId: pId },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getToken()}`,
            },
          },
        );
        if (res.data.success) {
          setWishedIds(res.data.wishlistIds.map(String));
          window.dispatchEvent(new Event("wishlistUpdated"));
        }
      } catch (err) {
        handleAuthError(err);
        console.error("Wishlist DB error:", err);
      }
    } else {
      try {
        const stored = JSON.parse(localStorage.getItem("wishlist") || "[]");
        const isWished = wishedIds.includes(pId);
        const updated = isWished
          ? stored.filter((item) => String(item._id || item.id || item) !== pId)
          : [...stored, product];
        localStorage.setItem("wishlist", JSON.stringify(updated));
        setWishedIds(
          updated.map((item) => String(item._id || item.id || item)),
        );
        window.dispatchEvent(new Event("wishlistUpdated"));
      } catch (err) {
        console.error("Wishlist localStorage error:", err);
      }
    }
  };

  const featuredProduct = products[0];
  const featuredProductImage = getProductImage(featuredProduct);
  const featuredVendorLogo = featuredProduct
    ? getVendorLogo(featuredProduct.vendor || featuredProduct.vendorProfile)
    : null;
  const featuredVendorName =
    featuredProduct?.vendor?.storeName ||
    featuredProduct?.vendorProfile?.storeName ||
    "Verified Vendor";
  const featuredIsVacation =
    featuredProduct?.isVacationMode ||
    featuredProduct?.vendorProfile?.businessStatus === "vacation_mode" ||
    featuredProduct?.vendor?.businessStatus === "vacation_mode";

  return (
    <main className="bg-background text-foreground relative">
      {/* FLOATING VACATION ALERT TOAST */}
      {vacationNotice && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-slide-up rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-xl text-amber-950 flex items-start gap-3">
          <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs font-semibold leading-relaxed">
            {vacationNotice}
          </div>
          <button
            type="button"
            onClick={() => setVacationNotice("")}
            className="text-amber-700 hover:text-amber-900 transition p-1"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ANNOUNCEMENT BANNER */}
      <div className="bg-[#172f2c] py-2.5 px-4 text-center text-xs font-medium text-white sm:text-sm shadow-inner">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
          <Truck size={16} className="text-amber-300 animate-bounce shrink-0" />
          <span>
            Free Delivery on all orders over{" "}
            <strong className="text-amber-300 font-extrabold text-sm sm:text-base">
              ₹999
            </strong>
          </span>
          <Sparkles
            size={14}
            className="text-amber-300 shrink-0 hidden sm:inline"
          />
        </div>
      </div>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-[#e6eee7] px-4 py-14 md:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-[1.05fr_.95fr]">
          {/* LEFT */}
          <div className="rise">
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-[#287b6d]">
              The considered marketplace
            </p>

            <h1 className="display max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Shop smarter.
              <br />
              Compare better.
              <br />
              <span className="text-[#287b6d]">Buy confidently.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              Discover products from trusted vendors, compare your options, and
              find the right deal — all in one place.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <RouterLink
                to="/shop"
                className="rounded-xl bg-[#287b6d] px-5 py-3 text-sm font-bold text-white shadow-xs transition hover:bg-[#226b60]"
              >
                Explore products
              </RouterLink>

              <RouterLink
                to="/compare"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 hover:border-[#287b6d] hover:text-[#287b6d] transition"
              >
                Compare products
              </RouterLink>
            </div>

            {/* DYNAMIC STATS */}
            <div className="mt-10 flex flex-wrap gap-8 border-t border-slate-200 pt-6">
              <div>
                <p className="display text-xl font-extrabold">
                  {vendors.length || "0"}
                </p>
                <p className="text-xs text-slate-500">trusted vendors</p>
              </div>
              <div>
                <p className="display text-xl font-extrabold">
                  {products.length || "0"}
                </p>
                <p className="text-xs text-slate-500">active products</p>
              </div>
            </div>
          </div>

          {/* RIGHT - FEATURED PRODUCT */}
          <div className="relative rise delay-2">
            {featuredProduct ? (
              <div className="rounded-[1.5rem] bg-[#172f2c] p-5 text-white shadow-[0_20px_50px_rgba(23,47,44,0.18)] sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
                    Smart Pick
                  </p>
                  <div className="flex items-center gap-2">
                    {featuredIsVacation && (
                      <span className="rounded-full bg-amber-500/20 border border-amber-400/40 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                        Temporarily Unavailable
                      </span>
                    )}
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold text-amber-300">
                      Featured
                    </span>
                  </div>
                </div>

                <div className="relative mx-auto flex h-48 w-full max-w-sm items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-teal-900 via-teal-700 to-amber-600 sm:h-52 border border-white/10">
                  {featuredProductImage ? (
                    <img
                      src={featuredProductImage}
                      alt={featuredProduct.name}
                      className="size-full object-cover transition-transform duration-500 hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const fallback = e.currentTarget.nextElementSibling;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                  ) : null}

                  <div
                    className={`size-full items-center justify-center ${
                      featuredProductImage ? "hidden" : "flex"
                    }`}
                  >
                    <span className="display text-[85px] font-extrabold text-white/90 drop-shadow-lg">
                      {getInitials(featuredProduct.name)}
                    </span>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex items-center gap-2">
                    <div className="size-5 rounded-full overflow-hidden bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                      {featuredVendorLogo ? (
                        <img
                          src={featuredVendorLogo}
                          alt={featuredVendorName}
                          className="size-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <Store size={11} className="text-amber-300" />
                      )}
                    </div>
                    <p className="text-xs font-semibold text-amber-300 truncate">
                      {featuredVendorName}
                    </p>
                  </div>

                  <h2 className="display mt-1 text-xl font-extrabold sm:text-2xl truncate">
                    {featuredProduct.name}
                  </h2>

                  <p className="mt-2 text-xs text-white/60 line-clamp-1">
                    {featuredProduct.shortDescription}
                  </p>

                  <p className="mt-1 text-xs text-white/60 line-clamp-1">
                    {featuredProduct.longDescription ||
                      featuredProduct.description}
                  </p>

                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-xl font-extrabold">
                        {formatMoney(
                          featuredProduct.discountPrice ||
                            featuredProduct.price,
                        )}
                      </p>
                      {featuredProduct.price >
                        (featuredProduct.discountPrice || 0) && (
                        <p className="text-xs text-white/40 line-through">
                          {formatMoney(featuredProduct.price)}
                        </p>
                      )}
                    </div>

                    <RouterLink
                      to={`/product/${featuredProduct._id || featuredProduct.id}`}
                      className="rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-900 hover:bg-white/90 transition shadow-xs"
                    >
                      View product
                    </RouterLink>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[1.5rem] bg-[#172f2c] p-8 text-white text-center">
                <ShoppingBag size={40} className="mx-auto text-white/40 mb-3" />
                <p className="text-sm font-bold">Discover Market Products</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CATEGORIES SECTION */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#287b6d]">
              BROWSE BY CATEGORY
            </p>
            <h2 className="display mt-2 text-2xl font-extrabold sm:text-3xl text-slate-900">
              Find your next favourite
            </h2>
          </div>

          <RouterLink
            to="/categories"
            className="hidden items-center gap-1 text-sm font-bold text-[#287b6d] hover:underline sm:flex"
          >
            All categories
            <ArrowRight size={15} />
          </RouterLink>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={32} className="animate-spin text-[#287b6d]" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.slice(0, 6).map((category, index) => {
              const catId = category._id || category.id;
              const slug = (category.slug || category.name || "")
                .toLowerCase()
                .replace(/\s+/g, "-");
              const catImage = getCategoryImage(category);
              const iconText = category.name?.charAt(0).toUpperCase() || "C";

              return (
                <RouterLink
                  key={catId}
                  to={`/shop?category=${slug}`}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-1.5 ${
                    index === 0
                      ? "border-[#287b6d] bg-[#287b6d] text-white shadow-md shadow-[#287b6d]/15"
                      : "border-slate-200 bg-white hover:border-[#287b6d] hover:shadow-md"
                  }`}
                >
                  <div
                    className={`relative size-12 shrink-0 overflow-hidden rounded-xl border transition-transform duration-300 group-hover:scale-105 ${
                      index === 0
                        ? "border-white/20 bg-white/10"
                        : "border-slate-100 bg-slate-100"
                    }`}
                  >
                    {catImage ? (
                      <img
                        src={catImage}
                        alt={category.name}
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-110"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const fallback = e.currentTarget.nextElementSibling;
                          if (fallback) fallback.style.display = "flex";
                        }}
                      />
                    ) : null}

                    <div
                      className={`size-full items-center justify-center font-black text-lg ${
                        catImage ? "hidden" : "flex"
                      } ${index === 0 ? "text-white" : "text-[#287b6d]"}`}
                    >
                      {iconText}
                    </div>
                  </div>

                  <div>
                    <h3 className="mt-3 text-sm font-bold truncate">
                      {category.name}
                    </h3>

                    <p
                      className={`mt-1 line-clamp-2 text-[10px] leading-4 ${
                        index === 0 ? "text-white/70" : "text-slate-500"
                      }`}
                    >
                      {category.description || "Quality marketplace products"}
                    </p>
                  </div>

                  <p
                    className={`mt-3 text-[10px] font-bold ${
                      index === 0 ? "text-white/85" : "text-[#287b6d]"
                    }`}
                  >
                    {category.productsCount || category.products || 0} products
                  </p>
                </RouterLink>
              );
            })}
          </div>
        )}
      </section>

      {/* THE EDIT — PRODUCTS */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#287b6d]">
              The edit
            </p>
            <h2 className="display mt-2 text-2xl font-extrabold sm:text-3xl text-slate-900">
              Good things, selling fast
            </h2>
          </div>

          <RouterLink
            to="/shop"
            className="hidden items-center gap-1 text-sm font-bold text-[#287b6d] hover:underline sm:flex"
          >
            Shop all
            <ArrowRight size={15} />
          </RouterLink>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.slice(0, 4).map((product) => (
            <ProductCard
              key={product._id || product.id}
              product={product}
              onCart={() => handleCart(product)}
              onWish={() => handleWish(product)}
              wished={wishedIds.includes(String(product._id || product.id))}
              onCompare={() => addToCompare(product)}
            />
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={() => navigate("/cart")}
            className="inline-flex items-center gap-2 rounded-xl bg-[#287b6d] px-6 py-3 text-sm font-bold text-white hover:bg-[#226b60] transition shadow-xs"
          >
            <ShoppingBag size={16} />
            View Cart
          </button>
        </div>
      </section>

      {/* CLEAN COMPARISON STRIP WITH DYNAMIC BEST SUGGESTED HIGHLIGHT */}
      <section className="mx-4 my-8 overflow-hidden rounded-[2rem] bg-slate-900 text-white sm:mx-6 lg:mx-auto lg:max-w-7xl">
        <div className="grid gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-12 lg:py-10">
          <div>
            <p className="mono text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">
              Make the call
            </p>
            <h2 className="display mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">
              Less scrolling.
              <br />
              More certainty.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/60">
              Put products side by side. We'll surface the trade-offs so your
              choice feels like yours.
            </p>
            <RouterLink
              to="/compare"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-900 hover:-translate-y-0.5 transition shadow-sm"
            >
              Try compare
              <ArrowRight size={15} />
            </RouterLink>
          </div>

          {/* DYNAMIC 4-PRODUCT COMPARISON GRID: HIGHLIGHTS ONLY THE SUGGESTED ONE */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {products.slice(0, 4).map((product) => {
              const pId = String(product._id || product.id);
              const compImg = getProductImage(product);
              // Dynamic condition: true ONLY for the dynamically calculated best product
              const isSuggested = bestSuggestedId === pId;

              return (
                <div
                  key={pId}
                  className={`relative rounded-2xl p-3 transition-all duration-300 ${
                    isSuggested
                      ? "bg-amber-300 text-slate-900 shadow-lg shadow-amber-400/20 ring-2 ring-amber-400 scale-[1.02]"
                      : "bg-white/10 text-white hover:bg-white/15"
                  }`}
                >
                  {/* Subtle AI Recommended pill for the single winner */}
                  {isSuggested && (
                    <div className="absolute -top-2 right-2 flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-300 shadow-sm border border-amber-300/40">
                      <Crown size={10} className="text-amber-300" />
                      Suggested
                    </div>
                  )}

                  <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center">
                    {compImg ? (
                      <img
                        src={compImg}
                        alt={product.name}
                        className="size-full object-cover transition-transform duration-300 hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const fallback = e.currentTarget.nextElementSibling;
                          if (fallback) fallback.style.display = "flex";
                        }}
                      />
                    ) : null}

                    <div
                      className={`size-full items-center justify-center font-extrabold text-2xl ${
                        compImg ? "hidden" : "flex"
                      } ${isSuggested ? "text-slate-900" : "text-white"}`}
                    >
                      {getInitials(product.name)}
                    </div>
                  </div>

                  <p
                    className="mt-3 line-clamp-1 text-xs font-bold"
                    title={product.name}
                  >
                    {product.name}
                  </p>

                  <p
                    className={`mt-1 line-clamp-2 text-[10px] ${
                      isSuggested ? "text-slate-800" : "text-white/60"
                    }`}
                  >
                    {product.shortDescription || "Quality Marketplace Product"}
                  </p>

                  <p
                    className={`mt-2 text-sm font-extrabold ${
                      isSuggested ? "text-slate-900" : "text-white"
                    }`}
                  >
                    {formatMoney(product.discountPrice || product.price)}

                    {product.price > (product.discountPrice || 0) && (
                      <span
                        className={`block text-xs font-normal line-through ${
                          isSuggested ? "text-slate-700" : "text-white/40"
                        }`}
                      >
                        {formatMoney(product.price)}
                      </span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* VENDORS SECTION */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#287b6d]">
            The people behind it
          </p>
          <h2 className="display mt-2 text-2xl font-extrabold sm:text-3xl text-slate-900">
            Independent stores, properly introduced
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {vendors.slice(0, 4).map((vendor) => {
            const vId = vendor._id || vendor.id;
            const vName = vendor.storeName || vendor.businessName || "Vendor";
            const vLogo = getVendorLogo(vendor);
            const vDesc =
              vendor.storeDescription ||
              vendor.description ||
              "Trusted marketplace store.";

            const isVacation =
              vendor.isVacationMode ||
              vendor.businessStatus === "vacation_mode";

            return (
              <RouterLink
                key={vId}
                to={`/vendor/${vId}`}
                className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:border-[#287b6d] shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center shadow-xs">
                      {vLogo ? (
                        <img
                          src={vLogo}
                          alt={vName}
                          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const fallback = e.currentTarget.nextElementSibling;
                            if (fallback) fallback.style.display = "flex";
                          }}
                        />
                      ) : null}

                      <div
                        className={`size-full items-center justify-center font-extrabold text-[#287b6d] text-base ${
                          vLogo ? "hidden" : "flex"
                        }`}
                      >
                        {getInitials(vName)}
                      </div>
                    </div>

                    {isVacation ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800 border border-amber-200 shrink-0">
                        <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Temporarily Unavailable
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800 border border-emerald-200 shrink-0">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    )}
                  </div>

                  <h3 className="display mt-4 font-extrabold text-slate-900 group-hover:text-[#287b6d] transition truncate">
                    {vName}
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-500 truncate">
                    {vendor.businessType || "Independent Seller"}
                  </p>

                  <p className="mt-2.5 line-clamp-3 text-sm leading-5 text-slate-600">
                    {vDesc}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] font-bold text-slate-700">
                  <span>
                    {vendor.productCount || vendor.productsCount || 0} products
                  </span>
                  <span className="text-[#287b6d] group-hover:translate-x-0.5 transition inline-flex items-center gap-1 text-xs">
                    Visit store <ArrowRight size={12} />
                  </span>
                </div>
              </RouterLink>
            );
          })}
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="grid gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 sm:grid-cols-3">
          <div className="flex gap-3">
            <CheckCircle2 className="mt-0.5 text-[#287b6d]" size={20} />
            <div>
              <p className="text-sm font-bold text-slate-900">
                Trusted vendors
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Every store is reviewed before joining.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <TrendingUp className="mt-0.5 text-[#287b6d]" size={20} />
            <div>
              <p className="text-sm font-bold text-slate-900">
                Compare before buying
              </p>
              <p className="mt-1 text-xs text-slate-500">
                See products side by side.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Heart className="mt-0.5 text-[#287b6d]" size={20} />
            <div>
              <p className="text-sm font-bold text-slate-900">
                Your choices, your way
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Save products and build your wishlist.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
