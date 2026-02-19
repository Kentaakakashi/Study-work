import React, { createContext, useContext, useEffect, useRef, useState } from "react";

type FocusMode = "pomodoro" | "stopwatch" | null;

type FocusCtx = {
  mode: FocusMode;
  isRunning: boolean;
  timeLeft: number; // seconds (pomodoro) OR elapsed seconds (stopwatch)
  setMode: React.Dispatch<React.SetStateAction<FocusMode>>;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  startPomodoro: (minutes: number) => void;
  startStopwatch: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
};

const FocusContext = createContext<FocusCtx | null>(null);

export function FocusProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<FocusMode>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const tickRef = useRef<number | null>(null);

  // restore state on load (so page switches/refresh don’t kill it)
  useEffect(() => {
    const raw = localStorage.getItem("focus_state_v1");
    if (!raw) return;
    try {
      const s = JSON.parse(raw);
      setMode(s.mode ?? null);
      setIsRunning(!!s.isRunning);
      setTimeLeft(Number.isFinite(s.timeLeft) ? s.timeLeft : 0);
    } catch {
      // ignore
    }
  }, []);

  // persist state
  useEffect(() => {
    localStorage.setItem(
      "focus_state_v1",
      JSON.stringify({ mode, isRunning, timeLeft })
    );
  }, [mode, isRunning, timeLeft]);

  // ticking logic
  useEffect(() => {
    if (!isRunning || !mode) return;

    // clear any previous
    if (tickRef.current) window.clearInterval(tickRef.current);

    tickRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (mode === "stopwatch") return prev + 1;
        // pomodoro countdown
        return Math.max(prev - 1, 0);
      });
    }, 1000);

    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [isRunning, mode]);

  const startPomodoro = (minutes: number) => {
    setMode("pomodoro");
    setTimeLeft(Math.max(1, minutes) * 60);
    setIsRunning(true);
  };

  const startStopwatch = () => {
    setMode("stopwatch");
    setTimeLeft(0);
    setIsRunning(true);
  };

  const pause = () => setIsRunning(false);
  const resume = () => {
    if (mode) setIsRunning(true);
  };

  const reset = () => {
    setIsRunning(false);
    setMode(null);
    setTimeLeft(0);
    localStorage.removeItem("focus_state_v1");
  };

  return (
    <FocusContext.Provider
      value={{
        mode,
        isRunning,
        timeLeft,
        setMode,
        setTimeLeft,
        startPomodoro,
        startStopwatch,
        pause,
        resume,
        reset,
      }}
    >
      {children}
    </FocusContext.Provider>
  );
}

export function useFocus() {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error("useFocus must be used inside <FocusProvider>");
  return ctx;
}
