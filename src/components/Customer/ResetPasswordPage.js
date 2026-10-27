import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Loader2,
} from "lucide-react";

const API_BASE_URL = "https://smart-commerce-platform-backend.onrender.com/api/users";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Auto-fill email if passed in query param: /reset-password?email=user@example.com
  const emailParam = searchParams.get("email") || "";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: emailParam,
    newPassword: "",
    confirmPassword: "",
  });

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const validate = () => {
    if (!formData.email.trim()) return "Please enter your email address.";
    if (!formData.newPassword) return "Please enter a new password.";
    if (formData.newPassword.length < 8)
      return "Password must contain at least 8 characters.";
    if (formData.newPassword !== formData.confirmPassword)
      return "Passwords do not match.";
    return "";
  };

  // SUBMIT HANDLER
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/reset-password`, {
        email: formData.email.trim(),
        newPassword: formData.newPassword,
      });

      const data = res.data;

      if (!data.success) {
        throw new Error(data.message || "Failed to reset password.");
      }

      setSubmitted(true);

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      console.error("Reset Password Error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Top Bar */}
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
            to="/login"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-white/60 hover:text-foreground"
          >
            <ArrowLeft size={16} />
            Back to sign in
          </Link>
        </div>
      </div>

      {/* Main Form */}
      <section className="mx-auto flex min-h-[calc(100vh-65px)] max-w-md items-center justify-center px-4 py-10">
        <div className="w-full">
          <div className="rounded-[1.75rem] border border-border bg-card p-6 shadow-lg sm:p-8">
            <div>
              <div className="mb-4 inline-flex rounded-full bg-secondary px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                Reset Password
              </div>
              <h2 className="display text-3xl font-extrabold tracking-tight">
                Set new password
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Enter your email and your new password to regain access to your
                account.
              </p>
            </div>

            {submitted ? (
              <div className="mt-8">
                <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5">
                  <div className="flex gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-full bg-teal-600 text-white">
                      <Check size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-teal-900">
                        Password Reset Successful!
                      </p>
                      <p className="mt-1 text-sm leading-6 text-teal-800">
                        Redirecting you to the sign-in page...
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                noValidate
                className="mt-7 space-y-4"
              >
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                  </div>
                )}

                {/* Email Field */}
                <div>
                  <label className="text-sm font-semibold">
                    Email Address *
                  </label>
                  <div className="relative mt-1.5">
                    <Mail
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      placeholder="ananya@email.com"
                      className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                </div>

                {/* New Password Field */}
                <div>
                  <label className="text-sm font-semibold">
                    New Password *
                  </label>
                  <div className="relative mt-1.5">
                    <LockKeyhole
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.newPassword}
                      onChange={(e) =>
                        updateField("newPassword", e.target.value)
                      }
                      placeholder="Enter new password"
                      className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-11 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password Field */}
                <div>
                  <label className="text-sm font-semibold">
                    Confirm New Password *
                  </label>
                  <div className="relative mt-1.5">
                    <LockKeyhole
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        updateField("confirmPassword", e.target.value)
                      }
                      placeholder="Confirm new password"
                      className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-11 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Resetting password...
                    </>
                  ) : (
                    <>
                      Reset Password
                      <ArrowRight
                        size={17}
                        className="transition group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default ResetPasswordPage;
