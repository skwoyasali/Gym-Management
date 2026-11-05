import { useCallback, useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../common/Sidebar";
import Topbar from "../common/Topbar";

export default function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const closeMobileSidebar = useCallback(
    () => setMobileSidebarOpen(false),
    []
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((collapsed) => !collapsed)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={closeMobileSidebar}
      />
      <div className="min-w-0 flex-1">
        <Topbar onOpenSidebar={() => setMobileSidebarOpen(true)} />
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}