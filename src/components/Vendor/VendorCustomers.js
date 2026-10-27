import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { handleAuthError } from "../../AuthRouteVendor";
import axios from "axios";
import {
  Search,
  Eye,
  Loader2,
  AlertCircle,
  RefreshCw,
  Users,
} from "lucide-react";

const API_BASE_URL = "https://smart-commerce-platform-backend.onrender.com/api";

const VendorCustomers = () => {
  const navigate = useNavigate();

  // Dynamic state
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch dynamic customers from backend
  const fetchCustomers = async () => {
    const token = localStorage.getItem("vendorToken");

    if (!token) {
      navigate("/vendor/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.get(`${API_BASE_URL}/vendors/customers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data && response.data.success) {
        setCustomers(
          Array.isArray(response.data.customers) ? response.data.customers : [],
        );
      } else {
        setCustomers(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      handleAuthError(err);
      console.error("Error fetching customers:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("vendorToken");
        navigate("/vendor/login");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to load customers from server.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Safe search filter preventing null/undefined errors
  const filteredCustomers = customers.filter((c) => {
    const term = (searchTerm || "").toLowerCase().trim();
    const name = String(c?.name || "").toLowerCase();
    const email = String(c?.email || "").toLowerCase();
    const phone = String(c?.phone || "");

    return name.includes(term) || email.includes(term) || phone.includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Vendor Customers
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Buyers who purchased products from your store
          </p>
        </div>

        <button
          onClick={fetchCustomers}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition shadow-sm cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center justify-between p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchCustomers}
            className="underline font-bold hover:text-rose-900 ml-4 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search customer by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Customer Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Vendor Orders</th>
                <th className="px-6 py-4">Total Spent</th>
                <th className="px-6 py-4">Last Order</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    <Loader2
                      size={24}
                      className="mx-auto text-blue-600 animate-spin mb-2"
                    />
                    <span>Loading customers...</span>
                  </td>
                </tr>
              ) : filteredCustomers.length > 0 ? (
                filteredCustomers.map((cust) => {
                  const customerId = cust?.id || cust?._id || "";
                  const totalSpent = Number(cust?.totalSpent) || 0;

                  return (
                    <tr
                      key={customerId}
                      className="hover:bg-slate-50 transition"
                    >
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {cust?.name || "Unknown Customer"}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {cust?.email || "—"}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {cust?.phone || "—"}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {cust?.orderCount || 0} order(s)
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-600">
                        ₹{totalSpent.toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {cust?.lastOrderDate || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          {cust?.status || "Active Buyer"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/vendor/customers/${customerId}`}
                          className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-[11px] inline-flex items-center gap-1 transition"
                        >
                          <Eye size={14} /> View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    <Users size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600 text-xs">
                      No customers found.
                    </p>
                    {searchTerm ? (
                      <p className="text-[11px] text-slate-400 mt-1">
                        No customer matches "{searchTerm}"
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400 mt-1">
                        Customers who purchase products from your store will
                        appear here.
                      </p>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VendorCustomers;
