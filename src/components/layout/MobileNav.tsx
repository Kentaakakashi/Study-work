import { NavLink, useLocation } from "react-router-dom";
import { Home, Timer, Users, BarChart3, Bot } from "lucide-react";

const navItems = [
  { title: "Home", path: "/home", icon: Home },
  { title: "Focus", path: "/focus/pomodoro", icon: Timer },
  { title: "Community", path: "/community", icon: Users },
  { title: "Stats", path: "/stats", icon: BarChart3 },
  { title: "AI", path: "/ai", icon: Bot },
];

const MobileNav = () => {
  const location = useLocation();
  const isActive = (path: string) => {
    if (path === "/focus/pomodoro") return location.pathname.startsWith("/focus");
    return location.pathname === path;
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border/30">
      <div className="flex items-center justify-around py-2 px-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-200 min-w-[56px]"
          >
            <div className="relative">
              <item.icon
                className={`w-5 h-5 transition-all duration-200 ${
                  isActive(item.path) ? "text-primary scale-110" : "text-muted-foreground"
                }`}
              />
              {isActive(item.path) && (
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.6)]" />
              )}
            </div>
            <span className={`text-[10px] font-medium ${isActive(item.path) ? "text-primary" : "text-muted-foreground"}`}>
              {item.title}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;
