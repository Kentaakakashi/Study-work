import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Copy,
  Crown,
  Flame,
  Timer,
  Trophy,
  Info,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import OwnerBadge from "@/components/OwnerBadge";
import { toast } from "sonner";

type ProfileDoc = {
  displayName?: string;
  username?: string;
  pfp?: string;
  photoURL?: string;
  bio?: string;
  role?: "owner" | "member";

  // optional (future)
  status?: string;
  bannerUrl?: string;
  decoration?: "aura" | "neon" | "royal" | "focus" | "none";
  createdAt?: any;
};

type StatsDoc = {
  xp?: number;
  totalMinutes?: number;
  weeklyMinutes?: number;
  streak?: number;
};

function dice(seed: string) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed || "user")}`;
}

function levelFromXp(xp: number) {
  const perLevel = 250;
  const lvl = Math.floor((xp || 0) / perLevel) + 1;
  const into = (xp || 0) % perLevel;
  const pct = Math.min(100, Math.max(0, (into / perLevel) * 100));
  return { level: lvl, pct };
}

function hashString(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function bannerGradient(seed: string) {
  const h = hashString(seed);
  const a = h % 360;
  const b = (a + 60 + (h % 80)) % 360;
  const c = (b + 65 + (h % 50)) % 360;

  // premium-ish layered gradient
  return `
    radial-gradient(1000px circle at 18% 18%, hsla(${a}, 90%, 55%, 0.30), transparent 55%),
    radial-gradient(900px circle at 82% 30%, hsla(${b}, 90%, 55%, 0.26), transparent 60%),
    radial-gradient(700px circle at 55% 110%, hsla(${c}, 90%, 55%, 0.22), transparent 60%),
    linear-gradient(180deg, rgba(10,12,18,0.92), rgba(6,7,11,0.96))
  `;
}

function badgeTier(xp: number) {
  if (xp >= 5000) return { label: "Legend", tone: "bg-primary/20 border-primary/35 text-primary" };
  if (xp >= 2000) return { label: "Grinder", tone: "bg-emerald-500/10 border-emerald-500/25 text-emerald-300" };
  if (xp >= 500) return { label: "Learner", tone: "bg-sky-500/10 border-sky-500/25 text-sky-300" };
  return { label: "Fresh", tone: "bg-secondary/25 border-border/40 text-muted-foreground" };
}

function decorationStyle(kind: ProfileDoc["decoration"], seed: string) {
  const h = hashString(seed);
  const hue = h % 360;

  // Different ring vibes (pure CSS, no assets)
  switch (kind) {
    case "royal":
      return {
        ring: `conic-gradient(from 180deg, hsla(45,95%,55%,0.9), hsla(330,85%,65%,0.85), hsla(210,90%,60%,0.85), hsla(45,95%,55%,0.9))`,
        glow: "shadow-[0_0_30px_rgba(255,200,60,0.25)]",
        icon: <Crown className="w-3.5 h-3.5 text-yellow-300" />,
      };
    case "neon":
      return {
        ring: `conic-gradient(from 180deg, hsla(175,100%,50%,0.95), hsla(265,90%,65%,0.9), hsla(330,85%,60%,0.9), hsla(175,100%,50%,0.95))`,
        glow: "shadow-[0_0_34px_rgba(0,255,204,0.22)]",
        icon: <Sparkles className="w-3.5 h-3.5 text-primary" />,
      };
    case "focus":
      return {
        ring: `conic-gradient(from 180deg, hsla(${hue},90%,60%,0.9), hsla(${(hue + 90) % 360},90%,60%,0.85), hsla(${(hue + 180) % 360},90%,60%,0.85), hsla(${hue},90%,60%,0.9))`,
        glow: "shadow-[0_0_26px_rgba(120,200,255,0.18)]",
        icon: <Sparkles className="w-3.5 h-3.5 text-sky-300" />,
      };
    case "aura":
    default:
      return {
        ring: `conic-gradient(from 180deg, hsla(${hue},90%,60%,0.85), hsla(${(hue + 120) % 360},90%,60%,0.80), hsla(${(hue + 240) % 360},90%,60%,0.80), hsla(${hue},90%,60%,0.85))`,
        glow: "shadow-[0_0_28px_rgba(160,120,255,0.16)]",
        icon: <Sparkles className="w-3.5 h-3.5 text-violet-300" />,
      };
  }
}

function fmtMemberSince(createdAt: any) {
  try {
    const d = createdAt?.toDate ? createdAt.toDate() : null;
    if (!d) return "—";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

export default function Profile() {
  const { username } = useParams();

  const [uid, setUid] = useState<string | null>(null);
  const [p, setP] = useState<ProfileDoc | null>(null);
  const [s, setS] = useState<StatsDoc | null>(null);
  const [missing, setMissing] = useState(false);
  const [tab, setTab] = useState<"about" | "stats">("about");

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

  const seed = useMemo(() => {
    const u = (username || "").toLowerCase().replace(/^@+/, "");
    return `${u}:${uid || "x"}`;
  }, [username, uid]);

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
  const streak = Number((s as any)?.streak || 0);

  const { level, pct } = levelFromXp(xp);
  const tier = badgeTier(xp);
  const decor = decorationStyle(p.decoration || "aura", seed);

  const banner = p.bannerUrl
    ? `url('${p.bannerUrl}')`
    : bannerGradient(seed);

  const copyProfileLink = async () => {
    const link = `${window.location.origin}/u/${uname}`;
    try {
      await navigator.clipboard.writeText(link);
      toast("Profile link copied ✅");
    } catch {
      toast(link);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* top bar */}
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/leaderboard"
          className="px-3 py-2 rounded-xl bg-secondary/20 border border-border/40 text-sm hover:bg-secondary/30 transition"
        >
          <ArrowLeft className="w-4 h-4 inline mr-1" /> Back
        </Link>

        <button
          onClick={copyProfileLink}
          className="px-3 py-2 rounded-xl bg-secondary/20 border border-border/40 text-sm hover:bg-secondary/30 transition"
          title="Copy profile link"
        >
          <Copy className="w-4 h-4 inline mr-1" /> Share
        </button>
      </div>

      {/* Discord-ish hero card */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card overflow-hidden rounded-3xl"
      >
        {/* banner */}
        <div
          className="relative h-36 sm:h-44"
          style={{
            backgroundImage: banner,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* subtle overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/70" />

          {/* pattern/noise vibe (matches your theme system) */}
          <div
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage: "var(--bg-pattern-url), var(--bg-noise-url)",
              backgroundRepeat: "repeat, repeat",
              backgroundSize: "220px 220px, 160px 160px",
              mixBlendMode: "overlay",
            }}
          />
        </div>

        {/* profile body */}
        <div className="relative px-5 sm:px-6 pb-6 pt-14 sm:pt-16">
          {/* avatar overlap */}
          <div className="absolute -top-10 sm:-top-12 left-5 sm:left-6">
            <div className={`relative ${decor.glow}`}>
              {/* decoration ring */}
              <div
                className="absolute -inset-1 rounded-[28px] blur-[0.2px]"
                style={{ background: decor.ring }}
              />
              <div className="absolute -inset-[5px] rounded-[34px] opacity-35 blur-md" style={{ background: decor.ring }} />

              <div className="relative bg-background rounded-[26px] p-1.5 border border-border/40">
                <img
                  src={avatar}
                  alt="avatar"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover"
                />
              </div>

              {/* tiny decor icon */}
              <div className="absolute -bottom-2 -right-2 bg-background border border-border/40 rounded-full p-1.5">
                {decor.icon}
              </div>
            </div>
          </div>

          {/* header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center flex-wrap gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold truncate">
                  {displayName}
                </h1>
                {p.role === "owner" && <OwnerBadge />}
                <span className={`text-[11px] px-2 py-1 rounded-full border ${tier.tone}`}>
                  {tier.label}
                </span>
                <span className="text-[11px] px-2 py-1 rounded-full border bg-secondary/20 border-border/40 text-muted-foreground">
                  Lvl {level}
                </span>
              </div>

              <p className="text-sm text-muted-foreground truncate mt-0.5">@{uname}</p>

              {/* status */}
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-secondary/15 border-border/40 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400/80" />
                <span className="text-muted-foreground">
                  {p.status?.trim() ? p.status : "Focused and online"}
                </span>
              </div>
            </div>

            {/* optional buttons placeholder later (add friend / message) */}
            <div className="flex items-center gap-2">
              {/* keep empty for now to avoid feature creep */}
            </div>
          </div>

          {/* tabs */}
          <div className="mt-6 flex gap-2">
            <button
              onClick={() => setTab("about")}
              className={`px-4 py-2 rounded-xl text-sm border transition ${
                tab === "about"
                  ? "bg-primary/15 border-primary/30 text-primary"
                  : "bg-secondary/15 border-border/40 text-muted-foreground hover:bg-secondary/25"
              }`}
            >
              <Info className="w-4 h-4 inline mr-1" /> About
            </button>
            <button
              onClick={() => setTab("stats")}
              className={`px-4 py-2 rounded-xl text-sm border transition ${
                tab === "stats"
                  ? "bg-primary/15 border-primary/30 text-primary"
                  : "bg-secondary/15 border-border/40 text-muted-foreground hover:bg-secondary/25"
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-1" /> Stats
            </button>
          </div>

          {/* tab content */}
          <div className="mt-4">
            <AnimatePresence mode="wait">
              {tab === "about" ? (
                <motion.div
                  key="about"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-3"
                >
                  <div className="p-4 rounded-2xl bg-secondary/10 border border-border/40">
                    <p className="text-xs text-muted-foreground mb-1">Bio</p>
                    <p className="text-sm leading-relaxed text-foreground/95">
                      {p.bio?.trim() ? p.bio : "No bio yet."}
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-secondary/10 border border-border/40">
                      <p className="text-xs text-muted-foreground mb-1">Member since</p>
                      <p className="text-sm font-semibold">{fmtMemberSince(p.createdAt)}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-secondary/10 border border-border/40">
                      <p className="text-xs text-muted-foreground mb-1">Focus vibe</p>
                      <p className="text-sm font-semibold">
                        {weeklyMinutes >= 240 ? "Serious grinder 🔥" : weeklyMinutes >= 60 ? "Consistent" : "Warming up"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        (based on weekly minutes)
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="stats"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-3"
                >
                  {/* XP block with progress */}
                  <div className="p-4 rounded-2xl bg-secondary/10 border border-border/40">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Trophy className="w-4 h-4" /> XP
                      </div>
                      <div className="text-sm font-semibold text-primary">{xp}</div>
                    </div>

                    <div className="mt-3 h-2 w-full rounded-full bg-secondary/25 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/80 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Level {level}</span>
                      <span>{Math.round(pct)}% to next</span>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-secondary/10 border border-border/40">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Timer className="w-4 h-4" /> Total Focus
                      </div>
                      <div className="mt-2 text-2xl font-extrabold text-primary">{totalMinutes}</div>
                      <div className="text-xs text-muted-foreground">minutes</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-secondary/10 border border-border/40">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Flame className="w-4 h-4" /> Weekly Focus
                      </div>
                      <div className="mt-2 text-2xl font-extrabold text-primary">{weeklyMinutes}</div>
                      <div className="text-xs text-muted-foreground">minutes</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-secondary/10 border border-border/40">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Flame className="w-4 h-4" /> Streak
                      </div>
                      <div className="mt-2 text-2xl font-extrabold text-primary">{streak}</div>
                      <div className="text-xs text-muted-foreground">days</div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    More features comming soon...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
    }
