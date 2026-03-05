import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Crown, Flame, Timer, Trophy } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import OwnerBadge from "@/components/OwnerBadge";

type ProfileDoc = {
  displayName?: string;
  username?: string;
  pfp?: string;
  photoURL?: string;
  bio?: string;
  role?: "owner" | "member";
};

type StatsDoc = {
  xp?: number;
  totalMinutes?: number;
  weeklyMinutes?: number;
};

function dice(seed: string) {
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed || "user")}`;
}

function levelFromXp(xp: number) {
  const perLevel = 250;
  const lvl = Math.floor((xp || 0) / perLevel) + 1;
  return { level: lvl };
}

export default function Profile() {
  const { username } = useParams();
  const [uid, setUid] = useState<string | null>(null);
  const [p, setP] = useState<ProfileDoc | null>(null);
  const [s, setS] = useState<StatsDoc | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    (async () => {
      setMissing(false);
      setUid(null);
      setP(null);
      setS(null);

      const u = (username || "").toLowerCase().replace(/^@+/, "");
      if (!u) return setMissing(true);

      const unameSnap = await getDoc(doc(db, "usernames", u));
      if (!unameSnap.exists()) return setMissing(true);

      const foundUid = (unameSnap.data() as any)?.uid as string;
      if (!foundUid) return setMissing(true);

      setUid(foundUid);

      const profSnap = await getDoc(doc(db, "profiles", foundUid));
      setP((profSnap.data() as ProfileDoc) || {});

      const statsSnap = await getDoc(doc(db, "stats", foundUid));
      setS((statsSnap.data() as StatsDoc) || {});
    })();
  }, [username]);

  if (missing) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="glass-card p-6 rounded-3xl">
          <p className="text-sm text-muted-foreground">No user found for that username.</p>
          <Link
            to="/leaderboard"
            className="inline-flex items-center mt-4 px-3 py-2 rounded-xl bg-secondary/20 border border-border/40 text-sm hover:bg-secondary/30 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Link>
        </div>
      </div>
    );
  }

  if (!p) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="glass-card p-6 rounded-3xl">Loading…</div>
      </div>
    );
  }

  const displayName = p.displayName || "User";
  const uname = p.username || (username || "").replace(/^@+/, "");
  const avatar = p.pfp || p.photoURL || dice(uname || displayName || uid || "user");

  const xp = Number(s?.xp || 0);
  const totalMinutes = Number(s?.totalMinutes || 0);
  const weeklyMinutes = Number(s?.weeklyMinutes || 0);
  const { level } = levelFromXp(xp);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/leaderboard"
          className="px-3 py-2 rounded-xl bg-secondary/20 border border-border/40 text-sm hover:bg-secondary/30 transition"
        >
          <ArrowLeft className="w-4 h-4 inline mr-1" /> Back
        </Link>
      </div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-3xl">
        <div className="flex items-center gap-4">
          <img src={avatar} alt="avatar" className="w-20 h-20 rounded-3xl object-cover border border-border/40" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold truncate">{displayName}</h1>
              {p.role === "owner" && <OwnerBadge />}
            </div>
            <p className="text-sm text-muted-foreground truncate">@{uname}</p>
            <p className="text-sm mt-2 text-muted-foreground">
              {p.bio?.trim() ? p.bio : "No bio yet."}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="grid sm:grid-cols-3 gap-3">
        <div className="glass-card p-5 rounded-3xl">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Trophy className="w-4 h-4" /> XP
          </div>
          <div className="mt-2 text-2xl font-bold text-primary">{xp}</div>
          <div className="text-xs text-muted-foreground mt-1">Level {level}</div>
        </div>

        <div className="glass-card p-5 rounded-3xl">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Timer className="w-4 h-4" /> Total Focus
          </div>
          <div className="mt-2 text-2xl font-bold text-primary">{totalMinutes}</div>
          <div className="text-xs text-muted-foreground mt-1">minutes</div>
        </div>

        <div className="glass-card p-5 rounded-3xl">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Flame className="w-4 h-4" /> Weekly Focus
          </div>
          <div className="mt-2 text-2xl font-bold text-primary">{weeklyMinutes}</div>
          <div className="text-xs text-muted-foreground mt-1">minutes</div>
        </div>
      </motion.div>
    </div>
  );
}
