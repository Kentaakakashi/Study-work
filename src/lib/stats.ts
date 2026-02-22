import { doc, getDoc, increment, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createNotification } from "@/lib/notifications";

export type StatsDoc = {
  uid: string;
  xp: number;
  level: number;
  totalMinutes: number;
  todayMinutes: number;
  last7Days: Record<string, number>; // YYYY-MM-DD -> minutes
  streak: number;
  lastActiveDay: string; // YYYY-MM-DD
  weeklyMinutes: number;
  weekStart: string; // YYYY-MM-DD (Monday)
  updatedAt?: any;
};

export function ymd(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function mondayOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun..6 Sat
  const diff = (day === 0 ? -6 : 1) - day; // move to Monday
  d.setDate(d.getDate() + diff);
  return ymd(d);
}

export async function ensureStats(uid: string) {
  const ref = doc(db, "stats", uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data() as StatsDoc;

  const today = ymd();
  const weekStart = mondayOfWeek();

  const init: StatsDoc = {
    uid,
    xp: 0,
    level: 1,
    totalMinutes: 0,
    todayMinutes: 0,
    last7Days: {},
    streak: 0,
    lastActiveDay: today,
    weeklyMinutes: 0,
    weekStart,
  };

  await setDoc(ref, { ...init, updatedAt: serverTimestamp() }, { merge: true });
  return init;
}

export function minutesToXp(minutes: number) {
  return Math.max(0, Math.round(minutes * 5)); // 1 min = 5 XP
}

export function levelFromXp(xp: number) {
  // lvl 1: 0-99, lvl 2: 100-249, lvl 3: 250-449 ...
  let lvl = 1;
  let need = 100;
  let remaining = xp;

  while (remaining >= need) {
    remaining -= need;
    lvl += 1;
    need += 150;
  }
  return lvl;
}

export async function addStudyMinutes(uid: string, minutes: number) {
  const statsRef = doc(db, "stats", uid);

  await setDoc(
    statsRef,
    {
      xp: increment(minutes),              // 1 XP per minute
      totalMinutes: increment(minutes),
      weeklyMinutes: increment(minutes),
      today: {
        [ymd()]: increment(minutes),
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

  // streak logic
  const lastDate = new Date(lastActive);
  const todayDate = new Date(today);
  const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  let newStreak = current.streak || 0;
  if (diffDays === 0) {
    // same day - keep
  } else if (diffDays === 1) {
    newStreak += 1;
  } else {
    newStreak = 1;
  }

  const newXp = (current.xp || 0) + minutesToXp(minutes);
  const newLevel = levelFromXp(newXp);

  // last7Days
  const nextLast7 = { ...(current.last7Days || {}) };
  nextLast7[today] = (nextLast7[today] || 0) + minutes;

  // prune > 7 days
  const keys = Object.keys(nextLast7).sort();
  while (keys.length > 7) {
    const k = keys.shift();
    if (k) delete nextLast7[k];
  }

  const updates: Partial<StatsDoc> = {
    lastActiveDay: today,
    streak: newStreak,
    todayMinutes: (current.todayMinutes || 0) + minutes,
    totalMinutes: (current.totalMinutes || 0) + minutes,
    last7Days: nextLast7,
    weekStart,
    weeklyMinutes: (wasNewWeek ? 0 : current.weeklyMinutes || 0) + minutes,
    xp: newXp,
    level: newLevel,
  };

  await setDoc(ref, { ...updates, updatedAt: serverTimestamp() }, { merge: true });

  // notify on level up
  if ((current.level || 1) !== newLevel) {
    await createNotification(uid, uid, "level", "Level up!", `You reached Level ${newLevel} 🎉`, {
      level: newLevel,
      xp: newXp,
    });
  }

  // badge milestones
  const total = updates.totalMinutes || 0;
  if (total >= 60 && (current.totalMinutes || 0) < 60) {
    await createNotification(uid, uid, "badge", "Badge unlocked", "First hour focused 🏅", { badge: "first_hour" });
  }
  if (total >= 300 && (current.totalMinutes || 0) < 300) {
    await createNotification(uid, uid, "badge", "Badge unlocked", "5 hours total focused 🏅", { badge: "five_hours" });
  }
}
