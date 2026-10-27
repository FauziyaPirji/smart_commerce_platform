import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  FolderPlus,
  Save,
  Loader2,
  Image as ImageIcon,
  UploadCloud,
  X,
  AlertCircle,
} from "lucide-react";
import { handleAuthError } from "../../AuthRouteAdmin.js";

const API_BASE_URL = "http://localhost:5000/api";

const AdminAddCategory = () => {
  const token = localStorage.getItem("adminToken");
  const navigate = useNavigate();

  // FORM STATE
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "Active",
  });

  // SINGLE IMAGE STATE
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imageError, setImageError] = useState("");

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Clean up object URL when component unmounts or image changes
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Format file size helper
  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return "0 KB";
    if (bytes >= 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    }
    return Math.round(bytes / 1024) + " KB";
  };

  // INPUT CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: "",
    }));

    if (submitError) {
      setSubmitError("");
    }
  };

  // SINGLE IMAGE HANDLERS
  const handleProcessFile = (file) => {
    setImageError("");
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!validTypes.includes(file.type)) {
      setImageError("Please upload a valid image (PNG, JPG, or WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError("Image size must be less than 5MB.");
      return;
    }

    // Revoke old URL if existing
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
    e.target.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleRemoveImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    setImageError("");
  };

  // FORM VALIDATION
  const validateForm = () => {
    const newErrors = {};

    const name = formData.name.trim();
    const description = formData.description.trim();

    if (!name) {
      newErrors.name = "Category name is required.";
    } else if (name.length < 2) {
      newErrors.name = "Category name must contain at least 2 characters.";
    } else if (name.length > 50) {
      newErrors.name = "Category name cannot exceed 50 characters.";
    }

    if (!description) {
      newErrors.description = "Description is required.";
    } else if (description.length < 10) {
      newErrors.description =
        "Description must contain at least 10 characters.";
    } else if (description.length > 500) {
      newErrors.description = "Description cannot exceed 500 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // SUBMIT HANDLER (MULTIPART FORMDATA)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateForm()) {
      setSubmitError("Please fix the highlighted fields before submitting.");
      return;
    }

    setSubmitting(true);

    // Build FormData to send text fields and binary file together
    const payload = new FormData();
    payload.append("name", formData.name.trim());
    payload.append("description", formData.description.trim());
    payload.append("status", formData.status);
    payload.append("isActive", formData.status === "Active");

    if (imageFile) {
      payload.append("image", imageFile); // Attached to req.file in Multer
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/categories`, payload, {
        headers: {
          Authorization: "Bearer " + token,
          // Axios automatically sets multipart/form-data boundary
        },
      });

      if (res.status === 201 || res.data?.success) {
        alert("Category created successfully!");
        navigate("/admin/categories");
      } else {
        throw new Error(res.data?.message || "Failed to create category.");
      }
    } catch (error) {
      handleAuthError(error);
      console.error("ADD CATEGORY ERROR:", error);
      setSubmitError(
        error.response?.data?.message ||
          error.message ||
          "Something went wrong while creating the category. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/admin/categories"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          <ArrowLeft size={17} />
          Back to Categories
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add Category</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create a new product category for your marketplace.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="max-w-3xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs">
          {/* Form Header */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
              <FolderPlus size={21} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Category Information
              </h2>
              <p className="text-xs text-slate-500">
                Enter category details and upload a cover photo.
              </p>
            </div>
          </div>

          {/* General Error */}
          {submitError && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {submitError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Category Name */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Category Name *
              </label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Electronics, Fashion, Home Decor"
                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
                  errors.name
                    ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                    : "border-slate-200 focus:border-slate-400"
                }`}
              />

              {errors.name && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.name}
                </p>
              )}
            </div>

            {/* SINGLE CATEGORY IMAGE UPLOAD */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Category Image (Optional)
              </label>

              {imagePreview ? (
                /* PREVIEW CARD */
                <div className="relative flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <img
                      src={imagePreview}
                      alt="Category preview"
                      className="size-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-800">
                      {imageFile?.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {formatFileSize(imageFile?.size)} • Ready to upload
                    </p>
                    <span className="mt-1.5 inline-block rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      Image Selected
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    title="Remove Image"
                    className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                /* DROPZONE */
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`rounded-2xl border-2 border-dashed p-6 text-center transition ${
                    isDragging
                      ? "border-slate-900 bg-slate-100/70"
                      : "border-slate-200 hover:border-slate-400 hover:bg-slate-50/50"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileInputChange}
                    id="category-image-input"
                    className="hidden"
                  />

                  <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <UploadCloud size={24} />
                  </div>

                  <p className="mt-3 text-sm font-semibold text-slate-800">
                    Drop your image here, or{" "}
                    <label
                      htmlFor="category-image-input"
                      className="cursor-pointer text-slate-950 underline underline-offset-4 hover:text-blue-600"
                    >
                      browse file
                    </label>
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    PNG, JPG or WEBP • Up to 5MB • 1 Single Image
                  </p>
                </div>
              )}

              {/* IMAGE VALIDATION ERROR */}
              {imageError && (
                <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-600">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{imageError}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Description *
              </label>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="Enter category description..."
                className={`w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition ${
                  errors.description
                    ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                    : "border-slate-200 focus:border-slate-400"
                }`}
              />

              <div className="mt-1 flex items-center justify-between">
                {errors.description ? (
                  <p className="text-xs font-medium text-red-600">
                    {errors.description}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">
                    Minimum 10 characters.
                  </p>
                )}

                <span className="text-xs text-slate-400">
                  {formData.description.length}/500
                </span>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Status
              </label>

              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
            <Link
              to="/admin/categories"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Saving Category...
                </>
              ) : (
                <>
                  <Save size={17} />
                  Save Category
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminAddCategory;
