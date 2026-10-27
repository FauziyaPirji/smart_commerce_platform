import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRouteVendor";
import {
  ArrowLeft,
  MapPin,
  Loader2,
  AlertCircle,
  ShoppingBag,
  Mail,
  Phone,
  IndianRupee,
  Calendar,
  CheckCircle2,
  Clock,
  Package,
  CreditCard,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000/api";

const VendorViewCustomer = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      const token = localStorage.getItem("vendorToken");

      if (!token) {
        navigate("/vendor/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await axios.get(
          `${API_BASE_URL}/vendors/customers/${customerId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.data && response.data.success) {
          setCustomer(response.data.customer);
        } else {
          setError(response.data?.message || "Customer details not found.");
        }
      } catch (err) {
        handleAuthError(err);
        console.error("Error fetching customer details:", err);
        if (err.response?.status === 401) {
          localStorage.removeItem("vendorToken");
          navigate("/vendor/login");
        } else {
          setError(
            err.response?.data?.message ||
              "Failed to load customer details from server.",
          );
        }
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      fetchCustomerDetails();
    }
  }, [customerId, navigate]);

  const toggleOrderExpand = (id) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <Loader2
          size={36}
          className="mx-auto text-blue-600 animate-spin mb-3"
        />
        <p className="text-sm text-slate-500 font-medium">
          Loading customer profile & purchase history...
        </p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Link
          to="/vendor/customers"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft size={16} /> Back to Customers
        </Link>
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <AlertCircle size={40} className="mx-auto text-rose-500" />
          <h2 className="text-lg font-bold text-slate-900">
            Customer Not Found
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {error || "Unable to retrieve details for this customer."}
          </p>
        </div>
      </div>
    );
  }

  const initials = customer.name
    ? customer.name.trim().substring(0, 2).toUpperCase()
    : "CU";

  const totalSpent = Number(customer.totalSpent) || 0;
  const orders = Array.isArray(customer.recentVendorOrders)
    ? customer.recentVendorOrders
    : [];
  const avgOrderValue =
    orders.length > 0 ? Math.round(totalSpent / orders.length) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/vendor/customers"
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition shadow-sm"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">
                {customer.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                {customer.status || "Active Buyer"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Customer & Store Purchase Analytics
            </p>
          </div>
        </div>
      </div>

      {/* 4 Metric Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Total Spent
            </span>
            <IndianRupee size={16} className="text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-emerald-600">
            ₹{totalSpent.toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-slate-400">At your store</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Total Orders
            </span>
            <ShoppingBag size={16} className="text-blue-500" />
          </div>
          <p className="text-xl font-bold text-slate-900">{orders.length}</p>
          <span className="text-[10px] text-slate-400">
            Purchases completed
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Avg Order Value
            </span>
            <Package size={16} className="text-indigo-500" />
          </div>
          <p className="text-xl font-bold text-slate-900">
            ₹{avgOrderValue.toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-slate-400">Per purchase</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Last Order
            </span>
            <Calendar size={16} className="text-amber-500" />
          </div>
          <p className="text-sm font-bold text-slate-800 mt-1">
            {orders[0]?.date || "—"}
          </p>
          <span className="text-[10px] text-slate-400">Most recent date</span>
        </div>
      </div>

      {/* Customer Profile & Shipping Address Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shrink-0 shadow-sm">
            {initials}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {customer.name}
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <Mail size={13} className="text-slate-400" />{" "}
                {customer.email || "No email"}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Phone size={13} className="text-slate-400" />{" "}
                {customer.phone || "No phone"}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Shipping Address Box */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-start gap-2.5">
            <MapPin size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Full Shipping Address
              </span>
              <p className="text-xs font-semibold text-slate-800 mt-1 leading-relaxed">
                {customer.address && customer.address !== "Address not provided"
                  ? customer.address
                  : "No shipping address recorded for this customer."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Complete Store Order History (Pro Version with Item Breakdown) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              All Purchases from Your Store
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete catalog items bought by this customer
            </p>
          </div>
          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold">
            {orders.length} Order(s)
          </span>
        </div>

        {orders.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {orders.map((order) => {
              const orderAmount = Number(order.amount) || 0;
              const isExpanded = expandedOrderId === order.id;
              const items = Array.isArray(order.items) ? order.items : [];

              return (
                <div
                  key={order.id}
                  className="p-6 hover:bg-slate-50/50 transition"
                >
                  {/* Top Bar of the Order */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">
                          {order.id}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          {order.status || "Processing"}
                        </span>
                        {order.paymentMethod && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                            {order.paymentMethod.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar size={13} className="text-slate-400" />
                        Placed on {order.date}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          Total Paid
                        </span>
                        <span className="text-base font-bold text-emerald-600">
                          ₹{orderAmount.toLocaleString("en-IN")}
                        </span>
                      </div>

                      {items.length > 0 && (
                        <button
                          onClick={() => toggleOrderExpand(order.id)}
                          className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition cursor-pointer"
                        >
                          {items.length} Item(s)
                          {isExpanded ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Summary Product String */}
                  <div className="mt-3 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-500 mr-1.5">
                      Products:
                    </span>
                    {order.product || "Store items"}
                  </div>

                  {/* Expandable Individual Items Breakdown */}
                  {isExpanded && items.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                        Purchased Items Breakdown
                      </span>
                      {items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            {item.productImage ? (
                              <img
                                src={item.productImage}
                                alt={item.productName}
                                className="w-10 h-10 rounded-lg object-cover border border-slate-100"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                <Package size={16} />
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-900">
                                {item.productName}
                              </p>
                              <span className="text-[11px] text-slate-500">
                                Qty: {item.quantity} × ₹
                                {Number(item.price || 0).toLocaleString(
                                  "en-IN",
                                )}
                              </span>
                            </div>
                          </div>
                          <span className="font-bold text-slate-900">
                            ₹
                            {Number(
                              item.subtotal || item.price * item.quantity || 0,
                            ).toLocaleString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400">
            <ShoppingBag size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-xs text-slate-600">
              No purchases found.
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              This customer hasn't purchased items from your catalog yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorViewCustomer;
