import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRouteAdmin";
import {
  Search,
  Eye,
  CheckCircle2,
  Trash2,
  Store,
  Users,
  Clock3,
  Ban,
  ChevronDown,
  RefreshCw,
  Loader2,
  AlertCircle,
  ArrowUpDown,
  Filter,
  X,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

const API_BASE_URL = "https://smart-commerce-platform-backend.onrender.com/api";

/* HELPERS & FORMATTERS */

const formatNumber = (val) => {
  const num = Number(val);
  return isNaN(num) ? "0" : num.toLocaleString("en-IN");
};

const getInitials = (name) => {
  if (!name) return "VN";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const getVendorId = (vendor) => {
  return vendor?._id || vendor?.id;
};

const getVendorName = (vendor) => {
  return (
    vendor?.storeName ||
    vendor?.businessName ||
    vendor?.name ||
    (vendor?.user
      ? `${vendor.user.firstName || ""} ${vendor.user.lastName || ""}`.trim()
      : "") ||
    "Unnamed Store"
  );
};

const getVendorOwnerName = (vendor) => {
  if (vendor?.user?.firstName || vendor?.user?.lastName) {
    return `${vendor.user.firstName || ""} ${vendor.user.lastName || ""}`.trim();
  }
  return vendor?.ownerName || vendor?.contactPerson || "";
};

const getVendorEmail = (vendor) => {
  return (
    vendor?.user?.email ||
    vendor?.userId?.email ||
    vendor?.email ||
    vendor?.contactEmail ||
    "N/A"
  );
};

const getVendorPhone = (vendor) => {
  return (
    vendor?.user?.phone ||
    vendor?.phone ||
    vendor?.contactPhone ||
    vendor?.businessAddress?.phone ||
    ""
  );
};

// Extracts Image URL with multiple fallbacks
const getVendorImage = (vendor) => {
  return (
    vendor?.storeLogo ||
    vendor?.logo ||
    vendor?.storeImage ||
    vendor?.image ||
    vendor?.avatar ||
    vendor?.user?.profilePicture ||
    vendor?.user?.avatar ||
    null
  );
};

/* NORMALIZE STATUS */
const getNormalizedStatus = (vendor) => {
  const status = String(
    vendor?.status || vendor?.approvalStatus || "",
  ).toLowerCase();

  if (status === "approved" && vendor?.isActive !== false) {
    return "Active";
  }
  if (status === "pending") {
    return "Pending";
  }
  if (
    status === "rejected" ||
    status === "suspended" ||
    vendor?.isActive === false
  ) {
    return "Suspended";
  }
  return "Active";
};

/* CATEGORY NAME RESOLVER */
const getVendorCategoryName = (vendor, allCategories = []) => {
  if (!vendor) return "No Category";

  const rawCat =
    vendor.category ||
    vendor.categories ||
    vendor.categoryId ||
    vendor.categoryName ||
    vendor.businessCategory;

  if (!rawCat) return "No Category";

  // CASE 1: Array of categories
  if (Array.isArray(rawCat) && rawCat.length > 0) {
    const names = rawCat
      .map((cat) => {
        if (typeof cat === "object" && cat !== null) {
          return cat.name || cat.categoryName || cat.title || "";
        }
        const catStr = String(cat).trim();
        const found = allCategories.find(
          (item) => String(item._id || item.id) === catStr,
        );
        return found ? found.name || found.categoryName : catStr;
      })
      .filter(Boolean);

    if (names.length > 0) return names.join(", ");
  }

  // CASE 2: Single populated Category Object
  if (typeof rawCat === "object" && rawCat !== null) {
    return rawCat.name || rawCat.categoryName || rawCat.title || "No Category";
  }

  // CASE 3: Single Category String or ObjectId
  if (typeof rawCat === "string" && rawCat.trim()) {
    const catStr = rawCat.trim();
    const found = allCategories.find(
      (item) => String(item._id || item.id) === catStr,
    );
    if (found) return found.name || found.categoryName;
    if (!/^[0-9a-fA-F]{24}$/.test(catStr)) return catStr;
  }

  if (vendor.categoryName && typeof vendor.categoryName === "string") {
    return vendor.categoryName;
  }

  return "No Category";
};

/* VENDOR AVATAR COMPONENT WITH AUTO-IMAGE & BROKEN LINK FALLBACK */
const VendorAvatar = ({ vendor, size = "md" }) => {
  const [imageError, setImageError] = useState(false);
  const imageUrl = getVendorImage(vendor);
  const name = getVendorName(vendor);
  const initials = getInitials(name);
  const status = getNormalizedStatus(vendor);

  const sizeClasses =
    {
      sm: "w-8 h-8 text-[11px] rounded-lg",
      md: "w-11 h-11 text-xs rounded-xl",
      lg: "w-14 h-14 text-sm rounded-2xl",
    }[size] || "w-11 h-11 text-xs rounded-xl";

  const statusDotColor =
    {
      Active: "bg-emerald-500 ring-white",
      Pending: "bg-amber-400 ring-white",
      Suspended: "bg-rose-500 ring-white",
    }[status] || "bg-slate-400 ring-white";

  return (
    <div className="relative inline-block shrink-0">
      {imageUrl && !imageError ? (
        <img
          src={imageUrl}
          alt={name}
          onError={() => setImageError(true)}
          className={`${sizeClasses} object-cover border border-slate-200/80 shadow-xs bg-white transition hover:scale-105`}
        />
      ) : (
        <div
          className={`${sizeClasses} grid place-items-center font-extrabold bg-gradient-to-br from-[#287b6d]/15 to-[#287b6d]/5 text-[#287b6d] border border-[#287b6d]/20 shadow-xs tracking-wider select-none`}
        >
          {initials}
        </div>
      )}

      {/* Online / Approval Status Indicator Dot */}
      <span
        title={`Status: ${status}`}
        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ${statusDotColor}`}
      />
    </div>
  );
};

/* MAIN COMPONENT */
const AdminVendors = () => {
  const token = localStorage.getItem("adminToken");
  const navigate = useNavigate();

  const [vendors, setVendors] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  /* FETCH CATEGORIES */
  const fetchCategories = async () => {
    setCategoryLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/categories`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      });
      const data = res.data;
      let list = [];
      if (Array.isArray(data)) list = data;
      else if (data?.success && Array.isArray(data.categories))
        list = data.categories;
      else if (Array.isArray(data?.categories)) list = data.categories;
      else if (Array.isArray(data?.data)) list = data.data;

      setAllCategories(list);
    } catch (err) {
      handleAuthError(err);
      console.error("Error fetching categories:", err);
      setAllCategories([]);
    } finally {
      setCategoryLoading(false);
    }
  };

  /* FETCH VENDORS */
  const fetchVendors = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await axios.get(`${API_BASE_URL}/vendors`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      });
      const data = res.data;

      let list = [];
      if (Array.isArray(data)) list = data;
      else if (data?.success && Array.isArray(data.vendors))
        list = data.vendors;
      else if (Array.isArray(data?.vendors)) list = data.vendors;
      else if (Array.isArray(data?.data)) list = data.data;

      setVendors(list);
    } catch (err) {
      handleAuthError(err);
      console.error("Error fetching vendors:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load vendors from server.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
    fetchCategories();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, category, status, sortBy]);

  /* DYNAMIC CATEGORY DROPDOWN LIST */
  const categories = useMemo(() => {
    const backendCatNames = allCategories
      .map((item) => item?.name || item?.categoryName)
      .filter(Boolean);

    const vendorCatNames = vendors
      .map((v) => getVendorCategoryName(v, allCategories))
      .filter((name) => name && name !== "No Category");

    return ["All", ...new Set([...backendCatNames, ...vendorCatNames])];
  }, [allCategories, vendors]);

  /* STATISTICS */
  const totalVendors = vendors.length;
  const activeCount = vendors.filter(
    (v) => getNormalizedStatus(v) === "Active",
  ).length;
  const pendingCount = vendors.filter(
    (v) => getNormalizedStatus(v) === "Pending",
  ).length;
  const suspendedCount = vendors.filter(
    (v) => getNormalizedStatus(v) === "Suspended",
  ).length;

  /* FILTER & SORT VENDORS */
  const filteredVendors = useMemo(() => {
    let result = vendors.filter((vendor) => {
      const name = getVendorName(vendor);
      const owner = getVendorOwnerName(vendor);
      const businessType = vendor?.businessType || "";
      const email = getVendorEmail(vendor);
      const phone = getVendorPhone(vendor);
      const categoryName = getVendorCategoryName(vendor, allCategories);
      const vendorStatus = getNormalizedStatus(vendor);

      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        name.toLowerCase().includes(searchText) ||
        owner.toLowerCase().includes(searchText) ||
        String(businessType).toLowerCase().includes(searchText) ||
        String(email).toLowerCase().includes(searchText) ||
        String(phone).toLowerCase().includes(searchText) ||
        categoryName.toLowerCase().includes(searchText);

      const matchesCategory =
        category === "All" ||
        categoryName.split(", ").includes(category) ||
        categoryName === category;

      const matchesStatus = status === "All" || vendorStatus === status;

      return matchesSearch && matchesCategory && matchesStatus;
    });

    // Sorting
    return result.sort((a, b) => {
      if (sortBy === "name") {
        return getVendorName(a).localeCompare(getVendorName(b));
      }
      if (sortBy === "products") {
        const pA = Number(a?.productCount ?? a?.products?.length ?? 0);
        const pB = Number(b?.productCount ?? b?.products?.length ?? 0);
        return pB - pA;
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      // Default: newest
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [vendors, allCategories, search, category, status, sortBy]);

  /* PAGINATION SLICE */
  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage) || 1;
  const paginatedVendors = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredVendors.slice(start, start + itemsPerPage);
  }, [filteredVendors, currentPage, itemsPerPage]);

  const hasActiveFilters = search || category !== "All" || status !== "All";

  const clearFilters = () => {
    setSearch("");
    setCategory("All");
    setStatus("All");
    setSortBy("newest");
  };

  /* APPROVE VENDOR */
  const handleActivate = async (vendor) => {
    const targetId = getVendorId(vendor);
    if (!targetId) return alert("Vendor ID not found.");

    setActionLoadingId(targetId);
    try {
      const res = await axios.put(
        `${API_BASE_URL}/vendors/${targetId}/approve`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
        },
      );
      if (res.status === 200 || res.data?.success) {
        setVendors((prev) =>
          prev.map((item) =>
            getVendorId(item) === targetId
              ? {
                  ...item,
                  status: "approved",
                  approvalStatus: "approved",
                  isActive: true,
                }
              : item,
          ),
        );
      }
    } catch (err) {
      handleAuthError(err);
      console.error("Approve vendor error:", err);
      alert(
        err.response?.data?.message ||
          err.message ||
          "Failed to approve vendor.",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  /* SUSPEND VENDOR */
  const handleSuspend = async (vendor) => {
    const targetId = getVendorId(vendor);
    if (!targetId) return alert("Vendor ID not found.");

    setActionLoadingId(targetId);
    try {
      const res = await axios.put(
        `${API_BASE_URL}/vendors/${targetId}/suspend`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
        },
      );
      if (res.status === 200 || res.data?.success) {
        setVendors((prev) =>
          prev.map((item) =>
            getVendorId(item) === targetId
              ? {
                  ...item,
                  status: "rejected",
                  approvalStatus: "rejected",
                  isActive: false,
                }
              : item,
          ),
        );
      }
    } catch (err) {
      handleAuthError(err);
      console.error("Suspend vendor error:", err);
      alert(
        err.response?.data?.message ||
          err.message ||
          "Failed to suspend vendor.",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  /* DELETE VENDOR */
  const handleDelete = async (vendor) => {
    const name = getVendorName(vendor);
    if (
      !window.confirm(
        `Are you sure you want to permanently delete store "${name}"?`,
      )
    )
      return;

    const targetId = getVendorId(vendor);
    if (!targetId) return alert("Vendor ID not found.");

    setActionLoadingId(targetId);
    try {
      const res = await axios.delete(`${API_BASE_URL}/vendors/${targetId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      });
      if (res.status === 200 || res.data?.success) {
        setVendors((prev) =>
          prev.filter((item) => getVendorId(item) !== targetId),
        );
      }
    } catch (err) {
      handleAuthError(err);
      console.error("Delete vendor error:", err);
      alert(
        err.response?.data?.message ||
          err.message ||
          "Failed to delete vendor.",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadgeStyle = (statusValue) => {
    switch (statusValue) {
      case "Active":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Suspended":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* PAGE HEADER */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[#287b6d]" />
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#287b6d]">
              Marketplace Control
            </p>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
            Vendors
          </h1>
          <p className="mt-1 text-xs text-slate-500 md:text-sm">
            Monitor vendor storefronts, verify seller approvals, and track store
            activity.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              fetchVendors();
              fetchCategories();
            }}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-95"
          >
            <RefreshCw
              size={14}
              className={
                loading || categoryLoading ? "animate-spin text-[#287b6d]" : ""
              }
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50/80 p-4 text-xs font-semibold text-red-700 shadow-xs">
          <AlertCircle size={18} className="shrink-0 text-red-600" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {/* METRIC CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:border-[#287b6d]/40 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Total Vendors
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">
                {formatNumber(totalVendors)}
              </h2>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#287b6d]/10 text-[#287b6d] transition group-hover:scale-110">
              <Store size={20} />
            </div>
          </div>
          <p className="mt-3 text-[11px] font-medium text-slate-400">
            All registered merchants
          </p>
        </div>

        {/* Active */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:border-emerald-300 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Active Stores
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">
                {formatNumber(activeCount)}
              </h2>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:scale-110">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <p className="mt-3 text-[11px] font-medium text-slate-400">
            Approved & actively selling
          </p>
        </div>

        {/* Pending */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:border-amber-300 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Pending Review
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">
                {formatNumber(pendingCount)}
              </h2>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-600 transition group-hover:scale-110">
              <Clock3 size={20} />
            </div>
          </div>
          <p className="mt-3 text-[11px] font-medium text-slate-400">
            Awaiting admin authorization
          </p>
        </div>

        {/* Suspended */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:border-rose-300 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Suspended</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">
                {formatNumber(suspendedCount)}
              </h2>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-rose-50 text-rose-500 transition group-hover:scale-110">
              <Ban size={20} />
            </div>
          </div>
          <p className="mt-3 text-[11px] font-medium text-slate-400">
            Blocked or restricted
          </p>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search store name, owner, email, phone, or category..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-9 text-xs font-medium outline-none transition focus:border-[#287b6d] focus:bg-white focus:ring-4 focus:ring-[#287b6d]/10"
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

          {/* Category Filter */}
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 pr-9 text-xs font-semibold text-slate-700 outline-none focus:border-[#287b6d] md:w-48"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item === "All" ? "All Categories" : item}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 pr-9 text-xs font-semibold text-slate-700 outline-none focus:border-[#287b6d] md:w-40"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Suspended">Suspended</option>
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
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 pr-9 text-xs font-semibold text-slate-700 outline-none focus:border-[#287b6d] md:w-40"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Store Name (A-Z)</option>
              <option value="products">Most Products</option>
            </select>
            <ArrowUpDown
              size={13}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              <X size={13} />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* VENDORS TABLE / CARDS CONTAINER */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {/* Table Header Bar */}
        <div className="flex flex-col justify-between gap-2 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Store Registry
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {filteredVendors.length}
              </span>{" "}
              {filteredVendors.length === 1 ? "vendor" : "vendors"}
            </p>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 size={36} className="animate-spin text-[#287b6d]" />
            <p className="mt-3 text-xs font-semibold text-slate-600">
              Loading vendors from database...
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75">
                    <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Store & Merchant
                    </th>
                    <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Category
                    </th>
                    <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Business Type
                    </th>
                    <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Products
                    </th>
                    <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Status
                    </th>
                    <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Joined
                    </th>
                    <th className="px-5 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedVendors.map((vendor) => {
                    const vId = getVendorId(vendor);
                    const vName = getVendorName(vendor);
                    const vOwner = getVendorOwnerName(vendor);
                    const vEmail = getVendorEmail(vendor);
                    const vPhone = getVendorPhone(vendor);
                    const vBusinessType = vendor?.businessType || "Standard";
                    const vCategory = getVendorCategoryName(
                      vendor,
                      allCategories,
                    );
                    const vProductCount =
                      vendor?.productCount ??
                      (Array.isArray(vendor?.products)
                        ? vendor.products.length
                        : 0);
                    const vStatus = getNormalizedStatus(vendor);
                    const isActionLoading = actionLoadingId === vId;

                    return (
                      <tr
                        key={vId}
                        className="group transition duration-150 hover:bg-slate-50/70"
                      >
                        {/* STORE NAME & LOGO AVATAR */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3.5">
                            <VendorAvatar vendor={vendor} size="md" />

                            <div className="min-w-0">
                              <p
                                onClick={() =>
                                  navigate(`/admin/vendors/${vId}`)
                                }
                                className="cursor-pointer truncate text-xs font-bold text-slate-800 transition hover:text-[#287b6d]"
                              >
                                {vName}
                              </p>

                              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                                <Mail size={11} className="shrink-0" />
                                <span className="truncate">{vEmail}</span>
                              </div>

                              {vOwner && (
                                <p className="mt-0.5 truncate text-[10px] text-slate-400">
                                  Owner:{" "}
                                  <span className="font-medium text-slate-600">
                                    {vOwner}
                                  </span>
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* CATEGORY */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                              vCategory === "No Category"
                                ? "bg-slate-100 text-slate-400"
                                : "bg-teal-50 text-[#287b6d]"
                            }`}
                          >
                            {vCategory}
                          </span>
                        </td>

                        {/* BUSINESS TYPE */}
                        <td className="px-5 py-4">
                          <span className="inline-block rounded-md border border-slate-200/80 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                            {vBusinessType}
                          </span>
                        </td>

                        {/* PRODUCTS */}
                        <td className="px-5 py-4">
                          <span className="text-xs font-extrabold text-slate-800">
                            {formatNumber(vProductCount)}
                          </span>
                          <span className="ml-1 text-[10px] font-medium text-slate-400">
                            items
                          </span>
                        </td>

                        {/* STATUS BADGE */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getStatusBadgeStyle(
                              vStatus,
                            )}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                vStatus === "Active"
                                  ? "bg-emerald-500"
                                  : vStatus === "Pending"
                                    ? "bg-amber-500"
                                    : "bg-rose-500"
                              }`}
                            />
                            {vStatus}
                          </span>
                        </td>

                        {/* JOINED */}
                        <td className="px-5 py-4 text-xs font-medium text-slate-500">
                          {vendor?.createdAt
                            ? new Date(vendor.createdAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : "N/A"}
                        </td>

                        {/* ACTIONS */}
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            {isActionLoading ? (
                              <Loader2
                                size={16}
                                className="animate-spin text-slate-400"
                              />
                            ) : (
                              <>
                                <button
                                  type="button"
                                  title="View Store Details"
                                  onClick={() =>
                                    navigate(`/admin/vendors/${vId}`)
                                  }
                                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-[#287b6d]"
                                >
                                  <Eye size={16} />
                                </button>

                                {vStatus !== "Active" && (
                                  <button
                                    type="button"
                                    title="Approve Store"
                                    onClick={() => handleActivate(vendor)}
                                    className="rounded-lg p-2 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
                                  >
                                    <CheckCircle2 size={16} />
                                  </button>
                                )}

                                {vStatus === "Active" && (
                                  <button
                                    type="button"
                                    title="Suspend Store"
                                    onClick={() => handleSuspend(vendor)}
                                    className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                                  >
                                    <Ban size={16} />
                                  </button>
                                )}

                                <button
                                  type="button"
                                  title="Delete Vendor"
                                  onClick={() => handleDelete(vendor)}
                                  className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Responsive Cards */}
            <div className="divide-y divide-slate-100 lg:hidden">
              {paginatedVendors.map((vendor) => {
                const vId = getVendorId(vendor);
                const vName = getVendorName(vendor);
                const vOwner = getVendorOwnerName(vendor);
                const vEmail = getVendorEmail(vendor);
                const vBusinessType = vendor?.businessType || "Standard";
                const vCategory = getVendorCategoryName(vendor, allCategories);
                const vProductCount =
                  vendor?.productCount ??
                  (Array.isArray(vendor?.products)
                    ? vendor.products.length
                    : 0);
                const vStatus = getNormalizedStatus(vendor);
                const isActionLoading = actionLoadingId === vId;

                return (
                  <div
                    key={vId}
                    className="p-4 transition hover:bg-slate-50/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <VendorAvatar vendor={vendor} size="md" />

                        <div className="min-w-0">
                          <p
                            onClick={() => navigate(`/admin/vendors/${vId}`)}
                            className="cursor-pointer truncate text-sm font-bold text-slate-800"
                          >
                            {vName}
                          </p>
                          <p className="truncate text-[11px] text-slate-400">
                            {vEmail}
                          </p>
                          {vOwner && (
                            <p className="truncate text-[10px] text-slate-500">
                              Owner: {vOwner}
                            </p>
                          )}
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getStatusBadgeStyle(
                          vStatus,
                        )}`}
                      >
                        {vStatus}
                      </span>
                    </div>

                    <div className="mt-3.5 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2.5 text-center">
                      <div>
                        <p className="text-[10px] font-medium text-slate-400">
                          Category
                        </p>
                        <p className="mt-0.5 truncate text-[11px] font-bold text-slate-700">
                          {vCategory}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-slate-400">
                          Type
                        </p>
                        <p className="mt-0.5 truncate text-[11px] font-bold text-slate-700">
                          {vBusinessType}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-slate-400">
                          Products
                        </p>
                        <p className="mt-0.5 text-[11px] font-black text-slate-800">
                          {formatNumber(vProductCount)}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex items-center justify-end gap-1 pt-2">
                      {isActionLoading ? (
                        <Loader2
                          size={16}
                          className="animate-spin text-slate-400"
                        />
                      ) : (
                        <>
                          <button
                            type="button"
                            title="View"
                            onClick={() => navigate(`/admin/vendors/${vId}`)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-[#287b6d]"
                          >
                            <Eye size={16} />
                          </button>

                          {vStatus !== "Active" && (
                            <button
                              type="button"
                              title="Approve"
                              onClick={() => handleActivate(vendor)}
                              className="rounded-lg p-2 text-emerald-500 hover:bg-emerald-50"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                          )}

                          {vStatus === "Active" && (
                            <button
                              type="button"
                              title="Suspend"
                              onClick={() => handleSuspend(vendor)}
                              className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"
                            >
                              <Ban size={16} />
                            </button>
                          )}

                          <button
                            type="button"
                            title="Delete"
                            onClick={() => handleDelete(vendor)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* EMPTY STATE */}
        {!loading && filteredVendors.length === 0 && (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-50 text-slate-400">
              <Users size={24} />
            </div>
            <h3 className="mt-4 text-sm font-bold text-slate-800">
              No vendors found
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Try adjusting your search terms or filter selections.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* PAGINATION BAR */}
        {!loading && filteredVendors.length > itemsPerPage && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-3.5 sm:flex-row">
            <p className="text-xs text-slate-400">
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-700">
                {Math.min(currentPage * itemsPerPage, filteredVendors.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700">
                {filteredVendors.length}
              </span>{" "}
              entries
            </p>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => {
                if (
                  pg === 1 ||
                  pg === totalPages ||
                  (pg >= currentPage - 1 && pg <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pg}
                      type="button"
                      onClick={() => setCurrentPage(pg)}
                      className={`h-8 w-8 rounded-lg text-xs font-bold transition shadow-xs ${
                        currentPage === pg
                          ? "bg-[#287b6d] text-white"
                          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {pg}
                    </button>
                  );
                }
                if (pg === currentPage - 2 || pg === currentPage + 2) {
                  return (
                    <span key={pg} className="px-1 text-slate-400 text-xs">
                      ...
                    </span>
                  );
                }
                return null;
              })}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVendors;
