import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRouteVendor";
import {
  ArrowLeft,
  Save,
  Package,
  Image as ImageIcon,
  ImagePlus,
  UploadCloud,
  FileText,
  X,
  Plus,
  Trash2,
  Loader2,
  ListPlus,
  IndianRupee,
  Boxes,
  Bookmark,
  Star,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

const API_BASE_URL = "https://smart-commerce-platform-backend.onrender.com/api";

const VendorEditProduct = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("vendorToken");

  // FORM STATE
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    categoryName: "",
    subcategory: "",
    price: "",
    mrp: "",
    stock: "",
    lowStockAlert: "5",
    shortDescription: "",
    description: "",
    status: "Active",
  });

  // UNIFIED GALLERY STATE
  // Each item: { id: string, type: 'existing' | 'new', url: string, file: File | null, name: string, size: string }
  const [galleryImages, setGalleryImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [imageError, setImageError] = useState("");

  // SPECIFICATIONS STATE
  const [specifications, setSpecifications] = useState([]);

  // TAGS STATE
  const [productTags, setProductTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  // LOADING / API STATES
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // VALIDATION ERROR STATE
  const [error, setError] = useState({
    name: "",
    category: "",
    price: "",
    mrp: "",
    stock: "",
    shortDescription: "",
    description: "",
  });

  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return "0 KB";
    if (bytes >= 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    }
    return Math.round(bytes / 1024) + " KB";
  };

  // FETCH PRODUCT & CATEGORIES
  useEffect(() => {
    const loadProductData = async () => {
      setLoading(true);
      setApiError("");

      try {
        // 1. FETCH CATEGORIES
        setLoadingCategories(true);
        const catRes = await axios.get(`${API_BASE_URL}/categories`, {
          headers: {
            "Content-Type": "Application/json",
            Authorization: "Bearer " + token,
          },
        });

        let catList = [];
        if (Array.isArray(catRes.data)) {
          catList = catRes.data;
        } else if (
          catRes.data?.success &&
          Array.isArray(catRes.data.categories)
        ) {
          catList = catRes.data.categories;
        } else if (Array.isArray(catRes.data?.categories)) {
          catList = catRes.data.categories;
        }

        setCategories(catList);
        setLoadingCategories(false);

        // 2. FETCH PRODUCT DETAILS
        const prodRes = await axios.get(
          `${API_BASE_URL}/products/${productId}`,
          {
            headers: {
              "Content-Type": "Application/json",
              Authorization: "Bearer " + token,
            },
          },
        );

        let foundProduct = null;
        if (prodRes.data?.success && prodRes.data?.product) {
          foundProduct = prodRes.data.product;
        } else if (prodRes.data?.product) {
          foundProduct = prodRes.data.product;
        }

        if (!foundProduct) {
          throw new Error("Product not found in database.");
        }

        // CATEGORY ID
        const catId =
          typeof foundProduct.category === "object" &&
          foundProduct.category !== null
            ? foundProduct.category._id || foundProduct.category.id
            : foundProduct.category || "";

        // SET FORM DATA
        setFormData({
          name: foundProduct.name || "",
          category: catId,
          categoryName: foundProduct.categoryName || "",
          subcategory: foundProduct.subcategory || "",
          price:
            foundProduct.discountPrice !== undefined &&
            foundProduct.discountPrice !== null
              ? String(foundProduct.discountPrice)
              : "",
          mrp:
            foundProduct.price !== undefined && foundProduct.price !== null
              ? String(foundProduct.price)
              : "",
          stock:
            foundProduct.stock !== undefined && foundProduct.stock !== null
              ? String(foundProduct.stock)
              : "",
          lowStockAlert: String(
            foundProduct.lowStockAlert || foundProduct.lowStockLimit || 5,
          ),
          shortDescription: foundProduct.shortDescription || "",
          description:
            foundProduct.description || foundProduct.longDescription || "",
          status:
            foundProduct.status || (foundProduct.isActive ? "Active" : "Draft"),
        });

        // LOAD SPECIFICATIONS
        if (
          Array.isArray(foundProduct.specifications) &&
          foundProduct.specifications.length > 0
        ) {
          setSpecifications(foundProduct.specifications);
        } else if (
          foundProduct.specifications &&
          typeof foundProduct.specifications === "object"
        ) {
          const mappedSpecs = Object.entries(foundProduct.specifications).map(
            ([name, value]) => ({
              name,
              value: String(value),
              isKeyFeature: false,
            }),
          );
          setSpecifications(mappedSpecs);
        } else {
          setSpecifications([{ name: "", value: "", isKeyFeature: false }]);
        }

        // LOAD TAGS
        if (Array.isArray(foundProduct.productTags)) {
          setProductTags(foundProduct.productTags);
        } else {
          setProductTags(["New Arrival"]);
        }

        // LOAD UNIFIED GALLERY IMAGES FROM CLOUDINARY
        const initialGallery = [];
        const rawImages = Array.isArray(foundProduct.images)
          ? foundProduct.images
          : foundProduct.image
            ? [foundProduct.image]
            : [];

        rawImages.forEach((imgUrl, idx) => {
          if (imgUrl && typeof imgUrl === "string") {
            initialGallery.push({
              id: `existing-${idx}-${Date.now()}`,
              type: "existing",
              url: imgUrl,
              file: null,
              name: `Saved Photo ${idx + 1}`,
              size: "Cloudinary",
            });
          }
        });

        setGalleryImages(initialGallery);
      } catch (err) {
        handleAuthError(err);
        console.error("Error loading product for edit:", err);
        setApiError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load product details for editing.",
        );
      } finally {
        setLoading(false);
        setLoadingCategories(false);
      }
    };

    if (productId) {
      loadProductData();
    }
  }, [productId, token]);

  // CLEAN UP LOCAL OBJECT URLS
  useEffect(() => {
    return () => {
      galleryImages.forEach((img) => {
        if (img.type === "new" && img.url) {
          URL.revokeObjectURL(img.url);
        }
      });
    };
  }, [galleryImages]);

  // INPUT HANDLER
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError((prev) => ({ ...prev, [name]: "" }));
    if (apiError) setApiError("");
  };

  // UNIFIED IMAGE GALLERY HANDLERS
  const processFiles = (files) => {
    setImageError("");
    const fileList = Array.from(files);
    if (!fileList.length) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    const validFiles = [];
    let sizeErrorFound = false;
    let typeErrorFound = false;

    if (galleryImages.length + fileList.length > 8) {
      setImageError("Maximum 8 product photos allowed in total.");
      return;
    }

    fileList.forEach((file, index) => {
      if (!validTypes.includes(file.type)) {
        typeErrorFound = true;
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        sizeErrorFound = true;
        return;
      }

      validFiles.push({
        id: `new-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
        type: "new",
        url: URL.createObjectURL(file),
        file: file,
        name: file.name,
        size: formatFileSize(file.size),
      });
    });

    if (typeErrorFound) {
      setImageError("Only PNG, JPG, or WEBP image formats are supported.");
    } else if (sizeErrorFound) {
      setImageError("Each image file must be smaller than 5MB.");
    }

    if (validFiles.length > 0) {
      setGalleryImages((prev) => [...prev, ...validFiles]);
    }
  };

  const handleFileInput = (e) => {
    processFiles(e.target.files);
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // SET AS MAIN COVER (MOVES IMAGE TO INDEX 0)
  const handleSetCover = (index) => {
    if (index === 0) return;
    setGalleryImages((prev) => {
      const updated = [...prev];
      const [chosenCover] = updated.splice(index, 1);
      return [chosenCover, ...updated];
    });
  };

  // REORDER IMAGE (MOVE LEFT / RIGHT)
  const handleMoveImage = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= galleryImages.length) return;
    setGalleryImages((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
  };

  // REMOVE IMAGE
  const handleRemoveImage = (indexToRemove) => {
    setGalleryImages((prev) => {
      const target = prev[indexToRemove];
      if (target?.type === "new" && target.url) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  };

  // SPECIFICATIONS HANDLERS
  const handleAddSpec = () => {
    setSpecifications((prev) => [
      ...prev,
      { name: "", value: "", isKeyFeature: false },
    ]);
  };

  const handleRemoveSpec = (index) => {
    setSpecifications((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSpecChange = (index, field, value) => {
    setSpecifications((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // TAG HANDLERS
  const toggleTag = (tag) => {
    if (productTags.includes(tag)) {
      setProductTags((prev) => prev.filter((t) => t !== tag));
    } else {
      setProductTags((prev) => [...prev, tag]);
    }
  };

  const addCustomTag = () => {
    const val = tagInput.trim();
    if (val && !productTags.includes(val)) {
      setProductTags((prev) => [...prev, val]);
      setTagInput("");
    }
  };

  const handleAddCustomTag = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomTag();
    }
  };

  const removeTag = (tagToRemove) => {
    setProductTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  // VALIDATION
  const validateForm = () => {
    let errorData = {};
    let isValid = true;

    if (!formData.name.trim()) {
      isValid = false;
      errorData.name = "Product name is required";
    }

    if (!formData.category) {
      isValid = false;
      errorData.category = "Category is required. Please select one.";
    }

    if (formData.price === "" || Number(formData.price) <= 0) {
      isValid = false;
      errorData.price = "Selling price must be greater than 0";
    }

    if (formData.mrp === "" || Number(formData.mrp) <= 0) {
      isValid = false;
      errorData.mrp = "MRP must be greater than 0";
    }

    if (
      formData.price !== "" &&
      formData.mrp !== "" &&
      Number(formData.price) > Number(formData.mrp)
    ) {
      isValid = false;
      errorData.price = "Selling price cannot be greater than MRP";
      errorData.mrp = "MRP must be equal to or greater than selling price";
    }

    if (formData.stock === "" || Number(formData.stock) < 0) {
      isValid = false;
      errorData.stock = "Stock cannot be negative";
    }

    if (!formData.shortDescription.trim()) {
      isValid = false;
      errorData.shortDescription = "Short description is required";
    }

    if (!formData.description.trim()) {
      isValid = false;
      errorData.description = "Full description is required";
    }

    setError(errorData);
    return isValid;
  };

  // SUBMIT UPDATED PRODUCT
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (galleryImages.length === 0) {
      setImageError("Please add at least one product image.");
      window.scrollTo({ top: 350, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    setApiError("");

    try {
      const selectedCategoryObj = categories.find(
        (c) => String(c._id || c.id) === String(formData.category),
      );

      const cleanSpecs = specifications.filter(
        (s) => s.name?.trim() && s.value?.trim(),
      );

      const finalTags = [...productTags];
      if (tagInput.trim() && !finalTags.includes(tagInput.trim())) {
        finalTags.push(tagInput.trim());
      }

      // MULTIPART FORMDATA
      const payload = new FormData();
      payload.append("name", formData.name.trim());
      payload.append("category", formData.category);
      payload.append(
        "categoryName",
        selectedCategoryObj ? selectedCategoryObj.name : formData.categoryName,
      );
      payload.append("subcategory", formData.subcategory.trim());
      payload.append("price", Number(formData.mrp));
      payload.append("discountPrice", Number(formData.price));
      payload.append("stock", Number(formData.stock));
      payload.append("lowStockAlert", Number(formData.lowStockAlert || 5));
      payload.append("shortDescription", formData.shortDescription.trim());
      payload.append("description", formData.description.trim());
      payload.append("longDescription", formData.description.trim());
      payload.append("status", formData.status);
      payload.append("isActive", formData.status === "Active");

      payload.append("specifications", JSON.stringify(cleanSpecs));
      payload.append("productTags", JSON.stringify(finalTags));

      // 1. EXTRACT ALL KEPT EXISTING CLOUDINARY URLS (IN EXACT ORDER)
      const existingUrls = galleryImages
        .filter((img) => img.type === "existing")
        .map((img) => img.url);

      payload.append("existingImages", JSON.stringify(existingUrls));

      // 2. PASS COVER METADATA SO BACKEND PLACES COVER FIRST
      const coverItem = galleryImages[0];
      payload.append("coverType", coverItem?.type || "existing");
      payload.append(
        "coverUrl",
        coverItem?.type === "existing" ? coverItem.url : "",
      );

      // 3. APPEND ALL NEW BINARY FILES
      galleryImages
        .filter((img) => img.type === "new" && img.file)
        .forEach((img) => {
          payload.append("images", img.file);
        });

      const res = await axios.put(
        `${API_BASE_URL}/products/${productId}`,
        payload,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );

      if (!res.data.success) {
        throw new Error(res.data.message || "Failed to update product.");
      }

      alert("Product updated successfully!");
      navigate(`/vendor/products/${productId}`);
    } catch (err) {
      handleAuthError(err);
      console.error("Update product error:", err);
      setApiError(
        err.response?.data?.message ||
          err.message ||
          "Could not update product. Please check your inputs.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // LOADING STATE
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-20 text-slate-500 shadow-xs">
        <Loader2 size={36} className="animate-spin text-slate-700" />
        <p className="mt-4 text-sm font-medium">
          Loading product for editing...
        </p>
      </div>
    );
  }

  // NOT FOUND STATE
  if (apiError && !formData.name) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-xs">
        <Package size={48} className="mx-auto mb-4 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-900">Product Not Found</h2>
        <p className="mt-2 text-sm text-slate-500">{apiError}</p>
        <Link
          to="/vendor/products"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          <ArrowLeft size={16} />
          Back to Products
        </Link>
      </div>
    );
  }

  const priceNum = Number(formData.price || 0);
  const mrpNum = Number(formData.mrp || 0);
  const discount =
    mrpNum > priceNum ? Math.round(((mrpNum - priceNum) / mrpNum) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={`/vendor/products/${productId}`}
            className="rounded-xl border border-slate-200 p-2.5 transition hover:bg-slate-100"
          >
            <ArrowLeft size={19} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Edit Product</h1>
            <p className="mt-1 text-sm text-slate-500">
              Update catalog details for ID:{" "}
              <span className="font-mono text-xs font-semibold">
                {productId}
              </span>
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            to={`/vendor/products/${productId}`}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            form="edit-product-form"
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={17} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* API ERROR */}
      {apiError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {apiError}
        </div>
      )}

      {/* FORM */}
      <form
        id="edit-product-form"
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* 1. BASIC INFORMATION */}
        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100">
                <Package size={20} className="text-slate-700" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">
                  Basic Information
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Update main details of your product
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Aster Pro ANC Headphones"
                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${
                  error.name
                    ? "border-red-400"
                    : "border-slate-200 focus:border-slate-400"
                }`}
              />
              {error.name && (
                <p className="mt-1.5 text-xs text-red-600">{error.name}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                disabled={loadingCategories}
                className={`w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none ${
                  error.category ? "border-red-400" : "border-slate-200"
                }`}
              >
                <option value="">
                  {loadingCategories
                    ? "Loading categories..."
                    : "Select category"}
                </option>
                {categories.map((c) => (
                  <option key={c._id || c.id} value={c._id || c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {error.category && (
                <p className="mt-1.5 text-xs text-red-600">{error.category}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Subcategory
              </label>
              <input
                type="text"
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
                placeholder="e.g. Wireless, Audio, Gadgets..."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
              />
            </div>
          </div>
        </div>

        {/* 2. PRO UNIFIED MULTI-IMAGE MANAGEMENT */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-2 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100">
                <ImageIcon size={19} className="text-slate-700" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">
                  Product Images & Cover Selection
                </h2>
                <p className="text-sm text-slate-500">
                  The first image with the gold badge is your{" "}
                  <strong>Store Main Cover</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                {galleryImages.length} / 8 Photos
              </span>
            </div>
          </div>

          <div className="space-y-6 p-6">
            {/* DRAG & DROP UPLOAD ZONE */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`rounded-2xl border-2 border-dashed p-7 text-center transition-all ${
                isDragging
                  ? "border-slate-900 bg-slate-100/70"
                  : "border-slate-300 hover:border-slate-400 hover:bg-slate-50/50"
              }`}
            >
              <input
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileInput}
                id="gallery-images-input"
                className="hidden"
              />

              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <UploadCloud size={24} />
              </div>

              <p className="mt-3 text-sm font-bold text-slate-800">
                Drag and drop new photos here, or{" "}
                <label
                  htmlFor="gallery-images-input"
                  className="cursor-pointer text-slate-950 underline underline-offset-4 hover:text-blue-600"
                >
                  browse files
                </label>
              </p>

              <p className="mt-1 text-xs text-slate-400">
                PNG, JPG or WEBP • Up to 5MB per file • Select multiple photos
              </p>
            </div>

            {/* ERROR ALERT */}
            {imageError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600">
                <AlertCircle size={16} className="shrink-0" />
                <span>{imageError}</span>
              </div>
            )}

            {/* UNIFIED GALLERY GRID */}
            {galleryImages.length > 0 ? (
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Current Gallery Order (Position #1 is Main Cover)
                </p>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {galleryImages.map((img, index) => {
                    const isCover = index === 0;

                    return (
                      <div
                        key={img.id}
                        className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-white transition-all ${
                          isCover
                            ? "border-amber-400 ring-2 ring-amber-400/50 shadow-md"
                            : "border-slate-200 hover:border-slate-400"
                        }`}
                      >
                        {/* PHOTO THUMBNAIL */}
                        <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                          <img
                            src={img.url}
                            alt={img.name}
                            className="size-full object-cover transition duration-300 group-hover:scale-105"
                          />

                          {/* COVER BADGE */}
                          {isCover ? (
                            <div className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-md bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-white shadow-md">
                              <Star size={11} className="fill-current" />
                              Main Cover
                            </div>
                          ) : (
                            <div className="absolute left-2 top-2 z-10 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
                              #{index + 1}
                            </div>
                          )}

                          {/* STATUS BADGE */}
                          <div className="absolute right-2 top-2 z-10">
                            {img.type === "existing" ? (
                              <span className="rounded-md bg-slate-900/80 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-xs">
                                Saved
                              </span>
                            ) : (
                              <span className="rounded-md bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs">
                                New
                              </span>
                            )}
                          </div>

                          {/* HOVER QUICK ACTIONS */}
                          <div className="absolute inset-0 z-20 flex flex-col justify-between bg-black/45 p-2 opacity-0 backdrop-blur-[2px] transition duration-200 group-hover:opacity-100">
                            <div className="flex items-center justify-between">
                              {/* REORDER ARROWS */}
                              <div className="flex gap-1">
                                {index > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleMoveImage(index, -1)}
                                    title="Move Left"
                                    className="rounded-md bg-white/90 p-1 text-slate-800 transition hover:bg-white"
                                  >
                                    <ChevronLeft size={14} />
                                  </button>
                                )}
                                {index < galleryImages.length - 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleMoveImage(index, 1)}
                                    title="Move Right"
                                    className="rounded-md bg-white/90 p-1 text-slate-800 transition hover:bg-white"
                                  >
                                    <ChevronRight size={14} />
                                  </button>
                                )}
                              </div>

                              {/* REMOVE BUTTON */}
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                title="Remove photo"
                                className="rounded-md bg-red-600 p-1.5 text-white transition hover:bg-red-700"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>

                            {/* SET AS MAIN COVER BUTTON */}
                            {!isCover && (
                              <button
                                type="button"
                                onClick={() => handleSetCover(index)}
                                className="w-full rounded-lg bg-white py-1.5 text-center text-xs font-bold text-slate-900 shadow-sm transition hover:bg-amber-50 hover:text-amber-700"
                              >
                                ⭐ Set as Main
                              </button>
                            )}
                          </div>
                        </div>

                        {/* CARD FOOTER INFO */}
                        <div className="border-t border-slate-100 p-2 text-[11px] text-slate-500">
                          <p className="truncate font-medium text-slate-700">
                            {img.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {img.size}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-slate-400">
                <ImagePlus size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-medium">
                  No images left. Please upload at least 1 image for your
                  product.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 3. PRICING */}
        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100">
                <IndianRupee size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Pricing</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Update selling price and MRP
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Selling Price *
              </label>
              <div className="relative">
                <IndianRupee
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  placeholder="0"
                  className={`w-full rounded-xl border py-3 pl-9 pr-4 text-sm outline-none ${
                    error.price ? "border-red-400" : "border-slate-200"
                  }`}
                />
              </div>
              {error.price && (
                <p className="mt-1.5 text-xs text-red-600">{error.price}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                MRP *
              </label>
              <div className="relative">
                <IndianRupee
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="number"
                  name="mrp"
                  value={formData.mrp}
                  onChange={handleChange}
                  min="0"
                  placeholder="0"
                  className={`w-full rounded-xl border py-3 pl-9 pr-4 text-sm outline-none ${
                    error.mrp ? "border-red-400" : "border-slate-200"
                  }`}
                />
              </div>
              {error.mrp && (
                <p className="mt-1.5 text-xs text-red-600">{error.mrp}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Product Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
              >
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>

          <div className="px-6 pb-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="text-slate-500">Selling Price:</span>
                <span className="font-bold text-slate-900">
                  ₹{priceNum.toLocaleString("en-IN")}
                </span>
                <span className="text-slate-400 line-through">
                  ₹{mrpNum.toLocaleString("en-IN")}
                </span>
                {discount > 0 && (
                  <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                    {discount}% OFF
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4. INVENTORY */}
        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100">
                <Boxes size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Inventory</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Manage stock levels and low stock threshold
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Current Stock *
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                placeholder="Enter stock quantity"
                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${
                  error.stock ? "border-red-400" : "border-slate-200"
                }`}
              />
              {error.stock && (
                <p className="mt-1.5 text-xs text-red-600">{error.stock}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Low Stock Alert Threshold
              </label>
              <input
                type="number"
                name="lowStockAlert"
                value={formData.lowStockAlert}
                onChange={handleChange}
                min="0"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none"
              />
              <p className="mt-2 text-xs text-slate-400">
                Alert trigger when stock reaches this minimum.
              </p>
            </div>
          </div>
        </div>

        {/* 5. SPECIFICATIONS */}
        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100">
                <ListPlus size={20} className="text-slate-700" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Specifications</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Update technical specifications and key feature highlights
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddSpec}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              <Plus size={15} />
              Add Specification
            </button>
          </div>

          <div className="space-y-4 p-6">
            {specifications.map((spec, index) => (
              <div
                key={index}
                className="flex flex-col items-center gap-3 sm:flex-row"
              >
                <input
                  type="text"
                  placeholder="Specification Name (e.g. Battery, Material)"
                  value={spec.name}
                  onChange={(e) =>
                    handleSpecChange(index, "name", e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none sm:flex-1"
                />

                <input
                  type="text"
                  placeholder="Value (e.g. 40 hours, 100% Cotton)"
                  value={spec.value}
                  onChange={(e) =>
                    handleSpecChange(index, "value", e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none sm:flex-1"
                />

                <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-xs font-medium text-slate-600">
                  <input
                    type="checkbox"
                    checked={!!spec.isKeyFeature}
                    onChange={(e) =>
                      handleSpecChange(index, "isKeyFeature", e.target.checked)
                    }
                    className="rounded text-slate-900"
                  />
                  Key Feature
                </label>

                {specifications.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSpec(index)}
                    className="rounded-xl p-2.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={17} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 6. DESCRIPTIONS */}
        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100">
                <FileText size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">
                  Product Descriptions
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Update product overview and details
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Short Description *
              </label>
              <textarea
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleChange}
                rows="3"
                maxLength="250"
                placeholder="Write a short summary for product cards..."
                className={`w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none ${
                  error.shortDescription
                    ? "border-red-400"
                    : "border-slate-200 focus:border-slate-400"
                }`}
              />
              {error.shortDescription && (
                <p className="mt-1.5 text-xs text-red-600">
                  {error.shortDescription}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Full Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="7"
                placeholder="Describe your product in detail..."
                className={`w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none ${
                  error.description
                    ? "border-red-400"
                    : "border-slate-200 focus:border-slate-400"
                }`}
              />
              {error.description && (
                <p className="mt-1.5 text-xs text-red-600">
                  {error.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 7. TAGS */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100">
              <Bookmark size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Product Tags</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Tags help customers discover your product in search
              </p>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {["New Arrival", "Best Seller", "Featured"].map((tag) => (
              <button
                type="button"
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  productTags.includes(tag)
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tag}
              </button>
            ))}

            {productTags
              .filter(
                (t) => !["New Arrival", "Best Seller", "Featured"].includes(t),
              )
              .map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
                >
                  #{tag}
                  <button type="button" onClick={() => removeTag(tag)}>
                    <X size={14} />
                  </button>
                </span>
              ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddCustomTag}
              placeholder="Add custom tag (press Enter or click Add)..."
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
            />
            <button
              type="button"
              onClick={addCustomTag}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Add Tag
            </button>
          </div>
        </div>

        {/* BOTTOM ACTIONS */}
        <div className="flex flex-col gap-3 pb-6 sm:flex-row sm:justify-end">
          <Link
            to={`/vendor/products/${productId}`}
            className="rounded-xl border border-slate-200 px-5 py-3 text-center text-sm font-medium hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save size={17} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VendorEditProduct;
