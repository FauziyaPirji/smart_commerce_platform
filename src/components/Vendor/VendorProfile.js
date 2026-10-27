import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRouteVendor";
import {
  Edit,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  Loader2,
  AlertCircle,
  Store,
  Clock,
  Ban,
} from "lucide-react";

const API_BASE_URL = "https://smart-commerce-platform-backend.onrender.com/api";

const VendorProfile = () => {
  const token = localStorage.getItem("vendorToken");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // FETCH DYNAMIC VENDOR PROFILE FROM BACKEND
  useEffect(() => {
    const fetchVendorProfile = async () => {
      try {
        setLoading(true);
        setError("");

        // Get currently logged-in user from localStorage
        const savedUser = JSON.parse(
          localStorage.getItem("vendorUser") || "{}",
        );
        const userId = savedUser.id || savedUser._id;

        if (!userId) {
          setError("No logged-in user found. Please log in as a vendor.");
          setLoading(false);
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/vendors/profile`, {
          params: { userId },
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
        });

        if (response.data && response.data.success && response.data.profile) {
          setProfile(response.data.profile);
        } else {
          setProfile(null);
          setError(
            response.data?.message ||
              "No vendor profile found for this account.",
          );
        }
      } catch (err) {
        handleAuthError(err);

        console.error("Error fetching vendor profile:", err);
        setError(
          err.response?.data?.message ||
            "Unable to connect to server. Please check your backend.",
        );
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorProfile();
  }, []);

  // 1. LOADING STATE
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl p-16 text-center flex flex-col items-center justify-center">
        <Loader2 size={36} className="animate-spin text-blue-600 mb-3" />
        <p className="text-slate-700 font-semibold text-sm">
          Loading Vendor Profile...
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Fetching verified merchant details
        </p>
      </div>
    );
  }

  // 2. ERROR OR NO PROFILE STATE
  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <Store size={48} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-900">
            {error || "Vendor Profile Not Found"}
          </h2>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            We could not find an active vendor registration profile linked to
            your account.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/vendor/register"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              Complete Vendor Registration
            </Link>
            <Link
              to="/vendor"
              className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium transition"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. DYNAMIC INITIALS
  const storeName = profile.storeName || profile.vendorName || "Store";
  const initials =
    storeName
      .split(" ")
      .map((word) => word[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase() || "VP";

  // DYNAMIC STATUS BADGE STYLING
  const status = profile.status || "pending";
  const isApproved = status.toLowerCase() === "approved";
  const isPending = status.toLowerCase() === "pending";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vendor Profile</h1>
          <p className="text-xs text-slate-500 mt-1">
            Verified merchant account and business documentation overview
          </p>
        </div>

        <Link
          to="/vendor/profile/edit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Edit size={15} /> Edit Profile Info
        </Link>
      </div>

      {/* MAIN PROFILE CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-900 text-white font-bold text-xl flex items-center justify-center shrink-0">
              {profile.storeLogo ? (
                <img
                  src={profile.storeLogo}
                  alt={storeName}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                initials
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">
                  {storeName}
                </h2>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                    isApproved
                      ? "bg-emerald-50 text-emerald-700"
                      : isPending
                        ? "bg-amber-50 text-amber-700"
                        : "bg-red-50 text-red-700"
                  }`}
                >
                  {isApproved ? (
                    <ShieldCheck size={13} />
                  ) : isPending ? (
                    <Clock size={13} />
                  ) : (
                    <Ban size={13} />
                  )}
                  {status.toUpperCase()}
                </span>
              </div>

              <p className="text-xs text-slate-500 mt-0.5">
                Owner:{" "}
                <span className="font-semibold text-slate-800">
                  {profile.ownerName ||
                    `${profile.user?.firstName || ""} ${profile.user?.lastName || ""}`.trim() ||
                    "—"}
                </span>
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-400">
            Registered Since:{" "}
            <span className="font-semibold text-slate-700">
              {profile.registrationDate || profile.createdAt
                ? new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }).format(
                    new Date(profile.createdAt || profile.registrationDate),
                  )
                : "Recent"}
            </span>
          </div>
        </div>

        {/* INFO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Section A: Contact Info */}
          <div className="space-y-3">
            <h3 className="font-bold uppercase tracking-wider text-[11px] text-slate-400">
              Contact Details
            </h3>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-700">
                <Mail size={15} className="text-blue-600 shrink-0" />
                <span className="font-medium">
                  {profile.email || profile.user?.email || "—"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-700">
                <Phone size={15} className="text-blue-600 shrink-0" />
                <span className="font-medium">
                  {profile.phone || profile.user?.phone || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Section B: Business Registration */}
          <div className="space-y-3">
            <h3 className="font-bold uppercase tracking-wider text-[11px] text-slate-400">
              Legal Business Registration
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Legal Name / Type:</span>
                <span className="font-bold text-slate-800">
                  {profile.businessType || profile.businessName || "—"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">GST Registration:</span>
                <span className="font-mono font-bold text-slate-900">
                  {profile.gstNumber || "Not Provided"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">PAN Number:</span>
                <span className="font-mono font-bold text-slate-900">
                  {profile.panNumber || "Not Provided"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="pt-4 border-t border-slate-100 text-xs space-y-1">
          <span className="font-bold uppercase tracking-wider text-[11px] text-slate-400 flex items-center gap-1">
            <MapPin size={14} className="text-blue-600" /> Registered Business
            Address
          </span>

          <p className="font-medium text-slate-700">
            {profile.storeAddress ||
              (profile.businessAddress
                ? [
                    profile.businessAddress.addressLine1,
                    profile.businessAddress.addressLine2,
                    profile.businessAddress.city,
                    profile.businessAddress.state,
                    profile.businessAddress.pincode,
                    profile.businessAddress.country,
                  ]
                    .filter(Boolean)
                    .join(", ")
                : "Address not provided.")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VendorProfile;
