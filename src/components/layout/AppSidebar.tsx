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

const AppSidebar = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/focus/pomodoro") return location.pathname.startsWith("/focus");
    return location.pathname === path;
  };

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen glass-card border-r border-border/50 sticky top-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border/30">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center glow-button p-0">
          <Zap className="w-5 h-5" />
        </div>
        <span className="text-lg font-bold tracking-tight text-gradient">Study Zone</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={() =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive(item.path)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`
            }
          >
            {isActive(item.path) && (
              <div className="absolute left-0 w-0.5 h-6 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
            )}
            <item.icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive(item.path) ? "text-primary" : ""}`} />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-border/30">
        <div className="glass-card p-3 rounded-lg text-center">
          <p className="text-xs text-muted-foreground">Study Zone v1.0</p>
          <p className="text-xs text-muted-foreground mt-0.5">Your study community</p>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
