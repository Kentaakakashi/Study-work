import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Coffee, Volume2, Eye, EyeOff, Sparkles, Square } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { addStudyMinutes } from "@/lib/stats";
import { useFocus } from "@/context/FocusContext";

const subjects = ["Mathematics", "Physics", "Chemistry", "Computer Science", "Biology", "English", "History"];
const UI_KEY = "pomodoro_ui_v1";

type UIState = {
  focusMins: number;
  breakMins: number;
  isBreak: boolean;
  subject: string;
  cycles: number;
  deepWork: boolean;
};

const Pomodoro = () => {
  const { user } = useAuth();
  const {
    pomoRunning,
    pomoTimeLeft,
    startPomodoro,
    pausePomodoro,
    resumePomodoro,
    resetPomodoro,
    setPomodoroTimeLeft,
  } = useFocus();

  const [focusMins, setFocusMins] = useState(25);
  const [breakMins, setBreakMins] = useState(5);
  const [isBreak, setIsBreak] = useState(false);
  const [subject, setSubject] = useState(subjects[0]);
  const [deepWork, setDeepWork] = useState(false);
  const [cycles, setCycles] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  // Load UI prefs (phase, durations) so switching pages doesn't reset the *UI*
  useEffect(() => {
    try {
      const raw = localStorage.getItem(UI_KEY);
      if (!raw) return;
      const s = JSON.parse(raw) as Partial<UIState>;
      if (typeof s.focusMins === "number") setFocusMins(Math.max(1, Math.floor(s.focusMins)));
      if (typeof s.breakMins === "number") setBreakMins(Math.max(1, Math.floor(s.breakMins)));
      if (typeof s.isBreak === "boolean") setIsBreak(s.isBreak);
      if (typeof s.subject === "string" && s.subject) setSubject(s.subject);
      if (typeof s.cycles === "number") setCycles(Math.max(0, Math.floor(s.cycles)));
      if (typeof s.deepWork === "boolean") setDeepWork(s.deepWork);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const s: UIState = { focusMins, breakMins, isBreak, subject, cycles, deepWork };
    try {
      localStorage.setItem(UI_KEY, JSON.stringify(s));
    } catch {}
  }, [focusMins, breakMins, isBreak, subject, cycles, deepWork]);

  // If no timer set yet, seed it once
  useEffect(() => {
    if (!pomoRunning && pomoTimeLeft === 0) {
      setPomodoroTimeLeft((isBreak ? breakMins : focusMins) * 60);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalSeconds = useMemo(() => (isBreak ? breakMins : focusMins) * 60, [isBreak, breakMins, focusMins]);
  const progress = totalSeconds > 0 ? ((totalSeconds - pomoTimeLeft) / totalSeconds) * 100 : 0;

  const mins = Math.floor(pomoTimeLeft / 60);
  const secs = pomoTimeLeft % 60;

  // detect phase end (when it hits 0)
  const prevLeftRef = useRef<number>(pomoTimeLeft);
  useEffect(() => {
    const prev = prevLeftRef.current;
    prevLeftRef.current = pomoTimeLeft;

    if (prev > 0 && pomoTimeLeft === 0) {
      // phase ended
      if (!isBreak) {
        // finished focus
        setCycles((c) => c + 1);

        if (user) {
          addStudyMinutes(user.uid, focusMins)
            .then(() => toast(`Saved +${focusMins} min ✅`))
            .catch(() => toast("Couldn't save stats"));
        }

        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 2200);

        setIsBreak(true);
        setPomodoroTimeLeft(breakMins * 60);
      } else {
        // finished break -> back to focus
        setIsBreak(false);
        setPomodoroTimeLeft(focusMins * 60);
      }
    }
  }, [pomoTimeLeft, isBreak, user, focusMins, breakMins, setPomodoroTimeLeft]);

  const onToggle = () => {
    if (pomoRunning) {
      pausePomodoro();
      return;
    }

    // If timer is 0, start fresh with current phase duration
    if (pomoTimeLeft === 0) {
      const m = isBreak ? breakMins : focusMins;
      setPomodoroTimeLeft(m * 60);
      startPomodoro(m);
      return;
    }

    // Resume normal
    resumePomodoro();
  };

  const onReset = () => {
    pausePomodoro();
    setIsBreak(false);
    setPomodoroTimeLeft(focusMins * 60);
  };

  const onEndAndSave = async () => {
    pausePomodoro();

    // minutes studied in *current phase*
    const studiedMins = Math.floor((totalSeconds - pomoTimeLeft) / 60);

    // only count focus time as study time
    if (!isBreak && studiedMins > 0 && user) {
      await addStudyMinutes(user.uid, studiedMins).catch(() => toast("Couldn't save stats"));
      toast(`Saved ${studiedMins} min ✅`);
    } else {
      toast("Ended session");
    }

    // reset to focus phase
    setIsBreak(false);
    setPomodoroTimeLeft(focusMins * 60);
    resetPomodoro();
  };

  return (
    <div className={`max-w-2xl mx-auto space-y-6 transition-all duration-500 ${deepWork ? "scale-[1.02]" : ""}`}>
      {showCelebration && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <div className="glass-card p-10 rounded-3xl text-center">
            <Sparkles className="w-16 h-16 mx-auto text-primary mb-4" />
            <h2 className="text-3xl font-bold mb-2">Session Complete! 🎉</h2>
            <p className="text-sm text-primary mt-2">Cycle {cycles} done • Take a break!</p>
          </div>
        </motion.div>
      )}

      {/* Subject + Deep Work */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="block mt-1 px-3 py-2 rounded-lg bg-secondary/30 border border-border/50 text-sm"
            >
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setDeepWork(!deepWork)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              deepWork
                ? "bg-primary/10 text-primary border border-primary/30"
                : "bg-secondary/30 text-muted-foreground border border-border/50"
            }`}
          >
            {deepWork ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            Deep Work
          </button>
        </div>
      </motion.div>

      {/* Timer */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="glass-card p-8 rounded-2xl flex flex-col items-center"
      >
        <div className="flex items-center gap-2 mb-6">
          {isBreak ? <Coffee className="w-5 h-5 text-warning" /> : <Play className="w-5 h-5 text-primary" />}
          <span className={`text-sm font-semibold uppercase tracking-wide ${isBreak ? "text-warning" : "text-primary"}`}>
            {isBreak ? "Break Time" : "Focus Time"}
          </span>
          <span className="text-xs text-muted-foreground ml-2">Cycle {cycles + 1}</span>
        </div>

        <div className="relative w-56 h-56 mb-8">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke={isBreak ? "hsl(var(--warning))" : "hsl(var(--primary))"}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${progress * 2.76} 276`}
              className="transition-all duration-700"
              style={{
                filter: `drop-shadow(0 0 8px ${isBreak ? "hsl(var(--warning) / 0.35)" : "hsl(var(--primary) / 0.35)"})`,
              }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold font-mono tabular-nums">
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </span>
            <span className="text-xs text-muted-foreground mt-1">{subject}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onReset}
            className="p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button onClick={onToggle} className="glow-button rounded-full w-16 h-16 flex items-center justify-center">
            {pomoRunning ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
          </button>

          <button
            onClick={onEndAndSave}
            className="p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all"
            title="End & save (focus only)"
          >
            <Square className="w-5 h-5" />
          </button>

          <button className="p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all">
            <Volume2 className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Settings */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="glass-card p-5 rounded-2xl"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Focus (min)</label>
            <input
              type="number"
              min={1}
              max={90}
              value={focusMins}
              onChange={(e) => {
                const v = Math.max(1, Math.floor(+e.target.value || 1));
                setFocusMins(v);
                if (!pomoRunning && !isBreak) setPomodoroTimeLeft(v * 60);
              }}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary/30 border border-border/50 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Break (min)</label>
            <input
              type="number"
              min={1}
              max={30}
              value={breakMins}
              onChange={(e) => {
                const v = Math.max(1, Math.floor(+e.target.value || 1));
                setBreakMins(v);
                if (!pomoRunning && isBreak) setPomodoroTimeLeft(v * 60);
              }}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary/30 border border-border/50 text-sm"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Pomodoro;
