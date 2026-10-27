import React, { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";

import VendorHeader from "./VendorHeader";
import VendorSidebar from "./VendorSidebar";
import VendorFooter from "./VendorFooter";

const VendorLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* SIDEBAR */}
      <VendorSidebar
        sidebarOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* MAIN AREA */}
      <div className="lg:ml-64 min-h-screen flex flex-col">
        {/* HEADER */}
        <VendorHeader onToggleSidebar={() => setSidebarOpen(true)} />

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>

        {/* FOOTER */}
        <VendorFooter />
      </div>
    </div>
  );
};

export default VendorLayout;
