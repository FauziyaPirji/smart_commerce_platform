import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRoute";
import {
  ShoppingCart,
  ArrowRight,
  Trash2,
  Minus,
  Plus,
  ShieldCheck,
  Truck,
  PackageCheck,
  Loader2,
  AlertCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Heart,
} from "lucide-react";

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
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return String(name).slice(0, 2).toUpperCase();
};

const getProductImage = (product) => {
  if (!product) return null;
  if (Array.isArray(product.images) && product.images.length > 0)
    return product.images[0];
  return (
    product.image ||
    (typeof product.images === "string" ? product.images : null)
  );
};

// Resolve vendor logo from a product's populated vendor object or vendorProfile
const getVendorLogo = (product, vendorProfile) => {
  if (vendorProfile?.storeLogo) return vendorProfile.storeLogo;
  if (!product) return null;
  const vendor = product.vendor;
  if (!vendor || typeof vendor !== "object") return null;
  return vendor.storeLogo || vendor.logo || null;
};

// Re-hydrate guest localStorage cart items with live product + vendor status.
// This fixes stale vacation mode snapshots — if a vendor was on vacation when item
// was saved but has since reopened, this will correctly show them as available.
const rehydrateGuestCart = async (cartItems) => {
  const results = await Promise.allSettled(
    cartItems.map(async (item) => {
      const pid = item.product?._id || item.product?.id;
      if (!pid) return item;
      try {
        const res = await axios.get(`${API_BASE_URL}/products/${pid}`);
        if (res.data?.success && res.data?.product) {
          const live = res.data.product;
          // Always compute from live businessStatus — never trust the stored snapshot
          const businessStatus =
            live.businessStatus ||
            live.vendor?.businessStatus ||
            "accepting_orders";
          const isVacationMode = businessStatus !== "accepting_orders";
          const vendorLogo =
            live.vendor?.storeLogo || live.vendor?.logo || null;
          return {
            ...item,
            product: {
              ...item.product,
              stock: live.stock ?? item.product?.stock,
              isVacationMode,
              businessStatus,
              vendor: live.vendor
                ? { ...live.vendor, storeLogo: vendorLogo, businessStatus }
                : item.product?.vendor,
            },
            isVacationMode,
            isServiceable: !isVacationMode,
            unserviceableReason: isVacationMode
              ? "Seller is Temporarily Unavailable and cannot fulfill orders right now."
              : null,
          };
        }
      } catch (_) {
        // Silently fail — item stays visible with its last known state
      }
      return item;
    }),
  );
  return results
    .map((r) => (r.status === "fulfilled" ? r.value : null))
    .filter(Boolean);
};

const CartPage = () => {
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rehydrating, setRehydrating] = useState(false);
  const [error, setError] = useState("");
  const [imageErrors, setImageErrors] = useState({});
  const [vendorLogoErrors, setVendorLogoErrors] = useState({});
  const [savingToWishlist, setSavingToWishlist] = useState({});

  const handleImageError = (id) =>
    setImageErrors((prev) => ({ ...prev, [id]: true }));

  const handleVendorLogoError = (vendorName) =>
    setVendorLogoErrors((prev) => ({ ...prev, [vendorName]: true }));

  const fetchCart = async () => {
    setLoading(true);
    setError("");
    if (isLoggedIn()) {
      try {
        const res = await axios.get(`${API_BASE_URL}/cart`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
        });
        if (res.data?.success) {
          setCartItems(res.data.cart || []);
        } else {
          setCartItems([]);
        }
      } catch (err) {
        handleAuthError(err);
        setError("Failed to load cart. Please try again.");
      } finally {
        setLoading(false);
      }
    } else {
      // Step 1: Render immediately from localStorage so cart feels instant
      let normalized = [];
      try {
        const stored = JSON.parse(localStorage.getItem("cart") || "[]");
        normalized = stored.map((item) => ({
          product: item,
          quantity: item.quantity || 1,
          // Use any previously re-hydrated vacation status if stored,
          // otherwise start optimistic (false) — re-hydration will correct it
          isVacationMode: item.isVacationMode || false,
          isServiceable: !item.isVacationMode,
          unserviceableReason: item.isVacationMode
            ? "Seller is Temporarily Unavailable."
            : null,
        }));
      } catch (_) {
        normalized = [];
      }
      setCartItems(normalized);
      setLoading(false);
      // Step 2: Always re-hydrate live status — even if cart is empty (nothing to do then)
      if (normalized.length > 0) {
        setRehydrating(true);
        try {
          const enriched = await rehydrateGuestCart(normalized);
          setCartItems(enriched);
          // Persist the enriched vacation status back to localStorage so the
          // NEXT page load shows correct status instantly before re-hydration
          const updatedStored = enriched.map((item) => ({
            ...(item.product || {}),
            quantity: item.quantity || 1,
            isVacationMode: item.isVacationMode || false,
            businessStatus: item.product?.businessStatus || "accepting_orders",
          }));
          localStorage.setItem("cart", JSON.stringify(updatedStored));
        } catch (_) {
          // Silent fail — user still sees their cart
        } finally {
          setRehydrating(false);
        }
      }
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // UPDATE QUANTITY
  const handleQty = async (productId, delta) => {
    const item = cartItems.find(
      (ci) =>
        String(ci.product?._id || ci.product?.id || ci.product) ===
        String(productId),
    );
    if (!item) return;

    const availableStock = item.product?.stock ?? Infinity;
    const currentQty = item.quantity || 1;
    const newQty = currentQty + delta;

    if (newQty < 1) return;
    if (delta > 0 && newQty > availableStock) return;

    if (isLoggedIn()) {
      try {
        const res = await axios.put(
          `${API_BASE_URL}/cart/${productId}`,
          { quantity: newQty },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getToken()}`,
            },
          },
        );
        if (res.data.success) {
          setCartItems((prev) =>
            prev.map((ci) => {
              const pId = ci.product?._id || ci.product?.id;
              return String(pId) === String(productId)
                ? { ...ci, quantity: newQty }
                : ci;
            }),
          );
          window.dispatchEvent(new Event("cartUpdated"));
        }
      } catch (err) {
        handleAuthError(err);
      }
    } else {
      try {
        const stored = JSON.parse(localStorage.getItem("cart") || "[]");
        const updated = stored.map((p) => {
          const pId = p._id || p.id;
          return String(pId) === String(productId)
            ? { ...p, quantity: newQty }
            : p;
        });
        localStorage.setItem("cart", JSON.stringify(updated));
        setCartItems((prev) =>
          prev.map((ci) => {
            const pId = ci.product?._id || ci.product?.id;
            return String(pId) === String(productId)
              ? { ...ci, quantity: newQty }
              : ci;
          }),
        );
        window.dispatchEvent(new Event("cartUpdated"));
      } catch (_) {}
    }
  };

  // REMOVE ITEM
  const handleRemove = async (productId) => {
    if (isLoggedIn()) {
      try {
        const res = await axios.delete(`${API_BASE_URL}/cart/${productId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
        });
        if (res.data.success) {
          setCartItems((prev) =>
            prev.filter(
              (ci) =>
                String(ci.product?._id || ci.product?.id) !== String(productId),
            ),
          );
          window.dispatchEvent(new Event("cartUpdated"));
        }
      } catch (err) {
        handleAuthError(err);
      }
    } else {
      try {
        const stored = JSON.parse(localStorage.getItem("cart") || "[]");
        const updated = stored.filter(
          (p) => String(p._id || p.id) !== String(productId),
        );
        localStorage.setItem("cart", JSON.stringify(updated));
        setCartItems((prev) =>
          prev.filter(
            (ci) =>
              String(ci.product?._id || ci.product?.id) !== String(productId),
          ),
        );
        window.dispatchEvent(new Event("cartUpdated"));
      } catch (_) {}
    }
  };

  // SAVE TO WISHLIST + REMOVE FROM CART
  // For vacation mode items: adds product to wishlist then removes it from cart.
  const handleSaveToWishlist = async (productId) => {
    setSavingToWishlist((prev) => ({ ...prev, [productId]: true }));
    if (isLoggedIn()) {
      try {
        const res = await axios.post(
          `${API_BASE_URL}/wishlist/toggle`,
          { productId },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getToken()}`,
            },
          },
        );
        if (res.data.success) {
          // If toggle removed it (was already in wishlist), re-add it
          if (res.data.added === false) {
            await axios.post(
              `${API_BASE_URL}/wishlist/toggle`,
              { productId },
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${getToken()}`,
                },
              },
            );
          }
          // Remove from cart after saving to wishlist
          await handleRemove(productId);
        }
      } catch (err) {
        handleAuthError(err);
      } finally {
        setSavingToWishlist((prev) => ({ ...prev, [productId]: false }));
      }
    } else {
      // Guest: persist full product object to localStorage wishlist
      try {
        const cartItem = cartItems.find(
          (ci) =>
            String(ci.product?._id || ci.product?.id) === String(productId),
        );
        if (cartItem?.product) {
          const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
          const alreadyExists = wishlist.some(
            (p) => String(p._id || p.id) === String(productId),
          );
          if (!alreadyExists) {
            wishlist.push({ ...cartItem.product, quantity: 1 });
            localStorage.setItem("wishlist", JSON.stringify(wishlist));
          }
        }
        // Remove from cart after saving to wishlist
        handleRemove(productId);
      } catch (_) {
        // Silent fail
      } finally {
        setSavingToWishlist((prev) => ({ ...prev, [productId]: false }));
      }
    }
  };

  // CHECKOUT GUARD
  const handleProceedToCheckout = (e) => {
    if (hasCheckoutBlocker) {
      e.preventDefault();
      return;
    }
    if (!isLoggedIn()) {
      e.preventDefault();
      sessionStorage.setItem("redirectAfterLogin", "/checkout");
      navigate("/login");
    } else {
      navigate("/checkout");
    }
  };

  // STOCK VALIDATIONS — vacation items are excluded to avoid double-flagging
  const itemsWithStockIssues = cartItems.filter((item) => {
    if (item.isVacationMode) return false;
    const stock = item.product?.stock;
    if (stock === undefined || stock === null) return false;
    return stock <= 0 || (item.quantity || 1) > stock;
  });
  const hasStockIssues = itemsWithStockIssues.length > 0;

  // VACATION MODE VALIDATIONS
  const vacationItems = cartItems.filter((item) => item.isVacationMode);
  const hasVacationItems = vacationItems.length > 0;
  const hasCheckoutBlocker = hasStockIssues || hasVacationItems;

  // CALCULATIONS — vacation items excluded since they cannot be ordered
  const orderableItems = cartItems.filter((item) => !item.isVacationMode);

  const subtotal = orderableItems.reduce((total, item) => {
    const price = item.product?.discountPrice || item.product?.price || 0;
    return total + Number(price) * (item.quantity || 1);
  }, 0);

  const delivery = subtotal >= 999 || subtotal === 0 ? 0 : 100;
  const total = Math.max(0, subtotal + delivery);
  const totalItems = cartItems.reduce(
    (acc, item) => acc + (item.quantity || 1),
    0,
  );
  const orderableItemCount = orderableItems.reduce(
    (acc, item) => acc + (item.quantity || 1),
    0,
  );

  // Group by vendor — also capture logo and vacation status per group
  const vendorGroups = cartItems.reduce((acc, item) => {
    const prod = item.product || {};
    const vendorName =
      typeof prod.vendor === "object"
        ? prod.vendor?.storeName ||
          `${prod.vendor?.firstName || ""} ${prod.vendor?.lastName || ""}`.trim() ||
          "Store"
        : prod.vendor || "Store";

    if (!acc[vendorName]) {
      acc[vendorName] = { items: [], isVacationMode: false, vendorLogo: null };
    }

    acc[vendorName].items.push(item);
    if (item.isVacationMode) acc[vendorName].isVacationMode = true;

    // Capture vendor logo from the first item that has one
    if (!acc[vendorName].vendorLogo) {
      acc[vendorName].vendorLogo = getVendorLogo(
        item.product,
        item.vendorProfile,
      );
    }

    return acc;
  }, {});

  const vendorsList = Object.keys(vendorGroups);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="mb-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                Shopping cart
              </p>
              <h1 className="display mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Your cart
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Review your products from trusted SmartCommerce vendors before
                checkout.
              </p>
            </div>

            {!loading && cartItems.length > 0 && (
              <div className="rounded-xl border border-border bg-card px-4 py-2.5">
                <p className="text-xs text-muted-foreground">Cart items</p>
                <p className="mt-0.5 text-sm font-bold">
                  {totalItems} {totalItems === 1 ? "item" : "items"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* VACATION MODE GLOBAL BANNER */}
        {hasVacationItems && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-xs">
            <Clock className="mt-0.5 size-5 shrink-0 text-amber-600" />
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                {vacationItems.length === 1
                  ? "1 item is"
                  : `${vacationItems.length} items are`}{" "}
                from a seller Temporarily Unavailable
              </h4>
              <p className="mt-0.5 text-xs leading-relaxed text-amber-700">
                These items are temporarily unavailable and excluded from your
                order total. Remove them or save to wishlist — the seller will
                be back soon!
              </p>
            </div>
          </div>
        )}

        {/* STOCK ISSUES GLOBAL BANNER */}
        {hasStockIssues && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 shadow-xs">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-600" />
            <div>
              <h4 className="text-sm font-bold text-red-800">
                Stock Attention Required
              </h4>
              <p className="mt-0.5 text-xs leading-relaxed text-red-700">
                One or more items are out of stock or exceed available
                inventory. Please adjust quantities or remove unavailable items
                to continue.
              </p>
            </div>
          </div>
        )}

        {/* GUEST LIVE STATUS CHECK INDICATOR */}
        {rehydrating && (
          <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 size={13} className="animate-spin" />
            Checking live product &amp; seller availability…
          </div>
        )}

        {/* LOADING */}
        {loading ? (
          <section className="flex flex-col items-center justify-center gap-3 rounded-[1.5rem] border border-border bg-card px-6 py-20 text-center text-slate-400 shadow-sm">
            <Loader2 size={36} className="animate-spin text-primary" />
            <p className="text-sm font-semibold">Loading shopping cart...</p>
          </section>
        ) : error ? (
          <section className="flex flex-col items-center justify-center gap-3 rounded-[1.5rem] border border-border bg-card px-6 py-20 text-center text-red-500 shadow-sm">
            <AlertCircle size={32} />
            <p className="text-sm font-semibold">{error}</p>
          </section>
        ) : cartItems.length === 0 ? (
          /* EMPTY CART */
          <section className="rounded-[1.5rem] border border-dashed border-border bg-card px-6 py-20 text-center shadow-sm">
            <div className="mx-auto grid size-20 place-items-center rounded-[1.5rem] bg-secondary text-primary">
              <ShoppingCart size={34} />
            </div>
            <h2 className="display mt-6 text-2xl font-extrabold">
              Your cart is empty
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              Looks like you haven't added anything yet. Explore products from
              multiple independent vendors and find something you love.
            </p>
            <Link
              to="/shop"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
            >
              Start shopping
              <ArrowRight size={16} />
            </Link>
          </section>
        ) : (
          /* CART CONTENT */
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            {/* LEFT — VENDOR GROUPS */}
            <div className="space-y-5">
              {vendorsList.map((vendorName) => {
                const group = vendorGroups[vendorName];
                const groupItems = group.items;
                const groupIsVacation = group.isVacationMode;
                const vendorLogo = group.vendorLogo;

                return (
                  <section
                    key={vendorName}
                    className={`overflow-hidden rounded-[1.25rem] border shadow-sm ${
                      groupIsVacation
                        ? "border-amber-200 bg-amber-50/30"
                        : "border-border bg-card"
                    }`}
                  >
                    {/* Vendor Header */}
                    <div
                      className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 ${
                        groupIsVacation
                          ? "border-amber-200 bg-amber-100/60"
                          : "border-border bg-secondary/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Vendor Logo — real image with initials fallback */}
                        {vendorLogo && !vendorLogoErrors[vendorName] ? (
                          <img
                            src={vendorLogo}
                            alt={vendorName}
                            className={`size-10 shrink-0 rounded-xl border object-cover ${
                              groupIsVacation
                                ? "border-amber-200 opacity-70 grayscale-[20%]"
                                : "border-border"
                            }`}
                            onError={() => handleVendorLogoError(vendorName)}
                          />
                        ) : (
                          <div
                            className={`grid size-10 shrink-0 place-items-center rounded-xl text-sm font-bold ${
                              groupIsVacation
                                ? "bg-amber-300 text-amber-900"
                                : "bg-primary text-primary-foreground"
                            }`}
                          >
                            {getInitials(vendorName)}
                          </div>
                        )}

                        <div>
                          <h3 className="text-sm font-bold">{vendorName}</h3>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {groupItems.length}{" "}
                            {groupItems.length === 1 ? "product" : "products"}{" "}
                            from this store
                          </p>
                        </div>
                      </div>

                      {groupIsVacation ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-200 px-3 py-1 text-[10px] font-bold text-amber-800">
                          <Clock size={11} />
                          Temporarily unavailable
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-1 text-[10px] font-bold text-teal-800">
                          <ShieldCheck size={12} />
                          Verified store
                        </span>
                      )}
                    </div>

                    {/* Per-vendor vacation notice */}
                    {groupIsVacation && (
                      <div className="mx-5 mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-100 px-4 py-3">
                        <Clock className="mt-0.5 size-4 shrink-0 text-amber-600" />
                        <p className="text-xs leading-relaxed text-amber-800">
                          <strong>
                            This seller is Temporarily Unavailable
                          </strong>{" "}
                          and cannot accept new orders right now. These items
                          are excluded from your order total. You can remove
                          them or save them to your wishlist.
                        </p>
                      </div>
                    )}

                    {/* Products */}
                    <div className="px-5">
                      {groupItems.map((ci, index) => {
                        const product = ci.product || {};
                        const pId = product._id || product.id;
                        const quantity = ci.quantity || 1;
                        const price =
                          product.discountPrice || product.price || 0;
                        const mrp = product.mrp || product.price || price;
                        const productTotal = Number(price) * quantity;
                        const isItemVacation = Boolean(ci.isVacationMode);

                        const categoryName =
                          typeof product.category === "object"
                            ? product.category?.name
                            : product.category || "General";

                        const mark = product.mark || getInitials(product.name);
                        const tone =
                          product.tone ||
                          "from-teal-800 via-teal-700 to-amber-600";

                        const productImg = getProductImage(product);
                        const hasValidImg = Boolean(
                          productImg && !imageErrors[pId],
                        );

                        // Stock checks only apply to non-vacation items
                        const stock = product.stock;
                        const isOutOfStock =
                          !isItemVacation && stock !== undefined && stock <= 0;
                        const exceedsStock =
                          !isItemVacation &&
                          stock !== undefined &&
                          stock > 0 &&
                          quantity > stock;
                        const isMaxStockReached =
                          !isItemVacation &&
                          stock !== undefined &&
                          quantity >= stock;

                        return (
                          <article
                            key={pId}
                            className={`group flex gap-4 py-5 ${
                              index !== 0
                                ? `border-t ${groupIsVacation ? "border-amber-200" : "border-border"}`
                                : ""
                            } ${isItemVacation ? "opacity-70" : isOutOfStock ? "opacity-80" : ""}`}
                          >
                            {/* PRODUCT IMAGE */}
                            <Link
                              to={`/product/${pId}`}
                              className="relative shrink-0"
                            >
                              <div
                                className={`relative grid size-24 place-items-center overflow-hidden rounded-xl border transition-transform group-hover:scale-[1.02] sm:size-28 ${
                                  isItemVacation
                                    ? "border-amber-200 bg-amber-50"
                                    : "border-border bg-slate-100"
                                }`}
                              >
                                {hasValidImg ? (
                                  <img
                                    src={productImg}
                                    alt={product.name || "Product"}
                                    className={`size-full object-cover ${
                                      isItemVacation ? "grayscale-[25%]" : ""
                                    }`}
                                    onError={() => handleImageError(pId)}
                                    loading="lazy"
                                  />
                                ) : (
                                  <div
                                    className={`flex size-full items-center justify-center bg-gradient-to-br ${
                                      isItemVacation
                                        ? "from-amber-300 via-amber-200 to-yellow-100"
                                        : tone
                                    }`}
                                  >
                                    <span className="display text-4xl font-extrabold text-white/90 sm:text-5xl">
                                      {mark}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {isItemVacation && (
                                <span className="absolute bottom-1.5 left-1.5 right-1.5 rounded-md bg-amber-500/90 py-0.5 text-center text-[9px] font-bold uppercase text-white backdrop-blur-xs">
                                  Seller Temporarily Unavailable
                                </span>
                              )}
                              {isOutOfStock && (
                                <span className="absolute bottom-1.5 left-1.5 right-1.5 rounded-md bg-rose-600/90 py-0.5 text-center text-[9px] font-bold uppercase text-white backdrop-blur-xs">
                                  Out of stock
                                </span>
                              )}
                            </Link>

                            {/* PRODUCT INFO */}
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                                {categoryName}
                              </p>

                              <Link to={`/product/${pId}`}>
                                <h3 className="display mt-1 line-clamp-2 text-sm font-bold leading-5 hover:text-primary sm:text-base">
                                  {product.name}
                                </h3>
                              </Link>

                              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                                {product.shortDescription ||
                                  product.specs ||
                                  "Quality item"}
                              </p>

                              {/* STATUS LABEL */}
                              <div className="mt-2">
                                {isItemVacation ? (
                                  <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                                    <Clock size={12} />
                                    Temporarily unavailable
                                  </span>
                                ) : stock !== undefined ? (
                                  isOutOfStock ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600">
                                      <XCircle size={13} /> Currently out of
                                      stock
                                    </span>
                                  ) : exceedsStock ? (
                                    <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-600">
                                      <AlertTriangle size={13} />
                                      Only {stock} available! Please reduce
                                      quantity.
                                    </span>
                                  ) : stock <= 10 ? (
                                    <span className="text-[11px] font-semibold text-amber-600">
                                      Only {stock} left in stock
                                    </span>
                                  ) : (
                                    <span className="text-[11px] font-semibold text-emerald-600">
                                      In stock
                                    </span>
                                  )
                                ) : null}
                              </div>

                              {/* CONTROLS */}
                              <div className="mt-3 flex flex-wrap items-center gap-3">
                                {/* Qty stepper is hidden for vacation items — ordering is blocked */}
                                {!isItemVacation && (
                                  <div className="flex items-center overflow-hidden rounded-lg border border-border bg-background">
                                    <button
                                      type="button"
                                      onClick={() => handleQty(pId, -1)}
                                      disabled={quantity <= 1}
                                      className="grid size-8 place-items-center transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                                      aria-label="Decrease quantity"
                                    >
                                      <Minus size={13} />
                                    </button>
                                    <span className="grid min-w-9 place-items-center text-xs font-bold">
                                      {quantity}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleQty(pId, 1)}
                                      disabled={
                                        isOutOfStock || isMaxStockReached
                                      }
                                      title={
                                        isMaxStockReached
                                          ? `Only ${stock} available in stock`
                                          : "Increase quantity"
                                      }
                                      className="grid size-8 place-items-center transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                                      aria-label="Increase quantity"
                                    >
                                      <Plus size={13} />
                                    </button>
                                  </div>
                                )}

                                {!isItemVacation &&
                                  isMaxStockReached &&
                                  !isOutOfStock && (
                                    <span className="text-[10px] italic text-slate-400">
                                      (Max available reached)
                                    </span>
                                  )}

                                <button
                                  type="button"
                                  onClick={() => handleRemove(pId)}
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition hover:text-red-600"
                                >
                                  <Trash2 size={13} />
                                  Remove
                                </button>

                                {isItemVacation && (
                                  <button
                                    type="button"
                                    onClick={() => handleSaveToWishlist(pId)}
                                    disabled={savingToWishlist[pId]}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {savingToWishlist[pId] ? (
                                      <>
                                        <Loader2
                                          size={12}
                                          className="animate-spin"
                                        />
                                        Saving…
                                      </>
                                    ) : (
                                      <>
                                        <Heart size={12} />
                                        Save to wishlist
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* PRICE */}
                            <div className="shrink-0 text-right">
                              {isItemVacation ? (
                                <p className="text-xs font-semibold italic text-amber-500">
                                  Excluded
                                </p>
                              ) : (
                                <>
                                  <p className="display text-base font-extrabold sm:text-lg">
                                    {formatMoney(productTotal)}
                                  </p>
                                  {mrp > price && (
                                    <p className="mt-1 text-[10px] text-muted-foreground line-through">
                                      {formatMoney(Number(mrp) * quantity)}
                                    </p>
                                  )}
                                  {quantity > 1 && (
                                    <p className="mt-1 text-[10px] text-muted-foreground">
                                      {formatMoney(price)} × {quantity}
                                    </p>
                                  )}
                                </>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                );
              })}

              <Link
                to="/shop"
                className="inline-flex items-center gap-2 pt-1 text-sm font-bold text-primary hover:underline"
              >
                ← Continue shopping
              </Link>
            </div>

            {/* RIGHT — ORDER SUMMARY */}
            <aside className="h-fit lg:sticky lg:top-24">
              <div className="overflow-hidden rounded-[1.25rem] border border-border bg-card shadow-sm">
                <div className="border-b border-border px-6 py-5">
                  <h2 className="display text-xl font-extrabold">
                    Order summary
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {orderableItemCount} orderable{" "}
                    {orderableItemCount === 1 ? "item" : "items"} from{" "}
                    {vendorsList.length}{" "}
                    {vendorsList.length === 1 ? "vendor" : "vendors"}
                  </p>
                </div>

                <div className="px-6 py-5">
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-semibold">
                        {formatMoney(subtotal)}
                      </span>
                    </div>

                    {hasVacationItems && (
                      <div className="flex justify-between gap-4">
                        <span className="flex items-center gap-1 text-xs text-amber-600">
                          <Clock size={12} /> Vacation items excluded
                        </span>
                        <span className="text-xs font-semibold text-amber-600">
                          {vacationItems.length}{" "}
                          {vacationItems.length === 1 ? "item" : "items"}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Delivery</span>
                      <span className="font-semibold text-primary">
                        {delivery === 0 ? "FREE" : formatMoney(delivery)}
                      </span>
                    </div>

                    {subtotal < 999 && subtotal > 0 && (
                      <div className="rounded-xl bg-secondary p-3.5">
                        <div className="flex gap-2">
                          <Truck
                            size={16}
                            className="mt-0.5 shrink-0 text-primary"
                          />
                          <p className="text-xs leading-5 text-muted-foreground">
                            Add{" "}
                            <strong className="text-foreground">
                              {formatMoney(999 - subtotal)}
                            </strong>{" "}
                            more to unlock{" "}
                            <strong className="text-foreground">
                              free delivery
                            </strong>
                            .
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="border-t border-border pt-4">
                      <div className="flex items-center justify-between">
                        <span className="font-bold">Total</span>
                        <span className="display text-2xl font-extrabold">
                          {formatMoney(total)}
                        </span>
                      </div>
                      <p className="mt-1 text-right text-[10px] text-muted-foreground">
                        Inclusive of applicable taxes
                      </p>
                    </div>
                  </div>

                  {hasVacationItems && (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                      <p className="flex items-center gap-1.5 font-bold">
                        <Clock size={14} /> Vacation items blocking checkout
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-amber-700">
                        Remove or save vacation-mode items to wishlist to
                        proceed.
                      </p>
                    </div>
                  )}

                  {hasStockIssues && (
                    <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                      <p className="flex items-center gap-1.5 font-bold">
                        <AlertCircle size={14} /> Cannot proceed to checkout
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed">
                        Please resolve stock issues for highlighted products
                        first.
                      </p>
                    </div>
                  )}

                  {/* CHECKOUT BUTTON */}
                  <button
                    type="button"
                    disabled={hasCheckoutBlocker || cartItems.length === 0}
                    onClick={handleProceedToCheckout}
                    className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold shadow-xs transition ${
                      hasCheckoutBlocker || cartItems.length === 0
                        ? "cursor-not-allowed bg-slate-300 text-slate-500"
                        : "bg-primary text-primary-foreground hover:opacity-90"
                    }`}
                  >
                    Proceed to checkout
                    <ArrowRight size={16} />
                  </button>

                  {/* TRUST BADGES */}
                  <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-5">
                    <div className="flex gap-2">
                      <Truck
                        size={16}
                        className="mt-0.5 shrink-0 text-primary"
                      />
                      <div>
                        <p className="text-[11px] font-bold">Fast delivery</p>
                        <p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">
                          Across India
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <ShieldCheck
                        size={16}
                        className="mt-0.5 shrink-0 text-primary"
                      />
                      <div>
                        <p className="text-[11px] font-bold">Secure checkout</p>
                        <p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">
                          Protected payments
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
                    <PackageCheck size={13} />
                    Secure payments · Easy returns
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
};

export default CartPage;
