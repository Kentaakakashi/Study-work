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
  LifeBuoy,
  Shield,
  Bell,
  Trophy,
  Award,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { isOwnerUid } from "@/lib/roles";

type NavItem = {
  title: string;
  path: string;
  icon: any;
  ownerOnly?: boolean;
};

const navItems: NavItem[] = [
  { title: "Home", path: "/home", icon: Home },
  { title: "Focus", path: "/focus/pomodoro", icon: Timer },
  { title: "Planner", path: "/planner", icon: CalendarDays },
  { title: "Community", path: "/community", icon: Users },
  { title: "Friends", path: "/friends", icon: UserPlus },
  { title: "Stats", path: "/stats", icon: BarChart3 },
  { title: "Leaderboard", path: "/leaderboard", icon: Trophy },
  { title: "Badges", path: "/badges", icon: Award },
  { title: "Notifs", path: "/notifications", icon: Bell },
  { title: "AI Tutor", path: "/ai", icon: Bot },

  { title: "Support", path: "/support", icon: LifeBuoy },
  { title: "Admin", path: "/admin", icon: Shield, ownerOnly: true },

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
  const { user, profile } = useAuth();

  const isOwner = (profile?.role === "owner") || isOwnerUid(user?.uid);

  const visibleItems = navItems.filter((i) => !i.ownerOnly || isOwner);

  const isActive = (path: string) => {
    if (path === "/focus/pomodoro") return location.pathname.startsWith("/focus");
    if (path === "/community") return location.pathname.startsWith("/community");
    if (path === "/support") return location.pathname.startsWith("/support");
    if (path === "/admin") return location.pathname.startsWith("/admin");
    return location.pathname === path;
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed left-0 top-0 bottom-0 w-72 glass-card border-r border-border/50 z-[60] p-4"
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center glow-button p-0">
                  <Zap className="w-5 h-5" />
                </div>
                <span className="text-lg font-bold tracking-tight text-gradient">Study Zen</span>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-secondary/50 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="space-y-1">
              {visibleItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={() =>
                    `flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive(item.path)
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    }`
                  }
                >
                  <span className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    <span>{item.title}</span>
                  </span>

                  {item.ownerOnly && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 border border-primary/25 text-primary">
                      OWNER
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
