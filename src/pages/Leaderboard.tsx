import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, limit, onSnapshot, orderBy, query } from "firebase/firestore";

type StatRow = {
  uid: string;
  xp?: number;
  totalMinutes?: number;
  weeklyMinutes?: number;
  level?: number;
  displayName?: string;
  username?: string;
  photoURL?: string;
};

type Profile = {
  displayName?: string;
  username?: string;
  photoURL?: string;
  pfp?: string;
};

function dice(seed: string) {
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed || "user")}`;
}

async function enrich(rows: StatRow[]) {
  const out: StatRow[] = [];
  await Promise.all(
    rows.map(async (r) => {
      try {
        const ps = await getDoc(doc(db, "profiles", r.uid));
        const p = (ps.data() as Profile) || {};
        out.push({
          ...r,
          displayName: p.displayName || r.displayName,
          username: p.username || r.username,
          photoURL: p.pfp || p.photoURL || r.photoURL,
        });
      } catch {
        out.push(r);
      }
    })
  );

  out.sort((a, b) => rows.findIndex((x) => x.uid === a.uid) - rows.findIndex((x) => x.uid === b.uid));
  return out.filter((r) => !!r.uid);
}

export default function Leaderboard() {
  const [tab, setTab] = useState<"global" | "weekly">("global");
  const [rows, setRows] = useState<StatRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const q =
      tab === "global"
        ? query(collection(db, "stats"), orderBy("xp", "desc"), limit(25))
        : query(collection(db, "stats"), orderBy("weeklyMinutes", "desc"), limit(25));

    const unsub = onSnapshot(
      q,
      async (snap) => {
        const raw: StatRow[] = [];
        snap.forEach((d) => raw.push({ uid: d.id, ...(d.data() as any) }));

        const filled = await enrich(raw);
        setRows(filled);
        setLoading(false);
      },
      (err) => {
        toast(err?.message || "Couldn't load leaderboard");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [tab]);

  const list = useMemo(() => rows, [rows]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-3xl">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">Leaderboard</h3>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={() => setTab("global")}
            className={`px-4 py-2 rounded-2xl border text-sm ${
              tab === "global" ? "bg-primary/15 border-primary/30 text-primary" : "bg-secondary/10 border-border/40"
            }`}
          >
            Global (XP)
          </button>
          <button
            onClick={() => setTab("weekly")}
            className={`px-4 py-2 rounded-2xl border text-sm ${
              tab === "weekly" ? "bg-primary/15 border-primary/30 text-primary" : "bg-secondary/10 border-border/40"
            }`}
          >
            Weekly (Minutes)
          </button>
        </div>
      </motion.div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : list.length === 0 ? (
        <p className="text-sm text-muted-foreground">No leaderboard data yet.</p>
      ) : (
        <div className="space-y-3">
          {list.map((r, i) => {
            const name = r.displayName || (r.username ? `@${r.username}` : "User");
            const sub = r.username ? `@${r.username}` : r.uid.slice(0, 8);
            const pfp = r.photoURL || dice(r.username || r.displayName || r.uid);
            const xp = r.xp || 0;
            const minsTotal = r.totalMinutes || 0;
            const minsWeek = r.weeklyMinutes || 0;
            const lvl = r.level || 1;
            const right = tab === "global" ? `${xp} XP` : `${minsWeek} min`;

            return (
              <div
                key={r.uid}
                className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-secondary/10 border border-border/40"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-14 shrink-0 text-center font-bold text-primary">#{i + 1}</div>
                  <img src={pfp} className="w-12 h-12 rounded-2xl object-cover" />
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      Lvl {lvl} • {xp} XP • {minsTotal} min total • {sub}
                    </p>
                  </div>
                </div>
                <div className="text-right font-bold text-primary">{right}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
