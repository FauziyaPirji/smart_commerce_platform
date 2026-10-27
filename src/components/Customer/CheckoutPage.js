import React, { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRoute";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  MapPin,
  Package,
  Plus,
  ShieldCheck,
  Globe,
  Banknote,
  LockKeyhole,
  AlertCircle,
  Loader2,
  Zap,
  Smartphone,
} from "lucide-react";

const API_BASE_URL = "https://smart-commerce-platform-backend.onrender.com/api/customer";

const getToken = () => localStorage.getItem("token") || null;
const isLoggedIn = () => Boolean(getToken());

const money = (value) =>
  `₹${new Intl.NumberFormat("en-IN").format(Number(value) || 0)}`;

const getInitials = (name) => {
  if (!name) return "SC";
  const words = String(name).trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return String(name).slice(0, 2).toUpperCase();
};

const getProductImage = (product) => {
  if (!product) return null;
  if (Array.isArray(product.images) && product.images.length > 0)
    return product.images[0];
  return product.image || null;
};

const resolveVendorName = (vendor) => {
  if (!vendor) return "Verified Vendor";
  if (typeof vendor === "string") return vendor;
  return (
    vendor.storeName ||
    `${vendor.firstName || ""} ${vendor.lastName || ""}`.trim() ||
    vendor.name ||
    "Verified Vendor"
  );
};

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const normalizeCartItem = (ci) => {
  const isApiFormat = ci.product && typeof ci.product === "object";
  const p = isApiFormat ? ci.product : ci;
  const qty = Number(ci.quantity || p.quantity || 1);
  return {
    id: p._id || p.id,
    product: p._id || p.id,
    title: p.title || p.name || "Product",
    name: p.title || p.name || "Product",
    price: Number(p.discountPrice || p.price || 0),
    unitPrice: Number(p.discountPrice || p.price || 0),
    quantity: qty,
    vendor: resolveVendorName(p.vendor),
    mark: getInitials(p.title || p.name),
    images: Array.isArray(p.images) ? p.images : [],
    image: p.image || "",
    isVacationMode: ci.isVacationMode || p.isVacationMode || false,
  };
};

// Payment method definitions — only 2 options
const PAYMENT_METHODS = [
  {
    id: "online",
    title: "Online Payment",
    subtitle: "Powered by Razorpay",
    desc: "UPI · Cards · Net Banking · Wallets",
    icon: Smartphone,
    badge: "Instant",
    badgeColor: "text-teal-600 bg-teal-50 border-teal-200",
    accent: "from-teal-500 to-cyan-500",
  },
  {
    id: "cod",
    title: "Cash on Delivery",
    subtitle: "Pay when it arrives",
    desc: "No online payment required",
    icon: Banknote,
    badge: "No fees",
    badgeColor: "text-amber-700 bg-amber-50 border-amber-200",
    accent: "from-amber-500 to-orange-500",
  },
];

const CheckoutPage = () => {
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [apiError, setApiError] = useState("");

  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [payment, setPayment] = useState("online");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  const [addressForm, setAddressForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isLoggedIn()) {
      sessionStorage.setItem("redirectAfterLogin", "/checkout");
      navigate("/login");
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        // Load cart — API first, localStorage fallback
        let items = [];
        try {
          const cartRes = await axios.get(`${API_BASE_URL}/cart`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getToken()}`,
            },
          });
          const rawCart = cartRes.data?.cart || [];
          if (cartRes.data?.success && rawCart.length > 0) {
            items = rawCart
              .map(normalizeCartItem)
              .filter((item) => !item.isVacationMode && item.id);
          }
        } catch (cartErr) {
          handleAuthError(cartErr);
        }

        if (items.length === 0) {
          const localCart = JSON.parse(localStorage.getItem("cart") || "[]");
          items = localCart
            .map(normalizeCartItem)
            .filter((item) => !item.isVacationMode && item.id);
        }

        setCartItems(items);

        // Build saved addresses from localStorage user profile
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        let addresses = [];

        if (
          Array.isArray(storedUser.addresses) &&
          storedUser.addresses.length > 0
        ) {
          addresses = storedUser.addresses.map((addr) => ({
            name:
              addr.fullName ||
              addr.name ||
              `${addr.firstName || ""} ${addr.lastName || ""}`.trim() ||
              storedUser.name ||
              `${storedUser.firstName || ""} ${storedUser.lastName || ""}`.trim() ||
              "",
            phone: addr.phone || storedUser.phone || "",
            address: addr.address || addr.addressLine1 || "",
            city: addr.city || "",
            state: addr.state || "",
            pincode: addr.pincode || addr.zipCode || "",
            country: addr.country || "India",
            label: addr.label || "Address",
          }));
        } else {
          const userAddr = storedUser.address || storedUser.addressLine1 || "";
          if (userAddr && storedUser.city) {
            addresses = [
              {
                name:
                  storedUser.fullName ||
                  storedUser.name ||
                  `${storedUser.firstName || ""} ${storedUser.lastName || ""}`.trim() ||
                  "",
                phone: storedUser.phone || "",
                address: userAddr,
                city: storedUser.city || "",
                state: storedUser.state || "",
                pincode: storedUser.pincode || "",
                country: storedUser.country || "India",
                label: "Home",
              },
            ];
          }
        }

        setSavedAddresses(addresses);
        if (addresses.length > 0) {
          setSelectedAddressIndex(0);
          setAddressForm(addresses[0]);
          setShowNewAddressForm(false);
        } else {
          setSelectedAddressIndex(-1);
          setShowNewAddressForm(true);
        }
      } catch (err) {
        handleAuthError(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (acc, item) =>
          acc +
          Number(item.price || item.unitPrice || 0) *
            (Number(item.quantity) || 1),
        0,
      ),
    [cartItems],
  );

  const itemCount = useMemo(
    () =>
      cartItems.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0),
    [cartItems],
  );

  const activeCountry = (addressForm.country || "India").trim();

  const deliveryCharge = useMemo(() => {
    if (subtotal === 0) return 0;
    return activeCountry.toLowerCase() === "india"
      ? subtotal >= 999
        ? 0
        : 100
      : 1500;
  }, [subtotal, activeCountry]);

  const total = subtotal + deliveryCharge;

  const vendors = useMemo(
    () => [...new Set(cartItems.map((item) => item.vendor).filter(Boolean))],
    [cartItems],
  );

  const clearFieldError = (field) =>
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    let val = value;
    if (name === "phone") val = value.replace(/\D/g, "").slice(0, 15);
    if (name === "pincode" && activeCountry.toLowerCase() === "india")
      val = value.replace(/\D/g, "").slice(0, 6);
    setAddressForm((prev) => ({ ...prev, [name]: val }));
    clearFieldError(name);
  };

  const handleSelectSavedAddress = (index) => {
    setSelectedAddressIndex(index);
    setAddressForm(savedAddresses[index]);
    setShowNewAddressForm(false);
    setErrors({});
  };

  const handleToggleNewAddress = () => {
    setShowNewAddressForm((prev) => {
      const next = !prev;
      if (next) {
        setSelectedAddressIndex(-1);
        setAddressForm({
          name: "",
          phone: "",
          address: "",
          city: "",
          state: "",
          pincode: "",
          country: "India",
        });
      } else if (savedAddresses.length > 0) {
        setSelectedAddressIndex(0);
        setAddressForm(savedAddresses[0]);
      }
      return next;
    });
    setErrors({});
  };

  const validateAddress = () => {
    const errs = {};
    const { name, phone, address, city, state, pincode, country } = addressForm;
    if (!name.trim()) errs.name = "Full name is required.";
    else if (name.trim().length < 3)
      errs.name = "Name must be at least 3 characters.";
    if (!phone.trim()) errs.phone = "Phone number is required.";
    else if (!/^\d{7,15}$/.test(phone.trim()))
      errs.phone = "Enter a valid phone number (7–15 digits).";
    if (!address.trim()) errs.address = "Address is required.";
    else if (address.trim().length < 6)
      errs.address = "Please enter a complete address.";
    if (!city.trim()) errs.city = "City is required.";
    if (!state.trim()) errs.state = "State is required.";
    if (!pincode.trim()) errs.pincode = "PIN / Postal code is required.";
    if (!country.trim()) errs.country = "Country is required.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateCurrentStep = () => {
    if (step === 1) {
      if (showNewAddressForm || selectedAddressIndex === -1)
        return validateAddress();
      return true;
    }
    if (step === 2) return true; // No form fields — just a card selection
    if (step === 3) {
      if (!termsAccepted) {
        setErrors({
          terms: "You must accept the Terms & Conditions to place your order.",
        });
        return false;
      }
      return true;
    }
    return true;
  };

  const goNext = () => {
    if (!validateCurrentStep()) return;
    setErrors({});
    setStep((prev) => Math.min(3, prev + 1));
  };

  const goBack = () => {
    setErrors({});
    setStep((prev) => Math.max(1, prev - 1));
  };

  const buildShippingPayload = () => ({
    fullName: addressForm.name.trim(),
    phone: addressForm.phone.trim(),
    addressLine1: addressForm.address.trim(),
    city: addressForm.city.trim(),
    state: addressForm.state.trim(),
    pincode: addressForm.pincode.trim(),
    country: addressForm.country.trim() || "India",
  });

  const buildItemsPayload = () =>
    cartItems.map((item) => ({
      product: item.product || item._id || item.id,
      productName: item.title || item.name || "Product",
      productImage: item.images?.[0] || item.image || "",
      unitPrice: Number(item.price || item.unitPrice || 0),
      quantity: Number(item.quantity || 1),
    }));

  const handleOrderSuccess = (createdOrder, shippingPayload) => {
    if (showNewAddressForm) {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const existing = Array.isArray(storedUser.addresses)
        ? storedUser.addresses
        : [];
      storedUser.addresses = [...existing, { ...addressForm, label: "Home" }];
      localStorage.setItem("user", JSON.stringify(storedUser));
    }
    localStorage.removeItem("cart");
    window.dispatchEvent(new Event("cartUpdated"));
    setOrderDetails({
      orderId:
        createdOrder?.orderNumber ||
        createdOrder?._id ||
        `SC-${Date.now().toString().slice(-6)}`,
      customer: {
        name: shippingPayload.fullName,
        phone: shippingPayload.phone,
      },
      address: shippingPayload,
      deliveryCharge,
      payment,
      subtotal,
      total,
    });
    setDone(true);
  };

  const handlePlaceOrder = async () => {
    if (!validateCurrentStep()) return;
    setSubmittingOrder(true);
    setApiError("");

    const shippingPayload = buildShippingPayload();
    const itemsPayload = buildItemsPayload();

    if (payment === "cod") {
      try {
        const res = await axios.post(
          `${API_BASE_URL}/orders`,
          {
            shippingAddress: shippingPayload,
            paymentMethod: "cod",
            items: itemsPayload,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getToken()}`,
            },
          },
        );
        if (res.data?.success) {
          handleOrderSuccess(res.data.order, shippingPayload);
        } else {
          setApiError(
            res.data?.message || "Failed to place order. Please try again.",
          );
        }
      } catch (err) {
        handleAuthError(err);
        setApiError(
          err.response?.data?.message ||
            "Failed to place order. Please try again.",
        );
      } finally {
        setSubmittingOrder(false);
      }
    } else {
      // Online Payment — Razorpay flow
      try {
        const rzpRes = await axios.post(
          `${API_BASE_URL}/orders/razorpay-order`,
          {
            shippingAddress: shippingPayload,
            paymentMethod: "online",
            items: itemsPayload,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getToken()}`,
            },
          },
        );

        const { razorpayOrderId, amount, currency, key } = rzpRes.data;

        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          setApiError(
            "Payment gateway failed to load. Check your connection and try again.",
          );
          setSubmittingOrder(false);
          return;
        }

        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

        const rzpOptions = {
          key,
          amount,
          currency: currency || "INR",
          name: "SmartCommerce",
          description: `${itemCount} item${itemCount > 1 ? "s" : ""} · ${money(total)}`,
          image: "/logo.png",
          order_id: razorpayOrderId,
          prefill: {
            name: addressForm.name,
            email: storedUser.email || "",
            contact: addressForm.phone,
          },
          notes: {
            address: `${addressForm.address}, ${addressForm.city}`,
          },
          theme: { color: "#0f766e" },
          modal: {
            backdropclose: false,
            ondismiss: () => {
              setSubmittingOrder(false);
              setApiError(
                "Payment was cancelled. Click 'Pay securely' to try again.",
              );
            },
          },
          handler: (rzpResponse) => {
            (async () => {
              try {
                const verifyRes = await axios.post(
                  `${API_BASE_URL}/orders/verify-payment`,
                  {
                    razorpayOrderId: rzpResponse.razorpay_order_id,
                    razorpayPaymentId: rzpResponse.razorpay_payment_id,
                    razorpaySignature: rzpResponse.razorpay_signature,
                    shippingAddress: shippingPayload,
                    paymentMethod: "online",
                    items: itemsPayload,
                  },
                  {
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${getToken()}`,
                    },
                  },
                );
                if (verifyRes.data?.success) {
                  handleOrderSuccess(verifyRes.data.order, shippingPayload);
                } else {
                  setApiError(
                    verifyRes.data?.message ||
                      "Payment received but order creation failed. Contact support.",
                  );
                }
              } catch (verifyErr) {
                setApiError(
                  verifyErr.response?.data?.message ||
                    `Payment received but order creation failed. Payment ID: ${rzpResponse.razorpay_payment_id}`,
                );
              } finally {
                setSubmittingOrder(false);
              }
            })();
          },
        };

        const rzp = new window.Razorpay(rzpOptions);
        rzp.on("payment.failed", (response) => {
          setApiError(
            `Payment failed: ${response.error?.description || "Unknown error"}. Please try again.`,
          );
          setSubmittingOrder(false);
        });
        rzp.open();
      } catch (err) {
        handleAuthError(err);
        setApiError(
          err.response?.data?.message ||
            "Failed to initiate payment. Please try again.",
        );
        setSubmittingOrder(false);
      }
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background text-muted-foreground">
        <Loader2 size={36} className="mb-3 animate-spin text-primary" />
        <p className="text-sm font-semibold">Loading checkout…</p>
      </main>
    );
  }

  if (cartItems.length === 0 && !done) {
    return (
      <main className="min-h-screen bg-background px-4 py-16">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-secondary text-primary">
            <Package size={30} />
          </div>
          <h1 className="display mt-6 text-3xl font-extrabold">
            Your cart is empty
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Add products to your cart before checking out.
          </p>
          <Link
            to="/shop"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
          >
            Browse products <ArrowRight size={16} />
          </Link>
        </div>
      </main>
    );
  }

  if (done) {
    return (
      <main className="min-h-[70vh] bg-background px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto grid size-20 place-items-center rounded-full bg-teal-100 text-teal-700">
            <Check size={40} />
          </div>
          <p className="mono mt-7 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            Thank you
          </p>
          <h1 className="display mt-3 text-4xl font-extrabold">
            Order placed. Nice choice.
          </h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Your order is confirmed and our vendors are getting your products
            ready.
          </p>

          <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-left">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Order ID
                </p>
                <p className="mt-1 font-bold">{orderDetails?.orderId}</p>
              </div>
              <CheckCircle2 size={22} className="text-teal-600" />
            </div>
            <div className="mt-5 space-y-3 border-t border-border pt-5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Recipient</span>
                <span className="font-semibold">
                  {orderDetails?.customer?.name}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Country</span>
                <span className="font-semibold">
                  {orderDetails?.address?.country}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment</span>
                <span className="font-semibold">
                  {payment === "cod" ? "Cash on Delivery" : "Online Payment"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items</span>
                <span className="font-semibold">{itemCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                <span className="font-semibold">
                  {orderDetails?.deliveryCharge === 0
                    ? "FREE"
                    : money(orderDetails?.deliveryCharge)}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-3 font-bold">
                <span>Total</span>
                <span className="display text-lg font-extrabold">
                  {money(total)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/orders"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
            >
              Track order <ArrowRight size={16} />
            </Link>
            <Link
              to="/shop"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-bold"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="mb-8">
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary"
          >
            <ArrowLeft size={14} /> Back to cart
          </Link>
          <p className="mono mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            Secure checkout
          </p>
          <h1 className="display mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Almost yours.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Complete your shipping and payment details to place your order.
          </p>
        </div>

        {/* STEP PROGRESS */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex min-w-[500px] items-center justify-between">
            {[
              { id: 1, label: "Address", icon: MapPin },
              { id: 2, label: "Payment", icon: CreditCard },
              { id: 3, label: "Confirm", icon: CheckCircle2 },
            ].map((it, idx) => {
              const Icon = it.icon;
              return (
                <React.Fragment key={it.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (it.id <= step) {
                        setErrors({});
                        setStep(it.id);
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <span
                      className={`grid size-9 place-items-center rounded-full text-xs font-bold transition ${
                        step >= it.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {step > it.id ? <Check size={15} /> : <Icon size={15} />}
                    </span>
                    <span
                      className={`hidden text-xs font-bold sm:block ${
                        step >= it.id ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {it.label}
                    </span>
                  </button>
                  {idx < 2 && (
                    <div
                      className={`mx-4 h-px flex-1 transition ${
                        step > it.id ? "bg-primary" : "bg-border"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* MAIN LAYOUT */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            <div className="rounded-[1.25rem] border border-border bg-card p-5 sm:p-7">
              {/* STEP 1: ADDRESS */}
              {step === 1 && (
                <div>
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="display text-xl font-bold">
                        Where should we deliver?
                      </h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Select a saved address or enter a new delivery address.
                      </p>
                    </div>
                    {savedAddresses.length > 0 && (
                      <button
                        type="button"
                        onClick={handleToggleNewAddress}
                        className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-primary hover:underline"
                      >
                        <Plus size={14} />
                        {showNewAddressForm ? "Use saved" : "Add new"}
                      </button>
                    )}
                  </div>

                  {/* SAVED ADDRESS CARDS */}
                  {!showNewAddressForm && savedAddresses.length > 0 && (
                    <div className="mb-6 space-y-3">
                      {savedAddresses.map((addr, index) => {
                        const isSelected = selectedAddressIndex === index;
                        return (
                          <div
                            key={index}
                            onClick={() => handleSelectSavedAddress(index)}
                            className={`w-full cursor-pointer rounded-xl border p-4 text-left transition ${
                              isSelected
                                ? "border-primary bg-secondary/60"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-background text-primary">
                                <MapPin size={17} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-sm font-bold">
                                    {addr.name}
                                  </p>
                                  {isSelected && (
                                    <CheckCircle2
                                      size={18}
                                      className="shrink-0 text-primary"
                                    />
                                  )}
                                </div>
                                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                  {addr.address}, {addr.city}, {addr.state} –{" "}
                                  {addr.pincode}
                                </p>
                                <div className="mt-2 flex items-center gap-3 text-xs">
                                  <span className="font-semibold text-foreground">
                                    {addr.phone}
                                  </span>
                                  <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    {addr.label || addr.country || "India"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* NEW ADDRESS FORM */}
                  {(showNewAddressForm || savedAddresses.length === 0) && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-bold">
                          Country / Region
                        </label>
                        <select
                          name="country"
                          value={addressForm.country}
                          onChange={handleAddressChange}
                          className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
                        >
                          <option value="India">India</option>
                          <option value="United States">United States</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="United Arab Emirates">
                            United Arab Emirates
                          </option>
                          <option value="Canada">Canada</option>
                          <option value="Australia">Australia</option>
                          <option value="Other International">
                            Other International
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold">Full Name</label>
                        <input
                          type="text"
                          name="name"
                          value={addressForm.name}
                          onChange={handleAddressChange}
                          placeholder="e.g. Ananya Sharma"
                          className={`mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary ${
                            errors.name ? "border-red-500" : "border-border"
                          }`}
                        />
                        {errors.name && (
                          <ErrorMessage>{errors.name}</ErrorMessage>
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-bold">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={addressForm.phone}
                          onChange={handleAddressChange}
                          placeholder="Mobile number"
                          className={`mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary ${
                            errors.phone ? "border-red-500" : "border-border"
                          }`}
                        />
                        {errors.phone && (
                          <ErrorMessage>{errors.phone}</ErrorMessage>
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-bold">
                          PIN / Postal Code
                        </label>
                        <input
                          type="text"
                          name="pincode"
                          value={addressForm.pincode}
                          onChange={handleAddressChange}
                          placeholder="PIN / Postal Code"
                          className={`mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary ${
                            errors.pincode ? "border-red-500" : "border-border"
                          }`}
                        />
                        {errors.pincode && (
                          <ErrorMessage>{errors.pincode}</ErrorMessage>
                        )}
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-xs font-bold">
                          Street Address
                        </label>
                        <textarea
                          name="address"
                          rows={3}
                          value={addressForm.address}
                          onChange={handleAddressChange}
                          placeholder="House No., Building, Street Name, Area"
                          className={`mt-2 w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary ${
                            errors.address ? "border-red-500" : "border-border"
                          }`}
                        />
                        {errors.address && (
                          <ErrorMessage>{errors.address}</ErrorMessage>
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-bold">City</label>
                        <input
                          type="text"
                          name="city"
                          value={addressForm.city}
                          onChange={handleAddressChange}
                          placeholder="City"
                          className={`mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary ${
                            errors.city ? "border-red-500" : "border-border"
                          }`}
                        />
                        {errors.city && (
                          <ErrorMessage>{errors.city}</ErrorMessage>
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-bold">
                          State / Province
                        </label>
                        <input
                          type="text"
                          name="state"
                          value={addressForm.state}
                          onChange={handleAddressChange}
                          placeholder="State"
                          className={`mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary ${
                            errors.state ? "border-red-500" : "border-border"
                          }`}
                        />
                        {errors.state && (
                          <ErrorMessage>{errors.state}</ErrorMessage>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={goNext}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
                  >
                    Continue to payment <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {/* STEP 2: PAYMENT — 2 options only */}
              {step === 2 && (
                <div>
                  <h2 className="display text-xl font-bold">
                    How would you like to pay?
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Choose your preferred payment method to complete your order.
                  </p>

                  {/* Payment method cards */}
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {PAYMENT_METHODS.map((m) => {
                      const Icon = m.icon;
                      const isSelected = payment === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPayment(m.id)}
                          className={`relative overflow-hidden rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
                            isSelected
                              ? "border-primary shadow-lg shadow-primary/10"
                              : "border-border hover:border-primary/40 hover:shadow-sm"
                          }`}
                        >
                          {/* Selected indicator strip */}
                          {isSelected && (
                            <span
                              className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${m.accent}`}
                            />
                          )}

                          <div className="flex items-start justify-between gap-3">
                            <div
                              className={`grid size-11 place-items-center rounded-xl transition-colors ${
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              <Icon size={20} />
                            </div>
                            {isSelected ? (
                              <CheckCircle2
                                size={20}
                                className="mt-0.5 shrink-0 text-primary"
                              />
                            ) : (
                              <span className="mt-1 size-5 shrink-0 rounded-full border-2 border-border" />
                            )}
                          </div>

                          <p className="mt-4 text-sm font-bold">{m.title}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {m.subtitle}
                          </p>

                          <div className="mt-3 flex items-center justify-between gap-2">
                            <p className="text-[11px] leading-relaxed text-muted-foreground">
                              {m.desc}
                            </p>
                            <span
                              className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${m.badgeColor}`}
                            >
                              {m.badge}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Razorpay info banner — only for online */}
                  {payment === "online" && (
                    <div className="mt-5 flex items-center gap-3 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3">
                      <ShieldCheck
                        size={17}
                        className="shrink-0 text-teal-600"
                      />
                      <div>
                        <p className="text-xs font-bold text-teal-800">
                          Secure Payment via Razorpay
                        </p>
                        <p className="mt-0.5 text-[11px] text-teal-700">
                          Choose UPI, debit/credit card, net banking or wallet
                          in the next step.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* COD info banner */}
                  {payment === "cod" && (
                    <div className="mt-5 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                      <Banknote size={17} className="shrink-0 text-amber-600" />
                      <div>
                        <p className="text-xs font-bold text-amber-800">
                          Pay when your order arrives
                        </p>
                        <p className="mt-0.5 text-[11px] text-amber-700">
                          Keep exact change ready. No extra charge for COD.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={goBack}
                      className="flex-1 rounded-xl border border-border px-5 py-3.5 text-sm font-bold transition hover:bg-muted"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
                    >
                      Review order <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: REVIEW & PLACE ORDER */}
              {step === 3 && (
                <div>
                  <h2 className="display text-xl font-bold">
                    Review your order
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Check everything before placing your order.
                  </p>

                  {/* CART ITEMS */}
                  <div className="mt-6 divide-y divide-border overflow-hidden rounded-xl border border-border">
                    {cartItems.map((p) => {
                      const qty = Number(p.quantity) || 1;
                      const productImg = getProductImage(p);
                      return (
                        <div key={p.id || p._id} className="flex gap-4 p-4">
                          {productImg ? (
                            <img
                              src={productImg}
                              alt={p.name}
                              className="size-16 shrink-0 rounded-xl border border-border object-cover"
                            />
                          ) : (
                            <div className="grid size-16 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-800">
                              <span className="text-xl font-extrabold text-white">
                                {p.mark || "P"}
                              </span>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-sm font-bold">
                              {p.title || p.name}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Vendor: {p.vendor}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Qty: {qty}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-bold">
                            {money(Number(p.price || p.unitPrice || 0) * qty)}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* ADDRESS REVIEW */}
                  <div className="mt-5 rounded-xl bg-muted p-4">
                    <div className="flex gap-3">
                      <MapPin
                        size={18}
                        className="mt-0.5 shrink-0 text-primary"
                      />
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide">
                          Delivery Address ({addressForm.country})
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {addressForm.name}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {addressForm.address}, {addressForm.city},{" "}
                          {addressForm.state} – {addressForm.pincode} (
                          {addressForm.country})
                        </p>
                        <p className="mt-1 text-xs font-semibold">
                          {addressForm.phone}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* PAYMENT REVIEW */}
                  <div className="mt-3 rounded-xl bg-muted p-4">
                    <div className="flex items-center gap-3">
                      <CreditCard size={18} className="shrink-0 text-primary" />
                      <div className="flex-1">
                        <p className="text-xs font-bold uppercase tracking-wide">
                          Payment Method
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {payment === "online"
                            ? "Online Payment (UPI / Card / Net Banking)"
                            : "Cash on Delivery"}
                        </p>
                        {payment === "online" && (
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            Powered by Razorpay · SSL encrypted
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* TERMS */}
                  <label className="mt-6 flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => {
                        setTermsAccepted(e.target.checked);
                        if (e.target.checked) clearFieldError("terms");
                      }}
                      className="mt-1 size-4 accent-primary"
                    />
                    <span className="text-xs leading-5 text-muted-foreground">
                      I agree to SmartCommerce's{" "}
                      <span className="font-semibold text-foreground">
                        Terms &amp; Conditions
                      </span>{" "}
                      and{" "}
                      <span className="font-semibold text-foreground">
                        Privacy Policy
                      </span>
                      .
                    </span>
                  </label>
                  {errors.terms && <ErrorMessage>{errors.terms}</ErrorMessage>}

                  {apiError && (
                    <div className="mt-4 flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive">
                      <AlertCircle className="mt-0.5 size-4 shrink-0" />
                      {apiError}
                    </div>
                  )}

                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={goBack}
                      disabled={submittingOrder}
                      className="flex-1 rounded-xl border border-border px-5 py-3.5 text-sm font-bold transition hover:bg-muted disabled:opacity-40"
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      disabled={!termsAccepted || submittingOrder}
                      onClick={handlePlaceOrder}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        payment === "cod"
                          ? "bg-primary text-primary-foreground hover:opacity-90"
                          : "bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-md hover:from-teal-700 hover:to-teal-600"
                      }`}
                    >
                      {submittingOrder ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          {payment === "cod"
                            ? "Placing order…"
                            : "Opening payment…"}
                        </>
                      ) : payment === "cod" ? (
                        <>
                          Place order <Check size={16} />
                        </>
                      ) : (
                        <>
                          <Zap size={15} /> Pay {money(total)} securely
                        </>
                      )}
                    </button>
                  </div>

                  {payment === "online" && !submittingOrder && (
                    <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                      <LockKeyhole size={12} />
                      Razorpay's secure payment page will open next
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — ORDER SUMMARY SIDEBAR */}
          <aside className="h-fit lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-[1.25rem] bg-[#203b42] text-white">
              <div className="p-6">
                <p className="mono text-[10px] font-bold uppercase tracking-widest text-white/50">
                  Order Summary
                </p>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <p className="display text-3xl font-extrabold">
                    {money(total)}
                  </p>
                  <span className="text-xs text-white/50">
                    {itemCount} {itemCount === 1 ? "item" : "items"}
                  </span>
                </div>

                <div className="mt-6 space-y-3 border-t border-white/10 pt-5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Subtotal</span>
                    <span>{money(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-white/60">
                      <Globe size={13} className="text-teal-300" />
                      Delivery (
                      {activeCountry.toLowerCase() === "india"
                        ? "India"
                        : "International"}
                      )
                    </span>
                    <span>
                      {deliveryCharge === 0 ? (
                        <span className="font-bold text-teal-300">FREE</span>
                      ) : (
                        money(deliveryCharge)
                      )}
                    </span>
                  </div>
                </div>

                <div className="mt-5 border-t border-white/10 pt-5">
                  <div className="flex justify-between">
                    <span className="font-bold">Total Payable</span>
                    <span className="display text-xl font-extrabold">
                      {money(total)}
                    </span>
                  </div>
                  <p className="mt-1 text-right text-[10px] text-white/40">
                    Inclusive of all taxes &amp; delivery
                  </p>
                </div>
              </div>

              <div className="border-t border-white/10 p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex gap-2">
                    <ShieldCheck size={17} className="shrink-0 text-teal-300" />
                    <div>
                      <p className="text-[11px] font-bold">100% Secure</p>
                      <p className="mt-1 text-[10px] text-white/40">
                        Verified checkout
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <LockKeyhole size={17} className="shrink-0 text-teal-300" />
                    <div>
                      <p className="text-[11px] font-bold">Encrypted</p>
                      <p className="mt-1 text-[10px] text-white/40">
                        SSL protected
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* VENDORS BREAKDOWN */}
            <div className="mt-4 rounded-2xl border border-border bg-card p-5">
              <p className="mono text-[10px] font-bold uppercase tracking-widest text-primary">
                Vendors
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Products from {vendors.length}{" "}
                {vendors.length === 1 ? "vendor" : "vendors"}
              </p>
              <div className="mt-4 space-y-3">
                {vendors.map((v) => {
                  const cnt = cartItems.filter((p) => p.vendor === v).length;
                  return (
                    <div
                      key={v}
                      className="flex items-center justify-between rounded-xl bg-muted px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <div className="grid size-7 place-items-center rounded-lg bg-background text-primary">
                          <Package size={13} />
                        </div>
                        <span className="text-xs font-bold">{v}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {cnt} {cnt === 1 ? "item" : "items"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};

const ErrorMessage = ({ children }) => (
  <p className="mt-2 flex items-start gap-1 text-xs font-medium text-red-600">
    <AlertCircle size={13} className="mt-0.5 shrink-0" />
    {children}
  </p>
);

export default CheckoutPage;
