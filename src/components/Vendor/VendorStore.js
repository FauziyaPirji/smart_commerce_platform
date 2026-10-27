import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { handleAuthError } from "../../AuthRouteVendor";
import axios from "axios";
import {
  Store,
  Save,
  ExternalLink,
  MapPin,
  CheckCircle2,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Building2,
  ShieldCheck,
  Power,
  Upload,
  ImagePlus,
  Trash2,
  Camera,
} from "lucide-react";

// Matches backend vendor router mount point
const API_BASE_URL = "http://localhost:5000/api/vendors";

// Dynamic token resolver helper (never stale)
const getToken = () => {
  return (
    localStorage.getItem("vendorToken") || localStorage.getItem("token") || ""
  );
};

// User ID fallback resolver
const getStoredUserId = () => {
  try {
    const rawUser =
      localStorage.getItem("user") ||
      localStorage.getItem("vendor") ||
      localStorage.getItem("vendorUser");
    if (!rawUser) return null;
    const parsed = JSON.parse(rawUser);
    return parsed._id || parsed.id || parsed.userId || null;
  } catch {
    return null;
  }
};

const VendorStore = () => {
  const fileInputRef = useRef(null);

  // Store form state (NO storeBanner)
  const [formvalue, setFormvalue] = useState({
    id: "",
    name: "",
    description: "",
    logo: "", // Cloudinary URL or local preview URL
    website: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    businessStatus: "accepting_orders",
  });

  // Dedicated file state for Cloudinary upload
  const [logoFile, setLogoFile] = useState(null);

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Loading & Feedback states
  const [loading, setLoading] = useState(true);
  const [storeSubmitting, setStoreSubmitting] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  const [storeErrors, setStoreErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  const [storeSuccess, setStoreSuccess] = useState("");
  const [storeError, setStoreError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // 1. FETCH STORE PROFILE ON MOUNT
  const fetchStoreData = async () => {
    setLoading(true);
    setStoreError("");
    const token = getToken();

    try {
      const res = await axios.get(`${API_BASE_URL}/store`, {
        params: {
          userId: getStoredUserId(),
        },
        headers: {
          Authorization: "Bearer " + token,
          userId: getStoredUserId(),
          "x-user-id": getStoredUserId(),
        },
      });

      if (res.data && res.data.success) {
        const s = res.data.store || {};
        setFormvalue({
          id: s._id || s.id || "",
          name: s.storeName || "",
          description: s.storeDescription || "",
          logo: s.storeLogo || "",
          website: s.website || "",
          contactEmail: s.contactEmail || "",
          contactPhone: s.contactPhone || "",
          address: s.address || "",
          city: s.city || "",
          state: s.state || "",
          pincode: s.pincode || "",
          country: s.country || "India",
          businessStatus: s.businessStatus || "accepting_orders",
        });
      }
    } catch (err) {
      if (typeof handleAuthError === "function") {
        try {
          handleAuthError(err);
        } catch (_) {}
      }
      console.error("Fetch store error:", err);
      setStoreError(
        err.response?.data?.message || "Failed to load storefront details.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreData();
  }, []);

  // 2. IMAGE FILE SELECTION (STAGED FOR CLOUDINARY UPLOAD)
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStoreError("Please select a valid image file (PNG, JPG, JPEG, WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setStoreError("Image size must be less than 5MB.");
      return;
    }

    // Save actual file object for Cloudinary upload
    setLogoFile(file);

    // Instant local preview
    setFormvalue((prev) => ({
      ...prev,
      logo: URL.createObjectURL(file),
    }));
    setStoreError("");
  };

  // Remove logo
  const handleRemoveLogo = () => {
    setLogoFile(null);
    setFormvalue((prev) => ({ ...prev, logo: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 3. SUBMIT STORE PROFILE & LOGO VIA MULTIPART FORMDATA
  const handleStoreSubmit = async (e) => {
    e.preventDefault();
    setStoreErrors({});
    setStoreSuccess("");
    setStoreError("");

    const errs = {};
    if (!formvalue.name || formvalue.name.trim() === "") {
      errs.name = "Store name is required";
    }

    if (!formvalue.contactPhone || formvalue.contactPhone.trim() === "") {
      errs.contactPhone = "Contact phone number is required";
    }

    if (Object.keys(errs).length > 0) {
      setStoreErrors(errs);
      return;
    }

    setStoreSubmitting(true);
    const token = getToken();

    try {
      // Build FormData for Multer & Cloudinary
      const formData = new FormData();
      formData.append("userId", getStoredUserId() || "");
      formData.append("storeName", formvalue.name);
      formData.append("storeDescription", formvalue.description);
      formData.append("website", formvalue.website);
      formData.append("contactPhone", formvalue.contactPhone);
      formData.append("address", formvalue.address);
      formData.append("city", formvalue.city);
      formData.append("state", formvalue.state);
      formData.append("pincode", formvalue.pincode);
      formData.append("country", formvalue.country);
      formData.append("businessStatus", formvalue.businessStatus);

      // If a new file was chosen, append it for backend Cloudinary upload
      if (logoFile) {
        formData.append("logo", logoFile);
      } else {
        // Retain existing Cloudinary URL or empty if removed
        formData.append("existingLogo", formvalue.logo || "");
      }

      const res = await axios.put(`${API_BASE_URL}/store`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: "Bearer " + token,
          userId: getStoredUserId(),
          "x-user-id": getStoredUserId(),
        },
      });

      if (res.data && res.data.success) {
        setStoreSuccess("Store settings updated successfully!");
        setLogoFile(null);

        // Update logo state with Cloudinary secure URL returned by server
        if (res.data.store?.storeLogo) {
          setFormvalue((prev) => ({
            ...prev,
            logo: res.data.store.storeLogo,
            id: res.data.store._id || prev.id,
          }));
        }
        setTimeout(() => setStoreSuccess(""), 4000);
      }
    } catch (err) {
      if (typeof handleAuthError === "function") {
        try {
          handleAuthError(err);
        } catch (_) {}
      }
      console.error("Update store error:", err);
      setStoreError(
        err.response?.data?.message || "Failed to update store settings.",
      );
    } finally {
      setStoreSubmitting(false);
    }
  };

  // 4. SUBMIT PASSWORD CHANGE
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordErrors({});
    setPasswordSuccess("");
    setPasswordError("");

    const errs = {};
    if (!passwordForm.currentPassword) {
      errs.currentPassword = "Enter your current password";
    }

    if (!passwordForm.newPassword || passwordForm.newPassword.length < 8) {
      errs.newPassword = "New password must be at least 8 characters long";
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }

    if (
      passwordForm.currentPassword &&
      passwordForm.newPassword &&
      passwordForm.currentPassword === passwordForm.newPassword
    ) {
      errs.newPassword = "New password must be different from current password";
    }

    if (Object.keys(errs).length > 0) {
      setPasswordErrors(errs);
      return;
    }

    setPasswordSubmitting(true);
    const token = getToken();

    try {
      const res = await axios.put(
        `${API_BASE_URL}/change-password`,
        {
          userId: getStoredUserId(),
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
            userId: getStoredUserId(),
            "x-user-id": getStoredUserId(),
          },
        },
      );

      if (res.data && res.data.success) {
        setPasswordSuccess("Password changed successfully!");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setTimeout(() => setPasswordSuccess(""), 4000);
      }
    } catch (err) {
      if (typeof handleAuthError === "function") {
        try {
          handleAuthError(err);
        } catch (_) {}
      }
      console.error("Change password error:", err);
      setPasswordError(
        err.response?.data?.message || "Failed to change password.",
      );
    } finally {
      setPasswordSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 size={36} className="animate-spin text-slate-700" />
        <p className="text-sm font-semibold">Loading store settings...</p>
      </div>
    );
  }

  // Safe navigation target for public store page
  const publicStoreUrl = formvalue.id
    ? `/vendor/${formvalue.id}`
    : `/shop?vendor=${encodeURIComponent(formvalue.name || "store")}`;

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 sm:p-6">
      {/* Hidden File Input for Cloudinary Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleImageFileChange}
        className="hidden"
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Store Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Customize your storefront details, operation status, and account
            security
          </p>
        </div>

        <Link
          to={publicStoreUrl}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <ExternalLink size={14} /> View My Public Store Page
        </Link>
      </div>

      {/* STORE SETTINGS FORM */}
      <form
        onSubmit={handleStoreSubmit}
        className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6"
      >
        {/* Feedback Alerts */}
        {storeSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-semibold flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            {storeSuccess}
          </div>
        )}

        {storeError && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-semibold flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            {storeError}
          </div>
        )}

        {/* Store Profile & Logo Header Box (Click to Upload/Update) */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 flex flex-col sm:flex-row sm:items-center gap-5">
          <div
            onClick={() => fileInputRef.current?.click()}
            title="Click to change logo"
            className="relative group size-20 rounded-2xl overflow-hidden border-2 border-white bg-slate-200 shadow-sm shrink-0 flex items-center justify-center cursor-pointer"
          >
            {formvalue.logo ? (
              <img
                src={formvalue.logo}
                alt="Store Logo"
                className="size-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <Store size={32} className="text-slate-400" />
            )}

            {/* Hover Camera Overlay */}
            <div className="absolute inset-0 bg-black/45 text-white flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px] font-semibold">
              <Camera size={18} />
              <span>Change</span>
            </div>
          </div>

          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900">
              {formvalue.name || "Your Store"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
              {formvalue.description || "No store description set yet."}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  formvalue.businessStatus === "accepting_orders"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${
                    formvalue.businessStatus === "accepting_orders"
                      ? "bg-emerald-500"
                      : "bg-amber-500"
                  }`}
                />
                {formvalue.businessStatus === "accepting_orders"
                  ? "Accepting Orders"
                  : "Vacation Mode"}
              </span>
            </div>
          </div>
        </div>

        {/* Section 1: Store Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Store size={16} className="text-slate-700" /> Store Profile Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Store Name */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Store Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formvalue.name}
                onChange={(e) =>
                  setFormvalue({ ...formvalue, name: e.target.value })
                }
                placeholder="e.g. Apex Electronics"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              {storeErrors.name && (
                <span className="text-rose-500 text-[11px] font-semibold">
                  {storeErrors.name}
                </span>
              )}
            </div>

            {/* Store Logo File Upload / Update (NO URL) */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Store Logo Image (Cloudinary)
              </label>

              {formvalue.logo ? (
                /* Active Logo Preview with Update/Remove buttons */
                <div className="flex items-center justify-between p-2 rounded-xl border border-slate-200 bg-slate-50/70">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={formvalue.logo}
                      alt="Store Logo Preview"
                      className="size-11 rounded-lg object-cover border border-white shadow-xs shrink-0"
                    />
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-800">
                        {logoFile ? logoFile.name : "Active Store Logo"}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {logoFile
                          ? "Ready for Cloudinary"
                          : "Stored on Cloudinary"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-semibold flex items-center gap-1 transition shadow-xs"
                    >
                      <Upload size={12} /> Change
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="p-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 transition shadow-xs"
                      title="Remove Logo"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ) : (
                /* Empty Upload Dropzone */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-slate-400 hover:bg-slate-50/60 rounded-xl p-2.5 text-center cursor-pointer transition flex items-center justify-center gap-3 group"
                >
                  <div className="size-8 rounded-lg bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center text-slate-500 transition shrink-0">
                    <ImagePlus size={16} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-slate-900">
                      Upload Store Logo
                    </p>
                    <p className="text-[10px] text-slate-400">
                      PNG, JPG, or WEBP (Max 5MB)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Store Description
            </label>
            <textarea
              rows="3"
              placeholder="Tell buyers about your products, quality standards, and brand..."
              value={formvalue.description}
              onChange={(e) =>
                setFormvalue({ ...formvalue, description: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Contact Email
              </label>
              <input
                type="email"
                disabled
                value={formvalue.contactEmail}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-500 font-medium cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Contact Phone <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formvalue.contactPhone}
                onChange={(e) =>
                  setFormvalue({ ...formvalue, contactPhone: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              {storeErrors.contactPhone && (
                <span className="text-rose-500 text-[11px] font-semibold">
                  {storeErrors.contactPhone}
                </span>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Website / Portfolio{" "}
                <span className="font-normal text-slate-400">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="https://..."
                value={formvalue.website}
                onChange={(e) =>
                  setFormvalue({ ...formvalue, website: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Store Physical Address */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <MapPin size={16} className="text-slate-700" /> Physical Business
            Address
          </h3>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Street / Unit Address
            </label>
            <input
              type="text"
              placeholder="e.g. 402 Tech Boulevard, Industrial Area"
              value={formvalue.address}
              onChange={(e) =>
                setFormvalue({ ...formvalue, address: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                City
              </label>
              <input
                type="text"
                placeholder="City"
                value={formvalue.city}
                onChange={(e) =>
                  setFormvalue({ ...formvalue, city: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                State
              </label>
              <input
                type="text"
                placeholder="State"
                value={formvalue.state}
                onChange={(e) =>
                  setFormvalue({ ...formvalue, state: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Pincode
              </label>
              <input
                type="text"
                placeholder="6 digits"
                value={formvalue.pincode}
                onChange={(e) =>
                  setFormvalue({ ...formvalue, pincode: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Country
              </label>
              <input
                type="text"
                disabled
                value={formvalue.country}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-500 font-semibold cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Operation Status Mode */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Power size={16} className="text-slate-700" /> Storefront Operating
            Status
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label
              onClick={() =>
                setFormvalue({
                  ...formvalue,
                  businessStatus: "accepting_orders",
                })
              }
              className={`p-4 rounded-xl border cursor-pointer flex items-start gap-3 transition ${
                formvalue.businessStatus === "accepting_orders"
                  ? "border-emerald-500 bg-emerald-50/50 text-emerald-950 shadow-xs"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="businessStatus"
                checked={formvalue.businessStatus === "accepting_orders"}
                onChange={() => {}}
                className="mt-0.5 accent-emerald-600"
              />
              <div>
                <p className="text-xs font-bold">Accepting Orders (Active)</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Your products are publicly visible in search and catalog.
                  Customers can place orders normally.
                </p>
              </div>
            </label>

            <label
              onClick={() =>
                setFormvalue({ ...formvalue, businessStatus: "vacation_mode" })
              }
              className={`p-4 rounded-xl border cursor-pointer flex items-start gap-3 transition ${
                formvalue.businessStatus === "vacation_mode"
                  ? "border-amber-500 bg-amber-50/50 text-amber-950 shadow-xs"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="businessStatus"
                checked={formvalue.businessStatus === "vacation_mode"}
                onChange={() => {}}
                className="mt-0.5 accent-amber-600"
              />
              <div>
                <p className="text-xs font-bold">Vacation Mode (Paused)</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Temporarily pause checkout for your products while away.
                  Existing orders still remain accessible.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Submit Store Changes */}
        <div className="flex items-center justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={storeSubmitting}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition disabled:opacity-50"
          >
            {storeSubmitting ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Saving Store &
                Uploading...
              </>
            ) : (
              <>
                <Save size={15} /> Save Store Changes
              </>
            )}
          </button>
        </div>
      </form>

      {/* DEDICATED PASSWORD CHANGE SECTION */}
      <form
        onSubmit={handlePasswordSubmit}
        className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-5"
      >
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-800">
            <Lock size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Account Security & Password
            </h3>
            <p className="text-[11px] text-slate-500">
              Update your vendor portal login password
            </p>
          </div>
        </div>

        {/* Feedback Alerts */}
        {passwordSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-semibold flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            {passwordSuccess}
          </div>
        )}

        {passwordError && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-semibold flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            {passwordError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Current Password */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Current Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword.current ? "text" : "password"}
                placeholder="••••••••"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    currentPassword: e.target.value,
                  })
                }
                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword({
                    ...showPassword,
                    current: !showPassword.current,
                  })
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword.current ? (
                  <EyeOff size={15} />
                ) : (
                  <Eye size={15} />
                )}
              </button>
            </div>
            {passwordErrors.currentPassword && (
              <span className="text-rose-500 text-[11px] font-semibold">
                {passwordErrors.currentPassword}
              </span>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword.new ? "text" : "password"}
                placeholder="Min. 8 characters"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value,
                  })
                }
                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword({ ...showPassword, new: !showPassword.new })
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword.new ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {passwordErrors.newPassword && (
              <span className="text-rose-500 text-[11px] font-semibold">
                {passwordErrors.newPassword}
              </span>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Confirm New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword.confirm ? "text" : "password"}
                placeholder="Repeat new password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value,
                  })
                }
                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword({
                    ...showPassword,
                    confirm: !showPassword.confirm,
                  })
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword.confirm ? (
                  <EyeOff size={15} />
                ) : (
                  <Eye size={15} />
                )}
              </button>
            </div>
            {passwordErrors.confirmPassword && (
              <span className="text-rose-500 text-[11px] font-semibold">
                {passwordErrors.confirmPassword}
              </span>
            )}
          </div>
        </div>

        {/* Submit Password */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-100">
          <button
            type="submit"
            disabled={passwordSubmitting}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition disabled:opacity-50"
          >
            {passwordSubmitting ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Updating
                Password...
              </>
            ) : (
              <>
                <KeyRound size={15} /> Update Password
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VendorStore;
