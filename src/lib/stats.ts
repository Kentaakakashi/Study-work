import {
  doc,
  getDoc,
  setDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createNotification } from "@/lib/notifications";

export function ymd(date: Date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function levelFromXp(xp: number) {
  const safe = Math.max(0, Math.floor(xp || 0));
  const level = Math.floor(safe / 250) + 1;
  const intoLevel = safe - (level - 1) * 250;
  const xpProgress = (intoLevel / 250) * 100;
  const nextLevelXp = level * 250;

  return {
    level,
    nextLevelXp,
    xpProgress,
  };
}

export async function ensureStats(uid: string) {
  const ref = doc(db, "stats", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      uid,
      xp: 0,
      totalMinutes: 0,
      weeklyMinutes: 0,
      todayMinutes: 0,
      streak: 0,
      today: {},
      missionClaims: {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

export async function addFocusMinutes(uid: string, minutes: number) {
  if (!uid) throw new Error("addFocusMinutes: missing uid");
  const m = Math.max(0, Math.floor(minutes));
  if (m <= 0) return;

  const ref = doc(db, "stats", uid);

  await setDoc(
    ref,
    {
      uid,
      todayMinutes: increment(m),
      weeklyMinutes: increment(m),
      totalMinutes: increment(m),
      xp: increment(m),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function addStudyMinutes(uid: string, minutes: number) {
  if (!uid || minutes <= 0) return;

  const ref = doc(db, "stats", uid);
  const todayKey = ymd();

  await setDoc(
    ref,
    {
      uid,
      xp: increment(minutes),
      totalMinutes: increment(minutes),
      weeklyMinutes: increment(minutes),
      todayMinutes: increment(minutes),
      today: {
        [todayKey]: increment(minutes),
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  const snap = await getDoc(ref);
  const data = snap.data();
  const total = data?.totalMinutes || 0;

  if (total >= 300) {
    await createNotification(
      uid,
      uid,
      "badge",
      "Badge unlocked",
      "5 hours total focused 🏅",
      { badge: "five_hours" }
    );
  }
}
