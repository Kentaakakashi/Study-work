import { useEffect, useMemo, useState } from "react";
import { Flame, Zap, Timer, Menu, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import {
  doc,
  onSnapshot,
  query,
  collection,
  where,
  limit,
  onSnapshot as onSnap2,
} from "firebase/firestore";
import { ensureStats, levelFromXp } from "@/lib/stats";

type StatsDoc = {
  streak?: number;
  xp?: number;
  level?: number;
};

interface TopbarProps {
  onMenuToggle?: () => void;
}

const Topbar = ({ onMenuToggle }: TopbarProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState<StatsDoc | null>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    let unsub = () => {};
    (async () => {
      await ensureStats(user.uid);
      unsub = onSnapshot(doc(db, "stats", user.uid), (snap) => {
        setStats((snap.data() as StatsDoc) || {});
      });
    })();
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "notifications"),
      where("toUid", "==", user.uid),
      where("read", "==", false),
      limit(50)
    );
    const unsub = onSnap2(q, (snap) => setUnread(snap.size), () => setUnread(0));
    return () => unsub();
  }, [user]);

  const streak = Number(stats?.streak || 0);
  const xp = Number(stats?.xp || 0);
  const computed = levelFromXp(xp);
  const level = Number(stats?.level || computed.level);

  const avatarLetter = useMemo(() => {
    const src = user?.displayName || user?.email || "S";
    return (src[0] || "S").toUpperCase();
  }, [user]);

  return (
    <header className="sticky top-0 z-30 w-full glass-card border-b border-border/30 px-4 md:px-6 py-3">
      <div className="flex items-center justify-between">
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-lg hover:bg-secondary/50 transition-colors"
        >
          <Menu className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="md:hidden flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <span className="font-bold text-gradient">Study Zone</span>
        </div>

        <div className="hidden md:block" />

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/notifications")}
            className="relative p-2 rounded-xl bg-secondary/30 border border-border/40 hover:bg-secondary/40 transition"
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[11px] flex items-center justify-center">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50">
            <Flame className="w-4 h-4 streak-glow" />
            <span className="text-sm font-semibold streak-glow">{streak}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Lvl {level}</span>
            <span className="text-xs text-muted-foreground">{xp.toLocaleString()} XP</span>
          </div>

          <Button
            onClick={() => navigate("/focus/pomodoro")}
            className="glow-button gap-2 text-sm h-9 px-4"
            size="sm"
          >
            <Timer className="w-4 h-4" />
            <span className="hidden sm:inline">Start Focus</span>
          </Button>

          <button
            onClick={() => navigate("/settings")}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-primary-foreground ring-2 ring-primary/20 hover:ring-primary/50 transition-all"
          >
            {avatarLetter}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
