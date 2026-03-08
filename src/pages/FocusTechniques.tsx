import { motion } from "framer-motion";
import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFocus } from "@/context/FocusContext";

type Technique = {
  id: string;
  name: string;
  work: number;
  rest: number;
  desc: string;
};

export default function FocusTechniques() {
  const { setPomodoroDuration } = useFocus();
  const nav = useNavigate();

  const techniques: Technique[] = useMemo(
    () => [
      { id: "pomodoro", name: "Pomodoro (25 / 5)", work: 25, rest: 5, desc: "Classic. Short sprints, quick resets." },
      { id: "fiftytwo", name: "52 / 17", work: 52, rest: 17, desc: "Longer focus blocks. Great for deep tasks." },
      { id: "ultradian", name: "Ultradian (90 / 20)", work: 90, rest: 20, desc: "Big brain mode. Best for reading / practice sets." },
      { id: "fortyfive", name: "45 / 15", work: 45, rest: 15, desc: "Balanced. Doesn’t feel like you’re speedrunning life." },
      { id: "deepwork", name: "Deep Work (60 / 10)", work: 60, rest: 10, desc: "One hour of silence. Then breathe." },
      { id: "thirty", name: "30 / 10", work: 30, rest: 10, desc: "Softer pace for burnout days." },
    ],
    []
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Link to="/focus/pomodoro" className="px-4 py-2 rounded-2xl border border-border/40 hover:bg-secondary/20 transition text-sm">
          Pomodoro
        </Link>
        <Link to="/focus/stopwatch" className="px-4 py-2 rounded-2xl border border-border/40 hover:bg-secondary/20 transition text-sm">
          Stopwatch
        </Link>
        <span className="px-4 py-2 rounded-2xl border border-primary/30 bg-primary/10 text-primary text-sm font-semibold">
          Techniques
        </span>
        <Link to="/focus/music" className="px-4 py-2 rounded-2xl border border-border/40 hover:bg-secondary/20 transition text-sm">
          Music
        </Link>
      </div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-3xl">
        <h2 className="text-lg font-bold">Focus Techniques</h2>
        <p className="text-xs text-muted-foreground mt-2">
          Pick a technique and it’ll set the Pomodoro timer correctly. 
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-3">
        {techniques.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(0.25, i * 0.04) }}
            className="glass-card-hover rounded-3xl border border-border/40 p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold truncate">{t.name}</p>
                <p className="text-sm text-muted-foreground mt-1">{t.desc}</p>
                <p className="text-xs text-muted-foreground mt-3">
                  <span className="font-semibold text-foreground/90">Work</span>: {t.work}m ·{" "}
                  <span className="font-semibold text-foreground/90">Break</span>: {t.rest}m
                </p>
              </div>

              <button
                className="px-4 py-2 rounded-2xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition"
                onClick={() => {
                  setPomodoroDuration(t.work, t.rest);
                  nav("/focus/pomodoro");
                }}
              >
                Apply
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
