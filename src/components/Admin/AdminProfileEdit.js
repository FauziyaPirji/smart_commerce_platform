import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRouteAdmin";
import {
  ArrowLeft,
  Save,
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000/api";

const getStoredAdmin = () => {
  try {
    const saved = localStorage.getItem("adminUser");

    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error("Storage error:", err);
  }
  return null;
};

const AdminProfileEdit = () => {
  const token = localStorage.getItem("adminToken");
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  // DYNAMICALLY LOAD INITIAL ADMIN PROFILE DATA
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setSubmitError("");

      const stored = getStoredAdmin();

      if (stored) {
        setFormData({
          id: stored._id,
          firstName: stored.firstName,
          middleName: stored.middleName || "",
          lastName: stored.lastName,
          email: stored.email || "",
          phone: stored.phone || "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setLoading(false);
        return;
      }

      // Priority 2: Fetch fresh from backend API if storage is empty
      try {
        const res = await axios.get(`${API_BASE_URL}/users/profile`, {
          headers: {
            "Content-Type": "Application/json",
            Authorization: "Bearer " + token,
          },
        });
        const user = res.data?.user || res.data?.data || res.data;

        if (user) {
          setFormData({
            id: user._id,
            firstName: user.firstName,
            middleName: user.middleName || "",
            lastName: user.lastName || "",
            email: user.email || "",
            phone: user.phone || "",
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
        }
      } catch (err) {
        handleAuthError(err);

        console.error("Fetch profile error:", err);
        setSubmitError("Unable to load current profile details.");
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    // Clear error for field
    setErrors((current) => ({
      ...current,
      [name]: "",
    }));

    if (submitError) setSubmitError("");
  };

  const validateForm = () => {
    const newErrors = {};

    const firstName = String(formData.firstName || "").trim();
    const lastName = String(formData.lastName || "").trim();
    const email = String(formData.email || "").trim();
    const phone = String(formData.phone || "").trim();
    const currentPassword = String(formData.currentPassword || "").trim();
    const newPassword = String(formData.newPassword || "").trim();
    const confirmPassword = String(formData.confirmPassword || "").trim();

    // FIRST NAME
    if (!firstName) {
      newErrors.firstName = "First name is required.";
    } else if (firstName.length < 2) {
      newErrors.firstName = "First name must be at least 2 characters.";
    }

    // LAST NAME
    if (!lastName) {
      newErrors.lastName = "Last name is required.";
    } else if (lastName.length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters.";
    }

    // EMAIL
    if (!email) {
      newErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    // PHONE
    if (phone) {
      const cleanPhone = phone.replace(/\s+/g, "");
      if (!/^\+?\d{10,13}$/.test(cleanPhone)) {
        newErrors.phone = "Please enter a valid phone number.";
      }
    }

    // PASSWORD VALIDATION
    const changingPassword = currentPassword || newPassword || confirmPassword;

    if (changingPassword) {
      if (!currentPassword) {
        newErrors.currentPassword =
          "Current password is required to change your password.";
      }

      if (!newPassword) {
        newErrors.newPassword = "Please enter a new password.";
      } else if (newPassword.length < 8) {
        newErrors.newPassword = "New password must be at least 8 characters.";
      }

      if (!confirmPassword) {
        newErrors.confirmPassword = "Please confirm your new password.";
      } else if (newPassword !== confirmPassword) {
        newErrors.confirmPassword =
          "New password and confirm password do not match.";
      }

      if (currentPassword && newPassword && currentPassword === newPassword) {
        newErrors.newPassword =
          "New password must be different from current password.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // SUBMIT PROFILE UPDATES TO BACKEND / STORAGE
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateForm()) return;

    setSubmitting(true);

    const stored = getStoredAdmin();

    if (!stored?._id) {
      setSubmitError("Admin information not found. Please login again.");
      setSubmitting(false);
      return;
    }

    try {
      // 1. UPDATE PROFILE INFORMATION

      const profilePayload = {
        userId: stored._id,
        firstName: formData.firstName.trim(),
        middleName: formData.middleName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
      };

      const profileResponse = await axios.put(
        `${API_BASE_URL}/users/profile`,
        profilePayload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!profileResponse.data?.success) {
        throw new Error(
          profileResponse.data?.message || "Failed to update profile.",
        );
      }

      // 2. CHANGE PASSWORD ONLY IF USER ENTERED IT

      const changingPassword =
        formData.currentPassword.trim() ||
        formData.newPassword.trim() ||
        formData.confirmPassword.trim();

      if (changingPassword) {
        const passwordPayload = {
          userId: stored._id,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        };

        const passwordResponse = await axios.put(
          `${API_BASE_URL}/users/change-password`,
          passwordPayload,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!passwordResponse.data?.success) {
          throw new Error(
            passwordResponse.data?.message || "Failed to change password.",
          );
        }
      }

      // 3. UPDATE LOCAL STORAGE ONLY AFTER SUCCESS

      const updatedUser = profileResponse.data.user;

      localStorage.setItem("adminUser", JSON.stringify(updatedUser));

      // Clear password fields
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      alert(
        changingPassword
          ? "Profile and password updated successfully!"
          : "Profile updated successfully!",
      );

      navigate("/admin/profile");
    } catch (err) {
      handleAuthError(err);

      console.error("Profile update error:", err.response?.data || err);

      const message =
        err.response?.data?.message ||
        err.message ||
        "Unable to update profile. Please try again.";

      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <Loader2 size={36} className="animate-spin text-slate-900" />
        <p className="mt-3 text-xs font-semibold">Loading admin profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <Link
          to="/admin/profile"
          className="p-2 border border-slate-200 rounded-xl hover:bg-slate-100 transition"
        >
          <ArrowLeft size={19} />
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Edit Admin Profile
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Update your account information and password.
          </p>
        </div>
      </div>

      {submitError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
          <AlertCircle size={16} /> {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* PERSONAL INFORMATION */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <User size={19} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Personal Information
              </h2>
              <p className="text-xs text-slate-500">
                Update your basic administrator details.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* FIRST, MIDDLE, LAST NAME GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* FIRST NAME */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName || ""}
                  onChange={handleChange}
                  placeholder="First Name"
                  className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-slate-200 ${
                    errors.firstName
                      ? "border-red-400 bg-red-50"
                      : "border-slate-200"
                  }`}
                />
                {errors.firstName && (
                  <p className="text-xs text-red-600 mt-1.5 font-medium">
                    {errors.firstName}
                  </p>
                )}
              </div>

              {/* MIDDLE NAME */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Middle Name{" "}
                  <span className="text-xs text-slate-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="middleName"
                  value={formData.middleName || ""}
                  onChange={handleChange}
                  placeholder="Middle Name"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* LAST NAME */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName || ""}
                  onChange={handleChange}
                  placeholder="Last Name"
                  className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-slate-200 ${
                    errors.lastName
                      ? "border-red-400 bg-red-50"
                      : "border-slate-200"
                  }`}
                />
                {errors.lastName && (
                  <p className="text-xs text-red-600 mt-1.5 font-medium">
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* EMAIL */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address *
                </label>

                <input
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleChange}
                  placeholder="admin@example.com"
                  className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-slate-200 ${
                    errors.email
                      ? "border-red-400 bg-red-50"
                      : "border-slate-200"
                  }`}
                />

                {errors.email && (
                  <p className="text-xs text-red-600 mt-1.5 font-medium">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* PHONE */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Phone Number
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-slate-200 ${
                    errors.phone
                      ? "border-red-400 bg-red-50"
                      : "border-slate-200"
                  }`}
                />

                {errors.phone && (
                  <p className="text-xs text-red-600 mt-1.5 font-medium">
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PASSWORD */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Lock size={19} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">Change Password</h2>
              <p className="text-xs text-slate-500">
                Leave these fields empty if you do not want to change your
                password.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* CURRENT PASSWORD */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Current Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="currentPassword"
                  value={formData.currentPassword || ""}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 pr-12 border rounded-xl outline-none focus:ring-2 focus:ring-slate-200 ${
                    errors.currentPassword
                      ? "border-red-400 bg-red-50"
                      : "border-slate-200"
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {errors.currentPassword && (
                <p className="text-xs text-red-600 mt-1.5 font-medium">
                  {errors.currentPassword}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* NEW PASSWORD */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  New Password
                </label>

                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword || ""}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-slate-200 ${
                    errors.newPassword
                      ? "border-red-400 bg-red-50"
                      : "border-slate-200"
                  }`}
                />

                {errors.newPassword && (
                  <p className="text-xs text-red-600 mt-1.5 font-medium">
                    {errors.newPassword}
                  </p>
                )}
              </div>

              {/* CONFIRM PASSWORD */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Confirm New Password
                </label>

                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword || ""}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full px-4 py-3 pr-12 border rounded-xl outline-none focus:ring-2 focus:ring-slate-200 ${
                      errors.confirmPassword
                        ? "border-red-400 bg-red-50"
                        : "border-slate-200"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>

                {errors.confirmPassword && (
                  <p className="text-xs text-red-600 mt-1.5 font-medium">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <Link
            to="/admin/profile"
            className="px-5 py-3 border border-slate-200 rounded-xl text-sm font-medium text-center hover:bg-slate-50 transition"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={17} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminProfileEdit;
