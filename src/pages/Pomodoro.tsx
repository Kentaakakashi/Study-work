import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Play, Pause, RotateCcw, Settings2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { doc, increment, setDoc } from "firebase/firestore";
import { useFocus } from "@/context/FocusContext";
import { ensureUserProfile } from "@/lib/users";

export default function Pomodoro() {
  const { user } = useAuth();
  const { pomodoroDuration, breakDuration, isRunning, phase, timeLeft, setRunning, setPomodoroDuration } = useFocus();

  const [showSettings, setShowSettings] = useState(false);
  const [workMin, setWorkMin] = useState(Math.round(pomodoroDuration / 60));
  const [breakMin, setBreakMin] = useState(Math.round(breakDuration / 60));

  useEffect(() => {
    setWorkMin(Math.round(pomodoroDuration / 60));
    setBreakMin(Math.round(breakDuration / 60));
  }, [pomodoroDuration, breakDuration]);

  // Every minute of real running time => credit focus minutes + XP
  useEffect(() => {
    if (!user) return;

    let t: any = null;
    if (isRunning) {
      t = setInterval(async () => {
        try {
          await ensureUserProfile(user.uid);

          await setDoc(
            doc(db, "stats", user.uid),
            {
              uid: user.uid,
              totalMinutes: increment(1),
              weeklyMinutes: increment(1),
              todayMinutes: increment(1),
              xp: increment(1),
              updatedAt: new Date(),
            },
            { merge: true }
          );
        } catch {
          // silent: don’t break the timer UI if network is flaky
        }
      }, 60_000);
    }

    return () => {
      if (t) clearInterval(t);
    };
  }, [user, isRunning]);

  const mmss = useMemo(() => {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }, [timeLeft]);

  const applySettings = () => {
    const w = Math.max(1, Math.min(240, workMin));
    const b = Math.max(1, Math.min(240, breakMin));
    setPomodoroDuration(w * 60, b * 60);
    setShowSettings(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* mini sub-nav for focus section */}
      <div className="flex flex-wrap items-center gap-2">
        <Link to="/focus/pomodoro" className="px-4 py-2 rounded-2xl border border-primary/30 bg-primary/10 text-primary text-sm font-semibold">
          Pomodoro
        </Link>
        <Link to="/focus/stopwatch" className="px-4 py-2 rounded-2xl border border-border/40 hover:bg-secondary/20 transition text-sm">
          Stopwatch
        </Link>
        <Link to="/focus/techniques" className="px-4 py-2 rounded-2xl border border-border/40 hover:bg-secondary/20 transition text-sm">
          Techniques
        </Link>
        <Link to="/focus/music" className="px-4 py-2 rounded-2xl border border-border/40 hover:bg-secondary/20 transition text-sm">
          Music
        </Link>
      </div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-3xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Pomodoro</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {phase === "work" ? "Focus time" : "Break time"} · Work {Math.round(pomodoroDuration / 60)}m / Break {Math.round(breakDuration / 60)}m
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

        <div className="mt-6 flex flex-col items-center">
          <div className="text-6xl font-extrabold tracking-tight">{mmss}</div>
          <div className="mt-2 text-sm text-muted-foreground">{phase === "work" ? "Stay locked in" : "Breathe"}</div>

          <div className="mt-6 flex items-center gap-3">
            <button onClick={() => setRunning(!isRunning)} className="glow-button px-6 py-3 rounded-2xl font-semibold flex items-center gap-2">
              {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              {isRunning ? "Pause" : "Start"}
            </button>

            <button
              onClick={() => setPomodoroDuration(pomodoroDuration, breakDuration)}
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
              <button className="text-sm text-muted-foreground hover:text-foreground" onClick={() => setShowSettings(false)}>
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
      </AnimatePresence>
    </div>
  );
}
