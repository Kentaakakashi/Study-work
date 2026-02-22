import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Square, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Link } from "react-router-dom";
import { addStudyMinutes } from "@/lib/stats";
import { useFocus } from "@/context/FocusContext";

const subjects = ["Mathematics", "Physics", "Chemistry", "Computer Science", "Biology", "English", "History"];

const Stopwatch = () => {
  const { user } = useAuth();
  const { swRunning, swElapsed, startStopwatch, pauseStopwatch, resetStopwatch } = useFocus();

  const [subject, setSubject] = useState(subjects[0]);
  const [notes, setNotes] = useState("");
  const [sessions, setSessions] = useState<{ subject: string; mins: number; notes: string; at: number }[]>([]);

  useEffect(() => {
    if (!user) return;
    const key = `stopwatch:sessions:${user.uid}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) setSessions(JSON.parse(raw));
    } catch {}
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const key = `stopwatch:sessions:${user.uid}`;
    try {
      localStorage.setItem(key, JSON.stringify(sessions.slice(0, 25)));
    } catch {}
  }, [sessions, user]);

  const hrs = Math.floor(swElapsed / 3600);
  const mins = Math.floor((swElapsed % 3600) / 60);
  const secs = swElapsed % 60;

  const stopAndSave = async () => {
    pauseStopwatch();

    if (swElapsed <= 0) {
      resetStopwatch();
      return;
    }

    const m = Math.max(1, Math.round(swElapsed / 60));
    setSessions((prev) => [{ subject, mins: m, notes, at: Date.now() }, ...prev]);

    if (user) {
      await addStudyMinutes(user.uid, m)
        .then(() => toast(`Saved +${m} min ✅`))
        .catch(() => toast("Couldn't save stats"));
    }

    resetStopwatch();
    setNotes("");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Focus mode switch */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-3 rounded-2xl">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold">Focus</p>
            <p className="text-xs text-muted-foreground truncate">Switch between Pomodoro and Stopwatch</p>
          </div>
          <div className="flex items-center gap-1 rounded-2xl bg-secondary/20 border border-border/40 p-1">
            <Link to="/focus/pomodoro" className="px-4 py-2 rounded-xl text-sm hover:bg-secondary/30 transition">
              Pomodoro
            </Link>
            <span className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary/20 border border-primary/30">
              Stopwatch
            </span>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 rounded-2xl">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subject</label>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="block mt-1 px-3 py-2 rounded-lg bg-secondary/30 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="glass-card p-10 rounded-2xl flex flex-col items-center"
      >
        <p className="text-7xl font-bold font-mono tabular-nums mb-8">
          {String(hrs).padStart(2, "0")}:{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </p>

        <div className="flex items-center gap-4">
          <button
            onClick={() => (swRunning ? pauseStopwatch() : startStopwatch())}
            className="glow-button rounded-full w-16 h-16 flex items-center justify-center"
          >
            {swRunning ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
          </button>

          {(swRunning || swElapsed > 0) && (
            <button
              onClick={stopAndSave}
              className="p-3 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive transition-all"
              title="Stop & save"
            >
              <Square className="w-5 h-5" />
            </button>
          )}
        </div>
      </motion.div>

      {(swRunning || swElapsed > 0) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <StickyNote className="w-4 h-4 text-primary" />
            <label className="text-sm font-medium">Session Notes</label>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What are you working on?"
            className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none h-20"
          />
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="glass-card p-5 rounded-2xl">
        <h3 className="font-semibold mb-4">Recent Sessions</h3>
        <div className="space-y-2">
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sessions saved yet.</p>
          ) : (
            sessions.map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                  {s.mins}m
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{s.subject}</p>
                  {s.notes && <p className="text-xs text-muted-foreground truncate">{s.notes}</p>}
                </div>
                <span className="text-xs text-muted-foreground">{new Date(s.at).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Stopwatch;
