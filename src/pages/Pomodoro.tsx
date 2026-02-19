import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Volume2,
  Eye,
  EyeOff,
  Sparkles,
  Square
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { addStudyMinutes } from "@/lib/stats";
import { toast } from "sonner";
import { useFocus } from "@/context/FocusContext";

const subjects = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Computer Science",
  "Biology",
  "English",
  "History"
];

const Pomodoro = () => {
  const { user } = useAuth();
  const {
    mode,
    timeLeft,
    isRunning,
    startPomodoro,
    stop,
    reset,
    setTimeLeft,
    setMode
  } = useFocus();

  const [focusMins, setFocusMins] = useState(25);
  const [breakMins, setBreakMins] = useState(5);
  const [isBreak, setIsBreak] = useState(false);
  const [subject, setSubject] = useState(subjects[0]);
  const [deepWork, setDeepWork] = useState(false);
  const [cycles, setCycles] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  const totalTime = (isBreak ? breakMins : focusMins) * 60;
  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  // Auto complete logic
  useEffect(() => {
    if (!isRunning) return;

    if (timeLeft === 0) {
      stop();

      if (!isBreak) {
        setCycles((c) => c + 1);

        if (user) {
          addStudyMinutes(user.uid, focusMins)
            .then(() => toast(`Saved +${focusMins} min ✅`))
            .catch(() =>
              toast("Couldn't save stats (check Firebase rules)")
            );
        }

        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);

        setIsBreak(true);
        setMode("pomodoro");
        setTimeLeft(breakMins * 60);
      } else {
        setIsBreak(false);
        setMode("pomodoro");
        setTimeLeft(focusMins * 60);
      }
    }
  }, [timeLeft, isRunning]);

  const handleStartPause = () => {
    if (!isRunning) {
      if (mode !== "pomodoro") {
        startPomodoro(focusMins);
      }
    } else {
      stop();
    }
  };

  const handleReset = () => {
    reset();
    setIsBreak(false);
    setTimeLeft(focusMins * 60);
  };

  const handleEndSession = async () => {
    stop();

    const studied = Math.floor(
      ((isBreak ? breakMins : focusMins) * 60 - timeLeft) / 60
    );

    if (studied > 0 && user) {
      await addStudyMinutes(user.uid, studied);
      toast(`Saved ${studied} minutes manually ✅`);
    }

    handleReset();
  };

  return (
    <div
      className={`max-w-2xl mx-auto space-y-6 transition-all duration-500 ${
        deepWork ? "scale-105" : ""
      }`}
    >
      {showCelebration && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <div className="glass-card p-10 rounded-3xl text-center">
            <Sparkles className="w-16 h-16 mx-auto text-primary mb-4" />
            <h2 className="text-3xl font-bold mb-2">
              Session Complete! 🎉
            </h2>
            <p className="text-sm text-primary mt-2">
              Cycle {cycles} done • Take a break!
            </p>
          </div>
        </motion.div>
      )}

      {/* Subject + Deep Work */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5 rounded-2xl"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Subject
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="block mt-1 px-3 py-2 rounded-lg bg-secondary/30 border border-border/50 text-sm"
            >
              {subjects.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setDeepWork(!deepWork)}
            className="px-4 py-2 rounded-xl text-sm bg-secondary/30"
          >
            {deepWork ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </motion.div>

      {/* Timer */}
      <motion.div className="glass-card p-8 rounded-2xl flex flex-col items-center">
        <div className="relative w-56 h-56 mb-8">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="5"
              strokeDasharray={`${progress * 2.76} 276`}
              strokeLinecap="round"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold font-mono">
              {String(mins).padStart(2, "0")}:
              {String(secs).padStart(2, "0")}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              {subject}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={handleReset}>
            <RotateCcw />
          </button>

          <button
            onClick={handleStartPause}
            className="glow-button rounded-full w-16 h-16 flex items-center justify-center"
          >
            {isRunning ? <Pause /> : <Play />}
          </button>

          <button onClick={handleEndSession}>
            <Square />
          </button>

          <button>
            <Volume2 />
          </button>
        </div>
      </motion.div>

      {/* Settings */}
      <motion.div className="glass-card p-5 rounded-2xl">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs uppercase">Focus (min)</label>
            <input
              type="number"
              min={1}
              max={90}
              value={focusMins}
              onChange={(e) => {
                const val = +e.target.value;
                setFocusMins(val);
                if (!isRunning) setTimeLeft(val * 60);
              }}
              className="w-full mt-1 px-3 py-2 rounded-lg"
            />
          </div>

          <div>
            <label className="text-xs uppercase">Break (min)</label>
            <input
              type="number"
              min={1}
              max={30}
              value={breakMins}
              onChange={(e) => setBreakMins(+e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Pomodoro;
