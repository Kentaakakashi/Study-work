import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Coffee, Volume2, Eye, EyeOff, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { addStudyMinutes } from "@/lib/stats";
import { toast } from "sonner";

const subjects = ["Mathematics", "Physics", "Chemistry", "Computer Science", "Biology", "English", "History"];

const Pomodoro = () => {
  const { user } = useAuth();
  const [focusMins, setFocusMins] = useState(25);
  const [breakMins, setBreakMins] = useState(5);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [timeLeft, setTimeLeft] = useState(focusMins * 60);
  const [subject, setSubject] = useState(subjects[0]);
  const [deepWork, setDeepWork] = useState(false);
  const [cycles, setCycles] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalTime = (isBreak ? breakMins : focusMins) * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      if (!isBreak) {
        setCycles((c) => c + 1);
        // Save focus minutes to Firestore stats (Study Zone behavior)
        if (user) {
          try {
            addStudyMinutes(user.uid, focusMins)
              .then(() => toast(`Saved +${focusMins} min ✅`))
              .catch(() => toast("Couldn\'t save stats (check Firebase rules)"));
          } catch {
            // ignore
          }
        }
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
        setIsBreak(true);
        setTimeLeft(breakMins * 60);
      } else {
        setIsBreak(false);
        setTimeLeft(focusMins * 60);
      }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, timeLeft, isBreak, focusMins, breakMins]);

  const reset = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(focusMins * 60);
  };

  return (
    <div className={`max-w-2xl mx-auto space-y-6 transition-all duration-500 ${deepWork ? "scale-105" : ""}`}>
      {/* Celebration */}
      {showCelebration && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <div className="glass-card p-10 rounded-3xl text-center">
            <Sparkles className="w-16 h-16 mx-auto text-primary mb-4" />
            <h2 className="text-3xl font-bold mb-2">Session Complete! 🎉</h2>
            <p className="text-muted-foreground">+{focusMins * 2} XP earned</p>
            <p className="text-sm text-primary mt-2">Cycle {cycles} done • Take a break!</p>
          </div>
        </motion.div>
      )}

      {/* Subject + Deep Work */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="block mt-1 px-3 py-2 rounded-lg bg-secondary/30 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button
            onClick={() => setDeepWork(!deepWork)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              deepWork ? "bg-primary/10 text-primary border border-primary/30" : "bg-secondary/30 text-muted-foreground border border-border/50"
            }`}
          >
            {deepWork ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            Deep Work
          </button>
        </div>
      </motion.div>

      {/* Timer */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-8 rounded-2xl flex flex-col items-center">
        {/* Phase indicator */}
        <div className="flex items-center gap-2 mb-6">
          {isBreak ? <Coffee className="w-5 h-5 text-warning" /> : <Play className="w-5 h-5 text-primary" />}
          <span className={`text-sm font-semibold uppercase tracking-wide ${isBreak ? "text-warning" : "text-primary"}`}>
            {isBreak ? "Break Time" : "Focus Time"}
          </span>
          <span className="text-xs text-muted-foreground ml-2">Cycle {cycles + 1}</span>
        </div>

        {/* Ring */}
        <div className="relative w-56 h-56 mb-8">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
            <circle cx="50" cy="50" r="44" fill="none"
              stroke={isBreak ? "hsl(var(--warning))" : "hsl(var(--primary))"}
              strokeWidth="5" strokeLinecap="round"
              strokeDasharray={`${progress * 2.76} 276`}
              className="transition-all duration-1000"
              style={{ filter: `drop-shadow(0 0 8px ${isBreak ? "hsl(var(--warning) / 0.4)" : "hsl(var(--primary) / 0.4)"})` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold font-mono tabular-nums">
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </span>
            <span className="text-xs text-muted-foreground mt-1">{subject}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button onClick={reset} className="p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all">
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="glow-button rounded-full w-16 h-16 flex items-center justify-center"
          >
            {isRunning ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
          </button>
          <button className="p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all">
            <Volume2 className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Settings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5 rounded-2xl">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Focus (min)</label>
            <input
              type="number" min={1} max={90} value={focusMins}
              onChange={(e) => { setFocusMins(+e.target.value); if (!isRunning) setTimeLeft(+e.target.value * 60); }}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary/30 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Break (min)</label>
            <input
              type="number" min={1} max={30} value={breakMins}
              onChange={(e) => setBreakMins(+e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary/30 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Pomodoro;
