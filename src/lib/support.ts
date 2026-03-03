import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketCategory = "bug" | "feature" | "account" | "other";

export type SupportTicket = {
  id: string;

  // ✅ MUST exist (used by rules + filters)
  uid: string;

  username?: string;
  displayName?: string;
  email?: string;
  role?: "owner" | "member";

  category: TicketCategory;
  subject: string;
  status: TicketStatus;

  createdAt?: any;
  updatedAt?: any;
  lastMessageAt?: any;
};

export type TicketMessage = {
  id: string;
  uid: string;
  authorName?: string;
  body: string;
  createdAt?: any;
  isOwner?: boolean;
};

export async function createTicket(params: {
  uid: string;
  username?: string;
  displayName?: string;
  email?: string;
  role?: "owner" | "member";
  category: TicketCategory;
  subject: string;
  firstMessage: string;
}) {
  // Create our own doc refs so we can batch everything
  const ticketRef = doc(collection(db, "supportTickets"));
  const msgRef = doc(collection(db, "supportTickets", ticketRef.id, "messages"));

  const batch = writeBatch(db);

  batch.set(ticketRef, {
    uid: params.uid,
    username: params.username ?? "",
    displayName: params.displayName ?? "",
    email: params.email ?? "",
    role: params.role ?? "member",

    category: params.category,
    subject: params.subject.trim(),
    status: "open",

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessageAt: serverTimestamp(),
  });

  batch.set(msgRef, {
    uid: params.uid,
    authorName: params.displayName ?? params.username ?? "User",
    body: params.firstMessage.trim(),
    isOwner: false,
    createdAt: serverTimestamp(),
  });

  await batch.commit();
  return ticketRef.id;
}

export function subscribeMyTickets(
  uid: string,
  cb: (tickets: SupportTicket[]) => void,
  onError?: (err: any) => void
) {
  const q = query(
    collection(db, "supportTickets"),
    where("uid", "==", uid),
    orderBy("lastMessageAt", "desc")
  );

  return onSnapshot(
    q,
    (snap) => {
      const out: SupportTicket[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      cb(out);
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}

export function subscribeAllTickets(
  cb: (tickets: SupportTicket[]) => void,
  onError?: (err: any) => void
) {
  const q = query(collection(db, "supportTickets"), orderBy("lastMessageAt", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      const out: SupportTicket[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      cb(out);
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}

export function subscribeTicketMessages(
  ticketId: string,
  cb: (msgs: TicketMessage[]) => void,
  onError?: (err: any) => void
) {
  const q = query(
    collection(db, "supportTickets", ticketId, "messages"),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(
    q,
    (snap) => {
      const out: TicketMessage[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      cb(out);
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}

export async function addTicketMessage(params: {
  ticketId: string;
  uid: string;
  authorName: string;
  body: string;
  isOwner: boolean;
}) {
  const msgRef = doc(collection(db, "supportTickets", params.ticketId, "messages"));
  await setDoc(msgRef, {
    uid: params.uid,
    authorName: params.authorName,
    body: params.body.trim(),
    isOwner: params.isOwner,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "supportTickets", params.ticketId), {
    updatedAt: serverTimestamp(),
    lastMessageAt: serverTimestamp(),
  });
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus) {
  await updateDoc(doc(db, "supportTickets", ticketId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function getTicket(ticketId: string) {
  const ref = doc(db, "supportTickets", ticketId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as any) } as SupportTicket;
}
