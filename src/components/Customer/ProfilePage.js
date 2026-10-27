import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRoute";
import {
  LogOut,
  User,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Package,
  Heart,
  ShieldCheck,
  Lock,
  LockKeyhole,
  Mail,
  Phone,
  CalendarDays,
  ChevronRight,
  Edit3,
  Loader2,
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000/api/users";

const ProfilePage = () => {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  /* USER & PROFILE STATE */
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "Prefer not to say",
    dateOfBirth: "",
  });

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState(profile);
  const [profileErrors, setProfileErrors] = useState({});

  /* ADDRESS STATE */
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const [addressForm, setAddressForm] = useState({
    type: "Home",
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [addressErrors, setAddressErrors] = useState({});

  /* PASSWORD STATE */
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordErrors, setPasswordErrors] = useState({});
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  /* INITIAL LOAD FROM LOCALSTORAGE */
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);

        const profileData = {
          firstName: parsedUser.firstName || "",
          lastName: parsedUser.lastName || "",
          email: parsedUser.email || "",
          phone: parsedUser.phone || "",
          gender: parsedUser.gender || "Prefer not to say",
          dateOfBirth: parsedUser.dob ? parsedUser.dob.split("T")[0] : "",
        };

        setProfile(profileData);
        setProfileForm(profileData);

        // Map MongoDB address schema to component state
        if (parsedUser.addresses && Array.isArray(parsedUser.addresses)) {
          const formattedAddrs = parsedUser.addresses.map((a, idx) => ({
            id: a._id || `addr-${idx}`,
            type: a.addressType
              ? a.addressType.charAt(0).toUpperCase() + a.addressType.slice(1)
              : "Home",
            name:
              a.fullName || `${parsedUser.firstName} ${parsedUser.lastName}`,
            phone: a.phone || parsedUser.phone,
            address: a.addressLine1 || "",
            city: a.city || "",
            state: a.state || "",
            pincode: a.pincode || "",
            isDefault: a.isDefault || idx === 0,
          }));
          setAddresses(formattedAddrs);
        }
      } catch (e) {
        console.error("Failed to load user:", e);
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  /* PROFILE FUNCTIONS */
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((current) => ({ ...current, [name]: value }));
    setProfileErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleProfilePhoneChange = (e) => {
    const phone = e.target.value.replace(/\D/g, "").slice(0, 10);
    setProfileForm((current) => ({ ...current, phone }));
    setProfileErrors((current) => ({ ...current, phone: "" }));
  };

  const validateProfile = () => {
    const errors = {};
    const { firstName, lastName, email, phone } = profileForm;

    if (!firstName.trim()) errors.firstName = "First name is required.";
    if (!lastName.trim()) errors.lastName = "Last name is required.";
    if (!email.trim()) errors.email = "Email address is required.";
    if (!phone.trim()) errors.phone = "Phone number is required.";

    return errors;
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const errors = validateProfile();
    setProfileErrors(errors);

    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    setApiError("");

    try {
      const cleanedProfile = {
        userId: user?._id,
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        email: profileForm.email.trim().toLowerCase(),
        phone: profileForm.phone.trim(),
        gender: profileForm.gender,
        dob: profileForm.dateOfBirth,
      };

      // 1. UPDATE PROFILE
      const res = await axios.put(`${API_BASE_URL}/profile`, cleanedProfile, {
        headers: {
          "Content-Type": "Application/json",
          Authorization: "Bearer " + token,
        },
      });
      const data = res.data;

      if (!data.success) {
        throw new Error(data.message || "Failed to update profile.");
      }

      // Sync updated profile to state and localStorage
      const updatedUser = { ...user, ...data.user };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setProfile(profileForm);
      setEditingProfile(false);
      setSuccessMsg("Profile updated successfully!");

      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      handleAuthError(err);

      console.error(err);
      setApiError(
        err.response?.data?.message || err.message || "Failed to save profile.",
      );
    } finally {
      setLoading(false);
    }
  };

  const openEditProfile = () => {
    setProfileForm(profile);
    setProfileErrors({});
    setEditingProfile(true);
  };

  const cancelProfileEdit = () => {
    setProfileForm(profile);
    setProfileErrors({});
    setEditingProfile(false);
  };

  /* ADDRESS FUNCTIONS */
  const resetAddressForm = () => {
    setAddressForm({
      type: "Home",
      name: `${profile.firstName} ${profile.lastName}`,
      phone: profile.phone,
      address: "",
      city: "",
      state: "",
      pincode: "",
    });
    setAddressErrors({});
    setEditingAddress(null);
  };

  const openAddAddress = () => {
    resetAddressForm();
    setShowAddressForm(true);
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddressForm((current) => ({ ...current, [name]: value }));
    setAddressErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleAddressPhoneChange = (e) => {
    const phone = e.target.value.replace(/\D/g, "").slice(0, 10);
    setAddressForm((current) => ({ ...current, phone }));
    setAddressErrors((current) => ({ ...current, phone: "" }));
  };

  const handlePincodeChange = (e) => {
    const pincode = e.target.value.replace(/\D/g, "").slice(0, 6);
    setAddressForm((current) => ({ ...current, pincode }));
    setAddressErrors((current) => ({ ...current, pincode: "" }));
  };

  const validateAddress = () => {
    const errors = {};
    const { name, phone, address, city, state, pincode } = addressForm;

    if (!name.trim()) errors.name = "Full name is required.";
    if (!phone.trim()) errors.phone = "Phone number is required.";
    if (!address.trim()) errors.address = "Address is required.";
    if (!city.trim()) errors.city = "City is required.";
    if (!state.trim()) errors.state = "State is required.";
    if (!pincode.trim() || pincode.length !== 6)
      errors.pincode = "Valid 6-digit pincode is required.";

    return errors;
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    const errors = validateAddress();
    setAddressErrors(errors);

    if (Object.keys(errors).length > 0) return;

    try {
      const payload = {
        userId: user?._id,
        addressId: editingAddress,
        ...addressForm,
      };

      // 2. SAVE ADDRESS
      const res = await axios.post(`${API_BASE_URL}/address`, payload, {
        headers: {
          "Content-Type": "Application/json",
          Authorization: "Bearer " + token,
        },
      });
      const data = res.data;

      if (!data.success) {
        throw new Error(data.message || "Failed to save address.");
      }

      // Sync updated addresses
      const updatedUser = { ...user, addresses: data.addresses };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      const formattedAddrs = data.addresses.map((a, idx) => ({
        id: a._id,
        type: a.addressType
          ? a.addressType.charAt(0).toUpperCase() + a.addressType.slice(1)
          : "Home",
        name: a.fullName,
        phone: a.phone,
        address: a.addressLine1,
        city: a.city,
        state: a.state,
        pincode: a.pincode,
        isDefault: a.isDefault,
      }));

      setAddresses(formattedAddrs);
      resetAddressForm();
      setShowAddressForm(false);
      setSuccessMsg("Address saved successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      handleAuthError(err);

      console.error(err);
      setApiError(
        err.response?.data?.message || err.message || "Error saving address.",
      );
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address.id);
    setAddressForm({
      type: address.type,
      name: address.name,
      phone: address.phone,
      address: address.address,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    });
    setAddressErrors({});
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (id) => {
    try {
      // 3. DELETE ADDRESS
      const res = await axios.delete(`${API_BASE_URL}/address`, {
        data: { userId: user?._id, addressId: id },
        headers: {
          "Content-Type": "Application/json",
          Authorization: "Bearer " + token,
        },
      });

      const data = res.data;
      if (!data.success) throw new Error(data.message);

      const updatedAddrs = addresses.filter((a) => a.id !== id);
      setAddresses(updatedAddrs);

      const updatedUser = { ...user, addresses: data.addresses };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (err) {
      handleAuthError(err);

      console.error(err);
    }
  };

  const handleSetDefault = (id) => {
    setAddresses((current) =>
      current.map((address) => ({
        ...address,
        isDefault: address.id === id,
      })),
    );
  };

  const closeAddressModal = () => {
    resetAddressForm();
    setShowAddressForm(false);
  };

  /* PASSWORD FUNCTIONS */
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
    setPasswordErrors((current) => ({ ...current, [name]: "" }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    const errors = {};
    if (!currentPassword)
      errors.currentPassword = "Current password is required.";
    if (!newPassword || newPassword.length < 8)
      errors.newPassword = "Must be at least 8 characters.";
    if (newPassword !== confirmPassword)
      errors.confirmPassword = "Passwords do not match.";

    setPasswordErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      // 4. CHANGE PASSWORD
      const res = await axios.put(
        `${API_BASE_URL}/change-password`,
        {
          userId: user?._id,
          currentPassword,
          newPassword,
        },
        {
          headers: {
            "Content-Type": "Application/json",
            Authorization: "Bearer " + token,
          },
        },
      );

      const data = res.data;
      if (!data.success)
        throw new Error(data.message || "Failed to change password.");

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordForm(false);
      setSuccessMsg("Password updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      handleAuthError(err);

      console.error(err);
      setPasswordErrors({
        currentPassword:
          err.response?.data?.message ||
          err.message ||
          "Password change failed.",
      });
    }
  };

  /* SIGN OUT FUNCTION */
  const handleConfirmLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setShowLogoutConfirm(false);
    navigate("/login");
  };

  const initials = `${(profile.firstName || "A").charAt(0)}${(
    profile.lastName || "S"
  ).charAt(0)}`.toUpperCase();

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* SUCCESS / ERROR ALERTS */}
        {successMsg && (
          <div className="mb-6 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-800">
            {successMsg}
          </div>
        )}
        {apiError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {apiError}
          </div>
        )}

        {/* PAGE HEADER */}
        <div className="flex flex-col gap-2">
          <p className="mono text-[10px] uppercase tracking-[0.2em] text-primary">
            My account
          </p>
          <h1 className="display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Your profile.
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage your personal information, delivery addresses and account
            preferences.
          </p>
        </div>

        {/* PROFILE HERO */}
        <section className="mt-8 overflow-hidden rounded-[1.5rem] border border-border bg-card">
          <div className="bg-[#203b42] p-6 text-white sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="grid size-20 shrink-0 place-items-center rounded-2xl bg-accent text-2xl font-black text-slate-900">
                  {initials}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="display text-2xl font-extrabold">
                      {profile.firstName} {profile.lastName}
                    </h2>
                  </div>

                  <p className="mt-1 text-sm text-white/60">{profile.email}</p>
                  <p className="mt-1 text-xs text-white/50">
                    SmartCommerce customer
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={openEditProfile}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/20"
              >
                <Edit3 size={16} />
                Edit profile
              </button>
            </div>
          </div>

          {/* Account stats */}
          <div className="grid grid-cols-2 divide-x divide-border sm:grid-cols-4">
            <Link to="/orders" className="p-5 transition hover:bg-muted">
              <Package size={18} className="text-primary" />
              <p className="mt-3 text-2xl font-extrabold">0</p>
              <p className="mt-1 text-xs text-muted-foreground">Orders</p>
            </Link>

            <Link to="/wishlist" className="p-5 transition hover:bg-muted">
              <Heart size={18} className="text-primary" />
              <p className="mt-3 text-2xl font-extrabold">0</p>
              <p className="mt-1 text-xs text-muted-foreground">Wishlist</p>
            </Link>

            <div className="border-t border-border p-5 sm:border-t-0">
              <MapPin size={18} className="text-primary" />
              <p className="mt-3 text-2xl font-extrabold">{addresses.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Addresses</p>
            </div>

            <div className="border-t border-border p-5 sm:border-t-0">
              <ShieldCheck size={18} className="text-primary" />
              <p className="mt-3 text-sm font-extrabold">Active</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Account status
              </p>
            </div>
          </div>
        </section>

        {/* PERSONAL INFORMATION */}
        <section className="mt-8 rounded-[1.25rem] border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-6">
            <div>
              <p className="mono text-[10px] uppercase tracking-[0.2em] text-primary">
                Personal details
              </p>
              <h2 className="display mt-1 text-xl font-extrabold">
                Personal information
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Keep your account information up to date.
              </p>
            </div>

            {!editingProfile && (
              <button
                type="button"
                onClick={openEditProfile}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold transition hover:border-primary hover:text-primary"
              >
                <Pencil size={15} />
                Edit
              </button>
            )}
          </div>

          {!editingProfile ? (
            <div className="grid gap-5 p-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl bg-muted p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User size={15} />
                  <span className="text-[11px] font-semibold">Full name</span>
                </div>
                <p className="mt-2 text-sm font-bold">
                  {profile.firstName} {profile.lastName}
                </p>
              </div>

              <div className="rounded-xl bg-muted p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail size={15} />
                  <span className="text-[11px] font-semibold">
                    Email address
                  </span>
                </div>
                <p className="mt-2 break-all text-sm font-bold">
                  {profile.email}
                </p>
              </div>

              <div className="rounded-xl bg-muted p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone size={15} />
                  <span className="text-[11px] font-semibold">
                    Phone number
                  </span>
                </div>
                <p className="mt-2 text-sm font-bold">+91 {profile.phone}</p>
              </div>

              <div className="rounded-xl bg-muted p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User size={15} />
                  <span className="text-[11px] font-semibold">Gender</span>
                </div>
                <p className="mt-2 text-sm font-bold">{profile.gender}</p>
              </div>

              <div className="rounded-xl bg-muted p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays size={15} />
                  <span className="text-[11px] font-semibold">
                    Date of birth
                  </span>
                </div>
                <p className="mt-2 text-sm font-bold">
                  {profile.dateOfBirth || "Not provided"}
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} noValidate className="p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold">First name</label>
                  <input
                    name="firstName"
                    value={profileForm.firstName}
                    onChange={handleProfileChange}
                    className={`mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary ${profileErrors.firstName ? "border-red-500" : "border-border"}`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold">Last name</label>
                  <input
                    name="lastName"
                    value={profileForm.lastName}
                    onChange={handleProfileChange}
                    className={`mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary ${profileErrors.lastName ? "border-red-500" : "border-border"}`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                    className={`mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary ${profileErrors.email ? "border-red-500" : "border-border"}`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold">Phone</label>
                  <input
                    type="tel"
                    maxLength={10}
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleProfilePhoneChange}
                    className={`mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary ${profileErrors.phone ? "border-red-500" : "border-border"}`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold">Gender</label>
                  <select
                    name="gender"
                    value={profileForm.gender}
                    onChange={handleProfileChange}
                    className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold">Date of birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={profileForm.dateOfBirth}
                    onChange={handleProfileChange}
                    className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-border pt-5">
                <button
                  type="button"
                  onClick={cancelProfileEdit}
                  className="rounded-xl border border-border px-5 py-3 text-sm font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:opacity-90"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  Save changes
                </button>
              </div>
            </form>
          )}
        </section>

        {/* ADDRESSES SECTION */}
        <section className="mt-8 rounded-[1.25rem] border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mono text-[10px] uppercase tracking-[0.2em] text-primary">
                Delivery
              </p>
              <h2 className="display mt-2 text-xl font-extrabold">
                Saved addresses
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage your delivery addresses for faster checkout.
              </p>
            </div>

            <button
              type="button"
              onClick={openAddAddress}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90"
            >
              <Plus size={16} /> Add address
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`rounded-2xl border p-5 ${address.isDefault ? "border-primary bg-teal-50/50" : "border-border bg-background"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
                      <MapPin size={18} />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold">{address.type}</h3>
                        {address.isDefault && (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-white">
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {address.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleEditAddress(address)}
                      className="grid size-8 place-items-center rounded-lg hover:bg-muted"
                    >
                      <Pencil size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(address.id)}
                      className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 text-sm leading-6 text-muted-foreground">
                  <p>{address.address}</p>
                  <p>
                    {address.city}, {address.state} - {address.pincode}
                  </p>
                  <p className="mt-1 font-medium text-foreground">
                    Phone: {address.phone}
                  </p>
                </div>

                {!address.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(address.id)}
                    className="mt-4 text-xs font-bold text-primary hover:underline"
                  >
                    Make default
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* SECURITY SECTION */}
        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[1.25rem] border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">
                <Lock size={19} />
              </div>
              <div>
                <h2 className="font-bold">Password & security</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Keep your account protected.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl bg-muted p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold">Password</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Last updated recently
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold transition hover:border-primary hover:text-primary"
                >
                  <LockKeyhole size={16} />
                  {showPasswordForm ? "Cancel" : "Change password"}
                </button>
              </div>
            </div>

            {showPasswordForm && (
              <form
                onSubmit={handlePasswordSubmit}
                noValidate
                className="mt-5 rounded-2xl border border-border bg-muted/40 p-5"
              >
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-bold">
                      Current password
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter current password"
                      className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
                    />
                    {passwordErrors.currentPassword && (
                      <p className="mt-1 text-xs text-red-600">
                        {passwordErrors.currentPassword}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold">
                      New password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password"
                      className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
                    />
                    {passwordErrors.newPassword && (
                      <p className="mt-1 text-xs text-red-600">
                        {passwordErrors.newPassword}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold">
                      Confirm new password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Confirm new password"
                      className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="mt-1 text-xs text-red-600">
                        {passwordErrors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="submit"
                      className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:opacity-90"
                    >
                      Update password
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Quick actions */}
          <div className="rounded-[1.25rem] border border-border bg-card p-6">
            <h2 className="font-bold">Quick account actions</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Quickly access the sections you use most.
            </p>

            <div className="mt-5 space-y-2">
              <Link
                to="/orders"
                className="flex items-center justify-between rounded-xl border border-border p-4 transition hover:border-primary hover:bg-secondary"
              >
                <div className="flex items-center gap-3">
                  <Package size={17} className="text-primary" />
                  <span className="text-sm font-bold">My orders</span>
                </div>
                <ChevronRight size={16} />
              </Link>

              <Link
                to="/wishlist"
                className="flex items-center justify-between rounded-xl border border-border p-4 transition hover:border-primary hover:bg-secondary"
              >
                <div className="flex items-center gap-3">
                  <Heart size={17} className="text-primary" />
                  <span className="text-sm font-bold">My wishlist</span>
                </div>
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* SIGN OUT ACTION */}
        <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-border bg-card px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid size-10 place-items-center rounded-xl bg-red-50 text-red-600">
              <LogOut size={17} />
            </div>
            <div>
              <p className="text-sm font-bold">Sign out</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Sign out of your SmartCommerce account on this device.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-100 hover:text-red-700"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>

        {/* LOGOUT CONFIRMATION MODAL */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl">
              <div className="grid size-12 place-items-center rounded-2xl bg-red-50 text-red-600">
                <LogOut size={20} />
              </div>
              <h3 className="display mt-5 text-xl font-bold">
                Sign out of SmartCommerce?
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                You will need to sign in again to access your account.
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-bold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLogout}
                  className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ADDRESS FORM MODAL */}
        {showAddressForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-card shadow-2xl">
              <div className="flex items-center justify-between border-b border-border p-5">
                <div>
                  <p className="mono text-[10px] uppercase tracking-widest text-primary">
                    {editingAddress ? "Update address" : "New address"}
                  </p>
                  <h2 className="display mt-1 text-xl font-extrabold">
                    {editingAddress
                      ? "Edit delivery address"
                      : "Add delivery address"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeAddressModal}
                  className="grid size-9 place-items-center rounded-lg hover:bg-muted"
                >
                  <X size={18} />
                </button>
              </div>

              <form
                onSubmit={handleSaveAddress}
                noValidate
                className="space-y-5 p-5"
              >
                <div>
                  <label className="text-xs font-bold">Address type</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {["Home", "Work", "Other"].map((type) => (
                      <button
                        type="button"
                        key={type}
                        onClick={() =>
                          setAddressForm((curr) => ({ ...curr, type }))
                        }
                        className={`rounded-xl border px-4 py-2 text-sm font-semibold ${addressForm.type === type ? "border-primary bg-secondary text-primary" : "border-border"}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold">Full name</label>
                    <input
                      name="name"
                      value={addressForm.name}
                      onChange={handleAddressChange}
                      className={`mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:border-primary ${addressErrors.name ? "border-red-500" : "border-border"}`}
                      placeholder="Enter full name"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold">Phone number</label>
                    <input
                      name="phone"
                      type="tel"
                      maxLength={10}
                      value={addressForm.phone}
                      onChange={handleAddressPhoneChange}
                      className={`mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:border-primary ${addressErrors.phone ? "border-red-500" : "border-border"}`}
                      placeholder="10 digit mobile number"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold">Address</label>
                  <textarea
                    name="address"
                    rows={3}
                    value={addressForm.address}
                    onChange={handleAddressChange}
                    className={`mt-2 w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:border-primary ${addressErrors.address ? "border-red-500" : "border-border"}`}
                    placeholder="House / Flat / Street / Area"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-bold">City</label>
                    <input
                      name="city"
                      value={addressForm.city}
                      onChange={handleAddressChange}
                      className={`mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:border-primary ${addressErrors.city ? "border-red-500" : "border-border"}`}
                      placeholder="Bengaluru"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold">State</label>
                    <input
                      name="state"
                      value={addressForm.state}
                      onChange={handleAddressChange}
                      className={`mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:border-primary ${addressErrors.state ? "border-red-500" : "border-border"}`}
                      placeholder="Karnataka"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold">Pincode</label>
                    <input
                      name="pincode"
                      maxLength={6}
                      value={addressForm.pincode}
                      onChange={handlePincodeChange}
                      className={`mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:border-primary ${addressErrors.pincode ? "border-red-500" : "border-border"}`}
                      placeholder="560038"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-border pt-5">
                  <button
                    type="button"
                    onClick={closeAddressModal}
                    className="rounded-xl border border-border px-5 py-3 text-sm font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:opacity-90"
                  >
                    <Check size={16} />
                    {editingAddress ? "Save changes" : "Save address"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default ProfilePage;
