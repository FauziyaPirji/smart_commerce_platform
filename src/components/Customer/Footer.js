import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="mt-20 border-t border-border bg-[#203b42] text-white">
      <div className="mx-auto max-w-7xl px-4 py-14">
        {/* Main Footer Content */}
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <span className="display text-xl font-extrabold">
                SmartCommerce
              </span>
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-6 text-white/70">
              A considered marketplace for better choices, trusted makers, and
              the joy of finding exactly what fits.
            </p>

            <p className="mono mt-5 text-xs text-white/50">
              Built for Bharat · 2026
            </p>
          </div>

          {/* Discover */}
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Discover
            </h3>

            <div className="flex flex-col gap-3">
              <Link
                to="/shop"
                className="text-sm text-white/70 hover:text-white"
              >
                All products
              </Link>

              <Link
                to="/categories"
                className="text-sm text-white/70 hover:text-white"
              >
                Categories
              </Link>

              <Link
                to="/vendors"
                className="text-sm text-white/70 hover:text-white"
              >
                Independent stores
              </Link>

              <Link
                to="/compare"
                className="text-sm text-white/70 hover:text-white"
              >
                Compare products
              </Link>
            </div>
          </div>

          {/* Your Space */}
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Your space
            </h3>

            <div className="flex flex-col gap-3">
              <Link
                to="/wishlist"
                className="text-sm text-white/70 hover:text-white"
              >
                Wishlist
              </Link>

              <Link
                to="/contact"
                className="text-sm text-white/70 hover:text-white"
              >
                Help centre
              </Link>
            </div>
          </div>

          {/* For Businesses */}
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              For businesses
            </h3>

            <div className="flex flex-col gap-3">
              <Link
                to="/vendor/login"
                className="text-sm text-white/70 hover:text-white"
              >
                Sell on SmartCommerce
              </Link>

              <Link
                to="/about"
                className="text-sm text-white/70 hover:text-white"
              >
                About us
              </Link>

              <a
                href="mailto:support@smartcommerce.in"
                className="text-sm text-white/70 hover:text-white"
              >
                support@smartcommerce.in
              </a>

              <p className="text-sm text-white/50">Mon–Sat, 9am–7pm IST</p>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 SmartCommerce. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
