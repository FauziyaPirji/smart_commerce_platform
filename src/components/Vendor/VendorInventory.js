import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRouteVendor";
import {
  Search,
  Boxes,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Plus,
  Minus,
  X,
  History,
  Loader2,
  PackageCheck,
  AlertCircle,
  ArrowUpDown,
} from "lucide-react";

const API_BASE_URL = "https://smart-commerce-platform-backend.onrender.com/api/vendor/inventory";

const getToken = () =>
  localStorage.getItem("vendorToken") || localStorage.getItem("token") || "";

const getProductImage = (item) => {
  if (!item) return null;
  if (Array.isArray(item.images) && item.images.length > 0)
    return item.images[0];
  return item.image || null;
};

const VendorInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [stockStatusFilter, setStockStatusFilter] = useState("All");

  // Stock Adjustment Modal State
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustType, setAdjustType] = useState("add"); // "add" | "subtract"
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustReason, setAdjustReason] = useState("restock");
  const [auditNote, setAuditNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalFeedback, setModalFeedback] = useState({
    error: "",
    success: "",
  });

  // 1. Fetch Inventory from Backend
  const fetchInventory = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(API_BASE_URL, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      if (res.data && res.data.success) {
        setInventory(res.data.inventory || []);
      } else {
        setInventory([]);
      }
    } catch (err) {
      handleAuthError(err);
      console.error("Fetch inventory error:", err);
      setError(err.response?.data?.message || "Failed to load inventory data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Compute metrics
  const totalProducts = inventory.length;
  const inStockCount = inventory.filter(
    (item) => item.currentStock > 10,
  ).length;
  const lowStockCount = inventory.filter(
    (item) => item.currentStock > 0 && item.currentStock <= 10,
  ).length;
  const outOfStockCount = inventory.filter(
    (item) => item.currentStock === 0,
  ).length;

  // Filtered List
  const filteredInventory = inventory.filter((item) => {
    const name = item.productName || "";
    const sku = item.sku || "";
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "All" || item.category === categoryFilter;

    let matchesStatus = true;
    if (stockStatusFilter === "In Stock")
      matchesStatus = item.currentStock > 10;
    if (stockStatusFilter === "Low Stock")
      matchesStatus = item.currentStock > 0 && item.currentStock <= 10;
    if (stockStatusFilter === "Out of Stock")
      matchesStatus = item.currentStock === 0;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Extract unique categories for filter
  const uniqueCategories = [
    "All",
    ...Array.from(new Set(inventory.map((i) => i.category).filter(Boolean))),
  ];

  // Open Adjustment Modal
  const handleOpenAdjustModal = (item) => {
    setSelectedItem(item);
    setAdjustType("add");
    setAdjustQty(1);
    setAdjustReason("restock");
    setAuditNote("");
    setModalFeedback({ error: "", success: "" });
  };

  // Close Adjustment Modal
  const handleCloseModal = () => {
    setSelectedItem(null);
    setModalFeedback({ error: "", success: "" });
  };

  // Submit Stock Adjustment
  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    const qty = Number(adjustQty);
    if (!qty || qty <= 0) {
      setModalFeedback({
        error: "Please enter a valid quantity greater than 0.",
        success: "",
      });
      return;
    }

    if (adjustType === "subtract" && qty > selectedItem.currentStock) {
      setModalFeedback({
        error: `Cannot subtract ${qty} units. Current stock is only ${selectedItem.currentStock}.`,
        success: "",
      });
      return;
    }

    setIsSubmitting(true);
    setModalFeedback({ error: "", success: "" });

    try {
      const res = await axios.post(
        `${API_BASE_URL}/adjust`,
        {
          productId: selectedItem.id || selectedItem._id,
          type: adjustType,
          quantity: qty,
          reason: adjustReason,
          auditNote,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );

      if (res.data.success) {
        // Update local state instantly
        const updatedStock = res.data.product.currentStock;
        setInventory((prev) =>
          prev.map((item) =>
            (item.id || item._id) === (selectedItem.id || selectedItem._id)
              ? {
                  ...item,
                  currentStock: updatedStock,
                  availableStock: Math.max(
                    0,
                    updatedStock - (item.reservedStock || 0),
                  ),
                  lastUpdated: "Just now",
                }
              : item,
          ),
        );

        setModalFeedback({
          success: `Stock successfully updated to ${updatedStock} units!`,
          error: "",
        });

        // Close after a short delay
        setTimeout(() => {
          handleCloseModal();
        }, 1200);
      }
    } catch (err) {
      handleAuthError(err);
      console.error("Adjust stock error:", err);
      setModalFeedback({
        error: err.response?.data?.message || "Failed to update stock.",
        success: "",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Inventory Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time stock control, quick adjustments, and audit links
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchInventory}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold inline-flex items-center gap-1.5 transition shadow-xs"
          >
            <RefreshCw
              size={13}
              className={loading ? "animate-spin text-blue-600" : ""}
            />
            Refresh
          </button>

          <Link
            to="/vendor/inventory/logs"
            className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 transition shadow-xs"
          >
            <History size={14} />
            View Audit Logs
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">
            Total Catalog Items
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {totalProducts}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-emerald-600">
            In Stock (&gt;10)
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {inStockCount}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-amber-600">
            Low Stock Warning
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {lowStockCount}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-rose-600">Out of Stock</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {outOfStockCount}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search by Product Name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 font-medium"
          >
            {uniqueCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "All" ? "All Categories" : cat}
              </option>
            ))}
          </select>

          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 font-medium"
          >
            <option value="All">All Stock Statuses</option>
            <option value="In Stock">In Stock (&gt;10)</option>
            <option value="Low Stock">Low Stock (1-10)</option>
            <option value="Out of Stock">Out of Stock (0)</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 size={30} className="animate-spin text-slate-600" />
            <p className="text-xs font-semibold">Loading inventory items...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">Current Stock</th>
                  <th className="px-6 py-4">Reserved Stock</th>
                  <th className="px-6 py-4">Available Stock</th>
                  <th className="px-6 py-4">Alert</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Last Updated</th>
                  <th className="px-6 py-4 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInventory.length > 0 ? (
                  filteredInventory.map((item) => {
                    const available = item.availableStock ?? item.currentStock;
                    const isLow =
                      item.currentStock <= (item.lowStockThreshold || 10);
                    const prodImg = getProductImage(item);

                    return (
                      <tr
                        key={item.id || item._id}
                        className="hover:bg-slate-50/80 transition"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-lg border border-slate-200 bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                              {prodImg ? (
                                <img
                                  src={prodImg}
                                  alt={item.productName}
                                  className="size-full object-cover"
                                />
                              ) : (
                                <Boxes size={18} className="text-slate-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 line-clamp-1">
                                {item.productName}
                              </p>
                              <span className="text-[10px] text-slate-400">
                                {item.category}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 font-mono text-[11px] text-slate-500">
                          {item.sku}
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-900 text-sm">
                            {item.currentStock}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-slate-500">
                          {item.reservedStock || 0}
                        </td>

                        <td className="px-6 py-4 font-bold text-blue-600">
                          {available}
                        </td>

                        <td className="px-6 py-4">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 text-amber-600 font-semibold text-[11px]">
                              <AlertTriangle size={13} /> Low (&le;
                              {item.lowStockThreshold || 10})
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-semibold text-[11px]">
                              Normal
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              item.currentStock === 0
                                ? "bg-rose-50 text-rose-700"
                                : isLow
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {item.currentStock === 0
                              ? "Out of Stock"
                              : isLow
                                ? "Low Stock"
                                : "In Stock"}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-slate-400">
                          {item.lastUpdated}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenAdjustModal(item)}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-[11px] inline-flex items-center gap-1.5 transition shadow-xs"
                          >
                            <ArrowUpDown size={12} /> Adjust Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-6 py-12 text-center text-slate-400"
                    >
                      No inventory products found matching filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QUICK ADJUST STOCK MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Adjust Inventory Stock
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                  {selectedItem.productName} ({selectedItem.sku})
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="mt-5 space-y-4">
              {/* Type Toggle: Add or Subtract */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Action Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustType("add");
                      setAdjustReason("restock");
                    }}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition ${
                      adjustType === "add"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-xs"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Plus size={14} /> Add Stock (Restock)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAdjustType("subtract");
                      setAdjustReason("damaged");
                    }}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition ${
                      adjustType === "subtract"
                        ? "border-rose-500 bg-rose-50 text-rose-700 shadow-xs"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Minus size={14} /> Subtract Stock
                  </button>
                </div>
              </div>

              {/* Quantity Input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Quantity Units
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Current:{" "}
                    <strong className="text-slate-800">
                      {selectedItem.currentStock}
                    </strong>
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  max={
                    adjustType === "subtract"
                      ? selectedItem.currentStock
                      : undefined
                  }
                  value={adjustQty}
                  onChange={(e) =>
                    setAdjustQty(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              {/* Realtime Projected Stock */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">Projected Stock Level:</span>
                <span className="font-bold text-slate-900">
                  {adjustType === "add"
                    ? selectedItem.currentStock + Number(adjustQty || 0)
                    : Math.max(
                        0,
                        selectedItem.currentStock - Number(adjustQty || 0),
                      )}{" "}
                  units
                </span>
              </div>

              {/* Reason Dropdown matching Mongoose Schema */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Reason for Adjustment
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                >
                  {adjustType === "add" ? (
                    <>
                      <option value="restock">
                        📦 Restock / New Supply Shipment
                      </option>
                      <option value="returned">
                        🔄 Customer Return Received
                      </option>
                      <option value="order_cancelled">
                        ❌ Order Cancelled & Restocked
                      </option>
                      <option value="manual_adjustment">
                        📝 Manual Audit Correction
                      </option>
                      <option value="other">💬 Other</option>
                    </>
                  ) : (
                    <>
                      <option value="damaged">
                        ⚠️ Damaged Goods in Warehouse
                      </option>
                      <option value="expired">⌛ Expired Product</option>
                      <option value="lost">🔍 Lost / Missing Inventory</option>
                      <option value="order_placed">
                        🛒 Manual Order Sale / Offline Purchase
                      </option>
                      <option value="manual_adjustment">
                        📝 Manual Audit Correction
                      </option>
                      <option value="other">💬 Other</option>
                    </>
                  )}
                </select>
              </div>

              {/* Audit Note */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Audit Note / Remarks{" "}
                  <span className="font-normal text-slate-400">(Optional)</span>
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Batch #409 arrived via BlueDart, inspected by manager."
                  value={auditNote}
                  onChange={(e) => setAuditNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Modal Feedback Messages */}
              {modalFeedback.error && (
                <p className="text-xs font-medium text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200 flex items-center gap-1.5">
                  <AlertCircle size={14} /> {modalFeedback.error}
                </p>
              )}
              {modalFeedback.success && (
                <p className="text-xs font-medium text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle size={14} /> {modalFeedback.success}
                </p>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCloseModal}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-1.5 ${
                    adjustType === "add"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  } disabled:opacity-50`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Saving...
                    </>
                  ) : adjustType === "add" ? (
                    <>
                      <Plus size={14} /> Confirm Add
                    </>
                  ) : (
                    <>
                      <Minus size={14} /> Confirm Deduct
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorInventory;
