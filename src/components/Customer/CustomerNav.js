import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  Menu,
  Search,
  Heart,
  ShoppingCart,
  UserRound,
  X,
  LogOut,
  User,
  Package,
  LogIn,
  Loader2,
  ArrowRight,
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000/api/customer";

const formatMoney = (val) => {
  const num = Number(val);
  return isNaN(num) ? "₹0" : `₹${num.toLocaleString("en-IN")}`;
};

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

const CustomerNav = ({ cartCount = 0, wishCount = 0 }) => {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  // Search States
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Sync search input with URL parameter on /shop?search=...
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get("search") || params.get("q") || "";
    if (location.pathname === "/shop") {
      setQ(searchParam);
    }
  }, [location.pathname, location.search]);

  // Load user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Error parsing stored user:", e);
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setUserMenuOpen(false);
    setShowDropdown(false);
  }, [location]);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    const handleOutside = (e) => {
      if (
        desktopSearchRef.current &&
        !desktopSearchRef.current.contains(e.target) &&
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") setShowDropdown(false);
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Live Auto-Suggestion Search
  useEffect(() => {
    const query = q.trim();
    if (!query || query.length < 1) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        // Fetch products
        const res = await axios.get(
          `${API_BASE_URL}/products?search=${encodeURIComponent(query)}`,
        );
        const data = res.data;
        const allProducts = Array.isArray(data)
          ? data
          : data.products || data.data || [];

        // Dual Filtering: Ensures accurate results even if backend ignores query param
        const lowerQ = query.toLowerCase();
        const matches = allProducts.filter((p) => {
          const name = String(p.name || "").toLowerCase();
          const cat =
            typeof p.category === "object"
              ? String(p.category?.name || "").toLowerCase()
              : String(p.category || "").toLowerCase();
          const desc = String(
            p.description || p.shortDescription || "",
          ).toLowerCase();

          return (
            name.includes(lowerQ) ||
            cat.includes(lowerQ) ||
            desc.includes(lowerQ)
          );
        });

        setSuggestions(matches.slice(0, 5));
        setShowDropdown(true);
      } catch (err) {
        console.error("Search fetch error:", err);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [q]);

  // Form Submit Handler
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setShowDropdown(false);

    const query = q.trim();
    if (!query) {
      navigate("/shop");
      return;
    }

    navigate(`/shop?search=${encodeURIComponent(query)}`);
    setOpen(false);
  };

  // Click on a specific product from dropdown
  const handleSelectProduct = (productId) => {
    setShowDropdown(false);
    setOpen(false);
    navigate(`/product/${productId}`);
  };

  // Clear query button
  const handleClear = () => {
    setQ("");
    setSuggestions([]);
    setShowDropdown(false);
  };

  // Sign out
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setUserMenuOpen(false);
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur shadow-2xs">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3.5">
        {/* Mobile Toggle Button */}
        <button
          type="button"
          className="rounded-xl p-2 text-slate-700 hover:bg-slate-100 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Logo */}
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2"
          onClick={() => {
            setOpen(false);
            setShowDropdown(false);
          }}
        >
          <span className="text-xl font-black tracking-tight text-slate-900">
            Smart<span className="text-[#287b6d]">Commerce</span>
          </span>
        </Link>

        {/* Desktop Search Bar */}
        <div
          ref={desktopSearchRef}
          className="relative mx-auto hidden max-w-xl flex-1 md:block"
        >
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center rounded-xl border border-slate-300 bg-slate-50 px-3.5 transition focus-within:border-[#287b6d] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#287b6d]/10"
          >
            <Search size={18} className="text-slate-400 shrink-0" />

            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0 || q.trim().length > 0) {
                  setShowDropdown(true);
                }
              }}
              placeholder="Search products, categories, stores…"
              className="w-full border-0 bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />

            {/* Clear Button */}
            {q && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-slate-400 hover:text-slate-700 transition shrink-0"
              >
                <X size={15} />
              </button>
            )}

            {/* Loading or Search Button */}
            {isSearching ? (
              <Loader2
                size={16}
                className="animate-spin text-[#287b6d] ml-1 shrink-0"
              />
            ) : (
              <button
                type="submit"
                className="ml-1 rounded-lg bg-[#287b6d] p-1.5 text-white hover:bg-[#226b60] transition shrink-0"
                title="Search"
              >
                <Search size={14} />
              </button>
            )}
          </form>

          {/* Search Dropdown with Solid Visible Background */}
          {showDropdown && q.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              {suggestions.length > 0 ? (
                <div className="p-2">
                  <div className="flex items-center justify-between px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    <span>Products Found</span>
                    <span>{suggestions.length} items</span>
                  </div>

                  <div className="divide-y divide-slate-100 mt-1">
                    {suggestions.map((item) => {
                      const pId = item._id || item.id;
                      const img = getProductImage(item);
                      const price = item.discountPrice || item.price || 0;
                      const catName =
                        typeof item.category === "object"
                          ? item.category?.name
                          : item.category || "General";

                      return (
                        <div
                          key={pId}
                          onClick={() => handleSelectProduct(pId)}
                          className="flex cursor-pointer items-center justify-between gap-3 rounded-xl p-2.5 hover:bg-slate-50 transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center">
                              {img ? (
                                <img
                                  src={img}
                                  alt={item.name}
                                  className="size-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <Package size={18} className="text-slate-400" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-800">
                                {item.name}
                              </p>
                              <p className="text-xs text-slate-400 truncate">
                                {catName}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-sm font-extrabold text-[#287b6d]">
                              {formatMoney(price)}
                            </span>
                            {item.stock <= 0 && (
                              <p className="text-[10px] text-red-500 font-semibold">
                                Out of stock
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* See all results in Shop */}
                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-800 hover:bg-[#287b6d] hover:text-white transition"
                  >
                    <span>View all results for &quot;{q}&quot;</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              ) : !isSearching ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  <p>No products matching &quot;{q}&quot;</p>
                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="mt-2 text-[#287b6d] font-bold hover:underline"
                  >
                    Search across full catalogue →
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden items-center gap-1 lg:flex">
          <Link
            to="/shop"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
          >
            Shop
          </Link>

          <Link
            to="/categories"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
          >
            Categories
          </Link>

          <Link
            to="/vendors"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
          >
            Stores
          </Link>

          <Link
            to="/compare"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
          >
            Compare
          </Link>

          <Link
            to="/about"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
          >
            About
          </Link>

          <Link
            to="/contact"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
          >
            Contact
          </Link>

          {user && (
            <Link
              to="/orders"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              Orders
            </Link>
          )}
        </nav>

        {/* Right Actions */}
        <div className="ml-auto flex items-center gap-1.5">
          {/* Wishlist */}
          <Link
            to="/wishlist"
            className="relative rounded-xl p-2.5 text-slate-700 hover:bg-slate-100 transition"
            aria-label="Wishlist"
          >
            <Heart size={20} />
            {wishCount > 0 && (
              <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-[#287b6d] text-[9px] font-bold text-white">
                {wishCount}
              </span>
            )}
          </Link>

          {/* Cart */}
          <Link
            to="/cart"
            className="relative rounded-xl p-2.5 text-slate-700 hover:bg-slate-100 transition"
            aria-label="Shopping cart"
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-[#287b6d] text-[9px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Profile / Auth Button */}
          {user ? (
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-100 transition"
                title={`Logged in as ${user.firstName || "User"}`}
              >
                <div className="grid size-8 place-items-center rounded-lg bg-[#287b6d]/10 text-[#287b6d] font-bold text-xs border border-[#287b6d]/20">
                  {user.firstName ? (
                    user.firstName[0].toUpperCase()
                  ) : (
                    <UserRound size={16} />
                  )}
                </div>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 z-50 mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl animate-in fade-in duration-150">
                  <div className="border-b border-slate-100 px-3 py-2">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      Hi, {user.firstName || "User"}
                    </p>
                    <p className="truncate text-[11px] text-slate-400">
                      {user.email}
                    </p>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    <User size={14} /> My Profile
                  </Link>

                  <Link
                    to="/orders"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    <Package size={14} /> My Orders
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden items-center gap-1.5 rounded-xl bg-[#287b6d] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#226b60] sm:inline-flex"
            >
              <LogIn size={14} />
              Sign in
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu & Live Search Overlay */}
      {open && (
        <div className="border-t border-slate-200 px-4 pb-4 md:hidden bg-white">
          <div ref={mobileSearchRef} className="relative my-3">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center rounded-xl border border-slate-300 bg-slate-50 px-3"
            >
              <Search size={18} className="text-slate-400 shrink-0" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products, stores…"
                className="w-full bg-transparent px-3 py-2.5 text-sm outline-none text-slate-900"
              />
              {q && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 text-slate-400"
                >
                  <X size={15} />
                </button>
              )}
              <button
                type="submit"
                className="ml-1 rounded-lg bg-[#287b6d] p-1.5 text-white"
              >
                <Search size={13} />
              </button>
            </form>

            {/* Mobile Suggestions Popup */}
            {showDropdown && q.trim().length > 0 && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-2xl">
                {suggestions.map((item) => (
                  <div
                    key={item._id || item.id}
                    onClick={() => handleSelectProduct(item._id || item.id)}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-lg hover:bg-slate-50 text-xs cursor-pointer border-b border-slate-50"
                  >
                    <span className="truncate font-bold text-slate-800">
                      {item.name}
                    </span>
                    <span className="font-extrabold text-[#287b6d] shrink-0">
                      {formatMoney(item.discountPrice || item.price)}
                    </span>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  className="mt-1 w-full text-center py-2 text-xs font-bold text-[#287b6d] bg-slate-50 rounded-lg hover:bg-slate-100"
                >
                  View all results →
                </button>
              </div>
            )}
          </div>

          {/* Mobile Links */}
          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              to="/shop"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800"
            >
              Shop
            </Link>

            <Link
              to="/categories"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800"
            >
              Categories
            </Link>

            <Link
              to="/vendors"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800"
            >
              Stores
            </Link>

            <Link
              to="/compare"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800"
            >
              Compare
            </Link>

            <Link
              to="/about"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800"
            >
              About
            </Link>

            <Link
              to="/contact"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800"
            >
              Contact
            </Link>

            {user ? (
              <>
                <Link
                  to="/orders"
                  onClick={() => setOpen(false)}
                  className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800"
                >
                  My Orders
                </Link>
                <button
                  onClick={() => {
                    setOpen(false);
                    handleLogout();
                  }}
                  className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600"
                >
                  Sign Out ({user.firstName})
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-[#287b6d] px-3.5 py-2 text-sm font-bold text-white"
              >
                Sign In / Register
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default CustomerNav;
