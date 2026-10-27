import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import axios from "axios";
import { getStoredVendor } from "../../utils/vendorAuth";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Boxes,
  Wallet,
  IndianRupee,
  Users,
  Store,
  Truck,
  UserCircle,
  X,
  ChevronRight,
  ShieldCheck,
  Clock,
  AlertCircle,
} from "lucide-react";

// Helper function to extract initials from store name
const getInitials = (name) => {
  if (!name) return "VN";
  const words = String(name).trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return String(name).slice(0, 2).toUpperCase();
};

const VendorSidebar = ({ sidebarOpen, onClose }) => {
  const location = useLocation();
  const [vendor, setVendor] = useState(null);

  // 1. Load dynamic vendor data from stored session & live API fallback
  useEffect(() => {
    let currentVendor = null;
    try {
      if (typeof getStoredVendor === "function") {
        currentVendor = getStoredVendor();
      }
    } catch (e) {
      // ignore
    }

    if (!currentVendor) {
      try {
        const stored =
          localStorage.getItem("vendor") ||
          localStorage.getItem("vendorUser") ||
          localStorage.getItem("user");
        if (stored) currentVendor = JSON.parse(stored);
      } catch (e) {
        // ignore
      }
    }

    if (currentVendor) {
      setVendor(currentVendor);
    }

    // Background fetch to ensure fresh store name & logo from backend
    const token =
      localStorage.getItem("vendorToken") || localStorage.getItem("token");
    if (token) {
      axios
        .get("https://smart-commerce-platform-backend.onrender.com/api/vendors/store", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          if (res.data?.store) {
            setVendor((prev) => ({
              ...prev,
              ...res.data.store,
              storeName: res.data.store.storeName || prev?.storeName,
              storeLogo: res.data.store.storeLogo || prev?.storeLogo,
            }));
          }
        })
        .catch(() => null);
    }
  }, []);

  // Compute store status details
  const storeName =
    vendor?.storeName ||
    vendor?.businessName ||
    vendor?.name ||
    vendor?.ownerName ||
    "Vendor Store";

  const storeLogo = vendor?.storeLogo || "";
  const initials = getInitials(storeName);

  const approvalStatus = String(
    vendor?.approvalStatus || vendor?.status || "approved",
  ).toLowerCase();
  const isActive = vendor?.isActive !== false;

  const isLive = approvalStatus === "approved" && isActive;
  const isPending = approvalStatus === "pending";

  const menuGroups = [
    {
      title: "MAIN",
      items: [
        {
          name: "Dashboard",
          path: "/vendor",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "CATALOG",
      items: [
        {
          name: "Products",
          path: "/vendor/products",
          icon: Package,
        },
        {
          name: "Inventory",
          path: "/vendor/inventory",
          icon: Boxes,
        },
        {
          name: "Inventory Logs",
          path: "/vendor/inventory/logs",
          icon: Boxes,
        },
      ],
    },
    {
      title: "SALES & ORDERS",
      items: [
        {
          name: "Orders",
          path: "/vendor/orders",
          icon: ShoppingBag,
        },
        {
          name: "Customers",
          path: "/vendor/customers",
          icon: Users,
        },
      ],
    },
    {
      title: "FINANCE",
      items: [
        {
          name: "Earnings",
          path: "/vendor/earnings",
          icon: IndianRupee,
        },
        {
          name: "Payouts",
          path: "/vendor/payouts",
          icon: Wallet,
        },
      ],
    },
    {
      title: "STORE SETTINGS",
      items: [
        {
          name: "Store Management",
          path: "/vendor/store",
          icon: Store,
        },
      ],
    },
    {
      title: "ACCOUNT",
      items: [
        {
          name: "Profile",
          path: "/vendor/profile",
          icon: UserCircle,
        },
      ],
    },
  ];

  return (
    <>
      {/* MOBILE BACKDROP OVERLAY */}
      {sidebarOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden animate-in fade-in"
        />
      )}

      {/* SIDEBAR ASIDE */}
      <aside
        className={`
          fixed left-0 top-0 z-50
          flex h-screen w-64
          flex-col bg-slate-950 text-white
          border-r border-slate-800/80
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* BRAND LOGO HEADER */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-5">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 grid place-items-center font-black text-white text-sm shadow-md shadow-blue-500/20">
              SC
            </div>
            <div>
              <p className="font-extrabold tracking-tight text-white text-sm">
                SmartCommerce
              </p>
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                Vendor Hub
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* DYNAMIC VENDOR MINI PROFILE */}
        <div className="p-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 hover:border-slate-700 transition">
            <div className="flex items-center gap-3">
              {/* Actual Logo or Initials */}
              {storeLogo ? (
                <img
                  src={storeLogo}
                  alt={storeName}
                  className="size-10 rounded-xl object-cover border border-slate-700 shrink-0 bg-slate-800"
                />
              ) : (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 font-extrabold text-sm border border-blue-500/30">
                  {initials}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-xs font-bold text-white"
                  title={storeName}
                >
                  {storeName}
                </p>
                <p className="truncate text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`size-1.5 rounded-full ${
                      isLive
                        ? "bg-emerald-400"
                        : isPending
                          ? "bg-amber-400"
                          : "bg-rose-400"
                    }`}
                  />
                  {isLive
                    ? "Active Store"
                    : isPending
                      ? "Under Review"
                      : "Offline"}
                </p>
              </div>

              {isLive ? (
                <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
              ) : isPending ? (
                <Clock size={16} className="text-amber-400 shrink-0" />
              ) : (
                <AlertCircle size={16} className="text-rose-400 shrink-0" />
              )}
            </div>
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 overflow-y-auto px-3 pb-5 space-y-6">
          {menuGroups.map((group) => (
            <div key={group.title}>
              <p className="mb-2 px-3 text-[10px] font-extrabold tracking-widest text-slate-500 uppercase">
                {group.title}
              </p>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  // Exact match for dashboard to prevent double-highlighting
                  const isDashboard = item.path === "/vendor";

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={isDashboard}
                      onClick={() => {
                        if (
                          typeof onClose === "function" &&
                          window.innerWidth < 1024
                        ) {
                          onClose();
                        }
                      }}
                      className={({ isActive }) =>
                        `
                        group flex items-center gap-3
                        rounded-xl px-3 py-2.5
                        text-xs font-semibold
                        transition-all duration-150
                        ${
                          isActive
                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 font-bold"
                            : "text-slate-400 hover:bg-slate-900 hover:text-white"
                        }
                        `
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            size={16}
                            className={`transition-colors ${
                              isActive
                                ? "text-white"
                                : "text-slate-400 group-hover:text-white"
                            }`}
                          />

                          <span className="flex-1">{item.name}</span>

                          <ChevronRight
                            size={14}
                            className={`transition-transform duration-150 ${
                              isActive
                                ? "opacity-100 translate-x-0 text-white/80"
                                : "opacity-0 -translate-x-1 group-hover:opacity-40 group-hover:translate-x-0"
                            }`}
                          />
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* BOTTOM STORE STATUS PILL */}
        <div className="border-t border-slate-800/80 p-3">
          <div
            className={`rounded-2xl border p-3 ${
              isLive
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                : isPending
                  ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
                  : "border-rose-500/20 bg-rose-500/10 text-rose-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider">
                Store Status
              </span>
              <span
                className={`size-2 rounded-full ${
                  isLive
                    ? "bg-emerald-400 animate-pulse shadow-xs shadow-emerald-400"
                    : isPending
                      ? "bg-amber-400"
                      : "bg-rose-400"
                }`}
              />
            </div>

            <p className="mt-1 text-xs font-bold text-white">
              {isLive
                ? "Accepting Orders"
                : isPending
                  ? "Pending Admin Approval"
                  : "Store Offline"}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default VendorSidebar;
