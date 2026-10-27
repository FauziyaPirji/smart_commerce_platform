import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRouteAdmin";
import {
  ArrowLeft,
  Loader2,
  Package,
  Tag,
  List,
  Image as ImageIcon,
  Star,
  ExternalLink,
  IndianRupee,
  Boxes,
  Store,
  CheckCircle2,
  Calendar,
  Layers,
  FileText,
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000/api";

const formatPrice = (val) => {
  const num = Number(val);
  return isNaN(num) ? "0" : num.toLocaleString("en-IN");
};

const getNormalizedStatus = (product) => {
  const approval = (product.approvalStatus || "").toLowerCase();
  if (approval === "approved" && product.isActive !== false) return "Active";
  if (approval === "pending") return "Pending";
  if (approval === "rejected" || product.isActive === false) return "Inactive";
  if (product.isActive === true) return "Active";
  return "Active";
};

// Normalize product tags (Array or String)
const getTagsList = (product) => {
  const rawTags = product.productTags || product.tags;
  if (Array.isArray(rawTags)) return rawTags.filter(Boolean);
  if (typeof rawTags === "string" && rawTags.trim()) {
    return rawTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
};

// Normalize specifications (Object or Array)
const getSpecificationsList = (product) => {
  const rawSpecs = product.specifications || product.specs;
  if (!rawSpecs) return [];

  if (Array.isArray(rawSpecs)) {
    return rawSpecs.map((item) => {
      if (typeof item === "object" && item !== null) {
        return {
          key: item.key || item.name || item.trait || "Spec",
          value: item.value || item.val || "-",
          isKeyFeature: !!item.isKeyFeature,
        };
      }
      return { key: "Spec", value: String(item), isKeyFeature: false };
    });
  }

  if (typeof rawSpecs === "object" && rawSpecs !== null) {
    return Object.entries(rawSpecs).map(([key, value]) => ({
      key,
      value: typeof value === "object" ? JSON.stringify(value) : String(value),
      isKeyFeature: false,
    }));
  }

  return [];
};

const AdminProductView = () => {
  const token = localStorage.getItem("adminToken");
  const { productId } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // GALLERY STATE
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [brokenImages, setBrokenImages] = useState({});

  // FETCH PRODUCT FROM BACKEND
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await axios.get(`${API_BASE_URL}/products/${productId}`, {
          headers: {
            "Content-Type": "Application/json",
            Authorization: "Bearer " + token,
          },
        });
        const data = res.data;
        const foundProduct = data?.product || data?.data || data;

        if (foundProduct) {
          setProduct(foundProduct);
        } else {
          setError("Product not found in database.");
        }
      } catch (err) {
        handleAuthError(err);
        console.error("Fetch product error:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load product details from server.",
        );
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    } else {
      setLoading(false);
      setError("No Product ID provided in URL.");
    }
  }, [productId, token]);

  // LOADING STATE
  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-slate-500">
        <Loader2 size={36} className="animate-spin text-[#287b6d]" />
        <p className="mt-3 text-xs font-semibold text-slate-600">
          Loading product details...
        </p>
      </div>
    );
  }

  // NOT FOUND / ERROR STATE
  if (error || !product) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
          <Package size={40} className="mx-auto mb-3 text-slate-300" />
          <h1 className="text-lg font-bold text-slate-900">
            Product Not Found
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {error || "The requested product does not exist."}
          </p>

          <Link
            to="/admin/products"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#287b6d] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#226b60]"
          >
            <ArrowLeft size={15} />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const pId = product._id || product.id;
  const pName = product.name || "Untitled Product";
  const pSlug = product.slug || "N/A";
  const pSubcategory = product.subcategory || "N/A";
  const pShortDescription = product.shortDescription || "";
  const pDescription =
    product.description ||
    product.longDescription ||
    "No detailed description provided.";

  // Vendor Name from populated ref
  const vendorName =
    typeof product.vendor === "object" && product.vendor !== null
      ? product.vendor.storeName ||
        product.vendor.businessName ||
        product.vendor.name ||
        "Unknown Vendor"
      : product.vendorName || product.vendor || "Unknown Vendor";

  // Category Name from populated ref
  const categoryName =
    typeof product.category === "object" && product.category !== null
      ? product.category.name
      : product.categoryName || product.category || "General";

  const sellingPrice = product.discountPrice || product.price || 0;
  const mrpPrice = product.price || 0;
  const discount =
    mrpPrice > sellingPrice
      ? Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100)
      : 0;

  const pStatus = getNormalizedStatus(product);
  const initial = pName.charAt(0).toUpperCase();

  const tagsList = getTagsList(product);
  const specsList = getSpecificationsList(product);

  // GATHER ALL PRODUCT IMAGES (FROM ARRAY OR SINGLE FIELD)
  const rawImages =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images.filter(Boolean)
      : product.image && typeof product.image === "string"
        ? [product.image]
        : [];

  const activeImage = rawImages[selectedImageIndex] || rawImages[0] || null;
  const isCover = selectedImageIndex === 0;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <Link
            to="/admin/products"
            className="mb-3 inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition hover:text-[#287b6d]"
          >
            <ArrowLeft size={15} />
            Back to Products
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900">{pName}</h1>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                pStatus === "Active"
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                  : pStatus === "Pending"
                    ? "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
                    : "bg-slate-100 text-slate-600 ring-1 ring-slate-400/20"
              }`}
            >
              {pStatus}
            </span>
          </div>

          <p className="mt-1 text-xs text-slate-400">
            Product ID: <span className="font-mono text-slate-600">{pId}</span>
          </p>
        </div>

        {/* PRICE SUMMARY PILL */}
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-xs">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Selling Price
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-slate-900">
                ₹{formatPrice(sellingPrice)}
              </span>
              {mrpPrice > sellingPrice && (
                <span className="text-xs text-slate-400 line-through">
                  ₹{formatPrice(mrpPrice)}
                </span>
              )}
            </div>
          </div>

          {discount > 0 && (
            <span className="rounded-xl bg-emerald-50 px-2.5 py-1 text-xs font-extrabold text-emerald-700 ring-1 ring-emerald-600/20">
              {discount}% OFF
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT COLUMN: INTERACTIVE IMAGE GALLERY & TAGS */}
        <div className="space-y-6">
          {/* 1. PROFESSIONAL PRODUCT IMAGE GALLERY */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon size={16} className="text-[#287b6d]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Product Gallery
                </h3>
              </div>

              {rawImages.length > 0 && (
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                  {selectedImageIndex + 1} of {rawImages.length}
                </span>
              )}
            </div>

            {/* MAIN LARGE PREVIEW */}
            <div className="group relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              {activeImage && !brokenImages[activeImage] ? (
                <>
                  <img
                    src={activeImage}
                    alt={pName}
                    onError={() =>
                      setBrokenImages((prev) => ({
                        ...prev,
                        [activeImage]: true,
                      }))
                    }
                    className="size-full object-contain p-2 transition duration-300 group-hover:scale-105"
                  />

                  {/* MAIN COVER BADGE */}
                  {isCover && (
                    <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                      <Star size={11} className="fill-current" />
                      Main Cover
                    </div>
                  )}

                  {/* OPEN IN NEW TAB */}
                  <a
                    href={activeImage}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute right-3 top-3 inline-flex size-7 items-center justify-center rounded-lg bg-white/90 text-slate-700 shadow-sm opacity-0 backdrop-blur-xs transition group-hover:opacity-100 hover:bg-white hover:text-[#287b6d]"
                    title="View full resolution"
                  >
                    <ExternalLink size={14} />
                  </a>
                </>
              ) : (
                <div className="grid size-full place-items-center bg-[#287b6d]/10 text-6xl font-black text-[#287b6d]">
                  {initial}
                </div>
              )}
            </div>

            {/* THUMBNAIL SELECTOR STRIP */}
            {rawImages.length > 1 && (
              <div className="mt-3.5">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  All Photos (Click to Preview)
                </p>

                <div className="flex gap-2 overflow-x-auto pb-1">
                  {rawImages.map((imgUrl, idx) => {
                    const isSelected = selectedImageIndex === idx;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`group relative size-14 shrink-0 overflow-hidden rounded-xl border transition-all ${
                          isSelected
                            ? "border-[#287b6d] ring-2 ring-[#287b6d]/40 shadow-xs"
                            : "border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-400"
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`Thumbnail ${idx + 1}`}
                          className="size-full object-cover"
                        />

                        {idx === 0 && (
                          <div className="absolute inset-x-0 bottom-0 bg-amber-500 py-0.5 text-center text-[8px] font-bold text-white">
                            Cover
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 2. PRODUCT SHORT SUMMARY CARD */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Overview
            </h3>
            <h2 className="mt-2 text-base font-extrabold text-slate-900">
              {pName}
            </h2>

            {pShortDescription && (
              <p className="mt-2 text-xs font-medium text-slate-600 leading-relaxed">
                {pShortDescription}
              </p>
            )}

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
              <span className="text-slate-400">Store Partner</span>
              <span className="font-bold text-slate-800">{vendorName}</span>
            </div>

            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-slate-400">Inventory Status</span>
              <span
                className={`font-bold ${
                  Number(product.stock || 0) <= 0
                    ? "text-red-600"
                    : Number(product.stock || 0) <= 10
                      ? "text-amber-600"
                      : "text-emerald-600"
                }`}
              >
                {Number(product.stock || 0) > 0
                  ? `${formatPrice(product.stock)} in stock`
                  : "Out of Stock"}
              </span>
            </div>
          </div>

          {/* 3. PRODUCT TAGS */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Tag size={16} className="text-[#287b6d]" />
              <h3 className="text-sm font-bold text-slate-900">Product Tags</h3>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {tagsList.length > 0 ? (
                tagsList.map((tag, idx) => (
                  <span
                    key={idx}
                    className="rounded-lg bg-[#287b6d]/10 px-2.5 py-1 text-xs font-bold text-[#287b6d]"
                  >
                    #{tag}
                  </span>
                ))
              ) : (
                <p className="text-xs text-slate-400">No tags specified.</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILS GRID, SPECIFICATIONS & FULL DESCRIPTION */}
        <div className="space-y-6 lg:col-span-2">
          {/* 1. PRODUCT INFORMATION GRID */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="border-b border-slate-100 pb-3 text-base font-bold text-slate-900">
              Product Information
            </h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Detail label="Product ID" value={pId} isCode />
              <Detail label="URL Slug" value={pSlug} isCode />
              <Detail label="Merchant Store" value={vendorName} />
              <Detail label="Category" value={categoryName} />
              <Detail label="Subcategory" value={pSubcategory} />
              <Detail
                label="Selling Price"
                value={`₹${formatPrice(sellingPrice)}`}
              />
              <Detail
                label="MRP / Regular Price"
                value={`₹${formatPrice(mrpPrice)}`}
              />
              <Detail
                label="Available Stock"
                value={`${formatPrice(product.stock || 0)} units`}
              />
              <Detail label="Approval Status" value={pStatus} isBadge />
              <Detail
                label="Date Added"
                value={
                  product.createdAt
                    ? new Date(product.createdAt).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "N/A"
                }
              />
            </div>
          </div>

          {/* 2. SPECIFICATIONS TABLE */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <List size={18} className="text-[#287b6d]" />
              <h2 className="text-base font-bold text-slate-900">
                Technical Specifications
              </h2>
            </div>

            {specsList.length > 0 ? (
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 font-bold uppercase text-slate-400">
                        Specification
                      </th>
                      <th className="px-4 py-3 font-bold uppercase text-slate-400">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {specsList.map((spec, index) => (
                      <tr
                        key={index}
                        className="transition hover:bg-slate-50/50"
                      >
                        <td className="px-4 py-3 font-bold text-slate-700 capitalize">
                          {spec.key}
                          {spec.isKeyFeature && (
                            <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                              Key Feature
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-600">
                          {spec.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-4 rounded-xl bg-slate-50 p-6 text-center text-xs font-medium text-slate-400">
                No custom specifications added for this product.
              </div>
            )}
          </div>

          {/* 3. FULL DESCRIPTION CARD */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText size={18} className="text-[#287b6d]" />
              <h2 className="text-base font-bold text-slate-900">
                Detailed Description
              </h2>
            </div>

            <div className="mt-4 whitespace-pre-line text-xs font-normal leading-relaxed text-slate-600">
              {pDescription}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Detail = ({ label, value, isCode, isBadge }) => (
  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 transition hover:bg-slate-50">
    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
      {label}
    </p>

    {isBadge ? (
      <span
        className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
          value === "Active"
            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
            : value === "Pending"
              ? "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
              : "bg-slate-100 text-slate-600 ring-1 ring-slate-400/20"
        }`}
      >
        {value}
      </span>
    ) : (
      <p
        className={`mt-1.5 text-sm font-bold text-slate-800 ${
          isCode ? "font-mono text-xs text-slate-600" : ""
        }`}
      >
        {value}
      </p>
    )}
  </div>
);

export default AdminProductView;
