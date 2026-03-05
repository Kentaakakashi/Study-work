import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Copy,
  Flame,
  Timer,
  Trophy,
  Sparkles,
  BarChart3,
  Info,
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

  // new format
  cosmetics?: CosmeticsBlock;

  // old fallback
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
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed || "user")}`;
}

function safeUrl(u: string) {
  const s = (u || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return "";
}

function hashString(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function levelFromXp(xp: number) {
  const perLevel = 250;
  const lvl = Math.floor((xp || 0) / perLevel) + 1;
  const into = (xp || 0) % perLevel;
  const pct = Math.min(100, Math.max(0, (into / perLevel) * 100));
  return { level: lvl, pct };
}

function badgeTier(xp: number) {
  if (xp >= 10000) return { label: "Legend", cls: "bg-yellow-500/15 border-yellow-500/25 text-yellow-200" };
  if (xp >= 5000) return { label: "Elite", cls: "bg-violet-500/12 border-violet-500/25 text-violet-200" };
  if (xp >= 2000) return { label: "Grinder", cls: "bg-sky-500/12 border-sky-500/25 text-sky-200" };
  if (xp >= 750) return { label: "Rising", cls: "bg-emerald-500/12 border-emerald-500/25 text-emerald-200" };
  return { label: "Fresh", cls: "bg-secondary/25 border-border/40 text-muted-foreground" };
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

/**
 * Normalize cosmetics:
 * - prefer new: p.cosmetics.*
 * - fallback to old: p.*
 * - map Settings ids -> profile visuals
 */
function normalizeCosmetics(p: ProfileDoc) {
  const block = p.cosmetics || {};

  const decorationRaw = String(block.decoration ?? p.decoration ?? "none");
  const effectRaw = String(block.effect ?? p.effect ?? "none");
  const ringRaw = String(block.ring ?? p.ring ?? "none");
  const nameplateRaw = String(block.nameplate ?? p.nameplate ?? "soft");
  const bannerUrl = String(block.bannerUrl ?? p.bannerUrl ?? "");

  // decoration ids coming from Settings
  const decoration =
    decorationRaw === "sparkle" ? "spark" :
    decorationRaw === "hearts" ? "hearts" :
    decorationRaw === "baker-bear" ? "baker-bear" :
    decorationRaw;

  // effect ids coming from Settings
  const effect =
    effectRaw === "aura" ? "aurora" :
    effectRaw === "bubbles" ? "bubbles" :
    effectRaw === "butterfly-haven" ? "butterflies" :
    effectRaw;

  // ring ids coming from Settings
  const ring =
    ringRaw === "glow" ? "neon" :
    ringRaw === "pixel" ? "pixel" :
    ringRaw === "soft" ? "soft" :
    ringRaw;

  // nameplate ids coming from Settings
  const nameplate =
    nameplateRaw === "magic-hearts-blue" ? "magic-hearts-blue" :
    nameplateRaw;

  return { decoration, effect, ring, nameplate, bannerUrl };
}

/* ------------------ VISUAL SYSTEM ------------------ */

function bannerGradient(seed: string) {
  const h = hashString(seed) % 360;
  const h2 = (h + 65) % 360;
  const h3 = (h + 135) % 360;

  return `
    radial-gradient(1000px circle at 18% 18%, hsla(${h}, 90%, 55%, 0.28), transparent 55%),
    radial-gradient(900px circle at 82% 30%, hsla(${h2}, 90%, 55%, 0.24), transparent 60%),
    radial-gradient(700px circle at 55% 110%, hsla(${h3}, 90%, 55%, 0.20), transparent 60%),
    linear-gradient(180deg, rgba(10,12,18,0.92), rgba(6,7,11,0.96))
  `;
}

function ringClasses(kind: string) {
  switch (kind) {
    case "neon":
      return {
        ringBg:
          "conic-gradient(from 180deg, rgba(0,255,204,0.95), rgba(178,82,255,0.88), rgba(255,80,170,0.82), rgba(0,255,204,0.95))",
        glow: "shadow-[0_0_40px_rgba(0,255,204,0.20)]",
      };
    case "pixel":
      return {
        ringBg:
          "conic-gradient(from 180deg, rgba(120,200,255,0.9), rgba(99,102,241,0.75), rgba(244,63,94,0.55), rgba(120,200,255,0.9))",
        glow: "shadow-[0_0_32px_rgba(120,200,255,0.16)]",
      };
    case "soft":
      return {
        ringBg: "linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))",
        glow: "shadow-[0_0_22px_rgba(255,255,255,0.06)]",
      };
    default:
      return {
        ringBg: "linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.06))",
        glow: "",
      };
  }
}

function nameplateClasses(kind: string) {
  switch (kind) {
    case "neon":
      return "bg-primary/10 border-primary/25 shadow-[0_0_30px_rgba(20,184,166,0.16)]";
    case "blueprint":
      return "bg-sky-500/10 border-sky-500/25 shadow-[0_0_28px_rgba(56,189,248,0.14)]";
    case "magic-hearts-blue":
      return "bg-blue-500/10 border-blue-500/25 shadow-[0_0_28px_rgba(59,130,246,0.14)]";
    case "soft":
    default:
      return "bg-secondary/15 border-border/40 shadow-[0_0_20px_rgba(255,255,255,0.06)]";
  }
}

function EffectLayer({ effect }: { effect: string }) {
  if (!effect || effect === "none") return null;

  if (effect === "aurora") {
    return (
      <div className="absolute inset-0 pointer-events-none">
        <div className="effect-aurora-1" />
        <div className="effect-aurora-2" />
      </div>
    );
  }

  if (effect === "bubbles") {
    return (
      <div className="absolute inset-0 pointer-events-none effect-bubbles" />
    );
  }

  if (effect === "scanlines") {
    return <div className="absolute inset-0 pointer-events-none effect-scanlines" />;
  }

  if (effect === "sparkles") {
    return <div className="absolute inset-0 pointer-events-none effect-sparkles" />;
  }

  if (effect === "butterflies") {
    return (
      <div className="absolute inset-0 pointer-events-none">
        <div className="effect-bfly b1">🦋</div>
        <div className="effect-bfly b2">🦋</div>
        <div className="effect-bfly b3">🦋</div>
      </div>
    );
  }

  return null;
}

function DecorationOverlay({ kind }: { kind: string }) {
  if (!kind || kind === "none") return null;

  if (kind === "spark") {
    return (
      <div className="absolute -inset-2 pointer-events-none opacity-90">
        <svg viewBox="0 0 120 120" className="w-full h-full">
          <defs>
            <radialGradient id="sparkG" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="rgba(20,184,166,0.65)" />
              <stop offset="55%" stopColor="rgba(99,102,241,0.35)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
          </defs>
          <circle cx="60" cy="60" r="55" fill="url(#sparkG)" />
          <circle cx="18" cy="34" r="3" fill="rgba(255,255,255,0.75)" />
          <circle cx="94" cy="28" r="2.5" fill="rgba(255,255,255,0.65)" />
          <circle cx="96" cy="88" r="3.5" fill="rgba(255,255,255,0.55)" />
        </svg>
      </div>
    );
  }

  if (kind === "hearts") {
    return (
      <div className="absolute inset-0 pointer-events-none">
        <div className="decor-heart h1">❤</div>
        <div className="decor-heart h2">❤</div>
        <div className="decor-heart h3">❤</div>
      </div>
    );
  }

  if (kind === "baker-bear") {
    return (
      <div className="absolute inset-0 pointer-events-none">
        <div className="decor-stamp top-2 right-2">🐻‍❄️</div>
        <div className="decor-stamp bottom-2 left-2 opacity-60">🥐</div>
      </div>
    );
  }

  if (kind === "coffee") {
    return (
      <div className="absolute -inset-2 pointer-events-none opacity-90">
        <svg viewBox="0 0 120 120" className="w-full h-full">
          <path d="M40 55h40c3 0 5 2 5 5v10c0 10-10 20-25 20S35 80 35 70V60c0-3 2-5 5-5z" fill="rgba(255,255,255,0.18)" />
          <path d="M84 60h6c6 0 10 4 10 10s-4 10-10 10h-7" stroke="rgba(255,255,255,0.25)" strokeWidth="4" fill="none" />
          <path d="M55 40c-6 6 6 10 0 16" stroke="rgba(255,255,255,0.25)" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M70 40c-6 6 6 10 0 16" stroke="rgba(255,255,255,0.25)" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (kind === "stars") {
    return (
      <div className="absolute inset-0 pointer-events-none">
        <div className="decor-star s1">✦</div>
        <div className="decor-star s2">✦</div>
        <div className="decor-star s3">✦</div>
        <div className="decor-star s4">✦</div>
      </div>
    );
  }

  if (kind === "leaf") {
    return (
      <div className="absolute inset-0 pointer-events-none opacity-90">
        <div className="decor-leaf">🍃</div>
      </div>
    );
  }

  return null;
}

/* ------------------ PAGE ------------------ */

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
          <Link to="/leaderboard" className="inline-flex items-center gap-2 mt-3 text-sm text-primary underline">
            <ArrowLeft className="w-4 h-4" /> Back to leaderboard
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
  const avatar = p.pfp?.trim() || p.photoURL?.trim() || dice(p.displayName || uname || "user");

  const xp = Number((s as any)?.xp || 0);
  const totalMinutes = Number((s as any)?.totalMinutes || 0);
  const weeklyMinutes = Number((s as any)?.weeklyMinutes || 0);
  const streak = Number((s as any)?.streak || 0);

  const { level, pct } = levelFromXp(xp);
  const tier = badgeTier(xp);

  const c = normalizeCosmetics(p);
  const ring = ringClasses(c.ring || "soft");

  const bannerUrl = safeUrl(c.bannerUrl || "");
  const banner = bannerUrl ? `url('${bannerUrl}')` : bannerGradient(seed);

  const copyProfileLink = async () => {
    const link = `${window.location.origin}/u/${uname}`;
    try {
      await navigator.clipboard.writeText(link);
      toast("Profile link copied ✅");
    } catch {
      toast(link);
    }
  };

  const nameplate = nameplateClasses(c.nameplate || "soft");

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5">
      {/* CSS for effects/decorations. Lightweight + mobile friendly */}
      <style>{`
        .effect-aurora-1, .effect-aurora-2 { position:absolute; inset:-35%; filter: blur(22px); opacity:.85; }
        .effect-aurora-1 {
          background:
            radial-gradient(circle at 20% 20%, rgba(20,184,166,0.28), transparent 55%),
            radial-gradient(circle at 75% 30%, rgba(99,102,241,0.22), transparent 58%),
            radial-gradient(circle at 55% 85%, rgba(244,63,94,0.14), transparent 62%);
          animation: aurMove1 9s ease-in-out infinite;
        }
        .effect-aurora-2 {
          background:
            radial-gradient(circle at 25% 70%, rgba(56,189,248,0.20), transparent 55%),
            radial-gradient(circle at 85% 25%, rgba(168,85,247,0.16), transparent 58%);
          animation: aurMove2 11s ease-in-out infinite;
        }
        @keyframes aurMove1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(12px,-10px) scale(1.06)} }
        @keyframes aurMove2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-10px,12px) scale(1.07)} }

        .effect-sparkles {
          background-image:
            radial-gradient(circle at 18% 30%, rgba(255,255,255,0.60) 0 1px, transparent 2px),
            radial-gradient(circle at 70% 20%, rgba(255,255,255,0.45) 0 1px, transparent 2px),
            radial-gradient(circle at 58% 72%, rgba(255,255,255,0.35) 0 1px, transparent 2px),
            radial-gradient(circle at 25% 82%, rgba(255,255,255,0.40) 0 1px, transparent 2px);
          animation: twinkle 2.8s ease-in-out infinite;
          opacity:.7;
        }
        @keyframes twinkle { 0%,100%{opacity:.35} 50%{opacity:.85} }

        .effect-scanlines {
          background: repeating-linear-gradient(
            to bottom,
            rgba(255,255,255,0.10),
            rgba(255,255,255,0.10) 1px,
            rgba(0,0,0,0) 3px,
            rgba(0,0,0,0) 7px
          );
          opacity:.22;
          animation: scan 2.6s linear infinite;
          mix-blend-mode: overlay;
        }
        @keyframes scan { from{background-position:0 0} to{background-position:0 44px} }

        .effect-bubbles {
          background-image:
            radial-gradient(circle at 18% 62%, rgba(255,255,255,0.18) 0 12px, transparent 13px),
            radial-gradient(circle at 72% 28%, rgba(255,255,255,0.14) 0 10px, transparent 11px),
            radial-gradient(circle at 56% 78%, rgba(255,255,255,0.10) 0 16px, transparent 17px);
          filter: blur(0.6px);
          animation: bub 6.5s ease-in-out infinite;
        }
        @keyframes bub { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }

        .effect-bfly { position:absolute; font-size:14px; opacity:.55; animation: bfly 6.8s ease-in-out infinite; }
        .effect-bfly.b1 { left:12px; top:12px; animation-delay:0ms; }
        .effect-bfly.b2 { right:14px; top:42%; animation-delay:220ms; }
        .effect-bfly.b3 { left:42%; bottom:10px; animation-delay:420ms; }
        @keyframes bfly { 0%,100%{transform:translate(0,0)} 50%{transform:translate(6px,-8px)} }

        .decor-stamp { position:absolute; font-size:18px; filter: drop-shadow(0 8px 18px rgba(0,0,0,0.35)); }
        .decor-heart { position:absolute; color: rgba(244,63,94,0.70); filter: drop-shadow(0 8px 18px rgba(0,0,0,0.35)); animation: heartFloat 4.2s ease-in-out infinite; }
        .decor-heart.h1 { left:8px; top:8px; font-size:14px; }
        .decor-heart.h2 { right:10px; top:16px; font-size:12px; animation-delay:200ms; opacity:.6; }
        .decor-heart.h3 { right:8px; bottom:8px; font-size:16px; animation-delay:400ms; opacity:.55; }
        @keyframes heartFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }

        .decor-star { position:absolute; color: rgba(255,255,255,0.70); filter: drop-shadow(0 10px 18px rgba(0,0,0,0.35)); animation: starTw 3.4s ease-in-out infinite; }
        .decor-star.s1 { left:10px; top:8px; font-size:14px; }
        .decor-star.s2 { right:8px; top:10px; font-size:12px; opacity:.65; animation-delay:160ms; }
        .decor-star.s3 { left:8px; bottom:10px; font-size:12px; opacity:.6; animation-delay:320ms; }
        .decor-star.s4 { right:12px; bottom:8px; font-size:16px; opacity:.55; animation-delay:480ms; }
        @keyframes starTw { 0%,100%{opacity:.35; transform:scale(1)} 50%{opacity:.85; transform:scale(1.06)} }

        .decor-leaf { position:absolute; right:10px; bottom:8px; font-size:18px; opacity:.6; filter: drop-shadow(0 10px 18px rgba(0,0,0,0.35)); animation: leafFloat 4.6s ease-in-out infinite; }
        @keyframes leafFloat { 0%,100%{transform:translate(0,0) rotate(0deg)} 50%{transform:translate(-4px,-6px) rotate(-6deg)} }
      `}</style>

      {/* Top mini controls */}
      <div className="flex items-center justify-between gap-3 px-1">
        <Link
          to="/leaderboard"
          className="px-3 py-2 rounded-xl bg-secondary/20 border border-border/40 text-sm hover:bg-secondary/30 transition"
        >
          <ArrowLeft className="w-4 h-4 inline mr-1" />
          Back
        </Link>

        <button
          onClick={copyProfileLink}
          className="px-3 py-2 rounded-xl bg-secondary/20 border border-border/40 text-sm hover:bg-secondary/30 transition"
          title="Copy profile link"
        >
          <Copy className="w-4 h-4 inline mr-1" />
          Share
        </button>
      </div>

      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card overflow-hidden rounded-3xl"
      >
        {/* Banner */}
        <div
          className="relative h-28 sm:h-40"
          style={{
            backgroundImage: banner,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* effects */}
          <EffectLayer effect={c.effect || "none"} />

          {/* depth overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/35 to-black/75" />
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

        {/* Body */}
        <div className="relative px-4 sm:px-6 pb-5 pt-12 sm:pt-14">
          {/* Avatar overlap */}
          <div className="absolute -top-9 sm:-top-12 left-4 sm:left-6">
            <motion.div
              whileHover={{ rotate: -1.5, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 240, damping: 18 }}
              className={`relative ${ring.glow}`}
            >
              <div
                className="absolute -inset-1 rounded-[26px]"
                style={{ background: ring.ringBg }}
              />
              <div
                className="absolute -inset-[6px] rounded-[32px] opacity-35 blur-md"
                style={{ background: ring.ringBg }}
              />
              <div className="relative bg-background rounded-[24px] p-1.5 border border-border/40 overflow-hidden">
                <img
                  src={avatar}
                  alt="avatar"
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover"
                />
                <DecorationOverlay kind={c.decoration || "none"} />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-background border border-border/40 rounded-full p-1.5">
                <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </motion.div>
          </div>

          {/* Identity row */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="min-w-0">
              {/* Nameplate */}
              <div className={`inline-block rounded-2xl border px-3 py-2 ${nameplate}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <h1 className="text-lg sm:text-xl font-extrabold truncate">
                    {p.displayName || "User"}
                  </h1>
                  {p.role === "owner" && <OwnerBadge />}
                </div>
                <p className="text-xs text-muted-foreground truncate">@{uname}</p>
              </div>

              {/* Status */}
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-secondary/15 border-border/40 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400/80" />
                <span className="text-muted-foreground">
                  {p.status?.trim() ? p.status : "Focused. Unbothered. Studying."}
                </span>
              </div>

              {/* Bio */}
              {p.bio?.trim() ? (
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-2xl">
                  {p.bio}
                </p>
              ) : null}

              {/* Member since */}
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Info className="w-4 h-4" />
                Member since {fmtMemberSince(p.createdAt)}
              </div>
            </div>

            {/* Badges compact */}
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <span className={`text-[11px] px-2.5 py-1 rounded-full border ${tier.cls}`}>
                {tier.label}
              </span>
              <span className="text-[11px] px-2.5 py-1 rounded-full border bg-secondary/20 border-border/40 text-muted-foreground">
                Lvl {level}
              </span>
              <span className="text-[11px] px-2.5 py-1 rounded-full border bg-secondary/20 border-border/40 text-muted-foreground">
                {xp} XP
              </span>
            </div>
          </div>

          {/* Quick Stats row */}
          <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-2xl border bg-secondary/10 border-border/40 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Trophy className="w-4 h-4" /> XP
              </div>
              <div className="mt-1 text-base sm:text-lg font-bold text-primary">{xp}</div>
              <div className="mt-2 h-1.5 rounded-full bg-secondary/25 overflow-hidden">
                <div className="h-full bg-primary/80" style={{ width: `${pct}%` }} />
              </div>
            </div>

            <div className="rounded-2xl border bg-secondary/10 border-border/40 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Timer className="w-4 h-4" /> Total
              </div>
              <div className="mt-1 text-base sm:text-lg font-bold text-primary">{totalMinutes}</div>
              <div className="text-[11px] text-muted-foreground">minutes</div>
            </div>

            <div className="rounded-2xl border bg-secondary/10 border-border/40 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Flame className="w-4 h-4" /> Streak
              </div>
              <div className="mt-1 text-base sm:text-lg font-bold text-primary">{streak}</div>
              <div className="text-[11px] text-muted-foreground">days</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-2">
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
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {tab === "about" ? (
          <motion.div
            key="about"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="glass-card p-5 sm:p-6 rounded-3xl"
          >
            <h3 className="font-semibold mb-3">About</h3>

            <div className="grid gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-300" />
                Weekly minutes: <span className="text-foreground font-semibold">{weeklyMinutes}</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-300" />
                Level: <span className="text-foreground font-semibold">{level}</span>
              </div>
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-sky-300" />
                Total minutes: <span className="text-foreground font-semibold">{totalMinutes}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              This layout is optimized for mobile first, so it doesn’t feel like a stretched desktop page on phones.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="stats"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="glass-card p-5 sm:p-6 rounded-3xl"
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
              Next step (optional): make these stats clickable to show weekly breakdown graphs.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
