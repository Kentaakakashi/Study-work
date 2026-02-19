import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { ymd } from "@/lib/stats";

type StatsRow = {
  id: string;
  uid?: string;
  xp?: number;
  level?: number;
  totalMinutes?: number;
  today?: Record<string, number>;
};

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function last7Total(todayMap: Record<string, number> | undefined) {
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const key = ymd(addDays(new Date(), -i));
    sum += Number(todayMap?.[key] || 0);
  }
  return sum;
}

export default function Leaderboard() {
  const [rows, setRows] = useState<StatsRow[]>([]);
  const [tab, setTab] = useState<"global" | "weekly">("global");

  useEffect(() => {
    const q = query(collection(db, "stats"), orderBy("xp", "desc"), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      const out: StatsRow[] = [];
      snap.forEach((d) => out.push({ id: d.id, ...(d.data() as any) }));
      setRows(out);
    });
    return () => unsub();
  }, []);

  const view = useMemo(() => {
    if (tab === "global") return rows;

    // weekly = compute from last 7 keys
    const computed = rows
      .map((r) => ({ ...r, weeklyMinutes: last7Total(r.today) }))
      .sort((a: any, b: any) => (b.weeklyMinutes || 0) - (a.weeklyMinutes || 0));

    return computed as any[];
  }, [rows, tab]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-3xl">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">Leaderboard</h2>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => setTab("global")}
            className={`px-4 py-2 rounded-xl text-sm border transition ${
              tab === "global" ? "bg-primary/15 border-primary/25 text-primary" : "bg-secondary/15 border-border/40 text-muted-foreground"
            }`}
          >
            Global (XP)
          </button>
          <button
            onClick={() => setTab("weekly")}
            className={`px-4 py-2 rounded-xl text-sm border transition ${
              tab === "weekly" ? "bg-primary/15 border-primary/25 text-primary" : "bg-secondary/15 border-border/40 text-muted-foreground"
            }`}
          >
            Weekly (Minutes)
          </button>
        </div>
      </motion.div>

      <div className="space-y-2">
        {view.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data yet.</p>
        ) : (
          view.map((r: any, i: number) => (
            <div key={r.id} className="p-4 rounded-2xl border bg-secondary/15 border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary">
                  #{i + 1}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{r.id}</p>
                  <p className="text-xs text-muted-foreground">
                    Lvl {r.level || 1} • {Number(r.xp || 0).toLocaleString()} XP • {Number(r.totalMinutes || 0)} min total
                  </p>
                </div>
              </div>

              {tab === "weekly" ? (
                <div className="text-sm font-semibold text-primary">{r.weeklyMinutes || 0} min</div>
              ) : (
                <div className="text-sm font-semibold text-primary">{Number(r.xp || 0).toLocaleString()} XP</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
