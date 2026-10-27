import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRouteVendor";
import {
  IndianRupee,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Loader2,
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Receipt,
} from "lucide-react";

const API_BASE_URL = "https://smart-commerce-platform-backend.onrender.com/api/vendors";

const getToken = () =>
  localStorage.getItem("vendorToken") || localStorage.getItem("token") || null;

const money = (val) =>
  `₹${new Intl.NumberFormat("en-IN").format(Number(val) || 0)}`;

const VendorEarnings = () => {
  const navigate = useNavigate();

  const [earnings, setEarnings] = useState({
    grossSales: 0,
    platformCommission: 0,
    netEarnings: 0,
    paidOut: 0,
    pendingPayout: 0,
    availableBalance: 0,
    monthlyChart: [],
    recentTransactions: [],
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchEarnings = async (isSilent = false) => {
    const token = getToken();

    if (!token) {
      navigate("/vendor/login");
      return;
    }

    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setError("");

      const res = await axios.get(`${API_BASE_URL}/earnings`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.data && res.data.success) {
        setEarnings({
          grossSales: res.data.earnings?.grossSales || 0,
          platformCommission: res.data.earnings?.platformCommission || 0,
          netEarnings: res.data.earnings?.netEarnings || 0,
          paidOut: res.data.earnings?.paidOut || 0,
          pendingPayout: res.data.earnings?.pendingPayout || 0,
          availableBalance: res.data.earnings?.availableBalance || 0,
          monthlyChart: Array.isArray(res.data.earnings?.monthlyChart)
            ? res.data.earnings.monthlyChart
            : [],
          recentTransactions: Array.isArray(
            res.data.earnings?.recentTransactions,
          )
            ? res.data.earnings.recentTransactions
            : [],
        });
      }
    } catch (err) {
      handleAuthError(err);
      console.error("Error fetching vendor earnings:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/vendor/login");
        return;
      }
      setError(
        err.response?.data?.message ||
          "Failed to load vendor earnings and revenue metrics.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  // Determine peak sales for chart normalization safely
  const monthlyList = earnings.monthlyChart || [];
  const maxMonthlySales = Math.max(
    ...monthlyList.map((m) => Number(m.sales) || 0),
    10000,
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <IndianRupee size={22} />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Vendor Earnings
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time fulfillment revenue, transparent 2% platform commission,
            and settlement balances.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchEarnings(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-xs disabled:opacity-50"
            title="Refresh Ledger"
          >
            <RefreshCw
              size={14}
              className={refreshing ? "animate-spin text-blue-600" : ""}
            />
            <span>Refresh</span>
          </button>

          <Link
            to="/vendor/payouts"
            className="px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-xs transition inline-flex items-center gap-2"
          >
            <Wallet size={15} />
            <span>View Payout History</span>
          </Link>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 shadow-xs">
          <AlertCircle size={18} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-28 text-slate-400 bg-white rounded-3xl border border-slate-200">
          <Loader2 size={36} className="animate-spin text-blue-600" />
          <p className="mt-3 text-xs font-semibold text-slate-600">
            Calculating earnings from database orders...
          </p>
        </div>
      ) : (
        <>
          {/* Main 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* GROSS SALES */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 hover:shadow-md transition">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Gross Sales
              </span>
              <p className="text-2xl font-black text-slate-900">
                {money(earnings.grossSales)}
              </p>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <ArrowUpRight size={14} /> Total order revenue
              </div>
            </div>

            {/* PLATFORM COMMISSION */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 hover:shadow-md transition">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-500">
                Platform Commission (2%)
              </span>
              <p className="text-2xl font-black text-slate-900">
                {money(earnings.platformCommission)}
              </p>
              <p className="text-[11px] text-slate-400">
                Platform fee on completed orders
              </p>
            </div>

            {/* NET EARNINGS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 hover:shadow-md transition">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Net Earnings (98%)
              </span>
              <p className="text-2xl font-black text-slate-900">
                {money(earnings.netEarnings)}
              </p>
              <p className="text-[11px] text-slate-400">
                Total vendor revenue accrued
              </p>
            </div>

            {/* SETTLEMENT BALANCE */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                Available Payout
              </span>
              <p className="text-2xl font-black text-white">
                {money(earnings.availableBalance)}
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1 border-t border-slate-800">
                <span>Paid Out: {money(earnings.paidOut)}</span>
                <span className="font-bold text-emerald-400">
                  Ready: {money(earnings.pendingPayout)}
                </span>
              </div>
            </div>
          </div>

          {/* Performance Chart & Payout Box */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual Sales Chart Bar */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp size={18} className="text-blue-600" />
                  Monthly Revenue Performance
                </h2>
                <span className="text-xs text-slate-400 font-semibold">
                  {new Date().getFullYear()} Calendar Year
                </span>
              </div>

              <div className="h-44 flex items-end justify-between gap-2 sm:gap-3 pt-6 pb-2 px-2 border-b border-slate-100">
                {monthlyList.map((item, idx) => {
                  const barHeight =
                    maxMonthlySales > 0
                      ? Math.max(
                          Math.round(
                            (Number(item.sales || 0) / maxMonthlySales) * 100,
                          ),
                          4,
                        )
                      : 4;

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
                    >
                      <div
                        style={{ height: `${barHeight}%` }}
                        className="w-full bg-blue-600 group-hover:bg-blue-700 rounded-t-lg transition-all relative"
                        title={`${item.month}: ${money(item.sales)}`}
                      >
                        {Number(item.sales) > 0 && (
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold py-0.5 px-1.5 rounded pointer-events-none transition whitespace-nowrap z-10 shadow-sm">
                            {money(item.sales)}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">
                        {item.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payout & Settlement Box */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-600" />
                  Settlement Status
                </h2>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Ready for Next Disbursal
                  </span>
                  <p className="text-2xl font-black text-slate-900">
                    {money(earnings.availableBalance)}
                  </p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>Transfers directly to verified bank account</span>
                  </p>
                </div>
              </div>

              <Link
                to="/vendor/payouts"
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold text-center block transition shadow-xs"
              >
                View Disbursed Payouts
              </Link>
            </div>
          </div>

          {/* Recent Transactions Audit Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Revenue Audit Ledger
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Itemized credits and automated commission deductions
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {earnings.recentTransactions.length} records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Transaction ID</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Reference</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {earnings.recentTransactions.length > 0 ? (
                    earnings.recentTransactions.map((txn, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4 font-mono font-semibold text-slate-900">
                          {txn.id}
                        </td>
                        <td className="px-6 py-4 text-slate-500">{txn.date}</td>
                        <td className="px-6 py-4 font-medium text-slate-800">
                          {txn.type}
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-mono">
                          {txn.orderId}
                        </td>
                        <td
                          className={`px-6 py-4 font-bold ${
                            txn.amount > 0
                              ? "text-emerald-600"
                              : "text-slate-500"
                          }`}
                        >
                          {txn.amount > 0
                            ? `+${money(txn.amount)}`
                            : `-${money(Math.abs(txn.amount))}`}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              txn.status === "Available" ||
                              txn.status === "Completed"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {txn.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="py-14 text-center text-slate-400"
                      >
                        <Receipt
                          size={36}
                          className="mx-auto mb-2 text-slate-300"
                        />
                        <p className="font-semibold text-slate-600">
                          No revenue transactions recorded yet
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VendorEarnings;
