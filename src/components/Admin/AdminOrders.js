import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRouteAdmin.js";
import {
  Search,
  Eye,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
  IndianRupee,
  Filter,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Edit,
  X,
  ExternalLink,
  ShieldCheck,
  Building2,
} from "lucide-react";

const API_BASE_URL = "https://smart-commerce-platform-backend.onrender.com/api/admin";

// Helpers
const getToken = () =>
  localStorage.getItem("adminToken") || localStorage.getItem("token") || null;

const formatMoney = (val) =>
  `₹${new Intl.NumberFormat("en-IN").format(Number(val) || 0)}`;

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  return isNaN(d.getTime())
    ? dateStr
    : d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return isNaN(d.getTime())
    ? ""
    : d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
};

const AdminOrders = () => {
  // Data States
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Filter States
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Quick Status Edit Modal State
  const [activeModalOrder, setActiveModalOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [newPaymentStatus, setNewPaymentStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [modalSuccessMsg, setModalSuccessMsg] = useState("");

  // FETCH ORDERS DYNAMICALLY FROM BACKEND
  const fetchOrders = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const res = await axios.get(`${API_BASE_URL}/orders`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = res.data;
      const orderList = Array.isArray(data)
        ? data
        : data.orders || data.data || [];

      setOrders(orderList);
    } catch (err) {
      handleAuthError(err);
      console.error("Admin fetch orders error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load orders. Please check your backend connection.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // FILTERED ORDERS
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const searchText = search.toLowerCase().trim();

      // Order ID / Order Number
      const orderNum = String(
        order.orderNumber || order._id || order.id || "",
      ).toLowerCase();

      // Customer info
      const customer = order.user || order.customer || {};
      const custName =
        `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
        customer.name ||
        "";
      const custEmail = customer.email || "";
      const custPhone = customer.phone || order.shippingAddress?.phone || "";

      // Item names
      const items = order.orderItems || order.items || [];
      const hasMatchingItem = items.some((item) => {
        const pName = item.product?.name || item.name || "";
        return pName.toLowerCase().includes(searchText);
      });

      const matchesSearch =
        !searchText ||
        orderNum.includes(searchText) ||
        custName.toLowerCase().includes(searchText) ||
        custEmail.toLowerCase().includes(searchText) ||
        custPhone.includes(searchText) ||
        hasMatchingItem;

      // Status
      const orderStatus = (
        order.orderStatus ||
        order.status ||
        ""
      ).toLowerCase();
      const matchesStatus =
        statusFilter === "All" || orderStatus === statusFilter.toLowerCase();

      // Payment Status
      const payStatus = (
        order.paymentStatus ||
        order.payment?.status ||
        ""
      ).toLowerCase();
      const matchesPayment =
        paymentFilter === "All" || payStatus === paymentFilter.toLowerCase();

      // Date range filter
      let matchesDate = true;
      if (dateFilter !== "All" && order.createdAt) {
        const orderTime = new Date(order.createdAt).getTime();
        const now = Date.now();
        if (dateFilter === "Today") {
          matchesDate = now - orderTime <= 24 * 60 * 60 * 1000;
        } else if (dateFilter === "7days") {
          matchesDate = now - orderTime <= 7 * 24 * 60 * 60 * 1000;
        } else if (dateFilter === "30days") {
          matchesDate = now - orderTime <= 30 * 24 * 60 * 60 * 1000;
        }
      }

      return matchesSearch && matchesStatus && matchesPayment && matchesDate;
    });
  }, [orders, search, statusFilter, paymentFilter, dateFilter]);

  // PAGINATED ORDERS
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;

  // KPI STATS (Calculated from all real orders)
  const stats = useMemo(() => {
    const total = orders.length;

    const processing = orders.filter((o) => {
      const s = (o.orderStatus || o.status || "").toLowerCase();
      return s === "processing" || s === "placed" || s === "confirmed";
    }).length;

    const shipped = orders.filter((o) => {
      const s = (o.orderStatus || o.status || "").toLowerCase();
      return s === "shipped" || s === "partially_shipped";
    }).length;

    const delivered = orders.filter((o) => {
      const s = (o.orderStatus || o.status || "").toLowerCase();
      return s === "delivered" || s === "partially_delivered";
    }).length;

    const cancelled = orders.filter((o) => {
      const s = (o.orderStatus || o.status || "").toLowerCase();
      return s === "cancelled";
    }).length;

    const revenue = orders
      .filter(
        (o) => (o.orderStatus || o.status || "").toLowerCase() !== "cancelled",
      )
      .reduce((sum, o) => sum + Number(o.totalAmount || o.total || 0), 0);

    const aov = total > 0 ? Math.round(revenue / (total - cancelled || 1)) : 0;

    return { total, processing, shipped, delivered, cancelled, revenue, aov };
  }, [orders]);

  // STATUS COLOR BADGES
  const getStatusBadge = (status) => {
    const s = String(status || "").toLowerCase();
    switch (s) {
      case "delivered":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "partially_delivered":
        return "bg-teal-50 text-teal-700 border-teal-200";
      case "shipped":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "partially_shipped":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "processing":
      case "confirmed":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "placed":
      case "pending":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "cancelled":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getPaymentBadge = (status) => {
    const s = String(status || "").toLowerCase();
    switch (s) {
      case "paid":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "failed":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "refunded":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  // OPEN QUICK UPDATE MODAL
  const handleOpenModal = (order) => {
    setActiveModalOrder(order);
    setNewStatus(order.orderStatus || order.status || "processing");
    setNewPaymentStatus(
      order.paymentStatus || order.payment?.status || "pending",
    );
    setTrackingNumber(order.trackingNumber || "");
    setModalSuccessMsg("");
  };

  // SUBMIT STATUS UPDATE
  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!activeModalOrder) return;

    setUpdatingStatus(true);
    setModalSuccessMsg("");

    const orderId = activeModalOrder._id || activeModalOrder.id;

    try {
      const res = await axios.put(
        `${API_BASE_URL}/orders/${orderId}/status`,
        {
          orderStatus: newStatus,
          paymentStatus: newPaymentStatus,
          trackingNumber,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );

      if (res.data?.success) {
        setModalSuccessMsg("Order status updated successfully!");
        // Update local state immediately
        setOrders((prev) =>
          prev.map((o) =>
            (o._id || o.id) === orderId
              ? {
                  ...o,
                  orderStatus: newStatus,
                  status: newStatus,
                  paymentStatus: newPaymentStatus,
                  trackingNumber,
                }
              : o,
          ),
        );

        setTimeout(() => {
          setActiveModalOrder(null);
        }, 1100);
      }
    } catch (err) {
      handleAuthError(err);
      console.error("Update status error:", err);
      alert(err.response?.data?.message || "Failed to update order status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // EXPORT ORDERS TO CSV
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) return;

    const headers = [
      "Order ID",
      "Date",
      "Customer Name",
      "Customer Email",
      "Phone",
      "Total Amount",
      "Payment Method",
      "Payment Status",
      "Order Status",
      "Item Count",
    ];

    const rows = filteredOrders.map((o) => {
      const c = o.user || o.customer || {};
      const name =
        `${c.firstName || ""} ${c.lastName || ""}`.trim() ||
        c.name ||
        "Customer";
      const total = Number(o.totalAmount || o.total || 0);
      const items = o.orderItems || o.items || [];

      return [
        `"${o.orderNumber || o._id || o.id}"`,
        `"${formatDate(o.createdAt || o.date)}"`,
        `"${name}"`,
        `"${c.email || ""}"`,
        `"${c.phone || o.shippingAddress?.phone || ""}"`,
        total,
        `"${(o.paymentMethod || o.payment?.method || "cod").toUpperCase()}"`,
        `"${o.paymentStatus || o.payment?.status || "pending"}"`,
        `"${o.orderStatus || o.status || "placed"}"`,
        items.length,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `smartcommerce_orders_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER WITH CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Order Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitor, fulfill and update multi-vendor customer orders in
            real-time.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchOrders(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs transition disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={refreshing ? "animate-spin text-teal-600" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredOrders.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white shadow-xs transition disabled:opacity-50"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">
            Total Orders
          </p>
          <h2 className="text-2xl font-black text-slate-900 mt-1.5">
            {stats.total}
          </h2>
          <span className="text-[10px] text-slate-500">Across all vendors</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <p className="text-xs font-bold uppercase text-amber-600 tracking-wider">
            Processing
          </p>
          <h2 className="text-2xl font-black text-amber-600 mt-1.5">
            {stats.processing}
          </h2>
          <span className="text-[10px] text-slate-500">Awaiting dispatch</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <p className="text-xs font-bold uppercase text-blue-600 tracking-wider">
            In Transit
          </p>
          <h2 className="text-2xl font-black text-blue-600 mt-1.5">
            {stats.shipped}
          </h2>
          <span className="text-[10px] text-slate-500">
            Shipped with carrier
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <p className="text-xs font-bold uppercase text-emerald-600 tracking-wider">
            Delivered
          </p>
          <h2 className="text-2xl font-black text-emerald-600 mt-1.5">
            {stats.delivered}
          </h2>
          <span className="text-[10px] text-slate-500">
            Fulfillment completed
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <p className="text-xs font-bold uppercase text-rose-500 tracking-wider">
            Cancelled
          </p>
          <h2 className="text-2xl font-black text-rose-600 mt-1.5">
            {stats.cancelled}
          </h2>
          <span className="text-[10px] text-slate-500">Voided orders</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs bg-gradient-to-br from-teal-50/50 to-white">
          <p className="text-xs font-bold uppercase text-teal-700 tracking-wider">
            Gross Volume
          </p>
          <h2 className="text-xl font-black text-teal-800 mt-1.5 truncate">
            {formatMoney(stats.revenue)}
          </h2>
          <span className="text-[10px] text-slate-500">
            AOV: {formatMoney(stats.aov)}
          </span>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-2">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search by Order ID, customer, email, or item name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-teal-600 transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-teal-600"
          >
            <option value="All">All Stages</option>
            <option value="Placed">Placed</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="partially_shipped">Partially Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="partially_delivered">Partially Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Payment Status */}
          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-teal-600"
          >
            <option value="All">All Payments</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
            <option value="Refunded">Refunded</option>
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-teal-600"
          >
            <option value="All">All Time</option>
            <option value="Today">Last 24 Hours</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>
        </div>

        {/* Filter Reset Indicator */}
        {(search ||
          statusFilter !== "All" ||
          paymentFilter !== "All" ||
          dateFilter !== "All") && (
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Filtering results: <strong>{filteredOrders.length}</strong>{" "}
              matching orders
            </span>
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("All");
                setPaymentFilter("All");
                setDateFilter("All");
                setCurrentPage(1);
              }}
              className="font-bold text-teal-700 hover:underline"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* ERROR NOTICE */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchOrders()}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* ORDERS DATA TABLE */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <h2 className="font-bold text-slate-800 text-sm">
              Customer Orders
            </h2>
            <span className="text-xs text-slate-400 font-semibold">
              ({filteredOrders.length})
            </span>
          </div>

          <div className="text-xs text-slate-400">
            Page {currentPage} of {totalPages}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Order ID & Date</th>
                <th className="px-6 py-4">Customer Details</th>
                <th className="px-6 py-4">Vendor & Packages</th>
                <th className="px-6 py-4">Financials</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Fulfillment Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                // SKELETON LOADERS
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 rounded w-24 mb-1"></div>
                      <div className="h-3 bg-slate-100 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 rounded w-32 mb-1"></div>
                      <div className="h-3 bg-slate-100 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 rounded w-28"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-5 bg-slate-200 rounded-full w-16"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-5 bg-slate-200 rounded-full w-20"></div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="h-8 bg-slate-200 rounded w-16 ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : paginatedOrders.length > 0 ? (
                paginatedOrders.map((order) => {
                  const oId = order._id || order.id;
                  const orderNum =
                    order.orderNumber || String(oId).slice(-8).toUpperCase();
                  const customer = order.user || order.customer || {};
                  const custName =
                    `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
                    customer.name ||
                    "Guest Shopper";
                  const items = order.orderItems || order.items || [];
                  const total = Number(order.totalAmount || order.total || 0);

                  // Extract vendors involved in this multi-vendor order
                  const vendorNames = Array.from(
                    new Set(
                      items
                        .map(
                          (i) =>
                            i.vendor?.storeName || i.product?.vendor?.storeName,
                        )
                        .filter(Boolean),
                    ),
                  );

                  return (
                    <tr
                      key={oId}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* ORDER NUMBER & DATE */}
                      <td className="px-6 py-4 align-top">
                        <span className="font-bold text-slate-900 block font-mono text-sm">
                          #{orderNum}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {formatDate(order.createdAt || order.date)} ·{" "}
                          {formatTime(order.createdAt || order.date)}
                        </div>
                      </td>

                      {/* CUSTOMER INFO */}
                      <td className="px-6 py-4 align-top">
                        <div className="font-bold text-slate-800">
                          {custName}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                          {customer.email || "No email"}
                        </div>
                        {customer.phone && (
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            +91 {customer.phone}
                          </div>
                        )}
                      </td>

                      {/* VENDORS & ITEMS PREVIEW */}
                      <td className="px-6 py-4 align-top">
                        <div className="font-semibold text-slate-700">
                          {items.length} product{items.length !== 1 ? "s" : ""}
                        </div>

                        {vendorNames.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {vendorNames.map((v, vIdx) => (
                              <span
                                key={vIdx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600 border border-slate-200"
                              >
                                <Building2 size={10} />
                                {v}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            Direct Fulfilled
                          </span>
                        )}
                      </td>

                      {/* TOTAL AMOUNT */}
                      <td className="px-6 py-4 align-top font-bold text-slate-900 text-sm">
                        {formatMoney(total)}
                        {order.deliveryCharge > 0 && (
                          <div className="text-[10px] text-slate-400 font-normal">
                            incl. {formatMoney(order.deliveryCharge)} delivery
                          </div>
                        )}
                      </td>

                      {/* PAYMENT DETAILS */}
                      <td className="px-6 py-4 align-top">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getPaymentBadge(
                            order.paymentStatus || order.payment?.status,
                          )}`}
                        >
                          {order.paymentStatus ||
                            order.payment?.status ||
                            "Pending"}
                        </span>
                        <div className="text-[11px] text-slate-500 uppercase font-bold tracking-tight mt-1">
                          {order.paymentMethod ||
                            order.payment?.method ||
                            "COD"}
                        </div>
                      </td>

                      {/* FULFILLMENT STATUS */}
                      <td className="px-6 py-4 align-top">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wide ${getStatusBadge(
                            order.orderStatus || order.status,
                          )}`}
                        >
                          {(order.orderStatus || order.status || "Placed")
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (char) => char.toUpperCase())}
                        </span>
                        {order.trackingNumber && (
                          <div className="text-[10px] text-slate-400 font-mono mt-1">
                            Track: {order.trackingNumber}
                          </div>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="px-6 py-4 align-top text-right space-x-2">
                        {/* Full View Details */}
                        <Link
                          to={`/admin/orders/${oId}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition"
                        >
                          <Eye size={13} />
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-20 text-center">
                    <Package size={44} className="mx-auto text-slate-300" />
                    <h3 className="mt-3 font-bold text-slate-700 text-base">
                      No orders match your filter
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Try updating your search query or reset status and date
                      filters.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setStatusFilter("All");
                        setPaymentFilter("All");
                        setDateFilter("All");
                      }}
                      className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
                    >
                      Clear All Filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of{" "}
              {filteredOrders.length} orders
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>

              {[...Array(totalPages)].map((_, idx) => {
                const pageNum = idx + 1;
                // Show condensed page numbers for large counts
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                        currentPage === pageNum
                          ? "bg-teal-600 text-white shadow-xs"
                          : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
                return null;
              })}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
