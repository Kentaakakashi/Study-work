import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { addStudyMinutes, ensureStats } from "@/lib/stats";
import { useAuth } from "@/lib/auth";

type PomodoroMode = "focus" | "break";

type PomodoroState = {
  running: boolean;
  mode: PomodoroMode;
  startAtMs: number | null;
  endAtMs: number | null;
  durationSec: number; // current session duration (focus/break)
  focusSec: number;
  breakSec: number;
  cyclesDone: number; // how many focus sessions completed
};

type StopwatchState = {
  running: boolean;
  startedAtMs: number | null;
  elapsedMs: number; // accumulated when paused
};

type FocusContextType = {
  pomo: PomodoroState;
  pomoTimeLeft: number; // seconds
  setPomodoroConfig: (focusMin: number, breakMin: number) => void;
  startPomodoro: () => void;
  pausePomodoro: () => void;
  resetPomodoro: () => void;
  skipPomodoro: () => void;
  setPomodoroTimeLeft: (sec: number) => void;

  sw: StopwatchState;
  swElapsed: number; // seconds
  swStart: () => void;
  swPause: () => void;
  swReset: () => void;
};

const FocusContext = createContext<FocusContextType | null>(null);

export function FocusProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [pomo, setPomo] = useState<PomodoroState>({
    running: false,
    mode: "focus",
    startAtMs: null,
    endAtMs: null,
    durationSec: 25 * 60,
    focusSec: 25 * 60,
    breakSec: 5 * 60,
    cyclesDone: 0,
  });

  const [sw, setSw] = useState<StopwatchState>({
    running: false,
    startedAtMs: null,
    elapsedMs: 0,
  });

  // ✅ This is the key: a ticking value that forces UI updates while timers run
  const [now, setNow] = useState(() => Date.now());

  const tickRef = useRef<number | null>(null);

  // Keep a light tick going while ANY timer is running (UI updates)
  useEffect(() => {
    const shouldTick = pomo.running || sw.running;
    if (!shouldTick) {
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = null;
      return;
    }

    if (!tickRef.current) {
      tickRef.current = window.setInterval(() => {
        setNow(Date.now());
      }, 500);
    }

    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [pomo.running, sw.running]);

  // Pomodoro time left (seconds)
  const pomoTimeLeft = useMemo(() => {
    if (!pomo.running || !pomo.endAtMs) return pomo.durationSec;
    const left = Math.ceil((pomo.endAtMs - now) / 1000);
    return Math.max(0, left);
  }, [pomo, now]);

  // Stopwatch elapsed (seconds)
  const swElapsed = useMemo(() => {
    const base = Math.floor(sw.elapsedMs / 1000);
    if (!sw.running || !sw.startedAtMs) return base;
    const live = Math.floor((now - sw.startedAtMs) / 1000);
    return Math.max(0, base + live);
  }, [sw, now]);

  // ---- Pomodoro actions ----
  const setPomodoroConfig = (focusMin: number, breakMin: number) => {
    const f = Math.max(1, Math.floor(focusMin)) * 60;
    const b = Math.max(1, Math.floor(breakMin)) * 60;
    setPomo((prev) => {
      const nextMode: PomodoroMode = prev.mode;
      const nextDuration = nextMode === "focus" ? f : b;
      return {
        ...prev,
        focusSec: f,
        breakSec: b,
        durationSec: nextDuration,
        ...(prev.running
          ? {
              startAtMs: Date.now(),
              endAtMs: Date.now() + nextDuration * 1000,
            }
          : {}),
      };
    });
  };

  const setPomodoroTimeLeft = (sec: number) => {
    const s = Math.max(0, Math.floor(sec));
    setPomo((prev) => {
      if (!prev.running) {
        return { ...prev, durationSec: s };
      }
      const nowMs = Date.now();
      return { ...prev, durationSec: s, startAtMs: nowMs, endAtMs: nowMs + s * 1000 };
    });
  };

  const startPomodoro = () => {
    setPomo((prev) => {
      if (prev.running) return prev;
      const nowMs = Date.now();
      const duration = prev.durationSec || (prev.mode === "focus" ? prev.focusSec : prev.breakSec);
      return { ...prev, running: true, startAtMs: nowMs, endAtMs: nowMs + duration * 1000, durationSec: duration };
    });
  };

  const pausePomodoro = () => {
    setPomo((prev) => {
      if (!prev.running) return prev;
      const left = prev.endAtMs ? Math.ceil((prev.endAtMs - Date.now()) / 1000) : prev.durationSec;
      return { ...prev, running: false, startAtMs: null, endAtMs: null, durationSec: Math.max(0, left) };
    });
  };

  const resetPomodoro = () => {
    setPomo((prev) => {
      const duration = prev.mode === "focus" ? prev.focusSec : prev.breakSec;
      return { ...prev, running: false, startAtMs: null, endAtMs: null, durationSec: duration };
    });
  };

  const skipPomodoro = async () => {
    // When a focus session completes, we award minutes + XP
    // (Your UI probably handles "completion" logic elsewhere; keeping this as a manual skip)
    const wasFocus = pomo.mode === "focus";
    if (user?.uid && wasFocus) {
      const minutes = Math.max(1, Math.round((pomo.durationSec || pomo.focusSec) / 60));
      try {
        await ensureStats(user.uid);
        await addStudyMinutes(user.uid, minutes, { source: "pomodoro" });
      } catch (e) {
        console.error("skipPomodoro award failed:", e);
      }
    }

    setPomo((prev) => {
      const nextMode: PomodoroMode = prev.mode === "focus" ? "break" : "focus";
      const nextDuration = nextMode === "focus" ? prev.focusSec : prev.breakSec;
      const nextCycles = prev.mode === "focus" ? prev.cyclesDone + 1 : prev.cyclesDone;
      return {
        ...prev,
        mode: nextMode,
        cyclesDone: nextCycles,
        running: false,
        startAtMs: null,
        endAtMs: null,
        durationSec: nextDuration,
      };
    });
  };

  // ---- Stopwatch actions ----
  const swStart = () => {
    setSw((prev) => {
      if (prev.running) return prev;
      return { ...prev, running: true, startedAtMs: Date.now() };
    });
  };

  const swPause = () => {
    setSw((prev) => {
      if (!prev.running || !prev.startedAtMs) return { ...prev, running: false, startedAtMs: null };
      const add = Date.now() - prev.startedAtMs;
      return { running: false, startedAtMs: null, elapsedMs: prev.elapsedMs + add };
    });
  };

  const swReset = () => {
    setSw({ running: false, startedAtMs: null, elapsedMs: 0 });
  };

  const value: FocusContextType = {
    pomo,
    pomoTimeLeft,
    setPomodoroConfig,
    startPomodoro,
    pausePomodoro,
    resetPomodoro,
    skipPomodoro,
    setPomodoroTimeLeft,

    sw,
    swElapsed,
    swStart,
    swPause,
    swReset,
  };

  return <FocusContext.Provider value={value}>{children}</FocusContext.Provider>;
}

export function useFocus() {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error("useFocus must be used inside FocusProvider");
  return ctx;
    }
