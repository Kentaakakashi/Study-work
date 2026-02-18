import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Clock, Flame } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
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
  const todayMins = (data?.today && data.today[todayKey]) ? data.today[todayKey] : 0;
  const streak = data?.streak || 0;

  const weeklyData = useMemo(() => {
    const out: { day: string; mins: number }[] = [];
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
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
          { icon: Clock, label: "Today", value: `${todayMins} min`, sub: "Tracked from timers" },
          { icon: BarChart3, label: "This Week", value: `${weekTotal} min`, sub: "Last 7 days" },
          { icon: Flame, label: "Streak", value: `${streak} days`, sub: "Keep it alive" },
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

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-3xl">
        <h3 className="text-lg font-bold mb-4">Last 7 days</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="mins" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-3xl">
        <h3 className="text-lg font-bold mb-4">Consistency (last ~3 months)</h3>
        <div className="grid grid-cols-[repeat(13,minmax(0,1fr))] gap-1">
          {heatmap.map((v, i) => {
            const l = level(v);
            const cls =
              l === 0 ? "bg-secondary/20" :
              l === 1 ? "bg-primary/20" :
              l === 2 ? "bg-primary/35" :
              l === 3 ? "bg-primary/55" : "bg-primary/80";
            return <div key={i} title={`${v} min`} className={`w-3 h-3 rounded-sm ${cls}`} />;
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          More minutes = brighter squares. Data comes from Pomodoro + Stopwatch saves.
        </p>
      </motion.div>
    </div>
  );
};

export default Stats;
