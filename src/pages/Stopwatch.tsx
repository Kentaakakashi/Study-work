import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Square, StickyNote } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { addStudyMinutes } from "@/lib/stats";
import { toast } from "sonner";

const subjects = ["Mathematics", "Physics", "Chemistry", "Computer Science", "Biology", "English", "History"];

const Stopwatch = () => {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [subject, setSubject] = useState(subjects[0]);
  const [notes, setNotes] = useState("");
  const [sessions, setSessions] = useState<{ subject: string; mins: number; notes: string; at: number }[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);
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
    try { localStorage.setItem(key, JSON.stringify(sessions.slice(0, 25))); } catch {}
  }, [sessions, user]);


  const hrs = Math.floor(elapsed / 3600);
  const mins = Math.floor((elapsed % 3600) / 60);
  const secs = elapsed % 60;

  const stop = () => {
    setIsRunning(false);
    if (elapsed > 0) {
      const m = Math.max(1, Math.round(elapsed / 60));
      setSessions((prev) => [
        { subject, mins: m, notes, at: Date.now() },
        ...prev,
      ]);
      if (user) {
        addStudyMinutes(user.uid, m)
          .then(() => toast(`Saved +${m} min ✅`))
          .catch(() => toast("Couldn\'t save stats"));
      }
      setElapsed(0);
      setNotes("");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 rounded-2xl">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subject</label>
        <select value={subject} onChange={(e) => setSubject(e.target.value)}
          className="block mt-1 px-3 py-2 rounded-lg bg-secondary/30 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
          {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card p-10 rounded-2xl flex flex-col items-center">
        <p className="text-7xl font-bold font-mono tabular-nums mb-8">
          {String(hrs).padStart(2, "0")}:{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </p>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="glow-button rounded-full w-16 h-16 flex items-center justify-center"
          >
            {isRunning ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
          </button>
          {(isRunning || elapsed > 0) && (
            <button onClick={stop} className="p-3 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive transition-all">
              <Square className="w-5 h-5" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Notes */}
      {(isRunning || elapsed > 0) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <StickyNote className="w-4 h-4 text-primary" />
            <label className="text-sm font-medium">Session Notes</label>
          </div>
          <textarea
            value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="What are you working on?"
            className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none h-20"
          />
        </motion.div>
      )}

      {/* Recent */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5 rounded-2xl">
        <h3 className="font-semibold mb-4">Recent Sessions</h3>
        <div className="space-y-2">
          {sessions.map((s, i) => (
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
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Stopwatch;
