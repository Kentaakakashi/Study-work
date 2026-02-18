import { doc, getDoc, increment, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function ymd(d = new Date()) {
  const z = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
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
      updatedAt: serverTimestamp(),
    });
  }
  return ref;
}

export async function addStudyMinutes(uid: string, minutes: number) {
  const mins = Math.max(1, Math.round(minutes));
  const todayKey = ymd();

  const ref = await ensureStats(uid);
  const data = (await getDoc(ref)).data() as any;

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

  await setDoc(
    ref,
    {
      today: { [todayKey]: increment(mins) },
      streak,
      lastStudiedDate: todayKey,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return { mins, todayKey, streak };
}
