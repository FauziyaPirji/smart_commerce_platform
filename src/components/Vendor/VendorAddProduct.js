import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRouteVendor";
import { getStoredVendor } from "../../utils/vendorAuth";

import {
  ArrowLeft,
  Package,
  ImagePlus,
  X,
  Plus,
  Tag,
  IndianRupee,
  Boxes,
  FileText,
  ListPlus,
  Trash2,
  Loader2,
  UploadCloud,
  Star,
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000/api";

const VendorAddProduct = () => {
  const navigate = useNavigate();

  const token = localStorage.getItem("vendorToken");

  // FORM STATE
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    subcategory: "",
    price: "",
    mrp: "",
    stock: "",
    lowStockLimit: "5",
    description: "",
    shortDescription: "",
    status: "Active",
  });

  // IMAGES STATE
  const [images, setImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  // SPECIFICATIONS STATE
  const [specifications, setSpecifications] = useState([
    {
      name: "",
      value: "",
      isKeyFeature: false,
    },
  ]);

  // TAGS STATE
  const [productTags, setProductTags] = useState(["New Arrival"]);
  const [tagInput, setTagInput] = useState("");

  // ERROR STATE
  const [error, setError] = useState({
    name: "",
    category: "",
    price: "",
    mrp: "",
    stock: "",
    description: "",
    shortDescription: "",
    images: "",
  });

  const [loading, setLoading] = useState(false);

  // CATEGORIES STATE
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // GET LOGGED-IN VENDOR ID
  const getVendorId = () => {
    try {
      const vendorData = getStoredVendor ? getStoredVendor() : {};

      const savedProfile = JSON.parse(
        localStorage.getItem("vendorProfile") || "{}",
      );

      const savedUser = JSON.parse(localStorage.getItem("vendorUser") || "{}");

      return (
        vendorData?.vendorId ||
        vendorData?._id ||
        vendorData?.id ||
        savedProfile?._id ||
        savedProfile?.id ||
        savedUser?.vendorId ||
        savedUser?._id ||
        savedUser?.id ||
        null
      );
    } catch (error) {
      console.error("Error getting vendor ID:", error);
      return null;
    }
  };

  // FETCH CATEGORIES
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);

        const res = await axios.get(`${API_BASE_URL}/categories`, {
          headers: {
            "Content-Type": "Application/json",
            Authorization: "Bearer " + token,
          },
        });

        const data = res.data;

        let rawList = [];

        if (Array.isArray(data)) {
          rawList = data;
        } else if (data?.success && Array.isArray(data.categories)) {
          rawList = data.categories;
        } else if (Array.isArray(data?.categories)) {
          rawList = data.categories;
        }

        setCategories(rawList);
      } catch (err) {
        handleAuthError(err);

        console.error("Failed to load categories:", err);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [token]);

  // SELECTED CATEGORY
  const selectedCategoryObj = categories.find(
    (c) => String(c._id || c.id) === String(formData.category),
  );

  const currentCategoryName = selectedCategoryObj
    ? selectedCategoryObj.name
    : "";

  // HANDLE INPUT CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setError((current) => ({
      ...current,
      [name]: "",
    }));
  };

  // IMAGE HANDLERS
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };
  const processFiles = (fileList) => {
    const files = Array.from(fileList);
    let validationError = "";
    const validImages = [];
    files.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        validationError = "Only image files (JPG, PNG, WEBP) are allowed.";
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        validationError = "Some images exceed the 5MB size limit.";
        return;
      }
      validImages.push({
        file,
        url: URL.createObjectURL(file),
        name: file.name,
        size: formatFileSize(file.size),
      });
    });
    if (validationError) {
      setError((prev) => ({ ...prev, images: validationError }));
    } else {
      setError((prev) => ({ ...prev, images: "" }));
    }
    if (validImages.length > 0) {
      setImages((prev) => [...prev, ...validImages]);
    }
  };
  const handleImageInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = "";
    }
  };
  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };
  const removeImage = (index) => {
    setImages((current) => {
      const removed = current[index];
      if (removed?.url) URL.revokeObjectURL(removed.url);
      return current.filter((_, i) => i !== index);
    });
  };
  // Set an image as the main cover photo (moves to index 0)
  const setAsCover = (index) => {
    if (index === 0) return;
    setImages((prev) => {
      const reordered = [...prev];
      const [selected] = reordered.splice(index, 1);
      reordered.unshift(selected);
      return reordered;
    });
  };

  // SPECIFICATION HANDLERS
  const handleAddSpec = () => {
    setSpecifications((prev) => [
      ...prev,
      {
        name: "",
        value: "",
        isKeyFeature: false,
      },
    ]);
  };

  const handleRemoveSpec = (index) => {
    setSpecifications((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSpecChange = (index, field, value) => {
    setSpecifications((prev) => {
      const updated = [...prev];

      updated[index] = {
        ...updated[index],
        [field]: value,
      };

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

  const handleAddCustomTag = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      const val = tagInput.trim();

      if (val && !productTags.includes(val)) {
        setProductTags((prev) => [...prev, val]);

        setTagInput("");
      }
    }
  };

  const removeTag = (tagToRemove) => {
    setProductTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  // VALIDATE FORM
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

    if (!formData.price) {
      isValid = false;
      errorData.price = "Selling price is required";
    } else if (Number(formData.price) <= 0) {
      isValid = false;
      errorData.price = "Selling price must be greater than 0";
    }

    if (!formData.mrp) {
      isValid = false;
      errorData.mrp = "MRP is required";
    } else if (Number(formData.mrp) <= 0) {
      isValid = false;
      errorData.mrp = "MRP must be greater than 0";
    }

    if (
      formData.price &&
      formData.mrp &&
      Number(formData.price) > Number(formData.mrp)
    ) {
      isValid = false;

      errorData.price = "Selling price cannot be greater than MRP";

      errorData.mrp = "MRP must be equal to or greater than selling price";
    }

    if (formData.stock === "") {
      isValid = false;
      errorData.stock = "Initial stock is required";
    } else if (Number(formData.stock) < 0) {
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

    if (images.length === 0) {
      isValid = false;
      errorData.images = "Please upload at least one product image.";
    }

    setError(errorData);

    return isValid;
  };

  // SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValid = validateForm();

    if (!isValid) return;

    // CHECK TOKEN
    if (!token) {
      alert("Authentication token not found. Please login again.");
      navigate("/vendor/login");
      return;
    }

    // GET VENDOR ID
    const vendorId = getVendorId();

    if (!vendorId) {
      alert("Vendor information not found. Please login again.");
      navigate("/vendor/login");
      return;
    }

    setLoading(true);

    // CLEAN SPECIFICATIONS
    const cleanSpecs = specifications.filter(
      (s) => s.name.trim() && s.value.trim(),
    );

    // GENERATE SLUG
    const generatedSlug =
      formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") + `-${Date.now().toString().slice(-4)}`;

    // PRODUCT DATA
    const payload = new FormData();
    payload.append("name", formData.name.trim());
    payload.append("slug", generatedSlug);
    payload.append("category", formData.category);
    payload.append("categoryName", currentCategoryName);
    payload.append("subcategory", formData.subcategory.trim());
    payload.append("price", Number(formData.price));
    payload.append("mrp", Number(formData.mrp));
    payload.append("stock", Number(formData.stock));
    payload.append("lowStockLimit", Number(formData.lowStockLimit || 5));
    payload.append("shortDescription", formData.shortDescription.trim());
    payload.append("description", formData.description.trim());
    payload.append("longDescription", formData.description.trim());
    payload.append("status", formData.status);
    payload.append("vendor", vendorId);
    payload.append("specifications", JSON.stringify(cleanSpecs));
    payload.append("productTags", JSON.stringify(productTags));
    // Append image files
    images.forEach((imgObj) => {
      payload.append("images", imgObj.file);
    });
    // Provide single "image" key for single-file upload routes
    // if (images.length > 0) {
    //   payload.append("image", images[0].file);
    // }

    try {
      const res = await axios.post(`${API_BASE_URL}/products`, payload, {
        headers: {
          "Content-Type": "Application/json",
          Authorization: "Bearer " + token,
        },
      });

      const data = res.data;

      if (!data.success) {
        throw new Error(data.message || "Failed to save product.");
      }

      alert("Product added successfully!");

      // No setProducts here.
      // VendorProducts will fetch the products again from the API.

      navigate("/vendor/products");
    } catch (err) {
      handleAuthError(err);

      console.error("Add product error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");

        alert(
          "Your session has expired or the token is invalid. Please login again.",
        );

        navigate("/vendor/login");
        return;
      }

      alert(
        err.response?.data?.message || err.message || "Could not save product.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/vendor/products"
            className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-100 transition"
          >
            <ArrowLeft size={19} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Add Product</h1>
            <p className="text-sm text-slate-500 mt-1">
              Add a new product with professional gallery presentation
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            to="/vendor/products"
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50"
          >
            Cancel
          </Link>
        </div>
      </div>
      {/* FORM */}
      <form id="add-product-form" onSubmit={handleSubmit} className="space-y-6">
        {/* 1. BASIC INFORMATION */}
        <div className="bg-white border border-slate-200 rounded-2xl">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Package size={20} className="text-slate-700" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">
                  Basic Information
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Enter the main catalog details of your product
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* PRODUCT NAME */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Aster Pro ANC Headphones"
                className={`w-full px-4 py-3 border rounded-xl outline-none ${
                  error.name
                    ? "border-red-400 focus:ring-2 focus:ring-red-100"
                    : "border-slate-200 focus:border-slate-400"
                }`}
              />
              {error.name && (
                <p className="text-xs text-red-600 mt-1.5">{error.name}</p>
              )}
            </div>
            {/* CATEGORY */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl outline-none bg-white ${
                  error.category ? "border-red-400" : "border-slate-200"
                }`}
              >
                <option value="">
                  {loadingCategories
                    ? "Loading categories..."
                    : categories.length === 0
                      ? "No categories found in database"
                      : "Select Category"}
                </option>
                {categories.map((category) => (
                  <option
                    key={category._id || category.id}
                    value={category._id || category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
              {error.category && (
                <p className="text-xs text-red-600 mt-1.5">{error.category}</p>
              )}
            </div>
            {/* SUBCATEGORY */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Subcategory
              </label>
              <input
                type="text"
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
                placeholder="e.g. Headphones, Wireless, Gaming..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-slate-400"
              />
            </div>
          </div>
        </div>
        {/* 2. PRO PRODUCT IMAGES GALLERY (DRAG & DROP, COVER SELECTOR) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <ImagePlus size={20} className="text-slate-700" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">
                  Product Images & Gallery
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  High-resolution images attract up to 3x more orders
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600">
              {images.length} {images.length === 1 ? "Image" : "Images"}{" "}
              selected
            </span>
          </div>
          {/* DRAG & DROP ZONE */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition ${
              isDragging
                ? "border-blue-600 bg-blue-50/50"
                : error.images
                  ? "border-red-300 bg-red-50/20"
                  : "border-slate-200 hover:border-slate-400 bg-slate-50/50"
            }`}
          >
            <input
              type="file"
              id="product-image-input"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={handleImageInput}
              className="hidden"
            />
            <div className="max-w-md mx-auto flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-600 mb-3">
                <UploadCloud size={24} />
              </div>
              <p className="text-sm font-semibold text-slate-800">
                Drag and drop your photos here, or{" "}
                <label
                  htmlFor="product-image-input"
                  className="text-blue-600 underline cursor-pointer hover:text-blue-700"
                >
                  browse files
                </label>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports JPG, PNG, WEBP • Max 5MB per file • Up to 5 images
              </p>
            </div>
          </div>
          {error.images && (
            <p className="text-xs text-red-600 font-semibold mt-2">
              {error.images}
            </p>
          )}
          {/* PRO PREVIEW CARDS */}
          {images.length > 0 && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Gallery Previews</span>
                <span className="text-[11px] text-slate-400">
                  Tip: First image is your product cover
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {images.map((img, index) => {
                  const isCover = index === 0;
                  return (
                    <div
                      key={index}
                      className={`group relative rounded-2xl border overflow-hidden transition-all duration-200 bg-white shadow-xs ${
                        isCover
                          ? "ring-2 ring-blue-600 border-blue-500"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {/* IMAGE THUMBNAIL */}
                      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                        <img
                          src={img.url}
                          alt={img.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {/* DELETE BUTTON */}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 text-slate-700 shadow-sm flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition"
                          title="Remove Image"
                        >
                          <X size={14} />
                        </button>
                        {/* COVER BADGE */}
                        {isCover && (
                          <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                            <Star size={11} fill="white" />
                            Main Cover
                          </div>
                        )}
                      </div>
                      {/* CARD FOOTER */}
                      <div className="p-2.5 bg-white border-t border-slate-100 flex flex-col justify-between">
                        <p
                          className="text-xs font-semibold text-slate-800 truncate"
                          title={img.name}
                        >
                          {img.name}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-slate-400 font-mono">
                            {img.size}
                          </span>
                          {!isCover && (
                            <button
                              type="button"
                              onClick={() => setAsCover(index)}
                              className="text-[10px] font-bold text-blue-600 hover:underline"
                            >
                              Make Cover
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        {/* 3. PRICING */}
        <div className="bg-white border border-slate-200 rounded-2xl">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <IndianRupee size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Pricing</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Set customer selling price and retail MRP
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* PRICE */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
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
                  className={`w-full pl-9 pr-4 py-3 border rounded-xl outline-none ${
                    error.price ? "border-red-400" : "border-slate-200"
                  }`}
                />
              </div>
              {error.price && (
                <p className="text-xs text-red-600 mt-1.5">{error.price}</p>
              )}
            </div>
            {/* MRP */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
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
                  className={`w-full pl-9 pr-4 py-3 border rounded-xl outline-none ${
                    error.mrp ? "border-red-400" : "border-slate-200"
                  }`}
                />
              </div>
              {error.mrp && (
                <p className="text-xs text-red-600 mt-1.5">{error.mrp}</p>
              )}
            </div>
            {/* STATUS */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Product Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none bg-white"
              >
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>
        </div>
        {/* 4. INVENTORY */}
        <div className="bg-white border border-slate-200 rounded-2xl">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Boxes size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Inventory</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Manage warehouse quantities and stock thresholds
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* STOCK */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Initial Stock *
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                placeholder="Enter stock quantity"
                className={`w-full px-4 py-3 border rounded-xl outline-none ${
                  error.stock ? "border-red-400" : "border-slate-200"
                }`}
              />
              {error.stock && (
                <p className="text-xs text-red-600 mt-1.5">{error.stock}</p>
              )}
            </div>
            {/* LOW STOCK */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Low Stock Alert Threshold
              </label>
              <input
                type="number"
                name="lowStockLimit"
                value={formData.lowStockLimit}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none"
              />
              <p className="text-xs text-slate-400 mt-2">
                Automated warning alerts when stock reaches this level.
              </p>
            </div>
          </div>
        </div>
        {/* 5. SPECIFICATIONS */}
        <div className="bg-white border border-slate-200 rounded-2xl">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <ListPlus size={20} className="text-slate-700" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Specifications</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Add technical parameters, battery life, weight, materials,
                  etc.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddSpec}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
            >
              <Plus size={15} />
              Add Specification
            </button>
          </div>
          <div className="p-6 space-y-4">
            {specifications.map((spec, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row items-center gap-3"
              >
                <input
                  type="text"
                  placeholder="Specification Name (e.g. Battery, Material)"
                  value={spec.name}
                  onChange={(e) =>
                    handleSpecChange(index, "name", e.target.value)
                  }
                  className="w-full sm:flex-1 px-4 py-3 border border-slate-200 rounded-xl outline-none"
                />
                <input
                  type="text"
                  placeholder="Value (e.g. 40 hours, 100% Cotton)"
                  value={spec.value}
                  onChange={(e) =>
                    handleSpecChange(index, "value", e.target.value)
                  }
                  className="w-full sm:flex-1 px-4 py-3 border border-slate-200 rounded-xl outline-none"
                />
                <label className="flex items-center gap-2 text-xs font-medium text-slate-600 whitespace-nowrap cursor-pointer">
                  <input
                    type="checkbox"
                    checked={spec.isKeyFeature}
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
                    className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                  >
                    <Trash2 size={17} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        {/* 6. DESCRIPTION */}
        <div className="bg-white border border-slate-200 rounded-2xl">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <FileText size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">
                  Product Description
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Help customers understand why they should choose this product
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-5">
            {/* SHORT DESCRIPTION */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Short Description *
              </label>
              <textarea
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleChange}
                rows="3"
                maxLength="250"
                placeholder="Write a short summary for search results and product cards..."
                className={`w-full px-4 py-3 border rounded-xl outline-none resize-none ${
                  error.shortDescription ? "border-red-400" : "border-slate-200"
                }`}
              />
              <p className="text-xs text-slate-400 mt-1">
                Maximum 250 characters.
              </p>
              {error.shortDescription && (
                <p className="text-xs text-red-600 mt-1.5">
                  {error.shortDescription}
                </p>
              )}
            </div>
            {/* FULL DESCRIPTION */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Full Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="7"
                placeholder="Provide complete product details, instructions, and warranty..."
                className={`w-full px-4 py-3 border rounded-xl outline-none resize-none ${
                  error.description ? "border-red-400" : "border-slate-200"
                }`}
              />
              {error.description && (
                <p className="text-xs text-red-600 mt-1.5">
                  {error.description}
                </p>
              )}
            </div>
          </div>
        </div>
        {/* 7. TAGS */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <Tag size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Product Tags</h2>
              <p className="text-sm text-slate-500 mt-1">
                Tags help customers discover your product in search and category
                filters
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {["New Arrival", "Best Seller", "Featured"].map((tag) => (
              <button
                type="button"
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${
                  productTags.includes(tag)
                    ? "bg-slate-900 text-white font-medium"
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-sm"
                >
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)}>
                    <X size={14} />
                  </button>
                </span>
              ))}
          </div>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddCustomTag}
            placeholder="Add custom tags (press Enter)..."
            className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none"
          />
        </div>
        {/* BOTTOM ACTIONS */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pb-6">
          <Link
            to="/vendor/products"
            className="px-5 py-3 border border-slate-200 rounded-xl text-sm font-medium text-center hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 disabled:opacity-50 transition shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Uploading & Creating Product...
              </>
            ) : (
              <>
                <Plus size={17} />
                Publish Product
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VendorAddProduct;
