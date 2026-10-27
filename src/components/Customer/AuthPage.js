import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRoute";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  Store,
  User,
  UserCheck,
  Loader2,
  KeyRound,
  RotateCcw,
  Inbox,
} from "lucide-react";

const API_BASE_URL = "https://smart-commerce-platform-backend.onrender.com/api/users";
const CUSTOMER_API_URL = "https://smart-commerce-platform-backend.onrender.com/api/customer";

const syncGuestDataAfterLogin = async (token) => {
  try {
    const localCart = JSON.parse(localStorage.getItem("cart") || "[]");

    if (Array.isArray(localCart) && localCart.length > 0) {
      const items = localCart
        .map((item) => ({
          productId: item._id || item.id,
          quantity: item.quantity || 1,
        }))
        .filter((item) => item.productId);

      if (items.length > 0) {
        await axios.post(
          `${CUSTOMER_API_URL}/cart/sync`,
          { items },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );
      }

      localStorage.removeItem("cart");
      window.dispatchEvent(new Event("cartUpdated"));
    }

    const localWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");

    if (Array.isArray(localWishlist) && localWishlist.length > 0) {
      const productIds = localWishlist
        .map((item) => (typeof item === "object" ? item._id || item.id : item))
        .filter(Boolean);

      if (productIds.length > 0) {
        await axios.post(
          `${CUSTOMER_API_URL}/wishlist/sync`,
          { productIds },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );
      }

      localStorage.removeItem("wishlist");
      window.dispatchEvent(new Event("wishlistUpdated"));
    }
  } catch (err) {
    handleAuthError(err);
    console.error(
      "Guest cart/wishlist sync failed:",
      err.response?.data || err.message,
    );
  }
};

const AuthPage = ({ mode = "login" }) => {
  const navigate = useNavigate();

  const [step2FA, setStep2FA] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [countdown, setCountdown] = useState(0);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "",
    dob: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });

  const isLogin = mode === "login";
  const isRegister = mode === "register";
  const isForgot = mode === "forgot";

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown((value) => value - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    setError("");
    setSuccessMessage("");
  };

  const validate = () => {
    const email = formData.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (isLogin) {
      if (!email) return "Please enter your email address.";
      if (!emailRegex.test(email)) return "Please enter a valid email address.";
      if (!formData.password) return "Please enter your password.";
    }

    if (isRegister) {
      if (!formData.firstName.trim()) {
        return "Please enter your first name.";
      }

      if (!formData.lastName.trim()) {
        return "Please enter your last name.";
      }

      if (!email) return "Please enter your email address.";
      if (!emailRegex.test(email)) return "Please enter a valid email address.";

      if (!/^\d{10}$/.test(formData.phone)) {
        return "Please enter a valid 10-digit mobile number.";
      }

      if (formData.password.length < 8) {
        return "Password must contain at least 8 characters.";
      }

      if (formData.password !== formData.confirmPassword) {
        return "Passwords do not match.";
      }

      if (!formData.termsAccepted) {
        return "Please accept the Terms of Service and Privacy Policy.";
      }
    }

    if (isForgot) {
      if (!email) return "Please enter your email address.";
      if (!emailRegex.test(email)) return "Please enter a valid email address.";
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      if (isLogin) {
        const res = await axios.post(`${API_BASE_URL}/login`, {
          email: formData.email.trim(),
          password: formData.password,
        });

        const data = res.data;

        if (data.requires2FA) {
          if (!data.tempToken) {
            throw new Error("The server did not return a verification token.");
          }

          setTempToken(data.tempToken);
          setMaskedEmail(data.maskedEmail || formData.email.trim());
          setOtpCode("");
          setStep2FA(true);
          setCountdown(60);
          return;
        }

        if (!data.success || !data.token || !data.user) {
          throw new Error(
            data.message || "The server returned an unexpected login response.",
          );
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        await syncGuestDataAfterLogin(data.token);

        setSubmitted(true);

        const redirectUrl = sessionStorage.getItem("redirectAfterLogin") || "/";

        sessionStorage.removeItem("redirectAfterLogin");

        setTimeout(() => navigate(redirectUrl), 1000);
      }

      if (isRegister) {
        const res = await axios.post(`${API_BASE_URL}/register`, {
          firstName: formData.firstName.trim(),
          middleName: formData.middleName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: formData.phone,
          gender: formData.gender || undefined,
          dob: formData.dob || undefined,
          password: formData.password,
          role: "customer",
        });

        if (!res.data?.success) {
          throw new Error(
            res.data?.message || "Failed to create your account.",
          );
        }

        setSubmitted(true);
        setTimeout(() => navigate("/login"), 1200);
      }

      if (isForgot) {
        const res = await axios.post(`${API_BASE_URL}/forgot-password`, {
          email: formData.email.trim(),
        });

        if (res.data?.success === false) {
          throw new Error(
            res.data.message || "Failed to send recovery instructions.",
          );
        }

        setSubmitted(true);
      }
    } catch (err) {
      console.error("Authentication error:", err.response?.data || err.message);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FACode = async (e) => {
    e.preventDefault();

    const cleanOtp = otpCode.trim();

    if (!/^\d{6}$/.test(cleanOtp)) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    if (!tempToken) {
      setError("Your verification session has expired. Please sign in again.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/login-2fa`, {
        tempToken,
        otp: cleanOtp,
      });

      const data = res.data;

      if (!data.success || !data.token || !data.user) {
        throw new Error(
          data.message || "Verification failed. Please try again.",
        );
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      await syncGuestDataAfterLogin(data.token);

      setSubmitted(true);
      setStep2FA(false);

      const redirectUrl = sessionStorage.getItem("redirectAfterLogin") || "/";

      sessionStorage.removeItem("redirectAfterLogin");

      setTimeout(() => navigate(redirectUrl), 1000);
    } catch (err) {
      console.error(
        "2FA verification error:",
        err.response?.data || err.message,
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Invalid or expired code. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend2FA = async () => {
    if (countdown > 0 || loading || !tempToken) return;

    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/resend-2fa`, {
        tempToken,
      });

      if (!res.data?.success) {
        throw new Error(
          res.data?.message || "Unable to resend the verification code.",
        );
      }

      setCountdown(60);
      setOtpCode("");
      setSuccessMessage("A new verification code has been requested.");
    } catch (err) {
      console.error(
        "Resend verification error:",
        err.response?.data || err.message,
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to resend the code.",
      );
    } finally {
      setLoading(false);
    }
  };

  const goBackToLogin = () => {
    setStep2FA(false);
    setTempToken("");
    setMaskedEmail("");
    setOtpCode("");
    setCountdown(0);
    setError("");
    setSuccessMessage("");
  };

  const title = step2FA
    ? "Verify Your Email"
    : isLogin
      ? "Welcome back."
      : isRegister
        ? "Make room for better finds."
        : "Reset password";

  const subtitle = step2FA
    ? `Enter the 6-digit code sent to ${maskedEmail}.`
    : isLogin
      ? "Sign in with your email and password."
      : isRegister
        ? "Create your SmartCommerce customer account."
        : "Enter your email to receive recovery instructions.";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-[#f0eadf] px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-[#287b6d] text-sm font-black text-white">
              SC
            </span>
            <span className="text-lg font-black tracking-tight">
              Smart<span className="text-[#287b6d]">Commerce</span>
            </span>
          </Link>

          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white/60"
          >
            <ArrowLeft size={16} />
            Back to store
          </Link>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-65px)] max-w-7xl lg:grid-cols-2">
        <div className="hidden flex-col justify-center px-8 py-16 lg:flex lg:px-16">
          <div className="max-w-lg">
            <div className="mb-8 flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-2xl bg-[#287b6d] text-lg font-black text-white">
                SC
              </div>
              <div>
                <p className="text-xl font-black">
                  Smart<span className="text-[#287b6d]">Commerce</span>
                </p>
                <p className="text-xs text-slate-500">
                  A calmer way to choose well.
                </p>
              </div>
            </div>

            <h1 className="text-5xl font-black leading-tight tracking-tight xl:text-6xl">
              A calmer way
              <br />
              to <span className="text-[#287b6d]">choose well.</span>
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-slate-600">
              Discover trusted vendors, thoughtful products, and better
              comparisons in one place.
            </p>

            <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-teal-50 text-[#287b6d]">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <p className="font-bold">Email two-step verification</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Verify your identity using a one-time code sent to your
                    registered email address.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-2xl bg-[#203b42] p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-white/10">
                  <Store size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold">
                    Selling something special?
                  </p>
                  <p className="text-xs text-white/60">
                    Join SmartCommerce as a vendor.
                  </p>
                </div>
              </div>

              <Link
                to="/vendor/login"
                className="flex items-center gap-1 text-sm font-bold text-amber-300 hover:underline"
              >
                Become a vendor
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center px-4 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-6 flex justify-center lg:hidden">
              <Link to="/" className="text-xl font-black">
                Smart<span className="text-[#287b6d]">Commerce</span>
              </Link>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
              <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#287b6d]">
                <ShieldCheck size={13} />
                {step2FA
                  ? "Email Security Check"
                  : isLogin
                    ? "Account Sign In"
                    : isRegister
                      ? "Create Account"
                      : "Password Recovery"}
              </div>

              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                {title}
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {subtitle}
              </p>

              {submitted ? (
                <div className="mt-6">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                    <div className="flex gap-3">
                      <div className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-600 text-white">
                        <Check size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-emerald-950">
                          {isLogin
                            ? "Verified and signed in!"
                            : isRegister
                              ? "Account created successfully."
                              : "Recovery request processed."}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-emerald-800">
                          {isLogin
                            ? "Taking you back to SmartCommerce..."
                            : isRegister
                              ? "Your account is ready. You can now sign in."
                              : "If the account exists, follow the recovery instructions sent to your email."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {!isLogin && (
                    <Link
                      to="/login"
                      className="mt-5 flex w-full justify-center rounded-xl bg-[#287b6d] px-4 py-3 text-sm font-bold text-white hover:bg-[#226b60]"
                    >
                      Continue to sign in
                    </Link>
                  )}
                </div>
              ) : step2FA ? (
                <form
                  onSubmit={handleVerify2FACode}
                  noValidate
                  className="mt-6 space-y-4"
                >
                  {error && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                      {error}
                    </div>
                  )}

                  {successMessage && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                      {successMessage}
                    </div>
                  )}

                  <div className="flex items-start gap-3 rounded-xl border border-teal-100 bg-teal-50 p-4 text-sm text-teal-900">
                    <Inbox
                      size={19}
                      className="mt-0.5 shrink-0 text-[#287b6d]"
                    />
                    <div>
                      <p className="font-bold">
                        Check your inbox or spam folder
                      </p>
                      <p className="mt-1 text-xs leading-5 text-teal-700">
                        Verification code sent to {maskedEmail}. It should be
                        valid for 10 minutes if configured that way on your
                        server.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      6-Digit Security Code *
                    </label>
                    <div className="relative mt-2">
                      <KeyRound
                        size={18}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        autoFocus
                        required
                        value={otpCode}
                        onChange={(e) => {
                          setOtpCode(e.target.value.replace(/\D/g, ""));
                          setError("");
                        }}
                        placeholder="000000"
                        className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-center text-xl font-black tracking-[0.5em] outline-none focus:border-[#287b6d] focus:ring-2 focus:ring-[#287b6d]/15"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 text-xs">
                    <button
                      type="button"
                      onClick={goBackToLogin}
                      className="text-slate-500 hover:underline"
                    >
                      ← Back to sign in
                    </button>

                    {countdown > 0 ? (
                      <span className="text-slate-500">
                        Resend in{" "}
                        <strong className="text-slate-800">{countdown}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResend2FA}
                        disabled={loading}
                        className="inline-flex items-center gap-1 font-bold text-[#287b6d] hover:underline disabled:opacity-50"
                      >
                        <RotateCcw size={13} />
                        Resend code
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otpCode.length !== 6}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#287b6d] px-4 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#226b60] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Verifying code...
                      </>
                    ) : (
                      <>
                        Verify and sign in
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  noValidate
                  className="mt-6 space-y-4"
                >
                  {error && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                      {error}
                    </div>
                  )}

                  {successMessage && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      {successMessage}
                    </div>
                  )}

                  {isRegister && (
                    <>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="text-xs font-bold text-slate-700">
                            First Name *
                          </label>
                          <div className="relative mt-1">
                            <User
                              size={16}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                              type="text"
                              required
                              value={formData.firstName}
                              onChange={(e) =>
                                updateField("firstName", e.target.value)
                              }
                              placeholder="First name"
                              className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#287b6d]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700">
                            Middle Name
                          </label>
                          <div className="relative mt-1">
                            <User
                              size={16}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                              type="text"
                              value={formData.middleName}
                              onChange={(e) =>
                                updateField("middleName", e.target.value)
                              }
                              placeholder="Optional"
                              className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#287b6d]"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700">
                          Last Name *
                        </label>
                        <div className="relative mt-1">
                          <UserCheck
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                          <input
                            type="text"
                            required
                            value={formData.lastName}
                            onChange={(e) =>
                              updateField("lastName", e.target.value)
                            }
                            placeholder="Last name"
                            className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#287b6d]"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="text-xs font-bold text-slate-700">
                      Email Address *
                    </label>
                    <div className="relative mt-1">
                      <Mail
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        value={formData.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        placeholder="name@email.com"
                        className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#287b6d]"
                      />
                    </div>
                  </div>

                  {isRegister && (
                    <>
                      <div>
                        <label className="text-xs font-bold text-slate-700">
                          Mobile Number *
                        </label>
                        <div className="relative mt-1">
                          <Phone
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                          <input
                            type="tel"
                            inputMode="numeric"
                            maxLength={10}
                            required
                            value={formData.phone}
                            onChange={(e) =>
                              updateField(
                                "phone",
                                e.target.value.replace(/\D/g, "").slice(0, 10),
                              )
                            }
                            placeholder="10-digit mobile number"
                            className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#287b6d]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="text-xs font-bold text-slate-700">
                            Gender
                          </label>
                          <select
                            value={formData.gender}
                            onChange={(e) =>
                              updateField("gender", e.target.value)
                            }
                            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#287b6d]"
                          >
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                            <option value="prefer_not_to_say">
                              Prefer not to say
                            </option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700">
                            Date of Birth
                          </label>
                          <input
                            type="date"
                            value={formData.dob}
                            onChange={(e) => updateField("dob", e.target.value)}
                            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#287b6d]"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {!isForgot && (
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700">
                          Password *
                        </label>
                        {isLogin && (
                          <Link
                            to="/forgot-password"
                            className="text-xs font-bold text-[#287b6d] hover:underline"
                          >
                            Forgot password?
                          </Link>
                        )}
                      </div>

                      <div className="relative mt-1">
                        <LockKeyhole
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          autoComplete={
                            isLogin ? "current-password" : "new-password"
                          }
                          value={formData.password}
                          onChange={(e) =>
                            updateField("password", e.target.value)
                          }
                          placeholder="Enter your password"
                          className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-10 text-sm outline-none focus:border-[#287b6d]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                        >
                          {showPassword ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>

                      {isRegister && (
                        <p className="mt-1 text-xs text-slate-500">
                          Use at least 8 characters.
                        </p>
                      )}
                    </div>
                  )}

                  {isRegister && (
                    <>
                      <div>
                        <label className="text-xs font-bold text-slate-700">
                          Confirm Password *
                        </label>
                        <div className="relative mt-1">
                          <LockKeyhole
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            autoComplete="new-password"
                            value={formData.confirmPassword}
                            onChange={(e) =>
                              updateField("confirmPassword", e.target.value)
                            }
                            placeholder="Confirm password"
                            className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-10 text-sm outline-none focus:border-[#287b6d]"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword((value) => !value)
                            }
                            aria-label={
                              showConfirmPassword
                                ? "Hide password"
                                : "Show password"
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                          >
                            {showConfirmPassword ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                          </button>
                        </div>
                      </div>

                      <label className="flex cursor-pointer items-start gap-2 text-xs text-slate-600">
                        <input
                          type="checkbox"
                          checked={formData.termsAccepted}
                          onChange={(e) =>
                            updateField("termsAccepted", e.target.checked)
                          }
                          className="mt-0.5 size-4 accent-[#287b6d]"
                        />
                        <span>
                          I agree to the{" "}
                          <Link
                            to="/terms"
                            className="font-bold text-[#287b6d]"
                          >
                            Terms of Service
                          </Link>{" "}
                          and{" "}
                          <Link
                            to="/privacy"
                            className="font-bold text-[#287b6d]"
                          >
                            Privacy Policy
                          </Link>
                          .
                        </span>
                      </label>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#287b6d] px-4 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#226b60] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {isLogin
                          ? "Continue to Email Verification"
                          : isRegister
                            ? "Create Account"
                            : "Send Recovery Link"}
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              )}

              {!submitted && !step2FA && (
                <div className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
                  {isLogin ? (
                    <>
                      New to SmartCommerce?{" "}
                      <Link
                        to="/register"
                        className="font-bold text-[#287b6d] hover:underline"
                      >
                        Create an account
                      </Link>
                    </>
                  ) : isRegister ? (
                    <>
                      Already have an account?{" "}
                      <Link
                        to="/login"
                        className="font-bold text-[#287b6d] hover:underline"
                      >
                        Sign in
                      </Link>
                    </>
                  ) : (
                    <>
                      Remember your password?{" "}
                      <Link
                        to="/login"
                        className="font-bold text-[#287b6d] hover:underline"
                      >
                        Back to sign in
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            <p className="mt-6 text-center text-[11px] text-slate-500">
              Built for Bharat · SmartCommerce
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AuthPage;
