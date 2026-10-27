import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRouteAdmin";
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  FolderOpen,
  Package,
  Loader2,
  RefreshCw,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000/api";

const AdminCategories = () => {
  const token = localStorage.getItem("adminToken");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // FILTERS & SEARCH
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("NameAZ");

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // DELETE MODAL STATE
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // BROKEN IMAGES FALLBACK TRACKING
  const [brokenImages, setBrokenImages] = useState({});

  // FETCH CATEGORIES FROM BACKEND (WITH ENDPOINT FALLBACK)
  const fetchCategories = async () => {
    setLoading(true);
    setError("");

    try {
      let res;
      // 1. Try /categories/all first
      try {
        res = await axios.get(`${API_BASE_URL}/categories/all`, {
          headers: {
            "Content-Type": "Application/json",
            Authorization: "Bearer " + token,
          },
        });
      } catch (err1) {
        // 2. Fallback to /categories-all or /categories
        try {
          res = await axios.get(`${API_BASE_URL}/categories-all`, {
            headers: {
              "Content-Type": "Application/json",
              Authorization: "Bearer " + token,
            },
          });
        } catch (err2) {
          res = await axios.get(`${API_BASE_URL}/categories`, {
            headers: {
              "Content-Type": "Application/json",
              Authorization: "Bearer " + token,
            },
          });
        }
      }

      const data = res?.data;
      let catList = [];

      if (Array.isArray(data)) {
        catList = data;
      } else if (data?.success && Array.isArray(data.categories)) {
        catList = data.categories;
      } else if (Array.isArray(data?.categories)) {
        catList = data.categories;
      } else if (Array.isArray(data?.data)) {
        catList = data.data;
      }

      setCategories(catList);
    } catch (err) {
      handleAuthError(err);
      console.error("Error fetching categories:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch categories from server.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, sortBy]);

  // FILTER & SORT CATEGORIES
  const filteredCategories = useMemo(() => {
    let result = categories.filter((category) => {
      const name = category.name || "";
      const desc = category.description || "";
      const status =
        category.status ||
        (category.isActive !== false ? "Active" : "Inactive");

      const query = search.toLowerCase().trim();
      const matchesSearch =
        !query ||
        name.toLowerCase().includes(query) ||
        desc.toLowerCase().includes(query);

      const matchesStatus = statusFilter === "All" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Sorting
    return result.sort((a, b) => {
      const nameA = (a.name || "").toLowerCase();
      const nameB = (b.name || "").toLowerCase();
      const countA = Number(a.productsCount || a.products || 0);
      const countB = Number(b.productsCount || b.products || 0);

      if (sortBy === "NameZA") return nameB.localeCompare(nameA);
      if (sortBy === "MostProducts") return countB - countA;
      if (sortBy === "LeastProducts") return countA - countB;
      // Default: Name A-Z
      return nameA.localeCompare(nameB);
    });
  }, [categories, search, statusFilter, sortBy]);

  // PAGINATED SLICE
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage) || 1;
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCategories.slice(start, start + itemsPerPage);
  }, [filteredCategories, currentPage, itemsPerPage]);

  // DELETE CATEGORY
  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    const catId = categoryToDelete._id || categoryToDelete.id;
    setIsDeleting(true);

    try {
      const res = await axios.delete(`${API_BASE_URL}/categories/${catId}`, {
        headers: {
          "Content-Type": "Application/json",
          Authorization: "Bearer " + token,
        },
      });

      if (res.status === 200 || res.data?.success) {
        setCategories((prev) =>
          prev.filter((item) => (item._id || item.id) !== catId),
        );
        setCategoryToDelete(null);
      }
    } catch (err) {
      handleAuthError(err);
      console.error("Delete category error:", err);
      alert(
        err.response?.data?.message ||
          err.message ||
          "Failed to delete category.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // TOGGLE STATUS
  const handleStatusToggle = async (category) => {
    const catId = category._id || category.id;
    const currentStatus =
      category.status || (category.isActive !== false ? "Active" : "Inactive");
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
    const newIsActive = newStatus === "Active";

    setActionLoadingId(catId);

    try {
      const res = await axios.put(
        `${API_BASE_URL}/categories/${catId}`,
        {
          isActive: newIsActive,
          status: newStatus,
        },
        {
          headers: {
            "Content-Type": "Application/json",
            Authorization: "Bearer " + token,
          },
        },
      );

      if (res.status === 200 || res.data?.success) {
        setCategories((prev) =>
          prev.map((item) =>
            (item._id || item.id) === catId
              ? {
                  ...item,
                  isActive: newIsActive,
                  status: newStatus,
                }
              : item,
          ),
        );
      }
    } catch (err) {
      handleAuthError(err);
      console.error("Toggle category status error:", err);
      alert(
        err.response?.data?.message ||
          err.message ||
          "Failed to update category status.",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  // STATISTICS
  const activeCount = useMemo(
    () =>
      categories.filter(
        (item) =>
          (item.status || (item.isActive !== false ? "Active" : "Inactive")) ===
          "Active",
      ).length,
    [categories],
  );

  const totalProducts = useMemo(
    () =>
      categories.reduce(
        (total, item) =>
          total + Number(item.productsCount || item.products || 0),
        0,
      ),
    [categories],
  );

  const hasActiveFilters =
    search !== "" || statusFilter !== "All" || sortBy !== "NameAZ";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setSortBy("NameAZ");
  };

  return (
    <div className="min-h-screen space-y-6 bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
          <p className="mt-1 text-sm text-slate-500">
            Organize products and manage category banners across SmartCommerce.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchCategories}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <Link
            to="/admin/categories/add"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800"
          >
            <Plus size={16} />
            Add Category
          </Link>
        </div>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Total Categories
              </p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">
                {categories.length}
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <FolderOpen size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Active Categories
              </p>
              <p className="mt-1 text-2xl font-extrabold text-emerald-600">
                {activeCount}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <CheckCircle2 size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Total Products Linked
              </p>
              <p className="mt-1 text-2xl font-extrabold text-purple-600">
                {totalProducts}
              </p>
            </div>
            <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
              <Package size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search category name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs outline-none transition focus:border-slate-400 focus:bg-white"
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

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-10 text-xs font-semibold text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          {/* Sort By */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-10 text-xs font-semibold text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
            >
              <option value="NameAZ">Name: A to Z</option>
              <option value="NameZA">Name: Z to A</option>
              <option value="MostProducts">Most Products</option>
              <option value="LeastProducts">Least Products</option>
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          {/* Reset Filters */}
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

      {/* Category Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 text-slate-400">
            <Loader2 size={32} className="animate-spin text-slate-800" />
            <p className="mt-3 text-xs font-semibold text-slate-500">
              Loading categories from backend...
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Category
                  </th>
                  <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Description
                  </th>
                  <th className="px-6 py-3.5 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Linked Products
                  </th>
                  <th className="px-6 py-3.5 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {paginatedCategories.length > 0 ? (
                  paginatedCategories.map((category) => {
                    const catId = category._id || category.id;
                    const catStatus =
                      category.status ||
                      (category.isActive !== false ? "Active" : "Inactive");
                    const prodCount =
                      category.productsCount !== undefined
                        ? category.productsCount
                        : category.products || 0;
                    const isActionLoading = actionLoadingId === catId;
                    const isImageBroken = brokenImages[catId];
                    const initial = category.name
                      ? category.name.charAt(0).toUpperCase()
                      : "C";

                    return (
                      <tr
                        key={catId}
                        className="transition hover:bg-slate-50/70"
                      >
                        {/* Category & Cloudinary Image */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                              {category.image && !isImageBroken ? (
                                <img
                                  src={category.image}
                                  alt={category.name}
                                  onError={() =>
                                    setBrokenImages((prev) => ({
                                      ...prev,
                                      [catId]: true,
                                    }))
                                  }
                                  className="size-full object-cover transition duration-200 hover:scale-110"
                                />
                              ) : (
                                <div className="grid size-full place-items-center bg-slate-900 text-sm font-extrabold text-white">
                                  {initial}
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-slate-900">
                                {category.name}
                              </p>
                              <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                                /{category.slug || "category"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Description */}
                        <td className="px-6 py-4">
                          <p className="max-w-xs truncate text-xs text-slate-600">
                            {category.description || "No description provided."}
                          </p>
                        </td>

                        {/* Products */}
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                            {prodCount} items
                          </span>
                        </td>

                        {/* Status Toggle Button */}
                        <td className="px-6 py-4 text-center">
                          {isActionLoading ? (
                            <Loader2
                              size={15}
                              className="mx-auto animate-spin text-slate-400"
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStatusToggle(category)}
                              title="Click to toggle status"
                              className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold transition ${
                                catStatus === "Active"
                                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 hover:bg-emerald-100"
                                  : "bg-slate-100 text-slate-600 ring-1 ring-slate-400/20 hover:bg-slate-200"
                              }`}
                            >
                              {catStatus}
                            </button>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              to={`/admin/categories/${catId}`}
                              title="View Category Details"
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-800"
                            >
                              <Eye size={16} />
                            </Link>

                            <Link
                              to={`/admin/categories/${catId}/edit`}
                              title="Edit Category"
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-amber-50 hover:text-amber-600"
                            >
                              <Edit size={16} />
                            </Link>

                            <button
                              type="button"
                              onClick={() => setCategoryToDelete(category)}
                              title="Delete Category"
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-14 text-center">
                      <FolderOpen
                        size={38}
                        className="mx-auto mb-3 text-slate-300"
                      />
                      <p className="text-sm font-bold text-slate-700">
                        No categories found
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Try modifying your search or filter options.
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50"
                        >
                          Clear All Filters
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && filteredCategories.length > itemsPerPage && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-3.5 sm:flex-row">
            <p className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-800">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-800">
                {Math.min(
                  currentPage * itemsPerPage,
                  filteredCategories.length,
                )}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-800">
                {filteredCategories.length}
              </span>{" "}
              categories
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
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`size-7 rounded-lg text-xs font-bold transition ${
                        currentPage === pageNum
                          ? "bg-slate-900 text-white shadow-xs"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
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
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <Trash2 size={22} />
              </div>

              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  Delete Category
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Are you sure you want to delete this category? Products linked
                  to this category may lose their categorization.
                </p>

                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="truncate text-xs font-bold text-slate-800">
                    {categoryToDelete.name}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    Slug: /{categoryToDelete.slug || "category"} • Linked
                    Products: {categoryToDelete.productsCount || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setCategoryToDelete(null)}
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

export default AdminCategories;
