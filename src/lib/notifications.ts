import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type NotificationType = "badge" | "level" | "friend" | "system";

export async function createNotification(
  toUid: string,
  type: NotificationType,
  title: string,
  body: string,
  meta: Record<string, any> = {}
) {
  if (!toUid) return;

  await addDoc(collection(db, "notifications"), {
    toUid,
    type,
    title,
    body,
    meta,
    read: false,
    createdAt: serverTimestamp(),
  });
}
