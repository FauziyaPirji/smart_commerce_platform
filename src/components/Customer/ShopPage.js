import React, { useMemo, useState, useEffect } from "react";
import {
  Search,
  SlidersHorizontal,
  X,
  Loader2,
  AlertCircle,
  Store,
  Sparkles,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRoute";
import ProductCard from "./ProductCard";
import { addToCompare } from "../../utils/compareUtils";

const API_BASE_URL = "https://smart-commerce-platform-backend.onrender.com/api/customer";

// AUTH HELPERS
const getToken = () => localStorage.getItem("token") || null;
const isLoggedIn = () => Boolean(getToken());

const ShopPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL QUERY PARAMS
  const searchQueryFromURL =
    searchParams.get("search") || searchParams.get("q") || "";
  const categorySlugFromURL = searchParams.get("category") || "";
  const vendorParamFromURL = searchParams.get("vendor") || "";

  // DATA STATE
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // FILTER STATE - Synchronized directly with navbar search query
  const [q, setQ] = useState(searchQueryFromURL);
  const [sort, setSort] = useState("Newest");
  const [showFilters, setShowFilters] = useState(false);

  // WISHLIST STATE
  const [wishedIds, setWishedIds] = useState([]);

  // VACATION NOTICE TOAST
  const [vacationNotice, setVacationNotice] = useState("");

  // SYNC INPUT WHEN NAVBAR SENDS NEW SEARCH QUERY
  useEffect(() => {
    setQ(searchQueryFromURL);
  }, [searchQueryFromURL]);

  // FETCH PRODUCTS & CATEGORIES
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const [prodRes, catRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/products`),
          axios.get(`${API_BASE_URL}/categories`),
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
      } catch (err) {
        console.error("ShopPage fetch error:", err);
        setError("Failed to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // LOAD WISHLIST
  useEffect(() => {
    const loadWishlist = async () => {
      if (isLoggedIn()) {
        try {
          const res = await axios.get(`${API_BASE_URL}/wishlist`, {
            headers: {
              "Content-Type": "Application/json",
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
          console.error("Wishlist load error:", err);
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

  // Find matched category object from URL slug
  const selectedCategory =
    categories.find(
      (cat) =>
        (cat.slug || cat.name?.toLowerCase().replace(/\s+/g, "-")) ===
        categorySlugFromURL,
    ) || null;

  // Category filter handler
  const setCategory = (cat) => {
    const nextParams = new URLSearchParams(searchParams);
    if (!cat) {
      nextParams.delete("category");
    } else {
      const slug = cat.slug || cat.name?.toLowerCase().replace(/\s+/g, "-");
      nextParams.set("category", slug);
    }
    setSearchParams(nextParams);
  };

  // Vendor clear handler
  const clearVendorFilter = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("vendor");
    setSearchParams(nextParams);
  };

  // In-page search input change handler
  const handleSearchChange = (value) => {
    setQ(value);
    const nextParams = new URLSearchParams(searchParams);
    if (!value.trim()) {
      nextParams.delete("search");
      nextParams.delete("q");
    } else {
      nextParams.set("search", value.trim());
    }
    setSearchParams(nextParams, { replace: true });
  };

  // Clear search query
  const clearSearch = () => {
    setQ("");
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("search");
    nextParams.delete("q");
    setSearchParams(nextParams);
  };

  // Clear all active filters
  const clearAllFilters = () => {
    setQ("");
    setSearchParams({});
  };

  // FILTERED & SORTED PRODUCTS
  const filtered = useMemo(() => {
    const activeSearch = (q || searchQueryFromURL || "").trim().toLowerCase();

    let result = products.filter((p) => {
      // 1. Category match
      const matchesCategory =
        !selectedCategory ||
        String(p.category?._id || p.category) === String(selectedCategory._id);

      // 2. Vendor match (?vendor=)
      const pVendorName =
        p.vendorProfile?.storeName ||
        p.vendor?.storeName ||
        (typeof p.vendor === "object"
          ? `${p.vendor?.firstName || ""} ${p.vendor?.lastName || ""}`.trim()
          : String(p.vendor || ""));

      const pVendorId = String(
        p.vendorProfile?._id || p.vendor?._id || p.vendor?.id || p.vendor || "",
      );

      const matchesVendor =
        !vendorParamFromURL ||
        pVendorName.toLowerCase() === vendorParamFromURL.toLowerCase() ||
        pVendorId === vendorParamFromURL;

      // 3. Search match across name, description, category, and vendor
      const catName =
        typeof p.category === "object"
          ? String(p.category?.name || "").toLowerCase()
          : String(p.category || "").toLowerCase();

      const matchesSearch =
        !activeSearch ||
        p.name?.toLowerCase().includes(activeSearch) ||
        p.shortDescription?.toLowerCase().includes(activeSearch) ||
        p.description?.toLowerCase().includes(activeSearch) ||
        catName.includes(activeSearch) ||
        pVendorName.toLowerCase().includes(activeSearch);

      return matchesCategory && matchesVendor && matchesSearch;
    });

    if (sort === "Price low to high") {
      return [...result].sort(
        (a, b) =>
          Number(a.discountPrice || a.price || 0) -
          Number(b.discountPrice || b.price || 0),
      );
    }
    if (sort === "Price high to low") {
      return [...result].sort(
        (a, b) =>
          Number(b.discountPrice || b.price || 0) -
          Number(a.discountPrice || a.price || 0),
      );
    }
    if (sort === "Newest") {
      return [...result].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      );
    }

    return result;
  }, [
    products,
    selectedCategory,
    vendorParamFromURL,
    q,
    searchQueryFromURL,
    sort,
  ]);

  // CART HANDLER WITH VACATION MODE GUARD
  const handleCart = async (product) => {
    const pId = product._id || product.id;

    const isVacation = Boolean(
      product.isVacationMode ||
      product.canAddToCart === false ||
      product.vendorProfile?.businessStatus === "vacation_mode" ||
      product.vendorProfile?.isVacationMode ||
      product.vendor?.businessStatus === "vacation_mode",
    );

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
              "Content-Type": "Application/json",
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
              "Content-Type": "Application/json",
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

  return (
    <main className="min-h-screen bg-background text-foreground relative">
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

      {/* PAGE HEADER */}
      <section className="mx-auto max-w-7xl px-4 pb-6 pt-8 sm:px-6 sm:pt-10 lg:px-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mono mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              The catalogue
            </p>
            <h1 className="display text-4xl font-extrabold tracking-tight sm:text-5xl">
              Shop with a point of view.
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {loading
                ? "Loading products..."
                : `${filtered.length} products found in the catalogue`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Filters Toggle */}
            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold transition hover:border-primary hover:text-primary lg:hidden"
            >
              <SlidersHorizontal size={16} />
              Filters
            </button>

            {/* Sort Dropdown */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
            >
              <option value="Newest">Newest</option>
              <option value="Price low to high">Price low to high</option>
              <option value="Price high to low">Price high to low</option>
            </select>
          </div>
        </div>
      </section>

      {/* SHOP AREA */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          {/* DESKTOP SIDEBAR */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-border bg-card p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Category
                </p>
                {selectedCategory && (
                  <button
                    onClick={() => setCategory(null)}
                    className="text-[11px] font-bold text-primary hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setCategory(null)}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                    !selectedCategory
                      ? "bg-primary font-bold text-white"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  All products
                </button>

                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                      selectedCategory?._id === cat._id
                        ? "bg-primary font-bold text-white"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    {cat.name}
                    <span className="ml-1 text-[10px] opacity-60">
                      ({cat.productsCount || 0})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* PRODUCTS AREA */}
          <div>
            {/* Search Input Box */}
            <div className="mb-4">
              <div className="flex items-center rounded-xl border border-border bg-card px-3 transition focus-within:border-primary">
                <Search size={17} className="shrink-0 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full bg-transparent px-2.5 py-2.5 text-sm outline-none"
                  placeholder="Filter results by product name, brand or category..."
                />
                {q && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="text-muted-foreground hover:text-foreground p-1"
                    title="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* ACTIVE SEARCH FROM NAVBAR BANNER */}
            {searchQueryFromURL && (
              <div className="mb-5 flex items-center justify-between rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 text-foreground">
                <div className="flex items-center gap-2">
                  <Search size={16} className="text-primary shrink-0" />
                  <span className="text-xs font-medium">
                    Showing search results for:{" "}
                    <strong className="text-primary font-extrabold text-sm">
                      &quot;{searchQueryFromURL}&quot;
                    </strong>
                  </span>
                </div>
                <button
                  onClick={clearSearch}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-muted-foreground hover:bg-background hover:text-foreground transition"
                >
                  <X size={14} /> Clear
                </button>
              </div>
            )}

            {/* ACTIVE VENDOR STORE BANNER */}
            {vendorParamFromURL && (
              <div className="mb-5 flex items-center justify-between rounded-2xl bg-slate-900 text-white px-5 py-3.5 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-white/10 flex items-center justify-center font-bold text-amber-300">
                    <Store size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                      Browsing Store Catalogue
                    </p>
                    <p className="mt-0.5 text-sm font-extrabold text-white">
                      {vendorParamFromURL}
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearVendorFilter}
                  className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white transition"
                  title="Show all vendors"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* ACTIVE CATEGORY BANNER */}
            {selectedCategory && (
              <div className="mb-5 flex items-center justify-between rounded-2xl bg-secondary px-4 py-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    Browsing category
                  </p>
                  <p className="mt-1 text-sm font-bold">
                    {selectedCategory.name}
                  </p>
                </div>
                <button
                  onClick={() => setCategory(null)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-background hover:text-foreground"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* MOBILE FILTERS */}
            {showFilters && (
              <div className="mb-6 rounded-2xl border border-border bg-card p-4 lg:hidden">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Category
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setCategory(null);
                      setShowFilters(false);
                    }}
                    className={`rounded-full px-4 py-2 text-xs font-bold ${
                      !selectedCategory
                        ? "bg-primary text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat._id}
                      onClick={() => {
                        setCategory(cat);
                        setShowFilters(false);
                      }}
                      className={`rounded-full px-4 py-2 text-xs font-bold ${
                        selectedCategory?._id === cat._id
                          ? "bg-primary text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PRODUCT COUNT & CLEAR CONTROLS */}
            {!loading && !error && (
              <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
                <p>
                  Showing{" "}
                  <span className="font-bold text-foreground">
                    {filtered.length}
                  </span>{" "}
                  products
                </p>
                {(q || vendorParamFromURL || selectedCategory) && (
                  <button
                    onClick={clearAllFilters}
                    className="font-bold text-primary hover:underline"
                  >
                    Reset all filters
                  </button>
                )}
              </div>
            )}

            {/* LOADING STATE */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
                <Loader2 size={32} className="animate-spin text-primary" />
                <p className="text-sm">Loading products...</p>
              </div>
            )}

            {/* ERROR STATE */}
            {!loading && error && (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-red-500">
                <AlertCircle size={32} />
                <p className="text-sm font-semibold">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
                >
                  Retry
                </button>
              </div>
            )}

            {/* PRODUCT GRID */}
            {!loading && !error && filtered.length > 0 && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((product) => (
                  <ProductCard
                    key={product._id || product.id}
                    product={product}
                    onCart={() => handleCart(product)}
                    onWish={() => handleWish(product)}
                    wished={wishedIds.includes(
                      String(product._id || product.id),
                    )}
                    onCompare={() => addToCompare(product)}
                  />
                ))}
              </div>
            )}

            {/* EMPTY STATE */}
            {!loading && !error && filtered.length === 0 && (
              <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-20 text-center">
                <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-secondary">
                  <Search size={24} className="text-primary" />
                </div>
                <h2 className="display mt-5 text-2xl font-extrabold">
                  No matching products found
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  {q
                    ? `We couldn't find any products matching "${q}". Try checking your spelling or use more general keywords.`
                    : "No products match the selected filters."}
                </p>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
                >
                  Clear all filters & search
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default ShopPage;
