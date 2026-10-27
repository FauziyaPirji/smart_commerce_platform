import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRouteAdmin";
import {
  Search,
  Users,
  UserCheck,
  UserX,
  ShoppingBag,
  Eye,
  Loader2,
  AlertCircle,
  RefreshCw,
  Power,
  CheckCircle,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Mail,
  Phone,
  X,
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000/api";

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

const AdminCustomers = () => {
  const token = localStorage.getItem("adminToken");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  // Filters & Sorting
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("spent"); // spent, orders, newest, name

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // FETCH CUSTOMERS FROM BACKEND
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(`${API_BASE_URL}/admin/customers`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      });

      if (response.data && response.data.success) {
        setCustomers(response.data.customers || []);
      } else {
        setCustomers([]);
      }
    } catch (err) {
      handleAuthError(err);
      console.error("Error fetching customers:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load customers from server. Please check backend connection.",
      );
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, sortBy]);

  // TOGGLE STATUS HANDLER (ACTIVE <-> INACTIVE)
  const handleToggleStatus = async (customerId, currentStatus) => {
    const isCurrentlyActive = currentStatus === "Active";
    const newStatus = isCurrentlyActive ? "Inactive" : "Active";

    try {
      setUpdatingId(customerId);

      const response = await axios.put(
        `${API_BASE_URL}/admin/customers/${customerId}/status`,
        { status: newStatus },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
        },
      );

      if (response.data && response.data.success) {
        setCustomers((prev) =>
          prev.map((cust) =>
            (cust.id || cust._id) === customerId
              ? { ...cust, status: newStatus }
              : cust,
          ),
        );
      }
    } catch (err) {
      handleAuthError(err);
      console.error("Error toggling customer status:", err);
      alert(
        err.response?.data?.message ||
          "Unable to update customer status. Please try again.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // FILTER & SORT CUSTOMERS
  const filteredCustomers = useMemo(() => {
    let result = customers.filter((customer) => {
      const name =
        customer.name ||
        `${customer.firstName || ""} ${customer.lastName || ""}`.trim();
      const email = customer.email || "";
      const phone = customer.phone || "";
      const status = customer.status || "Active";

      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        name.toLowerCase().includes(searchText) ||
        email.toLowerCase().includes(searchText) ||
        phone.includes(searchText);

      const matchesStatus = statusFilter === "All" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Sort logic
    return result.sort((a, b) => {
      if (sortBy === "spent") {
        return Number(b.totalSpent || 0) - Number(a.totalSpent || 0);
      }
      if (sortBy === "orders") {
        return Number(b.orders || 0) - Number(a.orders || 0);
      }
      if (sortBy === "name") {
        return (a.name || "").localeCompare(b.name || "");
      }
      // default: newest
      return (
        new Date(b.createdAt || b.joined || 0) -
        new Date(a.createdAt || a.joined || 0)
      );
    });
  }, [customers, search, statusFilter, sortBy]);

  // PAGINATION SLICE
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  // STAT CALCULATIONS
  const activeCount = useMemo(() => {
    return customers.filter((c) => (c.status || "Active") === "Active").length;
  }, [customers]);

  const inactiveCount = useMemo(() => {
    return customers.filter((c) => (c.status || "Active") !== "Active").length;
  }, [customers]);

  const totalOrders = useMemo(() => {
    return customers.reduce((sum, c) => sum + (Number(c.orders) || 0), 0);
  }, [customers]);

  const totalRevenue = useMemo(() => {
    return customers.reduce((sum, c) => sum + (Number(c.totalSpent) || 0), 0);
  }, [customers]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setSortBy("spent");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[#287b6d]" />
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#287b6d]">
              Customer Management
            </p>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
            Customers
          </h1>
          <p className="mt-1 text-xs text-slate-500 md:text-sm">
            View customer accounts, lifetime purchasing volume, and account
            access.
          </p>
        </div>

        <button
          onClick={fetchCustomers}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-95"
          title="Refresh Data"
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

      {/* STAT CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* TOTAL CUSTOMERS */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Total Customers
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">
                {loading ? "..." : formatNumber(customers.length)}
              </h2>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <Users size={20} />
            </div>
          </div>
          <p className="mt-3 text-[11px] font-medium text-slate-400">
            Registered customer accounts
          </p>
        </div>

        {/* ACTIVE CUSTOMERS */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Active Buyers
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">
                {loading ? "..." : formatNumber(activeCount)}
              </h2>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <UserCheck size={20} />
            </div>
          </div>
          <p className="mt-3 text-[11px] font-medium text-slate-400">
            Enabled & authorized
          </p>
        </div>

        {/* TOTAL ORDERS */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Total Orders Placed
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">
                {loading ? "..." : formatNumber(totalOrders)}
              </h2>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-purple-50 text-purple-600">
              <ShoppingBag size={20} />
            </div>
          </div>
          <p className="mt-3 text-[11px] font-medium text-slate-400">
            Across all buyers
          </p>
        </div>

        {/* TOTAL REVENUE */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Customer Spend
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">
                {loading ? "..." : formatMoney(totalRevenue)}
              </h2>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <IndianRupee size={20} />
            </div>
          </div>
          <p className="mt-3 text-[11px] font-medium text-slate-400">
            Gross lifetime value
          </p>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search customers by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-9 text-xs font-medium outline-none transition focus:border-[#287b6d] focus:bg-white focus:ring-4 focus:ring-[#287b6d]/10"
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

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#287b6d] md:w-36"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          {/* Sort Filter */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#287b6d] md:w-44"
          >
            <option value="spent">Highest Spender</option>
            <option value="orders">Most Orders</option>
            <option value="name">Name (A-Z)</option>
            <option value="newest">Newest Joined</option>
          </select>

          {(search || statusFilter !== "All") && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              <X size={13} />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* TABLE CARD */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col justify-between gap-2 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Customer Directory
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {filteredCustomers.length}
              </span>{" "}
              {filteredCustomers.length === 1 ? "customer" : "customers"}
            </p>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 size={36} className="animate-spin text-[#287b6d]" />
            <p className="mt-3 text-xs font-semibold text-slate-600">
              Retrieving customer analytics...
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75">
                    <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Customer
                    </th>
                    <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Contact Details
                    </th>
                    <th className="px-5 py-3.5 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Orders
                    </th>
                    <th className="px-5 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Total Spent
                    </th>
                    <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Status
                    </th>
                    <th className="px-5 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedCustomers.map((customer) => {
                    const customerId = customer.id || customer._id;
                    const customerName =
                      customer.name ||
                      `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
                      "Customer";
                    const initials = getInitials(customerName);
                    const isCustomerActive =
                      (customer.status || "Active").toLowerCase() === "active";
                    const currentStatus = isCustomerActive
                      ? "Active"
                      : "Inactive";
                    const isThisUpdating = updatingId === customerId;

                    return (
                      <tr
                        key={customerId}
                        className="transition hover:bg-slate-50/70"
                      >
                        {/* CUSTOMER NAME & INITIALS */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#287b6d]/15 to-[#287b6d]/5 text-xs font-black text-[#287b6d] border border-[#287b6d]/20 shadow-xs">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <Link
                                to={`/admin/customers/${customerId}`}
                                className="truncate font-bold text-slate-900 transition hover:text-[#287b6d]"
                              >
                                {customerName}
                              </Link>
                              <p className="mt-0.5 text-[11px] text-slate-400">
                                Joined {customer.joined || "Recently"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* CONTACT */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Mail
                              size={12}
                              className="text-slate-400 shrink-0"
                            />
                            <span className="truncate">
                              {customer.email || "—"}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                            <Phone size={12} className="shrink-0" />
                            <span>{customer.phone || "—"}</span>
                          </div>
                        </td>

                        {/* ORDERS */}
                        <td className="px-5 py-4 text-center">
                          <span className="inline-block rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-extrabold text-slate-800">
                            {formatNumber(customer.orders || 0)}
                          </span>
                        </td>

                        {/* TOTAL SPENT */}
                        <td className="px-5 py-4 text-right">
                          <span className="text-xs font-black text-slate-900">
                            {formatMoney(customer.totalSpent || 0)}
                          </span>
                        </td>

                        {/* STATUS */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                              isCustomerActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isCustomerActive
                                  ? "bg-emerald-500"
                                  : "bg-rose-500"
                              }`}
                            />
                            {currentStatus}
                          </span>
                        </td>

                        {/* ACTIONS */}
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Customer Details */}
                            <Link
                              to={`/admin/customers/${customerId}`}
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-[#287b6d]"
                              title="View Customer Profile"
                            >
                              <Eye size={16} />
                            </Link>

                            {/* Toggle Active / Inactive */}
                            <button
                              type="button"
                              disabled={isThisUpdating}
                              onClick={() =>
                                handleToggleStatus(customerId, currentStatus)
                              }
                              className={`rounded-lg p-2 transition disabled:opacity-50 ${
                                isCustomerActive
                                  ? "text-rose-500 hover:bg-rose-50"
                                  : "text-emerald-600 hover:bg-emerald-50"
                              }`}
                              title={
                                isCustomerActive
                                  ? "Deactivate Account"
                                  : "Activate Account"
                              }
                            >
                              {isThisUpdating ? (
                                <Loader2
                                  size={16}
                                  className="animate-spin text-slate-400"
                                />
                              ) : isCustomerActive ? (
                                <Power size={16} />
                              ) : (
                                <CheckCircle size={16} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* EMPTY STATE */}
            {filteredCustomers.length === 0 && (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-50 text-slate-400">
                  <Users size={24} />
                </div>
                <h3 className="mt-4 text-sm font-bold text-slate-800">
                  No customers found
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  {search
                    ? `No customers matched "${search}".`
                    : "No customers have registered yet."}
                </p>
                {search && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}

            {/* PAGINATION */}
            {filteredCustomers.length > itemsPerPage && (
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
                      filteredCustomers.length,
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-700">
                    {filteredCustomers.length}
                  </span>{" "}
                  customers
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
                    (pg) => (
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
                    ),
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

export default AdminCustomers;
