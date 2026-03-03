import { NavLink, useLocation } from "react-router-dom";
import { Home, Timer, Users, BarChart3, LifeBuoy, Shield } from "lucide-react";
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
  { title: "Community", path: "/community", icon: Users },
  { title: "Stats", path: "/stats", icon: BarChart3 },
  { title: "Support", path: "/support", icon: LifeBuoy },
  { title: "Admin", path: "/admin", icon: Shield, ownerOnly: true },
];

const MobileNav = () => {
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border/30">
      <div className="flex items-center justify-around py-2 px-1">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={() =>
              `flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all duration-200 ${
                isActive(item.path)
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[11px]">{item.title}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;
