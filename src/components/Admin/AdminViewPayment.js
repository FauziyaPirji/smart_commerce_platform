import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRouteAdmin";
import {
  ArrowLeft,
  CreditCard,
  User,
  ShoppingBag,
  Store,
  CheckCircle,
  Clock,
  XCircle,
  RotateCcw,
  Receipt,
  Printer,
  Copy,
  Check,
  Loader2,
  ExternalLink,
} from "lucide-react";

const API_BASE_URL = "https://smart-commerce-platform-backend.onrender.com/api";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const AdminViewPayment = () => {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("adminToken");

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedKey, setCopiedKey] = useState(null);

  // Quick clipboard copy helper
  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // FETCH DYNAMIC PAYMENT RECORD BY ID
  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await axios.get(
          `${API_BASE_URL}/admin/payments/${paymentId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + token,
            },
          },
        );

        if (res.data && res.data.success && res.data.payment) {
          setPayment(res.data.payment);
        } else {
          setPayment(null);
          setError("Payment transaction record not found.");
        }
      } catch (err) {
        handleAuthError(err);
        console.error("Error loading payment transaction:", err);
        setError(
          err.response?.data?.message ||
            "Unable to find the requested payment record.",
        );
        setPayment(null);
      } finally {
        setLoading(false);
      }
    };

    if (paymentId) {
      fetchPaymentDetails();
    }
  }, [paymentId]);

  // Status Icons & Color Map
  const statusIcon = {
    Paid: <CheckCircle size={18} />,
    Pending: <Clock size={18} />,
    Failed: <XCircle size={18} />,
    Refunded: <RotateCcw size={18} />,
  };

  const statusColor = {
    Paid: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    Pending: "bg-amber-50 text-amber-700 border border-amber-200",
    Failed: "bg-rose-50 text-rose-700 border border-rose-200",
    Refunded: "bg-purple-50 text-purple-700 border border-purple-200",
  };

  // LOADING STATE
  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-xs">
        <Loader2 size={38} className="animate-spin text-[#287b6d]" />
        <p className="mt-3 text-xs font-bold text-slate-700">
          Retrieving payment transaction...
        </p>
        <p className="mt-1 text-[11px] text-slate-400">Please wait a moment</p>
      </div>
    );
  }

  // NOT FOUND / ERROR STATE
  if (!payment || error) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-xs">
        <CreditCard size={45} className="mx-auto mb-4 text-slate-300" />

        <h2 className="text-xl font-bold text-slate-900">Payment Not Found</h2>

        <p className="mt-2 text-xs text-slate-500">
          {error ||
            "The payment transaction you are looking for does not exist."}
        </p>

        <Link
          to="/admin/payments"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
        >
          <ArrowLeft size={14} />
          Back to Payments
        </Link>
      </div>
    );
  }

  const currentStatus = payment.status || "Pending";

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/payments"
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-xs transition hover:bg-slate-50"
            title="Back to Payments"
          >
            <ArrowLeft size={19} />
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Payment #{payment.id}
            </h1>

            <p className="mt-1 text-xs text-slate-500">
              Transaction for Order #{payment.orderId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* PRINT BUTTON */}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            <Printer size={15} />
            <span>Print Receipt</span>
          </button>

          {/* UPDATE PAYMENT LINK */}
          {/* <Link
            to={`/admin/payments/${payment.id}/edit`}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800"
          >
            Update Payment
          </Link> */}
        </div>
      </div>

      {/* STATUS & AMOUNT SUMMARY */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">
              Payment Status
            </p>

            <div className="mt-2 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold ${
                  statusColor[currentStatus] || "bg-slate-100 text-slate-600"
                }`}
              >
                {statusIcon[currentStatus] || <Clock size={16} />}
                {currentStatus}
              </span>
            </div>
          </div>

          <div className="text-left md:text-right">
            <p className="text-xs font-semibold text-slate-500">
              Payment Amount
            </p>

            <p className="mt-1 text-3xl font-extrabold text-slate-900">
              {money(payment.amount)}
            </p>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN CONTENT */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* LEFT COLUMN (2 COLS) */}
        <div className="space-y-6 xl:col-span-2">
          {/* PAYMENT DETAILS */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-3">
              <CreditCard size={19} className="text-[#287b6d]" />
              <h2 className="text-sm font-bold text-slate-900">
                Payment Information
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <p className="text-xs text-slate-400">Payment ID</p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="font-mono text-xs font-bold text-slate-800">
                    {payment.id}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleCopy(payment.id, "pid")}
                    className="text-slate-400 hover:text-slate-600"
                    title="Copy Payment ID"
                  >
                    {copiedKey === "pid" ? (
                      <Check size={13} className="text-emerald-600" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-400">Transaction ID / UTR</p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="font-mono text-xs font-bold text-slate-800">
                    {payment.transactionId || "—"}
                  </p>
                  {payment.transactionId && (
                    <button
                      type="button"
                      onClick={() => handleCopy(payment.transactionId, "txnid")}
                      className="text-slate-400 hover:text-slate-600"
                      title="Copy Transaction ID"
                    >
                      {copiedKey === "txnid" ? (
                        <Check size={13} className="text-emerald-600" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-400">Payment Method</p>
                <p className="mt-1 text-xs font-bold uppercase text-slate-800">
                  {payment.method || "ONLINE"}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Payment Gateway</p>
                <p className="mt-1 text-xs font-medium text-slate-800">
                  {payment.gateway || "Direct Gateway"}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Transaction Date</p>
                <p className="mt-1 text-xs font-medium text-slate-700">
                  {payment.date || "N/A"}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Currency</p>
                <p className="mt-1 text-xs font-bold text-slate-800">
                  {payment.currency || "INR"}
                </p>
              </div>
            </div>
          </div>

          {/* AMOUNT BREAKDOWN */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-3">
              <Receipt size={19} className="text-[#287b6d]" />
              <h2 className="text-sm font-bold text-slate-900">
                Amount Breakdown
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Order Subtotal</span>
                <span className="font-semibold text-slate-800">
                  {money(payment.subtotal)}
                </span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Delivery / Shipping</span>
                <span className="font-semibold text-slate-800">
                  {Number(payment.shipping) === 0
                    ? "FREE"
                    : money(payment.shipping)}
                </span>
              </div>

              {Number(payment.tax) > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Tax Amount</span>
                  <span className="font-semibold text-slate-800">
                    {money(payment.tax)}
                  </span>
                </div>
              )}

              {Number(payment.discount) > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Discount</span>
                  <span className="font-semibold text-rose-600">
                    -{money(payment.discount)}
                  </span>
                </div>
              )}

              <div className="flex justify-between border-t border-slate-200 pt-3 text-sm">
                <span className="font-bold text-slate-900">Paid Amount</span>
                <span className="font-black text-slate-900">
                  {money(payment.amount)}
                </span>
              </div>
            </div>
          </div>

          {/* VENDOR SETTLEMENT */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-3">
              <Store size={19} className="text-[#287b6d]" />
              <h2 className="text-sm font-bold text-slate-900">
                Vendor Settlement
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-[11px] font-semibold text-slate-400">
                  Fulfilling Store / Vendor
                </p>
                <p className="mt-1 text-xs font-bold text-slate-800">
                  {payment.vendor || "Direct Store"}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-[11px] font-semibold text-slate-400">
                  Platform Commission (2%)
                </p>
                <p className="mt-1 text-xs font-bold text-slate-800">
                  {money(payment.commission || 0)}
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50/60 p-4 border border-emerald-100">
                <p className="text-[11px] font-semibold text-emerald-800">
                  Vendor Net Payable
                </p>
                <p className="mt-1 text-sm font-black text-emerald-700">
                  {money(payment.vendorPayout || payment.amount || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (1 COL) */}
        <div className="space-y-6">
          {/* CUSTOMER CARD */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-3">
              <User size={18} className="text-[#287b6d]" />
              <h2 className="text-sm font-bold text-slate-900">
                Customer Details
              </h2>
            </div>

            <p className="font-bold text-slate-900 text-sm">
              {payment.customer?.name || "Customer"}
            </p>

            <div className="mt-2 space-y-1 text-xs text-slate-500">
              <p>
                Email:{" "}
                <span className="font-medium text-slate-700">
                  {payment.customer?.email || "—"}
                </span>
              </p>
              <p>
                Phone:{" "}
                <span className="font-medium text-slate-700">
                  {payment.customer?.phone || "—"}
                </span>
              </p>

              {payment.customer?.address && (
                <p className="pt-1 text-slate-600 leading-relaxed">
                  Address: {payment.customer.address}
                </p>
              )}
            </div>
          </div>

          {/* ORDER CARD */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-3">
              <ShoppingBag size={18} className="text-[#287b6d]" />
              <h2 className="text-sm font-bold text-slate-900">Linked Order</h2>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Order Reference</p>
                <p className="mt-0.5 text-xs font-black text-slate-900">
                  #{payment.orderId}
                </p>
              </div>

              {payment.orderDocId && (
                <Link
                  to={`/admin/orders/${payment.orderDocId}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition"
                >
                  <span>View Order</span>
                  <ExternalLink size={12} />
                </Link>
              )}
            </div>
          </div>

          {/* REFUND RECORD (IF REFUNDED) */}
          {payment.refund && (
            <div className="rounded-2xl border border-purple-200 bg-purple-50/40 p-5 shadow-xs">
              <div className="mb-3 flex items-center gap-3 border-b border-purple-100 pb-3">
                <RotateCcw size={18} className="text-purple-600" />
                <h2 className="text-sm font-bold text-purple-900">
                  Refund Audit
                </h2>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-purple-950">
                  <span>Refunded Amount</span>
                  <span className="font-black text-sm">
                    {money(payment.refund.amount)}
                  </span>
                </div>

                <div className="flex justify-between text-purple-950">
                  <span>Status</span>
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                    {payment.refund.status}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-purple-800">
                    Reason Log
                  </span>
                  <p className="mt-1 rounded-xl bg-white/80 p-2.5 text-xs text-purple-900 leading-relaxed">
                    {payment.refund.reason || "Dispute refund issued by Admin."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminViewPayment;
