import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketCategory = "bug" | "feature" | "account" | "other";

export type SupportTicket = {
  id: string;
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
  const ticketRef = await addDoc(collection(db, "supportTickets"), {
    uid: params.uid,
    username: params.username ?? "",
    displayName: params.displayName ?? "",
    email: params.email ?? "",
    role: params.role ?? "member",
    category: params.category,
    subject: params.subject,
    status: "open",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessageAt: serverTimestamp(),
  });

  await addDoc(collection(db, "supportTickets", ticketRef.id, "messages"), {
    uid: params.uid,
    authorName: params.displayName ?? params.username ?? "User",
    body: params.firstMessage,
    isOwner: false,
    createdAt: serverTimestamp(),
  });

  return ticketRef.id;
}

export function subscribeMyTickets(uid: string, cb: (tickets: SupportTicket[]) => void) {
  const q = query(
    collection(db, "supportTickets"),
    where("uid", "==", uid),
    orderBy("lastMessageAt", "desc")
  );

  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
  });
}

export function subscribeAllTickets(cb: (tickets: SupportTicket[]) => void) {
  const q = query(collection(db, "supportTickets"), orderBy("lastMessageAt", "desc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
  });
}

export function subscribeTicketMessages(ticketId: string, cb: (msgs: TicketMessage[]) => void) {
  const q = query(
    collection(db, "supportTickets", ticketId, "messages"),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
  });
}

export async function addTicketMessage(params: {
  ticketId: string;
  uid: string;
  authorName: string;
  body: string;
  isOwner: boolean;
}) {
  await addDoc(collection(db, "supportTickets", params.ticketId, "messages"), {
    uid: params.uid,
    authorName: params.authorName,
    body: params.body,
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
