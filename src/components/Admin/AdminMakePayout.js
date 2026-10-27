import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  IndianRupee,
  Building2,
  CreditCard,
  CalendarDays,
  FileText,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
  Store,
  RefreshCw,
} from "lucide-react";

// Safe auth handler
let handleAuthError = null;
try {
  const authModule = require("../../AuthRouteAdmin");
  handleAuthError = authModule.handleAuthError;
} catch (e) {
  // Ignore if path differs
}

const API_BASE_URL = "https://smart-commerce-platform-backend.onrender.com/api";

const getToken = () =>
  localStorage.getItem("adminToken") ||
  localStorage.getItem("token") ||
  localStorage.getItem("userToken") ||
  null;

const money = (val) =>
  `₹${Number(val || 0).toLocaleString("en-IN")}`;

const AdminMakePayout = () => {
  const navigate = useNavigate();
  const { payoutId: routePayoutId, vendorId: routeVendorId } = useParams();
  const [searchParams] = useSearchParams();

  const targetId =
    routePayoutId ||
    routeVendorId ||
    searchParams.get("vendorId") ||
    searchParams.get("payoutId") ||
    "";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Dynamic settlement and vendor list
  const [vendorsList, setVendorsList] = useState([]);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [settlement, setSettlement] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    amount: "",
    paymentMethod: "Bank Transfer",
    payoutDate: new Date().toISOString().split("T")[0],
    transactionId: "",
    accountName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
    note: "",
  });

  // Apply selected vendor to form and state
  const applyVendorSettlement = (vendorObj) => {
    if (!vendorObj) return;

    const vId = vendorObj.vendorId || vendorObj._id || vendorObj.id;
    setSelectedVendorId(String(vId));

    const bank = vendorObj.vendor?.bankDetails || {};
    const pending = Math.max(Number(vendorObj.pendingAmount || 0), 0);
    const gross = Number(vendorObj.grossSales || vendorObj.amount || 0);
    const comm = Number(vendorObj.commission || Math.round(gross * 0.02));
    const net = Number(vendorObj.netPayable || gross - comm);

    setSettlement({
      ...vendorObj,
      grossSales: gross,
      commission: comm,
      netPayable: net,
      pendingAmount: pending > 0 ? pending : net,
    });

    setFormData((prev) => ({
      ...prev,
      amount: pending > 0 ? pending : net > 0 ? net : "",
      accountName: bank.accountHolderName || vendorObj.vendor?.name || "",
      accountNumber: bank.accountNumber || "",
      ifscCode: bank.ifscCode || "",
      upiId: bank.upiId || "",
    }));
  };

  // Fetch settlements and vendors dynamically
  const fetchSettlementsData = async () => {
    const token = getToken();
    try {
      setLoading(true);
      setError("");
      const headers = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      // 1. Fetch from admin payouts
      let rawList = [];
      try {
        const res = await axios.get(`${API_BASE_URL}/admin/payouts`, { headers });
        if (res.data && res.data.success) {
          rawList = res.data.vendorsSummary || res.data.payouts || [];
        }
      } catch (err) {
        handleAuthError(err);
        console.warn("Direct payouts fetch failed, falling back to vendors list...");
      }
      // 2. If list is still empty, fetch registered vendors directly from /api/vendors
      if (!rawList || rawList.length === 0) {
        const vendorsRes = await axios.get(`${API_BASE_URL}/vendors`, { headers });
        const fetchedVendors =
          vendorsRes.data?.vendors ||
          vendorsRes.data?.data ||
          (Array.isArray(vendorsRes.data) ? vendorsRes.data : []);
        rawList = fetchedVendors.map((v) => {
          const storeName =
            v.storeName ||
            v.name ||
            (v.user ? `${v.user.firstName || ""} ${v.user.lastName || ""}`.trim() : "") ||
            "Vendor Store";
          return {
            id: `SET-${String(v._id || v.id).slice(-6).toUpperCase()}`,
            vendorId: v._id || v.id,
            vendor: {
              name: storeName,
              storeName: storeName,
              email: v.email || v.user?.email || "—",
              bankDetails: v.bankDetails || {},
            },
            grossSales: 0,
            commission: 0,
            netPayable: 0,
            paidAmount: 0,
            pendingAmount: 0,
            month: new Date().toLocaleDateString("en-IN", {
              month: "long",
              year: "numeric",
            }),
          };
        });
      }
      setVendorsList(rawList);
      if (rawList.length > 0) {
        let currentTarget = null;
        if (targetId) {
          currentTarget = rawList.find(
            (v) =>
              String(v.vendorId) === String(targetId) ||
              String(v.id) === String(targetId) ||
              String(v._id) === String(targetId)
          );
        }
        if (!currentTarget) {
          currentTarget =
            rawList.find((v) => Number(v.pendingAmount) > 0) || rawList[0];
        }
        if (currentTarget) {
          applyVendorSettlement(currentTarget);
        }
      } else {
        setError("No registered vendors found in the database. Please onboard a vendor first.");
      }
    } catch (err) {
      if (typeof handleAuthError === "function") handleAuthError(err, navigate);
      console.error("Error loading payout data:", err);
      setError(
        err.response?.data?.message ||
          "Failed to retrieve vendor financial ledger from server."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlementsData();
  }, [targetId]);

  // Vendor switch dropdown
  const handleVendorSwitch = (vId) => {
    const chosen = vendorsList.find(
      (v) =>
        String(v.vendorId) === String(vId) ||
        String(v.id) === String(vId) ||
        String(v._id) === String(vId)
    );
    if (chosen) {
      applyVendorSettlement(chosen);
      setError("");
    }
  };

  // Calculations
  const remainingAmount = useMemo(() => {
    if (!settlement) return 0;
    return Math.max(Number(settlement.pendingAmount || 0), 0);
  }, [settlement]);

  const payoutAmount = Number(formData.amount || 0);
  const balanceAfterPayout = Math.max(remainingAmount - payoutAmount, 0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError("");
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAmountChange = (e) => {
    let val = Number(e.target.value);
    if (val < 0) val = 0;
    setError("");
    setFormData((prev) => ({ ...prev, amount: val }));
  };

  // Submit Payout Disbursement
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedVendorId) {
      setError("Please select a vendor recipient.");
      return;
    }

    if (payoutAmount <= 0) {
      setError("Please enter a valid disbursement amount.");
      return;
    }

    if (payoutAmount > remainingAmount && remainingAmount > 0) {
      setError(
        `Payout amount cannot exceed the pending balance of ${money(
          remainingAmount
        )}.`
      );
      return;
    }

    if (!formData.transactionId.trim()) {
      setError(
        "Payment Reference / Bank UTR Number is required for verification."
      );
      return;
    }

    try {
      setSubmitting(true);
      const token = getToken();

      const payload = {
        vendorId: selectedVendorId,
        amount: payoutAmount,
        payoutMethod:
          formData.paymentMethod === "UPI" ? "upi" : "bank_transfer",
        paymentReference: formData.transactionId.trim(),
        adminNote: formData.note.trim() || "Vendor settlement disbursed",
        periodStart:
          settlement?.createdAt || new Date(Date.now() - 30 * 86400000),
        periodEnd: new Date(),
      };

      const res = await axios.post(`${API_BASE_URL}/admin/payouts`, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data && res.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/admin/payouts");
        }, 1500);
      }
    } catch (err) {
      if (typeof handleAuthError === "function") handleAuthError(err, navigate);
      console.error("Disbursement Error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to record payout. Please verify server connection."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-slate-400 bg-white rounded-3xl border border-slate-200">
        <Loader2 size={38} className="animate-spin text-[#287b6d] mb-3" />
        <p className="text-sm font-semibold text-slate-700">
          Loading vendor settlement ledger...
        </p>
      </div>
    );
  }

  const vendorDisplay =
    settlement?.vendor?.storeName ||
    settlement?.vendor?.name ||
    "Vendor Settlement";

  const periodDisplay =
    settlement?.month ||
    new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/payouts"
            className="p-2.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition shadow-xs"
            title="Back to Payouts"
          >
            <ArrowLeft size={19} className="text-slate-600" />
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Disburse Vendor Payout
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Execute bank wire or UPI transfer for {vendorDisplay}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchSettlementsData}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
          <div className="flex items-center gap-2 px-3.5 py-2 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-xl text-xs font-semibold">
            <CalendarDays size={15} />
            <span>Period: {periodDisplay}</span>
          </div>
        </div>
      </div>

      {/* SUCCESS BANNER */}
      {success && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 text-xs font-semibold shadow-xs">
          <CheckCircle size={20} className="text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold">Payout Disbursed Successfully!</p>
            <p className="text-emerald-700 text-[11px] mt-0.5">
              Transaction logged in platform ledger. Redirecting to payouts list...
            </p>
          </div>
        </div>
      )}

      {/* ERROR BANNER */}
      {error && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 text-xs font-semibold shadow-xs">
          <AlertCircle size={20} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Net Payable
          </span>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {money(settlement?.netPayable || 0)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            After 2% platform fee
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
            Already Settled
          </span>
          <p className="text-2xl font-black text-emerald-600 mt-2">
            {money(settlement?.paidAmount || 0)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Disbursed to date
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
            Outstanding Due
          </span>
          <p className="text-2xl font-black text-orange-600 mt-2">
            {money(remainingAmount)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Awaiting payment
          </span>
        </div>

        <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-md">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300">
            This Disbursement
          </span>
          <p className="text-2xl font-black text-white mt-2">
            {money(payoutAmount)}
          </p>
          <span className="text-[11px] text-slate-300 mt-1 block">
            Remaining: {money(balanceAfterPayout)}
          </span>
        </div>
      </div>

      {/* MAIN FORM */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* VENDOR RECIPIENT SELECTION */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Vendor Recipient
              </h2>
              <p className="text-xs text-slate-400">
                Select target vendor to load settlement ledger and verified bank profile
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                Active Vendor
              </label>
              <div className="relative">
                <Store
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <select
                  value={selectedVendorId}
                  onChange={(e) => handleVendorSwitch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-slate-400 outline-none cursor-pointer"
                >
                  {vendorsList.map((v) => {
                    const id = v.vendorId || v._id || v.id;
                    const name =
                      v.vendor?.storeName || v.vendor?.name || "Vendor";
                    const pending = money(v.pendingAmount || 0);
                    return (
                      <option key={id} value={id}>
                        {name} (Pending: {pending})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                Settlement ID
              </label>
              <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800">
                {settlement?.id || `SET-${String(selectedVendorId).slice(-6).toUpperCase()}`}
              </div>
            </div>
          </div>
        </div>

        {/* PAYOUT AMOUNT */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <IndianRupee size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Disbursement Amount
              </h2>
              <p className="text-xs text-slate-400">
                Specify transfer amount (up to total outstanding settlement)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                Transfer Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleAmountChange}
                  min="1"
                  max={remainingAmount > 0 ? remainingAmount : undefined}
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-slate-400 outline-none"
                />
              </div>

              <div className="flex items-center justify-between mt-2 text-[11px]">
                <span className="text-slate-400">
                  Max Payable: {money(remainingAmount)}
                </span>
                {remainingAmount > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({ ...p, amount: remainingAmount }))
                    }
                    className="text-[#287b6d] hover:underline font-bold"
                  >
                    Pay Full Due
                  </button>
                )}
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase text-slate-400">
                  Balance After Payment
                </span>
                <p
                  className={`text-2xl font-black mt-1 ${
                    balanceAfterPayout === 0
                      ? "text-emerald-600"
                      : "text-orange-600"
                  }`}
                >
                  {money(balanceAfterPayout)}
                </p>
              </div>

              <p className="text-[11px] text-slate-500 mt-2">
                {balanceAfterPayout === 0
                  ? "✓ This cycle will be marked fully settled."
                  : "ℹ Remaining balance stays available for future payouts."}
              </p>
            </div>
          </div>
        </div>

        {/* PAYMENT DETAILS */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <CreditCard size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Payment & Beneficiary Details
              </h2>
              <p className="text-xs text-slate-400">
                Verify target bank account and enter wire transaction UTR
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                Transfer Method *
              </label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-slate-400 outline-none"
              >
                <option value="Bank Transfer">Bank Transfer (NEFT / RTGS / IMPS)</option>
                <option value="UPI">UPI Payment</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                Disbursement Date *
              </label>
              <input
                type="date"
                name="payoutDate"
                value={formData.payoutDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-slate-400 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                Bank UTR / Transaction Reference ID *
              </label>
              <input
                type="text"
                name="transactionId"
                value={formData.transactionId}
                onChange={handleChange}
                placeholder="e.g. UTR1029384812 or UPI/391029384"
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:bg-white focus:border-slate-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                Beneficiary Account Holder
              </label>
              <input
                type="text"
                name="accountName"
                value={formData.accountName}
                onChange={handleChange}
                placeholder="Account Holder Name"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-slate-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                Bank Account Number
              </label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                placeholder="Account number"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:border-slate-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                IFSC Code
              </label>
              <input
                type="text"
                name="ifscCode"
                value={formData.ifscCode}
                onChange={handleChange}
                placeholder="e.g. HDFC0001234"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase text-slate-800 focus:bg-white focus:border-slate-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                Vendor UPI ID
              </label>
              <input
                type="text"
                name="upiId"
                value={formData.upiId}
                onChange={handleChange}
                placeholder="vendor@upi"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:border-slate-400 outline-none"
              />
            </div>
          </div>
        </div>

        {/* FINANCIAL SUMMARY */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 mb-2 text-slate-900">
            <FileText size={18} className="text-[#287b6d]" />
            <h3 className="text-sm font-bold">Cycle Financial Summary</h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Gross Fulfilled Sales</span>
              <span className="font-semibold text-slate-900">
                {money(settlement?.grossSales || 0)}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">
                Platform Commission Fee (2%)
              </span>
              <span className="font-semibold text-rose-600">
                - {money(settlement?.commission || (settlement?.grossSales || 0) * 0.02)}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-t border-slate-200 text-sm">
              <span className="font-bold text-slate-900">
                Net Vendor Settlement
              </span>
              <span className="font-black text-slate-900">
                {money(settlement?.netPayable || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* NOTE */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
            Internal Settlement Note (Optional)
          </label>
          <textarea
            name="note"
            rows={3}
            value={formData.note}
            onChange={handleChange}
            placeholder="Add internal bank transfer or verification notes..."
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-slate-400 outline-none"
          />
        </div>

        {/* ACTIONS */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/admin/payouts"
            className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition shadow-xs"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting || success}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-[#287b6d] transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Recording Payout...</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>Confirm Disbursement</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminMakePayout;