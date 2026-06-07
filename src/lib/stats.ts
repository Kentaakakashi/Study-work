import {
  doc,
  getDoc,
  setDoc,
  increment,
  serverTimestamp,
  runTransaction,
  collection,
  addDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createNotification } from "@/lib/notifications";

export function ymd(date: Date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function ymdOffset(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return ymd(d);
}

export function levelFromXp(xp: number) {
  const safe = Math.max(0, Math.floor(Number(xp) || 0));
  const level = Math.floor(safe / 250) + 1;
  const currentLevelBaseXp = (level - 1) * 250;
  const nextLevelXp = level * 250;
  const intoLevel = safe - currentLevelBaseXp;
  const xpProgress = Math.max(0, Math.min(100, (intoLevel / 250) * 100));

  return {
    level,
    nextLevelXp,
    xpProgress,
    intoLevel,
    currentLevelBaseXp,
  };
}

export async function ensureStats(uid: string) {
  const ref = doc(db, "stats", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      uid,
      xp: 0,
      coins: 0,
      totalMinutes: 0,
      weeklyMinutes: 0,
      todayMinutes: 0,
      streak: 0,
      lastStudiedDate: "",
      today: {},
      missionClaims: {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

export async function addFocusMinutes(uid: string, minutes: number) {
  return addStudyMinutes(uid, minutes);
}

export async function addStudyMinutes(uid: string, minutes: number) {
  if (!uid) return;

  const m = Math.max(0, Math.floor(Number(minutes) || 0));
  if (m <= 0) return;

  const ref = doc(db, "stats", uid);
  const todayKey = ymd();
  const yesterdayKey = ymdOffset(-1);
  const xpGain = m * 3;

  await ensureStats(uid);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists() ? (snap.data() as any) : {};

    const prevXp = Number(data?.xp || 0);
    const prevTotal = Number(data?.totalMinutes || 0);
    const prevWeekly = Number(data?.weeklyMinutes || 0);
    const prevTodayMinutes = Number(data?.todayMinutes || 0);
    const prevTodayMap = (data?.today || {}) as Record<string, number>;
    const prevTodayForKey = Number(prevTodayMap[todayKey] || 0);

    const lastStudiedDate = String(data?.lastStudiedDate || "");
    let nextStreak = Number(data?.streak || 0);

    if (lastStudiedDate !== todayKey) {
      if (lastStudiedDate === yesterdayKey) {
        nextStreak += 1;
      } else {
        nextStreak = 1;
      }
    }

    tx.set(
      ref,
      {
        uid,
        xp: prevXp + xpGain,
        totalMinutes: prevTotal + m,
        weeklyMinutes: prevWeekly + m,
        todayMinutes: prevTodayMinutes + m,
        today: {
          ...prevTodayMap,
          [todayKey]: prevTodayForKey + m,
        },
        streak: nextStreak,
        lastStudiedDate: todayKey,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });

  const snap = await getDoc(ref);
  const data = snap.data() as any;
  const total = Number(data?.totalMinutes || 0);

  if (total >= 300) {
    await createNotification(
      uid,
      uid,
      "badge",
      "Badge unlocked",
      "5 hours total focused 🏅",
      { badge: "five_hours" }
    ).catch(() => {});
  }
}

export async function addStudyLog(
  uid: string,
  log: {
    mode: "pomodoro" | "stopwatch";
    subject?: string;
    minutes: number;
    notes?: string;
    workMinutes?: number;
    breakMinutes?: number;
  }
) {
  if (!uid) return;
  const mins = Math.max(1, Math.floor(Number(log.minutes) || 0));

  await addDoc(collection(db, "users", uid, "studyLogs"), {
    mode: log.mode,
    subject: log.subject || "General",
    minutes: mins,
    notes: log.notes || "",
    workMinutes: log.workMinutes ?? null,
    breakMinutes: log.breakMinutes ?? null,
    createdAt: serverTimestamp(),
  });
}
