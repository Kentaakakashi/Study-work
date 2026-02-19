import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { addStudyMinutes } from "@/lib/stats";
import { toast } from "sonner";
import { useFocus } from "@/context/FocusContext";

export default function FocusEngine() {
  const { user } = useAuth();

  // We read pomodoro meta from localStorage so it survives navigation
  const { mode, isRunning, timeLeft, pause, setTimeLeft } = useFocus();
  const alreadyHandledZero = useRef(false);

  useEffect(() => {
    if (!isRunning || mode !== "pomodoro") {
      alreadyHandledZero.current = false;
      return;
    }

    if (timeLeft !== 0) {
      alreadyHandledZero.current = false;
      return;
    }

    // prevent double firing
    if (alreadyHandledZero.current) return;
    alreadyHandledZero.current = true;

    pause();

    const raw = localStorage.getItem("pomodoro:meta");
    const meta = raw ? JSON.parse(raw) : null;

    const focusMins = meta?.focusMins ?? 25;
    const breakMins = meta?.breakMins ?? 5;
    const isBreak = !!meta?.isBreak;
    const cycles = meta?.cycles ?? 0;

    // When focus ends -> save focus minutes
    if (!isBreak && user) {
      addStudyMinutes(user.uid, focusMins)
        .then(() => toast(`Pomodoro saved +${focusMins} min ✅`))
        .catch(() => toast("Pomodoro save failed (check Firebase rules)"));
    }

    // Switch phase
    const nextIsBreak = !isBreak;
    const nextTime = nextIsBreak ? breakMins * 60 : focusMins * 60;
    const nextCycles = !isBreak ? cycles + 1 : cycles;

    localStorage.setItem(
      "pomodoro:meta",
      JSON.stringify({
        focusMins,
        breakMins,
        isBreak: nextIsBreak,
        cycles: nextCycles,
      })
    );

    setTimeLeft(nextTime);
  }, [timeLeft, isRunning, mode, user, pause, setTimeLeft]);

  return null;
}
