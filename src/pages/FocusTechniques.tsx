import { motion } from "framer-motion";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useFocus } from "@/context/FocusContext";

type Technique = {
  id: string;
  name: string;
  work: number; // seconds
  rest: number; // seconds
  desc: string;
};

const MIN = 60;

export default function FocusTechniques() {
  const { setPomodoroDuration } = useFocus();
  const nav = useNavigate();

  const techniques: Technique[] = useMemo(
    () => [
      { id: "pomodoro", name: "Pomodoro (25 / 5)", work: 25 * MIN, rest: 5 * MIN, desc: "Classic. Short sprints, quick resets." },
      { id: "fiftytwo", name: "52 / 17", work: 52 * MIN, rest: 17 * MIN, desc: "Longer focus blocks. Great for deep tasks." },
      { id: "ultradian", name: "Ultradian (90 / 20)", work: 90 * MIN, rest: 20 * MIN, desc: "Big brain mode. Best for reading / practice sets." },
      { id: "fortyfive", name: "45 / 15", work: 45 * MIN, rest: 15 * MIN, desc: "Balanced. Doesn’t feel like you’re speedrunning life." },
      { id: "deepwork", name: "Deep Work (60 / 10)", work: 60 * MIN, rest: 10 * MIN, desc: "One hour of silence. Then breathe." },
      { id: "thirty", name: "30 / 10", work: 30 * MIN, rest: 10 * MIN, desc: "Softer pace for beginners or burnout days." },
    ],
    []
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-3xl">
        <h2 className="text-lg font-bold">Focus Techniques</h2>
        <p className="text-xs text-muted-foreground mt-2">
          Pick a technique, we’ll set your Pomodoro timers for you. No redesign, no chaos.
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
                  <span className="font-semibold text-foreground/90">Work</span>: {Math.round(t.work / 60)}m ·{" "}
                  <span className="font-semibold text-foreground/90">Break</span>: {Math.round(t.rest / 60)}m
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

      <div className="flex items-center justify-between gap-3">
        <button className="px-4 py-2 rounded-2xl border border-border/40 hover:bg-secondary/20 transition" onClick={() => nav("/focus/pomodoro")}>
          Back to Pomodoro
        </button>

        <button className="px-4 py-2 rounded-2xl border border-border/40 hover:bg-secondary/20 transition" onClick={() => nav("/focus/music")}>
          Focus music →
        </button>
      </div>
    </div>
  );
}
