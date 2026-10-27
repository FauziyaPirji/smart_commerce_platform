import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRouteAdmin.js";
import {
  IndianRupee,
  ShoppingCart,
  Users,
  Store,
  TrendingUp,
  Package,
  Clock3,
  CheckCircle2,
  RefreshCw,
  Loader2,
  AlertCircle,
  Eye,
  ArrowUpRight,
} from "lucide-react";

const API_BASE_URL = "https://smart-commerce-platform-backend.onrender.com/api";

const money = (val) =>
  `₹${new Intl.NumberFormat("en-IN").format(Number(val) || 0)}`;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("adminToken");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalRevenue: 0,
      totalOrders: 0,
      totalCustomers: 0,
      activeVendors: 0,
    },
    statusDistribution: {
      delivered: 0,
      processing: 0,
      shipped: 0,
      placed: 0,
    },
    monthlyChart: [],
    recentOrders: [],
    topVendors: [],
    adminName: "Admin",
  });

  const fetchDashboard = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setError("");

      const res = await axios.get(`${API_BASE_URL}/admin/dashboard`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data && res.data.success) {
        setDashboardData(res.data);
      }
    } catch (err) {
      handleAuthError(error);
      console.error("Admin dashboard fetch error:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/admin/login");
        return;
      }
      setError(
        err.response?.data?.message || "Failed to load live dashboard metrics.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const { stats, statusDistribution, monthlyChart, recentOrders, topVendors } =
    dashboardData;

  const totalStatusCount = Math.max(
    (statusDistribution.delivered || 0) +
      (statusDistribution.processing || 0) +
      (statusDistribution.shipped || 0) +
      (statusDistribution.placed || 0),
    1,
  );

  const getPercent = (count) =>
    Math.round(((count || 0) / totalStatusCount) * 100);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400 bg-white rounded-3xl border border-slate-200">
        <Loader2 size={38} className="animate-spin text-[#287b6d] mb-3" />
        <p className="text-sm font-semibold text-slate-700">
          Gathering live marketplace telemetry...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* PAGE HEADER */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#287b6d]">
            Platform Overview
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
            Welcome back, {dashboardData.adminName} 👋
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Live business activity, transaction volume, and vendor performance.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchDashboard(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 self-start md:self-auto rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={14}
            className={refreshing ? "animate-spin text-[#287b6d]" : ""}
          />
          <span>Sync Data</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 text-xs font-semibold shadow-xs">
          <AlertCircle size={18} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* STAT CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* TOTAL REVENUE */}
        <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:-translate-y-1 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">
                Gross Revenue
              </p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                {money(stats.totalRevenue)}
              </h3>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#287b6d]/10 text-[#287b6d]">
              <IndianRupee size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
            <TrendingUp size={14} />
            <span>Fulfilled sales volume</span>
          </div>
        </div>

        {/* TOTAL ORDERS */}
        <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:-translate-y-1 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">
                Total Orders
              </p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                {stats.totalOrders.toLocaleString("en-IN")}
              </h3>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <ShoppingCart size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span>Customer checkout orders</span>
          </div>
        </div>

        {/* CUSTOMERS */}
        <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:-translate-y-1 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">
                Customers
              </p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                {stats.totalCustomers.toLocaleString("en-IN")}
              </h3>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-purple-50 text-purple-600">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span>Registered shopper accounts</span>
          </div>
        </div>

        {/* ACTIVE VENDORS */}
        <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:-translate-y-1 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">
                Active Vendors
              </p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                {stats.activeVendors.toLocaleString("en-IN")}
              </h3>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-600">
              <Store size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span>Approved seller stores</span>
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* REVENUE OVERVIEW BAR CHART */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Revenue Trajectory
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Monthly sales volume over the last 7 months
              </p>
            </div>
            <span className="text-xs font-bold text-[#287b6d] bg-[#287b6d]/10 px-2.5 py-1 rounded-lg">
              Live Database
            </span>
          </div>

          <div className="mt-8 flex h-56 items-end gap-3 px-2 border-b border-slate-100 pb-2">
            {monthlyChart.map((item, idx) => (
              <div
                key={idx}
                className="group flex h-full flex-1 flex-col justify-end items-center"
              >
                <div
                  style={{ height: `${item.heightPercentage}%` }}
                  className="relative w-full rounded-t-lg bg-[#287b6d]/20 transition group-hover:bg-[#287b6d]"
                >
                  <div className="absolute -top-7 left-1/2 hidden -translate-x-1/2 rounded-md bg-slate-900 px-2 py-1 text-[10px] font-bold text-white group-hover:block whitespace-nowrap z-10 shadow-xs">
                    {money(item.revenue)}
                  </div>
                </div>
                <span className="mt-2 text-center text-[11px] font-semibold text-slate-400">
                  {item.month}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ORDER STATUS DISTRIBUTION */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900">Order Progress</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Fulfillment stage distribution
          </p>

          <div className="mt-6 space-y-4">
            {/* Delivered */}
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  Delivered
                </span>
                <span className="font-bold text-slate-900">
                  {statusDistribution.delivered || 0} (
                  {getPercent(statusDistribution.delivered)}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  style={{
                    width: `${getPercent(statusDistribution.delivered)}%`,
                  }}
                  className="h-full rounded-full bg-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Shipped */}
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <ShoppingCart size={14} className="text-blue-500" />
                  Shipped
                </span>
                <span className="font-bold text-slate-900">
                  {statusDistribution.shipped || 0} (
                  {getPercent(statusDistribution.shipped)}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  style={{
                    width: `${getPercent(statusDistribution.shipped)}%`,
                  }}
                  className="h-full rounded-full bg-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Processing */}
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <Package size={14} className="text-indigo-500" />
                  Processing
                </span>
                <span className="font-bold text-slate-900">
                  {statusDistribution.processing || 0} (
                  {getPercent(statusDistribution.processing)}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  style={{
                    width: `${getPercent(statusDistribution.processing)}%`,
                  }}
                  className="h-full rounded-full bg-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Placed */}
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <Clock3 size={14} className="text-amber-500" />
                  Placed / Pending
                </span>
                <span className="font-bold text-slate-900">
                  {statusDistribution.placed || 0} (
                  {getPercent(statusDistribution.placed)}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  style={{ width: `${getPercent(statusDistribution.placed)}%` }}
                  className="h-full rounded-full bg-amber-500 transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* RECENT ORDERS */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs xl:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Recent Transactions
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Latest customer purchases across the marketplace
              </p>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs font-bold text-[#287b6d] hover:underline"
            >
              View all orders
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50 text-slate-400 font-bold uppercase">
                <tr>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="transition hover:bg-slate-50">
                      <td className="px-5 py-3.5 font-bold text-slate-800 font-mono">
                        <Link
                          to={`/admin/orders/${order.orderId}`}
                          className="hover:text-[#287b6d] hover:underline"
                        >
                          {order.id}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700 font-medium">
                        {order.customer}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">
                        {order.date}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {money(order.amount)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            order.status === "Delivered"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : order.status === "Shipped"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="py-12 text-center text-slate-400"
                    >
                      No orders placed yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TOP PERFORMING VENDORS */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Top Vendors</h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Best performing stores
              </p>
            </div>
            <Link
              to="/admin/vendors"
              className="text-xs font-bold text-[#287b6d] hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {topVendors.length > 0 ? (
              topVendors.map((vendor, index) => (
                <div
                  key={vendor.id || index}
                  className="flex items-center gap-3 p-4"
                >
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#287b6d]/10 text-xs font-bold text-[#287b6d]">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-800">
                      {vendor.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {vendor.category} · {vendor.orders} items fulfilled
                    </p>
                  </div>
                  <p className="text-xs font-bold text-slate-900">
                    {money(vendor.sales)}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                No store sales recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
