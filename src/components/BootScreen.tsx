import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

type BootScreenProps = {
  onDone: () => void;
  isFirstTime?: boolean;
  totalMs?: number; // total boot duration
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function BootScreen({
  onDone,
  isFirstTime = false,
  totalMs = 5200,
}: BootScreenProps) {
  // Study-themed boot steps (readable + not “classified terminal”)
  const steps = useMemo(() => {
    const common = [
      "Opening your study desk…",
      "Loading Focus Engine",
      "Calibrating timer accuracy…",
      "Doing a lil stretch...",
      "Syncing progress & stats…",
      "Warming up AI Tutor (wake tf up man)…",
      "Connecting community feed…",
      "Final polish: removing distractions…",
      "Ready 😼📖",
    ];

    if (isFirstTime) {
      return [
        "Welcome to Study Zen gng 👋",
        "Creating your workspace…",
        "Setting up your profile…",
        "Building your first dashboard…",
        ...common,
      ];
    }

    return common;
  }, [isFirstTime]);

  const [index, setIndex] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const doneRef = useRef(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  };

  useEffect(() => {
    // Slow enough to read: step duration is derived from totalMs
    const stepMs = Math.max(420, Math.floor(totalMs / steps.length));

    const stepTimer = setInterval(() => {
      setIndex((prev) => Math.min(prev + 1, steps.length - 1));
    }, stepMs);

    const skipTimer = setTimeout(() => setCanSkip(true), 650);

    const doneTimer = setTimeout(() => {
      clearInterval(stepTimer);
      finish();
    }, totalMs);

    return () => {
      clearInterval(stepTimer);
      clearTimeout(doneTimer);
      clearTimeout(skipTimer);
    };
  }, [steps.length, totalMs]);

  const progress = clamp((index + 1) / steps.length, 0, 1);

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-6 bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Background: subtle study vibe grid + paper texture effect */}
      <div className="pointer-events-none fixed inset-0 opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,200,0,0.18),transparent_45%),radial-gradient(circle_at_70%_70%,rgba(255,255,255,0.06),transparent_40%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="relative w-full max-w-xl"
      >
        {/* Card */}
        <div className="glass-card rounded-3xl p-6 border border-border/40 backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <motion.img
                src="/Icon.ico"
                alt="Study Zen"
                className="w-14 h-14 rounded-2xl shadow-lg"
                initial={{ rotate: -2, scale: 0.95, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                transition={{ duration: 0.35 }}
              />
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight">Study Zen</h1>
                <p className="text-sm text-muted-foreground">FOCUS • PLAN • GROW</p>
              </div>
            </div>

            <button
              onClick={finish}
              disabled={!canSkip}
              className={[
                "px-4 py-2 rounded-xl text-sm font-semibold transition",
                canSkip
                  ? "bg-secondary/30 border border-border/50 hover:bg-secondary/40"
                  : "bg-secondary/10 border border-border/20 text-muted-foreground cursor-not-allowed",
              ].join(" ")}
              title={canSkip ? "Skip boot" : "Skip available in a sec…"}
            >
              Skip
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="h-2 w-full rounded-full bg-secondary/25 overflow-hidden border border-border/30">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: "0%" }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{isFirstTime ? "Setting things up…" : "Loading your workspace…"}</span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
          </div>

          {/* “Boot notes” panel */}
          <div className="mt-5 rounded-2xl bg-secondary/15 border border-border/40 p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              System notes
            </p>

            <div className="space-y-2">
              {steps.slice(0, index + 1).map((line, i) => (
                <motion.div
                  key={`${line}-${i}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className="text-sm"
                >
                  <span className="text-muted-foreground">•</span>{" "}
                  <span className="text-foreground/90">{line}</span>
                </motion.div>
              ))}

              {/* cursor */}
              <motion.div
                className="text-sm text-muted-foreground"
                animate={{ opacity: [0.25, 1, 0.25] }}
                transition={{ duration: 1.1, repeat: Infinity }}
              >
                ▋
              </motion.div>
            </div>
          </div>

          {/* Footer hint */}
          <p className="mt-4 text-xs text-muted-foreground">
            Warning ⚠️: If boot-up fails, feel free to dump the issue on lemon in our server fr, she'll fix it 🎀.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
