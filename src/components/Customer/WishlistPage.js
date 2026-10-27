import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRoute";
import {
  Heart,
  ShoppingCart,
  Trash2,
  ArrowRight,
  Store,
  Star,
  ShieldCheck,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000/api/customer";
const BACKEND_URL = "http://localhost:5000";

// AUTH HELPERS
const getToken = () => localStorage.getItem("token") || null;
const isLoggedIn = () => Boolean(getToken());

// HELPERS
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

// RESOLVE VENDOR LOGO HELPER
const getVendorLogo = (product) => {
  if (!product) return null;
  return (
    product.vendorProfile?.storeLogo ||
    product.vendor?.storeLogo ||
    product.vendor?.logo ||
    product.vendor?.image ||
    null
  );
};

// RESOLVE VACATION MODE HELPER (LIVE REAL-TIME CHECK)
const isProductOnVacation = (product) => {
  if (!product) return false;

  const status =
    product.vendorProfile?.businessStatus ||
    (typeof product.vendor === "object"
      ? product.vendor?.businessStatus
      : null) ||
    product.businessStatus;

  // 1. If actively accepting orders, it is NEVER on vacation
  if (status === "accepting_orders") {
    return false;
  }

  // 2. Only return true if explicitly in vacation mode
  if (status === "vacation_mode") {
    return true;
  }

  // 3. Fallback to boolean flag only if businessStatus is absent
  return product.isVacationMode === true;
};

// DEEP IMAGE RESOLUTION HELPER
const getProductImage = (product) => {
  if (!product) return null;

  let raw = null;

  if (Array.isArray(product.images) && product.images.length > 0) {
    raw = product.images[0];
  } else if (product.image) {
    raw = product.image;
  } else if (typeof product.images === "string") {
    raw = product.images;
  } else if (product.productImage) {
    raw = product.productImage;
  } else if (product.coverImage) {
    raw = product.coverImage;
  } else if (product.thumbnail) {
    raw = product.thumbnail;
  }

  if (raw && typeof raw === "object") {
    raw = raw.url || raw.secure_url || raw.path || raw.src || null;
  }

  if (!raw || typeof raw !== "string") return null;

  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("data:")
  ) {
    return raw;
  }

  const cleanPath = raw.startsWith("/") ? raw : `/${raw}`;
  return `${BACKEND_URL}${cleanPath}`;
};

const WishlistPage = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageErrors, setImageErrors] = useState({});

  // Vacation Alert Toast State
  const [vacationNotice, setVacationNotice] = useState(null);

  useEffect(() => {
    if (!vacationNotice) return;
    const timer = setTimeout(() => setVacationNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [vacationNotice]);

  // FETCH & RE-HYDRATE WISHLIST (SOLVES GUEST LOCALSTORAGE STALENESS)
  const fetchWishlist = async () => {
    setLoading(true);
    setError("");

    if (isLoggedIn()) {
      try {
        const res = await axios.get(`${API_BASE_URL}/wishlist`, {
          headers: {
            "Content-Type": "Application/json",
            Authorization: `Bearer ${getToken()}`,
          },
        });
        if (res.data && res.data.success) {
          const rawItems = res.data.wishlist || res.data.data || [];
          const prods = rawItems
            .map((item) => {
              if (item && item.product && typeof item.product === "object") {
                return { ...item.product, wishlistDate: item.addedAt };
              }
              return item;
            })
            .filter(Boolean);
          setWishlist(prods);
        } else {
          setWishlist([]);
        }
      } catch (err) {
        handleAuthError(err);
        console.error("Wishlist fetch error:", err);
        setError("Failed to load wishlist.");
      } finally {
        setLoading(false);
      }
    } else {
      // GUEST USER: Read local items AND fetch live updates from backend
      try {
        const stored = JSON.parse(localStorage.getItem("wishlist") || "[]");
        const rawProds = stored
          .map((item) => {
            if (item && item.product && typeof item.product === "object") {
              return item.product;
            }
            return item;
          })
          .filter(Boolean);

        if (rawProds.length === 0) {
          setWishlist([]);
          setLoading(false);
          return;
        }

        // Live Re-hydration: query live products to refresh seller status & stock
        try {
          const prodRes = await axios.get(`${API_BASE_URL}/products`);
          const liveList = Array.isArray(prodRes.data)
            ? prodRes.data
            : prodRes.data.products || [];

          const freshWishlist = rawProds.map((storedItem) => {
            const sId = String(storedItem._id || storedItem.id);
            const liveMatch = liveList.find(
              (p) => String(p._id || p.id) === sId,
            );

            if (liveMatch) {
              return {
                ...storedItem,
                ...liveMatch,
                // Fresh live vendor state overrides stale stored snapshot
                vendor: liveMatch.vendor,
                vendorProfile: liveMatch.vendorProfile,
                businessStatus:
                  liveMatch.vendorProfile?.businessStatus ||
                  liveMatch.vendor?.businessStatus ||
                  "accepting_orders",
                isVacationMode: Boolean(liveMatch.isVacationMode),
                stock: liveMatch.stock,
                price: liveMatch.price,
                discountPrice: liveMatch.discountPrice,
              };
            }
            return storedItem;
          });

          setWishlist(freshWishlist);
          // Overwrite stale localStorage snapshot with the live data
          localStorage.setItem("wishlist", JSON.stringify(freshWishlist));
        } catch (apiErr) {
          console.warn(
            "Could not rehydrate live wishlist items, showing cached data:",
            apiErr,
          );
          setWishlist(rawProds);
        }
      } catch (err) {
        console.error("Local wishlist load error:", err);
        setWishlist([]);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  // REMOVE FROM WISHLIST
  const handleRemoveWish = async (product) => {
    const pId = String(product._id || product.id);

    if (isLoggedIn()) {
      try {
        const res = await axios.post(
          `${API_BASE_URL}/wishlist/toggle`,
          { productId: pId },
          {
            headers: {
              "Content-Type": "Application/json",
              Authorization: `Bearer ${getToken()}`,
            },
          },
        );
        if (res.data.success) {
          setWishlist((prev) =>
            prev.filter((item) => String(item._id || item.id) !== pId),
          );
          window.dispatchEvent(new Event("wishlistUpdated"));
        }
      } catch (err) {
        handleAuthError(err);
        console.error("Remove wish error:", err);
      }
    } else {
      try {
        const stored = JSON.parse(localStorage.getItem("wishlist") || "[]");
        const updated = stored.filter((item) => {
          const itemId = String(
            item._id || item.id || item.product?._id || item,
          );
          return itemId !== pId;
        });
        localStorage.setItem("wishlist", JSON.stringify(updated));
        setWishlist(updated);
        window.dispatchEvent(new Event("wishlistUpdated"));
      } catch (err) {
        console.error("Local remove wish error:", err);
      }
    }
  };

  // ADD TO CART
  const handleAddToCart = async (product) => {
    const isVacation = isProductOnVacation(product);

    const vendorName =
      typeof product.vendor === "object"
        ? product.vendor?.storeName ||
          `${product.vendor?.firstName || ""} ${product.vendor?.lastName || ""}`.trim() ||
          "This vendor"
        : product.vendor || "This vendor";

    if (isVacation) {
      setVacationNotice({
        vendorName,
        productName: product.name || product.title || "This item",
      });
      return;
    }

    const pId = product._id || product.id;

    if (isLoggedIn()) {
      try {
        await axios.post(
          `${API_BASE_URL}/cart/add`,
          { productId: pId, quantity: 1 },
          {
            headers: {
              "Content-Type": "Application/json",
              Authorization: `Bearer ${getToken()}`,
            },
          },
        );
        window.dispatchEvent(new Event("cartUpdated"));
      } catch (err) {
        handleAuthError(err);
        console.error("Cart DB error:", err);
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
        console.error("Cart storage error:", err);
      }
    }
  };

  return (
    <main className="min-h-screen bg-background relative">
      {/* FLOATING VACATION NOTICE TOAST */}
      {vacationNotice && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4 text-amber-900 shadow-xl backdrop-blur-md">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
                <AlertCircle size={18} />
              </div>
              <div className="flex-1 pr-2">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
                  Seller Temporarily Away
                </p>
                <p className="mt-1 text-xs leading-relaxed text-amber-800">
                  <span className="font-bold text-amber-950">
                    {vacationNotice.vendorName}
                  </span>{" "}
                  is currently on vacation mode and cannot accept new orders
                  right now. We'll keep this item safely saved in your wishlist!
                </p>
              </div>
              <button
                type="button"
                onClick={() => setVacationNotice(null)}
                className="rounded-lg p-1 text-amber-600 hover:bg-amber-100 transition"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <section className="mx-auto max-w-7xl px-4 pb-6 pt-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mono text-[10px] uppercase tracking-[0.2em] text-primary font-bold">
              Your collection
            </p>

            <h1 className="display mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Your wishlist.
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Keep the products you love in one place and come back whenever
              you're ready.
            </p>
          </div>

          {!loading && wishlist.length > 0 && (
            <div className="rounded-full bg-secondary px-4 py-2 text-xs font-bold text-primary">
              {wishlist.length} {wishlist.length === 1 ? "item" : "items"}
            </div>
          )}
        </div>
      </section>

      {/* LOADING */}
      {loading ? (
        <section className="mx-auto max-w-7xl px-4 py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-sm font-semibold">Loading saved items...</p>
        </section>
      ) : error ? (
        <section className="mx-auto max-w-7xl px-4 py-16 flex flex-col items-center justify-center gap-3 text-red-500">
          <AlertCircle size={32} />
          <p className="text-sm font-semibold">{error}</p>
        </section>
      ) : wishlist.length === 0 ? (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-[1.5rem] border border-dashed border-border bg-card px-6 py-20 text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-secondary text-primary">
              <Heart size={30} />
            </div>

            <h2 className="display mt-6 text-2xl font-bold">
              Nothing saved yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              When you find something you love, tap the heart icon and it will
              appear here.
            </p>

            <Link
              to="/shop"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"
            >
              Explore products
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      ) : (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {wishlist.map((product, idx) => {
              const pId = String(product._id || product.id || idx);
              const sellingPrice = Number(
                product.discountPrice || product.price || 0,
              );
              const originalPrice = Number(
                product.mrp || product.price || sellingPrice,
              );
              const discount =
                originalPrice > sellingPrice
                  ? Math.round((1 - sellingPrice / originalPrice) * 100)
                  : 0;

              const vendorName =
                typeof product.vendor === "object"
                  ? product.vendor?.storeName ||
                    `${product.vendor?.firstName || ""} ${product.vendor?.lastName || ""}`.trim() ||
                    "Vendor"
                  : product.vendor || "Vendor";

              const categoryName =
                typeof product.category === "object"
                  ? product.category?.name
                  : product.category || "General";

              const mark =
                product.mark || getInitials(product.name || product.title);
              const tone =
                product.tone || "from-teal-800 via-teal-700 to-amber-600";

              const productImg = getProductImage(product);
              const hasValidImg = Boolean(productImg && !imageErrors[pId]);

              // Check if vendor is in vacation mode using live rehydrated status
              const isVacation = isProductOnVacation(product);
              const vendorLogo = getVendorLogo(product);
              const stock = Number(product.stock ?? 10);

              return (
                <article
                  key={pId}
                  className="group overflow-hidden rounded-[1.25rem] border border-border bg-card transition hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between"
                >
                  {/* Product Visual */}
                  <div className="relative p-3">
                    <Link to={`/product/${pId}`} className="block">
                      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-slate-100 border border-slate-200/60">
                        {hasValidImg ? (
                          <img
                            src={productImg}
                            alt={product.name || product.title || "Product"}
                            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={() => {
                              setImageErrors((prev) => ({
                                ...prev,
                                [pId]: true,
                              }));
                            }}
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className={`flex size-full items-center justify-center bg-gradient-to-br ${tone}`}
                          >
                            <span className="display text-[72px] font-extrabold text-white/90 drop-shadow-sm transition duration-300 group-hover:scale-110">
                              {mark}
                            </span>
                          </div>
                        )}

                        {/* VACATION MODE BADGE: Only rendered if vendor is truly on vacation */}
                        {isVacation && (
                          <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-amber-500/90 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm backdrop-blur-xs">
                            <span className="size-1.5 rounded-full bg-white animate-pulse" />
                            Temporarily Unavailable
                          </span>
                        )}

                        <span className="absolute bottom-3 right-3 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-xs">
                          {categoryName}
                        </span>
                      </div>
                    </Link>

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveWish(product)}
                      className="absolute right-6 top-6 grid size-10 place-items-center rounded-full bg-white/95 text-red-600 shadow-sm transition hover:bg-red-50 hover:scale-110"
                      aria-label="Remove from wishlist"
                    >
                      <Heart size={18} fill="currentColor" />
                    </button>

                    {/* Discount Tag */}
                    {discount > 0 && (
                      <span className="absolute bottom-6 left-6 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground shadow-xs">
                        {discount}% OFF
                      </span>
                    )}
                  </div>

                  {/* Product Information */}
                  <div className="px-5 pb-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Vendor branding with logo */}
                      <div className="flex items-center gap-1.5 mb-1">
                        {vendorLogo ? (
                          <img
                            src={vendorLogo}
                            alt={vendorName}
                            className="size-4.5 rounded-full object-cover border border-slate-200"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="grid size-4.5 place-items-center rounded-full bg-primary/10 text-primary text-[8px] font-bold">
                            {getInitials(vendorName)}
                          </div>
                        )}
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary truncate max-w-[160px]">
                          {vendorName}
                        </span>
                        {isVacation && (
                          <span className="ml-auto rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 border border-amber-200/60">
                            Away
                          </span>
                        )}
                      </div>

                      {/* Name */}
                      <Link to={`/product/${pId}`}>
                        <h2 className="display mt-1 line-clamp-2 text-base font-bold leading-5 transition group-hover:text-primary">
                          {product.name || product.title}
                        </h2>
                      </Link>

                      {/* Specs / Description */}
                      <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">
                        {product.shortDescription ||
                          product.specs ||
                          "Quality product"}
                      </p>
                    </div>

                    <div>
                      {/* Price */}
                      <div className="mt-4 flex items-end gap-2">
                        <span className="display text-lg font-extrabold">
                          {formatMoney(sellingPrice)}
                        </span>
                        {originalPrice > sellingPrice && (
                          <span className="text-xs text-muted-foreground line-through">
                            {formatMoney(originalPrice)}
                          </span>
                        )}
                      </div>

                      {/* Stock */}
                      <div className="mt-3 flex items-center gap-1.5">
                        <span
                          className={`size-1.5 rounded-full ${
                            stock <= 0
                              ? "bg-red-500"
                              : stock < 10
                                ? "bg-amber-500"
                                : "bg-green-500"
                          }`}
                        />
                        <span
                          className={`text-[10px] font-semibold ${
                            stock <= 0
                              ? "text-red-600"
                              : stock < 10
                                ? "text-amber-600"
                                : "text-green-700"
                          }`}
                        >
                          {stock <= 0
                            ? "Out of stock"
                            : stock < 10
                              ? `Only ${stock} left`
                              : "In stock"}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex gap-2">
                        {isVacation ? (
                          <button
                            type="button"
                            onClick={() => handleAddToCart(product)}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-3 text-xs font-bold text-amber-800 transition hover:bg-amber-100 hover:border-amber-300"
                            title="Seller is on vacation. Click for details."
                          >
                            <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                            Temporarily Unavailable
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddToCart(product)}
                            disabled={stock <= 0}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-3 py-3 text-xs font-bold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <ShoppingCart size={15} />
                            {stock <= 0 ? "Out of stock" : "Add to cart"}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveWish(product)}
                          className="grid size-11 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                          aria-label="Remove item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Bottom Trust Section */}
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                <Heart size={17} />
              </div>
              <div>
                <p className="text-xs font-bold">Saved for later</p>
                <p className="text-[10px] text-muted-foreground">
                  Your favourites stay here
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                <ShieldCheck size={17} />
              </div>
              <div>
                <p className="text-xs font-bold">Trusted vendors</p>
                <p className="text-[10px] text-muted-foreground">
                  Verified SmartCommerce stores
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                <ShoppingCart size={17} />
              </div>
              <div>
                <p className="text-xs font-bold">Ready when you are</p>
                <p className="text-[10px] text-muted-foreground">
                  Move saved items to your cart anytime
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
};

export default WishlistPage;
