import {
  arrayUnion,
  doc,
  getDoc,
  increment,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { computeNewBadges } from "@/lib/badges";
import { createNotification } from "@/lib/notifications";

export function ymd(d = new Date()) {
  const z = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

export function levelFromXp(xp: number) {
  // Simple curve: every level costs a bit more than last
  // Level 1 starts at 0 xp
  let level = 1;
  let need = 120;
  let left = Math.max(0, Math.floor(xp || 0));

  while (left >= need) {
    left -= need;
    level += 1;
    need = Math.floor(need * 1.12 + 25);
    if (level > 99) break;
  }
  return level;
}

export async function ensureStats(uid: string) {
  const todayKey = ymd();
  const ref = doc(db, "stats", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      uid,
      today: { [todayKey]: 0 },
      streak: 0,
      lastStudiedDate: "",
      totalMinutes: 0,
      xp: 0,
      level: 1,
      badges: [],
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
  }

  return ref;
}

export async function addStudyMinutes(uid: string, minutes: number) {
  const mins = Math.max(1, Math.round(minutes));
  const todayKey = ymd();

  const ref = await ensureStats(uid);
  const snap = await getDoc(ref);
  const data = (snap.data() as any) || {};

  // streak calc
  let streak = data?.streak || 0;
  const last = data?.lastStudiedDate || "";

  if (!last) {
    streak = 1;
  } else if (last !== todayKey) {
    const d0 = new Date(todayKey);
    const d1 = new Date(last);
    const diffDays = Math.round((d0.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) streak += 1;
    else streak = 1;
  }

  const prevXp = Number(data?.xp || 0);
  const prevLevel = Number(data?.level || 1);

  const xpGain = mins * 5; // 5 XP per min (feel free to change)
  const nextXp = prevXp + xpGain;
  const nextLevel = levelFromXp(nextXp);

  // Write core stats
  await setDoc(
    ref,
    {
      today: { [todayKey]: increment(mins) },
      totalMinutes: increment(mins),
      xp: increment(xpGain),
      streak,
      lastStudiedDate: todayKey,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  // If level up, store computed level (so UI can just read it)
  if (nextLevel !== prevLevel) {
    await setDoc(ref, { level: nextLevel }, { merge: true });
    await createNotification(uid, "level", `Level Up! ⚡`, `You reached level ${nextLevel}. Keep cooking.`, {
      level: nextLevel,
    }).catch(() => {});
  }

  // Badge unlocks
  const latest = (await getDoc(ref)).data() as any;
  const newBadges = computeNewBadges({
    totalMinutes: latest?.totalMinutes,
    streak: latest?.streak,
    level: latest?.level,
    badges: latest?.badges,
  });

  if (newBadges.length) {
    await setDoc(ref, { badges: arrayUnion(...newBadges) }, { merge: true });

    // one notification per badge (could bundle, but this feels hype)
    for (const b of newBadges) {
      await createNotification(uid, "badge", "Badge Unlocked 🏅", `Unlocked: ${b}`, { badge: b }).catch(() => {});
    }
  }

  return { mins, todayKey, streak, xpGain, nextXp, nextLevel };
}
