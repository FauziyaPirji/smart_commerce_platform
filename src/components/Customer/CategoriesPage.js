import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Loader2, AlertCircle, ArrowRight } from "lucide-react";

const API_BASE_URL = "https://smart-commerce-platform-backend.onrender.com/api/customer";

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [brokenImages, setBrokenImages] = useState({});

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(`${API_BASE_URL}/categories`);
        if (response.data && response.data.success) {
          setCategories(response.data.categories || []);
        } else if (Array.isArray(response.data)) {
          setCategories(response.data);
        } else {
          setCategories(response.data.categories || response.data.data || []);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("Failed to load categories. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* PAGE HEADER */}
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6 sm:pt-14 lg:px-8">
        <p className="mono mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
          Browse freely
        </p>

        <h1 className="display max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          A category for
          <br />
          every kind of curious.
        </h1>

        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          From a small kitchen upgrade to a new daily ritual, discover a better
          way to browse.
        </p>
      </section>

      {/* CATEGORY GRID */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p className="text-sm">Loading categories...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-red-500">
            <AlertCircle size={32} />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
            No categories available at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category, index) => {
              const catId = category._id || category.id || index;
              const firstLetter = category.name?.charAt(0).toUpperCase() || "C";
              const catImage = category.image || category.imageUrl || null;
              const isImageBroken = brokenImages[catId];

              const slug =
                category.slug ||
                category.name
                  .toLowerCase()
                  .replace(/\s+/g, "-")
                  .replace(/&/g, "and");

              const isPrimary = index % 4 === 0;
              const isWarm = index % 4 === 1;

              return (
                <Link
                  key={catId}
                  to={`/shop?category=${slug}`}
                  className={`
                    group relative flex flex-col justify-between overflow-hidden rounded-[1.5rem]
                    border p-6 transition-all duration-300
                    hover:-translate-y-1.5
                    hover:shadow-[0_18px_40px_rgba(37,50,64,.09)]
                    ${
                      isPrimary
                        ? "border-primary bg-primary text-white"
                        : isWarm
                          ? "border-[#ead5b7] bg-[#f1dfc7]"
                          : "border-border bg-card"
                    }
                  `}
                >
                  {/* Decorative ambient circle */}
                  <div
                    className={`
                      pointer-events-none absolute -right-8 -top-8
                      size-28 rounded-full opacity-10 transition-transform
                      duration-500 group-hover:scale-125
                      ${isPrimary ? "bg-white" : "bg-primary"}
                    `}
                  />

                  <div>
                    {/* CATEGORY IMAGE CONTAINER */}
                    <div
                      className={`
                        relative size-14 shrink-0 overflow-hidden rounded-2xl border
                        transition-transform duration-300 group-hover:scale-105 shadow-xs
                        ${
                          isPrimary
                            ? "border-white/20 bg-white/10"
                            : isWarm
                              ? "border-[#e0c49f] bg-white/50"
                              : "border-border bg-secondary"
                        }
                      `}
                    >
                      {catImage && !isImageBroken ? (
                        <img
                          src={catImage}
                          alt={category.name}
                          onError={() =>
                            setBrokenImages((prev) => ({
                              ...prev,
                              [catId]: true,
                            }))
                          }
                          className="size-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      ) : (
                        <div
                          className={`
                            grid size-full place-items-center text-xl font-black uppercase
                            ${
                              isPrimary
                                ? "text-white"
                                : isWarm
                                  ? "text-slate-800"
                                  : "text-primary"
                            }
                          `}
                        >
                          {firstLetter}
                        </div>
                      )}
                    </div>

                    {/* Category Name */}
                    <h2
                      className={`
                        display relative mt-5 text-xl font-extrabold truncate
                        ${isPrimary ? "text-white" : "text-foreground"}
                      `}
                    >
                      {category.name}
                    </h2>

                    {/* Description */}
                    <p
                      className={`
                        relative mt-1 text-sm leading-5 line-clamp-2
                        ${isPrimary ? "text-white/65" : "text-muted-foreground"}
                      `}
                    >
                      {category.description || "Explore quality products"}
                    </p>
                  </div>

                  {/* Card Bottom */}
                  <div className="relative mt-6 flex items-center justify-between border-t border-black/5 pt-4">
                    <p
                      className={`
                        mono text-[10px] font-bold uppercase tracking-wider
                        ${isPrimary ? "text-white/70" : "text-muted-foreground"}
                      `}
                    >
                      {category.productsCount ?? category.products ?? 0}{" "}
                      products
                    </p>

                    <span
                      className={`
                        inline-flex items-center gap-1 text-xs font-bold transition-transform duration-200
                        group-hover:translate-x-1
                        ${isPrimary ? "text-white" : "text-primary"}
                      `}
                    >
                      Explore <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* BOTTOM CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] bg-slate-900 px-6 py-10 text-white sm:px-10 lg:px-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mono text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">
                Can't decide?
              </p>

              <h2 className="display mt-2 text-2xl font-extrabold sm:text-3xl">
                Browse everything in one place.
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-white/60">
                Explore products from all categories and compare options before
                making your choice.
              </p>
            </div>

            <Link
              to="/shop"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 hover:bg-white/90"
            >
              Explore all products <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default CategoriesPage;
