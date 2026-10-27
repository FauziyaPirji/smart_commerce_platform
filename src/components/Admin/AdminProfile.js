import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  Phone,
  ShieldCheck,
  CalendarDays,
  Clock,
  Edit,
  Lock,
  Activity,
  CheckCircle,
} from "lucide-react";

// HELPER: Dynamic Admin Profile Loader
const getAdminProfile = () => {
  try {
    const saved = localStorage.getItem("adminUser");

    if (saved) {
      const parsed = JSON.parse(saved);
      const fullName = `${parsed.firstName} ${parsed.lastName || ""}`.trim();

      return {
        name: fullName,
        email: parsed.email,
        phone: parsed.phone,
        role: parsed.role,
        status: parsed.status,
        joined: parsed.createdAt
          ? new Date(parsed.createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "2-digit",
              year: "numeric",
            })
          : "August 01, 2026",
        lastLogin: new Date().toLocaleString("en-US", {
          month: "long",
          day: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      };
    }
  } catch (err) {
    console.error("Error reading admin profile storage:", err);
  }

};

// HELPER: Generate initials dynamically from name
const getInitials = (name) => {
  if (!name) return "AP";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const AdminProfile = () => {
  const [admin, setAdmin] = useState(getAdminProfile);

  useEffect(() => {
    setAdmin(getAdminProfile());
  }, []);

  const initials = getInitials(admin.name);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Profile</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your administrator account and security information.
          </p>
        </div>

        <Link
          to="/admin/profile/edit"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition shadow-xs"
        >
          <Edit size={17} />
          Edit Profile
        </Link>
      </div>

      {/* PROFILE CARD */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {/* TOP BANNER */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* DYNAMIC AVATAR INITIALS */}
            <div className="w-24 h-24 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white text-3xl font-extrabold shrink-0">
              {initials}
            </div>

            <div className="text-white">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold">{admin.name}</h2>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 text-emerald-200 rounded-full text-xs font-medium border border-emerald-400/20">
                  <CheckCircle size={13} />
                  {admin.status}
                </span>
              </div>

              <p className="text-slate-300 mt-1 font-medium">{admin.role}</p>
              <p className="text-slate-400 text-xs mt-2">
                SmartCommerce Administration Panel
              </p>
            </div>
          </div>
        </div>

        {/* ACCOUNT INFORMATION */}
        <div className="p-6 sm:p-8">
          <h3 className="text-base font-bold text-slate-900 mb-5 border-b border-slate-100 pb-3">
            Account Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* EMAIL */}
            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-slate-600 shadow-xs">
                <Mail size={19} />
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400">Email Address</p>
                <p className="font-semibold text-slate-900 mt-1 break-all text-sm">
                  {admin.email}
                </p>
              </div>
            </div>

            {/* PHONE */}
            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-slate-600 shadow-xs">
                <Phone size={19} />
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400">Phone Number</p>
                <p className="font-semibold text-slate-900 mt-1 text-sm">
                  {admin.phone}
                </p>
              </div>
            </div>

            {/* ROLE */}
            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-slate-600 shadow-xs">
                <ShieldCheck size={19} />
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400">Administrator Role</p>
                <p className="font-semibold text-slate-900 mt-1 text-sm">
                  {admin.role}
                </p>
              </div>
            </div>

            {/* JOINED */}
            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-slate-600 shadow-xs">
                <CalendarDays size={19} />
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400">Joined Date</p>
                <p className="font-semibold text-slate-900 mt-1 text-sm">
                  {admin.joined}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECURITY + ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECURITY */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Lock size={19} />
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-sm">Account Security</h3>
              <p className="text-xs text-slate-400">
                Protect your administrator account.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50">
              <div>
                <p className="text-sm font-semibold text-slate-900">Password</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Last changed recently
                </p>
              </div>

              <Link
                to="/admin/profile/edit"
                className="text-xs font-bold text-slate-800 hover:text-[#287b6d] transition"
              >
                Change
              </Link>
            </div>
          </div>
        </div>

        {/* LOGIN ACTIVITY */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Activity size={19} />
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-sm">Recent Activity</h3>
              <p className="text-xs text-slate-400">
                Latest administrator login information.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <Clock size={19} className="text-slate-600 mt-0.5" />

            <div>
              <p className="text-sm font-bold text-slate-900">Last Login Session</p>
              <p className="text-xs font-semibold text-slate-600 mt-1">
                {admin.lastLogin}
              </p>
              <p className="text-[10px] text-slate-400 mt-2">
                Active administrator session
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;