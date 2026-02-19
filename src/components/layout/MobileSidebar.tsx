import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Timer,
  CalendarDays,
  Users,
  UserPlus,
  BarChart3,
  Bot,
  Settings,
  X,
  Zap,
} from "lucide-react";

const navItems = [
  { title: "Home", path: "/home", icon: Home },
  { title: "Focus", path: "/focus/pomodoro", icon: Timer },
  { title: "Planner", path: "/planner", icon: CalendarDays },
  { title: "Community", path: "/community", icon: Users },
  { title: "Friends", path: "/friends", icon: UserPlus },
  { title: "Stats", path: "/stats", icon: BarChart3 },
  { title: "AI Tutor", path: "/ai", icon: Bot },
  { title: "Settings", path: "/settings", icon: Settings },
];

export default function MobileSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/focus/pomodoro") return location.pathname.startsWith("/focus");
    return location.pathname === path;
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.button
            aria-label="Close menu overlay"
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.aside
            className="fixed left-0 top-0 bottom-0 z-50 w-72 md:hidden glass-card border-r border-border/50"
            initial={{ x: -320, opacity: 0.6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0.6 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center glow-button p-0">
                  <Zap className="w-5 h-5" />
                </div>
                <span className="text-lg font-bold tracking-tight text-gradient">
                  Study Zone
                </span>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Nav */}
            <nav className="px-3 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={() =>
                    `relative flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                      isActive(item.path)
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    }`
                  }
                >
                  {isActive(item.path) && (
                    <div className="absolute left-0 w-0.5 h-6 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
                  )}
                  <item.icon
                    className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                      isActive(item.path) ? "text-primary" : ""
                    }`}
                  />
                  <span>{item.title}</span>
                </NavLink>
              ))}
            </nav>

            {/* Footer */}
            <div className="px-4 py-4 border-t border-border/30">
              <div className="glass-card p-3 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Study Zone v1.0</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your study community
                </p>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
