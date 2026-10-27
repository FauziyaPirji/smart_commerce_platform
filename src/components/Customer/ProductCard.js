import React from "react";
import { Heart, Store } from "lucide-react";
import { Link } from "react-router-dom";

// FORMATTERS
const money = (value) =>
  `₹${new Intl.NumberFormat("en-IN").format(Number(value) || 0)}`;

const discount = (price, mrp) => {
  const p = Number(price);
  const m = Number(mrp);
  if (!p || !m || m <= p) return 0;
  return Math.round((1 - p / m) * 100);
};

const getInitials = (name) => {
  if (!name) return "P";
  const words = String(name).trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return String(name).slice(0, 2).toUpperCase();
};

const ProductCard = ({
  product = {},
  onCart,
  onWish,
  wished = false,
  onCompare,
}) => {
  const prodId = product._id || product.id;
  const sellingPrice = product.discountPrice ?? product.price ?? 0;
  const mrp = product.price ?? 0;
  const off = discount(sellingPrice, mrp);

  // RESOLVE VACATION MODE
  const isVacation = Boolean(
    product.isVacationMode ||
    product.canAddToCart === false ||
    product.vendorProfile?.businessStatus === "vacation_mode" ||
    product.vendorProfile?.isVacationMode ||
    product.vendor?.businessStatus === "vacation_mode",
  );

  // RESOLVE PRODUCT IMAGE
  const productImage =
    (Array.isArray(product.images) && product.images.length > 0
      ? product.images[0]
      : product.image) || null;

  // RESOLVE VENDOR DETAILS & LOGO
  const vendorName =
    product.vendorProfile?.storeName ||
    product.vendor?.storeName ||
    (typeof product.vendor === "object" && product.vendor !== null
      ? `${product.vendor.firstName || ""} ${product.vendor.lastName || ""}`.trim() ||
        "Verified Vendor"
      : product.vendor || "Verified Vendor");

  const vendorLogo =
    product.vendorProfile?.storeLogo ||
    product.vendor?.storeLogo ||
    product.vendor?.logo ||
    product.vendor?.image ||
    null;

  const stock = Number(product.stock ?? 0);

  return (
    <article className="group relative overflow-hidden rounded-[1.25rem] border border-border bg-card p-2.5 shadow-[0_12px_32px_rgba(37,50,64,.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(37,50,64,.11)] flex flex-col justify-between">
      <div>
        {/* PRODUCT IMAGE CONTAINER */}
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-100 border border-slate-200/60">
          <Link to={`/product/${prodId}`} className="block size-full">
            {productImage ? (
              <img
                src={productImage}
                alt={product.name || "Product"}
                loading="lazy"
                className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const fallback = e.currentTarget.nextElementSibling;
                  if (fallback) fallback.style.display = "flex";
                }}
              />
            ) : null}

            {/* FALLBACK TO INITIALS IF NO IMAGE OR LOAD ERROR */}
            <div
              className={`size-full items-center justify-center bg-gradient-to-br from-teal-900 via-teal-700 to-amber-600 ${
                productImage ? "hidden" : "flex"
              }`}
            >
              <span className="display text-6xl font-extrabold text-white/90 drop-shadow-md">
                {getInitials(product.name)}
              </span>
            </div>
          </Link>

          {/* VACATION MODE BADGE */}
          {isVacation && (
            <span className="absolute left-3 top-3 z-10 rounded-full bg-amber-500/95 px-2.5 py-1 text-[10px] font-bold text-white shadow-xs flex items-center gap-1 backdrop-blur-xs">
              <span className="size-1.5 rounded-full bg-white animate-pulse" />
              Temporarily Unavailable
            </span>
          )}

          {/* WISHLIST BUTTON (Always Available) */}
          <button
            type="button"
            onClick={onWish}
            className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full bg-white/90 text-slate-700 shadow-sm transition hover:scale-110 hover:text-red-600 hover:bg-white"
            aria-label="Add to wishlist"
          >
            <Heart
              size={17}
              className={
                wished ? "text-red-500 fill-red-500" : "text-slate-600"
              }
            />
          </button>

          {/* DISCOUNT BADGE */}
          {off > 0 && (
            <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-slate-900 shadow-xs">
              {off}% off
            </span>
          )}
        </div>

        {/* DETAILS */}
        <div className="p-2 pt-3">
          {/* VENDOR PHOTO & NAME */}
          <div className="flex items-center gap-1.5">
            <div className="size-4 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
              {vendorLogo ? (
                <img
                  src={vendorLogo}
                  alt={vendorName}
                  className="size-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <Store size={9} className="text-[#287b6d]" />
              )}
            </div>

            <p
              className="text-[11px] font-semibold text-muted-foreground truncate"
              title={vendorName}
            >
              {vendorName}
            </p>
          </div>

          <Link to={`/product/${prodId}`}>
            <h3
              className="display mt-1 line-clamp-1 font-bold text-slate-900 transition group-hover:text-primary"
              title={product.name}
            >
              {product.name || "Unnamed Product"}
            </h3>
          </Link>

          <div className="mt-3 flex items-end justify-between gap-2">
            <div>
              <p className="text-lg font-extrabold text-slate-900">
                {money(sellingPrice)}
              </p>

              {off > 0 && (
                <p className="text-[11px] text-muted-foreground line-through">
                  {money(mrp)}
                </p>
              )}
            </div>

            <span
              className={`text-[11px] font-bold ${
                stock <= 0
                  ? "text-red-600"
                  : stock <= 5
                    ? "text-amber-600"
                    : "text-teal-700"
              }`}
            >
              {stock <= 0
                ? "Out of stock"
                : stock <= 5
                  ? `Only ${stock} left`
                  : "In stock"}
            </span>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="p-2 pt-0 mt-3 flex gap-2">
        {isVacation ? (
          <button
            type="button"
            onClick={onCart}
            className="flex-1 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs font-bold text-amber-800 transition hover:bg-amber-100 hover:border-amber-300"
            title="This seller is temporarily on vacation. Click to learn more."
          >
            Temporarily Unavailable
          </button>
        ) : (
          <button
            type="button"
            onClick={onCart}
            disabled={stock <= 0}
            className="flex-1 rounded-xl bg-primary px-3 py-2.5 text-xs font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {stock <= 0 ? "Out of Stock" : "Add to cart"}
          </button>
        )}

        {onCompare && (
          <button
            type="button"
            onClick={onCompare}
            className="rounded-xl border border-border px-3 text-xs font-bold text-muted-foreground transition hover:border-primary hover:text-primary hover:bg-slate-50"
          >
            Compare
          </button>
        )}
      </div>
    </article>
  );
};

export default ProductCard;
