import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRouteVendor";
import {
  IndianRupee,
  ShoppingBag,
  Package,
  Clock,
  TrendingUp,
  ArrowUpRight,
  AlertTriangle,
  Wallet,
  CreditCard,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";

const API_BASE_URL = "https://smart-commerce-platform-backend.onrender.com/api/vendors";

const getToken = () =>
  localStorage.getItem("vendorToken") || localStorage.getItem("token") || null;

const money = (val) =>
  `₹${new Intl.NumberFormat("en-IN").format(Math.round(Number(val) || 0))}`;

const VendorDashboard = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [dashboard, setDashboard] = useState({
    stats: {
      totalSales: 0,
      totalOrders: 0,
      totalProducts: 0,
      pendingOrders: 0,
    },
    financials: {
      availableBalance: 0,
      pendingPayout: 0,
      netEarnings: 0,
    },
    chartBars: [],
    recentOrders: [],
    topProducts: [],
    lowStockProducts: [],
    recentPayouts: [],
  });

  const fetchVendorDashboard = async (isSilent = false) => {
    const token = getToken();

    if (!token) {
      navigate("/vendor/login");
      return;
    }

    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setError("");

      const res = await axios.get(`${API_BASE_URL}/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.data && res.data.success) {
        setDashboard(res.data);
      }
    } catch (err) {
      handleAuthError(err);
      console.error("Error loading vendor dashboard:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/vendor/login");
        return;
      }
      setError(
        err.response?.data?.message || "Failed to retrieve store dashboard.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVendorDashboard();
  }, []);

  const {
    stats = {},
    financials = {},
    chartBars = [],
    recentOrders = [],
    topProducts = [],
    lowStockProducts = [],
    recentPayouts = [],
  } = dashboard;

  // Real Available Payout Balance
  const availablePayoutBalance =
    financials.availableBalance !== undefined &&
    financials.availableBalance !== null
      ? financials.availableBalance
      : Math.max(
          0,
          Number(financials.netEarnings || 0) -
            Number(financials.pendingPayout || 0),
        );

  // Dynamic Bars formatting
  const formattedBars =
    chartBars && chartBars.length > 0
      ? chartBars.map((bar, idx) => {
          if (typeof bar === "number") {
            return { label: `M-${6 - idx}`, revenue: 0, height: bar };
          }
          return {
            label: bar.label || `M${idx + 1}`,
            revenue: Number(bar.revenue || 0),
            height: Number(bar.height || (bar.revenue > 0 ? 50 : 8)),
          };
        })
      : [
          { label: "M-5", revenue: 0, height: 8 },
          { label: "M-4", revenue: 0, height: 8 },
          { label: "M-3", revenue: 0, height: 8 },
          { label: "M-2", revenue: 0, height: 8 },
          { label: "Last Mo", revenue: 0, height: 8 },
          { label: "This Mo", revenue: 0, height: 8 },
        ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400 bg-white rounded-3xl border border-slate-200">
        <Loader2 size={38} className="animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-semibold text-slate-700">
          Loading store sales & orders telemetry...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Store Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Fulfillment overview, available payout balances, and sales
            performance.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchVendorDashboard(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 self-start sm:self-auto px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-xs disabled:opacity-50"
        >
          <RefreshCw
            size={14}
            className={refreshing ? "animate-spin text-blue-600" : ""}
          />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 text-xs font-semibold shadow-xs">
          <AlertCircle size={18} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* TOTAL SALES */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Sales
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <IndianRupee size={18} />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-3">
            {money(stats.totalSales || 0)}
          </h2>
          <span className="text-[11px] text-slate-400 block mt-1">
            Lifetime store sales volume
          </span>
        </div>

        {/* TOTAL ORDERS */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Orders
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShoppingBag size={18} />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-3">
            {stats.totalOrders || 0}
          </h2>
          <span className="text-[11px] text-slate-400 block mt-1">
            Customer order placements
          </span>
        </div>

        {/* ACTIVE PRODUCTS */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Catalog Items
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Package size={18} />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-3">
            {stats.totalProducts || 0}
          </h2>
          <span className="text-[11px] text-slate-400 block mt-1">
            Active catalog items
          </span>
        </div>

        {/* PENDING ORDERS */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              Action Required
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <h2 className="text-2xl font-black text-amber-600 mt-3">
            {stats.pendingOrders || 0}
          </h2>
          <span className="text-[11px] text-slate-400 block mt-1">
            Orders pending shipment
          </span>
        </div>
      </div>

      {/* FINANCIAL SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* AVAILABLE BALANCE */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-bold text-slate-400">
                Available Payout Balance
              </p>
              <h2 className="text-3xl font-black mt-2 text-white">
                {money(availablePayoutBalance)}
              </h2>
            </div>
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-blue-300">
              <Wallet size={22} />
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
            <span>Platform Fee (2%) deducted</span>
            <Link
              to="/vendor/earnings"
              className="text-blue-300 hover:text-white font-semibold underline"
            >
              Earnings Statement
            </Link>
          </div>
        </div>

        {/* PENDING SETTLEMENT */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-bold text-slate-400">
                Pending Settlement
              </p>
              <h2 className="text-3xl font-black text-slate-900 mt-2">
                {money(financials.pendingPayout || 0)}
              </h2>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CreditCard size={22} />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4">
            Awaiting bank wire disbursement from administration
          </p>
        </div>

        {/* NET REVENUE ACCRUED */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-bold text-slate-400">
                Net Revenue (98%)
              </p>
              <h2 className="text-3xl font-black text-emerald-600 mt-2">
                {money(financials.netEarnings || 0)}
              </h2>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={22} />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4">
            Total net revenue earned by your store
          </p>
        </div>
      </div>

      {/* DYNAMIC SALES PERFORMANCE BARS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Sales Activity Trajectory
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Monthly fulfilled sales revenue
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
            Last 6 Months
          </span>
        </div>

        {/* DYNAMIC BARS CONTAINER */}
        <div className="mt-8">
          <div className="flex items-end justify-between gap-3 sm:gap-6 h-48 border-b border-slate-100 pb-2">
            {formattedBars.map((bar, index) => (
              <div
                key={index}
                className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer"
              >
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 text-white text-[11px] font-bold px-2 py-1 rounded-md shadow-md whitespace-nowrap z-10 pointer-events-none">
                  {bar.revenue > 0 ? money(bar.revenue) : "₹0 sales"}
                </div>

                {/* Dynamic Height Bar */}
                <div
                  className="w-full max-w-[44px] bg-slate-900 rounded-t-lg group-hover:bg-blue-600 transition-all duration-300"
                  style={{
                    height: `${Math.max(8, Math.min(100, bar.height))}%`,
                  }}
                />
              </div>
            ))}
          </div>

          {/* Month labels under bars */}
          <div className="flex justify-between gap-3 sm:gap-6 mt-3">
            {formattedBars.map((bar, index) => (
              <div
                key={index}
                className="flex-1 text-center text-[11px] font-semibold text-slate-400 truncate"
              >
                {bar.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RECENT ORDERS + TOP PRODUCTS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* RECENT ORDERS */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Recent Store Orders
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Purchases assigned to your products
              </p>
            </div>
            <Link
              to="/vendor/orders"
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentOrders && recentOrders.length > 0 ? (
              recentOrders.map((order, idx) => (
                <div key={idx} className="p-4 flex items-center gap-3 text-xs">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <ShoppingBag size={17} className="text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">
                      #{order.id} · {order.product}
                    </p>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      {order.customer} · {order.date}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900">
                      {money(order.amount)}
                    </p>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                No orders received yet.
              </div>
            )}
          </div>
        </div>

        {/* TOP SELLING PRODUCTS */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">
              Top Selling Products
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ranked by total store revenue
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {topProducts && topProducts.length > 0 ? (
              topProducts.map((product, index) => (
                <div
                  key={index}
                  className="p-4 flex items-center gap-3 text-xs"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">
                      {product.name}
                    </p>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      {product.sold} units fulfilled
                    </p>
                  </div>
                  <p className="font-black text-slate-900">
                    {money(product.revenue)}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                No product sales recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LOW STOCK + RECENT PAYOUTS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* LOW STOCK */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Low Stock Alert
              </h2>
              <p className="text-xs text-slate-400">Items needing restocking</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {lowStockProducts && lowStockProducts.length > 0 ? (
              lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="p-4 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900">{product.name}</p>
                    <p className="text-amber-600 font-semibold mt-0.5">
                      Only {product.stock} units remaining
                    </p>
                  </div>
                  <Link
                    to="/vendor/inventory"
                    className="inline-flex items-center gap-1 font-bold text-slate-900 hover:text-blue-600"
                  >
                    <span>Restock</span>
                    <ArrowUpRight size={13} />
                  </Link>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-emerald-600 font-medium">
                ✓ All products are healthy and adequately stocked.
              </div>
            )}
          </div>
        </div>

        {/* PAYOUTS HISTORY */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Wallet size={16} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Recent Disbursed Payouts
                </h2>
                <p className="text-xs text-slate-400">Transfers received</p>
              </div>
            </div>
            <Link
              to="/vendor/payouts"
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentPayouts && recentPayouts.length > 0 ? (
              recentPayouts.map((payout, index) => (
                <div
                  key={index}
                  className="p-4 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900">{payout.id}</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      {payout.date}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900">
                      {money(payout.amount)}
                    </p>
                    <span className="text-[10px] text-emerald-600 font-bold">
                      {payout.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                No disbursements executed yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
