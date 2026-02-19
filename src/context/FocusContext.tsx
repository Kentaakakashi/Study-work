import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

/**
 * FocusContext v2:
 * Pomodoro and Stopwatch are completely independent
 * Both can run at the same time
 * Uses timestamps so timers survive page switches/backgrounding
 */

type PomodoroState = {
  running: boolean;
  endAtMs: number | null;
  timeLeftSec: number;
};

type StopwatchState = {
  running: boolean;
  startedAtMs: number | null;
  elapsedSec: number;
};

type FocusCtx = {
  // pomodoro
  pomoRunning: boolean;
  pomoTimeLeft: number;
  startPomodoro: (minutes: number) => void;
  pausePomodoro: () => void;
  resumePomodoro: () => void;
  resetPomodoro: () => void;
  setPomodoroTimeLeft: (seconds: number) => void;

  // stopwatch
  swRunning: boolean;
  swElapsed: number;
  startStopwatch: () => void;
  pauseStopwatch: () => void;
  resetStopwatch: () => void;
};

const FocusContext = createContext<FocusCtx | null>(null);

const STORAGE_KEY = "focus_state_v2";

function clampInt(n: unknown, fallback = 0) {
  const x = Number(n);
  if (!Number.isFinite(x)) return fallback;
  return Math.max(0, Math.floor(x));
}

export function FocusProvider({ children }: { children: React.ReactNode }) {
  const [pomo, setPomo] = useState<PomodoroState>({
    running: false,
    endAtMs: null,
    timeLeftSec: 0,
  });

  const [sw, setSw] = useState<StopwatchState>({
    running: false,
    startedAtMs: null,
    elapsedSec: 0,
  });

  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const s = JSON.parse(raw);
      const pomoRaw = s?.pomo ?? {};
      const swRaw = s?.sw ?? {};

      setPomo({
        running: !!pomoRaw.running,
        endAtMs: typeof pomoRaw.endAtMs === "number" ? pomoRaw.endAtMs : null,
        timeLeftSec: clampInt(pomoRaw.timeLeftSec, 0),
      });

      setSw({
        running: !!swRaw.running,
        startedAtMs: typeof swRaw.startedAtMs === "number" ? swRaw.startedAtMs : null,
        elapsedSec: clampInt(swRaw.elapsedSec, 0),
      });
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ pomo, sw }));
  }, [pomo, sw]);

  useEffect(() => {
    const anyRunning = pomo.running || sw.running;
    if (!anyRunning) {
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = null;
      return;
    }

    if (tickRef.current) window.clearInterval(tickRef.current);

    tickRef.current = window.setInterval(() => {
      const now = Date.now();

      setPomo((prev) => {
        if (!prev.running || !prev.endAtMs) return prev;
        const left = Math.max(0, Math.ceil((prev.endAtMs - now) / 1000));
        if (left === 0) return { running: false, endAtMs: null, timeLeftSec: 0 };
        if (left !== prev.timeLeftSec) return { ...prev, timeLeftSec: left };
        return prev;
      });

      setSw((prev) => prev); // stopwatch UI uses derived memo
    }, 500);

    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [pomo.running, sw.running]);

  const pomoTimeLeft = useMemo(() => {
    if (!pomo.running) return pomo.timeLeftSec;
    if (!pomo.endAtMs) return pomo.timeLeftSec;
    return Math.max(0, Math.ceil((pomo.endAtMs - Date.now()) / 1000));
  }, [pomo]);

  const swElapsed = useMemo(() => {
    if (!sw.running) return sw.elapsedSec;
    if (!sw.startedAtMs) return sw.elapsedSec;
    const extra = Math.max(0, Math.floor((Date.now() - sw.startedAtMs) / 1000));
    return sw.elapsedSec + extra;
  }, [sw]);

  const startPomodoro = (minutes: number) => {
    const total = Math.max(1, Math.floor(minutes)) * 60;
    setPomo({ running: true, endAtMs: Date.now() + total * 1000, timeLeftSec: total });
  };

  const pausePomodoro = () => {
    setPomo((prev) => {
      if (!prev.running) return prev;
      const left = Math.max(0, Math.ceil(((prev.endAtMs ?? Date.now()) - Date.now()) / 1000));
      return { running: false, endAtMs: null, timeLeftSec: left };
    });
  };

  const resumePomodoro = () => {
    setPomo((prev) => {
      if (prev.running) return prev;
      const left = Math.max(0, prev.timeLeftSec);
      if (left <= 0) return prev;
      return { running: true, endAtMs: Date.now() + left * 1000, timeLeftSec: left };
    });
  };

  const resetPomodoro = () => setPomo({ running: false, endAtMs: null, timeLeftSec: 0 });

  const setPomodoroTimeLeft = (seconds: number) => {
    const s = Math.max(0, Math.floor(seconds));
    setPomo((prev) =>
      prev.running ? { running: true, endAtMs: Date.now() + s * 1000, timeLeftSec: s } : { ...prev, timeLeftSec: s }
    );
  };

  const startStopwatch = () => {
    setSw((prev) => (prev.running ? prev : { ...prev, running: true, startedAtMs: Date.now() }));
  };

  const pauseStopwatch = () => {
    setSw((prev) => {
      if (!prev.running) return prev;
      const extra = prev.startedAtMs ? Math.max(0, Math.floor((Date.now() - prev.startedAtMs) / 1000)) : 0;
      return { running: false, startedAtMs: null, elapsedSec: prev.elapsedSec + extra };
    });
  };

  const resetStopwatch = () => setSw({ running: false, startedAtMs: null, elapsedSec: 0 });

  const value: FocusCtx = {
    pomoRunning: pomo.running,
    pomoTimeLeft,
    startPomodoro,
    pausePomodoro,
    resumePomodoro,
    resetPomodoro,
    setPomodoroTimeLeft,

    swRunning: sw.running,
    swElapsed,
    startStopwatch,
    pauseStopwatch,
    resetStopwatch,
  };

  return <FocusContext.Provider value={value}>{children}</FocusContext.Provider>;
}

export function useFocus() {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error("useFocus must be used inside <FocusProvider>");
  return ctx;
}
