import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRouteVendor";
import {
  ArrowLeft,
  Save,
  Lock,
  Loader2,
  Store,
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000/api/vendors";

// MULTI-KEY TOKEN RETRIEVAL
const getToken = () => localStorage.getItem("vendorToken") || null;

// HELPER: PARSE FULL NAME INTO FIRST, MIDDLE, LAST
const parseNameParts = (fullNameStr = "") => {
  const parts = String(fullNameStr).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0)
    return { firstName: "", middleName: "", lastName: "" };
  if (parts.length === 1)
    return { firstName: parts[0], middleName: "", lastName: "" };
  if (parts.length === 2)
    return { firstName: parts[0], middleName: "", lastName: parts[1] };
  return {
    firstName: parts[0],
    middleName: parts.slice(1, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
};

const VendorProfileEdit = () => {
  const navigate = useNavigate();

  // DYNAMIC FORM STATE
  const [formvalue, setFormvalue] = useState({
    vendorName: "",
    ownerFirstName: "",
    ownerMiddleName: "",
    ownerLastName: "",
    email: "",
    phone: "",
    businessName: "",
    businessCategory: "",
    gstNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

  // API STATES
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState({});
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // FETCH VENDOR PROFILE FROM BACKEND
  useEffect(() => {
    const fetchVendorProfile = async () => {
      setLoading(true);
      setApiError("");
      try {
        const res = await axios.get(`${API_BASE_URL}/profile`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + getToken(),
          },
        });

        const data = res.data;
        const vendor = data.profile || data.vendor || data.user || data;

        // User name breakdown
        const userObj = vendor.user || {};
        const rawOwnerName =
          vendor.ownerName ||
          `${userObj.firstName || ""} ${userObj.middleName || ""} ${userObj.lastName || ""}`.trim();

        const nameParts = parseNameParts(rawOwnerName);

        // Address object breakdown
        const addrObj = vendor.businessAddress || {};

        setFormvalue({
          vendorName: vendor.storeName || "",

          ownerFirstName:
            vendor.firstName || userObj.firstName || nameParts.firstName || "",

          ownerMiddleName:
            vendor.middleName ||
            userObj.middleName ||
            nameParts.middleName ||
            "",

          ownerLastName:
            vendor.lastName || userObj.lastName || nameParts.lastName || "",

          email: vendor.email || userObj.email || "",
          phone: vendor.phone || userObj.phone || "",

          businessName: vendor.businessType || vendor.businessName || "",

          businessCategory: vendor.businessCategory || "General Marketplace",

          gstNumber: vendor.gstNumber || vendor.gstin || "Not Provided",

          // ADDRESS
          addressLine1: addrObj.addressLine1 || "",
          addressLine2: addrObj.addressLine2 || "",
          city: addrObj.city || "",
          state: addrObj.state || "",
          pincode: addrObj.pincode || "",
          country: addrObj.country || "India",
        });
      } catch (err) {
        console.error("Fetch vendor profile error:", err);
        handleAuthError(err);

        // Fallback to local user context if available
        try {
          const storedUser = JSON.parse(
            localStorage.getItem("vendorUser") ||
              localStorage.getItem("user") ||
              "{}",
          );
          if (storedUser && (storedUser.email || storedUser.storeName)) {
            const nameParts = parseNameParts(
              storedUser.ownerName || storedUser.name || "",
            );
            setFormvalue((prev) => ({
              ...prev,
              vendorName:
                storedUser.storeName ||
                storedUser.vendorName ||
                prev.vendorName,
              ownerFirstName: storedUser.firstName || nameParts.firstName,
              ownerMiddleName: storedUser.middleName || nameParts.middleName,
              ownerLastName: storedUser.lastName || nameParts.lastName,
              email: storedUser.email || prev.email,
              phone: storedUser.phone || prev.phone,
            }));
          } else {
            setApiError(
              "Unable to load merchant profile. Please check your login session.",
            );
          }
        } catch {
          setApiError("Unable to load merchant profile.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchVendorProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormvalue((prev) => ({ ...prev, [name]: value }));
    setError((prev) => ({ ...prev, [name]: "" }));
    if (apiError) setApiError("");
  };

  // FORM VALIDATION
  const validateForm = () => {
    let errorData = {};
    let isValid = true;

    if (!formvalue.vendorName.trim()) {
      isValid = false;
      errorData.vendorName = "Vendor store name is required";
    }

    if (!formvalue.ownerFirstName.trim()) {
      isValid = false;
      errorData.ownerFirstName = "First name is required";
    }

    if (!formvalue.email.trim()) {
      isValid = false;
      errorData.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(formvalue.email)) {
      isValid = false;
      errorData.email = "Enter a valid email address";
    }

    if (!formvalue.phone.trim()) {
      isValid = false;
      errorData.phone = "Phone number is required";
    }

    setError(errorData);
    return isValid;
  };

  // SUBMIT PROFILE EDIT
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);
    setApiError("");
    setSuccessMessage("");

    const payload = {
      vendorName: formvalue.vendorName.trim(),

      ownerFirstName: formvalue.ownerFirstName.trim(),
      ownerMiddleName: formvalue.ownerMiddleName.trim(),
      ownerLastName: formvalue.ownerLastName.trim(),

      email: formvalue.email.trim().toLowerCase(),
      phone: formvalue.phone.trim(),

      businessName: formvalue.businessName.trim(),
      businessCategory: formvalue.businessCategory.trim(),

      addressLine1: formvalue.addressLine1.trim(),
      addressLine2: formvalue.addressLine2.trim(),
      city: formvalue.city.trim(),
      state: formvalue.state.trim(),
      pincode: formvalue.pincode.trim(),
      country: formvalue.country.trim(),
    };

    try {
      const res = await axios.put(`${API_BASE_URL}/profile`, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + getToken(),
        },
      });

      if (res.data && (res.data.success || res.status === 200)) {
        setSuccessMessage("Vendor profile updated successfully!");
        setTimeout(() => navigate("/vendor/profile"), 1200);
      } else {
        throw new Error(res.data.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error("Update profile error:", err);
      handleAuthError(err);
      setApiError(
        err.response?.data?.message ||
          err.message ||
          "Could not update profile. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-16 text-slate-500 shadow-xs max-w-2xl mx-auto">
        <Loader2 size={36} className="animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-semibold">
          Loading merchant profile details...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/vendor/profile"
          className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Edit Vendor Profile
          </h1>
          <p className="text-xs text-slate-500">
            Update merchant contact details, owner name, and store address
          </p>
        </div>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-semibold">
          {successMessage}
        </div>
      )}

      {/* API Error Alert */}
      {apiError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-semibold">
          {apiError}
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5"
      >
        {/* Protected Verification Lock Notice */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <Lock size={15} className="text-slate-400" /> GSTIN / Tax
            Verification ID:
          </div>
          <span className="font-mono font-bold text-slate-900">
            {formvalue.gstNumber}
          </span>
        </div>

        {/* Store Name */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Store size={14} className="text-blue-600" /> Vendor Store Name{" "}
            <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            name="vendorName"
            value={formvalue.vendorName}
            onChange={handleChange}
            placeholder="e.g. Tech Haven Store"
            className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 ${
              error.vendorName ? "border-rose-400" : "border-slate-200"
            }`}
          />
          {error.vendorName && (
            <span className="text-rose-500 text-[11px] font-semibold">
              {error.vendorName}
            </span>
          )}
        </div>

        {/* OWNER NAME BREAKDOWN (FIRST, MIDDLE, LAST) */}
        <div className="space-y-1 border-t border-slate-100 pt-4">
          <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <User size={14} className="text-blue-600" /> Owner Full Name{" "}
            <span className="text-rose-500">*</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <input
                type="text"
                name="ownerFirstName"
                value={formvalue.ownerFirstName}
                onChange={handleChange}
                placeholder="First Name *"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                  error.ownerFirstName ? "border-rose-400" : "border-slate-200"
                }`}
              />
              {error.ownerFirstName && (
                <span className="text-rose-500 text-[10px] font-semibold">
                  {error.ownerFirstName}
                </span>
              )}
            </div>

            <div>
              <input
                type="text"
                name="ownerMiddleName"
                value={formvalue.ownerMiddleName}
                onChange={handleChange}
                placeholder="Middle Name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <input
                type="text"
                name="ownerLastName"
                value={formvalue.ownerLastName}
                onChange={handleChange}
                placeholder="Last Name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Mail size={14} className="text-blue-600" /> Email Address{" "}
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formvalue.email}
              onChange={handleChange}
              placeholder="e.g. vendor@store.com"
              className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                error.email ? "border-rose-400" : "border-slate-200"
              }`}
            />
            {error.email && (
              <span className="text-rose-500 text-[11px] font-semibold">
                {error.email}
              </span>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Phone size={14} className="text-blue-600" /> Phone Number{" "}
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="phone"
              value={formvalue.phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                error.phone ? "border-rose-400" : "border-slate-200"
              }`}
            />
            {error.phone && (
              <span className="text-rose-500 text-[11px] font-semibold">
                {error.phone}
              </span>
            )}
          </div>
        </div>

        {/* Legal Business Entity Name */}
        <div className="space-y-1 border-t border-slate-100 pt-4">
          <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Building2 size={14} className="text-blue-600" /> Legal Business
            Entity Name
          </label>
          <input
            type="text"
            name="businessName"
            value={formvalue.businessName}
            onChange={handleChange}
            placeholder="e.g. Tech Haven Private Limited"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* REGISTERED BUSINESS ADDRESS BREAKDOWN */}
        <div className="space-y-3 border-t border-slate-100 pt-4">
          <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <MapPin size={14} className="text-blue-600" /> Registered Business
            Address Details
          </label>

          <input
            type="text"
            name="addressLine1"
            value={formvalue.addressLine1}
            onChange={handleChange}
            placeholder="Address Line 1 (Suite / Street / Park)"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
          />

          <input
            type="text"
            name="addressLine2"
            value={formvalue.addressLine2}
            onChange={handleChange}
            placeholder="Address Line 2 (Landmark / Area)"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <input
              type="text"
              name="city"
              value={formvalue.city}
              onChange={handleChange}
              placeholder="City"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <input
              type="text"
              name="state"
              value={formvalue.state}
              onChange={handleChange}
              placeholder="State"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <input
              type="text"
              name="pincode"
              value={formvalue.pincode}
              onChange={handleChange}
              placeholder="Pincode"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Link
            to="/vendor/profile"
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs disabled:opacity-50 transition"
          >
            {submitting ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save size={15} /> Save Profile Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VendorProfileEdit;
