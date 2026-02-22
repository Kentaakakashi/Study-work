import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { useFocus } from "@/context/FocusContext";
import { useAuth } from "@/lib/auth";
import { addStudyMinutes } from "@/lib/stats";
import { toast } from "sonner";

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

  const [minutes, setMinutes] = useState(25);

  const mm = Math.floor(pomoTimeLeft / 60);
  const ss = pomoTimeLeft % 60;

  // when timer hits 0
  useEffect(() => {
    if (!pomoRunning && pomoTimeLeft === 0) return;

    if (pomoRunning && pomoTimeLeft === 0) {
      toast("Focus complete ✅");

      if (user) {
        addStudyMinutes(user.uid, minutes).catch(() => {});
      }

      resetPomodoro();
    }
  }, [pomoTimeLeft]);

  const handleStartPause = () => {
    if (pomoRunning) {
      pausePomodoro();
    } else {
      if (pomoTimeLeft === 0) {
        startPomodoro(minutes);
      } else {
        resumePomodoro();
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Mode Switch */}
      <div className="glass-card p-3 rounded-2xl flex justify-between items-center">
        <span className="font-semibold">Focus Mode</span>
        <div className="flex gap-2">
          <span className="px-4 py-2 rounded-xl bg-primary/20 border border-primary/30 text-sm">
            Pomodoro
          </span>
          <Link
            to="/focus/stopwatch"
            className="px-4 py-2 rounded-xl text-sm bg-secondary/20 border border-border/40 hover:bg-secondary/30 transition"
          >
            Stopwatch
          </Link>
        </div>
      </div>

      {/* Timer */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-10 rounded-2xl flex flex-col items-center"
      >
        <p className="text-7xl font-mono font-bold mb-8">
          {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
        </p>

        <div className="flex items-center gap-4">
          <button
            onClick={handleStartPause}
            className="glow-button rounded-full w-16 h-16 flex items-center justify-center"
          >
            {pomoRunning ? (
              <Pause className="w-7 h-7" />
            ) : (
              <Play className="w-7 h-7 ml-1" />
            )}
          </button>

          <button
            onClick={() => {
              resetPomodoro();
              setPomodoroTimeLeft(minutes * 60);
            }}
            className="p-3 rounded-xl bg-secondary/20 border border-border/40 hover:bg-secondary/30 transition"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Duration Setting */}
      <div className="glass-card p-5 rounded-2xl">
        <label className="text-sm font-medium">Duration (minutes)</label>
        <input
          type="number"
          min={1}
          value={minutes}
          onChange={(e) => setMinutes(Math.max(1, Number(e.target.value)))}
          className="mt-2 w-full px-3 py-2 rounded-xl bg-secondary/30 border border-border/50"
        />
      </div>
    </div>
  );
};

export default Pomodoro;
