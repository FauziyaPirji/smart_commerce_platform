import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRoute";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock3,
  ArrowRight,
  Search,
  ShoppingBag,
  Loader2,
  AlertCircle,
  RefreshCw,
  Building2,
  ChevronRight,
  CreditCard,
  Banknote,
  Receipt,
  ExternalLink,
  SlidersHorizontal,
  X,
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000/api";

const getToken = () => localStorage.getItem("token") || null;
const isLoggedIn = () => Boolean(getToken());

const money = (value) =>
  `₹${new Intl.NumberFormat("en-IN").format(Number(value) || 0)}`;

const formatDate = (dateStr) => {
  if (!dateStr) return "Recent";
  const date = new Date(dateStr);
  return isNaN(date.getTime())
    ? "Recent"
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

const getInitials = (name) => {
  if (!name) return "SC";
  const words = String(name).trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return String(name).slice(0, 2).toUpperCase();
};

const getStatusBadge = (rawStatus = "") => {
  const s = String(rawStatus).toLowerCase().trim();

  if (s === "delivered") {
    return {
      label: "Delivered",
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
      icon: (
        <CheckCircle2
          size={13}
          className="text-emerald-600 dark:text-emerald-400"
        />
      ),
    };
  }
  if (s === "partially_delivered") {
    return {
      label: "Partially Delivered",
      bg: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800",
      icon: <Package size={13} className="text-teal-600 dark:text-teal-400" />,
    };
  }
  if (s === "shipped") {
    return {
      label: "In Transit",
      bg: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
      icon: <Truck size={13} className="text-blue-600 dark:text-blue-400" />,
    };
  }
  if (s === "partially_shipped") {
    return {
      label: "Partially Shipped",
      bg: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800",
      icon: (
        <Truck size={13} className="text-indigo-600 dark:text-indigo-400" />
      ),
    };
  }
  return {
    label: "Processing",
    bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
    icon: <Clock3 size={13} className="text-amber-600 dark:text-amber-400" />,
  };
};

const OrdersPage = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const fetchOrders = async (isManual = false) => {
    if (!isLoggedIn()) {
      sessionStorage.setItem("redirectAfterLogin", "/orders");
      navigate("/login");
      return;
    }

    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError("");

    const token = getToken();
    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    };

    try {
      let res;
      try {
        // Primary customer endpoint
        res = await axios.get(`${API_BASE_URL}/customer/orders`, config);
      } catch (err1) {
        // Fallback to orderController route
        res = await axios.get(`${API_BASE_URL}/orders/user`, config);
      }

      if (res.data?.success && Array.isArray(res.data.orders)) {
        setOrders(res.data.orders);
      } else if (Array.isArray(res.data)) {
        setOrders(res.data);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Fetch customer orders error:", err);
      if (typeof handleAuthError === "function") {
        handleAuthError(err);
      }
      setError(
        err.response?.data?.message ||
          "Failed to load your orders. Please check your network or try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [navigate]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = orders.length;
    const delivered = orders.filter((o) =>
      ["delivered"].includes((o.orderStatus || o.status || "").toLowerCase()),
    ).length;
    const inProgress = orders.filter(
      (o) => (o.orderStatus || o.status || "").toLowerCase() !== "delivered",
    ).length;
    const totalSpent = orders.reduce(
      (acc, o) => acc + Number(o.totalAmount || o.total || 0),
      0,
    );

    return { total, delivered, inProgress, totalSpent };
  }, [orders]);

  // Filtered & Sorted orders list
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const rawStatus = (
          order.orderStatus ||
          order.status ||
          "placed"
        ).toLowerCase();

        // Tab category filtering
        if (activeTab === "in_progress") {
          if (rawStatus === "delivered") return false;
        } else if (activeTab === "delivered") {
          if (!rawStatus.includes("delivered")) return false;
        }

        // Search filtering
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;

        const orderId = String(
          order.orderNumber || order._id || order.id || "",
        ).toLowerCase();
        const matchesId = orderId.includes(q);

        const items = Array.isArray(order.items) ? order.items : [];
        const matchesProduct = items.some((it) => {
          const title = String(
            it.productName || it.title || it.name || it.product?.title || "",
          ).toLowerCase();
          const vendor = String(
            it.vendor?.storeName || it.vendor?.name || "",
          ).toLowerCase();
          return title.includes(q) || vendor.includes(q);
        });

        return matchesId || matchesProduct;
      })
      .sort((a, b) => {
        const dateA =
          new Date(a.placedAt || a.createdAt || a.date).getTime() || 0;
        const dateB =
          new Date(b.placedAt || b.createdAt || b.date).getTime() || 0;
        if (sortBy === "newest") return dateB - dateA;
        if (sortBy === "oldest") return dateA - dateB;
        if (sortBy === "highest") {
          return Number(b.totalAmount || 0) - Number(a.totalAmount || 0);
        }
        return 0;
      });
  }, [orders, activeTab, searchQuery, sortBy]);

  const tabs = [
    { key: "all", label: "All Orders", count: metrics.total },
    { key: "in_progress", label: "In Progress", count: metrics.inProgress },
    { key: "delivered", label: "Delivered", count: metrics.delivered },
  ];

  return (
    <main className="min-h-screen bg-slate-50/60 dark:bg-background text-foreground pb-16">
      {/* HERO / HEADER SECTION */}
      <section className="border-b border-border bg-card shadow-xs">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex size-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-primary">
                  Order Management
                </p>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
                Your Orders
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-lg">
                Track deliveries, inspect individual vendor packages, and review
                past purchases.
              </p>
            </div>

            {/* Quick KPI stats */}
            <div className="flex items-center gap-2.5 sm:gap-4 overflow-x-auto pb-1">
              <div className="rounded-2xl border border-border bg-secondary/50 px-4 py-2.5 min-w-[105px]">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">
                  Total Orders
                </p>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                  {loading ? "…" : metrics.total}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-secondary/50 px-4 py-2.5 min-w-[105px]">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">
                  In Transit
                </p>
                <p className="text-xl font-black text-blue-600 mt-0.5">
                  {loading ? "…" : metrics.inProgress}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-secondary/50 px-4 py-2.5 min-w-[130px]">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">
                  Total Spent
                </p>
                <p className="text-xl font-black text-emerald-600 mt-0.5">
                  {loading ? "…" : money(metrics.totalSpent)}
                </p>
              </div>
            </div>
          </div>

          {/* TABS & REFRESH BUTTON */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border/80 pt-4">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`size-4.5 text-[10px] grid place-items-center rounded-full font-extrabold ${
                        isActive
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {loading ? "…" : tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => fetchOrders(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition disabled:opacity-50"
              title="Refresh order history"
            >
              <RefreshCw
                size={13}
                className={refreshing ? "animate-spin text-primary" : ""}
              />
              <span>{refreshing ? "Refreshing…" : "Refresh"}</span>
            </button>
          </div>
        </div>
      </section>

      {/* SEARCH & FILTERS BAR */}
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order ID, product title, or vendor store…"
              className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-8 text-xs font-medium text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
              <SlidersHorizontal size={12} /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground outline-none focus:border-primary"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Amount</option>
            </select>
          </div>
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-400">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => fetchOrders(false)}
              className="rounded-lg bg-rose-600 px-3 py-1 font-bold text-white hover:bg-rose-700 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* LOADING STATE */}
        {loading ? (
          <div className="my-20 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 size={36} className="animate-spin text-primary mb-3" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Fetching Your Orders…
            </p>
          </div>
        ) : orders.length === 0 ? (
          /* EMPTY ORDERS */
          <div className="mt-8 rounded-3xl border border-dashed border-border bg-card p-12 text-center shadow-xs">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-secondary text-primary">
              <ShoppingBag size={28} />
            </div>
            <h2 className="mt-4 text-xl font-black text-slate-900 dark:text-white">
              No orders placed yet
            </h2>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              When you purchase items from verified SmartCommerce vendors, your
              packages and live status will appear here.
            </p>
            <Link
              to="/shop"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 transition"
            >
              <span>Explore Marketplace</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : filteredOrders.length === 0 ? (
          /* NO MATCHING FILTER RESULTS */
          <div className="mt-8 rounded-3xl border border-border bg-card p-10 text-center">
            <Search size={24} className="mx-auto text-muted-foreground mb-2" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No matching orders found
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Try adjusting your search query or switching to another tab.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setActiveTab("all");
              }}
              className="mt-4 text-xs font-bold text-primary hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          /* ORDERS LIST */
          <div className="mt-6 space-y-5">
            {filteredOrders.map((order) => {
              const orderId =
                order.orderNumber || order._id || order.id || "SC-00000";
              const targetRouteId = order._id || order.id || order.orderNumber;
              const rawStatus = order.orderStatus || order.status || "placed";
              const badge = getStatusBadge(rawStatus);

              const dateStr = formatDate(
                order.placedAt || order.createdAt || order.date,
              );
              const totalAmount = Number(order.totalAmount || order.total || 0);

              const items =
                Array.isArray(order.items) && order.items.length > 0
                  ? order.items
                  : [
                      {
                        productName: order.productName || "Ordered Product",
                        quantity: order.itemCount || 1,
                        unitPrice: totalAmount,
                      },
                    ];

              const isCod =
                String(order.paymentMethod || "").toLowerCase() === "cod";
              const isPaid =
                order.paymentStatus?.toLowerCase() === "paid" || order.isPaid;

              return (
                <article
                  key={orderId}
                  className="overflow-hidden rounded-3xl border border-border bg-card shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition"
                >
                  {/* CARD HEADER */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-muted/20 px-5 py-4">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                          Order Number
                        </span>
                        <Link
                          to={`/orders/${targetRouteId}`}
                          className="font-black text-slate-900 dark:text-white hover:text-primary transition"
                        >
                          #{orderId}
                        </Link>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                          Placed On
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {dateStr}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                          Total Amount
                        </span>
                        <span className="font-black text-slate-900 dark:text-white">
                          {money(totalAmount)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                          Payment
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          {isCod ? (
                            <Banknote size={12} className="text-amber-500" />
                          ) : (
                            <CreditCard size={12} className="text-blue-500" />
                          )}
                          {isCod ? "COD" : "Online"} ·{" "}
                          <strong
                            className={
                              isPaid
                                ? "text-emerald-600 font-bold"
                                : "text-amber-600 font-bold"
                            }
                          >
                            {isPaid ? "Paid" : "Pending"}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* OVERALL ORDER BADGE */}
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-extrabold shadow-2xs ${badge.bg}`}
                    >
                      {badge.icon}
                      <span>{badge.label}</span>
                    </span>
                  </div>

                  {/* VENDOR ITEMS LIST */}
                  <div className="p-5 divide-y divide-border/60">
                    {items.map((it, idx) => {
                      const prodDoc = it.product || {};
                      const prodId = prodDoc._id || it.product || it.id || idx;
                      const title =
                        it.productName ||
                        prodDoc.name ||
                        prodDoc.title ||
                        "Product";
                      const img =
                        it.productImage ||
                        (prodDoc.images && prodDoc.images[0]?.url) ||
                        (prodDoc.images && prodDoc.images[0]) ||
                        prodDoc.image ||
                        "";
                      const qty = Number(it.quantity || 1);
                      const price = Number(it.unitPrice || prodDoc.price || 0);

                      // Vendor information
                      const vendorDoc = it.vendor || prodDoc.vendor || {};
                      const storeName =
                        vendorDoc.storeName ||
                        vendorDoc.name ||
                        (typeof vendorDoc === "string"
                          ? "Partner Vendor"
                          : "Verified Store");

                      // Individual vendor item status
                      const itemStatus = it.status || rawStatus;
                      const itemBadge = getStatusBadge(itemStatus);

                      return (
                        <div
                          key={idx}
                          className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            {/* Product Thumbnail */}
                            <Link
                              to={`/product/${prodId}`}
                              className="shrink-0 group"
                            >
                              {img ? (
                                <img
                                  src={img}
                                  alt={title}
                                  className="size-16 sm:size-18 rounded-2xl object-cover border border-border group-hover:opacity-90 transition bg-slate-100 dark:bg-slate-800"
                                />
                              ) : (
                                <div className="size-16 sm:size-18 rounded-2xl bg-secondary grid place-items-center text-xs font-black text-muted-foreground border border-border">
                                  {getInitials(title)}
                                </div>
                              )}
                            </Link>

                            {/* Details */}
                            <div className="min-w-0 flex-1">
                              <Link
                                to={`/product/${prodId}`}
                                className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white hover:text-primary line-clamp-1 transition"
                              >
                                {title}
                              </Link>

                              <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                                <span className="flex items-center gap-1 font-medium">
                                  <Building2
                                    size={11}
                                    className="text-slate-400"
                                  />
                                  Sold by:{" "}
                                  <strong className="text-foreground">
                                    {storeName}
                                  </strong>
                                </span>
                                <span>•</span>
                                <span>
                                  Qty: <strong>{qty}</strong>
                                </span>
                                <span>•</span>
                                <span>Price: {money(price)}</span>
                              </div>

                              {/* Multi-Vendor package tracking chip */}
                              <div className="mt-2 flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${itemBadge.bg}`}
                                >
                                  {itemBadge.icon}
                                  Package: {itemBadge.label}
                                </span>
                                {it.carrier && (
                                  <span className="text-[10px] font-semibold text-muted-foreground">
                                    via {it.carrier}{" "}
                                    {it.trackingNumber
                                      ? `(${it.trackingNumber})`
                                      : ""}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-left sm:text-right shrink-0">
                            <span className="text-sm font-black text-slate-900 dark:text-white">
                              {money(price * qty)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* FOOTER ACTIONS */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-slate-50/50 dark:bg-card/50 px-5 py-3.5 text-xs">
                    <p className="text-[11px] text-muted-foreground font-medium">
                      {rawStatus.toLowerCase() === "delivered"
                        ? "Package delivered. We hope you enjoy your purchase!"
                        : "Each vendor ships their package directly to your destination."}
                    </p>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/orders/${targetRouteId}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:opacity-95 active:scale-95 transition"
                      >
                        <span>View Order &amp; Track</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
};

export default OrdersPage;
