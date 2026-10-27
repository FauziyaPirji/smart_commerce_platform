import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  ShieldCheck,
  ArrowRight,
  Loader2,
  AlertCircle,
  MapPin,
  Search,
  Store,
  CheckCircle2,
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000/api/customer";

const getInitials = (name) => {
  if (!name) return "SC";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const VendorCard = ({ vendor }) => {
  const vId = vendor._id || vendor.id;
  const storeName =
    vendor.storeName || vendor.businessName || "Independent Store";
  const initials = vendor.initials || getInitials(storeName);
  const city = vendor.city || vendor.state || "India";
  const description =
    vendor.storeDescription ||
    vendor.description ||
    "Trusted independent vendor on SmartCommerce.";
  const productCount = vendor.productCount ?? vendor.productsCount ?? 0;
  const bgColor = vendor.color || "bg-primary";

  // RESOLVE LOGO & VACATION MODE
  const logo = vendor.storeLogo || vendor.logo || vendor.image || null;

  const isVacation = Boolean(
    vendor.isVacationMode || vendor.businessStatus === "vacation_mode",
  );

  return (
    <Link
      to={`/vendor/${vId}`}
      className={`
        group block rounded-2xl border bg-card
        p-6
        transition-all duration-200
        hover:-translate-y-0.5
        hover:shadow-[0_12px_30px_rgba(37,50,64,.07)]
        ${vendor.featured ? "border-primary" : "border-border"}
      `}
    >
      <div className="flex items-start gap-5">
        {/* Real Vendor Logo or Initials Fallback */}
        <div className="relative size-[68px] shrink-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-xs">
          {logo ? (
            <img
              src={logo}
              alt={storeName}
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                e.target.style.display = "none";
              }}
              loading="lazy"
            />
          ) : null}
          <div
            style={{ display: logo ? "none" : "grid" }}
            className={`size-full place-items-center text-lg font-extrabold text-white ${bgColor}`}
          >
            {initials}
          </div>
        </div>

        {/* Vendor information */}
        <div className="min-w-0 flex-1">
          {/* Name + Badges */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <h2 className="display text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition sm:text-[19px]">
                {storeName}
              </h2>

              <ShieldCheck
                size={17}
                strokeWidth={1.8}
                className="text-primary shrink-0"
              />
            </div>

            {/* LIVE VACATION / ACTIVE STATUS BADGE */}
            {isVacation ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                Temporarily Unavailable
              </span>
            ) : (
              <></>
            )}
          </div>

          {/* City */}
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin size={13} className="shrink-0 text-slate-400" />
            <span>{city}</span>
          </div>

          {/* Description */}
          <p className="mt-3 text-[14px] leading-5 text-muted-foreground line-clamp-2">
            {description}
          </p>

          {/* Footer: Products count & Action link */}
          <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
            {isVacation ? (
              <>
                <span className="font-semibold text-muted-foreground">
                  {productCount} {productCount === 1 ? "product" : "products"} ·
                  Browsing only
                </span>
                <span className="inline-flex items-center font-bold text-amber-800 group-hover:text-amber-900 transition">
                  Visit store
                  <ArrowRight
                    size={14}
                    className="ml-1 transition-transform group-hover:translate-x-1"
                  />
                </span>
              </>
            ) : (
              <>
                <span className="font-semibold text-primary">
                  {productCount} active{" "}
                  {productCount === 1 ? "product" : "products"} · Order now
                </span>
                <span className="inline-flex items-center font-bold text-primary group-hover:text-primary/80 transition">
                  Visit store
                  <ArrowRight
                    size={14}
                    className="ml-1 transition-transform group-hover:translate-x-1"
                  />
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

const VendorsPage = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "active" | "vacation"

  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(`${API_BASE_URL}/vendors`);
        if (response.data && response.data.success) {
          setVendors(response.data.vendors || []);
        } else if (Array.isArray(response.data)) {
          setVendors(response.data);
        } else {
          setVendors(response.data.vendors || response.data.data || []);
        }
      } catch (err) {
        console.error("Error fetching vendors:", err);
        setError("Failed to load stores. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, []);

  // Filtered Vendors
  const filteredVendors = useMemo(() => {
    return vendors.filter((vendor) => {
      const storeName = (
        vendor.storeName ||
        vendor.businessName ||
        ""
      ).toLowerCase();
      const city = (vendor.city || vendor.state || "").toLowerCase();
      const q = searchTerm.toLowerCase().trim();

      const matchesSearch = !q || storeName.includes(q) || city.includes(q);

      const isVacation = Boolean(
        vendor.isVacationMode || vendor.businessStatus === "vacation_mode",
      );

      if (statusFilter === "active") {
        return matchesSearch && !isVacation;
      }
      if (statusFilter === "vacation") {
        return matchesSearch && isVacation;
      }
      return matchesSearch;
    });
  }, [vendors, searchTerm, statusFilter]);

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16 pt-10 lg:pt-14">
        {/* Page heading */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <p className="mono text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
              Stores worth knowing
            </p>

            <h1 className="display mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-[44px]">
              The independent edit.
            </h1>

            <p className="mt-2 text-sm text-muted-foreground max-w-xl">
              Discover verified independent sellers committed to quality,
              craftsmanship, and transparency.
            </p>
          </div>

          {/* Quick Counter */}
          {!loading && vendors.length > 0 && (
            <div className="rounded-xl border border-border bg-card px-4 py-2 self-start md:self-auto">
              <span className="text-xs font-bold text-foreground">
                {filteredVendors.length}
              </span>{" "}
              <span className="text-xs text-muted-foreground">
                {filteredVendors.length === 1 ? "store shown" : "stores shown"}
              </span>
            </div>
          )}
        </div>

        {/* SEARCH & STATUS FILTER STRIP */}
        <div className="mb-8 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search store name or city..."
              className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Status Buttons */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card p-1 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                statusFilter === "all"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Stores
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("active")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                statusFilter === "active"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Open Now
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("vacation")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                statusFilter === "vacation"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Temporarily Unavailable
            </button>
          </div>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p className="text-sm font-semibold">Loading vendor stores...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-red-500">
            <AlertCircle size={32} />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : vendors.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center text-muted-foreground">
            <Store
              size={36}
              className="mx-auto text-muted-foreground/60 mb-3"
            />
            <p className="text-sm font-semibold">
              No independent stores available at the moment.
            </p>
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
            <p className="text-sm font-semibold">
              No stores match your current filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
              className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition hover:opacity-90"
            >
              Reset filters
            </button>
          </div>
        ) : (
          /* Vendor grid */
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {filteredVendors.map((vendor) => (
              <VendorCard key={vendor._id || vendor.id} vendor={vendor} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default VendorsPage;
