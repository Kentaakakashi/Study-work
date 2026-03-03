import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, CalendarDays, Copy } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { isOwnerUid } from "@/lib/roles";
import OwnerBadge from "@/components/OwnerBadge";
import { collection, doc, getDoc, limit, onSnapshot, orderBy, query } from "firebase/firestore";

type StatsDoc = {
  uid?: string;
  displayName?: string;
  username?: string;
  photoURL?: string;
  pfp?: string;
  xp?: number;
  totalMinutes?: number;
  weeklyMinutes?: number;
  role?: "owner" | "member";
};

type ProfileDoc = {
  displayName?: string;
  username?: string;
  photoURL?: string;
  pfp?: string;
  role?: "owner" | "member";
};

function dice(seed: string) {
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed || "user")}`;
}

function levelFromXp(xp: number) {
  const perLevel = 250;
  const lvl = Math.floor((xp || 0) / perLevel) + 1;
  return { level: lvl };
}

export default function Leaderboard() {
  const { user, profile } = useAuth();
  const isOwner = (profile?.role === "owner") || isOwnerUid(user?.uid);

  const [mode, setMode] = useState<"xp" | "weekly">("xp");
  const [rows, setRows] = useState<StatsDoc[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileDoc>>({});

  const loadProfile = async (uid: string) => {
    if (!uid) return;
    if (profiles[uid]) return;
    try {
      const snap = await getDoc(doc(db, "profiles", uid));
      setProfiles((prev) => ({ ...prev, [uid]: (snap.data() as ProfileDoc) || {} }));
    } catch {}
  };

  useEffect(() => {
    const q =
      mode === "xp"
        ? query(collection(db, "stats"), orderBy("xp", "desc"), limit(50))
        : query(collection(db, "stats"), orderBy("weeklyMinutes", "desc"), limit(50));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr: StatsDoc[] = [];
        snap.forEach((d) => {
          const data = (d.data() as StatsDoc) || {};
          const uid = data.uid || d.id;
          arr.push({ ...data, uid });
        });
        setRows(arr);
        arr.forEach((r) => r.uid && loadProfile(r.uid));
      },
      (err) => {
        console.error("Leaderboard error:", err);
        toast(err?.message || "Leaderboard failed to load");
      }
    );

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const youUid = user?.uid || "";

  const pickIdentity = (r: StatsDoc) => {
    const uid = r.uid || "";
    const p = (uid && profiles[uid]) || {};
    const displayName = r.displayName || p.displayName || "User";
    const username = r.username || p.username || "unknown";
    const photoURL = r.photoURL || r.pfp || p.photoURL || p.pfp || "";
    const avatar = photoURL || dice(username || displayName || uid);
    const role = (r.role || p.role || "member") as "owner" | "member";
    return { uid, displayName, username, avatar, role };
  };

  const metricText = (r: StatsDoc) => {
    const xp = Number(r.xp || 0);
    const total = Number(r.totalMinutes || 0);
    const weekly = Number(r.weeklyMinutes || 0);
    const { level } = levelFromXp(xp);

    if (mode === "xp") return { right: `${xp}`, unit: "XP", sub: `Lvl ${level} • ${total} min total` };
    return { right: `${weekly}`, unit: "MIN", sub: `This week • ${total} min total` };
  };

  const copyUid = async (uid: string) => {
    try {
      await navigator.clipboard.writeText(uid);
      toast(`Copied UID ✅ (${uid.slice(0, 6)}...)`);
    } catch {
      // fallback (some browsers block clipboard)
      try {
        const el = document.createElement("textarea");
        el.value = uid;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
        toast(`Copied UID ✅ (${uid.slice(0, 6)}...)`);
      } catch {
        toast("Couldn’t copy UID");
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-3xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold">Leaderboard</h3>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMode("xp")}
            className={`px-3 py-1 rounded-full bg-secondary/20 border border-border/40 text-sm hover:bg-secondary/30 transition ${
              mode === "xp" ? "bg-primary/20 border-primary/30" : ""
            }`}
          >
            Global (XP)
          </button>

          <button
            type="button"
            onClick={() => setMode("weekly")}
            className={`px-3 py-1 rounded-full bg-secondary/20 border border-border/40 text-sm hover:bg-secondary/30 transition ${
              mode === "weekly" ? "bg-primary/20 border-primary/30" : ""
            }`}
          >
            <CalendarDays className="w-4 h-4 inline mr-1" />
            Weekly (Minutes)
          </button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-3xl">
        <div className="space-y-3">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            rows.map((r, i) => {
              const id = pickIdentity(r);
              const m = metricText(r);
              const isYou = id.uid === youUid;

              return (
                <div
                  key={`${id.uid}_${mode}_${i}`}
                  className={`relative flex items-center justify-between gap-3 p-4 rounded-2xl bg-secondary/15 border ${
                    isYou ? "border-primary/50 shadow-[0_0_30px_rgba(20,184,166,0.35)]" : "border-border/40"
                  }`}
                >
                  {isYou && (
                    <div className="absolute -top-2 left-4 text-[10px] tracking-wider font-semibold px-2 py-0.5 rounded-full bg-primary/25 border border-primary/30">
                      YOU
                    </div>
                  )}

                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 text-center">
                      <span className="text-primary font-bold">#{i + 1}</span>
                    </div>

                    <img src={id.avatar} className="w-12 h-12 rounded-2xl object-cover" alt="avatar" />

                    <div className="min-w-0">
                      <p className="font-semibold truncate flex items-center">
                        <span className="truncate">{id.displayName}</span>
                        {id.role === "owner" && <OwnerBadge />}
                      </p>

                      <p className="text-xs text-muted-foreground truncate">
                        {m.sub} • @{id.username}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Owner-only UID copy */}
                    {isOwner && id.uid && (
                      <button
                        onClick={() => copyUid(id.uid)}
                        className="px-3 py-2 rounded-xl bg-secondary/20 border border-border/40 text-xs hover:bg-secondary/30 transition"
                        title="Copy Firebase Auth UID"
                      >
                        <Copy className="w-4 h-4 inline mr-1" />
                        UID
                      </button>
                    )}

                    <div className="text-right">
                      <p className="text-primary font-bold text-lg leading-none">{m.right}</p>
                      <p className="text-primary/80 font-semibold text-xs">{m.unit}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}
