import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { collection, limit, onSnapshot, query, where, updateDoc, doc } from "firebase/firestore";

type Notif = {
  id: string;
  title?: string;
  body?: string;
  type?: string;
  read?: boolean;
  createdAt?: any;
};

function tsToMs(t: any) {
  try {
    if (!t) return 0;
    if (typeof t === "number") return t;
    if (t.toMillis) return t.toMillis();
    if (t.seconds) return t.seconds * 1000;
    return 0;
  } catch {
    return 0;
  }
}

export default function Notifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);

  useEffect(() => {
    if (!user) return;

    // no orderBy => avoids composite index requirement
    const q = query(collection(db, "notifications"), where("toUid", "==", user.uid), limit(50));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Notif[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
        list.sort((a, b) => tsToMs(b.createdAt) - tsToMs(a.createdAt));
        setItems(list);
      },
      (err) => toast(err?.message || "Couldn't load notifications")
    );

    return () => unsub();
  }, [user?.uid]);

  const unread = useMemo(() => items.filter((n) => !n.read), [items]);

  const markAllRead = async () => {
    if (!user) return;
    try {
      await Promise.all(unread.map((n) => updateDoc(doc(db, "notifications", n.id), { read: true }).catch(() => {})));
      toast("Marked as read ✅");
    } catch (e: any) {
      toast(e?.message || "Failed");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-3xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold">Notifications</h3>
            <span className="text-xs text-muted-foreground">({unread.length} unread)</span>
          </div>
          <button
            onClick={markAllRead}
            className="px-3 py-2 rounded-xl bg-secondary/20 border border-border/40 text-sm hover:bg-secondary/30 transition"
          >
            <CheckCheck className="w-4 h-4 inline mr-1" /> Mark all read
          </button>
        </div>
        <p className="text-sm text-muted-foreground mt-2">Badge unlocks, level ups, friend requests, and more.</p>
      </motion.div>

      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing yet.</p>
        ) : (
          items.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-2xl border ${n.read ? "bg-secondary/10 border-border/40" : "bg-primary/10 border-primary/30"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{n.title || "Notification"}</p>
                  <p className="text-sm text-muted-foreground mt-1">{n.body || ""}</p>
                </div>
                {!n.read && (
                  <button
                    onClick={() => updateDoc(doc(db, "notifications", n.id), { read: true }).catch(() => {})}
                    className="px-3 py-2 rounded-xl bg-secondary/20 border border-border/40 text-xs"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
