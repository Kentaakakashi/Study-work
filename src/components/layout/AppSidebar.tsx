"use client";

import Link from "next/link";
import { Home, Flame, Calendar, Users, Trophy, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  collapsed?: boolean;
}

const nav = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Flame, label: "Focus", href: "/focus" },
  { icon: Calendar, label: "Planner", href: "/planner" },
  { icon: Users, label: "Community", href: "/community" },
  { icon: Trophy, label: "Leaderboard", href: "/leaderboard" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export default function AppSidebar({ collapsed }: Props) {
  return (
    <aside
      className={cn(
        "h-full border-r bg-background transition-all duration-300",
        collapsed ? "w-[64px]" : "w-[240px]"
      )}
    >
      <div className="flex flex-col h-full pt-4 gap-2">
        {nav.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2 hover:bg-muted transition rounded-md mx-2"
            >
              <Icon size={18} />

              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
