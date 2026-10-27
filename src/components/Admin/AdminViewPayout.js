import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { handleAuthError } from "../../AuthRouteAdmin.js";
import axios from "axios";
import {
  ArrowLeft,
  Wallet,
  Store,
  CalendarDays,
  IndianRupee,
  CheckCircle,
  Clock,
  ArrowUpRight,
  CreditCard,
  AlertCircle,
  TrendingUp,
  Loader2,
  RefreshCw,
  Building2,
  Hash,
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000/api";

const money = (value) =>
  `₹${new Intl.NumberFormat("en-IN").format(Math.round(Number(value) || 0))}`;

const AdminViewPayout = () => {
  const { payoutId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [settlement, setSettlement] = useState(null);

  const fetchPayoutDetails = async (isSilent = false) => {
    const token =
      localStorage.getItem("adminToken") || localStorage.getItem("token");

    if (!token) {
      navigate("/admin/login");
      return;
    }

    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setError("");

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      let matchedData = null;

      // 1. Try single payout endpoint
      try {
        const res = await axios.get(
          `${API_BASE_URL}/admin/payouts/${payoutId}`,
          { headers },
        );
        if (res.data?.success && res.data.payout) {
          matchedData = res.data.payout;
        } else if (res.data?.success && res.data.settlement) {
          matchedData = res.data.settlement;
        } else if (res.data?._id || res.data?.id) {
          matchedData = res.data;
        }
      } catch (singleErr) {
        handleAuthError(singleErr);
        // Fallback: Fetch all payouts/settlements and filter by ID or Vendor ID
        const listRes = await axios.get(`${API_BASE_URL}/admin/payouts`, {
          headers,
        });
        const list = Array.isArray(listRes.data)
          ? listRes.data
          : listRes.data?.payouts || listRes.data?.settlements || [];

        matchedData = list.find(
          (item) =>
            String(item.id || item._id) === String(payoutId) ||
            String(item.vendorId || item.vendor?._id) === String(payoutId) ||
            String(item.payoutNumber) === String(payoutId),
        );
      }

      if (matchedData) {
        setSettlement(matchedData);
      } else {
        setError("Settlement record not found in the database.");
      }
    } catch (err) {
      handleAuthError(err);
      console.error("Error fetching payout details:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/admin/login");
        return;
      }
      setError(
        err.response?.data?.message || "Failed to load settlement details.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (payoutId) {
      fetchPayoutDetails();
    }
  }, [payoutId]);

  /* STATUS BADGE */
  const getStatusStyle = (status) => {
    switch (String(status || "").toLowerCase()) {
      case "paid":
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "partial":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "processing":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "pending":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "failed":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-slate-200">
        <Loader2 size={36} className="animate-spin text-slate-900 mb-3" />
        <p className="text-sm font-semibold text-slate-700">
          Loading settlement telemetry...
        </p>
      </div>
    );
  }

  if (!settlement) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center max-w-xl mx-auto mt-8">
        <Wallet size={46} className="mx-auto text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-900">
          Payout Record Not Found
        </h2>
        <p className="text-slate-500 text-sm mt-2">
          {error || "The payout settlement you are looking for does not exist."}
        </p>
        <Link
          to="/admin/payouts"
          className="inline-flex items-center gap-2 mt-5 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition"
        >
          <ArrowLeft size={16} />
          Back to Payouts
        </Link>
      </div>
    );
  }

  // Financial Normalization
  const grossSales = Number(
    settlement.grossSales ?? settlement.totalSales ?? 0,
  );
  const commission = Number(
    settlement.commission ?? Math.round(grossSales * 0.02),
  );
  const netPayable = Number(
    settlement.netPayable ??
      settlement.totalPayable ??
      Math.max(0, grossSales - commission),
  );
  const paidAmount = Number(
    settlement.paidAmount ?? settlement.amountPaid ?? 0,
  );
  const pendingAmount = Number(
    settlement.pendingAmount ??
      settlement.remainingAmount ??
      Math.max(0, netPayable - paidAmount),
  );

  const progress =
    netPayable > 0
      ? Math.min(Math.round((paidAmount / netPayable) * 100), 100)
      : 0;

  const currentStatus =
    settlement.status ||
    (pendingAmount <= 0 ? "Paid" : paidAmount > 0 ? "Partial" : "Pending");

  // Vendor Details
  const vendorObj = settlement.vendor || {};
  const vendorName =
    typeof vendorObj === "string"
      ? vendorObj
      : vendorObj.name ||
        vendorObj.storeName ||
        settlement.vendorName ||
        "Store Partner";
  const vendorEmail = vendorObj.email || settlement.vendorEmail || "N/A";
  const vendorInitials = vendorName.slice(0, 2).toUpperCase();

  // Past Disbursements Array
  const historyList = Array.isArray(settlement.payoutHistory)
    ? settlement.payoutHistory
    : Array.isArray(settlement.transactions)
      ? settlement.transactions
      : [];

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/payouts"
            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-xs text-slate-700"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Settlement Statement
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${getStatusStyle(
                  currentStatus,
                )}`}
              >
                {currentStatus}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {vendorName} · {settlement.month || "Current Cycle"}
            </p>
          </div>
        </div>

        {/* TOP ACTIONS */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => fetchPayoutDetails(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-xs disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={refreshing ? "animate-spin text-slate-900" : ""}
            />
            <span>Refresh</span>
          </button>

          {pendingAmount > 0 && (
            <Link
              to={`/admin/payouts/${settlement.id || settlement._id || payoutId}/make`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition shadow-xs"
            >
              <Wallet size={15} />
              <span>Make Payout</span>
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 text-xs font-semibold">
          <AlertCircle size={18} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* SETTLEMENT OVERVIEW CARD */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-lg font-black tracking-wider">
              {vendorInitials}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{vendorName}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{vendorEmail}</p>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                <CalendarDays size={14} className="text-slate-400" />
                <span>Settlement Period:</span>
                <span className="font-semibold text-slate-800">
                  {settlement.month || "Current Cycle"}
                </span>
              </div>
            </div>
          </div>

          <div className="text-left lg:text-right border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Net Payable (98%)
            </p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              {money(netPayable)}
            </p>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="mt-7 pt-6 border-t border-slate-100">
          <div className="flex justify-between text-xs mb-2">
            <span className="font-semibold text-slate-500">
              Disbursement Progress
            </span>
            <span className="font-bold text-slate-800">{progress}%</span>
          </div>

          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-slate-500 mt-2 font-medium">
            <span className="text-emerald-700">Paid: {money(paidAmount)}</span>
            <span className="text-orange-700">
              Remaining: {money(pendingAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* 5-PILLAR FINANCIAL METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* GROSS SALES */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <TrendingUp size={18} />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-3">
            Gross Sales
          </p>
          <p className="text-xl font-black text-slate-900 mt-1">
            {money(grossSales)}
          </p>
        </div>

        {/* COMMISSION (2%) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <IndianRupee size={18} />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-3">
            Platform Fee (2%)
          </p>
          <p className="text-xl font-black text-purple-600 mt-1">
            {money(commission)}
          </p>
        </div>

        {/* NET PAYABLE */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Wallet size={18} />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-3">
            Net Payable
          </p>
          <p className="text-xl font-black text-slate-900 mt-1">
            {money(netPayable)}
          </p>
        </div>

        {/* TOTAL PAID */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle size={18} />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-3">
            Total Paid
          </p>
          <p className="text-xl font-black text-emerald-600 mt-1">
            {money(paidAmount)}
          </p>
        </div>

        {/* PENDING */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <Clock size={18} />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-3">
            Pending Balance
          </p>
          <p className="text-xl font-black text-orange-600 mt-1">
            {money(pendingAmount)}
          </p>
        </div>
      </div>

      {/* DETAILS GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT COLUMN: PAYOUT TRANSACTIONS HISTORY */}
        <div className="xl:col-span-2">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Disbursement History
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Bank wires and electronic transfers processed
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                {historyList.length} transfers
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {historyList.length > 0 ? (
                historyList.map((payment, idx) => (
                  <div
                    key={payment.id || payment._id || idx}
                    className="p-4 hover:bg-slate-50 transition text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <CheckCircle size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {money(payment.amount)}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                              {payment.status || "Completed"}
                            </span>
                          </div>
                          <p className="text-slate-400 text-[11px] mt-0.5">
                            {payment.payoutDate || payment.date || "Completed"}{" "}
                            ·{" "}
                            {payment.paymentMethod ||
                              payment.method ||
                              "Bank Wire"}
                          </p>
                          {payment.notes && (
                            <p className="text-slate-500 text-[11px] mt-1 italic">
                              "{payment.notes}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                        <p className="text-slate-400 text-[10px] uppercase font-bold">
                          Transaction ID / UTR
                        </p>
                        <p className="font-mono font-bold text-slate-700 mt-0.5">
                          {payment.transactionId ||
                            payment.referenceId ||
                            "TRX-RECORDED"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <Clock size={36} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-sm font-semibold text-slate-700">
                    No disbursement transactions yet
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    No wire transfers have been logged for this settlement
                    period.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: VENDOR & BREAKDOWN INFO */}
        <div className="space-y-6">
          {/* VENDOR PROFILE */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2.5 mb-4">
              <Store size={18} className="text-slate-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Vendor Profile
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                {vendorInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 truncate text-xs">
                  {vendorName}
                </p>
                <p className="text-slate-400 text-[11px] truncate">
                  {vendorEmail}
                </p>
              </div>
            </div>
          </div>

          {/* SETTLEMENT SPECIFICATION */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2.5 mb-4">
              <Building2 size={18} className="text-slate-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Settlement Terms
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center text-slate-500">
                <span>Settlement ID</span>
                <span className="font-mono font-bold text-slate-800">
                  {settlement.id || settlement._id || payoutId}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-500">
                <span>Cycle</span>
                <span className="font-semibold text-slate-800">
                  {settlement.month || "Current Month"}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-500">
                <span>Fulfilled Revenue</span>
                <span className="font-semibold text-slate-800">
                  {money(grossSales)}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-500">
                <span>Platform Commission (2%)</span>
                <span className="font-semibold text-purple-600">
                  - {money(commission)}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-900">
                  Vendor Share (98%)
                </span>
                <span className="font-black text-slate-900 text-sm">
                  {money(netPayable)}
                </span>
              </div>
            </div>
          </div>

          {/* OUTSTANDING ACTION */}
          {pendingAmount > 0 && (
            <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-md">
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={20}
                  className="text-amber-400 shrink-0 mt-0.5"
                />
                <div>
                  <p className="font-bold text-sm">Outstanding Balance</p>
                  <p className="text-xs text-slate-300 mt-1">
                    {money(pendingAmount)} is pending transfer to this vendor.
                  </p>
                </div>
              </div>

              <Link
                to={`/admin/payouts/${settlement.id || settlement._id || payoutId}/make`}
                className="mt-4 w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-100 transition shadow-xs"
              >
                <span>Execute Payout Transfer</span>
                <ArrowUpRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminViewPayout;
