import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BarChart3,
  Copy,
  Crown,
  Flame,
  Info,
  Sparkles,
  Timer,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
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

  // cosmetics
  status?: string;
  bannerUrl?: string; // optional
  decoration?: "none" | "spark" | "coffee" | "stars" | "leaf" | "heart";
  ring?: "none" | "aura" | "neon" | "royal" | "focus";
  nameplate?: "none" | "neon" | "blueprint" | "soft";
  effect?: "none" | "aurora" | "sparkles" | "scanlines" | "bubbles";

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

function fmtMemberSince(createdAt: any) {
  try {
    const d = createdAt?.toDate ? createdAt.toDate() : null;
    if (!d) return "—";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

function ringStyle(kind: ProfileDoc["ring"], seed: string) {
  const h = hashString(seed);
  const hue = h % 360;

  switch (kind) {
    case "royal":
      return {
        ring: `conic-gradient(from 180deg, hsla(45,95%,55%,0.95), hsla(330,85%,65%,0.90), hsla(210,90%,60%,0.90), hsla(45,95%,55%,0.95))`,
        glow: "shadow-[0_0_34px_rgba(255,200,60,0.22)]",
        icon: <Crown className="w-3.5 h-3.5 text-yellow-300" />,
      };
    case "neon":
      return {
        ring: `conic-gradient(from 180deg, hsla(175,100%,50%,0.95), hsla(265,90%,65%,0.9), hsla(330,85%,60%,0.9), hsla(175,100%,50%,0.95))`,
        glow: "shadow-[0_0_34px_rgba(0,255,204,0.20)]",
        icon: <Sparkles className="w-3.5 h-3.5 text-primary" />,
      };
    case "focus":
      return {
        ring: `conic-gradient(from 180deg, hsla(${hue},90%,60%,0.9), hsla(${(hue + 90) % 360},90%,60%,0.85), hsla(${(hue + 180) % 360},90%,60%,0.85), hsla(${hue},90%,60%,0.9))`,
        glow: "shadow-[0_0_26px_rgba(120,200,255,0.18)]",
        icon: <Sparkles className="w-3.5 h-3.5 text-sky-300" />,
      };
    case "aura":
      return {
        ring: `conic-gradient(from 180deg, hsla(${hue},90%,60%,0.85), hsla(${(hue + 120) % 360},90%,60%,0.80), hsla(${(hue + 240) % 360},90%,60%,0.80), hsla(${hue},90%,60%,0.85))`,
        glow: "shadow-[0_0_28px_rgba(160,120,255,0.16)]",
        icon: <Sparkles className="w-3.5 h-3.5 text-violet-300" />,
      };
    case "none":
    default:
      return {
        ring: `linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06))`,
        glow: "",
        icon: <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />,
      };
  }
}

function nameplateClass(kind: ProfileDoc["nameplate"]) {
  switch (kind) {
    case "neon":
      return "bg-primary/10 border-primary/25 shadow-[0_0_30px_rgba(20,184,166,0.18)]";
    case "blueprint":
      return "bg-sky-500/10 border-sky-500/25 shadow-[0_0_28px_rgba(56,189,248,0.14)]";
    case "soft":
      return "bg-secondary/15 border-border/40 shadow-[0_0_20px_rgba(255,255,255,0.06)]";
    case "none":
    default:
      return "bg-secondary/10 border-border/40";
  }
}

function DecorationOverlay({ kind }: { kind: ProfileDoc["decoration"] }) {
  if (!kind || kind === "none") return null;

  // SVG overlays so you don’t need to host assets yet.
  const base = "absolute -inset-2 pointer-events-none opacity-90";
  const float = "decor-float";

  if (kind === "spark") {
    return (
      <div className={`${base} ${float}`}>
        <svg viewBox="0 0 120 120" className="w-full h-full">
          <defs>
            <radialGradient id="g1" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="rgba(20,184,166,0.65)" />
              <stop offset="55%" stopColor="rgba(99,102,241,0.35)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
          </defs>
          <circle cx="60" cy="60" r="55" fill="url(#g1)" />
          <circle cx="20" cy="35" r="3" fill="rgba(255,255,255,0.7)" />
          <circle cx="92" cy="30" r="2.5" fill="rgba(255,255,255,0.6)" />
          <circle cx="95" cy="86" r="3.5" fill="rgba(255,255,255,0.55)" />
        </svg>
      </div>
    );
  }

  if (kind === "coffee") {
    return (
      <div className={`${base} ${float}`}>
        <svg viewBox="0 0 120 120" className="w-full h-full">
          <path
            d="M35 75c0 10 7 18 25 18s25-8 25-18H35z"
            fill="rgba(255,255,255,0.12)"
          />
          <path
            d="M40 55h40c3 0 5 2 5 5v10c0 10-10 20-25 20S35 80 35 70V60c0-3 2-5 5-5z"
            fill="rgba(255,255,255,0.18)"
          />
          <path
            d="M84 60h6c6 0 10 4 10 10s-4 10-10 10h-7"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="4"
            fill="none"
          />
          <path
            d="M55 40c-6 6 6 10 0 16"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M70 40c-6 6 6 10 0 16"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  if (kind === "stars") {
    return (
      <div className={`${base} ${float}`}>
        <svg viewBox="0 0 120 120" className="w-full h-full">
          <g fill="rgba(255,255,255,0.65)">
            <path d="M60 18l3 9 9 3-9 3-3 9-3-9-9-3 9-3 3-9z" />
            <path d="M24 52l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" opacity="0.9" />
            <path d="M96 66l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" opacity="0.8" />
            <circle cx="86" cy="30" r="2.5" opacity="0.8" />
            <circle cx="30" cy="86" r="3" opacity="0.7" />
          </g>
        </svg>
      </div>
    );
  }

  if (kind === "leaf") {
    return (
      <div className={`${base} ${float}`}>
        <svg viewBox="0 0 120 120" className="w-full h-full">
          <path
            d="M85 30c-22 4-42 20-48 42 18-8 33-3 45-16 10-10 7-20 3-26z"
            fill="rgba(34,197,94,0.22)"
          />
          <path
            d="M40 80c12-18 25-28 46-40"
            stroke="rgba(34,197,94,0.35)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  if (kind === "heart") {
    return (
      <div className={`${base} ${float}`}>
        <svg viewBox="0 0 120 120" className="w-full h-full">
          <path
            d="M60 95s-30-18-38-36c-6-14 2-28 16-30 10-1 18 5 22 12 4-7 12-13 22-12 14 2 22 16 16 30-8 18-38 36-38 36z"
            fill="rgba(244,63,94,0.22)"
          />
          <circle cx="30" cy="30" r="2.5" fill="rgba(255,255,255,0.55)" />
          <circle cx="92" cy="44" r="2" fill="rgba(255,255,255,0.45)" />
        </svg>
      </div>
    );
  }

  return null;
}

function EffectLayer({ effect }: { effect: ProfileDoc["effect"] }) {
  if (!effect || effect === "none") return null;

  if (effect === "aurora") {
    return (
      <div className="absolute inset-0 pointer-events-none opacity-70">
        <div className="aurora-one" />
        <div className="aurora-two" />
      </div>
    );
  }

  if (effect === "sparkles") {
    return (
      <div className="absolute inset-0 pointer-events-none opacity-60 sparkle-layer" />
    );
  }

  if (effect === "scanlines") {
    return (
      <div className="absolute inset-0 pointer-events-none opacity-30 scanlines" />
    );
  }

  if (effect === "bubbles") {
    return (
      <div className="absolute inset-0 pointer-events-none opacity-55 bubbles" />
    );
  }

  return null;
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
  const ring = ringStyle(p.ring || "aura", seed);

  const banner = p.bannerUrl?.trim()
    ? `url('${p.bannerUrl.trim()}')`
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

  const nameplate = nameplateClass(p.nameplate || "soft");

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* CSS for effects (scoped-ish via unique classes) */}
      <style>{`
        .decor-float { animation: decorFloat 4.2s ease-in-out infinite; }
        @keyframes decorFloat { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-4px); } }

        .aurora-one {
          position: absolute; inset: -30%;
          background: radial-gradient(circle at 30% 30%, rgba(20,184,166,0.35), transparent 55%),
                      radial-gradient(circle at 70% 45%, rgba(99,102,241,0.28), transparent 55%),
                      radial-gradient(circle at 50% 85%, rgba(244,63,94,0.18), transparent 60%);
          filter: blur(18px);
          animation: auroraMove 8s ease-in-out infinite;
        }
        .aurora-two {
          position: absolute; inset: -40%;
          background: radial-gradient(circle at 20% 70%, rgba(56,189,248,0.25), transparent 55%),
                      radial-gradient(circle at 80% 20%, rgba(168,85,247,0.20), transparent 55%);
          filter: blur(22px);
          animation: auroraMove2 10s ease-in-out infinite;
          opacity: 0.85;
        }
        @keyframes auroraMove { 0%{transform: translate(0,0) scale(1)} 50%{transform: translate(10px,-10px) scale(1.05)} 100%{transform: translate(0,0) scale(1)} }
        @keyframes auroraMove2 { 0%{transform: translate(0,0) scale(1)} 50%{transform: translate(-10px,12px) scale(1.06)} 100%{transform: translate(0,0) scale(1)} }

        .scanlines {
          background: repeating-linear-gradient(
            to bottom,
            rgba(255,255,255,0.12),
            rgba(255,255,255,0.12) 1px,
            rgba(0,0,0,0) 3px,
            rgba(0,0,0,0) 6px
          );
          mix-blend-mode: overlay;
        }

        .sparkle-layer {
          background-image:
            radial-gradient(circle at 18% 30%, rgba(255,255,255,0.55) 0 1px, transparent 2px),
            radial-gradient(circle at 70% 20%, rgba(255,255,255,0.45) 0 1px, transparent 2px),
            radial-gradient(circle at 60% 70%, rgba(255,255,255,0.35) 0 1px, transparent 2px),
            radial-gradient(circle at 25% 80%, rgba(255,255,255,0.40) 0 1px, transparent 2px);
          animation: twinkle 2.8s ease-in-out infinite;
        }
        @keyframes twinkle { 0%,100%{opacity:.45} 50%{opacity:.85} }

        .bubbles {
          background-image:
            radial-gradient(circle at 20% 70%, rgba(255,255,255,0.18) 0 14px, transparent 15px),
            radial-gradient(circle at 75% 55%, rgba(255,255,255,0.14) 0 10px, transparent 11px),
            radial-gradient(circle at 55% 85%, rgba(255,255,255,0.10) 0 18px, transparent 19px);
          animation: bubbleMove 7s ease-in-out infinite;
        }
        @keyframes bubbleMove { 0%,100%{transform: translateY(0)} 50%{transform: translateY(-10px)} }
      `}</style>

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

      {/* hero */}
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
          <EffectLayer effect={p.effect || "none"} />

          {/* readability overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/35 to-black/70" />

          {/* optional subtle texture if your theme provides these vars */}
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

        {/* body */}
        <div className="relative px-5 sm:px-6 pb-6 pt-14 sm:pt-16">
          {/* avatar overlap */}
          <div className="absolute -top-10 sm:-top-12 left-5 sm:left-6">
            <div className={`relative ${ring.glow}`}>
              {/* ring */}
              <div className="absolute -inset-1 rounded-[28px]" style={{ background: ring.ring }} />
              <div className="absolute -inset-[5px] rounded-[34px] opacity-35 blur-md" style={{ background: ring.ring }} />

              <div className="relative bg-background rounded-[26px] p-1.5 border border-border/40 overflow-hidden">
                <img
                  src={avatar}
                  alt="avatar"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover"
                />
                <DecorationOverlay kind={p.decoration || "none"} />
              </div>

              {/* tiny icon */}
              <div className="absolute -bottom-2 -right-2 bg-background border border-border/40 rounded-full p-1.5">
                {ring.icon}
              </div>
            </div>
          </div>

          {/* nameplate */}
          <div className={`rounded-2xl border p-4 ${nameplate}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center flex-wrap gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold truncate">{displayName}</h1>
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
            </div>

            {/* tabs */}
            <div className="mt-5 flex gap-2">
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
                      <p className="text-xs text-muted-foreground mt-1">(based on weekly minutes)</p>
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
                  {/* XP + progress */}
                  <div className="p-4 rounded-2xl bg-secondary/10 border border-border/40">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Trophy className="w-4 h-4" /> XP
                      </div>
                      <div className="text-sm font-semibold text-primary">{xp}</div>
                    </div>

                    <div className="mt-3 h-2 w-full rounded-full bg-secondary/25 overflow-hidden">
                      <div className="h-full rounded-full bg-primary/80 transition-all" style={{ width: `${pct}%` }} />
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
                    Next upgrade: inventory + unlocking decorations with coins. People will grind study minutes just to get a glowing frame. Humans are predictable. 🙂
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
