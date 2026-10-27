import React, { useState, useEffect, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRouteAdmin";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  Calendar,
  CreditCard,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  Power,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Package,
} from "lucide-react";

const API_BASE_URL = "https://smart-commerce-platform-backend.onrender.com/api";

const formatMoney = (val) =>
  `₹${new Intl.NumberFormat("en-IN").format(Number(val) || 0)}`;

const formatNumber = (val) => {
  const num = Number(val);
  return isNaN(num) ? "0" : num.toLocaleString("en-IN");
};

const getInitials = (name) => {
  if (!name) return "CU";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const AdminViewCustomer = () => {
  const token = localStorage.getItem("adminToken");
  const { customerId } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [error, setError] = useState("");
  const [copiedKey, setCopiedKey] = useState(null);

  // Copy helper
  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // FETCH CUSTOMER BY ID
  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_BASE_URL}/admin/customers/${customerId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
        },
      );

      if (response.data && response.data.success) {
        setCustomer(response.data.customer);
      } else {
        setCustomer(null);
        setError("Customer data not found.");
      }
    } catch (err) {
      handleAuthError(err);
      console.error("Error fetching customer details:", err);
      setError(
        err.response?.data?.message ||
          "Unable to find the requested customer in database.",
      );
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchCustomerDetails();
    }
  }, [customerId]);

  // TOGGLE ACTIVE / INACTIVE STATUS
  const handleToggleStatus = async () => {
    if (!customer) return;
    const isCurrentlyActive = customer.status === "Active";
    const newStatus = isCurrentlyActive ? "Inactive" : "Active";

    if (
      !window.confirm(
        `Are you sure you want to change account status to ${newStatus}?`,
      )
    )
      return;

    try {
      setStatusUpdating(true);
      const res = await axios.put(
        `${API_BASE_URL}/admin/customers/${customer.id || customer._id}/status`,
        { status: newStatus },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
        },
      );

      if (res.data && res.data.success) {
        setCustomer((prev) => ({
          ...prev,
          status: newStatus,
        }));
      }
    } catch (err) {
      handleAuthError(err);
      console.error("Error updating customer status:", err);
      alert(err.response?.data?.message || "Failed to update status.");
    } finally {
      setStatusUpdating(false);
    }
  };

  // AOV (Average Order Value) calculation
  const averageOrderValue = useMemo(() => {
    if (!customer) return 0;
    const ordersCount = Number(customer.orders || 0);
    const total = Number(customer.totalSpent || 0);
    return ordersCount > 0 ? Math.round(total / ordersCount) : 0;
  }, [customer]);

  // Status Badge Helper
  const getOrderStatusBadge = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "delivered")
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (s === "cancelled") return "bg-rose-50 text-rose-700 border-rose-200";
    if (s === "shipped") return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-amber-50 text-amber-700 border-amber-200";
  };

  const getPaymentStatusBadge = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "paid")
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (s === "failed") return "bg-rose-50 text-rose-700 border-rose-200";
    return "bg-slate-100 text-slate-600 border-slate-200";
  };

  // LOADING STATE
  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-xs">
        <Loader2 size={38} className="animate-spin text-[#287b6d]" />
        <p className="mt-3 text-xs font-bold text-slate-700">
          Loading customer profile & purchasing data...
        </p>
        <p className="mt-1 text-[11px] text-slate-400">Please wait a moment</p>
      </div>
    );
  }

  // NOT FOUND / ERROR STATE
  if (!customer || error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
            <User size={26} />
          </div>
          <h2 className="mt-4 text-lg font-black text-slate-900">
            Customer Not Found
          </h2>
          <p className="mt-1.5 text-xs text-slate-500">
            {error || "The customer you are looking for does not exist."}
          </p>
          <Link
            to="/admin/customers"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#287b6d] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#226b60]"
          >
            <ArrowLeft size={14} />
            Back to Customers
          </Link>
        </div>
      </div>
    );
  }

  const customerName =
    customer.name ||
    `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
    "Customer";

  const initials = getInitials(customerName);
  const isCustomerActive = customer.status === "Active";

  return (
    <div className="space-y-6 pb-12">
      {/* TOP BAR / HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/admin/customers")}
            className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 shadow-xs transition hover:bg-slate-50 active:scale-95"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-[#287b6d]" />
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#287b6d]">
                Customer Profile
              </p>
            </div>
            <h1 className="mt-0.5 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
              {customerName}
            </h1>
          </div>
        </div>

        {/* TOP ACTIONS */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={fetchCustomerDetails}
            title="Refresh details"
            className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-xs transition hover:bg-slate-50"
          >
            <RefreshCw size={15} />
          </button>

          {/* TOGGLE ACTIVE / INACTIVE */}
          <button
            type="button"
            disabled={statusUpdating}
            onClick={handleToggleStatus}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-xs transition disabled:opacity-50 ${
              isCustomerActive
                ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            {statusUpdating ? (
              <Loader2 size={15} className="animate-spin" />
            ) : isCustomerActive ? (
              <>
                <Power size={15} />
                <span>Deactivate Account</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={15} />
                <span>Activate Account</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* HERO PROFILE CARD */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {/* AVATAR */}
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#287b6d]/15 to-[#287b6d]/5 text-2xl font-black tracking-wider text-[#287b6d] border border-[#287b6d]/20 shadow-xs">
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-black text-slate-900 md:text-2xl">
                {customerName}
              </h2>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-[11px] font-bold ${
                  isCustomerActive
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-rose-200 bg-rose-50 text-rose-700"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isCustomerActive ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                />
                {customer.status}
              </span>
            </div>

            {/* Quick Contact & IDs */}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              {/* Email */}
              <div className="flex items-center gap-1.5">
                <Mail size={13} className="text-slate-400" />
                <a
                  href={`mailto:${customer.email}`}
                  className="font-semibold text-slate-700 hover:text-[#287b6d]"
                >
                  {customer.email || "—"}
                </a>
                {customer.email && (
                  <button
                    type="button"
                    onClick={() => handleCopy(customer.email, "email")}
                    className="text-slate-400 hover:text-slate-600"
                    title="Copy Email"
                  >
                    {copiedKey === "email" ? (
                      <Check size={12} className="text-emerald-600" />
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                )}
              </div>

              {/* Phone */}
              <div className="flex items-center gap-1.5">
                <Phone size={13} className="text-slate-400" />
                <a
                  href={`tel:${customer.phone}`}
                  className="font-semibold text-slate-700 hover:text-[#287b6d]"
                >
                  {customer.phone || "—"}
                </a>
                {customer.phone && customer.phone !== "—" && (
                  <button
                    type="button"
                    onClick={() => handleCopy(customer.phone, "phone")}
                    className="text-slate-400 hover:text-slate-600"
                    title="Copy Phone"
                  >
                    {copiedKey === "phone" ? (
                      <Check size={12} className="text-emerald-600" />
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                )}
              </div>

              {/* Customer ID */}
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                <span>ID: {customer.id || customer._id}</span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(customer.id || customer._id, "custid")
                  }
                  className="text-slate-400 hover:text-slate-600"
                  title="Copy ID"
                >
                  {copiedKey === "custid" ? (
                    <Check size={12} className="text-emerald-600" />
                  ) : (
                    <Copy size={12} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Orders */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Total Orders
              </p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">
                {formatNumber(customer.orders || 0)}
              </h3>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <ShoppingBag size={20} />
            </div>
          </div>
          <p className="mt-3 text-[11px] font-medium text-slate-400">
            Total orders completed
          </p>
        </div>

        {/* Total Spent */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Lifetime Value
              </p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">
                {formatMoney(customer.totalSpent || 0)}
              </h3>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <CreditCard size={20} />
            </div>
          </div>
          <p className="mt-3 text-[11px] font-medium text-slate-400">
            Total amount spent
          </p>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Avg. Order Value
              </p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">
                {formatMoney(averageOrderValue)}
              </h3>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-purple-50 text-purple-600">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="mt-3 text-[11px] font-medium text-slate-400">
            Per completed purchase
          </p>
        </div>

        {/* Member Since */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Member Since
              </p>
              <h3 className="mt-2 truncate text-base font-black text-slate-900 max-w-[150px]">
                {customer.joined || "Recently"}
              </h3>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-600">
              <Calendar size={20} />
            </div>
          </div>
          <p className="mt-3 text-[11px] font-medium text-slate-400">
            Account registration date
          </p>
        </div>
      </div>

      {/* MAIN TWO-COLUMN LAYOUT */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* LEFT COLUMN: ORDER HISTORY (2 COLS) */}
        <div className="space-y-6 xl:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Recent Purchase History
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Orders placed by {customerName}
                </p>
              </div>

              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                {Array.isArray(customer.recentOrders)
                  ? customer.recentOrders.length
                  : 0}{" "}
                orders
              </span>
            </div>

            {/* ORDER ITEMS LIST */}
            {customer.recentOrders && customer.recentOrders.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {customer.recentOrders.map((order) => {
                  const targetOrderId = order.orderDocId || order.id;
                  const orderAmt =
                    order.amount ?? order.total ?? order.totalAmount ?? 0;

                  return (
                    <div
                      key={order.id || targetOrderId}
                      className="flex flex-col justify-between gap-3 p-4 transition hover:bg-slate-50/70 sm:flex-row sm:items-center"
                    >
                      <div className="flex items-start gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                          <Package size={18} />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/admin/orders/${targetOrderId}`}
                              className="font-bold text-slate-900 transition hover:text-[#287b6d] hover:underline"
                            >
                              {order.id}
                            </Link>

                            {order.paymentMethod && (
                              <span className="rounded-md border border-slate-200/80 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                {order.paymentMethod}
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-xs text-slate-400">
                            Placed on {order.date || "N/A"}
                          </p>
                        </div>
                      </div>

                      {/* Right details: Status & Amount */}
                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        {/* Payment Status */}
                        {order.paymentStatus && (
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getPaymentStatusBadge(
                              order.paymentStatus,
                            )}`}
                          >
                            {order.paymentStatus}
                          </span>
                        )}

                        {/* Order Fulfillment Status */}
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getOrderStatusBadge(
                            order.status,
                          )}`}
                        >
                          {order.status || "Placed"}
                        </span>

                        <span className="min-w-[80px] text-right text-sm font-black text-slate-900">
                          {formatMoney(orderAmt)}
                        </span>

                        <Link
                          to={`/admin/orders/${targetOrderId}`}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          title="View Order"
                        >
                          <ExternalLink size={15} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400">
                <ShoppingBag size={28} className="mx-auto text-slate-300" />
                <p className="mt-2 text-xs font-semibold text-slate-600">
                  No orders recorded yet
                </p>
                <p className="text-[11px] text-slate-400">
                  This customer has not placed any orders through the store.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CONTACT, ADDRESSES & ACCOUNT METAS (1 COL) */}
        <div className="space-y-6">
          {/* CONTACT INFO CARD */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h2 className="border-b border-slate-100 pb-3 text-sm font-bold text-slate-900">
              Direct Contact
            </h2>

            <div className="mt-4 space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                  <Mail size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Email Address
                  </p>
                  <a
                    href={`mailto:${customer.email}`}
                    className="truncate text-xs font-bold text-[#287b6d] hover:underline"
                  >
                    {customer.email || "—"}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                  <Phone size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Phone Number
                  </p>
                  <a
                    href={`tel:${customer.phone}`}
                    className="text-xs font-bold text-slate-800 hover:text-[#287b6d]"
                  >
                    {customer.phone || "—"}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* SAVED ADDRESSES */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MapPin size={17} className="text-[#287b6d]" />
                <h2 className="text-sm font-bold text-slate-900">
                  Shipping Addresses
                </h2>
              </div>

              {Array.isArray(customer.addresses) &&
                customer.addresses.length > 0 && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                    {customer.addresses.length}{" "}
                    {customer.addresses.length === 1 ? "Saved" : "Saved"}
                  </span>
                )}
            </div>

            <div className="mt-4">
              {Array.isArray(customer.addresses) &&
              customer.addresses.length > 0 ? (
                <div className="space-y-3">
                  {customer.addresses.map((addr, idx) => {
                    const fullAddrLine = [addr.addressLine1, addr.addressLine2]
                      .filter(Boolean)
                      .join(", ");

                    return (
                      <div
                        key={addr._id || idx}
                        className={`rounded-xl border p-3.5 transition ${
                          addr.isDefault
                            ? "border-emerald-200 bg-emerald-50/30"
                            : "border-slate-100 bg-slate-50/70"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-800">
                            {addr.fullName || customerName}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {addr.addressType && (
                              <span className="rounded-md bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-600">
                                {addr.addressType}
                              </span>
                            )}
                            {addr.isDefault && (
                              <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                                Default
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-2 space-y-0.5 text-[11px] leading-relaxed text-slate-600">
                          <p className="font-medium text-slate-700">
                            {fullAddrLine}
                          </p>
                          <p>
                            {addr.city}, {addr.state} -{" "}
                            <span className="font-semibold text-slate-800">
                              {addr.pincode}
                            </span>
                          </p>
                          <p className="text-slate-400">
                            {addr.country || "India"}
                          </p>
                          {addr.phone && (
                            <p className="mt-1 font-mono text-slate-700">
                              Phone: {addr.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center">
                  <MapPin size={22} className="mx-auto text-slate-300" />
                  <p className="mt-2 text-xs italic text-slate-400">
                    No delivery address saved yet.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ACCOUNT SECURITY & STATUS SUMMARY */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h2 className="border-b border-slate-100 pb-3 text-sm font-bold text-slate-900">
              Account Overview
            </h2>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">
                  Access Status
                </span>
                <span
                  className={`font-bold ${
                    isCustomerActive ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {customer.status}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Customer ID</span>
                <span className="font-mono text-[11px] font-bold text-slate-700">
                  {customer.id || customer._id}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">
                  Registered Date
                </span>
                <span className="font-semibold text-slate-800">
                  {customer.joined || "Recently"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminViewCustomer;
