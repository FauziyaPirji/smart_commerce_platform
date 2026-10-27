import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Store,
  Check,
  Loader2,
} from "lucide-react";

const API_BASE_URL = "https://smart-commerce-platform-backend.onrender.com/api/vendors";

const VendorLogin = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  // LOGIN SUBMIT HANDLER
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email.trim()) {
      setError("Please enter your business email.");
      return;
    }

    if (!formData.password) {
      setError("Please enter your password.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/login`, {
        email: formData.email.trim(),
        password: formData.password,
      });

      const data = res.data;

      if (!data.success) {
        throw new Error(data.message || "Invalid email or password.");
      }

      // Save vendor user & profile to LocalStorage
      if (data.user)
        localStorage.setItem("vendorUser", JSON.stringify(data.user));
      if (data.vendorProfile)
        localStorage.setItem(
          "vendorProfile",
          JSON.stringify(data.vendorProfile),
        );
      localStorage.setItem("vendorToken", data.token);

      setSubmitted(true);

      // Redirect to vendor workspace after short delay
      setTimeout(() => {
        navigate("/vendor");
      }, 900);
    } catch (err) {
      console.error("Vendor Login Error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Login failed. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* TOP BAR */}
      <div className="border-b border-border bg-[#f0eadf] px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-sm font-black text-primary-foreground">
              SC
            </span>
            <span className="display text-lg font-extrabold tracking-tight">
              Smart<span className="text-primary">Commerce</span>
            </span>
          </Link>

          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-white/60 hover:text-foreground"
          >
            <ArrowLeft size={16} />
            Back to store
          </Link>
        </div>
      </div>

      {/* MAIN */}
      <section className="mx-auto grid min-h-[calc(100vh-65px)] max-w-7xl lg:grid-cols-2">
        {/* LEFT SIDE */}
        <div className="hidden flex-col justify-center px-8 py-16 lg:flex lg:px-16">
          <div className="max-w-lg">
            {/* BRAND */}
            <div className="mb-8 flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-2xl bg-[#203b42] text-lg font-black text-white">
                <Store size={23} />
              </div>
              <div>
                <p className="display text-xl font-extrabold">
                  Smart<span className="text-primary">Commerce</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Vendor workspace
                </p>
              </div>
            </div>

            {/* HEADING */}
            <h1 className="display text-5xl font-extrabold leading-[1.05] tracking-tight xl:text-6xl">
              Your store,
              <br />
              in motion.
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-muted-foreground">
              Manage your products, orders, customers and earnings from one
              simple vendor workspace.
            </p>

            {/* FEATURES */}
            <div className="mt-10 space-y-4">
              <div className="flex items-start gap-4">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                  <Check size={18} />
                </div>
                <div>
                  <p className="font-bold">Manage your catalogue</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add products, update prices and keep your inventory
                    accurate.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                  <Check size={18} />
                </div>
                <div>
                  <p className="font-bold">Track every order</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Follow orders from payment to delivery.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                  <Check size={18} />
                </div>
                <div>
                  <p className="font-bold">Understand your business</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    View sales, customers, analytics and vendor earnings.
                  </p>
                </div>
              </div>
            </div>

            {/* TRUST CARD */}
            <div className="mt-10 rounded-3xl bg-[#203b42] p-6 text-white">
              <div className="flex items-start gap-4">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/10">
                  <ShieldCheck size={21} />
                </div>
                <div>
                  <p className="font-bold">Built for independent businesses.</p>
                  <p className="mt-1 text-sm leading-6 text-white/55">
                    SmartCommerce gives vendors the tools they need to grow
                    while keeping the shopping experience simple.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center justify-center px-4 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            {/* MOBILE BRAND */}
            <div className="mb-8 flex justify-center lg:hidden">
              <Link to="/" className="flex items-center gap-2">
                <span className="grid size-10 place-items-center rounded-xl bg-[#203b42] text-white">
                  <Store size={19} />
                </span>
                <span className="display text-xl font-extrabold">
                  Smart<span className="text-primary">Commerce</span>
                </span>
              </Link>
            </div>

            {/* LOGIN CARD */}
            <div className="rounded-[1.75rem] border border-border bg-card p-6 shadow-[0_20px_60px_rgba(37,50,64,.08)] sm:p-8">
              {/* HEADING */}
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                  <Store size={12} />
                  Vendor login
                </div>
                <h2 className="display text-3xl font-extrabold tracking-tight">
                  Welcome back.
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Sign in to manage your SmartCommerce store.
                </p>
              </div>

              {/* SUCCESS */}
              {submitted ? (
                <div className="mt-8">
                  <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5">
                    <div className="flex gap-3">
                      <div className="grid size-10 shrink-0 place-items-center rounded-full bg-teal-600 text-white">
                        <Check size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-teal-900">
                          You're signed in.
                        </p>
                        <p className="mt-1 text-sm leading-6 text-teal-800">
                          Opening your vendor workspace...
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                  {/* ERROR */}
                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                      {error}
                    </div>
                  )}

                  {/* EMAIL */}
                  <div>
                    <label
                      htmlFor="vendor-email"
                      className="text-sm font-semibold"
                    >
                      Business email
                    </label>
                    <div className="relative mt-2">
                      <Mail
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                      <input
                        id="vendor-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="store@example.com"
                        className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </div>
                  </div>

                  {/* PASSWORD */}
                  <div>
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="vendor-password"
                        className="text-sm font-semibold"
                      >
                        Password
                      </label>
                      <Link
                        to="/forgot-password"
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative mt-2">
                      <LockKeyhole
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                      <input
                        id="vendor-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-11 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* LOGIN BUTTON */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign in to vendor workspace
                        <ArrowRight
                          size={17}
                          className="transition group-hover:translate-x-1"
                        />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* REGISTER */}
              {!submitted && (
                <div className="mt-6 border-t border-border pt-5 text-center">
                  <p className="text-sm text-muted-foreground">
                    Don't have a vendor account?
                  </p>
                  <Link
                    to="/vendor/register"
                    className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
                  >
                    Register your store
                    <ArrowRight size={15} />
                  </Link>
                </div>
              )}
            </div>

            {/* CUSTOMER LOGIN */}
            <div className="mt-5 rounded-2xl border border-border bg-secondary/60 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold">Shopping instead?</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Go back to your customer account.
                  </p>
                </div>
                <Link
                  to="/login"
                  className="shrink-0 rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold hover:border-primary hover:text-primary"
                >
                  Customer login
                </Link>
              </div>
            </div>

            <p className="mt-6 text-center text-[11px] text-muted-foreground">
              SmartCommerce Vendor Portal · Built for Bharat
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default VendorLogin;
