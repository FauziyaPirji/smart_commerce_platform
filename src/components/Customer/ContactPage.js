import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
  Store,
  Truck,
  UserRound,
  Loader2,
  AlertCircle,
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000/api/customer";

const ContactPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    orderId: "",
    message: "",
  });

  const [error, setError] = useState({});

  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (error[field]) {
      setError((prev) => ({ ...prev, [field]: "" }));
    }
    if (serverError) setServerError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    let errorData = {};
    let isValid = true;

    // Name validation
    if (!formData.name || formData.name.trim() === "") {
      isValid = false;
      errorData.name = "Full name is required";
    }

    // Email validation
    if (!formData.email || formData.email.trim() === "") {
      isValid = false;
      errorData.email = "Email address is required";
    } else {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(formData.email)) {
        isValid = false;
        errorData.email = "Please enter a valid email address";
      }
    }

    // Phone validation (optional)
    if (formData.phone && formData.phone.trim() !== "") {
      const phonePattern = /^[0-9+\-\s()]{10,15}$/;
      if (!phonePattern.test(formData.phone)) {
        isValid = false;
        errorData.phone = "Please enter a valid phone number";
      }
    }

    // Subject validation
    if (!formData.subject || formData.subject === "") {
      isValid = false;
      errorData.subject = "Please select a topic";
    }

    // Message validation
    if (!formData.message || formData.message.trim() === "") {
      isValid = false;
      errorData.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      isValid = false;
      errorData.message = "Message must be at least 10 characters";
    }

    setError(errorData);

    if (!isValid) return;

    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/contact`, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        subject: formData.subject,
        orderId: formData.orderId.trim(),
        message: formData.message.trim(),
      });

      if (response.data && response.data.success) {
        setSubmitted(true);
        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "",
          orderId: "",
          message: "",
        });
        setError({});
      } else {
        setServerError(response.data.message || "Failed to submit request.");
      }
    } catch (err) {
      console.error("Submit error:", err);
      setServerError(
        err.response?.data?.message ||
          "Something went wrong. Please check your backend connection.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* HERO */}
      <section className="border-b border-border bg-[#f0eadf]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_420px] lg:items-center">
            {/* Hero content */}
            <div>
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground transition hover:text-primary"
              >
                <ArrowLeft size={14} />
                Back to store
              </Link>

              <p className="mono mt-8 text-[10px] uppercase tracking-[0.2em] text-primary">
                Customer care
              </p>

              <h1 className="display mt-3 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                We're here to <span className="text-primary">help.</span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                Questions about an order, a product, a vendor, payments or your
                account? Tell us what happened and our support team will help
                you find the right next step.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href="#contact-form"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"
                >
                  Contact support
                  <ArrowRight size={16} />
                </a>
              </div>
            </div>

            {/* Hero support card */}
            <div className="rounded-[1.75rem] bg-[#203b42] p-6 text-white shadow-xl sm:p-7">
              <div className="flex items-start gap-4">
                <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10">
                  <MessageCircle size={22} className="text-[#f0a84f]" />
                </div>

                <div>
                  <p className="mono text-[10px] uppercase tracking-widest text-white/50">
                    Support desk
                  </p>

                  <h2 className="display mt-1 text-xl font-bold">
                    Need a human?
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-white/60">
                    Send us a message and we'll route it to the right team.
                  </p>
                </div>
              </div>

              <div className="mt-7 space-y-3 border-t border-white/10 pt-5">
                <div className="flex items-center gap-3 text-sm">
                  <Clock3 size={16} className="text-[#f0a84f]" />
                  <span className="text-white/70">
                    Typical response within 24 hours
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <ShieldCheck size={16} className="text-[#f0a84f]" />
                  <span className="text-white/70">
                    Your information stays protected
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT CHANNELS */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <a
            href="mailto:support@smartcommerce.in"
            className="group rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
          >
            <div className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">
              <Mail size={19} />
            </div>
            <p className="mono mt-5 text-[9px] uppercase tracking-widest text-muted-foreground">
              Email
            </p>
            <h3 className="mt-1 text-sm font-bold">support@smartcommerce.in</h3>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Best for order, payment and account questions.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary">
              Send email
              <ArrowRight
                size={13}
                className="transition group-hover:translate-x-1"
              />
            </span>
          </a>

          <a
            href="tel:+9118001234567"
            className="group rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
          >
            <div className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">
              <Phone size={19} />
            </div>
            <p className="mono mt-5 text-[9px] uppercase tracking-widest text-muted-foreground">
              Phone
            </p>
            <h3 className="mt-1 text-sm font-bold">9876501234</h3>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Monday to Saturday · 9 AM to 7 PM
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary">
              Call support
              <ArrowRight
                size={13}
                className="transition group-hover:translate-x-1"
              />
            </span>
          </a>

          <Link
            to="/orders"
            className="group rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
          >
            <div className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">
              <Truck size={19} />
            </div>
            <p className="mono mt-5 text-[9px] uppercase tracking-widest text-muted-foreground">
              Orders
            </p>
            <h3 className="mt-1 text-sm font-bold">Track an order</h3>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Check delivery progress and order information.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary">
              View orders
              <ArrowRight
                size={13}
                className="transition group-hover:translate-x-1"
              />
            </span>
          </Link>
        </div>
      </section>

      {/* MAIN CONTACT SECTION */}
      <section
        id="contact-form"
        className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8"
      >
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* FORM */}
          <div className="rounded-[1.5rem] border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="max-w-xl">
              <p className="mono text-[10px] uppercase tracking-[0.2em] text-primary font-bold">
                Send a message
              </p>
              <h2 className="display mt-2 text-2xl font-extrabold sm:text-3xl">
                How can we help?
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Give us a few details so we can get your request to the right
                person.
              </p>
            </div>

            {submitted ? (
              <div className="mt-8 rounded-2xl border border-teal-200 bg-teal-50 p-6">
                <div className="flex items-start gap-4">
                  <div className="grid size-11 shrink-0 place-items-center rounded-full bg-teal-600 text-white">
                    <Check size={21} />
                  </div>

                  <div>
                    <h3 className="font-bold text-teal-900">
                      Message received.
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-teal-800">
                      Thanks for reaching out! Our support team has logged your
                      query and an email response will be sent to{" "}
                      <strong>{formData.email || "your inbox"}</strong> within
                      24 hours.
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="mt-4 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800 transition"
                    >
                      Send another message
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                {serverError && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
                    <AlertCircle size={18} />
                    {serverError}
                  </div>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  {/* Name */}
                  <div>
                    <label className="text-sm font-semibold">Full name</label>
                    <div className="relative mt-2">
                      <UserRound
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        placeholder="Your name"
                        className={`w-full rounded-xl border ${
                          error.name ? "border-red-400" : "border-border"
                        } bg-background py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10`}
                      />
                      {error.name && (
                        <p className="mt-1.5 text-xs text-red-500">
                          {error.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-sm font-semibold">
                      Email address
                    </label>
                    <div className="relative mt-2">
                      <Mail
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        placeholder="you@example.com"
                        className={`w-full rounded-xl border ${
                          error.email ? "border-red-400" : "border-border"
                        } bg-background py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10`}
                      />
                      {error.email && (
                        <p className="mt-1.5 text-xs text-red-500">
                          {error.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  {/* Phone */}
                  <div>
                    <label className="text-sm font-semibold">
                      Phone number
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        Optional
                      </span>
                    </label>
                    <div className="relative mt-2">
                      <Phone
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        placeholder="+91 98765 43210"
                        className={`w-full rounded-xl border ${
                          error.phone ? "border-red-400" : "border-border"
                        } bg-background py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10`}
                      />
                      {error.phone && (
                        <p className="mt-1.5 text-xs text-red-500">
                          {error.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="text-sm font-semibold">
                      What is this about?
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => updateField("subject", e.target.value)}
                      className={`mt-2 w-full rounded-xl border ${
                        error.subject ? "border-red-400" : "border-border"
                      } bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10`}
                    >
                      <option value="">Select a topic</option>
                      <option value="order">Order & delivery</option>
                      <option value="payment">Payment</option>
                      <option value="product">Product question</option>
                      <option value="account">Account & profile</option>
                      <option value="vendor">Vendor issue</option>
                      <option value="other">Something else</option>
                    </select>
                    {error.subject && (
                      <p className="mt-1.5 text-xs text-red-500">
                        {error.subject}
                      </p>
                    )}
                  </div>
                </div>

                {/* Order ID */}
                <div>
                  <label className="text-sm font-semibold">
                    Order ID
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      Optional
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.orderId}
                    onChange={(e) => updateField("orderId", e.target.value)}
                    placeholder="Example: SC-24187"
                    className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    Adding your order ID helps us resolve order-related requests
                    faster.
                  </p>
                </div>

                {/* Message */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold">Message</label>
                    <span className="text-[10px] text-muted-foreground">
                      {formData.message.length}/500
                    </span>
                  </div>

                  <textarea
                    maxLength={500}
                    rows={6}
                    value={formData.message}
                    onChange={(e) => updateField("message", e.target.value)}
                    placeholder="Tell us what happened..."
                    className={`mt-2 w-full resize-none rounded-xl border ${
                      error.message ? "border-red-400" : "border-border"
                    } bg-background px-4 py-3 text-sm leading-6 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10`}
                  />
                  {error.message && (
                    <p className="mt-1.5 text-xs text-red-500">
                      {error.message}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50 sm:w-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send message
                      <Send
                        size={16}
                        className="transition group-hover:translate-x-0.5"
                      />
                    </>
                  )}
                </button>

                <p className="text-[11px] leading-5 text-muted-foreground">
                  By contacting SmartCommerce, you agree that our support team
                  may use the information provided to assist with your request.
                </p>
              </form>
            )}
          </div>

          {/* RIGHT INFORMATION */}
          <aside className="space-y-5">
            <div className="rounded-[1.5rem] border border-border bg-card p-6">
              <div className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">
                <MapPin size={19} />
              </div>
              <p className="mono mt-5 text-[9px] uppercase tracking-widest text-muted-foreground">
                SmartCommerce HQ
              </p>
              <h3 className="mt-1 font-bold">Ahmedabad, Gujarat</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                SmartCommerce support and operations team serving customers and
                independent vendors across India.
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-secondary p-6">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <ShieldCheck size={18} />
                </div>
                <h3 className="font-bold">Our support promise</h3>
              </div>

              <div className="mt-5 space-y-4">
                <div className="flex gap-3">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                  <p className="text-sm leading-5 text-muted-foreground">
                    Every request is reviewed by the appropriate support team.
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                  <p className="text-sm leading-5 text-muted-foreground">
                    Order-related issues are prioritized when an order ID is
                    provided.
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                  <p className="text-sm leading-5 text-muted-foreground">
                    We aim to respond to support requests within 24 hours.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
};

export default ContactPage;
