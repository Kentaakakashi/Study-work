import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Coffee, Volume2, Eye, EyeOff, Sparkles, Square } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Link } from "react-router-dom";
import { addStudyMinutes } from "@/lib/stats";
import { useFocus } from "@/context/FocusContext";

const subjects = ["Mathematics", "Physics", "Chemistry", "Computer Science", "Biology", "English", "History"];

const sounds = {
  start: "/sounds/start.mp3",
  end: "/sounds/end.mp3",
  break: "/sounds/break.mp3",
};

const Pomodoro = () => {
  const { user } = useAuth();
  const { pomRunning, pomMode, pomSecondsLeft, startPomodoro, pausePomodoro, resetPomodoro, setPomSubject } = useFocus();

  const [subject, setSubject] = useState(subjects[0]);

  // settings
  const [focusMin, setFocusMin] = useState(25);
  const [shortBreakMin, setShortBreakMin] = useState(5);
  const [longBreakMin, setLongBreakMin] = useState(15);
  const [sessionsBeforeLong, setSessionsBeforeLong] = useState(4);

  // ui
  const [soundOn, setSoundOn] = useState(true);
  const [distractionShield, setDistractionShield] = useState(false);

  // session tracking
  const [completedFocusSessions, setCompletedFocusSessions] = useState(0);
  const [totalFocusSecondsToday, setTotalFocusSecondsToday] = useState(0);
  const [celebrate, setCelebrate] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const mm = Math.floor(pomSecondsLeft / 60);
  const ss = pomSecondsLeft % 60;

  const modeLabel = useMemo(() => {
    if (pomMode === "focus") return "Focus";
    if (pomMode === "short") return "Short Break";
    return "Long Break";
  }, [pomMode]);

  const modeDesc = useMemo(() => {
    if (pomMode === "focus") return "Lock in. Earn XP + minutes.";
    if (pomMode === "short") return "Quick recharge. You earned it.";
    return "Big rest. Hydrate and reset.";
  }, [pomMode]);

  const shieldText = useMemo(() => {
    if (!distractionShield) return "Off";
    if (pomMode !== "focus") return "Off (Break)";
    return "On";
  }, [distractionShield, pomMode]);

  useEffect(() => {
    setPomSubject(subject);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject]);

  const playSound = (type: keyof typeof sounds) => {
    if (!soundOn) return;
    try {
      const a = new Audio(sounds[type]);
      a.volume = 0.6;
      a.play().catch(() => {});
      audioRef.current = a;
    } catch {}
  };

  // When timer hits 0, do transitions + saving
  useEffect(() => {
    if (!pomRunning) return;
    if (pomSecondsLeft > 0) return;

    // timer finished
    if (pomMode === "focus") {
      setCompletedFocusSessions((v) => v + 1);
      const added = focusMin * 60;
      setTotalFocusSecondsToday((v) => v + added);

      // save minutes to stats
      if (user) {
        addStudyMinutes(user.uid, focusMin).catch(() => {});
      }

      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 1100);

      playSound("end");
      toast(`Focus complete ✅ +${focusMin} min logged`);
    } else {
      playSound("break");
      toast("Break complete ✅");
    }

    // next mode logic
    const nextIsFocus = pomMode !== "focus";
    if (nextIsFocus) {
      // go back to focus
      startPomodoro("focus", focusMin * 60);
    } else {
      // leaving focus -> pick break
      const nextFocusCount = completedFocusSessions + 1;
      const isLong = nextFocusCount % sessionsBeforeLong === 0;
      startPomodoro(isLong ? "long" : "short", (isLong ? longBreakMin : shortBreakMin) * 60);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pomSecondsLeft]);

  const onStartPause = () => {
    if (pomRunning) {
      pausePomodoro();
      return;
    }

    // start based on mode
    const initial =
      pomMode === "focus" ? focusMin * 60 : pomMode === "short" ? shortBreakMin * 60 : longBreakMin * 60;

    startPomodoro(pomMode, initial);
    if (pomMode === "focus") playSound("start");
    toast(pomMode === "focus" ? "Focus started 🔥" : "Break started 💤");
  };

  const onReset = () => {
    resetPomodoro(pomMode === "focus" ? focusMin * 60 : pomMode === "short" ? shortBreakMin * 60 : longBreakMin * 60);
    toast("Reset ✅");
  };

  const totalMinutesToday = Math.round(totalFocusSecondsToday / 60);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Celebration glow */}
      {celebrate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none"
        >
          <div className="absolute inset-0 bg-primary/10 blur-3xl" />
        </motion.div>
      )}

      {/* Focus mode switch */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-3 rounded-2xl">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold">Focus</p>
            <p className="text-xs text-muted-foreground truncate">Switch between Pomodoro and Stopwatch</p>
          </div>
          <div className="flex items-center gap-1 rounded-2xl bg-secondary/20 border border-border/40 p-1">
            <span className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary/20 border border-primary/30">
              Pomodoro
            </span>
            <Link to="/focus/stopwatch" className="px-4 py-2 rounded-xl text-sm hover:bg-secondary/30 transition">
              Stopwatch
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Subject + Deep Work */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 rounded-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-bold">Pomodoro</h3>
            <p className="text-sm text-muted-foreground">Pick a subject so minutes + XP are tracked correctly.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundOn((v) => !v)}
              className="px-3 py-2 rounded-xl bg-secondary/20 border border-border/40 text-sm hover:bg-secondary/30 transition"
              title="Toggle sound"
            >
              <Volume2 className="w-4 h-4 inline mr-1" />
              {soundOn ? "On" : "Off"}
            </button>

            <button
              onClick={() => setDistractionShield((v) => !v)}
              className="px-3 py-2 rounded-xl bg-secondary/20 border border-border/40 text-sm hover:bg-secondary/30 transition"
              title="Distraction shield (visual)"
            >
              {distractionShield ? <EyeOff className="w-4 h-4 inline mr-1" /> : <Eye className="w-4 h-4 inline mr-1" />}
              {shieldText}
            </button>
          </div>
        </div>

        <div className="mt-4 grid sm:grid-cols-[1fr_auto] gap-3">
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <button
              onClick={() => startPomodoro("focus", focusMin * 60)}
              className={`px-4 py-3 rounded-xl text-sm border transition ${
                pomMode === "focus" ? "bg-primary/20 border-primary/30" : "bg-secondary/20 border-border/40 hover:bg-secondary/30"
              }`}
            >
              Focus
            </button>
            <button
              onClick={() => startPomodoro("short", shortBreakMin * 60)}
              className={`px-4 py-3 rounded-xl text-sm border transition ${
                pomMode === "short" ? "bg-primary/20 border-primary/30" : "bg-secondary/20 border-border/40 hover:bg-secondary/30"
              }`}
            >
              Short
            </button>
            <button
              onClick={() => startPomodoro("long", longBreakMin * 60)}
              className={`px-4 py-3 rounded-xl text-sm border transition ${
                pomMode === "long" ? "bg-primary/20 border-primary/30" : "bg-secondary/20 border-border/40 hover:bg-secondary/30"
              }`}
            >
              Long
            </button>
          </div>
        </div>
      </motion.div>

      {/* Timer */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="glass-card p-10 rounded-2xl flex flex-col items-center relative overflow-hidden"
      >
        {distractionShield && pomMode === "focus" && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] pointer-events-none" />
        )}

        <div className="text-center mb-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{modeLabel}</p>
          <p className="text-sm text-muted-foreground">{modeDesc}</p>
        </div>

        <motion.p
          key={`${pomMode}-${pomSecondsLeft}`}
          initial={{ scale: 0.98, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-7xl font-bold font-mono tabular-nums mb-8"
        >
          {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
        </motion.p>

        <div className="flex items-center gap-4">
          <button onClick={onStartPause} className="glow-button rounded-full w-16 h-16 flex items-center justify-center">
            {pomRunning ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
          </button>

          <button
            onClick={onReset}
            className="p-3 rounded-xl bg-secondary/20 hover:bg-secondary/30 border border-border/40 transition-all"
            title="Reset"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {pomRunning && (
            <button
              onClick={() => {
                pausePomodoro();
                resetPomodoro(pomMode === "focus" ? focusMin * 60 : pomMode === "short" ? shortBreakMin * 60 : longBreakMin * 60);
                toast("Stopped");
              }}
              className="p-3 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive transition-all"
              title="Stop"
            >
              <Square className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
          <Coffee className="w-4 h-4" />
          <span>
            Completed focus sessions: <span className="text-foreground font-semibold">{completedFocusSessions}</span>
          </span>
          <span className="opacity-40">•</span>
          <span>
            Today: <span className="text-foreground font-semibold">{totalMinutesToday} min</span>
          </span>
        </div>
      </motion.div>

      {/* Settings */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5 rounded-2xl">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-semibold">Timer settings</h3>
            <p className="text-sm text-muted-foreground">Customize your intervals.</p>
          </div>

          <button
            onClick={() => {
              setFocusMin(25);
              setShortBreakMin(5);
              setLongBreakMin(15);
              setSessionsBeforeLong(4);
              toast("Defaults restored ✅");
            }}
            className="px-3 py-2 rounded-xl bg-secondary/20 border border-border/40 text-sm hover:bg-secondary/30 transition"
          >
            <Sparkles className="w-4 h-4 inline mr-1" /> Default
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-secondary/15 border border-border/40">
            <label className="text-xs text-muted-foreground">Focus (min)</label>
            <input
              type="number"
              min={1}
              value={focusMin}
              onChange={(e) => setFocusMin(Math.max(1, Number(e.target.value || 1)))}
              className="mt-1 w-full px-3 py-2 rounded-xl bg-secondary/30 border border-border/50 text-sm"
            />
          </div>

          <div className="p-4 rounded-2xl bg-secondary/15 border border-border/40">
            <label className="text-xs text-muted-foreground">Short break (min)</label>
            <input
              type="number"
              min={1}
              value={shortBreakMin}
              onChange={(e) => setShortBreakMin(Math.max(1, Number(e.target.value || 1)))}
              className="mt-1 w-full px-3 py-2 rounded-xl bg-secondary/30 border border-border/50 text-sm"
            />
          </div>

          <div className="p-4 rounded-2xl bg-secondary/15 border border-border/40">
            <label className="text-xs text-muted-foreground">Long break (min)</label>
            <input
              type="number"
              min={1}
              value={longBreakMin}
              onChange={(e) => setLongBreakMin(Math.max(1, Number(e.target.value || 1)))}
              className="mt-1 w-full px-3 py-2 rounded-xl bg-secondary/30 border border-border/50 text-sm"
            />
          </div>

          <div className="p-4 rounded-2xl bg-secondary/15 border border-border/40">
            <label className="text-xs text-muted-foreground">Sessions before long</label>
            <input
              type="number"
              min={1}
              value={sessionsBeforeLong}
              onChange={(e) => setSessionsBeforeLong(Math.max(1, Number(e.target.value || 1)))}
              className="mt-1 w-full px-3 py-2 rounded-xl bg-secondary/30 border border-border/50 text-sm"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Pomodoro;
