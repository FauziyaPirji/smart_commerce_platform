import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRouteVendor";
import {
  ArrowLeft,
  Edit,
  Package,
  Tag,
  ShoppingBag,
  Layers,
  Bookmark,
  IndianRupee,
  BarChart3,
  Loader2,
  RefreshCw,
  Store,
  FileText,
  AlertTriangle,
  BadgePercent,
  Trash2,
} from "lucide-react";

const API_BASE_URL = "https://smart-commerce-platform-backend.onrender.com/api";

// SAFE NUMBER & CURRENCY HELPERS
const formatPrice = (val) => {
  const num = Number(val);
  return isNaN(num) ? "0" : num.toLocaleString("en-IN");
};

const formatNumber = (val) => {
  const num = Number(val);
  return isNaN(num) ? "0" : num.toLocaleString("en-IN");
};

const VendorViewProduct = () => {
  const token = localStorage.getItem("vendorToken");
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // FETCH PRODUCT DETAILS FROM BACKEND
  const fetchProductDetails = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await axios.get(`${API_BASE_URL}/products/${productId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      });

      const data = res.data;

      if (data.success && data.product) {
        setProduct(data.product);
      } else if (data.product) {
        setProduct(data.product);
      } else {
        throw new Error("Product data not found.");
      }
    } catch (err) {
      handleAuthError(err);

      console.error("Error fetching product details:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not retrieve product details.",
      );

      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  // DELETE HANDLER
  const handleDeleteProduct = async () => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    const targetId = product?._id || product?.id || productId;

    setIsDeleting(true);

    try {
      const res = await axios.delete(`${API_BASE_URL}/products/${targetId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      });

      if (res.data?.success || res.status === 200) {
        alert("Product deleted successfully!");
        navigate("/vendor/products");
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
    }
  };

  /* LOADING STATE */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-20 text-slate-500 shadow-xs">
        <Loader2 size={36} className="animate-spin text-slate-700" />
        <p className="mt-4 text-sm font-medium">Loading product details...</p>
      </div>
    );
  }

  /* NOT FOUND STATE */
  if (!product || error) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-xs">
        <Package size={48} className="mx-auto mb-4 text-slate-300" />

        <h2 className="text-xl font-bold text-slate-900">Product Not Found</h2>

        <p className="mt-2 text-sm text-slate-500">
          {error ||
            "The product you are looking for does not exist or has been removed."}
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={fetchProductDetails}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Retry
          </button>

          <Link
            to="/vendor/products"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            <ArrowLeft size={17} />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  /* EXTRACT AND CALCULATE ALL FIELDS SAFELY */

  const targetId = product._id || product.id || productId;

  const name = product.name || "Untitled Product";

  const slug = product.slug || "N/A";

  const price = Number(product.price || 0);

  const mrp = Number(product.mrp || 0);

  const discountPrice = Number(product.discountPrice || price);

  const stock = Number(product.stock || 0);

  const lowStockAlert = Number(
    product.lowStockAlert || product.lowStockLimit || 5,
  );

  const sold = Number(product.sold || product.totalSold || product.sales || 0);

  const revenue = sold * price;

  const discountPercent =
    price > discountPrice
      ? Math.round(((price - discountPrice) / price) * 100)
      : 0;

  const categoryName =
    typeof product.category === "object" && product.category !== null
      ? product.category.name || "Uncategorized"
      : product.categoryName || product.category || "Uncategorized";

  const subcategory = product.subcategory || "Not specified";

  const approvalStatus = product.approvalStatus || "approved";

  const prodStatus = product.status || (product.isActive ? "Active" : "Draft");

  const isActive = prodStatus.toLowerCase() === "active";

  const shortDescription =
    product.shortDescription || "No short description provided.";

  const fullDescription =
    product.description ||
    product.longDescription ||
    product.shortDescription ||
    "No detailed description provided.";

  const productTags = Array.isArray(product.productTags)
    ? product.productTags
    : [];

  const specifications = Array.isArray(product.specifications)
    ? product.specifications
    : typeof product.specifications === "object" &&
        product.specifications !== null
      ? Object.entries(product.specifications).map(([name, value]) => ({
          name: name.replace(/([A-Z])/g, " $1"),
          value: String(value),
          isKeyFeature: false,
        }))
      : [];

  const vendorName =
    typeof product.vendor === "object" && product.vendor !== null
      ? product.vendor.storeName ||
        `${product.vendor.firstName || ""} ${
          product.vendor.lastName || ""
        }`.trim() ||
        product.vendor.email ||
        "My Store"
      : product.vendor || "My Store";

  const createdAtFormatted = product.createdAt
    ? new Date(product.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Not available";

  const updatedAtFormatted = product.updatedAt
    ? new Date(product.updatedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Not available";

  const getStockBadge = () => {
    if (stock <= 0) {
      return {
        label: "Out of Stock",
        style: "bg-red-50 text-red-700 border-red-200",
      };
    }

    if (stock <= lowStockAlert) {
      return {
        label: "Low Stock Alert",
        style: "bg-amber-50 text-amber-700 border-amber-200",
      };
    }

    return {
      label: "In Stock",
      style: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  };

  const stockBadge = getStockBadge();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/vendor/products"
            className="rounded-xl border border-slate-200 p-2.5 transition hover:bg-slate-100"
          >
            <ArrowLeft size={19} />
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Product Details
            </h1>

            <p className="mt-0.5 text-sm text-slate-500">
              Product ID:{" "}
              <span className="font-mono text-xs font-semibold text-slate-700">
                {targetId}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDeleteProduct}
            disabled={isDeleting}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
            Delete
          </button>

          <Link
            to={`/vendor/products/${targetId}/edit`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            <Edit size={17} />
            Edit Product
          </Link>
        </div>
      </div>

      {/* MAIN OVERVIEW */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-3">
          {/* PRODUCT IMAGE */}
          <div className="border-b border-slate-200 p-6 lg:col-span-1 lg:border-b-0 lg:border-r">
            <div className="flex h-72 items-center justify-center rounded-2xl bg-slate-100">
              {Array.isArray(product.images) && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={name}
                  className="h-full w-full rounded-2xl object-contain"
                />
              ) : (
                <div className="flex size-28 items-center justify-center rounded-2xl bg-slate-900 text-5xl font-bold text-white">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <p className="mt-3 text-center text-xs text-slate-400">
              {Array.isArray(product.images) && product.images.length > 0
                ? `${product.images.length} Image(s) Uploaded`
                : "No product image uploaded"}
            </p>
          </div>

          {/* PRODUCT INFORMATION */}
          <div className="space-y-4 p-6 lg:col-span-2">
            {/* BADGES */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                <Tag size={12} />
                {categoryName}
              </span>

              {subcategory && subcategory !== "Not specified" && (
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {subcategory}
                </span>
              )}

              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  isActive
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                {prodStatus}
              </span>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  approvalStatus === "approved"
                    ? "border-teal-200 bg-teal-50 text-teal-700"
                    : approvalStatus === "rejected"
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                Approval: {approvalStatus}
              </span>
            </div>

            {/* TITLE */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{name}</h2>

              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <p>
                  Slug: <span className="font-mono text-slate-600">{slug}</span>
                </p>
              </div>
            </div>

            {/* PRICING */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center text-3xl font-extrabold text-slate-900">
                <IndianRupee size={24} />
                {formatPrice(discountPrice)}
              </div>

              {price > discountPrice && (
                <>
                  <span className="text-lg text-slate-400 line-through">
                    ₹{formatPrice(price)}
                  </span>

                  <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                    <BadgePercent size={14} />
                    {discountPercent}% OFF
                  </span>
                </>
              )}
            </div>

            {/* STOCK */}
            <div className="border-t border-slate-100 pt-3">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  Stock Inventory Level
                </span>

                <span
                  className={`rounded-lg border px-2.5 py-0.5 text-xs font-bold ${stockBadge.style}`}
                >
                  {stockBadge.label}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">
                  {formatNumber(stock)}
                </span>

                <span className="text-xs text-slate-500">
                  units available (Low stock limit: {lowStockAlert})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <Package size={20} />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500">
                Available Stock
              </p>

              <p className="text-xl font-bold text-slate-900">
                {formatNumber(stock)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <ShoppingBag size={20} />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500">Units Sold</p>

              <p className="text-xl font-bold text-slate-900">
                {formatNumber(sold)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-600">
              <BarChart3 size={20} />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500">
                Total Revenue
              </p>

              <p className="text-xl font-bold text-slate-900">
                ₹{formatPrice(revenue)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle size={20} />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500">
                Low Stock Alert
              </p>

              <p className="text-xl font-bold text-slate-900">
                {formatNumber(lowStockAlert)}
              </p>
            </div>
          </div>
        </div>

        <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-1">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-purple-50 text-purple-600">
              <Store size={20} />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500">
                Store / Vendor
              </p>

              <p className="max-w-[120px] truncate text-sm font-bold text-slate-900">
                {vendorName}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* DETAILS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT */}
        <div className="space-y-6 lg:col-span-1">
          {/* SHORT DESCRIPTION */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-3 flex items-center gap-2">
              <FileText size={18} className="text-slate-600" />

              <h2 className="font-semibold text-slate-900">
                Short Description
              </h2>
            </div>

            <p className="text-sm leading-6 text-slate-600">
              {shortDescription}
            </p>
          </div>

          {/* CLASSIFICATION */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-3">
              <Tag size={19} className="text-slate-600" />

              <h2 className="font-semibold text-slate-900">Classification</h2>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <span className="text-xs text-slate-400">Category:</span>

                <p className="font-semibold text-slate-900">{categoryName}</p>
              </div>

              <div>
                <span className="text-xs text-slate-400">Subcategory:</span>

                <p className="font-semibold text-slate-900">{subcategory}</p>
              </div>
            </div>
          </div>
        </div>

        {/* FULL DESCRIPTION */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <FileText size={18} className="text-slate-600" />

            <h2 className="font-semibold text-slate-900">Full Description</h2>
          </div>

          <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
            {fullDescription}
          </p>
        </div>
      </div>

      {/* SPECIFICATIONS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-5 flex items-center gap-3">
          <Layers size={20} className="text-slate-700" />

          <h2 className="font-semibold text-slate-900">
            Specifications & Features
          </h2>
        </div>

        {specifications.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-10 gap-y-3 md:grid-cols-2">
            {specifications.map((spec, index) => (
              <div
                key={index}
                className="flex items-center justify-between border-b border-slate-100 py-3"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-600">
                    {spec.name}
                  </span>

                  {spec.isKeyFeature && (
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      Key Feature
                    </span>
                  )}
                </div>

                <span className="text-right text-sm font-bold text-slate-900">
                  {spec.value}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No specifications added for this product.
          </p>
        )}
      </div>

      {/* PRODUCT TAGS */}
      {productTags.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-3">
            <Bookmark size={19} className="text-slate-700" />

            <h2 className="font-semibold text-slate-900">Product Tags</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {productTags.map((t, idx) => (
              <span
                key={idx}
                className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
              >
                #{t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* SYSTEM INFORMATION */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-slate-900">
          System Information
        </h2>

        <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-3">
          <div>
            <span className="block text-slate-400">Created At</span>

            <span className="font-semibold text-slate-800">
              {createdAtFormatted}
            </span>
          </div>

          <div>
            <span className="block text-slate-400">Last Updated At</span>

            <span className="font-semibold text-slate-800">
              {updatedAtFormatted}
            </span>
          </div>

          <div>
            <span className="block text-slate-400">Database ObjectId</span>

            <span className="font-mono font-semibold text-slate-800">
              {targetId}
            </span>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex flex-col gap-3 pb-6 sm:flex-row sm:justify-between">
        <Link
          to="/vendor/products"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={17} />
          Back to Products
        </Link>

        <Link
          to={`/vendor/products/${targetId}/edit`}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800"
        >
          <Edit size={17} />
          Edit Product Details
        </Link>
      </div>
    </div>
  );
};

export default VendorViewProduct;
