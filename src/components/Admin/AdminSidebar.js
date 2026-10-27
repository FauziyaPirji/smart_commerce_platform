import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Store,
  Package,
  Tags,
  ShoppingCart,
  Users,
  CreditCard,
  RotateCcw,
  X,
  ChevronRight,
  Coins,
  MessageCircleQuestionMark,
} from "lucide-react";

// HELPER: Fetch logged-in Admin details from Storage
const getStoredAdmin = () => {
  try {
    const saved = localStorage.getItem("adminUser");

    if (!saved) return { name: "System Admin", role: "Super Admin" };

    const parsed = JSON.parse(saved);
    const fullName = `${parsed.firstName} ${parsed.lastName || ""}`.trim();

    return {
      name: fullName,
      role: parsed.role || "Super Admin",
    };
  } catch (err) {
    return { name: "System Admin", role: "Super Admin" };
  }
};

// HELPER: Generate initials from name
const getInitials = (name) => {
  if (!name) return "AD";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const AdminSidebar = ({ open, onClose }) => {
  const [admin, setAdmin] = useState({
    name: "System Admin",
    role: "Super Admin",
  });

  // Load Admin Profile dynamically on mount
  useEffect(() => {
    setAdmin(getStoredAdmin());
  }, []);

  const closeMobile = () => onClose();

  const mainMenu = [
    {
      label: "Dashboard",
      path: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Vendors",
      path: "/admin/vendors",
      icon: Store,
    },
    {
      label: "Products",
      path: "/admin/products",
      icon: Package,
    },
    {
      label: "Categories",
      path: "/admin/categories",
      icon: Tags,
    },
    {
      label: "Orders",
      path: "/admin/orders",
      icon: ShoppingCart,
    },
    {
      label: "Customers",
      path: "/admin/customers",
      icon: Users,
    },
  ];

  const managementMenu = [
    {
      label: "Contact Replies",
      path: "/admin/contact",
      icon: MessageCircleQuestionMark,
    },
    {
      label: "Payments",
      path: "/admin/payments",
      icon: CreditCard,
    },
    {
      label: "Payouts",
      path: "/admin/payouts",
      icon: Coins,
    },
  ];

  const initials = getInitials(admin.name);

  return (
    <>
      {/* Mobile Backdrop */}
      {open && (
        <div
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:shadow-none`}
      >
        {/* LOGO HEADER */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#287b6d] text-xs font-black text-white shadow-xs">
              SC
            </div>

            <div>
              <p className="text-sm font-extrabold tracking-tight text-slate-900">
                Smart<span className="text-[#287b6d]">Commerce</span>
              </p>

              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Admin Panel
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeMobile}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* DYNAMIC ADMIN PROFILE */}
        <div className="mx-4 mt-5 rounded-2xl bg-[#18343b] p-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-xs font-bold text-white">
              {initials}
            </div>

            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-white">
                {admin.name}
              </p>

              <div className="mt-1 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[9px] text-white/60">{admin.role}</span>
              </div>
            </div>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {/* MAIN MENU */}
          <p className="mb-3 px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Main Menu
          </p>

          <div className="space-y-1">
            {mainMenu.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeMobile}
                  className={({ isActive }) =>
                    `group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                      isActive
                        ? "bg-[#287b6d]/10 text-[#287b6d]"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className="flex items-center gap-3">
                        <Icon size={17} />
                        {item.label}
                      </span>

                      <ChevronRight
                        size={14}
                        className={`transition ${
                          isActive
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100"
                        }`}
                      />
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* MANAGEMENT MENU */}
          <p className="mb-3 mt-7 px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Management
          </p>

          <div className="space-y-1">
            {managementMenu.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeMobile}
                  className={({ isActive }) =>
                    `group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                      isActive
                        ? "bg-[#287b6d]/10 text-[#287b6d]"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className="flex items-center gap-3">
                        <Icon size={17} />
                        {item.label}
                      </span>

                      <ChevronRight
                        size={14}
                        className={`transition ${
                          isActive
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100"
                        }`}
                      />
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* BOTTOM */}
        <div className="border-t border-slate-100 p-4">
          <p className="text-center text-[9px] text-slate-400">
            SmartCommerce Admin v1.0
          </p>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
