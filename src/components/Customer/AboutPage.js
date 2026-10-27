import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Store,
  ShieldCheck,
  Users,
  ShoppingBag,
  BarChart3,
  Heart,
  GitCompare,
  Truck,
  CheckCircle2,
  Sparkles,
  Globe2,
  Handshake,
  PackageCheck,
} from "lucide-react";

const AboutPage = () => {
  const features = [
    {
      icon: Store,
      title: "Multi-vendor marketplace",
      description:
        "Discover products from independent vendors, all within one connected shopping experience.",
    },
    {
      icon: GitCompare,
      title: "Smart comparison",
      description:
        "Compare products side by side so customers can make informed purchasing decisions.",
    },
    {
      icon: ShieldCheck,
      title: "Trusted shopping",
      description:
        "Verified vendors, transparent product information and secure checkout create a safer experience.",
    },
    {
      icon: Truck,
      title: "Reliable delivery",
      description:
        "Bring products from different vendors together with a smooth and transparent order journey.",
    },
  ];

  const values = [
    {
      icon: Users,
      title: "Customer first",
      description:
        "Every part of SmartCommerce is designed around making product discovery and purchasing easier.",
    },
    {
      icon: Handshake,
      title: "Vendor success",
      description:
        "We give independent sellers the tools and visibility they need to grow their businesses.",
    },
    {
      icon: BarChart3,
      title: "Data-driven decisions",
      description:
        "Useful product information, ratings and comparisons help customers shop with confidence.",
    },
    {
      icon: Globe2,
      title: "One connected marketplace",
      description:
        "Customers, vendors and administrators work together through one scalable digital platform.",
    },
  ];

  const stats = [
    { value: "8+", label: "Product categories" },
    { value: "50+", label: "Independent vendors" },
    { value: "1K+", label: "Products available" },
    { value: "24/7", label: "Digital marketplace" },
  ];

  return (
    <main className="min-h-screen bg-background">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
            {/* LEFT */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5">
                <Sparkles size={13} className="text-primary" />

                <span className="mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                  About SmartCommerce
                </span>
              </div>

              <h1 className="display mt-6 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                A better way to discover, compare and shop.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                SmartCommerce is a multi-vendor digital marketplace designed to
                connect customers with independent sellers through a simple,
                transparent and intelligent shopping experience.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/shop"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
                >
                  Explore products
                  <ArrowRight size={16} />
                </Link>

                <Link
                  to="/vendors"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3.5 text-sm font-bold transition hover:border-primary hover:text-primary"
                >
                  Meet our vendors
                  <Store size={16} />
                </Link>
              </div>
            </div>

            {/* RIGHT VISUAL */}
            <div className="relative">
              <div className="rounded-[2rem] bg-gradient-to-br from-teal-950 via-teal-800 to-amber-500 p-1 shadow-xl">
                <div className="rounded-[1.85rem] bg-[#203b42] p-7 text-white sm:p-9">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="mono text-[10px] uppercase tracking-[0.2em] text-white/50">
                        The SmartCommerce idea
                      </p>

                      <h2 className="display mt-2 text-2xl font-extrabold">
                        Many sellers.
                        <br />
                        One experience.
                      </h2>
                    </div>

                    <div className="grid size-12 place-items-center rounded-2xl bg-white/10">
                      <ShoppingBag size={22} />
                    </div>
                  </div>

                  <div className="mt-8 space-y-3">
                    <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3">
                      <div className="grid size-9 place-items-center rounded-lg bg-white/10">
                        <Users size={17} />
                      </div>

                      <div>
                        <p className="text-sm font-bold">Customers</p>

                        <p className="text-xs text-white/50">
                          Discover and compare
                        </p>
                      </div>

                      <CheckCircle2
                        size={16}
                        className="ml-auto text-teal-300"
                      />
                    </div>

                    <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3">
                      <div className="grid size-9 place-items-center rounded-lg bg-white/10">
                        <Store size={17} />
                      </div>

                      <div>
                        <p className="text-sm font-bold">Vendors</p>

                        <p className="text-xs text-white/50">Sell and grow</p>
                      </div>

                      <CheckCircle2
                        size={16}
                        className="ml-auto text-teal-300"
                      />
                    </div>

                    <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3">
                      <div className="grid size-9 place-items-center rounded-lg bg-white/10">
                        <ShieldCheck size={17} />
                      </div>

                      <div>
                        <p className="text-sm font-bold">SmartCommerce</p>

                        <p className="text-xs text-white/50">
                          Connect and manage
                        </p>
                      </div>

                      <CheckCircle2
                        size={16}
                        className="ml-auto text-teal-300"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-border sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="px-4 py-7 text-center sm:px-6">
              <p className="display text-2xl font-extrabold sm:text-3xl">
                {stat.value}
              </p>

              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* STORY */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              Why SmartCommerce
            </p>

            <h2 className="display mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Shopping should feel simple, even when the marketplace is complex.
            </h2>

            <p className="mt-5 text-sm leading-7 text-muted-foreground">
              Traditional online shopping often makes customers jump between
              sellers, websites and product pages. SmartCommerce brings multiple
              independent vendors into one digital marketplace.
            </p>

            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Customers can browse products, compare alternatives, save
              favorites, add products to their cart and complete checkout
              through one consistent experience.
            </p>

            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Behind the scenes, vendors receive their own marketplace workspace
              while administrators manage products, customers, orders, vendors,
              payments and platform operations.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">
                <ShoppingBag size={19} />
              </div>

              <h3 className="mt-5 font-bold">One shopping journey</h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Discover products from different vendors without leaving the
                marketplace.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 sm:translate-y-6">
              <div className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">
                <GitCompare size={19} />
              </div>

              <h3 className="mt-5 font-bold">Better decisions</h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Product comparison makes it easier to understand differences
                before buying.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">
                <Store size={19} />
              </div>

              <h3 className="mt-5 font-bold">Independent sellers</h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Give vendors a digital storefront where they can showcase their
                products.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 sm:translate-y-6">
              <div className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">
                <ShieldCheck size={19} />
              </div>

              <h3 className="mt-5 font-bold">Built around trust</h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Verified vendors, transparent information and secure
                transactions create confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <p className="mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              What makes us different
            </p>

            <h2 className="display mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Designed for the complete marketplace journey.
            </h2>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              SmartCommerce connects the customer experience, vendor experience
              and marketplace management into one platform.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">
                    <Icon size={19} />
                  </div>

                  <h3 className="mt-5 font-bold">{feature.title}</h3>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="text-center">
          <p className="mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            How SmartCommerce works
          </p>

          <h2 className="display mt-3 text-3xl font-extrabold sm:text-4xl">
            Three sides. One connected marketplace.
          </h2>
        </div>

        <div className="relative mt-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-7">
            <span className="mono text-xs font-bold text-primary">01</span>

            <div className="mt-5 grid size-12 place-items-center rounded-xl bg-secondary text-primary">
              <Users size={20} />
            </div>

            <h3 className="display mt-5 text-xl font-bold">
              Customers discover
            </h3>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Browse categories, explore vendors, compare products and add the
              right products to your cart.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-7">
            <span className="mono text-xs font-bold text-primary">02</span>

            <div className="mt-5 grid size-12 place-items-center rounded-xl bg-secondary text-primary">
              <Store size={20} />
            </div>

            <h3 className="display mt-5 text-xl font-bold">Vendors grow</h3>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Independent sellers manage their catalog, inventory and orders
              through their vendor workspace.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-7">
            <span className="mono text-xs font-bold text-primary">03</span>

            <div className="mt-5 grid size-12 place-items-center rounded-xl bg-secondary text-primary">
              <PackageCheck size={20} />
            </div>

            <h3 className="display mt-5 text-xl font-bold">
              Orders come together
            </h3>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              SmartCommerce coordinates checkout, orders, delivery, payments and
              marketplace operations.
            </p>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <p className="mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                Our principles
              </p>

              <h2 className="display mt-3 text-3xl font-extrabold sm:text-4xl">
                Built with people on both sides of the marketplace.
              </h2>

              <p className="mt-5 text-sm leading-7 text-muted-foreground">
                A successful marketplace needs to create value for customers,
                vendors and the platform itself. SmartCommerce is designed
                around that balance.
              </p>

              <Link
                to="/vendors"
                className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
              >
                Explore our vendors
                <ArrowRight size={15} />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {values.map((value) => {
                const Icon = value.icon;

                return (
                  <div
                    key={value.title}
                    className="rounded-2xl border border-border p-6"
                  >
                    <div className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
                      <Icon size={18} />
                    </div>

                    <h3 className="mt-4 font-bold">{value.title}</h3>

                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {value.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="overflow-hidden rounded-[2rem] bg-[#203b42] p-8 text-white sm:p-10 lg:p-14">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="mono text-[10px] uppercase tracking-[0.2em] text-white/50">
                Your next discovery
              </p>

              <h2 className="display mt-3 max-w-2xl text-3xl font-extrabold sm:text-4xl">
                Find something worth bringing home.
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-6 text-white/60">
                Explore products from independent vendors and experience
                shopping through the SmartCommerce marketplace.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                to="/shop"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3.5 text-sm font-bold text-slate-900 transition hover:opacity-90"
              >
                Start shopping
                <ArrowRight size={16} />
              </Link>

              <Link
                to="/vendors"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Meet vendors
                <Store size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AboutPage;
