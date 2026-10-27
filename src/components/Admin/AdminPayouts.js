import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRouteAdmin";
import {
  Search,
  Filter,
  Wallet,
  IndianRupee,
  Clock,
  CheckCircle,
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
  AlertCircle,
  RefreshCw,
  Loader2,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000/api";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const getStatusStyle = (status) => {
  switch (String(status).toLowerCase()) {
    case "paid":
    case "completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "partial":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "pending":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "processing":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "failed":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
};

const AdminPayouts = () => {
  const token = localStorage.getItem("adminToken");

  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("All");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // FETCH DYNAMIC PAYOUTS FROM DATABASE
  const fetchPayouts = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${API_BASE_URL}/admin/payouts`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      });

      if (res.data && res.data.success) {
        setPayouts(res.data.payouts || []);
      } else {
        setPayouts([]);
      }
    } catch (err) {
      if (typeof handleAuthError === "function") handleAuthError(err);
      console.error("Error fetching admin payouts:", err);
      setError(
        err.response?.data?.message ||
          "Failed to retrieve vendor payout records from database."
      );
      setPayouts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  // Reset pagination on filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, monthFilter]);

  // DYNAMIC MONTH OPTIONS (Derived from live records)
  const availableMonths = useMemo(() => {
    const months = new Set();
    payouts.forEach((p) => {
      if (p.month) months.add(p.month);
    });
    return Array.from(months);
  }, [payouts]);

  // LIVE FILTER LOGIC
  const filteredPayouts = useMemo(() => {
    return payouts.filter((payout) => {
      const q = search.toLowerCase().trim();

      const matchesSearch =
        !q ||
        payout.vendor?.name?.toLowerCase().includes(q) ||
        payout.vendor?.storeName?.toLowerCase().includes(q) ||
        payout.vendor?.email?.toLowerCase().includes(q) ||
        String(payout.id || "").toLowerCase().includes(q) ||
        String(payout.paymentReference || "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "All" ||
        String(payout.status).toLowerCase() === statusFilter.toLowerCase();

      const matchesMonth =
        monthFilter === "All" || payout.month === monthFilter;

      return matchesSearch && matchesStatus && matchesMonth;
    });
  }, [payouts, search, statusFilter, monthFilter]);

  // LIVE STAT METRICS CALCULATIONS
  const summary = useMemo(() => {
    return filteredPayouts.reduce(
      (acc, payout) => {
        acc.sales += Number(payout.grossSales || 0);
        acc.commission += Number(payout.commission || 0);
        acc.payable += Number(payout.netPayable || 0);
        acc.paid += Number(payout.paidAmount || 0);
        acc.pending += Number(payout.pendingAmount || 0);
        return acc;
      },
      { sales: 0, commission: 0, payable: 0, paid: 0, pending: 0 }
    );
  }, [filteredPayouts]);

  // PAGINATION SLICE
  const totalPages = Math.ceil(filteredPayouts.length / itemsPerPage) || 1;
  const paginatedPayouts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPayouts.slice(start, start + itemsPerPage);
  }, [filteredPayouts, currentPage, itemsPerPage]);

  const hasActiveFilters =
    search || statusFilter !== "All" || monthFilter !== "All";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setMonthFilter("All");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xs">
            <Wallet size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Vendor Payouts
            </h1>
            <p className="text-sm text-slate-500">
              Manage vendor earnings, commission deductions, and live settlements.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchPayouts}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-95"
            title="Refresh Settlements"
          >
            <RefreshCw
              size={14}
              className={loading ? "animate-spin text-[#287b6d]" : ""}
            />
            <span>Refresh</span>
          </button>

          <Link
            to="/admin/payouts/make"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#287b6d] active:scale-95"
          >
            <PlusCircle size={15} />
            <span>Disburse Payout</span>
          </Link>
        </div>
      </div>

      {/* ERROR NOTICE */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800 shadow-xs">
          <AlertCircle size={18} className="shrink-0 text-amber-600" />
          <span>{error}</span>
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {/* GROSS SALES */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <IndianRupee size={19} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Volume
            </span>
          </div>
          <p className="mt-4 text-xs font-medium text-slate-500">Gross Sales</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {money(summary.sales)}
          </p>
        </div>

        {/* COMMISSION */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <CircleDollarSign size={19} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Platform Fee
            </span>
          </div>
          <p className="mt-4 text-xs font-medium text-slate-500">Commission</p>
          <p className="mt-1 text-2xl font-bold text-purple-600">
            {money(summary.commission)}
          </p>
        </div>

        {/* PAYABLE */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Wallet size={19} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Settlement
            </span>
          </div>
          <p className="mt-4 text-xs font-medium text-slate-500">Net Payable</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {money(summary.payable)}
          </p>
        </div>

        {/* PAID */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle size={19} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Settled
            </span>
          </div>
          <p className="mt-4 text-xs font-medium text-slate-500">Paid to Vendors</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {money(summary.paid)}
          </p>
        </div>

        {/* PENDING */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Clock size={19} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Outstanding
            </span>
          </div>
          <p className="mt-4 text-xs font-medium text-slate-500">Pending Payout</p>
          <p className="mt-1 text-2xl font-bold text-orange-600">
            {money(summary.pending)}
          </p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* SEARCH */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search vendor name, email, or settlement ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-9 text-xs outline-none transition focus:border-slate-400 focus:bg-white"
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

          {/* DYNAMIC MONTH FILTER */}
          <div className="relative">
            <CalendarDays
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-8 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400 cursor-pointer"
            >
              <option value="All">All Periods</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* STATUS FILTER */}
          <div className="relative">
            <Filter
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-8 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400 cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              <X size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <h2 className="font-semibold text-slate-900">Vendor Settlements</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Fulfillment settlements and disbursement ledger
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            {filteredPayouts.length} vendors
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 size={36} className="animate-spin text-[#287b6d]" />
            <p className="mt-3 text-xs font-semibold text-slate-600">
              Loading vendor settlements from database...
            </p>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden xl:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs">
                  <tr>
                    <th className="px-5 py-4 text-left font-semibold text-slate-500 uppercase">
                      Vendor
                    </th>
                    <th className="px-5 py-4 text-left font-semibold text-slate-500 uppercase">
                      Period
                    </th>
                    <th className="px-5 py-4 text-right font-semibold text-slate-500 uppercase">
                      Sales
                    </th>
                    <th className="px-5 py-4 text-right font-semibold text-slate-500 uppercase">
                      Commission
                    </th>
                    <th className="px-5 py-4 text-right font-semibold text-slate-500 uppercase">
                      Payable
                    </th>
                    <th className="px-5 py-4 text-right font-semibold text-slate-500 uppercase">
                      Paid
                    </th>
                    <th className="px-5 py-4 text-right font-semibold text-slate-500 uppercase">
                      Pending
                    </th>
                    <th className="px-5 py-4 text-center font-semibold text-slate-500 uppercase">
                      Status
                    </th>
                    <th className="px-5 py-4 text-right font-semibold text-slate-500 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedPayouts.length > 0 ? (
                    paginatedPayouts.map((payout) => (
                      <tr
                        key={payout.id}
                        className="transition hover:bg-slate-50"
                      >
                        {/* VENDOR */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-xs">
                              {payout.vendor?.initials ||
                                payout.vendor?.name?.charAt(0) ||
                                "V"}
                            </div>
                            <div>
                              <Link
                                to={`/admin/payouts/${payout.id}`}
                                className="font-semibold text-slate-900 hover:text-[#287b6d] hover:underline"
                              >
                                {payout.vendor?.storeName ||
                                  payout.vendor?.name}
                              </Link>
                              <p className="text-[11px] text-slate-400">
                                {payout.vendor?.email || "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* PERIOD */}
                        <td className="px-5 py-4 text-slate-600">
                          <div className="flex items-center gap-1.5 font-medium">
                            <CalendarDays size={14} className="text-slate-400" />
                            <span>{payout.month}</span>
                          </div>
                        </td>

                        {/* SALES */}
                        <td className="px-5 py-4 text-right font-medium text-slate-900">
                          {money(payout.grossSales)}
                        </td>

                        {/* COMMISSION */}
                        <td className="px-5 py-4 text-right font-medium text-purple-600">
                          {money(payout.commission)}
                        </td>

                        {/* PAYABLE */}
                        <td className="px-5 py-4 text-right font-semibold text-slate-900">
                          {money(payout.netPayable)}
                        </td>

                        {/* PAID */}
                        <td className="px-5 py-4 text-right font-medium text-emerald-600">
                          {money(payout.paidAmount)}
                        </td>

                        {/* PENDING */}
                        <td className="px-5 py-4 text-right font-medium text-orange-600">
                          {money(payout.pendingAmount)}
                        </td>

                        {/* STATUS */}
                        <td className="px-5 py-4 text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${getStatusStyle(
                              payout.status
                            )}`}
                          >
                            {payout.status}
                          </span>
                        </td>

                        {/* ACTION */}
                        <td className="px-5 py-4 text-right">
                          <Link
                            to={`/admin/payouts/${payout.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-100 hover:text-[#287b6d]"
                          >
                            <span>View</span>
                            <ArrowUpRight size={13} />
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="py-14 text-center">
                        <AlertCircle
                          size={36}
                          className="mx-auto text-slate-300 mb-3"
                        />
                        <p className="font-semibold text-slate-700">
                          No settlements found
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Try changing your search query or period filter.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE / TABLET CARDS */}
            <div className="xl:hidden divide-y divide-slate-100">
              {paginatedPayouts.length > 0 ? (
                paginatedPayouts.map((payout) => (
                  <div key={payout.id} className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-xs">
                          {payout.vendor?.initials ||
                            payout.vendor?.name?.charAt(0) ||
                            "V"}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {payout.vendor?.storeName || payout.vendor?.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {payout.month}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getStatusStyle(
                          payout.status
                        )}`}
                      >
                        {payout.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl bg-slate-50 p-2.5">
                        <p className="text-slate-400 text-[11px]">Gross Sales</p>
                        <p className="font-bold text-slate-900 mt-0.5">
                          {money(payout.grossSales)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-2.5">
                        <p className="text-slate-400 text-[11px]">Commission</p>
                        <p className="font-bold text-purple-600 mt-0.5">
                          {money(payout.commission)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-2.5">
                        <p className="text-slate-400 text-[11px]">Paid</p>
                        <p className="font-bold text-emerald-600 mt-0.5">
                          {money(payout.paidAmount)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-2.5">
                        <p className="text-slate-400 text-[11px]">Pending</p>
                        <p className="font-bold text-orange-600 mt-0.5">
                          {money(payout.pendingAmount)}
                        </p>
                      </div>
                    </div>

                    <Link
                      to={`/admin/payouts/${payout.id}`}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#287b6d]"
                    >
                      <span>View Settlement Details</span>
                      <ArrowUpRight size={14} />
                    </Link>
                  </div>
                ))
              ) : (
                <div className="py-14 text-center">
                  <AlertCircle
                    size={36}
                    className="mx-auto text-slate-300 mb-3"
                  />
                  <p className="font-semibold text-slate-700">
                    No payouts found
                  </p>
                </div>
              )}
            </div>

            {/* PAGINATION */}
            {filteredPayouts.length > itemsPerPage && (
              <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-3.5 sm:flex-row">
                <p className="text-xs text-slate-400">
                  Showing{" "}
                  <span className="font-semibold text-slate-700">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-slate-700">
                    {Math.min(currentPage * itemsPerPage, filteredPayouts.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-700">
                    {filteredPayouts.length}
                  </span>{" "}
                  vendors
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                    <button
                      key={pg}
                      type="button"
                      onClick={() => setCurrentPage(pg)}
                      className={`h-8 w-8 rounded-lg text-xs font-bold transition shadow-xs ${
                        currentPage === pg
                          ? "bg-[#287b6d] text-white"
                          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {pg}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPayouts;