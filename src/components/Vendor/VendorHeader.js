import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Store, User, ChevronDown, LogOut } from "lucide-react";

const VendorHeader = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [showProfile, setShowProfile] = useState(false);

  // Dynamic Vendor Profile & User State
  const [vendorProfile, setVendorProfile] = useState(null);
  const [vendorUser, setVendorUser] = useState(null);

  // Sync vendor authentication data from LocalStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem("vendorProfile");
    const savedUser = localStorage.getItem("vendorUser");

    if (savedProfile) {
      try {
        setVendorProfile(JSON.parse(savedProfile));
      } catch (e) {
        console.error("Error parsing stored vendorProfile:", e);
      }
    }

    if (savedUser) {
      try {
        setVendorUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Error parsing stored vendorUser:", e);
      }
    }
  }, []);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem("vendorToken");
    localStorage.removeItem("vendorUser");
    localStorage.removeItem("vendorProfile");
    setShowProfile(false);
    navigate("/vendor/login");
  };

  // Generate Initials from Store Name (e.g. "ElectroCore" -> "EC")
  const getInitials = (name) => {
    if (!name) return "VP";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Computed display values
  const storeName = vendorProfile?.storeName || "My Store";
  const vendorEmail = vendorUser?.email || "vendor@smartcommerce.in";
  const storeLogo = vendorProfile?.storeLogo;
  const storeInitials = getInitials(storeName);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        {/* LEFT */}
        <div className="flex items-center gap-3">
          {/* MOBILE MENU */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle Sidebar"
          >
            <Menu size={22} />
          </button>

          {/* LOGO */}
          <Link to="/vendor" className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-xl bg-teal-700 text-sm font-black text-white sm:hidden">
              SC
            </div>
            <div className="hidden sm:block">
              <p className="font-extrabold leading-none text-slate-900">
                Smart<span className="text-teal-700">Commerce</span>
              </p>
              <p className="mt-1 text-[11px] font-medium text-slate-500">
                Vendor Panel
              </p>
            </div>
          </Link>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">
          {/* MY STORE LINK */}
          <Link
            to="/vendor/store"
            className="hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 sm:flex"
          >
            <Store size={18} />
            <span>My Store</span>
          </Link>

          {/* PROFILE DROPDOWN CONTAINER */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-100"
            >
              {/* DYNAMIC AVATAR / IMAGE */}
              {storeLogo ? (
                <img
                  src={storeLogo}
                  alt={storeName}
                  className="size-9 rounded-xl border border-slate-200 object-cover"
                />
              ) : (
                <div className="grid size-9 place-items-center rounded-xl bg-teal-700 text-sm font-semibold text-white shadow-xs">
                  {storeInitials}
                </div>
              )}

              <div className="hidden text-left lg:block">
                <p className="max-w-[140px] truncate text-sm font-semibold text-slate-900">
                  {storeName}
                </p>
                <p className="text-xs text-slate-500">Vendor Workspace</p>
              </div>

              <ChevronDown
                size={16}
                className={`hidden text-slate-400 transition-transform lg:block ${showProfile ? "rotate-180" : ""}`}
              />
            </button>

            {/* DROPDOWN MENU */}
            {showProfile && (
              <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
                {/* HEADER INFO */}
                <div className="border-b border-slate-100 p-4 bg-slate-50/50">
                  <p className="truncate font-bold text-slate-900">
                    {storeName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {vendorEmail}
                  </p>
                </div>

                {/* LINKS */}
                <div className="p-2 space-y-1">
                  <Link
                    to="/vendor/profile"
                    onClick={() => setShowProfile(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    <User size={17} className="text-slate-400" />
                    Store Profile
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut size={17} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default VendorHeader;
