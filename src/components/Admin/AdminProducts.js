import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRouteAdmin";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Package,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
  AlertCircle,
  X,
  ArrowUpDown,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

const API_BASE_URL = "https://smart-commerce-platform-backend.onrender.com/api";

const formatPrice = (val) => {
  const num = Number(val);
  return isNaN(num) ? "0" : num.toLocaleString("en-IN");
};

const formatNumber = (val) => {
  const num = Number(val);
  return isNaN(num) ? "0" : num.toLocaleString("en-IN");
};

// Normalize backend approvalStatus + isActive into UI status
const getNormalizedStatus = (product) => {
  const approval = (product.approvalStatus || "").toLowerCase();
  if (approval === "approved" && product.isActive !== false) return "Active";
  if (approval === "pending") return "Pending";
  if (approval === "rejected" || product.isActive === false) return "Inactive";
  if (product.isActive === true) return "Active";
  return "Active";
};

const AdminProducts = () => {
  const token = localStorage.getItem("adminToken");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // FILTERS & SEARCH
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // DELETE MODAL STATE
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // IMAGE LOAD ERROR TRACKING (for fallback to initials)
  const [brokenImages, setBrokenImages] = useState({});

  // FETCH ALL PRODUCTS FROM BACKEND
  const fetchProducts = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await axios.get(`${API_BASE_URL}/products`, {
        headers: {
          "Content-Type": "Application/json",
          Authorization: "Bearer " + token,
        },
      });
      const data = res.data;

      let list = [];
      if (Array.isArray(data)) list = data;
      else if (data.success && Array.isArray(data.products))
        list = data.products;
      else if (Array.isArray(data.products)) list = data.products;
      else if (Array.isArray(data.data)) list = data.data;

      setProducts(list);
    } catch (err) {
      handleAuthError(err);
      console.error("Error fetching products:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load products from backend.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, categoryFilter, sortBy]);

  // Dynamic categories from backend product data
  const categories = useMemo(() => {
    const list = products.map((p) => {
      if (typeof p.category === "object" && p.category !== null) {
        return p.category.name || "General";
      }
      return p.categoryName || p.category || "General";
    });
    return ["All", ...new Set(list.filter(Boolean))];
  }, [products]);

  // STATISTICS
  const totalProducts = products.length;

  const activeProducts = useMemo(
    () => products.filter((p) => getNormalizedStatus(p) === "Active").length,
    [products],
  );

  const pendingProducts = useMemo(
    () => products.filter((p) => getNormalizedStatus(p) === "Pending").length,
    [products],
  );

  const lowStockProducts = useMemo(
    () => products.filter((p) => Number(p.stock || 0) <= 10).length,
    [products],
  );

  // FILTER & SORT PRODUCTS
  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      const name = product.name || "";
      const vendorName =
        typeof product.vendor === "object" && product.vendor !== null
          ? product.vendor.storeName ||
            product.vendor.businessName ||
            product.vendor.name ||
            ""
          : "";
      const catName =
        typeof product.category === "object" && product.category !== null
          ? product.category.name
          : product.categoryName || product.category || "General";
      const pStatus = getNormalizedStatus(product);

      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        name.toLowerCase().includes(searchText) ||
        vendorName.toLowerCase().includes(searchText);

      const matchesStatus = statusFilter === "All" || pStatus === statusFilter;
      const matchesCategory =
        categoryFilter === "All" || catName === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });

    // Sorting
    return result.sort((a, b) => {
      if (sortBy === "PriceLowHigh") {
        return (
          (a.discountPrice || a.price || 0) - (b.discountPrice || b.price || 0)
        );
      }
      if (sortBy === "PriceHighLow") {
        return (
          (b.discountPrice || b.price || 0) - (a.discountPrice || a.price || 0)
        );
      }
      if (sortBy === "StockLowHigh") {
        return Number(a.stock || 0) - Number(b.stock || 0);
      }
      // Default: Newest first
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [products, search, statusFilter, categoryFilter, sortBy]);

  // PAGINATED SLICE
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // STATUS CHANGE (Approve / Pending / Inactive)
  const handleStatusChange = async (product, newStatus) => {
    const targetId = product._id || product.id;
    setActionLoadingId(targetId);

    let payload = {};
    if (newStatus === "Active") {
      payload = { approvalStatus: "approved", isActive: true };
    } else if (newStatus === "Pending") {
      payload = { approvalStatus: "pending", isActive: false };
    } else {
      payload = { approvalStatus: "rejected", isActive: false };
    }

    try {
      const res = await axios.put(
        `${API_BASE_URL}/products/${targetId}`,
        payload,
        {
          headers: {
            "Content-Type": "Application/json",
            Authorization: "Bearer " + token,
          },
        },
      );

      if (res.status === 200 || res.data?.success) {
        setProducts((prev) =>
          prev.map((item) =>
            (item._id || item.id) === targetId ? { ...item, ...payload } : item,
          ),
        );
      }
    } catch (err) {
      handleAuthError(err);
      console.error("Status change error:", err);
      alert(
        err.response?.data?.message ||
          err.message ||
          "Failed to update product status.",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  // CONFIRM DELETE
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    const targetId = productToDelete._id || productToDelete.id;
    setIsDeleting(true);

    try {
      const res = await axios.delete(`${API_BASE_URL}/products/${targetId}`, {
        headers: {
          "Content-Type": "Application/json",
          Authorization: "Bearer " + token,
        },
      });

      if (res.status === 200 || res.data?.success) {
        setProducts((prev) =>
          prev.filter((item) => (item._id || item.id) !== targetId),
        );
        setProductToDelete(null);
      }
    } catch (err) {
      handleAuthError(err);
      console.error("Delete product error:", err);
      alert(
        err.response?.data?.message ||
          err.message ||
          "Failed to delete product.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Status style helper
  const getStatusStyle = (s) => {
    switch (s) {
      case "Active":
        return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20";
      case "Pending":
        return "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20";
      case "Inactive":
        return "bg-slate-100 text-slate-600 ring-1 ring-slate-400/20";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const getStockBadge = (stock) => {
    const num = Number(stock || 0);
    if (num <= 0) {
      return (
        <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 ring-1 ring-red-600/20">
          Out of stock (0)
        </span>
      );
    }
    if (num <= 10) {
      return (
        <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-600/20">
          Low ({num})
        </span>
      );
    }
    return (
      <span className="text-xs font-bold text-slate-700">
        {formatNumber(num)} units
      </span>
    );
  };

  // Helper to extract the primary image URL
  const getProductImage = (product) => {
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0];
    }
    if (product.image && typeof product.image === "string") {
      return product.image;
    }
    return null;
  };

  const hasActiveFilters =
    search !== "" ||
    statusFilter !== "All" ||
    categoryFilter !== "All" ||
    sortBy !== "Newest";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setCategoryFilter("All");
    setSortBy("Newest");
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#287b6d]">
            Marketplace Control
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900">
            Products Catalog
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage product verification, pricing, stock, and vendor listings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchProducts}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Total Products</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            {formatNumber(totalProducts)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Active Listed</p>
          <p className="mt-2 text-2xl font-extrabold text-emerald-600">
            {formatNumber(activeProducts)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-sm">
          <p className="text-xs font-semibold text-slate-500">
            Pending Approval
          </p>
          <p className="mt-2 text-2xl font-extrabold text-amber-600">
            {formatNumber(pendingProducts)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-sm">
          <p className="text-xs font-semibold text-slate-500">
            Low Stock Alert
          </p>
          <p className="mt-2 text-2xl font-extrabold text-red-500">
            {formatNumber(lowStockProducts)}
          </p>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* SEARCH */}
          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product name, vendor store..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs outline-none transition focus:border-[#287b6d] focus:bg-white"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* CATEGORY FILTER */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-10 text-xs font-semibold text-slate-700 outline-none transition focus:border-[#287b6d] focus:bg-white"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "All" ? "All Categories" : cat}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          {/* STATUS FILTER */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-10 text-xs font-semibold text-slate-700 outline-none transition focus:border-[#287b6d] focus:bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Inactive">Inactive</option>
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          {/* SORT BY */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-10 text-xs font-semibold text-slate-700 outline-none transition focus:border-[#287b6d] focus:bg-white"
            >
              <option value="Newest">Sort: Newest</option>
              <option value="PriceLowHigh">Price: Low to High</option>
              <option value="PriceHighLow">Price: High to Low</option>
              <option value="StockLowHigh">Stock: Low to High</option>
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          {/* RESET FILTERS BUTTON */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* PRODUCTS TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 text-slate-400">
            <Loader2 size={32} className="animate-spin text-[#287b6d]" />
            <p className="mt-3 text-xs font-semibold text-slate-500">
              Loading products from database...
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Product
                  </th>
                  <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Vendor
                  </th>
                  <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Category
                  </th>
                  <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Price (INR)
                  </th>
                  <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Stock
                  </th>
                  <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Approval / Status
                  </th>
                  <th className="px-5 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {paginatedProducts.map((product) => {
                  const pId = product._id || product.id;

                  // Vendor name
                  const vendorName =
                    typeof product.vendor === "object" &&
                    product.vendor !== null
                      ? product.vendor.storeName ||
                        product.vendor.businessName ||
                        product.vendor.name ||
                        "Unknown Merchant"
                      : "Unknown Merchant";

                  // Category name
                  const catName =
                    typeof product.category === "object" &&
                    product.category !== null
                      ? product.category.name
                      : product.categoryName || product.category || "General";

                  // Prices
                  const sellingPrice =
                    product.discountPrice || product.price || 0;
                  const mrpPrice = product.price || 0;

                  const pStatus = getNormalizedStatus(product);
                  const isActionLoading = actionLoadingId === pId;

                  // Image handling
                  const imageSrc = getProductImage(product);
                  const isImageBroken = brokenImages[pId];
                  const initial = product.name
                    ? product.name.charAt(0).toUpperCase()
                    : "P";

                  return (
                    <tr key={pId} className="transition hover:bg-slate-50/70">
                      {/* PRODUCT THUMBNAIL & NAME */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                            {imageSrc && !isImageBroken ? (
                              <img
                                src={imageSrc}
                                alt={product.name || "Product"}
                                onError={() =>
                                  setBrokenImages((prev) => ({
                                    ...prev,
                                    [pId]: true,
                                  }))
                                }
                                className="size-full object-cover transition duration-200 hover:scale-110"
                              />
                            ) : (
                              <div className="grid size-full place-items-center bg-[#287b6d]/10 text-sm font-black text-[#287b6d]">
                                {initial}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-slate-800">
                              {product.name || "Untitled Product"}
                            </p>
                            <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                              ID: {pId.slice(-6)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* VENDOR */}
                      <td className="px-5 py-4">
                        <p className="text-xs font-semibold text-slate-700">
                          {vendorName}
                        </p>
                        {product.vendor?.email && (
                          <p className="text-[10px] text-slate-400">
                            {product.vendor.email}
                          </p>
                        )}
                      </td>

                      {/* CATEGORY */}
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-700">
                          {catName}
                        </span>
                      </td>

                      {/* PRICE */}
                      <td className="px-5 py-4">
                        <p className="text-xs font-bold text-slate-800">
                          ₹{formatPrice(sellingPrice)}
                        </p>
                        {mrpPrice > sellingPrice && (
                          <p className="text-[10px] text-slate-400 line-through">
                            ₹{formatPrice(mrpPrice)}
                          </p>
                        )}
                      </td>

                      {/* STOCK */}
                      <td className="px-5 py-4">
                        {getStockBadge(product.stock)}
                      </td>

                      {/* STATUS DROPDOWN */}
                      <td className="px-5 py-4">
                        {isActionLoading ? (
                          <div className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                            <Loader2
                              size={14}
                              className="animate-spin text-[#287b6d]"
                            />
                            <span className="text-[10px]">Updating...</span>
                          </div>
                        ) : (
                          <div className="relative inline-block">
                            <select
                              value={pStatus}
                              onChange={(e) =>
                                handleStatusChange(product, e.target.value)
                              }
                              className={`cursor-pointer rounded-full border-0 py-1 pl-2.5 pr-6 text-[10px] font-bold outline-none transition ${getStatusStyle(
                                pStatus,
                              )}`}
                            >
                              <option value="Active">Active</option>
                              <option value="Pending">Pending</option>
                              <option value="Inactive">Inactive</option>
                            </select>
                            <ChevronDown
                              size={11}
                              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-60"
                            />
                          </div>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="px-5 py-4">
                        <div className="flex justify-end items-center gap-1">
                          <Link
                            to={`/admin/products/${pId}`}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-800"
                            title="View Product Details"
                          >
                            <Eye size={16} />
                          </Link>

                          <button
                            type="button"
                            onClick={() => setProductToDelete(product)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                            title="Delete Product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && filteredProducts.length === 0 && (
          <div className="py-16 text-center">
            <Package size={38} className="mx-auto text-slate-300" />
            <p className="mt-3 text-sm font-bold text-slate-700">
              No matching products found
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Try adjusting your search terms or filter settings.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs"
              >
                Reset All Filters
              </button>
            )}
          </div>
        )}

        {/* PAGINATION BAR */}
        {!loading && filteredProducts.length > itemsPerPage && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 bg-slate-50/50 px-5 py-3.5 gap-3">
            <p className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-800">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-800">
                {Math.min(currentPage * itemsPerPage, filteredProducts.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-800">
                {filteredProducts.length}
              </span>{" "}
              products
            </p>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft size={14} /> Previous
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  // Display only reasonable page window if totalPages is large
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`size-7 rounded-lg text-xs font-bold transition ${
                          currentPage === pageNum
                            ? "bg-[#287b6d] text-white shadow-xs"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  if (
                    pageNum === currentPage - 2 ||
                    pageNum === currentPage + 2
                  ) {
                    return (
                      <span key={pageNum} className="text-slate-400 text-xs">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CONFIRM DELETE MODAL */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <Trash2 size={22} />
              </div>

              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  Delete Product
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Are you sure you want to delete this product? This action is
                  permanent and cannot be undone.
                </p>

                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {productToDelete.name}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                    ID: {productToDelete._id || productToDelete.id}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setProductToDelete(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    Confirm Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
