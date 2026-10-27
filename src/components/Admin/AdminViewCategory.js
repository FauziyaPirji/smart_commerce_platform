import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRouteAdmin";
import {
  ArrowLeft,
  Edit,
  FolderOpen,
  Package,
  Calendar,
  Loader2,
  AlertCircle,
  ExternalLink,
  Image as ImageIcon,
  Layers,
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000/api";

const AdminViewCategory = () => {
  const token = localStorage.getItem("adminToken");
  const { categoryId } = useParams();

  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState(false);

  // FETCH CATEGORY FROM BACKEND
  useEffect(() => {
    const fetchCategory = async () => {
      setLoading(true);
      setError("");

      try {
        if (!categoryId) {
          setError("Category ID is missing.");
          setLoading(false);
          return;
        }

        const res = await axios.get(
          `${API_BASE_URL}/categories/${categoryId}`,
          {
            headers: {
              "Content-Type": "Application/json",
              Authorization: "Bearer " + token,
            },
          },
        );

        const categoryData = res.data?.category || res.data;

        if (categoryData) {
          setCategory(categoryData);
        } else {
          setError("Category not found in database.");
        }
      } catch (err) {
        handleAuthError(err);
        console.error("Fetch category error:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load category details.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [categoryId, token]);

  // LOADING STATE
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-slate-500">
        <Loader2 size={36} className="animate-spin text-slate-700" />
        <p className="mt-4 text-sm font-medium">Loading category details...</p>
      </div>
    );
  }

  // CATEGORY NOT FOUND / ERROR STATE
  if (!category) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <FolderOpen size={28} />
          </div>

          <h1 className="text-xl font-bold text-slate-900">
            Category Not Found
          </h1>

          <div className="mt-2 flex items-center justify-center gap-2 text-sm text-slate-500">
            <AlertCircle size={16} className="text-red-500" />
            <span>
              {error || "The category you are looking for does not exist."}
            </span>
          </div>

          <Link
            to="/admin/categories"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800"
          >
            <ArrowLeft size={17} />
            Back to Categories
          </Link>
        </div>
      </div>
    );
  }

  // CATEGORY ID
  const id = category._id || category.id;

  // STATUS
  const status =
    category.status || (category.isActive !== false ? "Active" : "Inactive");

  // PRODUCTS COUNT
  const productsCount = category.productsCount ?? category.products ?? 0;

  // CREATED DATE
  const createdDate = category.createdAt
    ? new Date(category.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Not available";

  const initial = category.name ? category.name.charAt(0).toUpperCase() : "C";

  return (
    <div className="min-h-screen space-y-6 bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* HEADER */}
      <div>
        <Link
          to="/admin/categories"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          <ArrowLeft size={17} />
          Back to Categories
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Category Details
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              View complete category information and linked assets.
            </p>
          </div>

          <Link
            to={`/admin/categories/${id}/edit`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800"
          >
            <Edit size={17} />
            Edit Category
          </Link>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="max-w-4xl space-y-6">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          {/* CATEGORY HEADER WITH CLOUDINARY IMAGE */}
          <div className="border-b border-slate-100 p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              {/* IMAGE / AVATAR */}
              <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-xs">
                {category.image && !imageError ? (
                  <img
                    src={category.image}
                    alt={category.name}
                    onError={() => setImageError(true)}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="grid size-full place-items-center bg-slate-900 text-3xl font-black text-white">
                    {initial}
                  </div>
                )}
              </div>

              {/* TITLE & BADGES */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-bold text-slate-900 truncate">
                    {category.name}
                  </h2>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      status === "Active"
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                        : "bg-slate-100 text-slate-600 ring-1 ring-slate-400/20"
                    }`}
                  >
                    {status}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span>
                    Category ID:{" "}
                    <span className="font-mono font-semibold text-slate-700">
                      #{id}
                    </span>
                  </span>

                  {category.slug && (
                    <span>
                      Slug:{" "}
                      <span className="font-mono font-semibold text-slate-700">
                        /{category.slug}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* STATS STRIP */}
          <div className="grid grid-cols-1 border-b border-slate-100 sm:grid-cols-3">
            {/* Products */}
            <div className="border-b border-slate-100 p-6 sm:border-b-0 sm:border-r">
              <Package size={20} className="mb-2 text-blue-600" />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Linked Products
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {productsCount}
              </p>
            </div>

            {/* Status */}
            <div className="border-b border-slate-100 p-6 sm:border-b-0 sm:border-r">
              <FolderOpen size={20} className="mb-2 text-emerald-600" />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Listing Status
              </p>
              <p className="mt-1 text-lg font-bold text-slate-900">{status}</p>
            </div>

            {/* Created */}
            <div className="p-6">
              <Calendar size={20} className="mb-2 text-purple-600" />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Created On
              </p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {createdDate}
              </p>
            </div>
          </div>

          {/* INFORMATION GRID */}
          <div className="p-6 sm:p-8">
            <h3 className="mb-5 text-base font-bold text-slate-900">
              General Information
            </h3>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Category Name
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {category.name || "Not specified"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  URL Slug
                </p>
                <p className="mt-1 font-mono text-xs font-semibold text-slate-700">
                  /{category.slug || "category"}
                </p>
              </div>

              <div className="sm:col-span-2 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Description
                </p>
                <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600 whitespace-pre-line">
                  {category.description ||
                    "No description available for this category."}
                </p>
              </div>
            </div>
          </div>

          {/* DEDICATED IMAGE PREVIEW (IF IMAGE EXISTS) */}
          {category.image && (
            <div className="border-t border-slate-100 p-6 sm:p-8">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon size={18} className="text-slate-700" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Category Banner Photo
                  </h3>
                </div>

                <a
                  href={category.image}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  <ExternalLink size={13} />
                  View Original
                </a>
              </div>

              <div className="relative max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                <img
                  src={category.image}
                  alt={category.name}
                  className="h-44 w-full object-cover transition duration-300 hover:scale-105"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminViewCategory;
