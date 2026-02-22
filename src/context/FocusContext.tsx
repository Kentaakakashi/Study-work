import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { addFocusMinutes } from "@/lib/stats";

type PomState = {
  mode: "work" | "break";
  running: boolean;
  startAt: number | null; // ms
  accumulatedMs: number; // ms already earned this session
  durationMs: number; // current mode duration
};

type SwState = {
  running: boolean;
  startAt: number | null; // ms
  accumulatedMs: number; // ms
};

type FocusContextValue = {
  pom: PomState;
  sw: SwState;

  pomElapsedMs: number;
  pomRemainingMs: number;

  swElapsedMs: number;

  startPomodoro: (mode?: "work" | "break") => void;
  pausePomodoro: () => void;
  resetPomodoro: (mode?: "work" | "break") => void;
  setPomodoroDuration: (minutes: number, mode?: "work" | "break") => void;

  startStopwatch: () => void;
  pauseStopwatch: () => void;
  resetStopwatch: () => void;

  // flush to db
  flushEarnedMinutes: () => Promise<void>;
};

const FocusContext = createContext<FocusContextValue | null>(null);

const MINUTE_MS = 60_000;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function FocusProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // ----- Pomodoro base defaults -----
  const WORK_MIN = 25;
  const BREAK_MIN = 5;

  const [pom, setPom] = useState<PomState>({
    mode: "work",
    running: false,
    startAt: null,
    accumulatedMs: 0,
    durationMs: WORK_MIN * MINUTE_MS,
  });

  // ----- Stopwatch defaults -----
  const [sw, setSw] = useState<SwState>({
    running: false,
    startAt: null,
    accumulatedMs: 0,
  });

  // Used to accumulate “earned focus minutes” across both systems
  // and flush them to Firestore via addFocusMinutes
  const [earnedMs, setEarnedMs] = useState<number>(0);

  // --- Derived times (computed) ---
  const pomElapsedMs = useMemo(() => {
    if (!pom.running || !pom.startAt) return pom.accumulatedMs;
    return pom.accumulatedMs + (Date.now() - pom.startAt);
  }, [pom]);

  const pomRemainingMs = useMemo(() => {
    const remaining = pom.durationMs - pomElapsedMs;
    return clamp(remaining, 0, pom.durationMs);
  }, [pom.durationMs, pomElapsedMs]);

  const swElapsedMs = useMemo(() => {
    if (!sw.running || !sw.startAt) return sw.accumulatedMs;
    return sw.accumulatedMs + (Date.now() - sw.startAt);
  }, [sw]);

  // --- Tick loop (forces re-render while running) ---
  useEffect(() => {
    const id = window.setInterval(() => {
      // ✅ IMPORTANT:
      // We must create a NEW object ref while running,
      // otherwise React won’t re-render and UI won’t update.
      setPom((prev) => (prev.running ? { ...prev } : prev));
      setSw((prev) => (prev.running ? { ...prev } : prev));
    }, 250);

    return () => window.clearInterval(id);
  }, []);

  // --- Pomodoro Controls ---
  const startPomodoro = (mode?: "work" | "break") => {
    setPom((prev) => {
      const nextMode = mode ?? prev.mode;
      const nextDuration =
        nextMode === "work" ? WORK_MIN * MINUTE_MS : BREAK_MIN * MINUTE_MS;

      // If switching mode, reset accumulated
      const switching = nextMode !== prev.mode;

      return {
        mode: nextMode,
        running: true,
        startAt: Date.now(),
        accumulatedMs: switching ? 0 : prev.accumulatedMs,
        durationMs: switching ? nextDuration : prev.durationMs,
      };
    });
  };

  const pausePomodoro = () => {
    setPom((prev) => {
      if (!prev.running || !prev.startAt) return prev;

      const now = Date.now();
      const gained = now - prev.startAt;
      const newAccum = prev.accumulatedMs + gained;

      // Earn minutes from actual focus time (work only)
      if (prev.mode === "work") setEarnedMs((e) => e + gained);

      return {
        ...prev,
        running: false,
        startAt: null,
        accumulatedMs: newAccum,
      };
    });
  };

  const resetPomodoro = (mode?: "work" | "break") => {
    setPom((prev) => {
      const nextMode = mode ?? prev.mode;
      const nextDuration =
        nextMode === "work" ? WORK_MIN * MINUTE_MS : BREAK_MIN * MINUTE_MS;

      return {
        mode: nextMode,
        running: false,
        startAt: null,
        accumulatedMs: 0,
        durationMs: nextDuration,
      };
    });
  };

  const setPomodoroDuration = (minutes: number, mode?: "work" | "break") => {
    const safeMin = clamp(minutes, 1, 240);
    setPom((prev) => {
      const targetMode = mode ?? prev.mode;
      const nextDuration = safeMin * MINUTE_MS;

      // If changing duration while running, keep elapsed but adjust remaining
      // We'll just update durationMs and keep state.
      return {
        ...prev,
        mode: targetMode,
        durationMs: nextDuration,
      };
    });
  };

  // --- Stopwatch Controls ---
  const startStopwatch = () => {
    setSw((prev) => {
      if (prev.running) return prev;
      return {
        ...prev,
        running: true,
        startAt: Date.now(),
      };
    });
  };

  const pauseStopwatch = () => {
    setSw((prev) => {
      if (!prev.running || !prev.startAt) return prev;

      const now = Date.now();
      const gained = now - prev.startAt;

      // Earn minutes from stopwatch focus time
      setEarnedMs((e) => e + gained);

      return {
        running: false,
        startAt: null,
        accumulatedMs: prev.accumulatedMs + gained,
      };
    });
  };

  const resetStopwatch = () => {
    setSw({
      running: false,
      startAt: null,
      accumulatedMs: 0,
    });
  };

  // --- Flush earned minutes to Firestore stats ---
  const flushEarnedMinutes = async () => {
    if (!user) return;

    // If timers still running, pause them to capture time
    // (optional safety)
    // You can remove this if you don't want auto-pause on flush:
    if (pom.running) pausePomodoro();
    if (sw.running) pauseStopwatch();

    // Convert earned ms -> full minutes (floor)
    const minutes = Math.floor(earnedMs / MINUTE_MS);
    if (minutes <= 0) return;

    // Keep remainder ms locally so you don't lose partial progress
    const remainder = earnedMs - minutes * MINUTE_MS;

    setEarnedMs(remainder);

    await addFocusMinutes(user.uid, minutes);
  };

  const value = useMemo<FocusContextValue>(
    () => ({
      pom,
      sw,
      pomElapsedMs,
      pomRemainingMs,
      swElapsedMs,

      startPomodoro,
      pausePomodoro,
      resetPomodoro,
      setPomodoroDuration,

      startStopwatch,
      pauseStopwatch,
      resetStopwatch,

      flushEarnedMinutes,
    }),
    [pom, sw, pomElapsedMs, pomRemainingMs, swElapsedMs, earnedMs, user]
  );

  return <FocusContext.Provider value={value}>{children}</FocusContext.Provider>;
}

export function useFocus() {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error("useFocus must be used inside FocusProvider");
  return ctx;
}
