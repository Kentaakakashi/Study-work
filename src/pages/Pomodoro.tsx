import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Clock3, Pause, Play, RotateCcw, Settings2, SkipForward } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
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
  const {
    pom,
    pomRemainingMs,
    startPomodoro,
    pausePomodoro,
    resetPomodoro,
    setPomodoroDuration,
    flushEarnedMinutes,
  } = useFocus();

  const [open, setOpen] = useState(false);

  // Settings are per-mode (work/break)
  const currentMin = Math.max(1, Math.round(pom.durationMs / 60_000));
  const [workMin, setWorkMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);

  const isWork = pom.mode === "work";
  const label = isWork ? "Focus" : "Break";

  const remainingSec = Math.ceil(pomRemainingMs / 1000);

  const progress = useMemo(() => {
    const dur = Math.max(1, pom.durationMs);
    const remain = clamp(pomRemainingMs, 0, dur);
    return 1 - remain / dur;
  }, [pom.durationMs, pomRemainingMs]);

  const ringStyle = useMemo(() => {
    const deg = clamp(progress, 0, 1) * 360;
    return {
      background: `conic-gradient(hsl(var(--primary)) ${deg}deg, hsl(var(--border)) ${deg}deg)`,
    } as React.CSSProperties;
  }, [progress]);

  const applySettings = async () => {
    const w = clamp(Number(workMin), 1, 240);
    const b = clamp(Number(breakMin), 1, 240);

    // Apply to both modes
    setPomodoroDuration(w, "work");
    setPomodoroDuration(b, "break");

    setOpen(false);
    toast("Settings saved ✅");
  };

  const skipMode = async () => {
    const next = pom.mode === "work" ? "break" : "work";
    resetPomodoro(next);
    toast(next === "work" ? "Back to Focus ✅" : "Break time ✅");
  };

  const saveProgress = async () => {
    try {
      await flushEarnedMinutes();
      toast("Progress saved ✅");
    } catch {
      toast("Couldn't save progress");
    }
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

        <div className="flex items-center gap-2">
          <button
            onClick={saveProgress}
            className="px-3 py-2 rounded-xl bg-secondary/20 border border-border/40 text-sm hover:bg-secondary/30 transition"
          >
            Save
          </button>

          <button
            onClick={() => setOpen((v) => !v)}
            className="px-3 py-2 rounded-xl bg-secondary/20 border border-border/40 text-sm hover:bg-secondary/30 transition"
          >
            <Settings2 className="w-4 h-4 inline mr-1" />
            Settings
          </button>
        </div>
      </div>

      {/* Main Card */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-3xl">
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
                <p className="text-5xl font-extrabold tracking-tight">{fmt(remainingSec)}</p>
                <p className="text-xs text-muted-foreground mt-2">Duration {currentMin}m</p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={pom.running ? pausePomodoro : () => startPomodoro(pom.mode)}
                className="glow-button px-5 py-3 rounded-2xl font-semibold"
              >
                {pom.running ? (
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
                onClick={() => resetPomodoro(pom.mode)}
                className="px-5 py-3 rounded-2xl bg-secondary/20 border border-border/40 font-semibold hover:bg-secondary/30 transition"
              >
                <RotateCcw className="w-4 h-4 inline mr-1" /> Reset
              </button>
            </div>

            <button
              onClick={skipMode}
              className="w-full px-5 py-3 rounded-2xl bg-primary/10 border border-primary/25 font-semibold hover:bg-primary/15 transition"
            >
              <SkipForward className="w-4 h-4 inline mr-1" />
              {pom.mode === "work" ? "Start Break" : "Back to Focus"}
            </button>

            <div className="glass-card p-4 rounded-2xl">
              <p className="text-sm font-semibold mb-2">Quick adjust</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPomodoroDuration(Math.max(1, currentMin - 1), pom.mode)}
                  className="px-4 py-3 rounded-xl bg-secondary/25 border border-border/40 text-sm"
                >
                  -1 min
                </button>
                <button
                  onClick={() => setPomodoroDuration(currentMin + 1, pom.mode)}
                  className="px-4 py-3 rounded-xl bg-secondary/25 border border-border/40 text-sm"
                >
                  +1 min
                </button>
              </div>

              <p className="text-xs text-muted-foreground mt-3">This changes the current mode duration only.</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Settings panel */}
      {open && (
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-3xl">
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
                min={1}
                max={240}
                value={workMin}
                onChange={(e) => setWorkMin(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Break (minutes)</p>
              <input
                type="number"
                min={1}
                max={240}
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
