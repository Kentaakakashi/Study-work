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
  const { sw, swElapsedMs, startStopwatch, pauseStopwatch, resetStopwatch, flushEarnedMinutes } = useFocus();

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

  const totalSec = Math.floor(swElapsedMs / 1000);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  const stopAndSave = async () => {
    pauseStopwatch();

    if (totalSec <= 0) {
      resetStopwatch();
      return;
    }

    const m = Math.max(1, Math.round(totalSec / 60));
    setSessions((prev) => [{ subject, mins: m, notes, at: Date.now() }, ...prev]);

    if (user) {
      await addStudyMinutes(user.uid, m)
        .then(() => toast(`Saved +${m} min ✅`))
        .catch(() => toast("Couldn't save stats"));
    }

    await flushEarnedMinutes().catch(() => {});
    resetStopwatch();
    setNotes("");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-3 rounded-2xl">
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/focus/pomodoro" className="px-4 py-2 rounded-xl text-sm hover:bg-secondary/30 transition">
            Pomodoro
          </Link>
          <span className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary/20 border border-primary/30">
            Stopwatch
          </span>
          <Link to="/focus/techniques" className="px-4 py-2 rounded-xl text-sm hover:bg-secondary/30 transition">
            Techniques
          </Link>
          <Link to="/focus/music" className="px-4 py-2 rounded-xl text-sm hover:bg-secondary/30 transition">
            Music
          </Link>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-3xl">
        <p className="text-sm text-muted-foreground mb-2">Elapsed</p>
        <p className="text-5xl font-extrabold tracking-tight tabular-nums">
          {String(hrs).padStart(2, "0")}:{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </p>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <button
            onClick={sw.running ? pauseStopwatch : startStopwatch}
            className="glow-button px-5 py-3 rounded-2xl font-semibold"
          >
            {sw.running ? (
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
            onClick={stopAndSave}
            className="px-5 py-3 rounded-2xl bg-primary/10 border border-primary/25 font-semibold hover:bg-primary/15 transition"
          >
            <Square className="w-4 h-4 inline mr-1" /> Stop
          </button>

          <button
            onClick={resetStopwatch}
            className="px-5 py-3 rounded-2xl bg-secondary/20 border border-border/40 font-semibold hover:bg-secondary/30 transition"
          >
            Reset
          </button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-3xl">
        <div className="flex items-center gap-2 mb-3">
          <StickyNote className="w-4 h-4 text-primary" />
          <p className="font-semibold">Session details</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <p className="text-sm font-semibold">Subject</p>
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
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Notes</p>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you work on?"
              className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      </motion.div>

      {sessions.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-3xl">
          <p className="font-semibold mb-3">Recent sessions</p>
          <div className="space-y-2">
            {sessions.slice(0, 10).map((s) => (
              <div key={s.at} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-secondary/20 border border-border/40">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{s.subject}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.notes || "No notes"}</p>
                </div>
                <div className="text-sm font-semibold">{s.mins}m</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Stopwatch;
