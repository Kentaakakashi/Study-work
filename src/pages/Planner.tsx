import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, CheckCircle2, Circle, Calendar, Trash2, Flag } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

type Priority = "low" | "med" | "high";
interface Task {
  id: string;
  title: string;
  done: boolean;
  priority: Priority;
  due: string; // YYYY-MM-DD or ""
  createdAt: number;
}

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const Planner = () => {
  const { user } = useAuth();
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("med");
  const [due, setDue] = useState("");

  const key = user ? `tasks:${user.uid}` : "tasks:guest";

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setTasks(JSON.parse(raw));
    } catch {}
  }, [key]);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(tasks));
    } catch {}
  }, [tasks, key]);

  const addTask = () => {
    const t = title.trim();
    if (!t) return toast("Enter a task");
    setTasks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), title: t, done: false, priority, due, createdAt: Date.now() },
    ]);
    setTitle("");
    toast("Task added ✅");
  };

  const toggleTask = (id: string) => setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const deleteTask = (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id));
  const clearDone = () => {
    setTasks((prev) => prev.filter((t) => !t.done));
    toast("Cleared done ✅");
  };

  const doneCount = tasks.filter((t) => t.done).length;

  const sorted = useMemo(() => {
    return [...tasks].sort((a, b) => (a.done === b.done ? b.createdAt - a.createdAt : a.done ? 1 : -1));
  }, [tasks]);

  const prBadge = (p: Priority) =>
    p === "high" ? "border-rose-500/40 text-rose-200" : p === "low" ? "border-emerald-500/35 text-emerald-200" : "border-primary/35 text-primary";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 rounded-2xl">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">This Week</h3>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((d, i) => (
            <button
              key={d}
              onClick={() => setSelectedDay(i)}
              className={`py-2 rounded-xl text-sm font-medium transition ${
                selectedDay === i ? "bg-primary/20 border border-primary/30" : "bg-secondary/20 hover:bg-secondary/30"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Add task</h3>
            <span className="text-xs text-muted-foreground">{doneCount}/{tasks.length} done</span>
          </div>

          <div className="space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Finish chapter 5 problems…"
              className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Priority</label>
                <div className="mt-1 flex gap-2">
                  {(["low","med","high"] as Priority[]).map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-2 rounded-xl border text-sm transition ${
                        priority === p ? "bg-primary/15 border-primary/35" : "bg-secondary/20 border-border/40 hover:bg-secondary/30"
                      }`}
                    >
                      <Flag className="w-4 h-4 inline mr-1" /> {p.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Due date</label>
                <input
                  type="date"
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-secondary/30 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <button onClick={addTask} className="w-full glow-button py-3 rounded-xl font-semibold">
              <Plus className="w-4 h-4 inline mr-1" /> Add
            </button>

            <button
              onClick={clearDone}
              className="w-full py-3 rounded-xl font-semibold bg-secondary/25 hover:bg-secondary/35 transition border border-border/40"
            >
              Clear done
            </button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Tasks</h3>
            <span className="text-xs text-muted-foreground">{sorted.length} total</span>
          </div>

          <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
            {sorted.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks yet. Add one on the left.</p>
            ) : (
              sorted.map((t) => (
                <div key={t.id} className="flex items-start gap-3 p-3 rounded-2xl bg-secondary/15 border border-border/40">
                  <button onClick={() => toggleTask(t.id)} className="mt-0.5">
                    {t.done ? <CheckCircle2 className="w-5 h-5 text-primary" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
                  </button>

                  <div className="flex-1">
                    <p className={`font-medium ${t.done ? "line-through text-muted-foreground" : ""}`}>{t.title}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full border text-xs ${prBadge(t.priority)}`}>{t.priority.toUpperCase()}</span>
                      <span className="px-2 py-0.5 rounded-full border border-border/40 text-xs text-muted-foreground">
                        {t.due ? `Due: ${t.due}` : "No date"}
                      </span>
                    </div>
                  </div>

                  <button onClick={() => deleteTask(t.id)} className="text-muted-foreground hover:text-foreground">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Planner;
