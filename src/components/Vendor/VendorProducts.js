import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRouteVendor";
import { getStoredVendor } from "../../utils/vendorAuth";
import {
  Plus,
  Search,
  Eye,
  Edit3,
  Trash2,
  Package,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
  Loader2,
  ImageIcon,
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

// HELPER: GET PRODUCT INITIALS FOR FALLBACK
const getInitials = (name) => {
  if (!name) return "P";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const VendorProducts = () => {
  const token = localStorage.getItem("vendorToken");
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");

  const [currentPage, setCurrentPage] = useState(1);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const productsPerPage = 6;

  // GET LOGGED-IN VENDOR ID
  const getVendorId = () => {
    try {
      const storedVendor = getStoredVendor ? getStoredVendor() : null;

      const profile = JSON.parse(localStorage.getItem("vendorProfile") || "{}");

      const user = JSON.parse(localStorage.getItem("vendorUser") || "{}");

      return (
        storedVendor?._id ||
        storedVendor?.id ||
        storedVendor?.vendorId ||
        profile?._id ||
        profile?.id ||
        profile?.vendorId ||
        user?._id ||
        user?.id ||
        null
      );
    } catch (error) {
      console.error("Get vendor ID error:", error);
      return null;
    }
  };

  // FETCH PRODUCTS
  const fetchVendorProducts = async () => {
    setLoading(true);
    setError("");

    try {
      const vendorId = getVendorId();

      if (!vendorId) {
        setProducts([]);
        setError("Vendor information not found. Please login again.");
        return;
      }

      const res = await axios.get(`${API_BASE_URL}/products`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      });

      const data = res.data;
      let allProducts = [];

      if (Array.isArray(data)) {
        allProducts = data;
      } else if (data?.success && Array.isArray(data.products)) {
        allProducts = data.products;
      } else if (Array.isArray(data?.products)) {
        allProducts = data.products;
      }

      // Filter only products belonging to this vendor
      const vendorProducts = allProducts.filter((product) => {
        const productVendorId =
          typeof product.vendor === "object" && product.vendor !== null
            ? product.vendor._id || product.vendor.id
            : product.vendor;

        return String(productVendorId) === String(vendorId);
      });

      setProducts(vendorProducts);
    } catch (err) {
      handleAuthError(err);
      console.error("Error fetching vendor products:", err);
      setProducts([]);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch products from server.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorProducts();
  }, []);

  // CATEGORIES LIST
  const categories = useMemo(() => {
    const categoryList = products.map((product) => {
      if (typeof product.category === "object" && product.category !== null) {
        return product.category.name || product.categoryName || "General";
      }
      return product.categoryName || product.category || "General";
    });

    return ["All", ...new Set(categoryList)];
  }, [products]);

  // FILTER & SORT
  const filteredProducts = useMemo(() => {
    let result = Array.isArray(products) ? [...products] : [];

    // Search
    if (search.trim()) {
      const searchValue = search.toLowerCase().trim();
      result = result.filter((product) =>
        (product.name || "").toLowerCase().includes(searchValue),
      );
    }

    // Category
    if (category !== "All") {
      result = result.filter((product) => {
        const categoryName =
          typeof product.category === "object" && product.category !== null
            ? product.category?.name
            : product.categoryName || product.category;

        return categoryName === category;
      });
    }

    // Status
    if (status !== "All") {
      result = result.filter((product) => {
        const stock = Number(product.stock || 0);
        let productStatus =
          product.status || (product.isActive ? "Active" : "Draft");

        if (stock <= 0) {
          productStatus = "Out of Stock";
        } else if (stock <= 5) {
          productStatus = "Low Stock";
        }

        return productStatus === status;
      });
    }

    // Sort
    if (sortBy === "Price Low") {
      result.sort(
        (a, b) =>
          Number(a.discountPrice || a.price || 0) -
          Number(b.discountPrice || b.price || 0),
      );
    } else if (sortBy === "Price High") {
      result.sort(
        (a, b) =>
          Number(b.discountPrice || b.price || 0) -
          Number(a.discountPrice || a.price || 0),
      );
    } else if (sortBy === "Newest") {
      result.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      );
    }

    return result;
  }, [products, search, category, status, sortBy]);

  // PAGINATION
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const visibleProducts = filteredProducts.slice(
    startIndex,
    startIndex + productsPerPage,
  );

  // DELETE
  const handleDeleteClick = (product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedProduct) return;

    const targetId = selectedProduct._id || selectedProduct.id;
    if (!targetId) {
      alert("Product ID not found.");
      return;
    }

    setIsDeleting(true);

    try {
      const res = await axios.delete(`${API_BASE_URL}/products/${targetId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      });

      if (res.data?.success || res.status === 200) {
        setProducts((prev) =>
          prev.filter((product) => (product._id || product.id) !== targetId),
        );

        setCurrentPage((page) => {
          const remainingProducts = filteredProducts.length - 1;
          const newTotalPages = Math.max(
            1,
            Math.ceil(remainingProducts / productsPerPage),
          );
          return Math.min(page, newTotalPages);
        });
      } else {
        throw new Error(res.data?.message || "Failed to delete product.");
      }
    } catch (err) {
      handleAuthError(err);
      console.error("Delete product error:", err);
      alert(
        err.response?.data?.message ||
          err.message ||
          "Could not delete product.",
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setSelectedProduct(null);
    }
  };

  const getStatusStyle = (productStatus) => {
    switch (productStatus) {
      case "Active":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Low Stock":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Out of Stock":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const getStockStyle = (stock) => {
    const num = Number(stock || 0);
    if (num === 0) return "text-red-600";
    if (num <= 5) return "text-amber-600";
    return "text-emerald-600";
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your product catalog, media gallery, and stock levels.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchVendorProducts}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <Link
            to="/vendor/products/add"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus size={18} />
            Add Product
          </Link>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">My Products</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatNumber(products.length)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Active</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {formatNumber(
              products.filter((product) => {
                const stock = Number(product.stock || 0);
                return (
                  stock > 0 &&
                  (product.status === "Active" || product.isActive === true)
                );
              }).length,
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Low Stock</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">
            {formatNumber(
              products.filter((product) => {
                const stock = Number(product.stock || 0);
                return stock > 0 && stock <= 5;
              }).length,
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Out of Stock</p>
          <p className="mt-1 text-2xl font-bold text-red-600">
            {formatNumber(
              products.filter((product) => Number(product.stock || 0) <= 0)
                .length,
            )}
          </p>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 xl:flex-row">
          {/* SEARCH */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search my products by name..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          {/* CATEGORY */}
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="min-w-[170px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          {/* STATUS */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="min-w-[150px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>

          {/* SORT */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            className="min-w-[150px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
          >
            <option value="Newest">Newest</option>
            <option value="Price Low">Price: Low to High</option>
            <option value="Price High">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* TABLE WITH PRODUCT IMAGE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 size={32} className="animate-spin text-slate-600" />
            <p className="mt-3 text-sm font-medium text-slate-600">
              Loading products...
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Product</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Subcategory</th>
                  <th className="px-5 py-4">Price</th>
                  <th className="px-5 py-4">Stock</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-sm">
                {visibleProducts.map((product) => {
                  const prodId = product._id || product.id;

                  // Resolve image from array or string
                  const productImage = product.image || null;

                  const catName =
                    typeof product.category === "object" &&
                    product.category !== null
                      ? product.category?.name || "General"
                      : product.categoryName || product.category || "General";

                  const stock = Number(product.stock || 0);
                  let prodStatus =
                    product.status || (product.isActive ? "Active" : "Draft");

                  if (stock <= 0) {
                    prodStatus = "Out of Stock";
                  } else if (stock <= 5) {
                    prodStatus = "Low Stock";
                  }

                  return (
                    <tr key={prodId} className="hover:bg-slate-50 transition">
                      {/* PRODUCT WITH IMAGE THUMBNAIL */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {/* Image Box */}
                          <div className="w-12 h-12 shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center shadow-xs">
                            {productImage ? (
                              <img
                                src={productImage}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.style.display = "none";
                                  e.target.parentElement.innerHTML = `<span class="text-xs font-bold text-slate-500">${getInitials(
                                    product.name,
                                  )}</span>`;
                                }}
                              />
                            ) : (
                              <span className="text-xs font-bold text-slate-500">
                                {getInitials(product.name)}
                              </span>
                            )}
                          </div>

                          {/* Name & ID */}
                          <div className="min-w-0">
                            <Link
                              to={`/vendor/products/${prodId}`}
                              className="font-semibold text-slate-900 hover:text-blue-600 transition block truncate max-w-[220px]"
                              title={product.name}
                            >
                              {product.name || "Unnamed Product"}
                            </Link>
                            <span className="text-[11px] text-slate-400 font-mono">
                              ID: {String(prodId).slice(-6)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* CATEGORY */}
                      <td className="px-5 py-4 text-slate-600">{catName}</td>

                      {/* SUBCATEGORY */}
                      <td className="px-5 py-4 text-slate-600">
                        {product.subcategory || "-"}
                      </td>

                      {/* PRICE */}
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        ₹{formatPrice(product.discountPrice || product.price)}
                      </td>

                      {/* STOCK */}
                      <td
                        className={`px-5 py-4 font-semibold ${getStockStyle(
                          product.stock,
                        )}`}
                      >
                        {formatNumber(product.stock)}
                      </td>

                      {/* STATUS */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusStyle(
                            prodStatus,
                          )}`}
                        >
                          {prodStatus}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* VIEW */}
                          <Link
                            to={`/vendor/products/${prodId}`}
                            className="p-2 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition"
                            title="View Product"
                          >
                            <Eye size={17} />
                          </Link>

                          {/* EDIT */}
                          <Link
                            to={`/vendor/products/${prodId}/edit`}
                            className="p-2 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-slate-100 transition"
                            title="Edit Product"
                          >
                            <Edit3 size={17} />
                          </Link>

                          {/* DELETE */}
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(product)}
                            className="p-2 text-slate-500 hover:text-red-600 rounded-lg hover:bg-slate-100 transition"
                            title="Delete Product"
                          >
                            <Trash2 size={17} />
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
        {!loading && visibleProducts.length === 0 && (
          <div className="p-12 text-center">
            <Package size={42} className="mx-auto text-slate-300" />
            <h3 className="mt-4 font-semibold text-slate-900">
              No products found
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              No products match your logged-in vendor account.
            </p>
            <Link
              to="/vendor/products/add"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <Plus size={16} />
              Add Product
            </Link>
          </div>
        )}

        {/* PAGINATION */}
        {!loading && filteredProducts.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
            <p className="text-sm text-slate-500">
              Page{" "}
              <span className="font-semibold text-slate-700">
                {currentPage}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700">
                {totalPages || 1}
              </span>
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <ChevronLeft size={17} />
              </button>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Delete Product?
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-slate-700">
                    {selectedProduct?.name}
                  </span>
                  ?
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedProduct(null);
                }}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedProduct(null);
                }}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete Product
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

export default VendorProducts;
