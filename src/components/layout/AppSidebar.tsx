import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import AppSidebar from "./AppSidebar";
import Topbar from "./Topbar";
import MobileNav from "./MobileNav";
import BackgroundBlobs from "./BackgroundBlobs";
import MobileSidebar from "./MobileSidebar";
import { useTheme } from "@/theme/ThemeProvider";

const SIDEBAR_STORAGE_KEY = "studyzen:sidebar-collapsed";

const AppLayout = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const { theme } = useTheme();

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarCollapsed));
    } catch {
      //
    }
  }, [sidebarCollapsed]);

  // Higher motionSpeed = faster UI -> shorter durations
  const base = 0.25;
  const duration = Math.max(0.14, Math.min(0.45, base / (theme.motionSpeed || 1)));

  return (
    <div className="min-h-screen flex w-full relative">
      <BackgroundBlobs />

      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
      />

      {/* ✅ Mobile drawer */}
      <MobileSidebar open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <Topbar onMenuToggle={() => setMobileMenuOpen((v) => !v)} />

        <main className="app-main flex-1 pb-20 md:pb-6 overflow-x-hidden min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration, ease: "easeOut" }}
              onClick={() => setMobileMenuOpen(false)}
              className="min-w-0"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        <MobileNav />
      </div>
    </div>
  );
};

export default AppLayout;
