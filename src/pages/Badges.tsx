import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Award, Crown, Flame, Medal, Sparkles, Target, Timer, Trophy, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { BADGES, BadgeId, BadgeIconKey } from "@/lib/badges";
import { ensureStats } from "@/lib/stats";

type StatsDoc = { badges?: string[] };

const ICONS: Record<BadgeIconKey, (props: any) => JSX.Element> = {
  sparkles: Sparkles,
  timer: Timer,
  trophy: Trophy,
  medal: Medal,
  flame: Flame,
  zap: Zap,
  crown: Crown,
  target: Target,
};

export default function Badges() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatsDoc | null>(null);

  useEffect(() => {
    if (!user) return;
    let unsub = () => {};
    (async () => {
      await ensureStats(user.uid);
      unsub = onSnapshot(doc(db, "stats", user.uid), (snap) => setStats((snap.data() as StatsDoc) || {}));
    })();
    return () => unsub();
  }, [user]);

  const owned = useMemo(() => new Set((stats?.badges || []) as BadgeId[]), [stats]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-3xl">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">Badges</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Unlock them by studying, streaking, and leveling.</p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {BADGES.map((b, i) => {
          const ok = owned.has(b.id);
          const Icon = ICONS[b.icon] || Award;

          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(0.2, i * 0.03) }}
              className={`p-5 rounded-3xl border glass-card-hover ${ok ? "border-primary/25" : "border-border/40 opacity-75"}`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${
                    ok ? "bg-primary/15 border-primary/25" : "bg-secondary/20 border-border/40"
                  }`}
                >
                  <Icon className={`w-6 h-6 ${ok ? "text-primary" : "text-muted-foreground"}`} />
                </div>

                <div className="min-w-0">
                  <p className="font-semibold truncate">{b.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{b.desc}</p>
                </div>
              </div>

              <p className="text-xs mt-4">
                {ok ? <span className="text-primary font-semibold">Unlocked ✅</span> : <span className="text-muted-foreground">Locked</span>}
              </p>
            </motion.div>
          );
        })}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted-foreground">
        No emojis on badges. More badges too. You're welcome.
      </motion.div>
    </div>
  );
}
