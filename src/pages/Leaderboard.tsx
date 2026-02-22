import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
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
};

type Profile = {
  displayName?: string;
  username?: string;
  photoURL?: string;
  pfp?: string;
};

function dice(seed: string) {
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
    seed || "user"
  )}`;
}

function normUsername(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/^@+/, "")
    .replace(/[^a-z0-9_\.]/g, "");
}

/**
 * Only allow "real" users into the board:
 * - profile exists
 * - profile.username exists
 * - usernames/{usernameNorm}.uid === row.uid  (proves ownership)
 */
async function enrichAndFilterRealUsers(rows: StatRow[]) {
  const results: (StatRow & {
    displayName?: string;
    username?: string;
    photoURL?: string;
  })[] = [];

  // Keep order stable
  await Promise.all(
    rows.map(async (r, idx) => {
      try {
        const ps = await getDoc(doc(db, "profiles", r.uid));
        if (!ps.exists()) return; // no profile => ghost => skip

        const p = (ps.data() as Profile) || {};
        const unameNorm = normUsername(p.username || "");
        if (!unameNorm) return; // no username => skip

        // Verify username claim points to this uid
        const us = await getDoc(doc(db, "usernames", unameNorm));
        if (!us.exists()) return;
        const claimedUid = (us.data() as any)?.uid;
        if (claimedUid !== r.uid) return;

        results.push({
          ...r,
          displayName: p.displayName,
          username: unameNorm,
          photoURL: p.pfp || p.photoURL,
          // preserve original ordering via idx (we’ll sort back)
          _idx: idx as any,
        } as any);
      } catch {
        // If something errors, just skip that row (don’t poison UI)
        return;
      }
    })
  );

  // sort back to original snapshot order
  results.sort((a: any, b: any) => (a._idx ?? 0) - (b._idx ?? 0));

  // strip helper key
  return results.map(({ _idx, ...rest }: any) => rest);
}

export default function Leaderboard() {
  const [tab, setTab] = useState<"global" | "weekly">("global");
  const [rows, setRows] = useState<
    (StatRow & { displayName?: string; username?: string; photoURL?: string })[]
  >([]);
  const [loading, setLoading] = useState(true);

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

        const cleaned = await enrichAndFilterRealUsers(raw);
        setRows(cleaned);
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

        <p className="text-xs text-muted-foreground mt-2">
          Only “real” accounts show up: must have a profile + a valid claimed
          username. Ghost/deleted accounts won’t pollute the board.
        </p>
      </motion.div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : list.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No leaderboard data yet (or no valid claimed profiles).
        </p>
      ) : (
        <div className="space-y-3">
          {list.map((r, i) => {
            const uname = r.username ? `@${r.username}` : "@unknown";
            const name = r.displayName?.trim() ? r.displayName : uname; // never show "User" again
            const pfp = r.photoURL || dice(r.username || r.uid);

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
                  <div className="w-14 shrink-0 text-center font-bold text-primary">
                    #{i + 1}
                  </div>
                  <img
                    src={pfp}
                    className="w-12 h-12 rounded-2xl object-cover"
                    alt="pfp"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      Lvl {lvl} • {xp} XP • {minsTotal} min total • {uname}
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
