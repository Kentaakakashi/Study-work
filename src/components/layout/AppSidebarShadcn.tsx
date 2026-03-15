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
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { isOwnerUid } from "@/lib/roles";

type NavItem = {
  title: string;
  path: string;
  icon: any;
  ownerOnly?: boolean;
};

type AppSidebarShadcnProps = {
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
  { title: "Support", path: "/support", icon: LifeBuoy },
  { title: "Admin", path: "/admin", icon: Shield, ownerOnly: true },
  { title: "Settings", path: "/settings", icon: Settings },
];

const AppSidebarShadcn = ({
  collapsed = false,
  onToggleCollapse,
}: AppSidebarShadcnProps) => {
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

  const primaryItems = visibleItems.filter(
    (item) => !["/support", "/admin", "/settings"].includes(item.path)
  );
  const secondaryItems = visibleItems.filter((item) =>
    ["/support", "/admin", "/settings"].includes(item.path)
  );

  const navClass = (active: boolean, collapsedMode: boolean) =>
    [
      "group relative flex items-center rounded-xl border transition-all duration-200",
      collapsedMode ? "justify-center h-11 w-11 mx-auto" : "gap-3 px-3 py-2.5",
      active
        ? "bg-primary/12 border-primary/25 text-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.08)]"
        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/60 hover:border-border/50",
    ].join(" ");

  return (
    <aside
      className={`hidden md:flex h-screen sticky top-0 z-40 transition-[width] duration-300 ${
        collapsed ? "w-[92px]" : "w-[290px]"
      }`}
    >
      <div className="w-full p-3">
        <div className="h-full rounded-[28px] border border-border/50 bg-background/75 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.22)] flex flex-col overflow-hidden">
          <div
            className={`relative border-b border-border/40 transition-all duration-300 ${
              collapsed ? "px-3 py-4" : "px-4 py-4"
            }`}
          >
            <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between gap-3"}`}>
              <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-primary/12 border border-primary/20 text-primary shrink-0">
                  <Zap className="w-5 h-5" />
                </div>

                {!collapsed && (
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
                      StudyZen
                    </p>
                    <p className="text-sm font-semibold tracking-tight truncate">
                      Sidebar Theme
                    </p>
                  </div>
                )}
              </div>

              {!collapsed && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="h-9 w-9 rounded-xl border border-border/50 bg-secondary/40 hover:bg-secondary/70 text-muted-foreground hover:text-foreground transition-all duration-200 flex items-center justify-center shrink-0"
                  aria-label="Collapse sidebar"
                  title="Collapse sidebar"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
              )}
            </div>

            {collapsed && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="absolute top-3 right-3 h-7 w-7 rounded-lg border border-border/50 bg-secondary/50 hover:bg-secondary/70 text-muted-foreground hover:text-foreground transition-all duration-200 flex items-center justify-center"
                aria-label="Expand sidebar"
                title="Expand sidebar"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-3">
            {!collapsed && (
              <div className="px-2 pb-2">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">
                  Navigation
                </p>
              </div>
            )}

            <nav className={`space-y-1.5 ${collapsed ? "pb-3" : "pb-4"}`}>
              {primaryItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={collapsed ? item.title : undefined}
                    className={navClass(active, collapsed)}
                  >
                    {active && !collapsed && (
                      <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary" />
                    )}

                    <item.icon
                      className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                        active ? "text-primary" : ""
                      }`}
                    />

                    {!collapsed && (
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="truncate text-sm font-medium">{item.title}</span>
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            <div className={`border-t border-border/40 ${collapsed ? "pt-3" : "pt-4"}`}>
              {!collapsed && (
                <div className="px-2 pb-2">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">
                    More
                  </p>
                </div>
              )}

              <nav className="space-y-1.5">
                {secondaryItems.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      title={collapsed ? item.title : undefined}
                      className={navClass(active, collapsed)}
                    >
                      {active && !collapsed && (
                        <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary" />
                      )}

                      <item.icon
                        className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                          active ? "text-primary" : ""
                        }`}
                      />

                      {!collapsed && (
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="truncate text-sm font-medium">{item.title}</span>
                          {item.ownerOnly && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 border border-primary/25 text-primary whitespace-nowrap">
                              OWNER
                            </span>
                          )}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          </div>

          <div className="border-t border-border/40 p-3">
            <div
              className={`rounded-2xl border border-border/50 bg-secondary/25 ${
                collapsed ? "p-2.5 text-center" : "p-3.5"
              }`}
            >
              {collapsed ? (
                <p className="text-[10px] text-muted-foreground font-medium">SZ</p>
              ) : (
                <>
                  <p className="text-xs font-semibold">Sidebar Theme Preview</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Only the sidebar is changed in this version.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebarShadcn;
