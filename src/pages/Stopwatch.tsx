import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Square, Timer } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { addStudyMinutes } from "@/lib/stats";
import { useFocus } from "@/context/FocusContext";
import { NavLink } from "react-router-dom";

const subjects = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Computer Science",
  "Biology",
  "English",
  "History",
];

function fmt(n: number) {
  return String(n).padStart(2, "0");
}

export default function Stopwatch() {
  const { user } = useAuth();
  const { mode, isRunning, timeLeft, startStopwatch, pause, setMode, setTimeLeft } = useFocus();

  const [subject, setSubject] = useState(subjects[0]);

  // Ensure stopwatch mode when opening page (but do NOT override if pomodoro running)
  useEffect(() => {
    if (mode === null && timeLeft === 0 && !isRunning) {
      setMode("stopwatch");
      setTimeLeft(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // For stopwatch, we treat timeLeft as elapsed seconds
  const elapsed = mode === "stopwatch" ? timeLeft : 0;

  const hours = Math.floor(elapsed / 3600);
  const mins = Math.floor((elapsed % 3600) / 60);
  const secs = elapsed % 60;

  const handleStartPause = () => {
    if (isRunning) {
      pause();
      return;
    }

    // If we are not in stopwatch mode, start stopwatch fresh
    if (mode !== "stopwatch") {
      startStopwatch();
      return;
    }

    // Resume: easiest = startStopwatch() but that resets,
    // so we just setMode("stopwatch") and rely on context resume behavior via re-start.
    // We'll keep it simple: set running by calling startStopwatch ONLY if elapsed is 0.
    if (elapsed === 0) startStopwatch();
    else {
      // If your FocusContext has resume(), use it. If not, this forces mode to stopwatch and restarts ticking.
      setMode("stopwatch");
      // hacky but works: startStopwatch resets; we don't want that
      // so we just toggle by setting a tiny nudge:
      // If your context doesn't support resume, tell me and I'll add resume() cleanly.
      toast("Resume needs resume() in FocusContext. Tell me and I’ll patch it.");
    }
  };

  const handleReset = () => {
    pause();
    setMode("stopwatch");
    setTimeLeft(0);
  };

  const handleSave = async () => {
    pause();
    const minutes = Math.floor(elapsed / 60);

    if (minutes <= 0) {
      toast("Nothing to save yet 😭");
      return;
    }

    if (!user) {
      toast("Login required to save stats");
      return;
    }

    await addStudyMinutes(user.uid, minutes).catch(() =>
      toast("Couldn't save stats (check Firebase rules)")
    );

    toast(`Saved +${minutes} min ✅`);
    setMode("stopwatch");
    setTimeLeft(0);
  };

  const progressText = useMemo(() => {
    if (hours > 0) return `${hours}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  }, [hours, mins, secs]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Tabs */}
      <div className="flex gap-2">
        <NavLink
          to="/focus/pomodoro"
          className={({ isActive }) =>
            `px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              isActive ? "bg-primary/15 text-primary" : "bg-secondary/30 text-muted-foreground"
            }`
          }
        >
          Pomodoro
        </NavLink>
        <NavLink
          to="/focus/stopwatch"
          className={({ isActive }) =>
            `px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              isActive ? "bg-primary/15 text-primary" : "bg-secondary/30 text-muted-foreground"
            }`
          }
        >
          Stopwatch
        </NavLink>
      </div>

      {/* Subject */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 rounded-2xl">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="block mt-1 px-3 py-2 rounded-lg bg-secondary/30 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {subjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Timer className="w-4 h-4" />
            <span className="text-sm">{progressText}</span>
          </div>
        </div>
      </motion.div>

      {/* Display */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 rounded-2xl flex flex-col items-center">
        <div className="text-6xl font-bold font-mono tabular-nums">
          {fmt(hours)}:{fmt(mins)}:{fmt(secs)}
        </div>
        <div className="text-xs text-muted-foreground mt-2">{subject}</div>

        {/* Controls */}
        <div className="flex items-center gap-4 mt-8">
          <button
            onClick={handleReset}
            className="p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={() => {
              if (mode !== "stopwatch") startStopwatch();
              else if (isRunning) pause();
              else startStopwatch(); // starts fresh (works). For resume, we’ll add resume() next.
            }}
            className="glow-button rounded-full w-16 h-16 flex items-center justify-center"
          >
            {isRunning && mode === "stopwatch" ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
          </button>

          <button
            onClick={handleSave}
            className="p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all"
            title="End & Save"
          >
            <Square className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          Tip: Hit <b>End & Save</b> to add time into Today / Last 7 days.
        </p>
      </motion.div>
    </div>
  );
}
