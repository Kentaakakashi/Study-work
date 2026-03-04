import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Clock, Flame } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { ensureStats, ymd } from "@/lib/stats";

type StatsDoc = {
  streak?: number;
  lastStudiedDate?: string;
  today?: Record<string, number>;
};

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function WeeklyBars({
  data,
}: {
  data: { day: string; mins: number }[];
}) {
  const [hover, setHover] = useState<{ day: string; mins: number } | null>(
    null
  );

  const max = useMemo(() => Math.max(30, ...data.map((d) => d.mins || 0)), [data]);

  return (
    <div className="h-full w-full flex flex-col">
      {/* Hover hint */}
      <div className="h-6 mb-2 text-xs text-muted-foreground flex items-center justify-between">
        <span>Minutes</span>
        <span className="text-primary">
          {hover ? `${hover.day}: ${hover.mins} min` : "Hover a bar"}
        </span>
      </div>

      {/* Bars */}
      <div className="flex-1 w-full flex items-end justify-between gap-2">
        {data.map((d) => {
          const pct = clamp((d.mins / max) * 100, 0, 100);

          return (
            <div
              key={d.day}
              className="flex-1 flex flex-col items-center gap-2"
              onMouseEnter={() => setHover(d)}
              onMouseLeave={() => setHover(null)}
              onTouchStart={() => setHover(d)}
            >
              <div className="w-full h-full flex items-end">
                <div
                  title={`${d.day}: ${d.mins} min`}
                  className="w-full rounded-xl bg-secondary/25 overflow-hidden border border-border/30"
                >
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${pct}%` }}
                    transition={{ duration: 0.35 }}
                    className="w-full bg-primary/80"
                    style={{ minHeight: d.mins > 0 ? 6 : 0 }}
                  />
                </div>
              </div>

              <div className="text-xs text-muted-foreground">{d.day}</div>
            </div>
          );
        })}
      </div>

      {/* Tiny legend */}
      <div className="mt-3 text-xs text-muted-foreground">
        Taller bars = more study time. Data comes from your timers.
      </div>
    </div>
  );
}

const Stats = () => {
  const { user } = useAuth();
  const [data, setData] = useState<StatsDoc | null>(null);

  useEffect(() => {
    if (!user) return;
    let unsub = () => {};
    (async () => {
      await ensureStats(user.uid);
      unsub = onSnapshot(doc(db, "stats", user.uid), (snap) => {
        setData((snap.data() as StatsDoc) || {});
      });
    })();
    return () => unsub();
  }, [user]);

  const todayKey = ymd();
  const todayMins =
    data?.today && data.today[todayKey] ? data.today[todayKey] : 0;
  const streak = data?.streak || 0;

  const weeklyData = useMemo(() => {
    const out: { day: string; mins: number }[] = [];
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 6; i >= 0; i--) {
      const d = ymd(addDays(new Date(), -i));
      const v = data?.today?.[d] || 0;
      const dt = addDays(new Date(), -i);
      out.push({ day: days[dt.getDay()], mins: v });
    }
    return out;
  }, [data]);

  const weekTotal = weeklyData.reduce((a, b) => a + (b.mins || 0), 0);

  const heatmap = useMemo(() => {
    // 91 days: oldest -> newest
    const vals: number[] = [];
    for (let i = 90; i >= 0; i--) {
      const d = ymd(addDays(new Date(), -i));
      const v = data?.today?.[d] || 0;
      vals.push(v);
    }
    return vals;
  }, [data]);

  const maxHeat = Math.max(60, ...heatmap);
  const level = (v: number) => {
    if (v <= 0) return 0;
    const pct = v / maxHeat;
    if (pct < 0.25) return 1;
    if (pct < 0.5) return 2;
    if (pct < 0.75) return 3;
    return 4;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          {
            icon: Clock,
            label: "Today",
            value: `${todayMins} min`,
            sub: "Tracked from timers",
          },
          {
            icon: BarChart3,
            label: "This Week",
            value: `${weekTotal} min`,
            sub: "Last 7 days",
          },
          {
            icon: Flame,
            label: "Streak",
            value: `${streak} days`,
            sub: "Keep it alive",
          },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card-hover p-4 rounded-2xl"
          >
            <s.icon className="w-5 h-5 text-primary mb-2" />
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-xs text-primary mt-1">{s.sub}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 rounded-3xl"
      >
        <h3 className="text-lg font-bold mb-4">Last 7 days</h3>
        <div className="h-64">
          {/* ✅ Replaces Recharts, keeps the same section + size */}
          <WeeklyBars data={weeklyData} />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 rounded-3xl"
      >
        <h3 className="text-lg font-bold mb-4">
          Consistency (last ~3 months)
        </h3>
        <div className="grid grid-cols-[repeat(13,minmax(0,1fr))] gap-1">
          {heatmap.map((v, i) => {
            const l = level(v);
            const cls =
              l === 0
                ? "bg-secondary/20"
                : l === 1
                ? "bg-primary/20"
                : l === 2
                ? "bg-primary/35"
                : l === 3
                ? "bg-primary/55"
                : "bg-primary/80";
            return (
              <div
                key={i}
                title={`${v} min`}
                className={`w-3 h-3 rounded-sm ${cls}`}
              />
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          More minutes = brighter squares. Data comes from Pomodoro + Stopwatch
          saves.
        </p>
      </motion.div>
    </div>
  );
};

export default Stats;
