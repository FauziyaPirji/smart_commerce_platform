import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRouteAdmin";
import {
  Search,
  Eye,
  CreditCard,
  CheckCircle,
  Clock,
  IndianRupee,
  Filter,
  RefreshCw,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

const API_BASE_URL = "https://smart-commerce-platform-backend.onrender.com/api";

const AdminPayments = () => {
  const token = localStorage.getItem("adminToken");

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // FETCH DYNAMIC PAYMENTS FROM DATABASE
  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${API_BASE_URL}/admin/payments`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      });

      if (res.data && res.data.success) {
        setPayments(res.data.payments || []);
      } else {
        setPayments([]);
      }
    } catch (err) {
      handleAuthError(err);
      console.error("Error fetching admin payments:", err);
      setError(
        err.response?.data?.message ||
          "Failed to retrieve payment records from server.",
      );
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Reset pagination on filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, methodFilter]);

  // FILTER LOGIC
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        String(payment.id || "")
          .toLowerCase()
          .includes(searchText) ||
        String(payment.orderId || "")
          .toLowerCase()
          .includes(searchText) ||
        String(payment.transactionId || "")
          .toLowerCase()
          .includes(searchText) ||
        String(payment.customer?.name || "")
          .toLowerCase()
          .includes(searchText) ||
        String(payment.customer?.email || "")
          .toLowerCase()
          .includes(searchText) ||
        String(payment.vendor || "")
          .toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "All" ||
        String(payment.status || "").toLowerCase() ===
          statusFilter.toLowerCase();

      // Normalize method comparison
      const methodStr = String(payment.method || "").toLowerCase();
      let matchesMethod = methodFilter === "All";
      if (!matchesMethod) {
        if (methodFilter === "UPI" && methodStr.includes("upi"))
          matchesMethod = true;
        else if (
          methodFilter === "Credit / Debit Card" &&
          (methodStr.includes("card") || methodStr.includes("credit"))
        )
          matchesMethod = true;
        else if (
          methodFilter === "Net Banking" &&
          methodStr.includes("netbanking")
        )
          matchesMethod = true;
        else if (methodFilter === "Wallet" && methodStr.includes("wallet"))
          matchesMethod = true;
        else if (
          methodFilter === "Cash on Delivery" &&
          (methodStr.includes("cod") || methodStr.includes("cash"))
        )
          matchesMethod = true;
        else matchesMethod = methodStr === methodFilter.toLowerCase();
      }

      return matchesSearch && matchesStatus && matchesMethod;
    });
  }, [payments, search, statusFilter, methodFilter]);

  // LIVE STAT METRICS CALCULATIONS
  const totalAmount = useMemo(() => {
    return payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [payments]);

  const paidAmount = useMemo(() => {
    return payments
      .filter(
        (p) =>
          String(p.status).toLowerCase() === "paid" ||
          String(p.status).toLowerCase() === "success",
      )
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [payments]);

  const pendingAmount = useMemo(() => {
    return payments
      .filter((p) => String(p.status).toLowerCase() === "pending")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [payments]);

  // PAGINATION SLICE
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage) || 1;
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPayments.slice(start, start + itemsPerPage);
  }, [filteredPayments, currentPage, itemsPerPage]);

  const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

  const statusStyle = {
    Paid: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    Pending: "bg-amber-50 text-amber-700 border border-amber-200",
    Failed: "bg-rose-50 text-rose-700 border border-rose-200",
  };

  const hasActiveFilters =
    search || statusFilter !== "All" || methodFilter !== "All";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setMethodFilter("All");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor customer payments and financial transactions.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchPayments}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-95"
        >
          <RefreshCw
            size={14}
            className={loading ? "animate-spin text-[#287b6d]" : ""}
          />
          <span>Refresh</span>
        </button>
      </div>

      {/* ERROR NOTICE */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800 shadow-xs">
          <AlertCircle size={18} className="shrink-0 text-amber-600" />
          <span>{error}</span>
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* TOTAL */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Payments</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                {money(totalAmount)}
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                {payments.length} transactions
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
              <IndianRupee size={21} className="text-slate-700" />
            </div>
          </div>
        </div>

        {/* PAID */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Successful</p>
              <h2 className="mt-2 text-2xl font-bold text-emerald-600">
                {money(paidAmount)}
              </h2>
              <p className="mt-1 text-xs text-slate-400">Completed payments</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
              <CheckCircle size={21} className="text-emerald-600" />
            </div>
          </div>
        </div>

        {/* PENDING */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Pending</p>
              <h2 className="mt-2 text-2xl font-bold text-amber-600">
                {money(pendingAmount)}
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Awaiting confirmation
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
              <Clock size={21} className="text-amber-600" />
            </div>
          </div>
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
              placeholder="Search payment, order, customer, vendor or transaction..."
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

          {/* STATUS */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400"
          >
            <option value="All">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
          </select>

          {/* METHOD */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400"
          >
            <option value="All">All Methods</option>
            <option value="UPI">UPI</option>
            <option value="Credit / Debit Card">Credit / Debit Card</option>
            <option value="Net Banking">Net Banking</option>
            <option value="Wallet">Wallet</option>
            <option value="Cash on Delivery">Cash on Delivery</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              <X size={13} />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-500" />
            <h2 className="font-semibold text-slate-900">
              Payment Transactions
            </h2>
            <span className="text-sm text-slate-400">
              ({filteredPayments.length})
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 size={36} className="animate-spin text-[#287b6d]" />
            <p className="mt-3 text-xs font-semibold text-slate-600">
              Loading payment records from database...
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs">
                  <tr>
                    <th className="px-5 py-4 text-left font-semibold text-slate-600">
                      Payment
                    </th>
                    <th className="px-5 py-4 text-left font-semibold text-slate-600">
                      Customer
                    </th>
                    <th className="px-5 py-4 text-left font-semibold text-slate-600">
                      Vendor
                    </th>
                    <th className="px-5 py-4 text-left font-semibold text-slate-600">
                      Method
                    </th>
                    <th className="px-5 py-4 text-left font-semibold text-slate-600">
                      Amount
                    </th>
                    <th className="px-5 py-4 text-left font-semibold text-slate-600">
                      Status
                    </th>
                    <th className="px-5 py-4 text-left font-semibold text-slate-600">
                      Date
                    </th>
                    <th className="px-5 py-4 text-right font-semibold text-slate-600">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedPayments.length > 0 ? (
                    paginatedPayments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="transition hover:bg-slate-50"
                      >
                        {/* PAYMENT */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                              <CreditCard
                                size={18}
                                className="text-slate-600"
                              />
                            </div>
                            <div>
                              <Link
                                to={`/admin/payments/${payment.id}`}
                                className="font-semibold text-slate-900 hover:text-[#287b6d] hover:underline"
                              >
                                {payment.id}
                              </Link>
                              <p className="mt-0.5 text-[11px] text-slate-400">
                                Order #{payment.orderId}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* CUSTOMER */}
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-900">
                            {payment.customer?.name || "Customer"}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {payment.customer?.email || "—"}
                          </p>
                        </td>

                        {/* VENDOR */}
                        <td className="px-5 py-4 text-slate-600">
                          {payment.vendor || "Multiple Vendors"}
                        </td>

                        {/* METHOD */}
                        <td className="px-5 py-4 text-slate-700 font-medium">
                          {payment.method}
                        </td>

                        {/* AMOUNT */}
                        <td className="px-5 py-4">
                          <span className="font-bold text-slate-900">
                            {money(payment.amount)}
                          </span>
                        </td>

                        {/* STATUS */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                              statusStyle[payment.status] ||
                              "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {payment.status}
                          </span>
                        </td>

                        {/* DATE */}
                        <td className="px-5 py-4 text-slate-500">
                          {payment.date}
                        </td>

                        {/* ACTION */}
                        <td className="px-5 py-4 text-right">
                          <Link
                            to={`/admin/payments/${payment.id}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 shadow-xs transition hover:bg-slate-100 hover:text-[#287b6d]"
                            title="View Transaction Details"
                          >
                            <Eye size={17} />
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-5 py-14 text-center">
                        <CreditCard
                          size={40}
                          className="mx-auto text-slate-300"
                        />
                        <p className="mt-3 font-medium text-slate-700">
                          No payments found
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Try changing your search or filters.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            {filteredPayments.length > itemsPerPage && (
              <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-3.5 sm:flex-row">
                <p className="text-xs text-slate-400">
                  Showing{" "}
                  <span className="font-semibold text-slate-700">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-slate-700">
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredPayments.length,
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-700">
                    {filteredPayments.length}
                  </span>{" "}
                  transactions
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

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (pg) => {
                      if (
                        pg === 1 ||
                        pg === totalPages ||
                        (pg >= currentPage - 1 && pg <= currentPage + 1)
                      ) {
                        return (
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
                        );
                      }
                      if (pg === currentPage - 2 || pg === currentPage + 2) {
                        return (
                          <span
                            key={pg}
                            className="px-1 text-xs text-slate-400"
                          >
                            ...
                          </span>
                        );
                      }
                      return null;
                    },
                  )}

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
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

export default AdminPayments;
