import React, { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";

import AdminSidebar from "./AdminSidebar";
import AdminNavbar from "./AdminNavbar";
import AdminFooter from "./AdminFooter";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* SIDEBAR */}
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* MAIN AREA */}
      <div className="lg:ml-64">
        {/* NAVBAR */}
        <AdminNavbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

        {/* CONTENT */}
        <main className="min-h-[calc(100vh-64px)]">
          <div className="p-4 sm:p-5 lg:p-6">
            <Outlet />
          </div>

          <AdminFooter />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
