import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRouteAdmin";
import {
  ArrowLeft,
  Store,
  Package,
  ShoppingCart,
  IndianRupee,
  Mail,
  Phone,
  User,
  CalendarDays,
  Tag,
  CheckCircle2,
  Ban,
  Clock3,
  Loader2,
  AlertCircle,
  Briefcase,
  MapPin,
  Building2,
  CreditCard,
  Globe,
  FileText,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000/api";

/* ============================================================================
   HELPERS & FORMATTERS
   ============================================================================ */

const formatNumber = (val) => {
  const num = Number(val);
  return isNaN(num) ? "0" : num.toLocaleString("en-IN");
};

const formatCurrency = (val) => {
  const num = Number(val);
  return isNaN(num) ? "₹0" : `₹${num.toLocaleString("en-IN")}`;
};

const getInitials = (name) => {
  if (!name) return "VN";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const getNormalizedStatus = (vendor) => {
  const status = String(
    vendor?.status || vendor?.approvalStatus || "",
  ).toLowerCase();

  if (status === "approved" && vendor?.isActive !== false) {
    return "Active";
  }
  if (status === "pending") {
    return "Pending";
  }
  if (
    status === "rejected" ||
    status === "suspended" ||
    vendor?.isActive === false
  ) {
    return "Suspended";
  }
  return "Active";
};

// Extracts Image URL with multiple fallbacks
const getVendorImage = (vendor) => {
  return (
    vendor?.storeLogo ||
    vendor?.logo ||
    vendor?.storeImage ||
    vendor?.image ||
    vendor?.avatar ||
    vendor?.user?.profilePicture ||
    vendor?.user?.avatar ||
    null
  );
};

/* ============================================================================
   AVATAR WITH BROKEN IMAGE FALLBACK
   ============================================================================ */
const VendorAvatar = ({ vendor, size = "lg" }) => {
  const [imageError, setImageError] = useState(false);
  const imageUrl = getVendorImage(vendor);
  const name =
    vendor?.storeName || vendor?.businessName || vendor?.name || "Store";
  const initials = getInitials(name);

  const sizeClasses =
    {
      md: "w-14 h-14 text-sm rounded-xl",
      lg: "w-20 h-20 text-2xl rounded-2xl",
      xl: "w-24 h-24 text-3xl rounded-3xl",
    }[size] || "w-20 h-20 text-2xl rounded-2xl";

  return (
    <div className="relative shrink-0">
      {imageUrl && !imageError ? (
        <img
          src={imageUrl}
          alt={name}
          onError={() => setImageError(true)}
          className={`${sizeClasses} object-cover border-2 border-white shadow-md bg-white`}
        />
      ) : (
        <div
          className={`${sizeClasses} grid place-items-center font-black bg-gradient-to-br from-[#287b6d]/20 to-[#287b6d]/10 text-[#287b6d] border-2 border-white shadow-md tracking-wider select-none`}
        >
          {initials}
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   MAIN COMPONENT
   ============================================================================ */
const AdminViewVendor = () => {
  const token = localStorage.getItem("adminToken");
  const navigate = useNavigate();
  const { vendorId } = useParams();

  const [vendor, setVendor] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedKey, setCopiedKey] = useState(null);

  // Copy helper
  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // FETCH VENDOR & CATEGORIES FROM BACKEND
  const fetchVendorData = async () => {
    setLoading(true);
    setError("");

    try {
      // 1. Fetch Categories list for name resolution
      const catRes = await axios
        .get(`${API_BASE_URL}/categories`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
        })
        .catch(() => null);

      if (catRes?.data) {
        const list = Array.isArray(catRes.data)
          ? catRes.data
          : catRes.data.categories || catRes.data.data || [];
        setCategories(list);
      }

      // 2. Fetch Vendor Profile by ID
      const res = await axios.get(`${API_BASE_URL}/vendors/${vendorId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      });

      const vendorData = res.data?.vendor || res.data?.data || res.data;

      if (vendorData) {
        setVendor(vendorData);
      } else {
        setError("Vendor profile details not found in database.");
      }
    } catch (err) {
      handleAuthError(err);
      console.error("Error fetching vendor details:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load vendor details from backend.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vendorId) {
      fetchVendorData();
    } else {
      setLoading(false);
      setError("No Vendor ID provided in URL.");
    }
  }, [vendorId]);

  /* CATEGORY RESOLUTION */
  const categoryName = useMemo(() => {
    if (!vendor) return "No Category";

    const rawCat =
      vendor.category ||
      vendor.categories ||
      vendor.categoryId ||
      vendor.categoryName ||
      vendor.businessCategory;

    if (!rawCat) return "No Category";

    if (Array.isArray(rawCat) && rawCat.length > 0) {
      const names = rawCat
        .map((c) => {
          if (typeof c === "object" && c !== null) {
            return c.name || c.categoryName || c.title || "";
          }
          const found = categories.find(
            (item) => String(item._id || item.id) === String(c),
          );
          return found ? found.name || found.categoryName : String(c);
        })
        .filter(Boolean);
      if (names.length > 0) return names.join(", ");
    }

    if (typeof rawCat === "object" && rawCat !== null) {
      return rawCat.name || rawCat.categoryName || "No Category";
    }

    if (typeof rawCat === "string" && rawCat.trim()) {
      const catStr = rawCat.trim();
      const found = categories.find(
        (item) => String(item._id || item.id) === catStr,
      );
      if (found) return found.name || catStr;
      if (!/^[0-9a-fA-F]{24}$/.test(catStr)) return catStr;
    }

    return "No Category";
  }, [vendor, categories]);

  /* APPROVE VENDOR ACTION */
  const handleApprove = async () => {
    if (!vendor?._id && !vendor?.id) return;
    const targetId = vendor._id || vendor.id;

    setActionLoading(true);
    try {
      const res = await axios.put(
        `${API_BASE_URL}/vendors/${targetId}/approve`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
        },
      );
      if (res.status === 200 || res.data?.success) {
        setVendor((prev) => ({
          ...prev,
          status: "approved",
          approvalStatus: "approved",
          isActive: true,
        }));
      }
    } catch (err) {
      handleAuthError(err);
      console.error("Approve vendor error:", err);
      alert(err.response?.data?.message || "Failed to approve vendor.");
    } finally {
      setActionLoading(false);
    }
  };

  /* SUSPEND VENDOR ACTION */
  const handleSuspend = async () => {
    if (!vendor?._id && !vendor?.id) return;
    const targetId = vendor._id || vendor.id;

    setActionLoading(true);
    try {
      const res = await axios.put(
        `${API_BASE_URL}/vendors/${targetId}/suspend`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
        },
      );
      if (res.status === 200 || res.data?.success) {
        setVendor((prev) => ({
          ...prev,
          status: "rejected",
          approvalStatus: "rejected",
          isActive: false,
        }));
      }
    } catch (err) {
      handleAuthError(err);
      console.error("Suspend vendor error:", err);
      alert(err.response?.data?.message || "Failed to suspend vendor.");
    } finally {
      setActionLoading(false);
    }
  };

  /* DELETE VENDOR ACTION */
  const handleDelete = async () => {
    const vName = vendor?.storeName || vendor?.name || "this store";
    if (
      !window.confirm(
        `Are you sure you want to permanently delete store "${vName}"?`,
      )
    )
      return;

    const targetId = vendor?._id || vendor?.id;
    setActionLoading(true);
    try {
      const res = await axios.delete(`${API_BASE_URL}/vendors/${targetId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      });
      if (res.status === 200 || res.data?.success) {
        navigate("/admin/vendors");
      }
    } catch (err) {
      handleAuthError(err);
      console.error("Delete vendor error:", err);
      alert(err.response?.data?.message || "Failed to delete vendor.");
    } finally {
      setActionLoading(false);
    }
  };

  // Address formatter
  const formattedAddress = useMemo(() => {
    if (!vendor?.businessAddress) return "Not provided";
    const addr = vendor.businessAddress;
    if (typeof addr === "string") return addr;

    const parts = [
      addr.addressLine1 || addr.street,
      addr.addressLine2,
      addr.city,
      addr.state,
      addr.pincode ? `- ${addr.pincode}` : "",
      addr.country || "India",
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(", ") : "Not provided";
  }, [vendor]);

  /* LOADING STATE */
  if (loading) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center text-slate-500">
        <Loader2 size={38} className="animate-spin text-[#287b6d]" />
        <p className="mt-4 text-xs font-bold text-slate-600">
          Loading vendor details...
        </p>
      </div>
    );
  }

  /* NOT FOUND OR ERROR STATE */
  if (error || !vendor) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-500">
            <Store size={26} />
          </div>
          <h2 className="mt-4 text-lg font-extrabold text-slate-900">
            Vendor Profile Not Found
          </h2>
          <p className="mt-1.5 text-xs text-slate-500">
            {error || "The requested vendor does not exist in the database."}
          </p>
          <button
            type="button"
            onClick={() => navigate("/admin/vendors")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#287b6d] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#226b60]"
          >
            <ArrowLeft size={14} />
            Back to Vendors
          </button>
        </div>
      </div>
    );
  }

  /* DATA RESOLUTION */
  const vName =
    vendor.storeName || vendor.businessName || vendor.name || "Unnamed Store";
  const vOwner =
    (vendor.user
      ? `${vendor.user.firstName || ""} ${vendor.user.lastName || ""}`.trim()
      : "") ||
    vendor.ownerName ||
    vendor.contactPerson ||
    "Not Specified";

  const vEmail =
    vendor.user?.email || vendor.email || vendor.contactEmail || "N/A";

  const vPhone =
    vendor.user?.phone ||
    vendor.phone ||
    vendor.contactPhone ||
    vendor.businessAddress?.phone ||
    "N/A";

  const vBusinessType = vendor.businessType || "Individual Merchant";
  const vStatus = getNormalizedStatus(vendor);
  const vWebsite = vendor.website;
  const vDescription = vendor.storeDescription || vendor.description;

  const vPan = vendor.panNumber || vendor.pan || "N/A";
  const vGst = vendor.gstNumber || vendor.gst || "N/A";

  // Bank
  const bank = vendor.bankDetails || {};
  const hasBankInfo = bank.accountNumber || bank.bankName || bank.ifscCode;

  const getStatusBadgeStyle = () => {
    if (vStatus === "Active")
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (vStatus === "Pending")
      return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-rose-50 text-rose-700 border-rose-200";
  };

  return (
    <div className="space-y-6 pb-12">
      {/* TOP NAVIGATION & ACTIONS */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/admin/vendors")}
            className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 shadow-xs transition hover:bg-slate-50 active:scale-95"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-[#287b6d]" />
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#287b6d]">
                Vendor Profile
              </p>
            </div>
            <h1 className="mt-0.5 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
              {vName}
            </h1>
          </div>
        </div>

        {/* TOP ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={fetchVendorData}
            title="Refresh details"
            className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-xs hover:bg-slate-50"
          >
            <RefreshCw size={15} />
          </button>

          {vStatus !== "Active" && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleApprove}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-50"
            >
              <CheckCircle2 size={15} />
              Approve Store
            </button>
          )}

          {vStatus === "Active" && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleSuspend}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-amber-600 disabled:opacity-50"
            >
              <Ban size={15} />
              Suspend Store
            </button>
          )}

          <button
            type="button"
            disabled={actionLoading}
            onClick={handleDelete}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-bold text-rose-700 shadow-xs transition hover:bg-rose-100 disabled:opacity-50"
          >
            <Trash2 size={15} />
            Delete
          </button>
        </div>
      </div>

      {/* STORE HERO BANNER & PROFILE HEADER */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {/* Decorative Top Accent Banner */}
        <div className="h-28 bg-gradient-to-r from-[#287b6d] via-[#1f6357] to-[#123e37] relative">
          <div className="absolute inset-0 bg-black/10" />
        </div>

        <div className="relative px-6 pb-6 pt-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end -mt-12 sm:-mt-14">
            {/* AVATAR WITH LOGO IMAGE */}
            <VendorAvatar vendor={vendor} size="xl" />

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-black text-slate-900 md:text-2xl">
                  {vName}
                </h2>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-[11px] font-extrabold ${getStatusBadgeStyle()}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      vStatus === "Active"
                        ? "bg-emerald-500"
                        : vStatus === "Pending"
                          ? "bg-amber-500"
                          : "bg-rose-500"
                    }`}
                  />
                  {vStatus}
                </span>

                <span className="rounded-lg bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-[#287b6d]">
                  {categoryName}
                </span>
              </div>

              {/* Bio / Description */}
              {vDescription && (
                <p className="mt-2 text-xs text-slate-600 line-clamp-2 max-w-2xl">
                  {vDescription}
                </p>
              )}

              {/* Sub-meta items */}
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <span className="font-mono text-[11px]">
                  ID:{" "}
                  <span className="font-semibold text-slate-600">
                    {vendor._id || vendor.id}
                  </span>
                </span>

                {vWebsite && (
                  <a
                    href={
                      vWebsite.startsWith("http")
                        ? vWebsite
                        : `https://${vWebsite}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[#287b6d] font-semibold hover:underline"
                  >
                    <Globe size={13} />
                    <span>{vWebsite.replace(/^https?:\/\//, "")}</span>
                    <ExternalLink size={11} />
                  </a>
                )}

                <div className="flex items-center gap-1 text-slate-500">
                  <CalendarDays size={13} />
                  <span>
                    Joined{" "}
                    {new Date(
                      vendor.createdAt || Date.now(),
                    ).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Products */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Total Products
              </p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">
                {formatNumber(
                  vendor.productCount || vendor.products?.length || 0,
                )}
              </h3>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#287b6d]/10 text-[#287b6d]">
              <Package size={20} />
            </div>
          </div>
          <p className="mt-3 text-[11px] font-medium text-slate-400">
            Published store catalog
          </p>
        </div>

        {/* Orders */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Total Orders
              </p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">
                {formatNumber(vendor.orderCount || vendor.orders?.length || 0)}
              </h3>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <ShoppingCart size={20} />
            </div>
          </div>
          <p className="mt-3 text-[11px] font-medium text-slate-400">
            Fulfilled through platform
          </p>
        </div>

        {/* Revenue */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Gross Sales
              </p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">
                {formatCurrency(vendor.revenue || vendor.totalEarnings || 0)}
              </h3>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <IndianRupee size={20} />
            </div>
          </div>
          <p className="mt-3 text-[11px] font-medium text-slate-400">
            Total generated revenue
          </p>
        </div>

        {/* Business Type */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Entity Type
              </p>
              <h3 className="mt-2 truncate text-base font-black text-slate-900 max-w-[140px]">
                {vBusinessType}
              </h3>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-600">
              <Briefcase size={20} />
            </div>
          </div>
          <p className="mt-3 text-[11px] font-medium text-slate-400">
            Tax registration class
          </p>
        </div>
      </div>

      {/* DETAILED INFORMATION CARDS */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 1. MERCHANT & CONTACT INFORMATION */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <User size={18} className="text-[#287b6d]" />
              <h2 className="text-base font-bold text-slate-900">
                Merchant & Contact Information
              </h2>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {/* Owner Name */}
            <div className="flex items-start gap-3.5">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                <User size={16} />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400">
                  Store Owner
                </p>
                <p className="text-sm font-bold text-slate-800">{vOwner}</p>
              </div>
            </div>

            {/* Email with direct mailto */}
            <div className="flex items-start gap-3.5">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                <Mail size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-slate-400">
                  Email Address
                </p>
                <div className="flex items-center gap-2">
                  <a
                    href={`mailto:${vEmail}`}
                    className="truncate text-sm font-bold text-[#287b6d] hover:underline"
                  >
                    {vEmail}
                  </a>
                  {vEmail !== "N/A" && (
                    <button
                      type="button"
                      onClick={() => handleCopy(vEmail, "email")}
                      className="text-slate-400 hover:text-slate-600"
                      title="Copy Email"
                    >
                      {copiedKey === "email" ? (
                        <Check size={14} className="text-emerald-600" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Phone with callto */}
            <div className="flex items-start gap-3.5">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                <Phone size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-slate-400">
                  Phone Number
                </p>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${vPhone}`}
                    className="text-sm font-bold text-slate-800 hover:text-[#287b6d]"
                  >
                    {vPhone}
                  </a>
                  {vPhone !== "N/A" && (
                    <button
                      type="button"
                      onClick={() => handleCopy(vPhone, "phone")}
                      className="text-slate-400 hover:text-slate-600"
                      title="Copy Phone"
                    >
                      {copiedKey === "phone" ? (
                        <Check size={14} className="text-emerald-600" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Business Address */}
            <div className="flex items-start gap-3.5 pt-1">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                <MapPin size={16} />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400">
                  Operating Address
                </p>
                <p className="text-xs font-semibold leading-relaxed text-slate-700">
                  {formattedAddress}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. TAX & BUSINESS COMPLIANCE */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#287b6d]" />
              <h2 className="text-base font-bold text-slate-900">
                Tax & Regulatory Compliance
              </h2>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* PAN Card */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  PAN Number
                </p>
                {vPan !== "N/A" && (
                  <button
                    type="button"
                    onClick={() => handleCopy(vPan, "pan")}
                    className="text-slate-400 hover:text-slate-600"
                    title="Copy PAN"
                  >
                    {copiedKey === "pan" ? (
                      <Check size={14} className="text-emerald-600" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                )}
              </div>
              <p className="mt-1.5 font-mono text-sm font-black text-slate-800">
                {vPan}
              </p>
              <p className="mt-1 text-[10px] text-slate-400">
                Income Tax Verification
              </p>
            </div>

            {/* GST Number */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  GST Number
                </p>
                {vGst !== "N/A" && (
                  <button
                    type="button"
                    onClick={() => handleCopy(vGst, "gst")}
                    className="text-slate-400 hover:text-slate-600"
                    title="Copy GSTIN"
                  >
                    {copiedKey === "gst" ? (
                      <Check size={14} className="text-emerald-600" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                )}
              </div>
              <p className="mt-1.5 font-mono text-sm font-black text-slate-800 truncate">
                {vGst}
              </p>
              <p className="mt-1 text-[10px] text-slate-400">
                Goods & Service Tax
              </p>
            </div>
          </div>

          {/* Account System Status Badge */}
          <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Marketplace Status:{" "}
                  <span
                    className={
                      vStatus === "Active"
                        ? "text-emerald-600"
                        : vStatus === "Pending"
                          ? "text-amber-600"
                          : "text-rose-600"
                    }
                  >
                    {vStatus}
                  </span>
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {vStatus === "Active"
                    ? "Merchant is allowed to add inventory and fulfill buyer orders."
                    : vStatus === "Pending"
                      ? "Merchant is under admin review and cannot sell yet."
                      : "Merchant storefront is restricted from receiving customer purchases."}
                </p>
              </div>

              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${getStatusBadgeStyle()}`}
              >
                {vStatus === "Active" ? (
                  <CheckCircle2 size={18} />
                ) : vStatus === "Pending" ? (
                  <Clock3 size={18} />
                ) : (
                  <Ban size={18} />
                )}
              </span>
            </div>
          </div>
        </div>

        {/* 3. SETTLEMENT & BANKING DETAILS */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-[#287b6d]" />
              <h2 className="text-base font-bold text-slate-900">
                Payout & Settlement Bank Details
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              For marketplace vendor disbursements
            </span>
          </div>

          {hasBankInfo ? (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Bank Name
                </p>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  {bank.bankName || "N/A"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Account Holder
                </p>
                <p className="mt-1 text-sm font-bold text-slate-800 truncate">
                  {bank.accountHolderName || vOwner || "N/A"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Account Number
                  </p>
                  {bank.accountNumber && (
                    <button
                      type="button"
                      onClick={() => handleCopy(bank.accountNumber, "acc")}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {copiedKey === "acc" ? (
                        <Check size={13} className="text-emerald-600" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  )}
                </div>
                <p className="mt-1 font-mono text-sm font-bold text-slate-800">
                  {bank.accountNumber || "N/A"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    IFSC Code
                  </p>
                  {bank.ifscCode && (
                    <button
                      type="button"
                      onClick={() => handleCopy(bank.ifscCode, "ifsc")}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {copiedKey === "ifsc" ? (
                        <Check size={13} className="text-emerald-600" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  )}
                </div>
                <p className="mt-1 font-mono text-sm font-bold text-slate-800">
                  {bank.ifscCode || "N/A"}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
              <CreditCard size={24} className="mx-auto text-slate-300" />
              <p className="mt-2 text-xs font-semibold text-slate-600">
                No bank account details provided yet
              </p>
              <p className="text-[11px] text-slate-400">
                The vendor has not submitted payout bank credentials.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminViewVendor;
