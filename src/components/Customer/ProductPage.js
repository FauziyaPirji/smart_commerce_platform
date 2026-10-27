import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRoute";
import {
  Heart,
  ShoppingCart,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Store,
  GitCompare,
  Minus,
  Plus,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { addToCompare } from "../../utils/compareUtils";

const API_BASE_URL = "http://localhost:5000/api/customer";

const getToken = () => localStorage.getItem("token") || null;
const isLoggedIn = () => Boolean(getToken());

const formatMoney = (val) => {
  const num = Number(val);
  return isNaN(num) ? "₹0" : `₹${num.toLocaleString("en-IN")}`;
};

const getInitials = (name) => {
  if (!name) return "SC";
  const words = String(name).trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return String(name).slice(0, 2).toUpperCase();
};

const getSafeText = (value, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => getSafeText(item))
      .filter(Boolean)
      .join(", ");
  }
  if (typeof value === "object") {
    if (value.name !== undefined && value.value !== undefined) {
      return `${getSafeText(value.name)}: ${getSafeText(value.value)}`;
    }
    if (value.name !== undefined) return getSafeText(value.name);
    if (value.value !== undefined) return getSafeText(value.value);
    return "";
  }
  return fallback;
};

const ProductPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // INTERACTIVE GALLERY STATE
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [qty, setQty] = useState(1);
  const [alertMsg, setAlertMsg] = useState("");
  const [wishedIds, setWishedIds] = useState([]);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError("");

      try {
        let foundProduct = null;
        try {
          const res = await axios.get(`${API_BASE_URL}/products/${productId}`);
          foundProduct = res.data.product || res.data;
        } catch {
          const res = await axios.get(`${API_BASE_URL}/products`);
          const list = Array.isArray(res.data)
            ? res.data
            : res.data.products || [];
          foundProduct = list.find(
            (item) => String(item._id || item.id) === String(productId),
          );
        }

        if (foundProduct) {
          setProduct(foundProduct);
          setActiveImageIndex(0);
        } else {
          setError("Product not found");
        }
      } catch (err) {
        console.error("Error loading product:", err);
        setError("Failed to load product details.");
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  // Load wishlist IDs
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
            setWishedIds(
              res.data.wishlist.map((item) =>
                String(item.product?._id || item.product),
              ),
            );
          }
        } catch (err) {
          handleAuthError(err);
          console.error("Wishlist fetch error:", err);
        }
      } else {
        try {
          const stored = JSON.parse(localStorage.getItem("wishlist") || "[]");
          setWishedIds(
            stored.map((item) => String(item._id || item.id || item)),
          );
        } catch {
          setWishedIds([]);
        }
      }
    };

    loadWishlist();
  }, []);

  const showAlert = (msg) => {
    setAlertMsg(msg);
    setTimeout(() => {
      setAlertMsg("");
    }, 3500);
  };

  // RESOLVE VENDOR & VACATION MODE
  const vendorObj = typeof product?.vendor === "object" ? product.vendor : null;
  const vendorProfileObj = product?.vendorProfile || {};

  const vendorName =
    vendorProfileObj.storeName ||
    vendorObj?.storeName ||
    `${vendorObj?.firstName || ""} ${vendorObj?.lastName || ""}`.trim() ||
    product?.vendor ||
    "Trusted Vendor";

  const vendorId =
    vendorProfileObj._id ||
    vendorProfileObj.id ||
    vendorObj?._id ||
    vendorObj?.id ||
    product?.vendorId ||
    "";

  const vendorLogo =
    vendorProfileObj.storeLogo ||
    vendorObj?.storeLogo ||
    vendorObj?.logo ||
    vendorObj?.image ||
    null;

  const isVacation = Boolean(
    product?.isVacationMode ||
    product?.canAddToCart === false ||
    vendorProfileObj.businessStatus === "vacation_mode" ||
    vendorObj?.businessStatus === "vacation_mode",
  );

  const handleAddToCart = async () => {
    if (!product) return;

    // Block adding vacation items to cart
    if (isVacation) {
      showAlert(
        `${vendorName} is currently Unavailable and cannot accept orders. You can save this item to your wishlist instead!`,
      );
      return;
    }

    const pId = product._id || product.id;

    if (isLoggedIn()) {
      try {
        await axios.post(
          `${API_BASE_URL}/cart/add`,
          { productId: pId, quantity: qty },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getToken()}`,
            },
          },
        );

        window.dispatchEvent(new Event("cartUpdated"));
        showAlert(
          qty === 1 ? "Added to your cart" : `${qty} items added to your cart`,
        );
      } catch (err) {
        handleAuthError(err);
        console.error("Cart error:", err);
        showAlert("Failed to add product to cart.");
      }
    } else {
      try {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        const existing = cart.find((item) => (item._id || item.id) === pId);
        const updated = existing
          ? cart.map((item) =>
              (item._id || item.id) === pId
                ? { ...item, quantity: (item.quantity || 1) + qty }
                : item,
            )
          : [...cart, { ...product, quantity: qty }];

        localStorage.setItem("cart", JSON.stringify(updated));
        window.dispatchEvent(new Event("cartUpdated"));
        showAlert(
          qty === 1 ? "Added to your cart" : `${qty} items added to your cart`,
        );
      } catch (err) {
        console.error("Cart storage error:", err);
      }
    }
  };

  const handleWishToggle = async () => {
    if (!product) return;
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
        console.error("Wishlist storage error:", err);
      }
    }
  };

  const handleCompareClick = () => {
    if (product) {
      addToCompare(product);
      navigate("/compare");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
        <Loader2 size={36} className="animate-spin text-primary" />
        <p className="text-sm font-semibold">Loading product details...</p>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-screen bg-background px-4 py-20 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-secondary mb-4 text-red-500">
          <AlertCircle size={28} />
        </div>
        <h1 className="display text-2xl font-extrabold">
          {error || "Product not found"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The product you are looking for does not exist or has been removed.
        </p>
        <Link
          to="/shop"
          className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"
        >
          Back to shop
        </Link>
      </main>
    );
  }

  const pId = String(product._id || product.id);

  // RESOLVE IMAGES ARRAY (Cloudinary gallery or single image fallback)
  const imageList =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : product.image
        ? [product.image]
        : [];

  const activeImage = imageList[activeImageIndex] || imageList[0] || null;

  const categoryName =
    typeof product.category === "object"
      ? product.category?.name || "General"
      : product.category || "General";

  const categorySlug =
    typeof product.category === "object"
      ? product.category?.slug ||
        categoryName.toLowerCase().replace(/\s+/g, "-")
      : String(categoryName).toLowerCase().replace(/\s+/g, "-");

  const isWished = wishedIds.includes(pId);
  const sellingPrice = product.discountPrice || product.price || 0;
  const originalPrice = product.mrp || product.price || sellingPrice;

  const discountPercent =
    originalPrice > sellingPrice
      ? Math.round((1 - sellingPrice / originalPrice) * 100)
      : 0;

  const specsList = Array.isArray(product.specifications)
    ? product.specifications
        .map((spec) => {
          if (
            spec !== null &&
            typeof spec === "object" &&
            !Array.isArray(spec)
          ) {
            return {
              name: getSafeText(spec.name, "Specification"),
              value: getSafeText(spec.value),
              isKeyFeature: Boolean(spec.isKeyFeature),
              id: spec._id || `${spec.name}-${spec.value}`,
            };
          }
          return {
            name: "",
            value: getSafeText(spec),
            isKeyFeature: true,
            id: getSafeText(spec),
          };
        })
        .filter((spec) => spec.value || spec.name)
    : [
        {
          name: "Category",
          value: categoryName,
          isKeyFeature: true,
          id: "cat",
        },
        {
          name: "Verification",
          value: "Quality Verified",
          isKeyFeature: true,
          id: "ver",
        },
      ];

  const descriptionText =
    product.longDescription ||
    product.description ||
    product.shortDescription ||
    `The ${getSafeText(product.name, "product")} is designed for customers looking for dependable quality and practical everyday performance.`;

  const stockValue = Number(product.stock || 0);

  return (
    <main className="min-h-screen bg-background">
      {/* BREADCRUMB */}
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary transition">
            Home
          </Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-primary transition">
            Shop
          </Link>
          <span>/</span>
          <Link
            to={`/shop?category=${categorySlug}`}
            className="hover:text-primary transition"
          >
            {categoryName}
          </Link>
          <span>/</span>
          <span className="line-clamp-1 text-foreground font-semibold">
            {getSafeText(product.name)}
          </span>
        </div>
      </div>

      {/* VACATION MODE ALERT BANNER */}
      {isVacation && (
        <div className="mx-auto max-w-7xl px-4 pt-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-amber-900 shadow-xs flex items-start gap-3.5">
            <div className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
              <AlertCircle size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-amber-950">
                  Seller is Temporarily Unavailable
                </h4>
                <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                  Orders Paused
                </span>
              </div>
              <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                <strong>{vendorName}</strong> is currently Unavailable and not
                accepting new orders. You can explore the specifications and
                save this item to your <strong>Wishlist</strong> so you can
                easily purchase it when the store reopens!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TOP PRODUCT SECTION */}
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-6">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr] items-start">
          {/* LEFT: PRO INTERACTIVE IMAGE GALLERY */}
          <div>
            <div className="flex flex-col-reverse sm:flex-row gap-4 items-start">
              {/* THUMBNAIL SELECTOR COLUMN */}
              {imageList.length > 1 && (
                <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-visible w-full sm:w-20 shrink-0 pb-2 sm:pb-0">
                  {imageList.map((imgUrl, index) => {
                    const isActive = activeImageIndex === index;
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setActiveImageIndex(index)}
                        className={`size-16 sm:size-20 shrink-0 rounded-2xl overflow-hidden border bg-white p-1 transition-all duration-200 ${
                          isActive
                            ? "ring-2 ring-primary border-primary shadow-sm"
                            : "border-border hover:border-primary/50 opacity-80 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`${product.name} thumbnail ${index + 1}`}
                          className="size-full object-cover rounded-xl"
                        />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* MAIN LARGE PREVIEW FRAME */}
              <div className="relative aspect-square sm:aspect-4/3 w-full rounded-2xl bg-slate-50 border border-border/80 overflow-hidden flex items-center justify-center p-4 shadow-xs">
                {activeImage ? (
                  <img
                    src={activeImage}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain transition-transform duration-500 hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const fallback = e.currentTarget.nextElementSibling;
                      if (fallback) fallback.style.display = "flex";
                    }}
                  />
                ) : null}

                {/* Initial Fallback if no images are present */}
                <div
                  className={`size-full items-center justify-center bg-gradient-to-br from-teal-900 via-teal-700 to-amber-600 rounded-2xl ${
                    activeImage ? "hidden" : "flex"
                  }`}
                >
                  <span className="display text-8xl sm:text-9xl font-extrabold text-white/90 drop-shadow-md">
                    {getInitials(product.name)}
                  </span>
                </div>

                {/* OVERLAY BADGES */}
                <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
                  <span className="rounded-full bg-slate-900/80 px-3 py-1 text-[10px] font-bold text-white backdrop-blur">
                    {categoryName}
                  </span>

                  {isVacation && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-[10px] font-extrabold text-white shadow-xs">
                      <span className="size-1.5 rounded-full bg-white animate-pulse" />
                      Temporarily Unavailable
                    </span>
                  )}

                  {discountPercent > 0 && (
                    <span className="rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-extrabold text-white shadow-xs">
                      {discountPercent}% OFF
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* TRUST BADGES UNDER GALLERY */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-card p-3 text-center flex items-center justify-center gap-2">
                <ShieldCheck size={18} className="text-primary shrink-0" />
                <p className="text-xs font-bold text-foreground">
                  Verified product
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-3 text-center flex items-center justify-center gap-2">
                <Truck size={18} className="text-primary shrink-0" />
                <p className="text-xs font-bold text-foreground">
                  Fast delivery eligible
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: PRODUCT INFO & PURCHASE CONTROLS */}
          <div>
            {/* VENDOR STORE BADGE WITH LOGO */}
            <div className="flex items-center justify-between gap-4">
              <Link
                to={vendorId ? `/vendor/${vendorId}` : "#"}
                className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline group"
              >
                {vendorLogo ? (
                  <img
                    src={vendorLogo}
                    alt={vendorName}
                    className="size-5 rounded-full object-cover border border-slate-200"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <Store size={15} />
                )}
                <span>{vendorName}</span>
              </Link>

              {isVacation ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold text-amber-800 border border-amber-200">
                  <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Temporarily Unavailable
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-3 py-1 text-[10px] font-bold text-teal-800">
                  <CheckCircle2 size={12} />
                  Verified store
                </span>
              )}
            </div>

            {/* TITLE */}
            <h1 className="display mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              {getSafeText(product.name)}
            </h1>

            {/* PRICING CARD */}
            <div className="mt-6 rounded-2xl bg-secondary p-5">
              <div className="flex flex-wrap items-end gap-3">
                <span className="text-3xl font-extrabold">
                  {formatMoney(sellingPrice)}
                </span>

                {originalPrice > sellingPrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatMoney(originalPrice)}
                  </span>
                )}

                {discountPercent > 0 && (
                  <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-white">
                    Save {formatMoney(originalPrice - sellingPrice)}
                  </span>
                )}
              </div>

              <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles size={12} className="text-primary" />
                Free shipping eligible on orders above ₹999
              </p>
            </div>

            {/* SHORT DESCRIPTION */}
            <p className="mt-6 text-sm leading-6 text-muted-foreground">
              {getSafeText(product.shortDescription, descriptionText)}
            </p>

            {/* KEY HIGHLIGHTS / SPECS */}
            {specsList.length > 0 && (
              <div className="mt-6 rounded-2xl border border-border bg-card p-5">
                <h2 className="display font-bold text-sm">
                  Key specifications
                </h2>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {specsList.map((spec, i) => (
                    <div
                      key={spec.id || i}
                      className="rounded-xl bg-muted px-3 py-2 text-xs font-semibold flex items-center gap-1"
                    >
                      {spec.name ? (
                        <>
                          <span className="text-muted-foreground">
                            {spec.name}:
                          </span>
                          <span className="truncate">{spec.value}</span>
                        </>
                      ) : (
                        <span className="truncate">{spec.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STOCK INDICATOR */}
            <div className="mt-5 flex items-center gap-2">
              {stockValue <= 0 ? (
                <>
                  <span className="size-2 rounded-full bg-red-500" />
                  <span className="text-xs font-bold text-red-600">
                    Out of stock
                  </span>
                </>
              ) : stockValue <= 5 ? (
                <>
                  <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-xs font-bold text-amber-600">
                    Only {stockValue} left in stock
                  </span>
                </>
              ) : (
                <>
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-emerald-700">
                    In stock · Ready to dispatch
                  </span>
                </>
              )}
            </div>

            {/* QUANTITY & WISHLIST */}
            <div className="mt-6 flex items-center gap-3">
              <div className="flex items-center rounded-xl border border-border bg-card">
                <button
                  type="button"
                  onClick={() => setQty((curr) => Math.max(1, curr - 1))}
                  disabled={stockValue <= 0 || isVacation}
                  className="grid size-11 place-items-center hover:bg-muted transition disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Decrease quantity"
                >
                  <Minus size={15} />
                </button>

                <span className="w-10 text-center text-sm font-bold">
                  {qty}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setQty((curr) => Math.min(stockValue || 99, curr + 1))
                  }
                  disabled={stockValue <= 0 || isVacation}
                  className="grid size-11 place-items-center hover:bg-muted transition disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Increase quantity"
                >
                  <Plus size={15} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleWishToggle}
                className={`grid size-11 place-items-center rounded-xl border border-border transition ${
                  isWished
                    ? "text-red-600 border-red-200 bg-red-50"
                    : "text-muted-foreground hover:border-primary"
                }`}
                aria-label="Add to wishlist"
                title={isWished ? "Remove from wishlist" : "Save to wishlist"}
              >
                <Heart size={18} fill={isWished ? "currentColor" : "none"} />
              </button>
            </div>

            {/* ACTION BUTTONS */}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              {isVacation ? (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-5 py-3.5 text-sm font-bold text-amber-800 hover:bg-amber-100 transition shadow-xs"
                  title="Seller is on vacation and temporarily not taking orders. Click for details."
                >
                  <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                  Temporarily Unavailable · Orders Paused
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={stockValue <= 0}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                >
                  <ShoppingCart size={17} />
                  {stockValue <= 0 ? "Out of stock" : "Add to cart"}
                </button>
              )}

              <button
                type="button"
                onClick={handleCompareClick}
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3.5 text-sm font-bold hover:border-primary hover:text-primary transition"
              >
                <GitCompare size={17} />
                Compare
              </button>
            </div>

            {/* ALERT MESSAGE NOTIFICATION */}
            {alertMsg && (
              <div
                className={`mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${
                  isVacation && alertMsg.includes("vacation")
                    ? "bg-amber-100 text-amber-900 border border-amber-200"
                    : "bg-teal-100 text-teal-800"
                }`}
              >
                {isVacation && alertMsg.includes("vacation") ? (
                  <AlertCircle size={17} className="text-amber-700 shrink-0" />
                ) : (
                  <CheckCircle2 size={17} className="text-teal-700 shrink-0" />
                )}
                {alertMsg}
              </div>
            )}

            {/* SERVICE ACCORDIONS */}
            <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
              <div className="flex gap-4 p-4">
                <Truck size={20} className="mt-0.5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-bold">Standard courier delivery</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Delivered directly to your door within 3–5 business days.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4">
                <ShieldCheck
                  size={20}
                  className="mt-0.5 shrink-0 text-primary"
                />
                <div>
                  <p className="text-sm font-bold">Authenticity Guarantee</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Direct from certified merchants with brand warranty support.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FULL PRODUCT DETAILS / SPECIFICATIONS SECTION */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="border-b border-border pb-4">
              <h2 className="display text-2xl font-extrabold">
                Product details
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Everything you need to know before making your choice.
              </p>
            </div>

            <div className="py-6">
              <h3 className="font-bold">Description</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground whitespace-pre-line">
                {getSafeText(descriptionText)}
              </p>
            </div>

            <div className="border-t border-border py-6">
              <h3 className="font-bold mb-4">Complete specifications</h3>
              <div className="divide-y divide-border rounded-xl border border-border">
                <div className="grid grid-cols-2 p-3 text-sm">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-semibold">{categoryName}</span>
                </div>

                <div className="grid grid-cols-2 p-3 text-sm">
                  <span className="text-muted-foreground">Store / Vendor</span>
                  <span className="font-semibold">{vendorName}</span>
                </div>

                <div className="grid grid-cols-2 p-3 text-sm">
                  <span className="text-muted-foreground">Available units</span>
                  <span className="font-semibold">{stockValue} units</span>
                </div>

                {specsList.map((spec, index) => (
                  <div
                    key={spec.id || index}
                    className="grid grid-cols-2 p-3 text-sm"
                  >
                    <span className="text-muted-foreground">
                      {spec.name || `Specification ${index + 1}`}
                    </span>
                    <span className="font-semibold">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR: STORE PARTNER WITH LOGO */}
          <aside>
            <div className="sticky top-24 rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <p className="mono text-[10px] font-bold uppercase tracking-widest text-primary">
                  Store Partner
                </p>
                {isVacation && (
                  <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[9px] font-bold text-amber-800">
                    Temporarily Unavailable
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-center gap-3">
                {/* Real Vendor Store Logo or Initials */}
                <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100">
                  {vendorLogo ? (
                    <img
                      src={vendorLogo}
                      alt={vendorName}
                      className="size-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : null}
                  <div
                    style={{ display: vendorLogo ? "none" : "grid" }}
                    className="size-full place-items-center bg-primary text-sm font-black text-primary-foreground"
                  >
                    {getInitials(vendorName)}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold">{vendorName}</h3>
                  <p className="text-xs text-muted-foreground">
                    {isVacation
                      ? "Temporarily away · Orders paused"
                      : "Verified SmartCommerce merchant"}
                  </p>
                </div>
              </div>

              {vendorId && (
                <Link
                  to={`/vendor/${vendorId}`}
                  className="mt-5 block rounded-xl border border-border px-4 py-3 text-center text-sm font-bold hover:border-primary hover:text-primary transition"
                >
                  Visit store profile
                </Link>
              )}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
};

export default ProductPage;
