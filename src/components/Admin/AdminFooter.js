import React from "react";

const AdminFooter = () => {
  return (
    <footer className="border-t border-slate-200 bg-white px-5 py-4">
      <div className="flex flex-col items-center justify-between gap-2 text-[11px] text-slate-400 sm:flex-row">
        <p>© {new Date().getFullYear()} SmartCommerce. All rights reserved.</p>

        <div className="flex items-center gap-4">
          <span>Admin Console</span>

          <span className="h-1 w-1 rounded-full bg-slate-300" />

          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            System Operational
          </span>
        </div>
      </div>
    </footer>
  );
};

export default AdminFooter;
