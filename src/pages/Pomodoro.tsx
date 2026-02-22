import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Clock3, Pause, Play, RotateCcw, Settings2, SkipForward } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { addStudyMinutes, ensureStats, levelFromXp } from "@/lib/stats";
import { useFocus } from "@/context/FocusContext";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function fmt(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function Pomodoro() {
  const { user } = useAuth();
  const {
    pomo,
    pomoTimeLeft,
    setPomodoroConfig,
    startPomodoro,
    pausePomodoro,
    resetPomodoro,
    skipPomodoro,
    setPomodoroTimeLeft,
  } = useFocus();

  const [open, setOpen] = useState(false);
  const [focusMin, setFocusMin] = useState(() => Math.round(pomo.focusSec / 60));
  const [breakMin, setBreakMin] = useState(() => Math.round(pomo.breakSec / 60));

  const isFocus = pomo.mode === "focus";
  const label = isFocus ? "Focus" : "Break";

  // reward on completion (when timer reaches 0)
  const rewardedRef = useRef(false);

  useEffect(() => {
    if (!user?.uid) return;

    if (!pomo.running && pomoTimeLeft === 0 && isFocus && !rewardedRef.current) {
      rewardedRef.current = true;

      (async () => {
        try {
          await ensureStats(user.uid);
          const minutes = Math.max(1, Math.round((pomo.focusSec || 25 * 60) / 60));
          await addStudyMinutes(user.uid, minutes, { source: "pomodoro" });
          toast(`+${minutes} min logged ✅`);
        } catch (e) {
          console.error(e);
          toast("Could not log minutes");
        }
      })();
    }

    if (pomoTimeLeft > 0) rewardedRef.current = false;
  }, [pomo.running, pomoTimeLeft, isFocus, user?.uid, pomo.focusSec]);

  const progress = useMemo(() => {
    const total = Math.max(1, pomo.durationSec || (isFocus ? pomo.focusSec : pomo.breakSec));
    const done = total - pomoTimeLeft;
    return clamp(done / total, 0, 1);
  }, [pomo.durationSec, pomoTimeLeft, isFocus, pomo.focusSec, pomo.breakSec]);

  const ringStyle = useMemo(() => {
    const deg = Math.floor(progress * 360);
    return {
      background: `conic-gradient(hsl(var(--primary)) ${deg}deg, rgba(255,255,255,0.10) 0deg)`,
    } as any;
  }, [progress]);

  const canEdit = !pomo.running;

  const applySettings = () => {
    const f = clamp(Math.floor(focusMin), 5, 180);
    const b = clamp(Math.floor(breakMin), 1, 60);
    setFocusMin(f);
    setBreakMin(b);
    setPomodoroConfig(f, b);
    setOpen(false);
    toast("Settings saved ✅");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/focus/stopwatch"
            className="px-3 py-2 rounded-xl bg-secondary/20 border border-border/40 text-sm hover:bg-secondary/30 transition"
          >
            Stopwatch
          </Link>
          <div className="px-3 py-2 rounded-xl bg-primary/15 border border-primary/30 text-sm font-semibold text-primary">
            Pomodoro
          </div>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="px-3 py-2 rounded-xl bg-secondary/20 border border-border/40 text-sm hover:bg-secondary/30 transition"
        >
          <Settings2 className="w-4 h-4 inline mr-1" />
          Settings
        </button>
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 rounded-3xl"
      >
        <div className="flex items-center gap-2 mb-4">
          <Clock3 className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">Pomodoro</h2>
          <span className="text-xs text-muted-foreground">({label})</span>
        </div>

        <div className="grid md:grid-cols-[360px_1fr] gap-6 items-center">
          {/* Ring */}
          <div className="flex justify-center">
            <div className="relative w-[280px] h-[280px] rounded-full p-3" style={ringStyle}>
              <div className="w-full h-full rounded-full bg-background/70 border border-border/40 flex flex-col items-center justify-center">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-5xl font-extrabold tracking-tight">{fmt(pomoTimeLeft)}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Focus {Math.round(pomo.focusSec / 60)}m • Break {Math.round(pomo.breakSec / 60)}m
                </p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={pomo.running ? pausePomodoro : startPomodoro}
                className="glow-button px-5 py-3 rounded-2xl font-semibold"
              >
                {pomo.running ? (
                  <>
                    <Pause className="w-4 h-4 inline mr-1" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 inline mr-1" /> Start
                  </>
                )}
              </button>

              <button
                onClick={resetPomodoro}
                className="px-5 py-3 rounded-2xl bg-secondary/20 border border-border/40 font-semibold hover:bg-secondary/30 transition"
              >
                <RotateCcw className="w-4 h-4 inline mr-1" /> Reset
              </button>
            </div>

            <button
              onClick={skipPomodoro}
              className="w-full px-5 py-3 rounded-2xl bg-primary/10 border border-primary/25 font-semibold hover:bg-primary/15 transition"
            >
              <SkipForward className="w-4 h-4 inline mr-1" /> Skip to {isFocus ? "Break" : "Focus"}
            </button>

            {/* Quick adjust (only when not running) */}
            <div className="mt-4 p-4 rounded-2xl bg-secondary/15 border border-border/40">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold">Quick adjust</p>
                <p className="text-xs text-muted-foreground">{canEdit ? "Editable" : "Pause to edit"}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  disabled={!canEdit}
                  onClick={() => setPomodoroTimeLeft(Math.max(0, pomoTimeLeft - 60))}
                  className="px-4 py-3 rounded-xl bg-secondary/25 border border-border/40 text-sm disabled:opacity-40"
                >
                  -1 min
                </button>
                <button
                  disabled={!canEdit}
                  onClick={() => setPomodoroTimeLeft(pomoTimeLeft + 60)}
                  className="px-4 py-3 rounded-xl bg-secondary/25 border border-border/40 text-sm disabled:opacity-40"
                >
                  +1 min
                </button>
              </div>

              <p className="text-xs text-muted-foreground mt-3">
                This changes the current session time only.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Settings panel */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 rounded-3xl"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Pomodoro settings</h3>
            <button
              onClick={() => setOpen(false)}
              className="px-3 py-2 rounded-xl bg-secondary/20 border border-border/40 text-sm hover:bg-secondary/30 transition"
            >
              Close
            </button>
          </div>

          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <p className="text-sm font-semibold">Focus (minutes)</p>
              <input
                type="number"
                min={5}
                max={180}
                value={focusMin}
                onChange={(e) => setFocusMin(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Break (minutes)</p>
              <input
                type="number"
                min={1}
                max={60}
                value={breakMin}
                onChange={(e) => setBreakMin(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <button onClick={applySettings} className="glow-button px-5 py-3 rounded-2xl font-semibold mt-5 w-full">
            Save
          </button>
        </motion.div>
      )}
    </div>
  );
                  }
