import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { handleAuthError } from "../../AuthRoute";
import {
  ArrowRight,
  X,
  SlidersHorizontal,
  ShoppingCart,
  CheckCircle2,
  XCircle,
  Sparkles,
  Trophy,
  ThumbsUp,
  AlertTriangle,
  Bot,
  Send,
  Loader2,
  Crown,
  Zap,
} from "lucide-react";

const API_BASE_URL = "https://smart-commerce-platform-backend.onrender.com/api";

const getToken = () => localStorage.getItem("token") || null;
const isLoggedIn = () => Boolean(getToken());

const formatMoney = (val) => {
  const num = Number(val);
  return isNaN(num) ? "₹0" : `₹${num.toLocaleString("en-IN")}`;
};

const getInitials = (name) => {
  if (!name) return "SC";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const getProductImage = (product) => {
  if (!product) return null;
  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images[0];
  }
  return (
    product.image ||
    (typeof product.images === "string" ? product.images : null)
  );
};

const ComparePage = () => {
  const [compareList, setCompareList] = useState([]);
  const [imageErrors, setImageErrors] = useState({});

  // AI Comparison Results
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // AI Q&A Box
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBottomRef = useRef(null);

  const handleImageError = (id) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  // Load Compare List from LocalStorage
  const loadCompare = () => {
    try {
      const stored = JSON.parse(localStorage.getItem("compare") || "[]");
      const list = Array.isArray(stored) ? stored : [];
      setCompareList(list);

      // Invalidate AI state if products change or drop below 2
      if (list.length < 2) {
        setAiAnalysis(null);
        setChatMessages([]);
      }
    } catch {
      setCompareList([]);
    }
  };

  useEffect(() => {
    loadCompare();
    window.addEventListener("compareUpdated", loadCompare);
    return () => window.removeEventListener("compareUpdated", loadCompare);
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isChatLoading]);

  // Remove single item from comparison
  const handleRemove = (productId) => {
    const pId = String(productId);
    try {
      const stored = JSON.parse(localStorage.getItem("compare") || "[]");
      const updated = stored.filter(
        (item) => String(item._id || item.id) !== pId,
      );
      localStorage.setItem("compare", JSON.stringify(updated));
      setCompareList(updated);
      setAiAnalysis(null);
      window.dispatchEvent(new Event("compareUpdated"));
    } catch (err) {
      console.error("Remove compare error:", err);
    }
  };

  // Add item to Cart
  const handleCart = async (product) => {
    const pId = product._id || product.id;

    if (isLoggedIn()) {
      try {
        await axios.post(
          `${API_BASE_URL}/customer/cart/add`,
          { productId: pId, quantity: 1 },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getToken()}`,
            },
          },
        );
        window.dispatchEvent(new Event("cartUpdated"));
      } catch (err) {
        handleAuthError(err);
        console.error("Cart DB error:", err);
      }
    } else {
      try {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        const existing = cart.find((item) => (item._id || item.id) === pId);
        const updated = existing
          ? cart.map((item) =>
              (item._id || item.id) === pId
                ? { ...item, quantity: (item.quantity || 1) + 1 }
                : item,
            )
          : [...cart, { ...product, quantity: 1 }];

        localStorage.setItem("cart", JSON.stringify(updated));
        window.dispatchEvent(new Event("cartUpdated"));
      } catch (err) {
        console.error("Cart storage error:", err);
      }
    }
  };

  // Request AI Evaluation
  const handleGenerateAiVerdict = async () => {
    if (compareList.length < 2) return;
    setIsAiLoading(true);
    setAiError("");

    try {
      const response = await axios.post(`${API_BASE_URL}/ai/compare-products`, {
        products: compareList,
        productIds: compareList.map((p) => p._id || p.id),
      });

      if (response.data?.success && response.data?.data) {
        setAiAnalysis(response.data.data);
      } else {
        setAiError("Could not retrieve AI recommendation.");
      }
    } catch (err) {
      console.error("AI Verdict Error:", err);
      setAiError(
        err.response?.data?.errorMessage ||
          "Failed to get AI recommendation. Please check your backend and API key.",
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  // Ask AI a question about these compared products
  const handleSendQuestion = async (e) => {
    e.preventDefault();
    const query = chatInput.trim();
    if (!query || isChatLoading || compareList.length < 2) return;

    const newMessages = [...chatMessages, { role: "user", content: query }];
    setChatMessages(newMessages);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/ai/compare-ask`, {
        products: compareList,
        question: query,
        history: newMessages,
      });

      if (response.data?.success) {
        setChatMessages([
          ...newMessages,
          { role: "assistant", content: response.data.reply },
        ]);
      }
    } catch (err) {
      console.error("Chat AI error:", err);
      setChatMessages([
        ...newMessages,
        {
          role: "assistant",
          content:
            err.response?.data?.errorMessage ||
            "Unable to answer right now. Please try again.",
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Check if a given product ID is the AI Best Pick
  const isBestProduct = (productId) => {
    if (!aiAnalysis?.bestPick?.productId) return false;
    return String(productId) === String(aiAnalysis.bestPick.productId);
  };

  const winningProduct =
    aiAnalysis?.bestPick?.productId &&
    compareList.find((p) => isBestProduct(p._id || p.id));

  return (
    <main className="min-h-screen bg-slate-50/60 pb-20 pt-8 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-600">
            Intelligent Comparison
          </p>

          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Compare Products Side by Side
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Put your shortlisted products together. Let our Gemini AI engine
                evaluate specs, prices, and declare the single best product for
                your needs.
              </p>
            </div>

            {compareList.length > 0 && (
              <span className="rounded-full bg-indigo-50 border border-indigo-200 px-4 py-1.5 text-xs font-bold text-indigo-700">
                {compareList.length}{" "}
                {compareList.length === 1 ? "Product" : "Products"} Comparing
              </span>
            )}
          </div>
        </div>

        {/* State: Less than 2 products */}
        {compareList.length < 2 ? (
          <section className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center shadow-sm">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
              <SlidersHorizontal size={30} />
            </div>

            <h2 className="mt-6 text-2xl font-bold text-slate-800">
              Add at least two products to compare
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Browse the store and add 2 or more products to side-by-side
              comparison to activate the AI decision advisor.
            </p>

            <Link
              to="/shop"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-700"
            >
              Browse Catalogue
              <ArrowRight size={16} />
            </Link>
          </section>
        ) : (
          <>
            {/* AI Advisor Banner / Trigger */}
            <div className="mt-8 overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-2xl relative border border-indigo-500/30">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between relative z-10">
                <div className="flex items-start gap-4">
                  <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-indigo-500/20 backdrop-blur-md text-indigo-300 border border-indigo-400/30">
                    <Sparkles size={24} className="animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2.5">
                      Gemini AI Recommendation Engine
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                        Powered by Gemini
                      </span>
                    </h2>
                    <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                      AI analyzes specifications, price-to-performance ratio,
                      seller authenticity, and highlights the best suggested
                      product across the comparison table.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateAiVerdict}
                  disabled={isAiLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-extrabold text-slate-900 shadow-xl transition hover:bg-indigo-50 disabled:opacity-60 shrink-0"
                >
                  {isAiLoading ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin text-indigo-600"
                      />
                      Evaluating Products…
                    </>
                  ) : (
                    <>
                      <Zap
                        size={18}
                        className="text-amber-500 fill-amber-500"
                      />
                      {aiAnalysis
                        ? "Re-Analyze with AI"
                        : "Find Best Suggested Product"}
                    </>
                  )}
                </button>
              </div>

              {aiError && (
                <div className="mt-4 rounded-xl bg-rose-500/20 border border-rose-500/40 p-3.5 text-xs text-rose-200 flex items-center gap-2">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}
            </div>

            {/* AI Winning Product Showcase Banner */}
            {aiAnalysis?.bestPick && (
              <div className="mt-8 rounded-3xl border-2 border-emerald-500 bg-emerald-500/5 p-6 md:p-8 backdrop-blur-sm relative overflow-hidden shadow-xl shadow-emerald-500/10">
                <div className="absolute top-0 right-0 bg-emerald-600 text-white px-5 py-2 rounded-bl-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                  <Crown size={15} />
                  {aiAnalysis.bestPick.badgeTitle || "Best Suggested Product"}
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-2 max-w-3xl">
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-1.5">
                      <Trophy size={15} /> Top Recommendation
                    </span>
                    <h3 className="text-2xl md:text-3xl font-black text-slate-900">
                      {aiAnalysis.bestPick.productName}
                    </h3>
                    <p className="text-sm text-slate-700 leading-relaxed pt-1">
                      {aiAnalysis.bestPick.reason}
                    </p>

                    {aiAnalysis.bestPick.highlightFeature && (
                      <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-100/80 px-3 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                        <Sparkles size={13} />{" "}
                        {aiAnalysis.bestPick.highlightFeature}
                      </div>
                    )}
                  </div>

                  {winningProduct && (
                    <div className="flex flex-col items-start lg:items-end gap-3 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-emerald-200">
                      <div className="text-left lg:text-right">
                        <span className="text-xs font-medium text-slate-500">
                          Best Suggested Price
                        </span>
                        <div className="text-2xl font-black text-emerald-700">
                          {formatMoney(
                            winningProduct.discountPrice ||
                              winningProduct.price,
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCart(winningProduct)}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition"
                      >
                        <ShoppingCart size={16} />
                        Add Winner to Cart
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mobile Scroll Hint */}
            <div className="mt-8 rounded-xl bg-slate-200/70 px-4 py-2.5 text-xs text-slate-600 lg:hidden">
              Swipe horizontally to inspect all comparison attributes.
            </div>

            {/* SIDE BY SIDE COMPARISON TABLE WITH COLUMN HIGHLIGHTING */}
            <section className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] border-collapse text-left">
                  {/* Table Headers */}
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-20 w-44 min-w-44 border-b border-slate-200 bg-slate-100/95 backdrop-blur-sm p-5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Product
                      </th>

                      {compareList.map((product) => {
                        const pId = product._id || product.id;
                        const isWinner = isBestProduct(pId);
                        const sellingPrice =
                          product.discountPrice || product.price || 0;
                        const originalPrice =
                          product.mrp || product.price || sellingPrice;

                        const vendorName =
                          typeof product.vendor === "object"
                            ? product.vendor?.storeName ||
                              `${product.vendor?.firstName || ""} ${product.vendor?.lastName || ""}`.trim() ||
                              "Vendor"
                            : product.vendor || "Vendor";

                        const mark = product.mark || getInitials(product.name);
                        const tone =
                          product.tone ||
                          "from-teal-800 via-teal-700 to-amber-600";

                        const productImg = getProductImage(product);
                        const hasValidImg = Boolean(
                          productImg && !imageErrors[pId],
                        );

                        return (
                          <th
                            key={pId}
                            className={`min-w-[260px] border-b p-5 align-top transition-colors relative ${
                              isWinner
                                ? "bg-emerald-50/80 border-x-2 border-emerald-500 border-t-4 border-t-emerald-500"
                                : "bg-white border-l border-slate-200"
                            }`}
                          >
                            {/* Best Product Floating Pill */}
                            {isWinner && (
                              <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-sm">
                                <Crown size={13} />
                                AI BEST CHOICE
                              </div>
                            )}

                            <div className="relative">
                              {/* Remove Button */}
                              <button
                                type="button"
                                onClick={() => handleRemove(pId)}
                                className="absolute right-0 top-0 grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                                aria-label={`Remove ${product.name}`}
                              >
                                <X size={16} />
                              </button>

                              {/* Image */}
                              <Link
                                to={`/product/${pId}`}
                                className="group/img block"
                              >
                                <div
                                  className={`relative flex size-28 items-center justify-center overflow-hidden rounded-2xl border bg-slate-100 shadow-xs ${
                                    isWinner
                                      ? "border-emerald-300 ring-2 ring-emerald-500/20"
                                      : "border-slate-200"
                                  }`}
                                >
                                  {hasValidImg ? (
                                    <img
                                      src={productImg}
                                      alt={product.name || "Product"}
                                      className="size-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                                      onError={() => handleImageError(pId)}
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div
                                      className={`flex size-full items-center justify-center bg-gradient-to-br ${tone}`}
                                    >
                                      <span className="text-3xl font-extrabold text-white/90">
                                        {mark}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </Link>

                              {/* Title */}
                              <Link to={`/product/${pId}`}>
                                <h2 className="mt-3.5 line-clamp-2 pr-6 text-sm font-bold text-slate-800 leading-snug hover:text-indigo-600">
                                  {product.name}
                                </h2>
                              </Link>

                              <p className="mt-1 text-xs text-slate-500">
                                {vendorName}
                              </p>

                              {/* Price */}
                              <div className="mt-3 flex items-baseline gap-2">
                                <span
                                  className={`text-xl font-black ${
                                    isWinner
                                      ? "text-emerald-700"
                                      : "text-slate-900"
                                  }`}
                                >
                                  {formatMoney(sellingPrice)}
                                </span>
                                {originalPrice > sellingPrice && (
                                  <span className="text-xs text-slate-400 line-through">
                                    {formatMoney(originalPrice)}
                                  </span>
                                )}
                              </div>

                              {/* Cart Button */}
                              <button
                                type="button"
                                onClick={() => handleCart(product)}
                                className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-sm ${
                                  isWinner
                                    ? "bg-emerald-600 text-white hover:bg-emerald-700 ring-2 ring-emerald-600/30 shadow-emerald-600/20"
                                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                                }`}
                              >
                                <ShoppingCart size={14} />
                                {isWinner ? "Add Best Pick" : "Add to Cart"}
                              </button>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  {/* Table Comparison Rows */}
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {/* Category */}
                    <tr>
                      <td className="sticky left-0 z-10 bg-slate-50 p-4 font-bold text-slate-600">
                        Category
                      </td>
                      {compareList.map((product) => {
                        const isWinner = isBestProduct(
                          product._id || product.id,
                        );
                        return (
                          <td
                            key={product._id || product.id}
                            className={`p-4 font-semibold text-slate-700 ${
                              isWinner
                                ? "bg-emerald-50/80 border-x-2 border-emerald-500 font-bold"
                                : "border-l border-slate-200"
                            }`}
                          >
                            {typeof product.category === "object"
                              ? product.category?.name
                              : product.category || "General"}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Selling Price */}
                    <tr>
                      <td className="sticky left-0 z-10 bg-slate-50 p-4 font-bold text-slate-600">
                        Price
                      </td>
                      {compareList.map((product) => {
                        const isWinner = isBestProduct(
                          product._id || product.id,
                        );
                        return (
                          <td
                            key={product._id || product.id}
                            className={`p-4 font-extrabold text-sm ${
                              isWinner
                                ? "bg-emerald-50/80 border-x-2 border-emerald-500 text-emerald-700"
                                : "border-l border-slate-200 text-slate-900"
                            }`}
                          >
                            {formatMoney(
                              product.discountPrice || product.price,
                            )}
                            {isWinner && (
                              <span className="ml-2 inline-block rounded bg-emerald-200 px-1.5 py-0.5 text-[10px] font-bold text-emerald-900">
                                Best Value
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* MRP */}
                    <tr>
                      <td className="sticky left-0 z-10 bg-slate-50 p-4 font-bold text-slate-600">
                        Original MRP
                      </td>
                      {compareList.map((product) => {
                        const isWinner = isBestProduct(
                          product._id || product.id,
                        );
                        return (
                          <td
                            key={product._id || product.id}
                            className={`p-4 text-slate-500 ${
                              isWinner
                                ? "bg-emerald-50/80 border-x-2 border-emerald-500"
                                : "border-l border-slate-200"
                            }`}
                          >
                            {formatMoney(product.mrp || product.price)}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Stock Availability */}
                    <tr>
                      <td className="sticky left-0 z-10 bg-slate-50 p-4 font-bold text-slate-600">
                        Stock Status
                      </td>
                      {compareList.map((product) => {
                        const isWinner = isBestProduct(
                          product._id || product.id,
                        );
                        const inStock = (product.stock ?? 10) > 0;
                        return (
                          <td
                            key={product._id || product.id}
                            className={`p-4 ${
                              isWinner
                                ? "bg-emerald-50/80 border-x-2 border-emerald-500"
                                : "border-l border-slate-200"
                            }`}
                          >
                            {inStock ? (
                              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700">
                                <CheckCircle2 size={14} />
                                In stock ({product.stock ?? 10} units)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 font-bold text-rose-600">
                                <XCircle size={14} />
                                Out of stock
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Specifications */}
                    <tr>
                      <td className="sticky left-0 z-10 bg-slate-50 p-4 font-bold text-slate-600 align-top">
                        Specifications
                      </td>
                      {compareList.map((product) => {
                        const isWinner = isBestProduct(
                          product._id || product.id,
                        );
                        const specifications = Array.isArray(
                          product.specifications,
                        )
                          ? product.specifications
                          : [];
                        return (
                          <td
                            key={product._id || product.id}
                            className={`p-4 align-top ${
                              isWinner
                                ? "bg-emerald-50/80 border-x-2 border-emerald-500"
                                : "border-l border-slate-200"
                            }`}
                          >
                            {specifications.length > 0 ? (
                              <div className="space-y-1.5">
                                {specifications.map((spec, index) => {
                                  if (
                                    typeof spec === "object" &&
                                    spec !== null
                                  ) {
                                    const field =
                                      spec.field ||
                                      spec.name ||
                                      spec.key ||
                                      `Spec ${index + 1}`;
                                    const value =
                                      spec.value ||
                                      spec.text ||
                                      spec.description ||
                                      "N/A";
                                    return (
                                      <div
                                        key={spec._id || index}
                                        className={`flex items-start justify-between gap-2 rounded-lg px-2.5 py-1.5 border ${
                                          isWinner
                                            ? "bg-white border-emerald-200"
                                            : "bg-slate-50 border-slate-100"
                                        }`}
                                      >
                                        <span className="font-medium text-slate-500">
                                          {field}
                                        </span>
                                        <span className="font-bold text-slate-800 text-right">
                                          {String(value)}
                                        </span>
                                      </div>
                                    );
                                  }
                                  return (
                                    <div
                                      key={index}
                                      className="rounded-lg bg-slate-50 px-2.5 py-1.5 font-semibold text-slate-700 border border-slate-100"
                                    >
                                      {String(spec)}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-slate-400">
                                None specified
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Seller / Vendor */}
                    <tr>
                      <td className="sticky left-0 z-10 bg-slate-50 p-4 font-bold text-slate-600">
                        Seller
                      </td>
                      {compareList.map((product) => {
                        const isWinner = isBestProduct(
                          product._id || product.id,
                        );
                        const vendorName =
                          typeof product.vendor === "object"
                            ? product.vendor?.storeName ||
                              `${product.vendor?.firstName || ""} ${product.vendor?.lastName || ""}`.trim() ||
                              "Vendor"
                            : product.vendor || "Vendor";

                        return (
                          <td
                            key={product._id || product.id}
                            className={`p-4 font-semibold text-slate-700 ${
                              isWinner
                                ? "bg-emerald-50/80 border-x-2 border-emerald-500 border-b-4 border-b-emerald-500"
                                : "border-l border-slate-200"
                            }`}
                          >
                            {vendorName}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* AI Individual Pros / Cons Cards */}
            {aiAnalysis?.productAnalysis?.length > 0 && (
              <section className="mt-8 space-y-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ThumbsUp size={18} className="text-indigo-600" />
                  Product-by-Product Strengths & Considerations
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {aiAnalysis.productAnalysis.map((item, idx) => {
                    const isWinner = isBestProduct(item.productId);

                    return (
                      <div
                        key={item.productId || idx}
                        className={`flex flex-col rounded-3xl bg-white p-5 border transition shadow-sm ${
                          isWinner
                            ? "border-emerald-500 ring-2 ring-emerald-500/20"
                            : "border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <h4 className="font-bold text-slate-900 truncate text-sm">
                            {item.productName}
                          </h4>
                          {isWinner && (
                            <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-black uppercase text-white">
                              Winner
                            </span>
                          )}
                        </div>

                        {item.idealFor && (
                          <div className="mt-3 text-xs bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-slate-700">
                            <span className="font-bold text-slate-900">
                              Target User:{" "}
                            </span>
                            {item.idealFor}
                          </div>
                        )}

                        <div className="mt-3.5 space-y-1.5 flex-1">
                          <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 size={12} /> Key Advantages
                          </p>
                          <ul className="space-y-1 text-xs text-slate-600">
                            {item.pros?.map((pro, pIdx) => (
                              <li
                                key={pIdx}
                                className="flex items-start gap-1.5"
                              >
                                <span className="text-emerald-500 font-bold">
                                  •
                                </span>
                                <span>{pro}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {item.cons?.length > 0 && (
                          <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                            <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                              <AlertTriangle size={12} /> Downsides
                            </p>
                            <ul className="space-y-1 text-xs text-slate-500">
                              {item.cons?.map((con, cIdx) => (
                                <li
                                  key={cIdx}
                                  className="flex items-start gap-1.5"
                                >
                                  <span className="text-amber-500 font-bold">
                                    •
                                  </span>
                                  <span>{con}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Interactive Ask AI Box */}
            <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <Bot size={20} className="text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-800">
                  Ask AI About These Compared Products
                </h4>
              </div>

              <div className="mt-4 max-h-56 overflow-y-auto space-y-3 pr-2 text-xs">
                {chatMessages.length === 0 ? (
                  <p className="text-slate-400 italic">
                    Type a question like: &quot;Which of these gives better
                    value for everyday gaming?&quot; or &quot;Is the price
                    difference worth it?&quot;
                  </p>
                ) : (
                  chatMessages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 leading-relaxed ${
                          msg.role === "user"
                            ? "bg-indigo-600 text-white rounded-br-sm"
                            : "bg-slate-100 text-slate-800 rounded-bl-sm border border-slate-200/60"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
                {isChatLoading && (
                  <div className="flex items-center gap-2 text-slate-400 italic text-xs">
                    <Loader2
                      size={14}
                      className="animate-spin text-indigo-600"
                    />
                    AI is analyzing…
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              <form onSubmit={handleSendQuestion} className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a question comparing these products…"
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="submit"
                  disabled={isChatLoading || !chatInput.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Send size={14} />
                  Ask AI
                </button>
              </form>
            </section>

            {/* Back link */}
            <div className="mt-8">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition"
              >
                ← Continue shopping
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
};

export default ComparePage;
