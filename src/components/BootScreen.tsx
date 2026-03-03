import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type BootScreenProps = {
  durationMs?: number;
  onDone: () => void;
  isFirstTime?: boolean;
};

export default function BootScreen({
  durationMs = 2400,
  onDone,
  isFirstTime = false,
}: BootScreenProps) {
  const steps = useMemo(() => {
    const base = [
      "Initializing Study Zen kernel…",
      "Mounting Focus Engine…",
      "Loading Pomodoro services…",
      "Syncing planner modules…",
      "Warming up AI Tutor…",
      "Connecting to community…",
      "Optimizing distractions (deleting them)…",
      "Boot complete ✅",
    ];

    // First time gets a slightly longer “wow new user” boot
    if (isFirstTime) {
      return [
        "Welcome to Study Zen.",
        "Creating your workspace…",
        "Provisioning your profile…",
        ...base,
      ];
    }

    return base;
  }, [isFirstTime]);

  const [i, setI] = useState(0);

  useEffect(() => {
    const stepInterval = Math.max(220, Math.floor(durationMs / steps.length));
    const t = setInterval(() => {
      setI((prev) => Math.min(prev + 1, steps.length - 1));
    }, stepInterval);

    const done = setTimeout(() => {
      clearInterval(t);
      onDone();
    }, durationMs);

    return () => {
      clearInterval(t);
      clearTimeout(done);
    };
  }, [durationMs, steps.length, onDone]);

  return (
    <div className="min-h-screen w-full bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-xl">
        {/* Logo + Title */}
        <div className="flex items-center gap-4 mb-8">
          <motion.img
            src="/Icon.ico"
            alt="Study Zen"
            className="w-14 h-14 rounded-2xl"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
          />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Study Zen</h1>
            <p className="text-sm text-white/60">FOCUS • PLAN • GROW</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden mb-6">
          <motion.div
            className="h-full bg-white/80"
            initial={{ width: "0%" }}
            animate={{ width: `${((i + 1) / steps.length) * 100}%` }}
            transition={{ ease: "easeOut", duration: 0.25 }}
          />
        </div>

        {/* Boot logs */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 font-mono text-sm leading-relaxed">
          {steps.slice(0, i + 1).map((s, idx) => (
            <motion.div
              key={`${s}-${idx}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className="text-white/85"
            >
              <span className="text-white/40">[{String(idx + 1).padStart(2, "0")}]</span>{" "}
              {s}
            </motion.div>
          ))}
          <div className="mt-3 text-white/35">_</div>
        </div>

        {/* Tiny hint */}
        <p className="mt-4 text-xs text-white/40">
          Tip: If this takes too long, blame the lemom fr, not me.
        </p>
      </div>
    </div>
  );
}
