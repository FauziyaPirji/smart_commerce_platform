import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Store,
  User,
  Mail,
  Phone,
  Lock,
  MapPin,
  Building2,
  CreditCard,
  FileText,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2,
  Globe,
  Upload,
  Trash2,
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000/api/vendors";
const CATEGORIES_API_URL = "http://localhost:5000/api/categories-list";

const VendorRegisterPage = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  // Database Categories State
  const [dbCategories, setDbCategories] = useState([]);
  const [fetchingCategories, setFetchingCategories] = useState(true);

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "",
    password: "",
    confirmPassword: "",
    storeName: "",
    storeDescription: "",
    storeLogo: "",
    category: "",
    website: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    businessType: "",
    panNumber: "",
    gstNumber: "",
    accountHolder: "",
    accountNumber: "",
    ifsc: "",
    bankName: "",
    terms: false,
  });

  const [errors, setErrors] = useState({});

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      setFetchingCategories(true);
      try {
        const res = await axios.get(CATEGORIES_API_URL);
        const data = res.data;

        let list = [];
        if (Array.isArray(data)) {
          list = data;
        } else if (data.success && Array.isArray(data.categories)) {
          list = data.categories;
        } else if (Array.isArray(data.categories)) {
          list = data.categories;
        } else if (Array.isArray(data.data)) {
          list = data.data;
        }

        setDbCategories(list);
      } catch (err) {
        console.error("Error fetching categories:", err?.message || err);
        setDbCategories([]);
      } finally {
        setFetchingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Field Update Helper
  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    if (apiError) setApiError("");
  };

  // Step Validation
  const validateStep = () => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.firstName.trim())
        newErrors.firstName = "First name is required.";
      if (!formData.lastName.trim())
        newErrors.lastName = "Last name is required.";
      if (!formData.email.trim())
        newErrors.email = "Email address is required.";
      if (!formData.phone.trim()) newErrors.phone = "Phone number is required.";
      if (!formData.password) newErrors.password = "Password is required.";
      if (formData.password.length < 8)
        newErrors.password = "Password must contain at least 8 characters.";
      if (!formData.confirmPassword)
        newErrors.confirmPassword = "Please confirm your password.";
      if (
        formData.password &&
        formData.confirmPassword &&
        formData.password !== formData.confirmPassword
      )
        newErrors.confirmPassword = "Passwords do not match.";
    }

    if (step === 2) {
      if (!formData.storeName.trim())
        newErrors.storeName = "Store name is required.";
      if (!formData.storeDescription.trim())
        newErrors.storeDescription = "Store description is required.";
      if (!formData.category) newErrors.category = "Please select a category.";
    }

    if (step === 3) {
      if (!formData.addressLine1.trim())
        newErrors.addressLine1 = "Address Line 1 is required.";
      if (!formData.city.trim()) newErrors.city = "City is required.";
      if (!formData.state.trim()) newErrors.state = "State is required.";
      if (!formData.pincode.trim()) newErrors.pincode = "Pincode is required.";
    }

    if (step === 4) {
      if (!formData.businessType)
        newErrors.businessType = "Please select your business type.";
      if (!formData.panNumber.trim())
        newErrors.panNumber = "PAN number is required.";
    }

    if (step === 5) {
      if (!formData.accountHolder.trim())
        newErrors.accountHolder = "Account holder name is required.";
      if (!formData.accountNumber.trim())
        newErrors.accountNumber = "Account number is required.";
      if (!formData.ifsc.trim()) newErrors.ifsc = "IFSC code is required.";
      if (!formData.bankName.trim())
        newErrors.bankName = "Bank name is required.";
      if (!formData.terms)
        newErrors.terms = "You must accept the vendor terms and conditions.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep((prev) => Math.min(prev + 1, 5));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const previousStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
    setErrors({});
    setApiError("");
  };

  // FORM SUBMISSION
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    setApiError("");
    setLoading(true);

    try {
      const payload = {
        firstName: formData.firstName.trim(),
        middleName: formData.middleName.trim() || undefined,
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
        gender: formData.gender || undefined,
        storeName: formData.storeName.trim(),
        storeDescription: formData.storeDescription.trim(),
        storeLogo: formData.storeLogo || undefined,
        category: formData.category,
        categories: formData.category ? [formData.category] : [],
        website: formData.website.trim() || undefined,
        businessType: formData.businessType,
        panNumber: formData.panNumber.trim().toUpperCase(),
        gstNumber: formData.gstNumber.trim().toUpperCase() || undefined,
        businessAddress: {
          addressLine1: formData.addressLine1.trim(),
          addressLine2: formData.addressLine2.trim() || undefined,
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
          country: formData.country.trim() || "India",
        },
        bankDetails: {
          accountHolderName: formData.accountHolder.trim(),
          bankName: formData.bankName.trim(),
          accountNumber: formData.accountNumber.trim(),
          ifscCode: formData.ifsc.trim().toUpperCase(),
        },
      };

      // POST TO BACKEND
      const res = await axios.post(`${API_BASE_URL}/register`, payload);
      const data = res.data;

      if (!data.success) {
        throw new Error(data.message || "Vendor registration failed.");
      }

      alert(
        "Vendor application submitted successfully! Pending admin approval.",
      );
      navigate("/vendor/login");
    } catch (err) {
      console.error("Vendor Register Error:", err);
      setApiError(
        err.response?.data?.message ||
          err.message ||
          "Failed to submit vendor application.",
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedCategoryObject = dbCategories.find(
    (cat) => (cat._id || cat.id) === formData.category,
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Top Brand Area */}
      <div className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-10 place-items-center rounded-xl bg-primary text-sm font-black text-primary-foreground">
              SC
            </span>
            <span className="display text-xl font-extrabold tracking-tight">
              Smart<span className="text-primary">Commerce</span>
            </span>
          </Link>

          <div className="text-sm text-muted-foreground">
            Already a vendor?{" "}
            <Link
              to="/vendor/login"
              className="font-bold text-primary hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-10">
        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Store size={25} />
          </div>

          <p className="mono mt-5 text-[10px] uppercase tracking-[0.25em] text-primary">
            Become a seller
          </p>

          <h1 className="display mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Build your store on SmartCommerce.
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            Join independent Indian businesses selling to thoughtful shoppers
            across the country.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mx-auto mt-10 max-w-4xl">
          <div className="flex items-center justify-between">
            {[
              ["1", "Account"],
              ["2", "Store"],
              ["3", "Address"],
              ["4", "Business"],
              ["5", "Payout"],
            ].map(([number, label], index) => {
              const active = step >= Number(number);
              return (
                <React.Fragment key={number}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`grid size-9 place-items-center rounded-full text-xs font-bold transition ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "border border-border bg-card text-muted-foreground"
                      }`}
                    >
                      {step > Number(number) ? (
                        <CheckCircle2 size={17} />
                      ) : (
                        number
                      )}
                    </div>

                    <span
                      className={`mt-2 hidden text-[10px] font-semibold sm:block ${
                        active ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {label}
                    </span>
                  </div>

                  {index < 4 && (
                    <div
                      className={`mx-2 h-px flex-1 ${
                        step > index + 1 ? "bg-primary" : "bg-border"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Form Card */}
        <div className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-[0_20px_60px_rgba(37,50,64,.07)]">
          <form onSubmit={handleSubmit} noValidate>
            {/* API Error Alert */}
            {apiError && (
              <div className="m-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                {apiError}
              </div>
            )}

            {/* STEP 1: OWNER ACCOUNT */}
            {step === 1 && (
              <div className="p-6 sm:p-8">
                <StepHeading
                  icon={<User size={20} />}
                  title="Tell us about you"
                  description="These details will be used for your vendor account and communication."
                />

                <div className="mt-8 grid gap-5 sm:grid-cols-3">
                  <Input
                    label="First name *"
                    icon={<User size={16} />}
                    value={formData.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                    placeholder="First name"
                    error={errors.firstName}
                  />
                  <Input
                    label="Middle name (Optional)"
                    icon={<User size={16} />}
                    value={formData.middleName}
                    onChange={(e) => updateField("middleName", e.target.value)}
                    placeholder="Middle name"
                  />
                  <Input
                    label="Last name *"
                    icon={<User size={16} />}
                    value={formData.lastName}
                    onChange={(e) => updateField("lastName", e.target.value)}
                    placeholder="Last name"
                    error={errors.lastName}
                  />
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <Input
                    label="Email address *"
                    type="email"
                    icon={<Mail size={16} />}
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="you@example.com"
                    error={errors.email}
                  />
                  <Input
                    label="Phone number *"
                    icon={<Phone size={16} />}
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="+91 98765 43210"
                    error={errors.phone}
                  />
                  <SelectInput
                    label="Gender (Optional)"
                    value={formData.gender}
                    onChange={(e) => updateField("gender", e.target.value)}
                    options={[
                      { label: "Male", value: "male" },
                      { label: "Female", value: "female" },
                      { label: "Other", value: "other" },
                    ]}
                  />
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <PasswordInput
                    label="Create password *"
                    value={formData.password}
                    show={showPassword}
                    setShow={setShowPassword}
                    onChange={(e) => updateField("password", e.target.value)}
                    error={errors.password}
                  />
                  <PasswordInput
                    label="Confirm password *"
                    value={formData.confirmPassword}
                    show={showConfirmPassword}
                    setShow={setShowConfirmPassword}
                    onChange={(e) =>
                      updateField("confirmPassword", e.target.value)
                    }
                    error={errors.confirmPassword}
                  />
                </div>
              </div>
            )}

            {/* STEP 2: STORE INFO */}
            {step === 2 && (
              <div className="p-6 sm:p-8">
                <StepHeading
                  icon={<Store size={20} />}
                  title="Create your store"
                  description="Tell shoppers what makes your business worth discovering."
                />

                <div className="mt-8 space-y-5">
                  <Input
                    label="Store name *"
                    icon={<Store size={16} />}
                    value={formData.storeName}
                    onChange={(e) => updateField("storeName", e.target.value)}
                    placeholder="Example: Namma Audio"
                    error={errors.storeName}
                  />

                  <div>
                    <label className="text-sm font-semibold">
                      Store description *
                    </label>
                    <textarea
                      value={formData.storeDescription}
                      onChange={(e) =>
                        updateField("storeDescription", e.target.value)
                      }
                      rows={4}
                      placeholder="Describe your store, products and what makes your business special..."
                      className={`mt-2 w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary ${errors.storeDescription ? "border-red-400" : "border-border"}`}
                    />
                    {errors.storeDescription && (
                      <ErrorText text={errors.storeDescription} />
                    )}
                  </div>

                  {/* Store Logo */}
                  <div>
                    <label className="text-sm font-semibold">
                      Store Logo (Optional)
                    </label>
                    {formData.storeLogo ? (
                      <div className="mt-2 flex items-center gap-4 rounded-xl border border-border bg-background p-3">
                        <img
                          src={formData.storeLogo}
                          alt="Store Logo Preview"
                          className="size-16 rounded-lg border border-border object-cover"
                        />
                        <div className="flex flex-1 flex-col gap-1">
                          <span className="text-xs font-semibold text-foreground">
                            Logo uploaded
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            Ready for registration
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateField("storeLogo", "")}
                          className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                        >
                          <Trash2 size={14} />
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-background p-5 text-center transition hover:border-primary hover:bg-primary/5">
                        <div className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
                          <Upload size={18} />
                        </div>
                        <p className="mt-2 text-xs font-semibold text-foreground">
                          Click to upload store logo
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          PNG, JPG, WEBP or GIF (Max 2MB)
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                        />
                      </label>
                    )}
                    {errors.storeLogo && <ErrorText text={errors.storeLogo} />}
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    {/* Primary Category Dropdown */}
                    <div>
                      <label className="text-sm font-semibold">
                        Primary category *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) =>
                          updateField("category", e.target.value)
                        }
                        className={`mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:border-primary ${errors.category ? "border-red-400" : "border-border"}`}
                        disabled={fetchingCategories}
                      >
                        <option value="">
                          {fetchingCategories
                            ? "Loading categories from database..."
                            : "Select primary category"}
                        </option>
                        {dbCategories.map((cat) => {
                          const catId =
                            cat._id || cat.id || cat.slug || cat.name;
                          const catName =
                            cat.name || cat.categoryName || cat.title;
                          return (
                            <option key={catId} value={catId}>
                              {catName}
                            </option>
                          );
                        })}
                      </select>
                      {errors.category && <ErrorText text={errors.category} />}
                      {!fetchingCategories && dbCategories.length === 0 && (
                        <p className="mt-1.5 text-xs font-medium text-amber-600">
                          ⚠️ No categories found. Try again later.
                        </p>
                      )}
                    </div>

                    <Input
                      label="Website (Optional)"
                      icon={<Globe size={16} />}
                      value={formData.website}
                      onChange={(e) => updateField("website", e.target.value)}
                      placeholder="https://yourstore.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: BUSINESS ADDRESS */}
            {step === 3 && (
              <div className="p-6 sm:p-8">
                <StepHeading
                  icon={<MapPin size={20} />}
                  title="Business address"
                  description="Where is your business located?"
                />

                <div className="mt-8 space-y-5">
                  <Input
                    label="Address Line 1 *"
                    icon={<MapPin size={16} />}
                    value={formData.addressLine1}
                    onChange={(e) =>
                      updateField("addressLine1", e.target.value)
                    }
                    placeholder="Shop No, Street, Building, Area..."
                    error={errors.addressLine1}
                  />
                  <Input
                    label="Address Line 2 (Optional)"
                    icon={<MapPin size={16} />}
                    value={formData.addressLine2}
                    onChange={(e) =>
                      updateField("addressLine2", e.target.value)
                    }
                    placeholder="Landmark, Suite, Unit..."
                  />
                  <div className="grid gap-5 sm:grid-cols-3">
                    <Input
                      label="City *"
                      value={formData.city}
                      onChange={(e) => updateField("city", e.target.value)}
                      placeholder="Ahmedabad"
                      error={errors.city}
                    />
                    <Input
                      label="State *"
                      value={formData.state}
                      onChange={(e) => updateField("state", e.target.value)}
                      placeholder="Gujarat"
                      error={errors.state}
                    />
                    <Input
                      label="Pincode *"
                      value={formData.pincode}
                      onChange={(e) => updateField("pincode", e.target.value)}
                      placeholder="380001"
                      error={errors.pincode}
                    />
                  </div>
                  <Input
                    label="Country"
                    value={formData.country}
                    onChange={(e) => updateField("country", e.target.value)}
                    placeholder="India"
                  />
                </div>
              </div>
            )}

            {/* STEP 4: BUSINESS VERIFICATION */}
            {step === 4 && (
              <div className="p-6 sm:p-8">
                <StepHeading
                  icon={<Building2 size={20} />}
                  title="Business verification"
                  description="These details help us verify your business before your store goes live."
                />

                <div className="mt-8 space-y-5">
                  <SelectInput
                    label="Business type *"
                    value={formData.businessType}
                    onChange={(e) =>
                      updateField("businessType", e.target.value)
                    }
                    options={[
                      "Individual / Sole Proprietor",
                      "Partnership",
                      "Private Limited Company",
                      "Public Limited Company",
                      "LLP",
                      "Other",
                    ]}
                    error={errors.businessType}
                  />

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Input
                      label="PAN number *"
                      icon={<FileText size={16} />}
                      value={formData.panNumber}
                      onChange={(e) =>
                        updateField("panNumber", e.target.value.toUpperCase())
                      }
                      placeholder="ABCDE1234F"
                      error={errors.panNumber}
                    />
                    <Input
                      label="GST number (Optional)"
                      icon={<FileText size={16} />}
                      value={formData.gstNumber}
                      onChange={(e) =>
                        updateField("gstNumber", e.target.value.toUpperCase())
                      }
                      placeholder="22ABCDE1234F1Z5"
                    />
                  </div>

                  <div className="rounded-2xl border border-border bg-secondary/40 p-5">
                    <div className="flex gap-3">
                      <ShieldCheck
                        size={21}
                        className="mt-0.5 shrink-0 text-primary"
                      />
                      <div>
                        <p className="text-sm font-bold">
                          Why do we need this?
                        </p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          SmartCommerce uses business information to verify
                          sellers and maintain a trusted marketplace.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: PAYOUT DETAILS */}
            {step === 5 && (
              <div className="p-6 sm:p-8">
                <StepHeading
                  icon={<CreditCard size={20} />}
                  title="Payout details"
                  description="Where should your SmartCommerce earnings be deposited?"
                />

                <div className="mt-8 grid gap-5 sm:grid-cols-2">
                  <Input
                    label="Account holder name *"
                    icon={<User size={16} />}
                    value={formData.accountHolder}
                    onChange={(e) =>
                      updateField("accountHolder", e.target.value)
                    }
                    placeholder="Name as per bank account"
                    error={errors.accountHolder}
                  />
                  <Input
                    label="Bank name *"
                    icon={<Building2 size={16} />}
                    value={formData.bankName}
                    onChange={(e) => updateField("bankName", e.target.value)}
                    placeholder="HDFC Bank"
                    error={errors.bankName}
                  />
                  <Input
                    label="Account number *"
                    value={formData.accountNumber}
                    onChange={(e) =>
                      updateField("accountNumber", e.target.value)
                    }
                    placeholder="Enter account number"
                    error={errors.accountNumber}
                  />
                  <Input
                    label="IFSC code *"
                    value={formData.ifsc}
                    onChange={(e) =>
                      updateField("ifsc", e.target.value.toUpperCase())
                    }
                    placeholder="HDFC0001234"
                    error={errors.ifsc}
                  />
                </div>

                {/* Terms */}
                <div className="mt-8">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={formData.terms}
                      onChange={(e) => updateField("terms", e.target.checked)}
                      className="mt-1 size-4 accent-primary"
                    />
                    <span className="text-xs leading-5 text-muted-foreground">
                      I agree to the{" "}
                      <button type="button" className="font-bold text-primary">
                        SmartCommerce Vendor Terms
                      </button>
                      , marketplace policies and seller responsibilities.
                    </span>
                  </label>
                  {errors.terms && <ErrorText text={errors.terms} />}
                </div>

                {/* Summary */}
                <div className="mt-8 rounded-2xl border border-border bg-secondary/40 p-5">
                  <p className="mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Registration summary
                  </p>

                  <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                    <Summary
                      label="Owner"
                      value={`${formData.firstName} ${formData.middleName ? formData.middleName + " " : ""}${formData.lastName}`}
                    />
                    <Summary label="Email" value={formData.email} />
                    <Summary label="Store" value={formData.storeName} />
                    <Summary
                      label="Category"
                      value={
                        selectedCategoryObject
                          ? selectedCategoryObject.name ||
                            selectedCategoryObject.categoryName
                          : "Not selected"
                      }
                    />
                    <Summary
                      label="Location"
                      value={`${formData.city}, ${formData.state}, ${formData.country}`}
                    />
                    <Summary label="Business" value={formData.businessType} />
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between border-t border-border bg-background/60 px-6 py-5 sm:px-8">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={previousStep}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:border-primary hover:text-primary disabled:opacity-50"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
              ) : (
                <Link
                  to="/vendor/login"
                  className="text-sm font-semibold text-muted-foreground hover:text-primary"
                >
                  Already have an account?
                </Link>
              )}

              {step < 5 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:opacity-90"
                >
                  Continue
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Submitting application...
                    </>
                  ) : (
                    <>
                      Create vendor account
                      <CheckCircle2 size={17} />
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Footer Note */}
        <div className="mx-auto mt-6 flex max-w-4xl items-center justify-center gap-2 text-center text-[11px] text-muted-foreground">
          <ShieldCheck size={14} />
          Your information is securely handled by SmartCommerce.
        </div>
      </main>
    </div>
  );
};

/* REUSABLE INPUT COMPONENTS */

const StepHeading = ({ icon, title, description }) => (
  <div className="flex gap-4">
    <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
      {icon}
    </div>
    <div>
      <h2 className="display text-xl font-extrabold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);

const Input = ({
  label,
  icon,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
}) => (
  <div>
    <label className="text-sm font-semibold">{label}</label>
    <div
      className={`mt-2 flex items-center rounded-xl border bg-background px-3 transition focus-within:border-primary ${error ? "border-red-400" : "border-border"}`}
    >
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-transparent px-2 py-3 text-sm outline-none"
      />
    </div>
    {error && <ErrorText text={error} />}
  </div>
);

const PasswordInput = ({ label, value, show, setShow, onChange, error }) => (
  <div>
    <label className="text-sm font-semibold">{label}</label>
    <div
      className={`mt-2 flex items-center rounded-xl border bg-background px-3 focus-within:border-primary ${error ? "border-red-400" : "border-border"}`}
    >
      <Lock size={16} className="text-muted-foreground" />
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder="Minimum 8 characters"
        className="w-full bg-transparent px-2 py-3 text-sm outline-none"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
    {error && <ErrorText text={error} />}
  </div>
);

const SelectInput = ({ label, value, onChange, options, error }) => (
  <div>
    <label className="text-sm font-semibold">{label}</label>
    <select
      value={value}
      onChange={onChange}
      className={`mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:border-primary ${error ? "border-red-400" : "border-border"}`}
    >
      <option value="">Select {label.toLowerCase()}</option>
      {options.map((option) => {
        const optValue = typeof option === "object" ? option.value : option;
        const optLabel = typeof option === "object" ? option.label : option;
        return (
          <option key={optValue} value={optValue}>
            {optLabel}
          </option>
        );
      })}
    </select>
    {error && <ErrorText text={error} />}
  </div>
);

const ErrorText = ({ text }) => (
  <p className="mt-1.5 text-[11px] font-medium text-red-600">{text}</p>
);

const Summary = ({ label, value }) => (
  <div>
    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
      {label}
    </p>
    <p className="mt-1 font-semibold">{value || "Not provided"}</p>
  </div>
);

export default VendorRegisterPage;
