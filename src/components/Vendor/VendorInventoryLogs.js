import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRouteVendor";
import {
  ArrowLeft,
  Search,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Boxes,
  Calendar,
  Filter,
  RefreshCw,
  Loader2,
  FileText,
  PackagePlus,
  PackageMinus,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000/api/vendor/inventory/logs";

const getToken = () =>
  localStorage.getItem("vendorToken") || localStorage.getItem("token") || "";

// Reason badge formatters
const getReasonBadge = (reason) => {
  switch (reason) {
    case "restock":
      return {
        label: "Restock Shipment",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "order_placed":
      return {
        label: "Order Fulfilled",
        color: "bg-blue-50 text-blue-700 border-blue-200",
      };
    case "order_cancelled":
      return {
        label: "Order Cancelled",
        color: "bg-purple-50 text-purple-700 border-purple-200",
      };
    case "damaged":
      return {
        label: "Damaged Goods",
        color: "bg-rose-50 text-rose-700 border-rose-200",
      };
    case "expired":
      return {
        label: "Expired Stock",
        color: "bg-amber-50 text-amber-700 border-amber-200",
      };
    case "lost":
      return {
        label: "Lost / Missing",
        color: "bg-slate-100 text-slate-700 border-slate-300",
      };
    case "returned":
      return {
        label: "Customer Return",
        color: "bg-teal-50 text-teal-700 border-teal-200",
      };
    case "manual_adjustment":
      return {
        label: "Manual Adjustment",
        color: "bg-indigo-50 text-indigo-700 border-indigo-200",
      };
    default:
      return {
        label: reason || "Other",
        color: "bg-slate-50 text-slate-700 border-slate-200",
      };
  }
};

const VendorInventoryLogs = () => {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({
    totalTransactions: 0,
    totalAdded: 0,
    totalSubtracted: 0,
    netChange: 0,
  });
  const [pagination, setPagination] = useState({
    totalLogs: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 20,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [reasonFilter, setReasonFilter] = useState("All");

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(API_BASE_URL, {
        params: {
          page,
          limit: 20,
          type: typeFilter === "All" ? undefined : typeFilter,
          reason: reasonFilter === "All" ? undefined : reasonFilter,
        },
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (res.data && res.data.success) {
        setLogs(res.data.logs || []);
        if (res.data.summary) setSummary(res.data.summary);
        if (res.data.pagination) setPagination(res.data.pagination);
      } else {
        setLogs([]);
      }
    } catch (err) {
      handleAuthError(err);
      console.error("Fetch inventory logs error:", err);
      setError(
        err.response?.data?.message || "Failed to load inventory audit logs.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [typeFilter, reasonFilter]);

  // Client-side search by product name or SKU
  const filteredLogs = logs.filter((log) => {
    const prodName = log.product?.name || log.product?.title || "";
    const sku = log.product?.sku || "";
    const note = log.auditNote || "";
    const term = searchTerm.toLowerCase();

    return (
      prodName.toLowerCase().includes(term) ||
      sku.toLowerCase().includes(term) ||
      note.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link
              to="/vendor/inventory"
              className="hover:text-slate-900 inline-flex items-center gap-1 transition"
            >
              <ArrowLeft size={13} /> Back to Inventory
            </Link>
            <span>/</span>
            <span className="text-slate-800">Audit Logs</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Inventory Logs & Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full historical audit of additions, deductions, sales, and manual
            adjustments
          </p>
        </div>

        <button
          onClick={() => fetchLogs(pagination.currentPage)}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold inline-flex items-center gap-1.5 transition shadow-xs self-start sm:self-auto"
        >
          <RefreshCw
            size={13}
            className={loading ? "animate-spin text-blue-600" : ""}
          />
          Refresh Logs
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">
            Total Audit Logs
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {summary.totalTransactions}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-emerald-600">
            Total Units Added
          </p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            +{summary.totalAdded}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-rose-600">
            Total Units Deducted
          </p>
          <p className="text-2xl font-bold text-rose-600 mt-1">
            -{summary.totalSubtracted}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-700">
            Net Stock Impact
          </p>
          <p
            className={`text-2xl font-bold mt-1 ${
              summary.netChange >= 0 ? "text-slate-900" : "text-rose-600"
            }`}
          >
            {summary.netChange >= 0
              ? `+${summary.netChange}`
              : summary.netChange}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search by Product Name, SKU, or Audit Note..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 font-medium"
          >
            <option value="All">All Operations (+/-)</option>
            <option value="add">Additions Only (+)</option>
            <option value="subtract">Deductions Only (-)</option>
          </select>

          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 font-medium"
          >
            <option value="All">All Reasons</option>
            <option value="restock">Restock Shipment</option>
            <option value="order_placed">Order Sale</option>
            <option value="order_cancelled">Order Cancelled</option>
            <option value="returned">Customer Return</option>
            <option value="damaged">Damaged Goods</option>
            <option value="expired">Expired Product</option>
            <option value="lost">Lost / Missing</option>
            <option value="manual_adjustment">Manual Adjustment</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 size={30} className="animate-spin text-slate-600" />
            <p className="text-xs font-semibold">Loading audit logs...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Quantity</th>
                  <th className="px-6 py-4">Stock Transition</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Audit Note</th>
                  <th className="px-6 py-4 text-right">Adjusted By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => {
                    const isAdd = log.type === "add";
                    const badge = getReasonBadge(log.reason);
                    const prodName =
                      log.product?.name ||
                      log.product?.title ||
                      "Product Removed";
                    const sku = log.product?.sku || "N/A";
                    const prodImg =
                      log.product?.images?.[0] || log.product?.image || null;

                    return (
                      <tr
                        key={log._id}
                        className="hover:bg-slate-50/80 transition"
                      >
                        {/* Timestamp */}
                        <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                          <p className="font-semibold text-slate-900">
                            {new Date(log.createdAt).toLocaleDateString(
                              "en-IN",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {new Date(log.createdAt).toLocaleTimeString(
                              "en-IN",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                        </td>

                        {/* Product */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-lg border border-slate-200 bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                              {prodImg ? (
                                <img
                                  src={prodImg}
                                  alt=""
                                  className="size-full object-cover"
                                />
                              ) : (
                                <Boxes size={14} className="text-slate-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 line-clamp-1">
                                {prodName}
                              </p>
                              <span className="text-[10px] font-mono text-slate-400">
                                {sku}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Action Type */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              isAdd
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {isAdd ? (
                              <ArrowUpRight size={12} />
                            ) : (
                              <ArrowDownRight size={12} />
                            )}
                            {isAdd ? "Restock (+)" : "Deduct (-)"}
                          </span>
                        </td>

                        {/* Quantity */}
                        <td className="px-6 py-4 font-bold text-sm">
                          <span
                            className={
                              isAdd ? "text-emerald-600" : "text-rose-600"
                            }
                          >
                            {isAdd ? `+${log.quantity}` : `-${log.quantity}`}
                          </span>
                        </td>

                        {/* Stock Transition */}
                        <td className="px-6 py-4 font-mono text-[11px] whitespace-nowrap">
                          <span className="text-slate-400">
                            {log.previousStock}
                          </span>
                          <span className="mx-1 text-slate-300">→</span>
                          <span className="font-bold text-slate-900">
                            {log.newStock} units
                          </span>
                        </td>

                        {/* Reason */}
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[10px] font-semibold border ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                        </td>

                        {/* Audit Note */}
                        <td className="px-6 py-4 max-w-xs truncate text-slate-500 text-[11px]">
                          {log.auditNote || (
                            <span className="text-slate-300 italic">None</span>
                          )}
                        </td>

                        {/* Adjusted By */}
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <p className="font-semibold text-slate-900 text-[11px]">
                            {log.adjustedBy?.name ||
                              `${log.adjustedBy?.firstName || ""} ${log.adjustedBy?.lastName || ""}`.trim() ||
                              "Vendor"}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {log.adjustedBy?.email || ""}
                          </p>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-12 text-center text-slate-400"
                    >
                      No inventory logs recorded for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page <strong>{pagination.currentPage}</strong> of{" "}
              <strong>{pagination.totalPages}</strong> ({pagination.totalLogs}{" "}
              total logs)
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={pagination.currentPage <= 1 || loading}
                onClick={() => fetchLogs(pagination.currentPage - 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold hover:bg-slate-50 disabled:opacity-40 transition"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={
                  pagination.currentPage >= pagination.totalPages || loading
                }
                onClick={() => fetchLogs(pagination.currentPage + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold hover:bg-slate-50 disabled:opacity-40 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorInventoryLogs;
