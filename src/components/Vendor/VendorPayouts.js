import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRouteVendor";
import {
  Wallet,
  Eye,
  IndianRupee,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Loader2,
  Search,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  X,
} from "lucide-react";

const API_BASE_URL = "https://smart-commerce-platform-backend.onrender.com/api/vendors";

const getToken = () =>
  localStorage.getItem("vendorToken") || localStorage.getItem("token") || null;

const money = (val) =>
  `₹${new Intl.NumberFormat("en-IN").format(Number(val) || 0)}`;

const VendorPayouts = () => {
  const navigate = useNavigate();

  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchPayouts = async (isSilent = false) => {
    const token = getToken();

    if (!token) {
      navigate("/vendor/login");
      return;
    }

    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setError("");

      const res = await axios.get(`${API_BASE_URL}/payouts`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.data && res.data.success) {
        setPayouts(res.data.payouts || []);
      } else {
        setPayouts([]);
      }
    } catch (err) {
      handleAuthError(err);
      console.error("Error fetching vendor payouts:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/vendor/login");
        return;
      }
      setError(
        err.response?.data?.message ||
          "Failed to retrieve your payout settlement records.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  // Summary Metrics
  const summary = useMemo(() => {
    const totalDisbursed = payouts
      .filter((p) => p.status === "Paid")
      .reduce((sum, p) => sum + Number(p.netAmount || 0), 0);

    const pendingProcessing = payouts
      .filter((p) => p.status === "Processing" || p.status === "Pending")
      .reduce((sum, p) => sum + Number(p.netAmount || 0), 0);

    const totalTransfers = payouts.length;

    return { totalDisbursed, pendingProcessing, totalTransfers };
  }, [payouts]);

  // Filter Logic
  const filteredPayouts = useMemo(() => {
    return payouts.filter((payout) => {
      const q = search.toLowerCase().trim();

      const matchesSearch =
        !q ||
        payout.id?.toLowerCase().includes(q) ||
        payout.transactionId?.toLowerCase().includes(q) ||
        payout.paymentMethod?.toLowerCase().includes(q) ||
        payout.period?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "All" ||
        String(payout.status).toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [payouts, search, statusFilter]);

  const getStatusBadge = (status) => {
    switch (String(status).toLowerCase()) {
      case "paid":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "processing":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "failed":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Wallet size={22} />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Payout Settlements
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time bank wire settlements and itemized net disbursements.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchPayouts(true)}
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
            to="/vendor/earnings"
            className="px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-xs transition inline-flex items-center gap-2"
          >
            <IndianRupee size={15} />
            <span>View Live Earnings</span>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Disbursed
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {money(summary.totalDisbursed)}
          </p>
          <span className="text-[11px] text-slate-400 block">
            Successfully wired to your account
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pending Processing
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600">
            {money(summary.pendingProcessing)}
          </p>
          <span className="text-[11px] text-slate-400 block">
            In transfer confirmation queue
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Settlement Cycles
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <ShieldCheck size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {summary.totalTransfers}
          </p>
          <span className="text-[11px] text-slate-400 block">
            Completed payout transfers
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search by Payout ID, UTR number, or method..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-slate-400 transition"
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

          <div className="relative">
            <Filter
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-slate-400 cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Processing">Processing</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader2 size={36} className="animate-spin text-blue-600 mb-3" />
            <p className="text-xs font-semibold text-slate-600">
              Loading payout settlements from database...
            </p>
          </div>
        ) : filteredPayouts.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <Wallet size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="font-bold text-slate-700 text-sm">
              No payout settlements found
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {search || statusFilter !== "All"
                ? "Try adjusting your search criteria or resetting filters."
                : "Your payouts will appear here as orders are fulfilled and disbursed by administration."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Payout ID</th>
                  <th className="px-6 py-4">Period</th>
                  <th className="px-6 py-4 text-right">Gross Sales</th>
                  <th className="px-6 py-4 text-right">Commission (2%)</th>
                  <th className="px-6 py-4 text-right">Net Payout</th>
                  <th className="px-6 py-4">Payout Date</th>
                  <th className="px-6 py-4">Payment Method</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {payout.id}
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-medium">
                      {payout.period}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-800">
                      {money(payout.grossSales)}
                    </td>
                    <td className="px-6 py-4 text-right text-rose-600 font-medium">
                      -{money(payout.commission)}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-emerald-600 text-sm">
                      {money(payout.netAmount)}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {payout.payoutDate}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <span
                        className="truncate block max-w-[180px]"
                        title={payout.paymentMethod}
                      >
                        {payout.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(
                          payout.status,
                        )}`}
                      >
                        {payout.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/vendor/payouts/${payout.id}`}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-[11px] inline-flex items-center gap-1 transition"
                      >
                        <Eye size={13} />
                        <span>Details</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorPayouts;
