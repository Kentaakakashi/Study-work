import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Timer,
  CalendarDays,
  Users,
  UserPlus,
  BarChart3,
  Bot,
  Settings,
  Zap,
  Bell,
  Award,
  Trophy,
  LifeBuoy,
  Shield,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { isOwnerUid } from "@/lib/roles";

type NavItem = {
  title: string;
  path: string;
  icon: any;
  ownerOnly?: boolean;
};

type AppSidebarProps = {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
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
  { title: "Notifications", path: "/notifications", icon: Bell },
  { title: "AI Tutor", path: "/ai", icon: Bot },

  // ✅ Support for everyone
  { title: "Support", path: "/support", icon: LifeBuoy },

  // ✅ Admin for owners only
  { title: "Admin", path: "/admin", icon: Shield, ownerOnly: true },

  { title: "Settings", path: "/settings", icon: Settings },
];

const AppSidebar = ({
  collapsed = false,
  onToggleCollapse,
}: AppSidebarProps) => {
  const location = useLocation();
  const { user, profile } = useAuth();

  const isOwner = profile?.role === "owner" || isOwnerUid(user?.uid);

  const isActive = (path: string) => {
    if (path === "/focus/pomodoro") return location.pathname.startsWith("/focus");
    if (path === "/community") return location.pathname.startsWith("/community");
    if (path === "/support") return location.pathname.startsWith("/support");
    if (path === "/admin") return location.pathname.startsWith("/admin");
    return location.pathname === path;
  };

  const visibleItems = navItems.filter((i) => !i.ownerOnly || isOwner);

  return (
    <aside
      className={`hidden md:flex flex-col h-screen glass-card border-r border-border/50 sticky top-0 z-40 transition-[width] duration-300 ${
        collapsed ? "w-[88px]" : "w-64"
      }`}
    >
      <div
        className={`flex items-center border-b border-border/30 transition-all duration-300 ${
          collapsed ? "justify-center px-3 py-5" : "justify-between gap-3 px-6 py-5"
        }`}
      >
        <div
          className={`flex items-center transition-all duration-300 ${
            collapsed ? "justify-center" : "gap-3"
          }`}
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center glow-button p-0 shrink-0">
            <Zap className="w-5 h-5" />
          </div>

          {!collapsed && (
            <span className="text-lg font-bold tracking-tight text-gradient whitespace-nowrap">
              Study Zen
            </span>
          )}
        </div>

        {!collapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="h-9 w-9 rounded-lg border border-border/40 bg-background/40 hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all duration-200 flex items-center justify-center"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}

        {collapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="absolute top-5 right-3 h-7 w-7 rounded-md border border-border/40 bg-background/40 hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all duration-200 flex items-center justify-center"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}
      </div>

      <nav
        className={`flex-1 py-4 overflow-y-auto transition-all duration-300 ${
          collapsed ? "px-2 space-y-2" : "px-3 space-y-1"
        }`}
      >
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={collapsed ? item.title : undefined}
            className={() =>
              `flex items-center text-sm font-medium transition-all duration-200 group relative ${
                collapsed
                  ? "justify-center px-3 py-3 rounded-xl"
                  : "gap-3 px-4 py-2.5 rounded-lg"
              } ${
                isActive(item.path)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`
            }
          >
            {isActive(item.path) && !collapsed && (
              <div className="absolute left-0 w-0.5 h-6 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
            )}

            <item.icon
              className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                isActive(item.path) ? "text-primary" : ""
              }`}
            />

            {!collapsed && (
              <span className="flex items-center gap-2 min-w-0">
                <span className="truncate">{item.title}</span>
                {item.ownerOnly && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 border border-primary/25 text-primary whitespace-nowrap">
                    OWNER
                  </span>
                )}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-border/30">
        <div
          className={`glass-card rounded-lg transition-all duration-300 ${
            collapsed ? "p-2 text-center" : "p-3 text-center"
          }`}
        >
          {collapsed ? (
            <p className="text-[10px] text-muted-foreground">SZ</p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">Study Zen</p>
              <p className="text-xs text-muted-foreground mt-0.5">Focus • Plan • Grow</p>
            </>
          )}
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
