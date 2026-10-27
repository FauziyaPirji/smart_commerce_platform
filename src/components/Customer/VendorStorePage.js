import React, { useMemo, useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRoute";
import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Package,
  Search,
  ShieldCheck,
  Star,
  Truck,
  Users,
  Loader2,
  AlertCircle,
  Globe,
  X,
  Palmtree,
  Store,
} from "lucide-react";

import ProductCard from "./ProductCard";

const API_BASE_URL = "https://smart-commerce-platform-backend.onrender.com/api/customer";

// AUTH HELPERS
const getToken = () => localStorage.getItem("token") || null;
const isLoggedIn = () => Boolean(getToken());

const getInitials = (name) => {
  if (!name) return "SC";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const VendorStorePage = () => {
  const { vendorId } = useParams();

  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("Featured");
  const [wishedIds, setWishedIds] = useState([]);

  // Vacation Notice Toast
  const [vacationNotice, setVacationNotice] = useState("");

  // FETCH VENDOR & PRODUCTS
  useEffect(() => {
    const fetchStoreData = async () => {
      setLoading(true);
      setError("");
      try {
        const [venRes, prodRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/vendors`).catch(() => ({ data: [] })),
          axios.get(`${API_BASE_URL}/products`).catch(() => ({ data: [] })),
        ]);

        // Process Vendors
        const venData = venRes.data;
        const venList = Array.isArray(venData)
          ? venData
          : venData.vendors || venData.data || [];

        const foundVendor = venList.find(
          (item) =>
            String(item._id || item.id) === String(vendorId) ||
            String(item.user?._id || item.user) === String(vendorId),
        );

        if (!foundVendor) {
          setError("Store not found");
          setLoading(false);
          return;
        }

        setVendor(foundVendor);

        const isVendorInVacation =
          foundVendor.isVacationMode ||
          foundVendor.businessStatus === "vacation_mode";

        // Process Products for this vendor
        const prodData = prodRes.data;
        const prodList = Array.isArray(prodData)
          ? prodData
          : prodData.products || prodData.data || [];

        const vendorProds = prodList
          .filter((p) => {
            const vRef = p.vendor?._id || p.vendor?.id || p.vendor;
            return (
              String(vRef) === String(vendorId) ||
              String(vRef) === String(foundVendor._id) ||
              String(vRef) ===
                String(foundVendor.user?._id || foundVendor.user) ||
              String(p.vendorId) === String(vendorId)
            );
          })
          .map((prod) => ({
            ...prod,
            // Propagate vendor's vacation status to all products
            isVacationMode: isVendorInVacation || Boolean(prod.isVacationMode),
            canAddToCart: !isVendorInVacation,
            vendorProfile: {
              storeName: foundVendor.storeName,
              storeLogo: foundVendor.storeLogo,
              businessStatus: foundVendor.businessStatus,
              isVacationMode: isVendorInVacation,
            },
          }));

        setProducts(vendorProds);
      } catch (err) {
        console.error("Error fetching vendor store data:", err);
        setError("Failed to load store information.");
      } finally {
        setLoading(false);
      }
    };

    if (vendorId) fetchStoreData();
  }, [vendorId]);

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
          console.error("Wishlist error:", err);
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

  // CART HANDLER WITH VACATION GUARD
  const handleCart = async (product) => {
    const isVacation = Boolean(
      vendor?.isVacationMode ||
      vendor?.businessStatus === "vacation_mode" ||
      product.isVacationMode ||
      product.canAddToCart === false,
    );

    if (isVacation) {
      const sName = vendor?.storeName || "This seller";
      setVacationNotice(
        `"${sName}" vendor’s products are temporarily unavailable. You can add this item to your Wishlist instead!`,
      );
      setTimeout(() => setVacationNotice(""), 6000);
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

  // WISHLIST HANDLER (Always accessible)
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
        console.error("Wishlist error:", err);
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

  // CATEGORIES EXTRACTED FROM PRODUCTS
  const categories = useMemo(() => {
    const unique = [
      ...new Set(
        products
          .map((p) =>
            typeof p.category === "object" ? p.category?.name : p.category,
          )
          .filter(Boolean),
      ),
    ];
    return ["All", ...unique];
  }, [products]);

  // FILTER + SEARCH + SORT
  const filteredProducts = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    let result = products.filter((product) => {
      const catName =
        typeof product.category === "object"
          ? product.category?.name
          : product.category;

      const matchesCategory = category === "All" || catName === category;
      const matchesSearch = product.name?.toLowerCase().includes(searchValue);

      return matchesCategory && matchesSearch;
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

    return result;
  }, [products, category, search, sort]);

  const clearFilters = () => {
    setSearch("");
    setCategory("All");
    setSort("Featured");
  };

  // LOADING / NOT FOUND STATES
  if (loading) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
        <Loader2 size={36} className="animate-spin text-primary" />
        <p className="text-sm font-semibold">Loading store...</p>
      </main>
    );
  }

  if (error || !vendor) {
    return (
      <main className="min-h-screen bg-background">
        <section className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-secondary text-primary">
              <Package size={28} />
            </div>
            <h1 className="display mt-5 text-2xl font-extrabold">
              {error || "Store not found"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The store you are looking for does not exist or has been removed.
            </p>
            <Link
              to="/shop"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:opacity-90"
            >
              <ArrowLeft size={16} />
              Explore Marketplace
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const storeName = vendor.storeName || vendor.businessName || "Vendor Store";
  const storeLogo =
    vendor.storeLogo ||
    vendor.logo ||
    vendor.image ||
    vendor.user?.image ||
    null;
  const initials = vendor.initials || getInitials(storeName);
  const city = vendor.businessAddress?.city || vendor.city || "India";
  const description =
    vendor.storeDescription ||
    vendor.description ||
    "Verified SmartCommerce seller.";

  const isVacation = Boolean(
    vendor.isVacationMode || vendor.businessStatus === "vacation_mode",
  );

  return (
    <main className="min-h-screen bg-background relative">
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

      {/* BACK TO STORES */}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft size={16} />
          Back to all products
        </Link>
      </div>

      {/* STORE INFORMATION CARD */}
      <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[1.5rem] border border-border bg-card p-5 sm:p-7 lg:p-8 shadow-xs">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 flex-col gap-5 sm:flex-row">
              {/* REAL STORE LOGO / PHOTO DISPLAY */}
              <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm sm:size-24 flex items-center justify-center">
                {storeLogo ? (
                  <img
                    src={storeLogo}
                    alt={storeName}
                    className="size-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const fallback = e.currentTarget.nextElementSibling;
                      if (fallback) fallback.style.display = "flex";
                    }}
                  />
                ) : null}

                {/* Fallback to Initials */}
                <div
                  className={`size-full items-center justify-center font-black text-white text-2xl sm:text-3xl bg-primary ${
                    storeLogo ? "hidden" : "flex"
                  }`}
                >
                  {initials}
                </div>
              </div>

              {/* NAME + DETAILS + VACATION BADGE */}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                    {storeName}
                  </h1>

                  <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200 px-2.5 py-1 text-[11px] font-bold text-teal-800">
                    <CheckCircle2 size={13} className="text-teal-600" />
                    Verified
                  </span>

                  {/* VACATION MODE BADGE */}
                  {isVacation ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[11px] font-bold text-amber-800">
                      <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Temporarily Unavailable
                    </span>
                  ) : (
                    <></>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MapPin size={14} />
                    {city}
                  </span>
                  {vendor.website && (
                    <a
                      href={
                        vendor.website.startsWith("http")
                          ? vendor.website
                          : `https://${vendor.website}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-muted-foreground hover:text-primary transition"
                    >
                      <Globe size={14} />
                      {vendor.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* STORE VACATION NOTICE BANNER */}
          {isVacation && (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-amber-950 flex items-start gap-3">
              <Palmtree size={22} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-900">
                  {storeName} vendor’s products are temporarily unavailable.
                </p>
                <p className="mt-0.5 text-xs text-amber-800 leading-relaxed">
                  This seller is temporarily taking a break and paused receiving
                  new orders. You can freely browse their catalog, explore
                  specifications, and save items to your{" "}
                  <strong>Wishlist</strong> to purchase once they return!
                </p>
              </div>
            </div>
          )}

          {/* DESCRIPTION */}
          <div className="mt-6 max-w-4xl">
            <p className="text-sm leading-7 text-muted-foreground sm:text-[15px]">
              {description}
            </p>
          </div>

          {/* STORE STATS */}
          <div className="mt-7 grid grid-cols-2 gap-5 border-t border-border pt-6 sm:grid-cols-3">
            <StoreStat
              icon={Package}
              value={filteredProducts.length}
              label="Products in store"
            />
            <StoreStat
              icon={Users}
              value={vendor.productCount || products.length || "10+"}
              label="Active listings"
            />
            <StoreStat
              icon={ShieldCheck}
              value={vendor.businessType || "Verified Seller"}
              label="Business Type"
            />
          </div>
        </div>
      </section>

      {/* PRODUCT COLLECTION */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mono text-[10px] uppercase tracking-[0.2em] text-primary font-bold">
              Store collection
            </p>
            <h2 className="display mt-2 text-3xl font-extrabold tracking-tight">
              Shop {storeName}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {isVacation
                ? "Browse items below and save your favorites to your wishlist."
                : "Explore products available directly from this store."}
            </p>
          </div>

          {/* SEARCH + SORT */}
          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
            <div className="flex min-w-0 items-center rounded-xl border border-border bg-card px-3 sm:min-w-[260px]">
              <Search size={17} className="shrink-0 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search this store..."
                className="w-full bg-transparent px-3 py-2.5 text-sm outline-none"
              />
            </div>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
            >
              <option value="Featured">Featured</option>
              <option value="Price low to high">Price low to high</option>
              <option value="Price high to low">Price high to low</option>
            </select>
          </div>
        </div>

        {/* CATEGORY FILTER */}
        {categories.length > 1 && (
          <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition ${
                  category === item
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        )}

        {/* PRODUCT COUNT */}
        <div className="mb-5 mt-5 flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground">
            Showing{" "}
            <span className="font-bold text-foreground">
              {filteredProducts.length}
            </span>{" "}
            products
          </p>

          {(search || category !== "All" || sort !== "Featured") && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-bold text-primary hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* PRODUCT GRID */}
        {filteredProducts.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product._id || product.id}
                product={product}
                onCart={() => handleCart(product)}
                onWish={() => handleWish(product)}
                wished={wishedIds.includes(String(product._id || product.id))}
                onCompare={() => {}}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card px-6 py-20 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-secondary text-primary">
              <Package size={26} />
            </div>
            <h3 className="display mt-5 text-lg font-bold">
              No products found
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Try another search or category filter.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      {/* STORE PROMISE */}
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="rounded-[1.5rem] bg-[#203b42] p-6 text-white sm:p-8">
          <div className="grid gap-8 md:grid-cols-2">
            <PromiseItem
              icon={ShieldCheck}
              title="Verified store"
              text="Every store on SmartCommerce goes through our rigorous seller verification process."
            />
            <PromiseItem
              icon={Truck}
              title="Reliable delivery"
              text="Orders are securely packaged and dispatched by the store with SmartCommerce buyer protection."
            />
          </div>
        </div>
      </section>
    </main>
  );
};

function StoreStat({ icon: Icon, value, label }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
        <Icon size={17} />
      </div>
      <div>
        <p className="text-sm font-extrabold">{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function PromiseItem({ icon: Icon, title, text }) {
  return (
    <div className="flex gap-4">
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-white">
        <Icon size={19} />
      </div>
      <div>
        <h3 className="font-bold">{title}</h3>
        <p className="mt-1 text-sm leading-5 text-white/60">{text}</p>
      </div>
    </div>
  );
}

export default VendorStorePage;
