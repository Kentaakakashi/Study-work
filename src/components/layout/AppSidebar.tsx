import { NavLink } from "react-router-dom";
import {
  Home,
  Flame,
  Calendar,
  Users,
  Trophy,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  collapsed?: boolean;
}

const nav = [
  { icon: Home, label: "Home", href: "/home" },
  { icon: Flame, label: "Focus", href: "/focus" },
  { icon: Calendar, label: "Planner", href: "/planner" },
  { icon: Users, label: "Community", href: "/community" },
  { icon: Trophy, label: "Leaderboard", href: "/leaderboard" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export default function AppSidebar({ collapsed = false }: Props) {
  return (
    <aside
      className={cn(
        "h-full border-r bg-background transition-all duration-300 shrink-0",
        collapsed ? "w-[64px]" : "w-[240px]"
      )}
    >
      <div className="flex h-full flex-col gap-2 pt-4">
        {nav.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "mx-2 flex items-center gap-3 rounded-md px-4 py-2 transition",
                  "hover:bg-muted",
                  isActive && "bg-muted"
                )
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} className="shrink-0" />

              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
   }
