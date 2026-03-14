              "use client";

import { useState } from "react";
import AppSidebar from "./AppSidebar";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

export default function AppLayout({ children }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <AppSidebar collapsed={collapsed} />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-3 border-b px-4 h-12 shrink-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-md hover:bg-muted transition"
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
