import { motion } from "framer-motion";
import { Flame, Zap, Timer, Brain, Users, MessageSquare, Target, CheckCircle2, TrendingUp, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const studyingNow = [
  { name: "Alex", subject: "Physics", avatar: "A", status: "studying" as const },
  { name: "Maya", subject: "Math", avatar: "M", status: "studying" as const },
  { name: "Jordan", subject: "CS", avatar: "J", status: "online" as const },
];

const missions = [
  { label: "Focus for 25 mins", progress: 15, goal: 25, xp: 50, done: false },
  { label: "Reply to 1 doubt", progress: 1, goal: 1, xp: 30, done: true },
  { label: "Plan tomorrow", progress: 0, goal: 1, xp: 20, done: false },
  { label: "Study 60 mins total", progress: 42, goal: 60, xp: 100, done: false },
];

const Home = () => {
  const navigate = useNavigate();
  const focusMinutes = 42;
  const focusGoal = 120;
  const progressPercent = (focusMinutes / focusGoal) * 100;
  const xp = 1250;
  const level = 5;
  const nextLevelXp = level * 250;
  const xpProgress = (xp % nextLevelXp) / nextLevelXp * 100;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-6xl mx-auto space-y-6">
      {/* Top row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Focus ring */}
        <motion.div variants={fadeUp} className="glass-card-hover p-6 rounded-2xl flex flex-col items-center justify-center">
          <div className="relative w-32 h-32 mb-4">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--primary))" strokeWidth="8"
                strokeLinecap="round" strokeDasharray={`${progressPercent * 2.64} 264`}
                className="transition-all duration-1000 ease-out"
                style={{ filter: "drop-shadow(0 0 6px hsl(var(--primary) / 0.5))" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{focusMinutes}</span>
              <span className="text-xs text-muted-foreground">/ {focusGoal} min</span>
            </div>
          </div>
          <p className="text-sm font-medium">Today's Focus</p>
          <p className="text-xs text-muted-foreground">Keep going! 🔥</p>
        </motion.div>

        {/* Streak & Level */}
        <motion.div variants={fadeUp} className="glass-card-hover p-6 rounded-2xl space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-warning/10 flex items-center justify-center">
              <Flame className="w-7 h-7 streak-glow" />
            </div>
            <div>
              <p className="text-3xl font-bold streak-glow">7</p>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Level {level}</span>
              </div>
              <span className="text-xs text-muted-foreground">{xp} / {nextLevelXp} XP</span>
            </div>
            <div className="xp-bar">
              <div className="xp-bar-fill" style={{ width: `${xpProgress}%` }} />
            </div>
          </div>
        </motion.div>

        {/* Quick actions */}
        <motion.div variants={fadeUp} className="glass-card-hover p-6 rounded-2xl">
          <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Timer, label: "Pomodoro", path: "/focus/pomodoro" },
              { icon: TrendingUp, label: "Stopwatch", path: "/focus/stopwatch" },
              { icon: Brain, label: "Ask AI", path: "/ai" },
              { icon: MessageSquare, label: "Post Doubt", path: "/community" },
            ].map((a) => (
              <button
                key={a.label}
                onClick={() => navigate(a.path)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/60 border border-transparent hover:border-primary/20 transition-all duration-200 group"
              >
                <a.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all" />
                <span className="text-xs font-medium">{a.label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Missions */}
        <motion.div variants={fadeUp} className="glass-card-hover p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-5">
            <Target className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Daily Missions</h3>
          </div>
          <div className="space-y-3">
            {missions.map((m) => (
              <div key={m.label} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${m.done ? "bg-success/5 border border-success/20" : "bg-secondary/20"}`}>
                <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${m.done ? "text-success" : "text-muted-foreground/30"}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${m.done ? "line-through text-muted-foreground" : ""}`}>{m.label}</p>
                  {!m.done && (
                    <div className="xp-bar mt-1.5 h-1">
                      <div className="xp-bar-fill h-1" style={{ width: `${(m.progress / m.goal) * 100}%` }} />
                    </div>
                  )}
                </div>
                <span className="text-xs font-mono text-primary">+{m.xp} XP</span>
                {m.done && (
                  <button className="text-xs px-3 py-1 rounded-full bg-success/10 text-success font-medium hover:bg-success/20 transition-colors">
                    Claim
                  </button>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Studying Now */}
        <motion.div variants={fadeUp} className="glass-card-hover p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-5">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Studying Now</h3>
            <span className="ml-auto text-xs text-muted-foreground">{studyingNow.length} online</span>
          </div>
          <div className="space-y-3">
            {studyingNow.map((u) => (
              <div key={u.name} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20 hover:bg-secondary/30 transition-colors">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-primary-foreground">
                    {u.avatar}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 ${u.status === "studying" ? "presence-studying" : "presence-online"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{u.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> {u.subject}
                  </p>
                </div>
                {u.status === "studying" && (
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">Studying</span>
                )}
              </div>
            ))}
          </div>
          {studyingNow.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No one studying right now</p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Home;
