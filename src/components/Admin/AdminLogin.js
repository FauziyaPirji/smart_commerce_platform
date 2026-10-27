import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ShieldCheck,
  Store,
  Package,
  ShoppingBag,
  BarChart3,
  UserRound,
  Eye,
  EyeOff,
  RefreshCw,
  ArrowRight,
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000/api/users";

const AdminLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState("");

  const navigate = useNavigate();

  /* VALIDATION */
  const validateForm = () => {
    const newErrors = {};

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      newErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!trimmedPassword) {
      newErrors.password = "Password is required.";
    } else if (trimmedPassword.length < 4) {
      newErrors.password = "Password must be at least 4 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* INPUT HANDLERS */
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setLoginError("");
    setErrors((current) => ({ ...current, email: "" }));
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setLoginError("");
    setErrors((current) => ({ ...current, password: "" }));
  };

  /* SUBMIT */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/simple-login`, {
        email: email.trim(),
        password: password.trim(),
      });

      const data = res.data;

      if (!data.success) {
        throw new Error(data.message || "Invalid admin credentials.");
      }

      // Verify if logged in user has Admin role
      if (data.user?.role !== "admin") {
        throw new Error(
          "Access denied. This account does not have administrator privileges.",
        );
      }

      // Save Admin Info to localStorage
      localStorage.setItem("adminUser", JSON.stringify(data.user));
      localStorage.setItem("smartcommerce-admin", "true");
      localStorage.setItem("adminToken", data.token);

      navigate("/admin/dashboard");
    } catch (err) {
      console.error("Admin Login Error:", err);
      setLoginError(
        err.response?.data?.message ||
          err.message ||
          "Failed to log in to admin portal.",
      );
    } finally {
      setLoading(false);
    }
  };

  /* FEATURES LIST */
  const features = [
    { label: "Vendors", icon: Store },
    { label: "Products", icon: Package },
    { label: "Orders", icon: ShoppingBag },
    { label: "Analytics", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-[#eef3f1]">
      {/* HEADER */}
      <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-5 md:px-10">
        <Link to="/" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#287b6d] text-sm font-black text-white shadow-sm">
            SC
          </div>
          <div>
            <p className="text-lg font-extrabold tracking-tight text-slate-900">
              Smart<span className="text-[#287b6d]">Commerce</span>
            </p>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
              Marketplace Platform
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-2 text-xs font-semibold text-slate-500 sm:flex">
          <ShieldCheck size={15} className="text-[#287b6d]" />
          Secure Admin Portal
        </div>
      </header>

      {/* MAIN */}
      <main className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_25px_70px_rgba(15,23,42,0.10)] lg:grid-cols-2">
          {/* LEFT PANEL */}
          <div className="relative hidden overflow-hidden bg-[#18343b] p-10 text-white lg:block">
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full border border-white/10" />
            <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full border border-white/10" />

            <div className="relative z-10 flex h-full flex-col">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/75">
                <span className="h-2 w-2 rounded-full bg-[#d88a2e]" />
                Platform Administration
              </div>

              <div className="mt-24">
                <h1 className="max-w-md text-4xl font-extrabold leading-tight tracking-tight">
                  Run your marketplace
                  <span className="block text-[#d88a2e]">from one place.</span>
                </h1>

                <p className="mt-5 max-w-md text-sm leading-7 text-white/60">
                  Manage vendors, products, customers, orders and marketplace
                  operations from your SmartCommerce command centre.
                </p>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-3">
                {features.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={feature.label}
                      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/10">
                        <Icon size={16} />
                      </span>
                      <span className="text-xs font-semibold text-white/75">
                        {feature.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-auto pt-10">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/30">
                  SmartCommerce Admin
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="p-7 sm:p-10 lg:p-12">
            <div className="mx-auto max-w-md">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#287b6d]">
                  Admin Console
                </p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
                  Welcome back 👋
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Sign in to manage your SmartCommerce marketplace.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                {/* EMAIL */}
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-800">
                    Email address
                  </label>
                  <div className="relative">
                    <UserRound
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={handleEmailChange}
                      placeholder="admin@example.com"
                      className={`w-full rounded-xl border bg-slate-50 py-3.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                        errors.email
                          ? "border-red-300 focus:border-red-400 focus:ring-red-500/10"
                          : "border-slate-200 focus:border-[#287b6d] focus:ring-[#287b6d]/10"
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-xs font-medium text-red-600">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* PASSWORD */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-sm font-bold text-slate-800">
                      Password
                    </label>
                  </div>

                  <div className="relative">
                    <ShieldCheck
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={handlePasswordChange}
                      placeholder="Enter your password"
                      className={`w-full rounded-xl border bg-slate-50 py-3.5 pl-11 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                        errors.password
                          ? "border-red-300 focus:border-red-400 focus:ring-red-500/10"
                          : "border-slate-200 focus:border-[#287b6d] focus:ring-[#287b6d]/10"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-xs font-medium text-red-600">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* LOGIN ERROR */}
                {loginError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {loginError}
                  </div>
                )}

                {/* LOGIN BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#287b6d] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#287b6d]/20 transition hover:-translate-y-0.5 hover:bg-[#226b60] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in to admin
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </form>

              {/* SECURITY FOOTER */}
              <div className="mt-7 flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#287b6d]/10 text-[#287b6d]">
                  <ShieldCheck size={17} />
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Secure administrator access
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-500">
                    Only authorized administrators should access this console.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLogin;
