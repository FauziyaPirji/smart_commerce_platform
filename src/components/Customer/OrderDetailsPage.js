import React, { useState, useEffect, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRoute";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  MapPin,
  Package,
  ShieldCheck,
  Store,
  Truck,
  CreditCard,
  Banknote,
  XCircle,
  CalendarDays,
  Loader2,
  AlertCircle,
  Copy,
  Printer,
  RefreshCw,
} from "lucide-react";

const API_BASE_URL = "https://smart-commerce-platform-backend.onrender.com/api";

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

const getStatusBadge = (status = "") => {
  const s = String(status).toLowerCase().trim();

  if (s === "delivered") {
    return {
      label: "Delivered",
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
      dot: "bg-emerald-500",
      icon: <CheckCircle2 size={13} className="text-emerald-600" />,
    };
  }
  if (s === "partially_delivered") {
    return {
      label: "Partially Delivered",
      bg: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800",
      dot: "bg-teal-500",
      icon: <Package size={13} className="text-teal-600" />,
    };
  }
  if (s === "shipped") {
    return {
      label: "In Transit",
      bg: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
      dot: "bg-blue-500",
      icon: <Truck size={13} className="text-blue-600" />,
    };
  }
  if (s === "partially_shipped") {
    return {
      label: "Partially Shipped",
      bg: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800",
      dot: "bg-indigo-500",
      icon: <Truck size={13} className="text-indigo-600" />,
    };
  }
  if (s === "cancelled") {
    return {
      label: "Cancelled",
      bg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800",
      dot: "bg-rose-500",
      icon: <XCircle size={13} className="text-rose-600" />,
    };
  }
  return {
    label: "Processing",
    bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
    dot: "bg-amber-500",
    icon: <Clock3 size={13} className="text-amber-600" />,
  };
};

const OrderDetailsPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedAWB, setCopiedAWB] = useState("");

  const fetchOrderDetails = async () => {
    if (!isLoggedIn()) {
      sessionStorage.setItem("redirectAfterLogin", `/orders/${orderId}`);
      navigate("/login");
      return;
    }

    setLoading(true);
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
        res = await axios.get(
          `${API_BASE_URL}/customer/orders/${orderId}`,
          config,
        );
      } catch (err1) {
        res = await axios.get(`${API_BASE_URL}/orders/${orderId}`, config);
      }

      if (res.data?.success && res.data?.order) {
        setOrder(res.data.order);
      } else if (res.data?.order) {
        setOrder(res.data.order);
      } else {
        setError("Order details not found.");
      }
    } catch (err) {
      handleAuthError(err);
      console.error("Fetch order details error:", err);
      if (typeof handleAuthError === "function") {
        handleAuthError(err);
      }
      setError(
        err.response?.data?.message ||
          "Unable to retrieve order details. Please verify the order ID or try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    } else {
      setLoading(false);
      setError("No order ID provided.");
    }
  }, [orderId, navigate]);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedAWB(key);
    setTimeout(() => setCopiedAWB(""), 2000);
  };

  // MULTI-VENDOR SHIPMENTS GROUPER
  const vendorShipments = useMemo(() => {
    if (!order || !Array.isArray(order.items) || order.items.length === 0) {
      return [];
    }

    const groups = {};

    order.items.forEach((item, index) => {
      const vendorObj = item.vendor || item.product?.vendor;
      const vendorId =
        (typeof vendorObj === "object"
          ? vendorObj?._id || vendorObj?.id
          : vendorObj) || `vendor_unassigned_${index}`;

      const storeName =
        (typeof vendorObj === "object"
          ? vendorObj?.storeName ||
            vendorObj?.businessName ||
            `${vendorObj?.firstName || ""} ${vendorObj?.lastName || ""}`.trim()
          : null) ||
        item.vendorStoreName ||
        "Verified Partner Store";

      if (!groups[vendorId]) {
        groups[vendorId] = {
          vendorId,
          storeName,
          items: [],
          status: item.status || order.orderStatus || "pending",
          carrier:
            item.carrier || order.shipping?.carrier || order.courier || "",
          trackingNumber:
            item.trackingNumber ||
            order.shipping?.trackingNumber ||
            order.trackingNumber ||
            "",
          deliveredAt: item.deliveredAt || order.deliveredAt,
          isPaid: item.isPaid ?? order.paymentStatus?.toLowerCase() === "paid",
        };
      }

      groups[vendorId].items.push(item);

      if (item.status) groups[vendorId].status = item.status;
      if (item.carrier) groups[vendorId].carrier = item.carrier;
      if (item.trackingNumber)
        groups[vendorId].trackingNumber = item.trackingNumber;
      if (item.deliveredAt) groups[vendorId].deliveredAt = item.deliveredAt;
    });

    return Object.values(groups);
  }, [order]);

  if (loading) {
    return (
      <main className="min-h-[70vh] bg-background px-4 py-16 flex flex-col items-center justify-center text-muted-foreground">
        <Loader2 size={36} className="animate-spin text-primary mb-3" />
        <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Loading Multi-Vendor Packages…
        </p>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-[70vh] bg-background px-4 py-16 flex items-center justify-center">
        <div className="max-w-md w-full text-center rounded-3xl border border-border bg-card p-8 shadow-xs">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-secondary text-primary mb-4">
            <Package size={26} />
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            Order Not Found
          </h1>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            {error || "Could not retrieve order details from our database."}
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Link
              to="/orders"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold hover:bg-secondary transition"
            >
              <ArrowLeft size={14} /> Back to Orders
            </Link>
            <button
              onClick={fetchOrderDetails}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 transition"
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  const displayId = order.orderNumber || order._id || order.id || orderId;
  const masterRawStatus = (
    order.orderStatus ||
    order.status ||
    "placed"
  ).toLowerCase();
  const masterBadge = getStatusBadge(masterRawStatus);
  const isMasterCancelled = masterRawStatus === "cancelled";

  const isCod = String(order.paymentMethod || "").toLowerCase() === "cod";
  const isPaid = order.paymentStatus?.toLowerCase() === "paid" || order.isPaid;

  const shippingAddr = order.shippingAddress || order.delivery || {};
  const subtotal = Number(order.subtotal || 0);
  const deliveryCharge = Number(order.deliveryCharge || 0);
  const discountAmount = Number(order.discountAmount || 0);
  const totalAmount = Number(
    order.totalAmount ||
      order.total ||
      subtotal + deliveryCharge - discountAmount,
  );

  return (
    <main className="min-h-screen bg-slate-50/60 dark:bg-background text-foreground pb-16">
      {/* TOP HEADER */}
      <section className="border-b border-border bg-card shadow-xs print:hidden">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            to="/orders"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft size={14} /> Back to all orders
          </Link>

          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  Order #{displayId}
                </h1>
                <button
                  type="button"
                  onClick={() => copyToClipboard(displayId, "orderId")}
                  className="text-muted-foreground hover:text-foreground p-1 transition"
                  title="Copy Order ID"
                >
                  {copiedAWB === "orderId" ? (
                    <Check size={15} className="text-emerald-500" />
                  ) : (
                    <Copy size={15} />
                  )}
                </button>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold shadow-2xs ${masterBadge.bg}`}
                >
                  {masterBadge.icon}
                  <span>Master Status: {masterBadge.label}</span>
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CalendarDays size={13} /> Placed on{" "}
                  {formatDate(order.placedAt || order.createdAt)}
                </span>
                <span>•</span>
                <span>
                  {vendorShipments.length}{" "}
                  {vendorShipments.length === 1
                    ? "Vendor Shipment"
                    : "Separate Vendor Shipments"}
                </span>
                <span>•</span>
                <span>
                  Payment:{" "}
                  <strong
                    className={
                      isPaid
                        ? "text-emerald-600 font-bold"
                        : "text-amber-600 font-bold"
                    }
                  >
                    {isCod ? "Cash on Delivery" : "Online Gateway"} (
                    {isPaid ? "PAID" : "PENDING"})
                  </strong>
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-foreground shadow-2xs hover:bg-secondary transition"
              >
                <Printer size={14} className="text-muted-foreground" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT GRID */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* LEFT COLUMN: MULTI-VENDOR SHIPMENTS */}
          <div className="space-y-8">
            {/* MASTER CANCELLED NOTIFICATION */}
            {isMasterCancelled && (
              <section className="rounded-3xl border border-rose-200 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-900 p-6">
                <div className="flex items-start gap-3.5">
                  <div className="grid size-10 place-items-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-900/40 shrink-0">
                    <XCircle size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                      This order was cancelled
                    </h3>
                    <p className="text-xs text-rose-700/80 dark:text-rose-400/80 mt-1 leading-relaxed">
                      {order.cancellationReason ||
                        "Cancelled. Restocked to respective vendor inventories."}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* VENDOR SHIPMENT PACKAGES */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    Vendor Shipments ({vendorShipments.length})
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Items from different sellers are dispatched in separate
                    packages with independent couriers.
                  </p>
                </div>
              </div>

              {vendorShipments.map((shipment, sIdx) => {
                const sStatus = shipment.status.toLowerCase();
                const sBadge = getStatusBadge(sStatus);

                const isDelivered = sStatus === "delivered";
                const isCancelled = sStatus === "cancelled";

                const stepLevels = {
                  pending: 1,
                  placed: 1,
                  confirmed: 2,
                  processing: 2,
                  shipped: 3,
                  delivered: 4,
                  cancelled: -1,
                };
                const currentLvl = stepLevels[sStatus] || 1;

                const shipmentTimeline = [
                  {
                    title: "Order Placed",
                    desc: "Order received by seller",
                    done: true,
                  },
                  {
                    title: "Processing",
                    desc: "Packaged & verified by seller",
                    done: currentLvl >= 2,
                  },
                  {
                    title: "Shipped",
                    desc: shipment.carrier
                      ? `In transit via ${shipment.carrier}`
                      : "Handed over to courier",
                    done: currentLvl >= 3,
                  },
                  {
                    title: "Delivered",
                    desc: isCod
                      ? isDelivered
                        ? "Delivered & COD Collected"
                        : "Pay cash on arrival"
                      : "Delivered to address",
                    done: isDelivered,
                  },
                ];

                return (
                  <div
                    key={shipment.vendorId || sIdx}
                    className="overflow-hidden rounded-3xl border border-border bg-card shadow-xs transition hover:border-slate-300 dark:hover:border-slate-700"
                  >
                    {/* PACKAGE HEADER */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/20 px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-xs">
                          {sIdx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              Package {sIdx + 1} of {vendorShipments.length}
                            </span>
                          </div>
                          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                            <Store size={14} className="text-primary" />
                            Sold &amp; Dispatched by {shipment.storeName}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${sBadge.bg}`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${sBadge.dot}`}
                          />
                          {sBadge.label}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 space-y-6">
                      {/* VENDOR'S INDEPENDENT STEPPER */}
                      {!isCancelled && (
                        <div className="rounded-2xl bg-secondary/30 p-4 border border-border/60">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                            Package Fulfillment Progress
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {shipmentTimeline.map((st, idx) => (
                              <div key={idx} className="relative">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`size-5 rounded-full grid place-items-center text-[10px] font-bold ${
                                      st.done
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground"
                                    }`}
                                  >
                                    {st.done ? <Check size={11} /> : idx + 1}
                                  </div>
                                  <span
                                    className={`text-xs font-bold ${st.done ? "text-foreground" : "text-muted-foreground"}`}
                                  >
                                    {st.title}
                                  </span>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1 pl-7 leading-tight line-clamp-1">
                                  {st.desc}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ITEMS BELONGING TO THIS VENDOR */}
                      <div className="divide-y divide-border/60">
                        {shipment.items.map((it, idx) => {
                          const prod = it.product || {};
                          const prodId = prod._id || it.product || it.id || idx;
                          const title =
                            it.productName ||
                            prod.name ||
                            prod.title ||
                            "Product";
                          const img =
                            it.productImage ||
                            (prod.images && prod.images[0]?.url) ||
                            (prod.images && prod.images[0]) ||
                            prod.image ||
                            "";
                          const qty = Number(it.quantity || 1);
                          const price = Number(it.unitPrice || prod.price || 0);

                          return (
                            <div
                              key={idx}
                              className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                <Link
                                  to={`/product/${prodId}`}
                                  className="shrink-0"
                                >
                                  {img ? (
                                    <img
                                      src={img}
                                      alt={title}
                                      className="size-16 rounded-2xl object-cover border border-border bg-slate-100 dark:bg-slate-800"
                                    />
                                  ) : (
                                    <div className="size-16 rounded-2xl bg-secondary grid place-items-center text-xs font-black text-muted-foreground border border-border">
                                      {getInitials(title)}
                                    </div>
                                  )}
                                </Link>

                                <div className="min-w-0 flex-1">
                                  <Link
                                    to={`/product/${prodId}`}
                                    className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white hover:text-primary line-clamp-1 transition"
                                  >
                                    {title}
                                  </Link>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Price: {money(price)} · Qty:{" "}
                                    <strong className="text-foreground">
                                      {qty}
                                    </strong>
                                  </p>
                                </div>
                              </div>

                              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                                <span className="text-sm font-black text-slate-900 dark:text-white">
                                  {money(price * qty)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DELIVERY ADDRESS */}
            <section className="rounded-3xl border border-border bg-card p-6 shadow-xs">
              <div className="flex items-start gap-4">
                <div className="grid size-11 place-items-center rounded-2xl bg-secondary text-primary shrink-0">
                  <MapPin size={20} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                    Delivery Destination
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {shippingAddr.fullName || shippingAddr.name || "Customer"}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                    {shippingAddr.addressLine1 ||
                      shippingAddr.address ||
                      "Street Address"}
                    {shippingAddr.addressLine2
                      ? `, ${shippingAddr.addressLine2}`
                      : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {shippingAddr.city || ""}, {shippingAddr.state || ""} -{" "}
                    {shippingAddr.pincode || ""} (
                    {shippingAddr.country || "India"})
                  </p>
                  {shippingAddr.phone && (
                    <p className="text-xs font-semibold text-foreground mt-2">
                      Contact: {shippingAddr.phone}
                    </p>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: FINANCIAL BREAKDOWN */}
          <aside className="space-y-6 lg:sticky lg:top-24 h-fit">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary block">
                Order Billing Summary
              </span>

              <div className="space-y-2.5 text-xs text-muted-foreground border-b border-border/80 pb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-foreground">
                    {money(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping & Delivery</span>
                  <span
                    className={
                      deliveryCharge === 0
                        ? "text-emerald-600 font-bold"
                        : "font-bold text-foreground"
                    }
                  >
                    {deliveryCharge === 0 ? "FREE" : money(deliveryCharge)}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span className="font-bold">-{money(discountAmount)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-xs font-bold text-muted-foreground block">
                    Total Amount
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Inclusive of all taxes
                  </span>
                </div>
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {money(totalAmount)}
                </span>
              </div>
            </div>

            {/* PAYMENT STATE */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary block">
                Payment Breakdown
              </span>

              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-2xl bg-secondary text-primary shrink-0">
                  {isCod ? <Banknote size={18} /> : <CreditCard size={18} />}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white uppercase">
                    {isCod
                      ? "Cash On Delivery (COD)"
                      : order.paymentMethod || "Online Gateway"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {isCod
                      ? masterRawStatus === "delivered"
                        ? "Paid in full upon delivery"
                        : "Pay cash as vendor packages arrive"
                      : "Verified Razorpay Payment"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-secondary/50 p-3 flex items-center justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Payment Status:</span>
                <span
                  className={
                    isPaid
                      ? "text-emerald-600 font-bold"
                      : "text-amber-600 font-bold"
                  }
                >
                  {isPaid ? "PAID" : "PENDING"}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/60 p-4 flex items-center gap-2.5 text-xs text-muted-foreground">
              <ShieldCheck size={18} className="text-primary shrink-0" />
              <span>Multi-Vendor Quality & Delivery Assurance</span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default OrderDetailsPage;
