import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Play, Pause, RotateCcw, Settings2, Square } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { addStudyLog } from "@/lib/stats";
import { useFocus } from "@/context/FocusContext";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function Pomodoro() {
  const { user } = useAuth();
  const {
    workMinutes,
    breakMinutes,
    isRunning,
    phase,
    timeLeft,
    startPomodoro,
    pausePomodoro,
    resetPomodoro,
    setPomodoroDuration,
    pomodoroWorkedSeconds,
    resetPomodoroWorkedSeconds,
  } = useFocus();

  const [showSettings, setShowSettings] = useState(false);
  const [workMinDraft, setWorkMinDraft] = useState(workMinutes);
  const [breakMinDraft, setBreakMinDraft] = useState(breakMinutes);

  useEffect(() => {
    setWorkMinDraft(workMinutes);
    setBreakMinDraft(breakMinutes);
  }, [workMinutes, breakMinutes]);

  const totalPhaseSeconds = phase === "work" ? workMinutes * 60 : breakMinutes * 60;

  const mmss = useMemo(() => {
    const safe = Number.isFinite(timeLeft) ? Math.max(0, timeLeft) : 0;
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }, [timeLeft]);

  const progress = useMemo(() => {
    if (!Number.isFinite(timeLeft) || totalPhaseSeconds <= 0) return 0;
    return clamp((totalPhaseSeconds - timeLeft) / totalPhaseSeconds, 0, 1);
  }, [timeLeft, totalPhaseSeconds]);

  const radius = 96;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  const applySettings = () => {
    const w = clamp(Number(workMinDraft) || 25, 1, 240);
    const b = clamp(Number(breakMinDraft) || 5, 1, 240);
    setPomodoroDuration(w, b);
    setShowSettings(false);
  };

  const stopAndSave = async () => {
    pausePomodoro();

    const earnedMinutes = Math.max(1, Math.floor(pomodoroWorkedSeconds / 60));
    if (!user || pomodoroWorkedSeconds < 60) {
      resetPomodoro();
      return;
    }

    try {
      await addStudyLog(user.uid, {
        mode: "pomodoro",
        subject: "Focus Session",
        minutes: earnedMinutes,
        notes: `Pomodoro session • Work ${workMinutes}m / Break ${breakMinutes}m`,
        workMinutes,
        breakMinutes,
      });

      toast(`Saved ${earnedMinutes} min pomodoro log ✅`);
    } catch {
      toast("Couldn’t save pomodoro log");
    }

    resetPomodoroWorkedSeconds();
    resetPomodoro();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          to="/focus/pomodoro"
          className="px-4 py-2 rounded-2xl border border-primary/30 bg-primary/10 text-primary text-sm font-semibold"
        >
          Pomodoro
        </Link>
        <Link
          to="/focus/stopwatch"
          className="px-4 py-2 rounded-2xl border border-border/40 hover:bg-secondary/20 transition text-sm"
        >
          Stopwatch
        </Link>
        <Link
          to="/focus/techniques"
          className="px-4 py-2 rounded-2xl border border-border/40 hover:bg-secondary/20 transition text-sm"
        >
          Techniques
        </Link>
        <Link
          to="/focus/music"
          className="px-4 py-2 rounded-2xl border border-border/40 hover:bg-secondary/20 transition text-sm"
        >
          Music
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Pomodoro</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {phase === "work" ? "Focus time" : "Break time"} · Work {workMinutes}m / Break {breakMinutes}m
            </p>
          </div>

          <button
            onClick={() => setShowSettings((v) => !v)}
            className="p-3 rounded-2xl border border-border/40 hover:bg-secondary/20 transition"
            title="Settings"
          >
            <Settings2 className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-8 flex flex-col items-center">
          <div className="relative h-[240px] w-[240px]">
            <svg viewBox="0 0 240 240" className="absolute inset-0 h-full w-full -rotate-90">
              <circle
                cx="120"
                cy="120"
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="14"
              />
              <circle
                cx="120"
                cy="120"
                r={radius}
                fill="none"
                stroke="currentColor"
                className="text-primary drop-shadow-[0_0_12px_rgba(250,179,0,0.45)]"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
              />
            </svg>

            <div className="absolute inset-4 rounded-full bg-background/25 border border-border/30 backdrop-blur-sm flex flex-col items-center justify-center text-center">
              <div className="text-5xl font-extrabold tracking-tight">{mmss}</div>
              <div className="mt-2 text-sm text-muted-foreground">
                {phase === "work" ? "Stay locked in" : "Breathe"}
              </div>
            </div>
          </div>

          <div className="mt-3 text-xs text-muted-foreground">
            Logged so far: {Math.floor(pomodoroWorkedSeconds / 60)} min
          </div>

          <div className="mt-6 flex items-center gap-3 flex-wrap justify-center">
            <button
              onClick={() => (isRunning ? pausePomodoro() : startPomodoro())}
              className="glow-button px-6 py-3 rounded-2xl font-semibold flex items-center gap-2"
            >
              {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              {isRunning ? "Pause" : "Start"}
            </button>

            <button
              onClick={stopAndSave}
              className="px-6 py-3 rounded-2xl bg-primary/10 border border-primary/25 font-semibold hover:bg-primary/15 transition flex items-center gap-2"
              title="Stop and save log"
            >
              <Square className="w-5 h-5" />
              Stop
            </button>

            <button
              onClick={resetPomodoro}
              className="px-6 py-3 rounded-2xl border border-border/40 hover:bg-secondary/20 transition font-semibold flex items-center gap-2"
              title="Reset"
            >
              <RotateCcw className="w-5 h-5" />
              Reset
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="glass-card p-6 rounded-3xl border border-border/40"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold">Timer Settings</h3>
              <button
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setShowSettings(false)}
              >
                Close
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold">Work (minutes)</p>
                <input
                  type="number"
                  min={1}
                  max={240}
                  value={workMinDraft}
                  onChange={(e) => setWorkMinDraft(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Break (minutes)</p>
                <input
                  type="number"
                  min={1}
                  max={240}
                  value={breakMinDraft}
                  onChange={(e) => setBreakMinDraft(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <button
              onClick={applySettings}
              className="glow-button px-5 py-3 rounded-2xl font-semibold mt-5 w-full"
            >
              Save
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
            }
