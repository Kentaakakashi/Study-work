import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { addStudyMinutes } from "@/lib/stats";

type Phase = "work" | "break";

type StopwatchState = {
  running: boolean;
  startAt: number | null;
  accumulatedMs: number;
};

type FocusContextValue = {
  workMinutes: number;
  breakMinutes: number;
  phase: Phase;
  isRunning: boolean;
  timeLeft: number;

  setRunning: (running: boolean) => void;
  startPomodoro: () => void;
  pausePomodoro: () => void;
  resetPomodoro: () => void;
  setPomodoroDuration: (workMinutes: number, breakMinutes: number) => void;

  sw: StopwatchState;
  swElapsedMs: number;
  startStopwatch: () => void;
  pauseStopwatch: () => void;
  resetStopwatch: () => void;
  flushEarnedMinutes: () => Promise<void>;
};

const FocusContext = createContext<FocusContextValue | null>(null);

const STORAGE_KEYS = {
  work: "focus:workMinutes",
  break: "focus:breakMinutes",
  phase: "focus:phase",
  running: "focus:isRunning",
  timeLeft: "focus:timeLeft",
  sw: "focus:stopwatch",
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function readNumber(key: string, fallback: number) {
  try {
    const raw = localStorage.getItem(key);
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}

function readPhase(): Phase {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.phase);
    return raw === "break" ? "break" : "work";
  } catch {
    return "work";
  }
}

function readBool(key: string, fallback: boolean) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === "true") return true;
    if (raw === "false") return false;
    return fallback;
  } catch {
    return fallback;
  }
}

function readStopwatch(): StopwatchState {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.sw);
    if (!raw) return { running: false, startAt: null, accumulatedMs: 0 };
    const parsed = JSON.parse(raw);
    return {
      running: !!parsed.running,
      startAt: typeof parsed.startAt === "number" ? parsed.startAt : null,
      accumulatedMs: typeof parsed.accumulatedMs === "number" ? parsed.accumulatedMs : 0,
    };
  } catch {
    return { running: false, startAt: null, accumulatedMs: 0 };
  }
}

export function FocusProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [workMinutes, setWorkMinutes] = useState(() => clamp(readNumber(STORAGE_KEYS.work, 25), 1, 240));
  const [breakMinutes, setBreakMinutes] = useState(() => clamp(readNumber(STORAGE_KEYS.break, 5), 1, 240));
  const [phase, setPhase] = useState<Phase>(() => readPhase());
  const [isRunning, setIsRunning] = useState(() => readBool(STORAGE_KEYS.running, false));
  const [timeLeft, setTimeLeft] = useState(() => {
    const w = clamp(readNumber(STORAGE_KEYS.work, 25), 1, 240);
    const b = clamp(readNumber(STORAGE_KEYS.break, 5), 1, 240);
    const fallback = readPhase() === "work" ? w * 60 : b * 60;
    return Math.max(0, readNumber(STORAGE_KEYS.timeLeft, fallback));
  });

  const [sw, setSw] = useState<StopwatchState>(() => readStopwatch());
  const [nowTick, setNowTick] = useState(Date.now());
  const awardLockRef = useRef(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.work, String(workMinutes));
  }, [workMinutes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.break, String(breakMinutes));
  }, [breakMinutes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.phase, phase);
  }, [phase]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.running, String(isRunning));
  }, [isRunning]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.timeLeft, String(timeLeft));
  }, [timeLeft]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.sw, JSON.stringify(sw));
  }, [sw]);

  useEffect(() => {
    if (!isRunning) return;

    const id = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev > 1) return prev - 1;

        if (phase === "work") {
          if (user?.uid && !awardLockRef.current) {
            awardLockRef.current = true;
            addStudyMinutes(user.uid, workMinutes)
              .catch(() => {})
              .finally(() => {
                awardLockRef.current = false;
              });
          }
          setPhase("break");
          return breakMinutes * 60;
        }

        setPhase("work");
        return workMinutes * 60;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [isRunning, phase, workMinutes, breakMinutes, user?.uid]);

  useEffect(() => {
    if (!sw.running) return;

    const id = window.setInterval(() => {
      setNowTick(Date.now());
    }, 250);

    return () => window.clearInterval(id);
  }, [sw.running]);

  const startPomodoro = () => setIsRunning(true);
  const pausePomodoro = () => setIsRunning(false);

  const resetPomodoro = () => {
    setIsRunning(false);
    setPhase("work");
    setTimeLeft(workMinutes * 60);
  };

  const setPomodoroDuration = (nextWorkMinutes: number, nextBreakMinutes: number) => {
    const safeWork = clamp(Math.floor(nextWorkMinutes), 1, 240);
    const safeBreak = clamp(Math.floor(nextBreakMinutes), 1, 240);

    setWorkMinutes(safeWork);
    setBreakMinutes(safeBreak);
    setIsRunning(false);
    setPhase("work");
    setTimeLeft(safeWork * 60);
  };

  const setRunning = (running: boolean) => {
    setIsRunning(running);
  };

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
      const gained = Date.now() - prev.startAt;
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

  const swElapsedMs = useMemo(() => {
    if (!sw.running || !sw.startAt) return sw.accumulatedMs;
    return sw.accumulatedMs + (nowTick - sw.startAt);
  }, [sw, nowTick]);

  const flushEarnedMinutes = async () => {
    return;
  };

  const value = useMemo<FocusContextValue>(
    () => ({
      workMinutes,
      breakMinutes,
      phase,
      isRunning,
      timeLeft,
      setRunning,
      startPomodoro,
      pausePomodoro,
      resetPomodoro,
      setPomodoroDuration,
      sw,
      swElapsedMs,
      startStopwatch,
      pauseStopwatch,
      resetStopwatch,
      flushEarnedMinutes,
    }),
    [workMinutes, breakMinutes, phase, isRunning, timeLeft, sw, swElapsedMs]
  );

  return <FocusContext.Provider value={value}>{children}</FocusContext.Provider>;
}

export function useFocus() {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error("useFocus must be used inside FocusProvider");
  return ctx;
}
