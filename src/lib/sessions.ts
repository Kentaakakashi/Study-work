import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type SessionType = "pomodoro" | "stopwatch";

export async function logSession(uid: string, type: SessionType, minutes: number, meta: Record<string, any> = {}) {
  if (!uid || !minutes || minutes <= 0) return;

  await addDoc(collection(db, "sessions", uid, "items"), {
    uid,
    type,
    minutes,
    meta,
    createdAt: serverTimestamp(),
  });
}

