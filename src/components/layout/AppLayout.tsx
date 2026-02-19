import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AppSidebar from "./AppSidebar";
import Topbar from "./Topbar";
import MobileNav from "./MobileNav";
import BackgroundBlobs from "./BackgroundBlobs";
import FocusEngine from "@/components/focus/FocusEngine";

const AppLayout = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex w-full relative">
      <BackgroundBlobs />
      <AppSidebar />

      {/* ✅ Keeps pomodoro saving even if you leave the page */}
      <FocusEngine />

      <div className="flex-1 flex flex-col min-h-screen">
        <Topbar />

        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
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
