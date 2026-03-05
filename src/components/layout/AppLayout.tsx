import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import AppSidebar from "./AppSidebar";
import Topbar from "./Topbar";
import MobileNav from "./MobileNav";
import BackgroundBlobs from "./BackgroundBlobs";
import MobileSidebar from "./MobileSidebar";
import { useTheme } from "@/theme/ThemeProvider";

const AppLayout = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme } = useTheme();

  // Higher motionSpeed = faster UI -> shorter durations
  const base = 0.25;
  const duration = Math.max(0.14, Math.min(0.45, base / (theme.motionSpeed || 1)));

  return (
    <div className="min-h-screen flex w-full relative">
      <BackgroundBlobs />
      <AppSidebar />

      {/* ✅ Mobile drawer */}
      <MobileSidebar open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen">
        <Topbar onMenuToggle={() => setMobileMenuOpen((v) => !v)} />

        <main className="app-main flex-1 pb-20 md:pb-6 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration, ease: "easeOut" }}
              onClick={() => setMobileMenuOpen(false)}
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
