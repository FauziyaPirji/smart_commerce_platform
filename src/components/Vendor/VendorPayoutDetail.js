import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRouteVendor";
import {
  ArrowLeft,
  Wallet,
  CheckCircle,
  ShieldCheck,
  Download,
  CreditCard,
  Building2,
  CalendarDays,
  Loader2,
  AlertCircle,
  Printer,
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000/api/vendors";

const getToken = () =>
  localStorage.getItem("vendorToken") || localStorage.getItem("token") || null;

const money = (val) =>
  `₹${new Intl.NumberFormat("en-IN").format(Number(val) || 0)}`;

const VendorPayoutDetail = () => {
  const { payoutId } = useParams();
  const navigate = useNavigate();

  const [payout, setPayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPayoutDetails = async () => {
      const token = getToken();

      if (!token) {
        navigate("/vendor/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const res = await axios.get(`${API_BASE_URL}/payouts/${payoutId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (res.data && res.data.success) {
          setPayout(res.data.payout);
        } else {
          setError("Payout settlement record could not be found.");
        }
      } catch (err) {
        handleAuthError(err);
        console.error("Error fetching payout detail:", err);
        setError(
          err.response?.data?.message || "Failed to load settlement details.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPayoutDetails();
  }, [payoutId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-slate-400 bg-white rounded-3xl border border-slate-200 max-w-3xl mx-auto">
        <Loader2 size={36} className="animate-spin text-blue-600 mb-3" />
        <p className="text-xs font-semibold text-slate-600">
          Loading settlement statement...
        </p>
      </div>
    );
  }

  if (error || !payout) {
    return (
      <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-3xl p-10 text-center shadow-xs">
        <Wallet size={46} className="mx-auto text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Payout Not Found</h2>
        <p className="text-slate-500 mt-2 text-xs">
          {error || "The settlement record you requested does not exist."}
        </p>
        <Link
          to="/vendor/payouts"
          className="inline-flex items-center gap-2 mt-5 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-blue-600 transition"
        >
          <ArrowLeft size={16} />
          <span>Back to Payout Settlements</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Back & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/vendor/payouts"
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition shadow-xs"
            title="Back to list"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Settlement Statement
            </h1>
            <p className="text-xs text-slate-500">
              Payout Reference #{payout.id}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-blue-600 transition inline-flex items-center gap-2 shadow-xs"
        >
          <Printer size={15} />
          <span>Print Receipt</span>
        </button>
      </div>

      {/* Main Statement Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
        {/* Header Status */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck size={26} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase">
                Settlement Status
              </p>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 mt-1">
                <CheckCircle size={14} /> {payout.status}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 font-semibold uppercase">
              Settlement Cycle
            </p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              {payout.period}
            </p>
          </div>
        </div>

        {/* Itemized Calculation (2% Platform Commission, No Refunds) */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Fulfillment Earnings Breakdown
          </h2>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600 font-medium">
                Gross Store Sales
              </span>
              <span className="font-bold text-slate-900">
                {money(payout.grossSales)}
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-100 text-rose-600">
              <span className="font-medium">Platform Commission (2%)</span>
              <span className="font-bold">-{money(payout.commission)}</span>
            </div>

            <div className="flex justify-between py-3.5 text-base font-black text-slate-900 bg-slate-50 px-4 rounded-xl border border-slate-100 mt-2">
              <span>Net Wired Amount</span>
              <span className="text-emerald-600">
                {money(payout.netAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Bank & Transfer Verification Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl space-y-1 border border-slate-100">
            <span className="text-slate-400 font-semibold uppercase text-[10px] block">
              Credited Bank Account
            </span>
            <p className="font-bold text-slate-900 text-sm">
              {payout.bankName}
            </p>
            <p className="text-slate-500 font-mono">
              {payout.accountNumber} {payout.ifscCode && `(${payout.ifscCode})`}
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl space-y-1 border border-slate-100">
            <span className="text-slate-400 font-semibold uppercase text-[10px] block">
              Wire Reference / Bank UTR
            </span>
            <p className="font-mono font-bold text-blue-600 text-sm">
              {payout.transactionId}
            </p>
            <p className="text-slate-500">Disbursed on: {payout.payoutDate}</p>
          </div>
        </div>

        {payout.adminNote && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
            <span className="font-bold block text-slate-700 mb-0.5">
              Admin Note:
            </span>
            {payout.adminNote}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorPayoutDetail;
