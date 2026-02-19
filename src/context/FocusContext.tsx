import { createContext, useContext, useEffect, useRef, useState } from "react";

type Mode = "pomodoro" | "stopwatch" | null;

interface FocusState {
  mode: Mode;
  timeLeft: number;
  isRunning: boolean;
  startPomodoro: (minutes: number) => void;
  startStopwatch: () => void;
  stop: () => void;
  reset: () => void;
}

const FocusContext = createContext<FocusState | null>(null);

export function FocusProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (mode === "pomodoro" && prev <= 1) {
          clearInterval(intervalRef.current!);
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current!);
  }, [isRunning, mode]);

  const startPomodoro = (minutes: number) => {
    setMode("pomodoro");
    setTimeLeft(minutes * 60);
    setIsRunning(true);
  };

  const startStopwatch = () => {
    setMode("stopwatch");
    setTimeLeft(0);
    setIsRunning(true);
  };

  const stop = () => {
    setIsRunning(false);
  };

  const reset = () => {
    setIsRunning(false);
    setTimeLeft(0);
    setMode(null);
  };

  return (
    <FocusContext.Provider
      value={{ mode, timeLeft, isRunning, startPomodoro, startStopwatch, stop, reset }}
    >
      {children}
    </FocusContext.Provider>
  );
}

export const useFocus = () => {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error("useFocus must be used inside FocusProvider");
  return ctx;
};
