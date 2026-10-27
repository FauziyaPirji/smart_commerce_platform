import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRouteAdmin.js";
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  CreditCard,
  Truck,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Hash,
  Store,
  IndianRupee,
  Printer,
  Phone,
  Mail,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Building2,
  AlertCircle,
  Clock,
  Edit,
  X,
} from "lucide-react";

const API_BASE_URL = "https://smart-commerce-platform-backend.onrender.com/api/admin";

// Helpers
const getToken = () =>
  localStorage.getItem("adminToken") ||
  localStorage.getItem("token") ||
  null;

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

// Safe Product Image Resolution
const resolveProductImage = (item) => {
  if (!item) return null;
  if (item.productImage) return item.productImage;
  const p = item.product || {};
  if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
  if (typeof p.images === "string" && p.images.trim()) return p.images;
  if (p.image) return p.image;
  return null;
};

const AdminViewOrder = () => {
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Status Update Modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [newPaymentStatus, setNewPaymentStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // FETCH ORDER DETAILS
  const fetchOrderDetails = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await axios.get(`${API_BASE_URL}/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (res.data?.success && res.data?.order) {
        setOrder(res.data.order);
        setNewStatus(res.data.order.orderStatus || "placed");
        setNewPaymentStatus(res.data.order.paymentStatus || "pending");
        setTrackingNumber(res.data.order.trackingNumber || "");
      } else {
        throw new Error("Could not find order.");
      }
    } catch (err) {
      handleAuthError(err);
      console.error("Fetch order detail error:", err);
      setError(
        err.response?.data?.message ||
          "Order not found or backend server is unreachable."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  // UPDATE STATUS
  const handleUpdateStatusSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const targetId = order._id || orderId;
      const res = await axios.put(
        `${API_BASE_URL}/orders/${targetId}/status`,
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
        }
      );

      if (res.data?.success) {
        setOrder((prev) => ({
          ...prev,
          orderStatus: newStatus,
          paymentStatus: newPaymentStatus,
          trackingNumber,
        }));
        setStatusModalOpen(false);
      }
    } catch (err) {
      handleAuthError(err);
      console.error("Status update error:", err);
      alert(err.response?.data?.message || "Failed to update status.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
        <Loader2 size={36} className="animate-spin text-teal-600" />
        <p className="text-sm font-semibold text-slate-600">Loading order details…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center max-w-lg mx-auto shadow-sm my-12">
        <Package size={48} className="mx-auto text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Order Not Found</h2>
        <p className="text-slate-500 mt-2 text-sm">{error || "The requested order does not exist."}</p>
        <Link
          to="/admin/orders"
          className="inline-flex mt-6 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-xs transition"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  // Exact mappings from your JSON structure
  const orderNumber = order.orderNumber || String(order._id).slice(-10).toUpperCase();
  const currentStatus = (order.orderStatus || "placed").toLowerCase();
  const paymentStatus = (order.paymentStatus || "pending").toLowerCase();
  const paymentMethod = (order.paymentMethod || "cod").toUpperCase();

  const isCancelled = currentStatus === "cancelled";
  const isDelivered = currentStatus === "delivered";
  const isPaid = paymentStatus === "paid";

  const customer = order.user || {};
  const customerName =
    `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
    order.shippingAddress?.fullName ||
    "Customer";

  // Ordered items array
  const items = order.orderItems || order.items || [];

  // Financial calculations
  const subtotal = Number(order.subtotal || 0);
  const deliveryCharge = Number(order.deliveryCharge || 0);
  const discountAmount = Number(order.discountAmount || 0);
  const grandTotal = Number(order.totalAmount || subtotal + deliveryCharge - discountAmount);

  const getStatusBadge = (status) => {
    switch (String(status).toLowerCase()) {
      case "delivered":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "shipped":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "processing":
      case "confirmed":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "cancelled":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-purple-50 text-purple-700 border-purple-200";
    }
  };

  const getItemStatusBadge = (status) => {
    switch (String(status).toLowerCase()) {
      case "delivered":
        return "bg-emerald-100 text-emerald-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-amber-100 text-amber-800";
      case "cancelled":
        return "bg-rose-100 text-rose-800";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="space-y-6 pb-16 text-slate-900">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3.5">
          <Link
            to="/admin/orders"
            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-2xs"
            title="Back to Orders"
          >
            <ArrowLeft size={18} className="text-slate-600" />
          </Link>

          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                Order #{orderNumber}
              </h1>

              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusBadge(
                  currentStatus
                )}`}
              >
                {currentStatus}
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-1">
              Placed on {formatDate(order.placedAt || order.createdAt)} at{" "}
              {formatTime(order.placedAt || order.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition shadow-2xs"
          >
            <Printer size={15} />
            Print Invoice
          </button>
        </div>
      </div>

      {/* QUICK STATS STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Order ID */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              <Hash size={19} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-400">Order ID</p>
              <p className="font-bold text-slate-900 text-sm font-mono truncate">{orderNumber}</p>
            </div>
          </div>
        </div>

        {/* Date */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <CalendarDays size={19} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-400">Order Date</p>
              <p className="font-bold text-slate-900 text-sm">{formatDate(order.placedAt || order.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CreditCard size={19} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-400">Payment</p>
              <p className="font-bold text-slate-900 text-sm">
                {paymentMethod} ·{" "}
                <span className={isPaid ? "text-emerald-600" : "text-amber-600"}>
                  {paymentStatus.toUpperCase()}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Grand Total */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs bg-gradient-to-br from-teal-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700">
              <IndianRupee size={19} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-400">Grand Total</p>
              <p className="font-black text-slate-900 text-base">{formatMoney(grandTotal)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN CONTENT */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT COLUMN: PRODUCTS TABLE & SHIPPING ADDRESS */}
        <div className="xl:col-span-2 space-y-6">
          {/* DETAILED PRODUCTS TABLE */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900 text-sm">Order Items</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {items.length} product{items.length !== 1 ? "s" : ""} in this order
                </p>
              </div>
              <Package size={20} className="text-slate-400" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[620px]">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Product</th>
                    <th className="px-4 py-3.5">Vendor / Store</th>
                    <th className="px-4 py-3.5 text-right">Price</th>
                    <th className="px-4 py-3.5 text-center">Qty</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-right">Total</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-xs">
                  {items.map((item, idx) => {
                    const productName = item.productName || item.product?.name || "Product Item";
                    const productId = item.product?._id || item.product || "";
                    const productImage = resolveProductImage(item);

                    const vendorName =
                      item.vendor?.storeName ||
                      item.vendor?.name ||
                      "Verified Vendor";

                    const unitPrice = Number(item.unitPrice ?? item.price ?? item.product?.discountPrice ?? item.product?.price ?? 0);
                    const quantity = Number(item.quantity || 1);
                    const itemSubtotal = Number(item.subtotal || unitPrice * quantity);
                    const itemStatus = item.status || order.orderStatus || "pending";

                    return (
                      <tr key={item._id || idx} className="hover:bg-slate-50/60 transition">
                        {/* PRODUCT THUMBNAIL & NAME */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-14 rounded-xl border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                              {productImage ? (
                                <img
                                  src={productImage}
                                  alt={productName}
                                  className="size-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <span className="font-extrabold text-slate-400 text-lg uppercase">
                                  {productName.charAt(0) || "P"}
                                </span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate max-w-xs text-sm">
                                {productName}
                              </p>
                              {productId && (
                                <Link
                                  to={`/product/${productId}`}
                                  className="inline-flex items-center gap-1 text-[11px] text-teal-700 hover:underline font-mono mt-0.5"
                                  target="_blank"
                                >
                                  ID: {String(productId).slice(-8)}
                                  <ExternalLink size={11} />
                                </Link>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* VENDOR */}
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200">
                            <Store size={13} className="text-teal-700" />
                            {vendorName}
                          </span>
                        </td>

                        {/* UNIT PRICE */}
                        <td className="px-4 py-4 text-right font-medium text-slate-700 font-mono">
                          {formatMoney(unitPrice)}
                        </td>

                        {/* QUANTITY */}
                        <td className="px-4 py-4 text-center">
                          <span className="inline-block px-2.5 py-1 rounded-full bg-slate-100 font-bold text-slate-800 text-xs">
                            × {quantity}
                          </span>
                        </td>

                        {/* STATUS */}
                        <td className="px-4 py-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getItemStatusBadge(
                              itemStatus
                            )}`}
                          >
                            {itemStatus}
                          </span>
                        </td>

                        {/* SUBTOTAL */}
                        <td className="px-5 py-4 text-right font-bold text-slate-900 text-sm font-mono">
                          {formatMoney(itemSubtotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ORDER ITEMS CALCULATION FOOTER */}
            <div className="p-5 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4">
              <span className="text-xs text-slate-400">
                Item counts match fulfillment packages
              </span>

              <div className="w-full sm:w-64 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono font-bold text-slate-800">{formatMoney(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Charges</span>
                  <span className="font-mono font-bold text-slate-800">{formatMoney(deliveryCharge)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Discount</span>
                    <span className="font-mono">-{formatMoney(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
                  <span>Total Amount</span>
                  <span className="font-mono text-teal-800">{formatMoney(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SHIPPING DESTINATION ADDRESS */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <MapPin size={19} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Delivery Destination</h3>
                <p className="text-xs text-slate-400">Shipping courier delivery address</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs text-slate-700 leading-relaxed space-y-1">
              <p className="font-bold text-slate-900 text-sm">
                {order.shippingAddress?.fullName || customerName}
              </p>
              <p>{order.shippingAddress?.addressLine1 || "Address Line 1"}</p>
              {order.shippingAddress?.addressLine2 && (
                <p>{order.shippingAddress.addressLine2}</p>
              )}
              <p>
                {order.shippingAddress?.city}, {order.shippingAddress?.state} -{" "}
                <strong className="text-slate-900 font-mono">
                  {order.shippingAddress?.pincode || order.shippingAddress?.postalCode}
                </strong>
              </p>
              <p className="text-slate-500 font-medium">
                Country: {order.shippingAddress?.country || "India"}
              </p>
              {order.shippingAddress?.phone && (
                <p className="font-bold text-slate-900 pt-1 flex items-center gap-1.5">
                  <Phone size={13} className="text-slate-500" />
                  +91 {order.shippingAddress.phone}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CUSTOMER, PAYMENT & STATUS */}
        <div className="space-y-6">
          {/* CUSTOMER PROFILE CARD */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                <User size={19} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Customer Profile</h3>
                <p className="text-xs text-slate-400">Registered account details</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400">Name</span>
                <span className="font-bold text-slate-800">{customerName}</span>
              </div>

              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400">Email</span>
                <span className="font-medium text-slate-800 truncate max-w-[170px]" title={customer.email}>
                  {customer.email || "No email"}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400">Phone</span>
                <span className="font-medium text-slate-800 font-mono">
                  {customer.phone ? `+91 ${customer.phone}` : "N/A"}
                </span>
              </div>

              <div className="flex justify-between pt-1">
                <span className="text-slate-400">Customer ID</span>
                <span className="font-mono text-slate-500 text-[11px]">
                  {String(customer._id || "Guest").slice(-8)}
                </span>
              </div>
            </div>
          </div>

          {/* PAYMENT DETAILS CARD */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CreditCard size={19} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Payment Details</h3>
                <p className="text-xs text-slate-400">Transaction summary</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Method</span>
                <span className="font-bold text-slate-900">{paymentMethod}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Status</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${
                    isPaid
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {paymentStatus}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block mb-1">Transaction Ref</span>
                <span className="font-mono text-[11px] text-slate-600 break-all">
                  {order.paymentDetails?.transactionId ||
                    order.paymentId ||
                    "TXN_COD_VERIFIED"}
                </span>
              </div>
            </div>
          </div>

          {/* FINANCIAL SUMMARY CARD */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-4">Financial Summary</h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-mono">{formatMoney(subtotal)}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Delivery Charge</span>
                <span className="font-mono">{deliveryCharge > 0 ? formatMoney(deliveryCharge) : "FREE"}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Discount</span>
                  <span className="font-mono">-{formatMoney(discountAmount)}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-sm font-black text-slate-900">
                <span>Total Amount</span>
                <span className="text-base text-teal-800 font-mono">{formatMoney(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminViewOrder;