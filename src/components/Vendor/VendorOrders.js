import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRouteVendor";
import {
  Search,
  Eye,
  Edit,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  CreditCard,
  X,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  User,
  Loader2,
} from "lucide-react";

const API_BASE_URL = "https://smart-commerce-platform-backend.onrender.com/api/vendors";

const getToken = () =>
  localStorage.getItem("vendorToken") || localStorage.getItem("token") || null;

const money = (val) =>
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
    : d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

const getInitials = (name) => {
  if (!name) return "CU";
  const words = String(name).trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return String(name).slice(0, 2).toUpperCase();
};

function capitalize(str) {
  if (!str) return "Pending";
  const s = String(str).toLowerCase().trim();
  if (s === "partially_shipped" || s === "processing") return "Processing";
  if (s === "partially_delivered" || s === "shipped") return "Shipped";
  if (s === "delivered") return "Delivered";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function normalizeOrder(o) {
  const items = Array.isArray(o.items) ? o.items : [];
  const firstItem = items[0] || {};
  const productTitle =
    o.productName ||
    firstItem.productName ||
    firstItem.product?.name ||
    firstItem.product?.title ||
    "Product Item";

  const customerObj = o.customer || o.user || o.shippingAddress || {};
  const customerName =
    o.customerName ||
    o.shippingAddress?.fullName ||
    customerObj.fullName ||
    customerObj.name ||
    `${customerObj.firstName || ""} ${customerObj.lastName || ""}`.trim() ||
    "Customer";

  const customerPhone =
    o.customerPhone || o.shippingAddress?.phone || customerObj.phone || "";

  const customerEmail =
    o.customerEmail || customerObj.email || o.shippingAddress?.email || "";

  const totalAmt = Number(
    o.totalAmount ??
      o.subtotal ??
      items.reduce(
        (sum, it) =>
          sum + Number(it.subtotal || it.unitPrice || 0) * (it.quantity || 1),
        0,
      ),
  );

  return {
    _id: o._id || o.id,
    id:
      o.orderNumber ||
      o.id ||
      (o._id ? `#${String(o._id).slice(-6).toUpperCase()}` : "N/A"),
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress: o.shippingAddress || {
      fullName: customerName,
      phone: customerPhone,
      addressLine1: o.addressLine1 || o.address || "Address not provided",
      city: o.city || "",
      state: o.state || "",
      pincode: o.pincode || "",
      country: o.country || "India",
    },
    productName: productTitle,
    productImage:
      o.productImage ||
      firstItem.productImage ||
      firstItem.product?.images?.[0] ||
      firstItem.product?.image ||
      "",
    itemCount: items.length || o.itemCount || 1,
    items:
      items.length > 0
        ? items
        : [
            {
              productName: productTitle,
              quantity: o.itemCount || 1,
              unitPrice: totalAmt / (o.itemCount || 1),
              subtotal: totalAmt,
            },
          ],
    date: o.date || o.createdAt || o.placedAt || new Date().toISOString(),
    totalAmount: totalAmt,
    paymentMethod: o.paymentMethod || o.payment?.paymentMethod || "online",
    paymentStatus: capitalize(
      o.paymentStatus ||
        (String(o.paymentMethod).toLowerCase() === "cod" ? "Pending" : "Paid"),
    ),
    status: capitalize(o.orderStatus || o.status || "Pending"),
  };
}

const VendorOrders = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [viewOrderModal, setViewOrderModal] = useState(null);
  const [updateStatusModal, setUpdateStatusModal] = useState(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState("");
  const [courierName, setCourierName] = useState("");
  const [trackingNotes, setTrackingNotes] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updateError, setUpdateError] = useState("");

  const fetchVendorOrders = async (isManualRefresh = false) => {
    const token = getToken();
    if (!token) {
      setError("Vendor authentication token not found. Please log in.");
      setLoading(false);
      return;
    }

    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const timestamp = Date.now();
      const res = await axios.get(`${API_BASE_URL}/orders?_t=${timestamp}`, {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data?.success && Array.isArray(res.data.orders)) {
        const normalized = res.data.orders.map(normalizeOrder);
        setOrders(normalized);
      } else {
        setOrders([]);
      }
    } catch (err) {
      handleAuthError(err);
      console.error("Fetch vendor orders error:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError("Your session has expired. Please log in again.");
      } else {
        setError(
          err.response?.data?.message ||
            "Unable to connect to orders server. Please check your network or server.",
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVendorOrders();
  }, []);

  const metrics = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === "Pending").length;
    const processing = orders.filter((o) => o.status === "Processing").length;
    const shipped = orders.filter((o) => o.status === "Shipped").length;
    const delivered = orders.filter((o) => o.status === "Delivered").length;
    const grossSales = orders.reduce(
      (sum, o) => sum + (Number(o.totalAmount) || 0),
      0,
    );

    return { total, pending, processing, shipped, delivered, grossSales };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const query = searchTerm.toLowerCase().trim();
        const matchesSearch =
          !query ||
          String(order.id).toLowerCase().includes(query) ||
          String(order.customerName).toLowerCase().includes(query) ||
          String(order.customerPhone).toLowerCase().includes(query) ||
          String(order.customerEmail).toLowerCase().includes(query) ||
          String(order.productName).toLowerCase().includes(query);

        const matchesStatus =
          statusFilter === "All" ||
          order.status.toLowerCase() === statusFilter.toLowerCase();

        const matchesPayment =
          paymentFilter === "All" ||
          order.paymentStatus.toLowerCase() === paymentFilter.toLowerCase();

        const matchesDate =
          !dateFilter ||
          new Date(order.date).toISOString().slice(0, 10) === dateFilter;

        return matchesSearch && matchesStatus && matchesPayment && matchesDate;
      })
      .sort((a, b) => {
        if (sortBy === "newest") return new Date(b.date) - new Date(a.date);
        if (sortBy === "oldest") return new Date(a.date) - new Date(b.date);
        if (sortBy === "amount_high") return b.totalAmount - a.totalAmount;
        if (sortBy === "amount_low") return a.totalAmount - b.totalAmount;
        return 0;
      });
  }, [orders, searchTerm, statusFilter, paymentFilter, dateFilter, sortBy]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, paymentFilter, dateFilter, sortBy]);

  const handleOpenStatusModal = (order) => {
    setUpdateStatusModal(order);
    setSelectedNewStatus(order.status);
    setCourierName("");
    setTrackingNotes("");
    setUpdateError("");
  };

  const handleSaveStatusUpdate = async () => {
    if (!updateStatusModal || !selectedNewStatus) return;

    setUpdatingStatus(true);
    setUpdateError("");

    const targetId = updateStatusModal._id || updateStatusModal.id;
    try {
      const token = getToken();
      if (!token) throw new Error("Authentication token not found.");

      const payload = {
        status: selectedNewStatus.toLowerCase(),
        orderStatus: selectedNewStatus.toLowerCase(),
        courier: courierName,
        carrier: courierName,
        trackingNumber: trackingNotes,
      };

      try {
        await axios.put(`${API_BASE_URL}/orders/${targetId}/status`, payload, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (putErr) {
        handleAuthError(putErr);
        if (
          putErr.response?.status === 404 ||
          putErr.response?.status === 405
        ) {
          await axios.patch(
            `${API_BASE_URL}/orders/${targetId}/status`,
            payload,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            },
          );
        } else {
          throw putErr;
        }
      }

      setOrders((prev) =>
        prev.map((o) =>
          o._id === targetId || o.id === targetId
            ? {
                ...o,
                status: selectedNewStatus,
                paymentStatus:
                  selectedNewStatus === "Delivered" &&
                  String(o.paymentMethod).toLowerCase() === "cod"
                    ? "Paid"
                    : o.paymentStatus,
              }
            : o,
        ),
      );

      setSuccessToast(
        `Order #${updateStatusModal.id} updated to ${selectedNewStatus}!`,
      );
      setTimeout(() => setSuccessToast(""), 4000);
      setUpdateStatusModal(null);
    } catch (err) {
      console.error("Status update error:", err);
      setUpdateError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update status on the server.",
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const exportToCSV = () => {
    if (filteredOrders.length === 0) return;
    const headers = [
      "Order ID",
      "Customer Name",
      "Product",
      "Items",
      "Date",
      "Amount",
      "Payment Method",
      "Payment Status",
      "Order Status",
    ];
    const rows = filteredOrders.map((o) => [
      `"${o.id}"`,
      `"${o.customerName}"`,
      `"${o.productName.replace(/"/g, '""')}"`,
      o.itemCount,
      `"${formatDate(o.date)}"`,
      o.totalAmount,
      `"${o.paymentMethod}"`,
      `"${o.paymentStatus}"`,
      `"${o.status}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `vendor_orders_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getBadgeClass = (status) => {
    switch (status) {
      case "Delivered":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Shipped":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Processing":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Pending":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Delivered":
        return <CheckCircle2 size={13} className="text-emerald-600" />;
      case "Shipped":
        return <Truck size={13} className="text-blue-600" />;
      case "Processing":
        return <PackageCheck size={13} className="text-amber-600" />;
      case "Pending":
      default:
        return <Clock size={13} className="text-purple-600" />;
    }
  };

  const isFiltered =
    searchTerm ||
    statusFilter !== "All" ||
    paymentFilter !== "All" ||
    dateFilter ||
    sortBy !== "newest";

  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setPaymentFilter("All");
    setDateFilter("");
    setSortBy("newest");
  };

  return (
    <div className="space-y-6">
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3.5 text-xs font-bold text-white shadow-xl animate-in slide-in-from-bottom-3">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Vendor Orders
            </h1>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200">
              Live Hub
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Monitor and fulfill customer orders for your store products in real
            time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchVendorOrders(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
            title="Refresh order records"
          >
            <RefreshCw
              size={14}
              className={
                refreshing ? "animate-spin text-blue-600" : "text-slate-400"
              }
            />
            <span>{refreshing ? "Refreshing…" : "Refresh"}</span>
          </button>

          <button
            type="button"
            onClick={exportToCSV}
            disabled={filteredOrders.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95 disabled:opacity-40"
            title="Export filtered records to CSV"
          >
            <Download size={14} className="text-slate-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchVendorOrders(false)}
            className="rounded-lg bg-red-600 px-3 py-1 font-bold text-white hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* METRIC STATS (5 Clean Cards) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          {
            label: "Total Orders",
            count: metrics.total,
            filterVal: "All",
            color: "text-slate-900",
          },
          {
            label: "Pending",
            count: metrics.pending,
            filterVal: "Pending",
            color: "text-purple-600",
          },
          {
            label: "Processing",
            count: metrics.processing,
            filterVal: "Processing",
            color: "text-amber-600",
          },
          {
            label: "Shipped",
            count: metrics.shipped,
            filterVal: "Shipped",
            color: "text-blue-600",
          },
          {
            label: "Delivered",
            count: metrics.delivered,
            filterVal: "Delivered",
            color: "text-emerald-600",
          },
        ].map((card) => {
          const isActive =
            statusFilter.toLowerCase() === card.filterVal.toLowerCase();
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => setStatusFilter(card.filterVal)}
              className={`rounded-2xl border p-4 text-left transition-all duration-200 ${
                isActive
                  ? "border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-600/20"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {card.label}
                </p>
                {isActive && (
                  <span className="size-2 rounded-full bg-blue-600" />
                )}
              </div>
              <p
                className={`mt-2 text-2xl font-extrabold tracking-tight ${card.color}`}
              >
                {loading ? "…" : card.count}
              </p>
            </button>
          );
        })}
      </div>

      {/* SEARCH & FILTERS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search by Order ID, customer name, phone, email, product…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-9 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/10 transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
            >
              <option value="All">All Payments</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
              title="Filter by exact date"
            />

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount_high">Highest Amount</option>
              <option value="amount_low">Lowest Amount</option>
            </select>

            {isFiltered && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
              >
                <X size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500">
          <span>
            Showing{" "}
            <strong className="text-slate-800">{filteredOrders.length}</strong>{" "}
            {filteredOrders.length === 1 ? "order" : "orders"}
            {isFiltered && " (filtered)"}
          </span>
          <span className="font-semibold text-slate-600">
            Total Revenue:{" "}
            <strong className="text-slate-900">
              {money(filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0))}
            </strong>
          </span>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-4">Order ID</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Product / Item</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Amount</th>
                <th className="px-5 py-4">Payment</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Quick Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center">
                    <Loader2
                      size={30}
                      className="mx-auto mb-2 animate-spin text-blue-600"
                    />
                    <p className="text-xs font-bold text-slate-600">
                      Loading orders from server…
                    </p>
                  </td>
                </tr>
              ) : paginatedOrders.length > 0 ? (
                paginatedOrders.map((order) => {
                  const isCOD =
                    String(order.paymentMethod).toLowerCase() === "cod";

                  return (
                    <tr
                      key={order._id || order.id}
                      className="group hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => setViewOrderModal(order)}
                          className="font-extrabold text-blue-600 hover:text-blue-800 hover:underline"
                          title="Click to view details"
                        >
                          {order.id}
                        </button>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 font-extrabold text-[10px] text-slate-600 border border-slate-200">
                            {getInitials(order.customerName)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-slate-900">
                              {order.customerName}
                            </p>
                            {order.customerPhone && (
                              <p className="truncate text-[10px] text-slate-400">
                                {order.customerPhone}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="max-w-[200px]">
                          <p
                            className="truncate font-semibold text-slate-800"
                            title={order.productName}
                          >
                            {order.productName}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400">
                            {order.itemCount}{" "}
                            {order.itemCount === 1 ? "item" : "items"}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-700">
                          {formatDate(order.date)}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {formatTime(order.date)}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-extrabold text-slate-900">
                          {money(order.totalAmount)}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                              order.paymentStatus === "Paid"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {order.paymentStatus === "Paid" ? (
                              <CheckCircle2 size={11} />
                            ) : (
                              <Clock size={11} />
                            )}
                            {order.paymentStatus}
                          </span>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                            {isCOD ? "Cash on Delivery" : "Online Payment"}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold shadow-sm ${getBadgeClass(
                            order.status,
                          )}`}
                        >
                          {getStatusIcon(order.status)}
                          {order.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewOrderModal(order)}
                            className="grid size-8 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                            title="Quick View Order"
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenStatusModal(order)}
                            className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
                            title="Update Status"
                          >
                            <Edit size={13} />
                            <span>Update</span>
                          </button>

                          <Link
                            to={`/vendor/orders/${order._id || order.id}`}
                            className="grid size-8 place-items-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:text-slate-900"
                            title="Full Order Details Page"
                          >
                            <ExternalLink size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center">
                    <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                      <ShoppingBag size={26} />
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      No vendor orders found
                    </p>
                    <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                      {isFiltered
                        ? "No orders match your filter criteria. Try resetting your search or filters."
                        : "Orders placed by customers for your store products will appear here automatically."}
                    </p>
                    {isFiltered && (
                      <button
                        type="button"
                        onClick={clearAllFilters}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
                      >
                        Reset filters
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {!loading && filteredOrders.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 outline-none"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>per page</span>
            </div>

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <span>
                Page <strong className="text-slate-900">{currentPage}</strong>{" "}
                of <strong className="text-slate-900">{totalPages}</strong>
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
                  title="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - currentPage) <= 1,
                  )
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    return (
                      <React.Fragment key={p}>
                        {prev && p - prev > 1 && (
                          <span className="px-1 text-slate-300">…</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          className={`size-8 rounded-lg text-xs font-bold transition ${
                            currentPage === p
                              ? "bg-blue-600 text-white shadow-sm"
                              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
                  title="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* VIEW ORDER MODAL */}
      {viewOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
                  Order Details
                </p>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Order #{viewOrderModal.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewOrderModal(null)}
                className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto p-6 space-y-5 text-xs text-slate-600">
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 border border-slate-200/80">
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Status
                  </p>
                  <span
                    className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${getBadgeClass(
                      viewOrderModal.status,
                    )}`}
                  >
                    {getStatusIcon(viewOrderModal.status)}
                    {viewOrderModal.status}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Placed On
                  </p>
                  <p className="mt-1 font-bold text-slate-800">
                    {formatDate(viewOrderModal.date)} ·{" "}
                    {formatTime(viewOrderModal.date)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Customer &amp; Shipping
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <User size={14} className="text-slate-400" />
                    <span>{viewOrderModal.customerName}</span>
                  </div>
                  {viewOrderModal.customerPhone && (
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-400" />
                      <span>{viewOrderModal.customerPhone}</span>
                    </div>
                  )}
                  {viewOrderModal.customerEmail && (
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-slate-400" />
                      <span>{viewOrderModal.customerEmail}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2 pt-1 border-t border-slate-100">
                    <MapPin
                      size={14}
                      className="text-slate-400 mt-0.5 shrink-0"
                    />
                    <span>
                      {viewOrderModal.shippingAddress?.addressLine1},{" "}
                      {viewOrderModal.shippingAddress?.city},{" "}
                      {viewOrderModal.shippingAddress?.state} -{" "}
                      {viewOrderModal.shippingAddress?.pincode} (
                      {viewOrderModal.shippingAddress?.country || "India"})
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Items ({viewOrderModal.items?.length || 1})
                </p>
                <div className="divide-y divide-slate-100">
                  {viewOrderModal.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="font-bold text-slate-900 truncate">
                          {item.productName || item.product?.name || "Product"}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Qty: {item.quantity || 1} ×{" "}
                          {money(item.unitPrice || 0)}
                        </p>
                      </div>
                      <p className="font-extrabold text-slate-900 shrink-0">
                        {money(
                          item.subtotal ||
                            (item.quantity || 1) * (item.unitPrice || 0),
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-slate-900 p-4 text-white">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Total Amount
                  </p>
                  <p className="text-xl font-extrabold text-white">
                    {money(viewOrderModal.totalAmount)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Payment
                  </p>
                  <p className="text-xs font-bold text-white uppercase">
                    {viewOrderModal.paymentMethod} ·{" "}
                    {viewOrderModal.paymentStatus}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  const o = viewOrderModal;
                  setViewOrderModal(null);
                  handleOpenStatusModal(o);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
              >
                <Edit size={14} />
                <span>Update Status</span>
              </button>

              <Link
                to={`/vendor/orders/${viewOrderModal._id || viewOrderModal.id}`}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                <span>Full Page View</span>
                <ExternalLink size={13} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE STATUS MODAL (Only Fulfillment Statuses) */}
      {updateStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
                  Update Fulfillment
                </p>
                <h3 className="text-base font-extrabold text-slate-900">
                  Order #{updateStatusModal.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setUpdateStatusModal(null)}
                className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {updateError && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-red-700 border border-red-200 font-semibold">
                  <AlertCircle size={15} className="shrink-0 text-red-600" />
                  <span>{updateError}</span>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-800">
                  Select New Status
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {["Pending", "Processing", "Shipped", "Delivered"].map(
                    (st) => {
                      const isSelected = selectedNewStatus === st;

                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setSelectedNewStatus(st)}
                          className={`flex items-center gap-2 rounded-xl border p-2.5 font-bold transition text-left ${
                            isSelected
                              ? "border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/20"
                              : "border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {getStatusIcon(st)}
                          <span>{st}</span>
                        </button>
                      );
                    },
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-slate-500 text-[11px] leading-relaxed">
                {selectedNewStatus === "Delivered"
                  ? "Marking as Delivered will automatically set COD payments to Paid."
                  : "Customer will receive real-time fulfillment notification."}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setUpdateStatusModal(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveStatusUpdate}
                disabled={updatingStatus}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {updatingStatus ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorOrders;
