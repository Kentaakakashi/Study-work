import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

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

  // keep original order from rows
  out.sort(
    (a, b) =>
      rows.findIndex((x) => x.uid === a.uid) -
      rows.findIndex((x) => x.uid === b.uid)
  );
  return out.filter((r) => !!r.uid);
}

async function loadMyRow(myUid: string) {
  const [ss, ps] = await Promise.all([
    getDoc(doc(db, "stats", myUid)),
    getDoc(doc(db, "profiles", myUid)),
  ]);

  const s = (ss.data() as any) || {};
  const p = (ps.data() as Profile) || {};

  const row: StatRow = {
    uid: myUid,
    xp: typeof s.xp === "number" ? s.xp : 0,
    totalMinutes: typeof s.totalMinutes === "number" ? s.totalMinutes : 0,
    weeklyMinutes: typeof s.weeklyMinutes === "number" ? s.weeklyMinutes : 0,
    level: typeof s.level === "number" ? s.level : 1,
    displayName: p.displayName,
    username: p.username,
    photoURL: p.pfp || p.photoURL,
  };

  return row;
}

function LeaderCard({
  row,
  rankLabel,
  isYou,
  tab,
}: {
  row: StatRow;
  rankLabel: string;
  isYou?: boolean;
  tab: "global" | "weekly";
}) {
  const name = row.displayName || (row.username ? `@${row.username}` : "User");
  const sub = row.username ? `@${row.username}` : row.uid.slice(0, 8);
  const pfp = row.photoURL || dice(row.username || row.displayName || row.uid);

  const xp = row.xp || 0;
  const minsTotal = row.totalMinutes || 0;
  const minsWeek = row.weeklyMinutes || 0;
  const lvl = row.level || 1;

  const right = tab === "global" ? `${xp} XP` : `${minsWeek} min`;

  return (
    <div
      className={[
        "relative flex items-center justify-between gap-3 p-4 rounded-2xl border transition",
        isYou
          ? "bg-primary/12 border-primary/35 ring-1 ring-primary/35 shadow-[0_0_24px_rgba(56,189,248,0.18)]"
          : "bg-secondary/10 border-border/40",
      ].join(" ")}
    >
      {isYou && (
        <div className="absolute -top-2 left-6 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-primary/20 border border-primary/30 text-primary">
          YOU
        </div>
      )}

      <div className="flex items-center gap-3 min-w-0">
        <div className="w-14 shrink-0 text-center font-bold text-primary">
          {rankLabel}
        </div>

        <div className={isYou ? "relative" : ""}>
          {isYou && (
            <div className="absolute -inset-1 rounded-2xl blur-md bg-primary/25 pointer-events-none" />
          )}
          <img src={pfp} className="relative w-12 h-12 rounded-2xl object-cover" />
        </div>

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
}

export default function Leaderboard() {
  const { user } = useAuth();
  const myUid = user?.uid || null;

  const [tab, setTab] = useState<"global" | "weekly">("global");
  const [rows, setRows] = useState<StatRow[]>([]);
  const [myRow, setMyRow] = useState<StatRow | null>(null);
  const [loading, setLoading] = useState(true);

  // Top list (real #1..#25)
  useEffect(() => {
    setLoading(true);

    const q =
      tab === "global"
        ? query(collection(db, "stats"), orderBy("xp", "desc"), limit(25))
        : query(
            collection(db, "stats"),
            orderBy("weeklyMinutes", "desc"),
            limit(25)
          );

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

  // Load "my card" separately so we can pin it on top
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!myUid) {
        setMyRow(null);
        return;
      }
      try {
        const r = await loadMyRow(myUid);
        if (alive) setMyRow(r);
      } catch {
        if (alive) setMyRow(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [myUid]);

  const list = useMemo(() => rows, [rows]);

  // Where you appear in the top list (if you do)
  const myIndexInTop = useMemo(() => {
    if (!myUid) return -1;
    return list.findIndex((r) => r.uid === myUid);
  }, [myUid, list]);

  const showPinnedYou = !!myUid && !!myRow;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 rounded-3xl"
      >
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">Leaderboard</h3>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={() => setTab("global")}
            className={`px-4 py-2 rounded-2xl border text-sm ${
              tab === "global"
                ? "bg-primary/15 border-primary/30 text-primary"
                : "bg-secondary/10 border-border/40"
            }`}
          >
            Global (XP)
          </button>
          <button
            onClick={() => setTab("weekly")}
            className={`px-4 py-2 rounded-2xl border text-sm ${
              tab === "weekly"
                ? "bg-primary/15 border-primary/30 text-primary"
                : "bg-secondary/10 border-border/40"
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
          {/* ✅ PINNED "YOU" CARD (doesn't change real ranks below) */}
          {showPinnedYou && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4 rounded-3xl border border-primary/20"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold">Your Rank</p>
                <p className="text-xs text-muted-foreground">
                  {myIndexInTop >= 0 ? `In Top ${list.length}` : "Not in Top list yet"}
                </p>
              </div>

              <LeaderCard
                row={myRow!}
                tab={tab}
                isYou
                rankLabel={myIndexInTop >= 0 ? `#${myIndexInTop + 1}` : "—"}
              />
            </motion.div>
          )}

          {/* ✅ REAL LIST (keeps true #1..#N positions) */}
          {list.map((r, i) => (
            <LeaderCard
              key={r.uid}
              row={r}
              tab={tab}
              isYou={!!myUid && r.uid === myUid}
              rankLabel={`#${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
