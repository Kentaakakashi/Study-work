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

type CosmeticsBlock = {
  decoration?: string;
  ring?: string;
  nameplate?: string;
  effect?: string;
  bannerUrl?: string;
};

type ProfileDoc = {
  displayName?: string;
  username?: string;
  pfp?: string;
  photoURL?: string;
  bio?: string;
  role?: "owner" | "member";

  status?: string;

  // NEW format
  cosmetics?: CosmeticsBlock;

  // OLD format fallback
  bannerUrl?: string;
  decoration?: string;
  ring?: string;
  nameplate?: string;
  effect?: string;

  createdAt?: any;
};

type StatsDoc = {
  xp?: number;
  totalMinutes?: number;
  weeklyMinutes?: number;
  streak?: number;
};

function dice(seed: string) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
    seed || "user"
  )}`;
}

function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function levelFromXp(xp: number) {
  const lvl = Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
  const base = (lvl - 1) * (lvl - 1) * 100;
  const next = lvl * lvl * 100;
  const pct = next === base ? 0 : Math.min(1, (xp - base) / (next - base));
  return { level: lvl, pct };
}

function badgeTier(xp: number) {
  if (xp >= 10000) return { label: "Legend", tone: "bg-yellow-500/15 border-yellow-500/25 text-yellow-200" };
  if (xp >= 5000) return { label: "Elite", tone: "bg-violet-500/12 border-violet-500/25 text-violet-200" };
  if (xp >= 2000) return { label: "Grinder", tone: "bg-sky-500/12 border-sky-500/25 text-sky-200" };
  if (xp >= 750) return { label: "Rising", tone: "bg-emerald-500/12 border-emerald-500/25 text-emerald-200" };
  return { label: "Fresh", tone: "bg-secondary/25 border-border/40 text-muted-foreground" };
}

function fmtMemberSince(createdAt: any) {
  try {
    const d = createdAt?.toDate ? createdAt.toDate() : null;
    if (!d) return "—";
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

/**
 * Normalize cosmetics:
 * - Prefer NEW: p.cosmetics.*
 * - Fallback to OLD: p.*
 * - Map new ids (from Settings) into existing visual system
 */
function normalizeCosmetics(p: ProfileDoc) {
  const block = p.cosmetics || {};

  const decorationRaw = (block.decoration ?? p.decoration ?? "none").toString();
  const effectRaw = (block.effect ?? p.effect ?? "none").toString();
  const ringRaw = (block.ring ?? p.ring ?? "none").toString();
  const nameplateRaw = (block.nameplate ?? p.nameplate ?? "soft").toString();
  const bannerUrl = (block.bannerUrl ?? p.bannerUrl ?? "").toString();

  // Map decoration ids
  const decoration =
    decorationRaw === "sparkle" ? "spark" :
    decorationRaw === "hearts" ? "heart" :
    decorationRaw === "baker-bear" ? "baker-bear" :
    decorationRaw;

  // Map effect ids
  const effect =
    effectRaw === "aura" ? "aurora" :
    effectRaw === "butterfly-haven" ? "sparkles" :
    effectRaw;

  // Map ring ids
  const ring =
    ringRaw === "glow" ? "neon" :
    ringRaw === "pixel" ? "focus" :
    ringRaw === "soft" ? "aura" :
    ringRaw;

  // Map nameplate ids
  const nameplate =
    nameplateRaw === "magic-hearts-blue" ? "neon" :
    nameplateRaw;

  return { decoration, effect, ring, nameplate, bannerUrl };
}

function ringStyle(kind: string, seed: string) {
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

function nameplateClass(kind: string) {
  switch (kind) {
    case "neon":
      return "bg-primary/10 border-primary/25 shadow-[0_0_30px_rgba(20,184,166,0.16)]";
    case "blueprint":
      return "bg-sky-500/10 border-sky-500/25 shadow-[0_0_28px_rgba(56,189,248,0.14)]";
    case "soft":
      return "bg-secondary/15 border-border/40 shadow-[0_0_20px_rgba(255,255,255,0.06)]";
    case "none":
    default:
      return "bg-secondary/10 border-border/40";
  }
}

function DecorationOverlay({ kind }: { kind: string }) {
  if (!kind || kind === "none") return null;

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

  // NEW: baker-bear (simple cute stamp)
  if (kind === "baker-bear") {
    return (
      <div className={`${base} ${float}`}>
        <div className="absolute top-2 right-2 text-xl opacity-75">🐻‍❄️</div>
        <div className="absolute bottom-3 left-3 text-lg opacity-55">🥐</div>
      </div>
    );
  }

  return null;
}

function EffectLayer({ effect }: { effect: string }) {
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
    return <div className="absolute inset-0 pointer-events-none opacity-60 sparkle-layer" />;
  }

  if (effect === "scanlines") {
    return <div className="absolute inset-0 pointer-events-none opacity-30 scanlines" />;
  }

  if (effect === "bubbles") {
    return <div className="absolute inset-0 pointer-events-none opacity-55 bubbles" />;
  }

  return null;
}

function bannerGradient(seed: string) {
  const h = hashString(seed) % 360;
  const h2 = (h + 60) % 360;
  const h3 = (h + 120) % 360;
  return `linear-gradient(135deg, hsla(${h},90%,55%,0.30), hsla(${h2},90%,55%,0.22), hsla(${h3},90%,55%,0.18))`;
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
          <p className="text-sm text-muted-foreground">
            No user found for that username.
          </p>
          <Link
            to="/leaderboard"
            className="inline-flex items-center gap-2 mt-3 text-sm text-primary underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to leaderboard
          </Link>
        </div>
      </div>
    );
  }

  if (!p || !s) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="glass-card p-6 rounded-3xl">
          <p className="text-sm text-muted-foreground">Loading profile…</p>
        </div>
      </div>
    );
  }

  const uname = (username || "").toLowerCase().replace(/^@+/, "");
  const avatar =
    p.pfp?.trim() ||
    p.photoURL?.trim() ||
    dice(p.displayName || uname || "user");

  const xp = Number((s as any)?.xp || 0);
  const totalMinutes = Number((s as any)?.totalMinutes || 0);
  const weeklyMinutes = Number((s as any)?.weeklyMinutes || 0);
  const streak = Number((s as any)?.streak || 0);

  const { level, pct } = levelFromXp(xp);
  const tier = badgeTier(xp);

  const c = normalizeCosmetics(p);

  const ring = ringStyle(c.ring || "aura", seed);

  const banner = (c.bannerUrl || "").trim()
    ? `url('${c.bannerUrl.trim()}')`
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

  const nameplate = nameplateClass(c.nameplate || "soft");

  return (
    <div className="max-w-3xl mx-auto space-y-5">
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
          animation: scanMove 2.2s linear infinite;
        }
        @keyframes scanMove { from { background-position: 0 0; } to { background-position: 0 30px; } }

        .sparkle-layer {
          background:
            radial-gradient(circle at 22% 30%, rgba(255,255,255,0.55), transparent 35%),
            radial-gradient(circle at 78% 42%, rgba(255,255,255,0.45), transparent 40%),
            radial-gradient(circle at 55% 75%, rgba(255,255,255,0.35), transparent 45%);
          filter: blur(0.4px);
          animation: sparkleTwinkle 2.6s ease-in-out infinite;
        }
        @keyframes sparkleTwinkle { 0%,100%{opacity:0.35} 50%{opacity:0.8} }

        .bubbles {
          background:
            radial-gradient(circle at 18% 62%, rgba(255,255,255,0.20), transparent 30%),
            radial-gradient(circle at 72% 22%, rgba(255,255,255,0.18), transparent 28%),
            radial-gradient(circle at 56% 72%, rgba(255,255,255,0.14), transparent 30%);
          filter: blur(0.6px);
          animation: bubblesDrift 4.8s ease-in-out infinite;
        }
        @keyframes bubblesDrift { 0%,100%{transform: translateY(0)} 50%{transform: translateY(-6px)} }
      `}</style>

      <div className="glass-card p-6 rounded-3xl overflow-hidden relative">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: banner,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.95,
          }}
        />
        <EffectLayer effect={c.effect || "none"} />
        <div className="absolute inset-0 bg-black/35" />

        <div className="relative">
          <div className="flex items-center justify-between">
            <Link
              to="/leaderboard"
              className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>

            <button
              onClick={copyProfileLink}
              className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white"
            >
              <Copy className="w-4 h-4" />
              Copy profile link
            </button>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="relative">
              <div
                className={`p-[3px] rounded-[22px] ${ring.glow}`}
                style={{ background: ring.ring }}
              >
                <img
                  src={avatar}
                  alt="avatar"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover"
                />
                <DecorationOverlay kind={c.decoration || "none"} />
              </div>

              <div className="absolute -bottom-2 -right-2 bg-background border border-border/40 rounded-full p-1.5">
                {ring.icon}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className={`px-3 py-1.5 rounded-2xl border ${nameplate}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold truncate">
                      {p.displayName || `@${uname}`}
                    </span>
                    {p.role === "owner" && <OwnerBadge />}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    @{uname}
                  </div>
                </div>

                <div className={`px-3 py-1.5 rounded-2xl border ${tier.tone}`}>
                  <div className="text-xs">Tier</div>
                  <div className="font-semibold text-sm">{tier.label}</div>
                </div>

                <div className="px-3 py-1.5 rounded-2xl border bg-secondary/10 border-border/40">
                  <div className="text-xs text-muted-foreground">Level</div>
                  <div className="font-semibold text-sm">{level}</div>
                </div>
              </div>

              <div className="mt-3 text-sm text-white/90">
                {p.status || "Focused. Unbothered. Studying."}
              </div>

              {p.bio && (
                <div className="mt-2 text-sm text-white/75 leading-relaxed">
                  {p.bio}
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 text-xs text-white/70">
                <Info className="w-4 h-4" />
                Member since {fmtMemberSince(p.createdAt)}
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <button
              onClick={() => setTab("about")}
              className={`px-4 py-2 rounded-2xl text-sm border transition ${
                tab === "about"
                  ? "bg-white/15 border-white/20 text-white"
                  : "bg-black/10 border-white/10 text-white/70 hover:text-white"
              }`}
            >
              About
            </button>
            <button
              onClick={() => setTab("stats")}
              className={`px-4 py-2 rounded-2xl text-sm border transition ${
                tab === "stats"
                  ? "bg-white/15 border-white/20 text-white"
                  : "bg-black/10 border-white/10 text-white/70 hover:text-white"
              }`}
            >
              Stats
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tab === "about" ? (
          <motion.div
            key="about"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass-card p-6 rounded-3xl"
          >
            <h3 className="font-semibold mb-3">About</h3>
            <div className="grid gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-300" />
                Streak: <span className="text-foreground font-semibold">{streak}</span>
              </div>
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-sky-300" />
                Weekly minutes:{" "}
                <span className="text-foreground font-semibold">{weeklyMinutes}</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-300" />
                Total XP: <span className="text-foreground font-semibold">{xp}</span>
              </div>
            </div>

            <div className="mt-5">
              <div className="text-xs text-muted-foreground mb-1">Level progress</div>
              <div className="h-2 rounded-full bg-secondary/40 overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${Math.round(pct * 100)}%` }}
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="stats"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass-card p-6 rounded-3xl"
          >
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Stats
            </h3>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border bg-secondary/10 border-border/40 p-4">
                <div className="text-xs text-muted-foreground">Total minutes</div>
                <div className="text-lg font-semibold">{totalMinutes}</div>
              </div>

              <div className="rounded-2xl border bg-secondary/10 border-border/40 p-4">
                <div className="text-xs text-muted-foreground">Weekly minutes</div>
                <div className="text-lg font-semibold">{weeklyMinutes}</div>
              </div>

              <div className="rounded-2xl border bg-secondary/10 border-border/40 p-4">
                <div className="text-xs text-muted-foreground">Streak</div>
                <div className="text-lg font-semibold">{streak}</div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              Next upgrade: inventory + unlocking decorations with coins. People will grind study minutes just to get a glowing frame. Humans are predictable. 🙂
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
