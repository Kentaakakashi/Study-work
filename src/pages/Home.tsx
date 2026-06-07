import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Flame,
  Zap,
  Timer,
  Brain,
  Users,
  MessageSquare,
  Target,
  CheckCircle2,
  TrendingUp,
  BookOpen,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { ensureStats, ymd, levelFromXp } from "@/lib/stats";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

type StatsDoc = {
  xp?: number;
  coins?: number;
  streak?: number;
  lastStudiedDate?: string;
  todayMinutes?: number;
  totalMinutes?: number;
  weeklyMinutes?: number;
  today?: Record<string, number>;
  missionClaims?: Record<string, Record<string, boolean>>;
};

type Profile = {
  displayName?: string;
  username?: string;
  pfp?: string;
  photoURL?: string;
  hideOnline?: boolean;
  hideStats?: boolean;
  dailyGoal?: number;
};

type Presence = { online?: boolean; status?: string; lastSeen?: any };

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function dice(seed: string) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed || "user")}`;
}

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState<StatsDoc | null>(null);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);

  const [friendUids, setFriendUids] = useState<string[]>([]);
  const [friendProfiles, setFriendProfiles] = useState<Record<string, Profile>>({});
  const [presence, setPresence] = useState<Record<string, Presence>>({});

  useEffect(() => {
    if (!user) return;
    let unsubStats = () => {};
    let unsubProfile = () => {};

    (async () => {
      await ensureStats(user.uid);

      unsubStats = onSnapshot(doc(db, "stats", user.uid), (snap) => {
        setStats((snap.data() as StatsDoc) || {});
      });

      unsubProfile = onSnapshot(doc(db, "profiles", user.uid), (snap) => {
        setMyProfile((snap.data() as Profile) || {});
      });
    })();

    return () => {
      unsubStats();
      unsubProfile();
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "friends", user.uid, "list"), (snap) => {
      const uids: string[] = [];
      snap.forEach((d) => uids.push(d.id));
      setFriendUids(uids);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsubs: (() => void)[] = [];

    const loadProfile = async (uid: string) => {
      if (friendProfiles[uid]) return;
      const s = await getDoc(doc(db, "profiles", uid));
      setFriendProfiles((prev) => ({ ...prev, [uid]: ((s.data() as Profile) || {}) }));
    };

    friendUids.slice(0, 20).forEach((uid) => {
      loadProfile(uid).catch(() => {});
      const u = onSnapshot(doc(db, "presence", uid), (snap) => {
        setPresence((prev) => ({ ...prev, [uid]: (snap.data() as Presence) || {} }));
      });
      unsubs.push(u);
    });

    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friendUids.join(",")]);

  const todayKey = ymd();
  const todayMins = Number(stats?.today?.[todayKey] ?? stats?.todayMinutes ?? 0);
  const streak = Number(stats?.streak || 0);

  const focusGoal = Number(myProfile?.dailyGoal || 120);
  const progressPercent = Math.max(0, Math.min(100, focusGoal > 0 ? (todayMins / focusGoal) * 100 : 0));

  const xp = Number(stats?.xp || 0);
  const coins = Number(stats?.coins || 0);
  const { level, intoLevel, xpProgress } = levelFromXp(xp);

  const plannedTomorrow = useMemo(() => {
    const key = user ? `tasks:${user.uid}` : "tasks:guest";
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      const tasks = JSON.parse(raw) as any[];
      const tmr = ymd(addDays(new Date(), 1));
      return tasks.some((t) => String(t?.due || "") === tmr);
    } catch {
      return false;
    }
  }, [user, todayKey]);

  const claimsToday = stats?.missionClaims?.[todayKey] || {};
  const isClaimed = (id: string) => !!claimsToday[id];

  const missions = useMemo(() => {
    return [
      {
        id: "focus25",
        label: "Focus for 25 mins",
        done: todayMins >= 25,
        progress: Math.min(todayMins, 25),
        goal: 25,
        xp: 50,
        coins: 10,
      },
      {
        id: "study60",
        label: "Study 60 mins total",
        done: todayMins >= 60,
        progress: Math.min(todayMins, 60),
        goal: 60,
        xp: 100,
        coins: 25,
      },
      {
        id: "planTomorrow",
        label: "Plan tomorrow (add a task with tomorrow due date)",
        done: plannedTomorrow,
        progress: plannedTomorrow ? 1 : 0,
        goal: 1,
        xp: 35,
        coins: 5,
      },
    ];
  }, [todayMins, plannedTomorrow]);

  const claimMission = async (
  missionId: string,
  xpGain: number,
  coinGain: number
) => {
    if (!user) return;
    if (isClaimed(missionId)) return;

    await updateDoc(doc(db, "stats", user.uid), {
      [`missionClaims.${todayKey}.${missionId}`]: true,
      xp: increment(xpGain),
      coins: increment(coinGain),
      updatedAt: serverTimestamp(),
    });
  };

  const studyingNow = useMemo(() => {
    const out: { uid: string; name: string; subject: string; avatar: string; status: "online" | "studying" }[] = [];
    friendUids.slice(0, 20).forEach((uid) => {
      const pres = presence[uid] || {};
      if (!pres.online) return;
      const p = friendProfiles[uid] || {};
      const name = p.displayName || "User";
      const avatar = (p.username || name || "U").slice(0, 1).toUpperCase();
      const status = pres.status === "studying" ? "studying" : "online";
      const subject = "Studying";
      out.push({ uid, name, subject, avatar, status });
    });
    return out.slice(0, 6);
  }, [friendUids, presence, friendProfiles]);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div variants={fadeUp} className="glass-card-hover p-6 rounded-2xl flex flex-col items-center justify-center">
          <div className="relative w-32 h-32 mb-4">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${progressPercent * 2.64} 264`}
                className="transition-all duration-1000 ease-out"
                style={{ filter: "drop-shadow(0 0 6px hsl(var(--primary) / 0.5))" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{todayMins}</span>
              <span className="text-xs text-muted-foreground">/ {focusGoal} min</span>
            </div>
          </div>
          <p className="text-sm font-medium">Today's Focus</p>
          <p className="text-xs text-muted-foreground">Real minutes from Pomodoro + Stopwatch ✅</p>
        </motion.div>

        <motion.div variants={fadeUp} className="glass-card-hover p-6 rounded-2xl space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-warning/10 flex items-center justify-center">
              <Flame className="w-7 h-7 streak-glow" />
            </div>
            <div>
              <p className="text-3xl font-bold streak-glow">{streak}</p>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </div>
          </div>

          <div className="glass-card-hover p-6 rounded-2xl">
  <p className="text-3xl font-bold text-yellow-400">
    🪙 {coins}
  </p>
  <p className="text-sm text-muted-foreground">
    Coins
  </p>
</div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Level {level}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {intoLevel} / 250 XP
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-secondary/40 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${Math.max(3, xpProgress)}%` }}
              />
            </div>
          </div>
        </motion.div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div variants={fadeUp} className="glass-card-hover p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-5">
            <Target className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Daily Missions</h3>
            <span className="ml-auto text-xs text-muted-foreground">{todayKey}</span>
          </div>

          <div className="space-y-3">
            {missions.map((m) => {
              const claimed = isClaimed(m.id);
              const missionProgress = Math.max(0, Math.min(100, (m.progress / m.goal) * 100));

              return (
                <div
                  key={m.id}
                  className={`p-3 rounded-xl transition-colors ${
                    claimed ? "bg-success/5 border border-success/20" : "bg-secondary/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2
                      className={`w-5 h-5 flex-shrink-0 ${
                        m.done ? "text-success" : "text-muted-foreground/30"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${claimed ? "line-through text-muted-foreground" : ""}`}>
                        {m.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {m.progress} / {m.goal}
                      </p>
                    </div>

                    <div className="text-right">
  <div className="text-xs font-mono text-primary">
    +{m.xp} XP
  </div>
  <div className="text-xs font-mono text-yellow-400">
    +{m.coins} 🪙
  </div>
</div>
                    {m.done && !claimed && (
                      <button
                        onClick={() => claimMission(m.id, m.xp, m.coins)}
                        className="text-xs px-3 py-1 rounded-full bg-success/10 text-success font-medium hover:bg-success/20 transition-colors"
                      >
                        Claim
                      </button>
                    )}

                    {claimed && (
                      <span className="text-xs px-3 py-1 rounded-full bg-success/10 text-success font-medium">
                        Claimed
                      </span>
                    )}
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-secondary/40 overflow-hidden mt-3">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${Math.max(missionProgress, m.done ? 100 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="glass-card-hover p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-5">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Studying Now</h3>
            <span className="ml-auto text-xs text-muted-foreground">{studyingNow.length} online</span>
          </div>

          <div className="space-y-3">
            {studyingNow.map((u) => {
              const fp = friendProfiles[u.uid] || {};
              const pfp = fp.pfp || fp.photoURL || dice(fp.username || u.name);
              return (
                <div
                  key={u.uid}
                  className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20 hover:bg-secondary/30 transition-colors"
                >
                  <div className="relative">
                    <img src={pfp} className="w-10 h-10 rounded-full object-cover" />
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 ${
                        u.status === "studying" ? "presence-studying" : "presence-online"
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> {u.subject}
                    </p>
                  </div>

                  {u.status === "studying" && (
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                      Studying
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {studyingNow.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No friends online right now</p>
              <button
                onClick={() => navigate("/friends")}
                className="mt-3 px-4 py-2 rounded-xl bg-secondary/25 hover:bg-secondary/35 transition border border-border/40 text-sm font-semibold"
              >
                Add friends
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Home;
