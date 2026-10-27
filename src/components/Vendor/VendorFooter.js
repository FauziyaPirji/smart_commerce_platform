import React from "react";
import { Link } from "react-router-dom";
import { HelpCircle, ShieldCheck } from "lucide-react";

const VendorFooter = () => {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* LEFT */}
          <div>
            <p className="text-sm font-semibold text-slate-800">
              SmartCommerce Vendor Panel
            </p>

            <p className="text-xs text-slate-500 mt-1">
              Manage your store, products, orders and earnings.
            </p>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-4">
            <Link
              to="/vendor/profile"
              className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-900"
            >
              <ShieldCheck size={15} />
              Account
            </Link>

            <button className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-900">
              <HelpCircle size={15} />
              Help & Support
            </button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400">
          © 2026 SmartCommerce. Vendor Portal.
        </div>
      </div>
    </footer>
  );
};

export default VendorFooter;
