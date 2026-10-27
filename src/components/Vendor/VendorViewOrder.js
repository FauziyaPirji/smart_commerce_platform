import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRouteVendor";
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Printer,
  RefreshCw,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Banknote,
  Edit3,
  X,
  Save,
  Copy,
  Check,
  ShieldCheck,
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000/api/vendors";

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

const getBadgeStyle = (status = "") => {
  const s = status.toLowerCase();
  if (s.includes("delivered") || s.includes("completed")) {
    return {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dot: "bg-emerald-500",
      label: "Delivered",
    };
  }
  if (
    s.includes("shipped") ||
    s.includes("transit") ||
    s.includes("dispatch")
  ) {
    return {
      bg: "bg-blue-50 text-blue-700 border-blue-200",
      dot: "bg-blue-500",
      label: "Shipped",
    };
  }
  if (s.includes("process")) {
    return {
      bg: "bg-amber-50 text-amber-700 border-amber-200",
      dot: "bg-amber-500",
      label: "Processing",
    };
  }
  if (s.includes("cancel")) {
    return {
      bg: "bg-rose-50 text-rose-700 border-rose-200",
      dot: "bg-rose-500",
      label: "Cancelled",
    };
  }
  return {
    bg: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
    label: "Pending",
  };
};

const VendorViewOrder = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Status update modal state
  const [isUpdating, setIsUpdating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Processing");
  const [courierName, setCourierName] = useState("");
  const [trackingCode, setTrackingCode] = useState("");

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError(null);
    const token = getToken();

    if (!token) {
      setError("Vendor authentication token not found. Please log in.");
      setLoading(false);
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Cache-Control": "no-cache",
    };

    try {
      let res;
      try {
        res = await axios.get(`${API_BASE_URL}/orders/${orderId}`, { headers });
      } catch (err1) {
        // Fallback endpoint if plural route is not matched
        res = await axios.get(
          `http://localhost:5000/api/vendor/orders/${orderId}`,
          {
            headers,
          },
        );
      }

      const fetched = res.data?.order || res.data?.data || res.data;
      if (!fetched) {
        throw new Error("Order details not returned by server.");
      }

      setOrder(fetched);
      setSelectedStatus(fetched.orderStatus || fetched.status || "Processing");
      setCourierName(fetched.courier || fetched.shipping?.carrier || "");
      setTrackingCode(
        fetched.trackingNumber || fetched.shipping?.trackingNumber || "",
      );
    } catch (err) {
      handleAuthError(err);
      console.error("Order fetch error:", err);
      // Fallback: Check if order exists in vendor's full list
      try {
        const listRes = await axios.get(`${API_BASE_URL}/orders`, { headers });
        const list = listRes.data?.orders || listRes.data?.data || [];
        const match = list.find(
          (o) =>
            o._id === orderId || o.id === orderId || o.orderNumber === orderId,
        );
        if (match) {
          setOrder(match);
          setSelectedStatus(match.orderStatus || match.status || "Processing");
          setCourierName(match.courier || match.shipping?.carrier || "");
          setTrackingCode(
            match.trackingNumber || match.shipping?.trackingNumber || "",
          );
          setLoading(false);
          return;
        }
      } catch (fallbackErr) {
        handleAuthError(fallbackErr);
        console.error("List fallback failed:", fallbackErr);
      }

      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not load order details.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) fetchOrderDetails();
  }, [orderId]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setUpdateError("");
    const token = getToken();

    const payload = {
      status: selectedStatus,
      orderStatus: selectedStatus,
      carrier: courierName,
      courier: courierName,
      trackingNumber: trackingCode,
    };

    const targetId = order._id || order.id || orderId;

    try {
      let res;
      try {
        res = await axios.put(
          `${API_BASE_URL}/orders/${targetId}/status`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } },
        );
      } catch (err1) {
        res = await axios.put(
          `http://localhost:5000/api/vendor/orders/${targetId}/status`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } },
        );
      }

      const updated = res.data?.order || res.data?.data;
      if (updated) {
        setOrder((prev) => ({
          ...prev,
          ...updated,
          orderStatus: selectedStatus,
          status: selectedStatus,
          courier: courierName,
          trackingNumber: trackingCode,
          paymentStatus:
            selectedStatus.toLowerCase() === "delivered" &&
            String(prev.paymentMethod).toLowerCase() === "cod"
              ? "Paid"
              : updated.paymentStatus || prev.paymentStatus,
        }));
      } else {
        setOrder((prev) => ({
          ...prev,
          orderStatus: selectedStatus,
          status: selectedStatus,
          courier: courierName,
          trackingNumber: trackingCode,
          paymentStatus:
            selectedStatus.toLowerCase() === "delivered" &&
            String(prev.paymentMethod).toLowerCase() === "cod"
              ? "Paid"
              : prev.paymentStatus,
        }));
      }

      setIsUpdating(false);
    } catch (err) {
      handleAuthError(err);
      console.error("Fulfillment update error:", err);
      setUpdateError(
        err.response?.data?.message || "Failed to update fulfillment status.",
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-slate-500">
        <RefreshCw size={36} className="animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-bold text-slate-700">
          Loading Order Details…
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white border border-slate-200 rounded-3xl text-center shadow-sm">
        <div className="size-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <AlertCircle size={28} />
        </div>
        <h2 className="text-lg font-extrabold text-slate-900 mb-2">
          Order Not Found
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          {error || "Unable to retrieve order details."}
        </p>
        <div className="flex gap-2 justify-center">
          <Link
            to="/vendor/orders"
            className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            Back to Orders
          </Link>
          <button
            onClick={fetchOrderDetails}
            className="px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition flex items-center gap-1.5"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  // Safe data normalization
  const displayId = order.orderNumber || order._id || order.id || orderId;
  const currentStatus = order.orderStatus || order.status || "Pending";
  const badge = getBadgeStyle(currentStatus);

  const customer = order.customer || order.user || {};
  const customerName =
    order.customerName ||
    order.shippingAddress?.fullName ||
    customer.name ||
    `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
    "Customer";
  const customerEmail =
    customer.email ||
    order.shippingAddress?.email ||
    order.customerEmail ||
    "N/A";
  const customerPhone =
    customer.phone ||
    order.shippingAddress?.phone ||
    order.customerPhone ||
    "N/A";

  const address = order.shippingAddress || {};
  const formattedAddress = [
    address.addressLine1 || address.street || address.address,
    address.addressLine2,
    address.city,
    address.state,
    address.pincode || address.zipCode,
    address.country || "India",
  ]
    .filter(Boolean)
    .join(", ");

  const items =
    Array.isArray(order.items) && order.items.length > 0
      ? order.items
      : [
          {
            productName: order.productName || "Ordered Product",
            productImage: order.productImage || "",
            quantity: order.quantity || 1,
            unitPrice: order.price || order.totalAmount || 0,
            subtotal:
              order.totalAmount || (order.price || 0) * (order.quantity || 1),
          },
        ];

  const totalPayout = Number(
    order.totalAmount ??
      items.reduce(
        (sum, it) =>
          sum + (it.subtotal || it.unitPrice * (it.quantity || 1) || 0),
        0,
      ),
  );

  const paymentMethod =
    order.paymentMethod || order.payment?.method || "online";
  const isCod = String(paymentMethod).toLowerCase() === "cod";
  const paymentStatus =
    order.paymentStatus || (order.isPaid ? "Paid" : isCod ? "Pending" : "Paid");
  const createdAt = order.date || order.createdAt || order.placedAt;

  // Dynamic Timeline builder based on status
  const statusLevels = {
    pending: 1,
    processing: 2,
    shipped: 3,
    delivered: 4,
    cancelled: -1,
  };
  const currentLevel = statusLevels[currentStatus.toLowerCase()] || 1;

  const timelineSteps = [
    {
      title: "Order Placed",
      desc: "Buyer placed order on store",
      date: formatDate(createdAt) + " " + formatTime(createdAt),
      done: true,
    },
    {
      title: "Processing by Vendor",
      desc: "Packaging & quality check",
      date: currentLevel >= 2 ? "In Progress / Ready" : "Awaiting processing",
      done: currentLevel >= 2,
    },
    {
      title: "Shipped",
      desc: courierName
        ? `Handed over to ${courierName}`
        : "Dispatched to courier",
      date: currentLevel >= 3 ? "Dispatched" : "Pending pickup",
      done: currentLevel >= 3,
    },
    {
      title: "Delivered",
      desc: isCod
        ? "Delivered & COD Collected"
        : "Package delivered to customer",
      date:
        currentLevel >= 4
          ? formatDate(order.deliveredAt || new Date())
          : "Estimated soon",
      done: currentLevel >= 4,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-2xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition shadow-sm"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                Order #{displayId}
              </h1>
              <button
                type="button"
                onClick={() => handleCopy(displayId)}
                className="text-slate-400 hover:text-slate-600 p-1 transition"
                title="Copy Order ID"
              >
                {copied ? (
                  <Check size={14} className="text-emerald-600" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <Calendar size={13} /> Placed on {formatDate(createdAt)} at{" "}
              {formatTime(createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold shadow-sm hover:bg-slate-50 transition"
          >
            <Printer size={14} className="text-slate-400" />
            <span>Print Invoice</span>
          </button>

          {/* <button
            type="button"
            onClick={() => setIsUpdating(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
          >
            <Edit3 size={14} />
            <span>Update Fulfillment</span>
          </button> */}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Items, Status & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Quick Banner */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-2 ${badge.bg}`}
              >
                <span className={`size-2 rounded-full ${badge.dot}`} />
                {currentStatus.toUpperCase()}
              </span>
              <span className="text-xs text-slate-300">|</span>
              <span className="text-xs font-semibold text-slate-600">
                Payment:{" "}
                <strong
                  className={
                    paymentStatus.toLowerCase() === "paid"
                      ? "text-emerald-600"
                      : "text-amber-600"
                  }
                >
                  {paymentStatus}
                </strong>{" "}
                ({isCod ? "Cash on Delivery" : "Online"})
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                Total Payout
              </span>
              <span className="text-lg font-black text-slate-900">
                {money(totalPayout)}
              </span>
            </div>
          </div>

          {/* Purchased Products Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Package size={16} className="text-blue-600" />
                Your Products in this Order ({items.length})
              </h2>
            </div>

            <div className="divide-y divide-slate-100">
              {items.map((it, idx) => {
                const prod = it.product || {};
                const name =
                  it.productName || prod.name || prod.title || "Product Item";
                const img =
                  it.productImage ||
                  (prod.images && prod.images[0]?.url) ||
                  (prod.images && prod.images[0]) ||
                  prod.image ||
                  "https://placehold.co/100x100?text=No+Image";
                const qty = it.quantity || 1;
                const price = Number(it.unitPrice || prod.price || 0);
                const lineTotal = Number(it.subtotal || price * qty);

                return (
                  <div
                    key={idx}
                    className="p-5 flex items-center gap-4 hover:bg-slate-50/50 transition"
                  >
                    <img
                      src={img}
                      alt={name}
                      className="size-16 rounded-2xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm truncate">
                        {name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Price: {money(price)} · Qty:{" "}
                        <strong className="text-slate-700">{qty}</strong>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {money(lineTotal)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-5 bg-slate-50/70 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-800">
                  {money(totalPayout)}
                </span>
              </div>
              <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-2 border-t border-slate-200">
                <span>Total Vendor Revenue</span>
                <span className="text-blue-600">{money(totalPayout)}</span>
              </div>
            </div>
          </div>

          {/* Fulfillment Timeline */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-6 flex items-center gap-2">
              <Clock size={16} className="text-blue-600" /> Fulfillment Timeline
            </h2>

            <div className="relative pl-6 border-l-2 border-blue-100 space-y-7 ml-3">
              {timelineSteps.map((step, idx) => (
                <div key={idx} className="relative">
                  <div
                    className={`absolute -left-[31px] top-0 size-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      step.done
                        ? "bg-blue-600 text-white ring-4 ring-blue-50"
                        : "bg-slate-200 text-slate-400"
                    }`}
                  >
                    {step.done ? <CheckCircle2 size={14} /> : idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <h4
                        className={`text-xs font-bold ${step.done ? "text-slate-900" : "text-slate-400"}`}
                      >
                        {step.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {step.date}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Customer, Address & Courier */}
        <div className="space-y-6">
          {/* Customer Profile Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm">
            <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-1.5">
              <User size={14} className="text-blue-600" /> Customer Information
            </h3>
            <div className="space-y-2.5 text-xs">
              <p className="font-extrabold text-slate-900 text-sm">
                {customerName}
              </p>
              {/* <div className="flex items-center gap-2 text-slate-600">
                <Mail size={13} className="text-slate-400 shrink-0" />
                <a href={`mailto:${customerEmail}`} className="truncate hover:text-blue-600">
                  {customerEmail}
                </a>
              </div> */}
              <div className="flex items-center gap-2 text-slate-600">
                <Phone size={13} className="text-slate-400 shrink-0" />
                <a
                  href={`tel:${customerPhone}`}
                  className="hover:text-blue-600"
                >
                  {customerPhone}
                </a>
              </div>
            </div>
          </div>

          {/* Shipping Address Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm">
            <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-1.5">
              <MapPin size={14} className="text-blue-600" /> Shipping
              Destination
            </h3>
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              {formattedAddress || "No physical shipping address provided."}
            </p>
            {address.pincode && (
              <span className="mt-3 inline-block rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                PIN: {address.pincode}
              </span>
            )}
          </div>

          {/* Courier & Shipping Logistics
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Truck size={14} className="text-blue-600" /> Courier &amp; Tracking
              </h3>
              <button
                type="button"
                onClick={() => setIsUpdating(true)}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400">Carrier:</span>
                <span className="font-bold text-slate-800">{courierName || "Not assigned"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400">Tracking Code:</span>
                <span className="font-mono font-bold text-slate-800">{trackingCode || "N/A"}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Method:</span>
                <span className="font-bold text-slate-800">Standard Surface</span>
              </div>
            </div>
          </div> */}
        </div>
      </div>

      {/* UPDATE STATUS MODAL */}
      {isUpdating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
                  Fulfillment Status
                </p>
                <h3 className="text-base font-extrabold text-slate-900">
                  Update Order #{displayId}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsUpdating(false)}
                className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleUpdateStatus}
              className="p-6 space-y-4 text-xs"
            >
              {updateError && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-red-700 border border-red-200 font-semibold">
                  <AlertCircle size={15} className="shrink-0 text-red-600" />
                  <span>{updateError}</span>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-800 uppercase text-[11px] block mb-1.5">
                  Package Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                >
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 uppercase text-[11px] block mb-1.5">
                  Courier / Logistics Partner
                </label>
                <input
                  type="text"
                  placeholder="e.g. BlueDart, Delhivery, DTDC"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 uppercase text-[11px] block mb-1.5">
                  Tracking Code (AWB #)
                </label>
                <input
                  type="text"
                  placeholder="e.g. DEL9823145"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                />
              </div>

              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-slate-500 text-[11px] leading-relaxed">
                Updating to <strong>Delivered</strong> will automatically record
                Cash on Delivery (COD) as <strong>Paid</strong> for your
                package.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUpdating(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {updating ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  <span>Save Fulfillment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorViewOrder;
