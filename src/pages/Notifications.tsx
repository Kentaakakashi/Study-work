import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { collection, doc, limit, onSnapshot, orderBy, query, updateDoc, where } from "firebase/firestore";

type Notif = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt?: any;
};

export default function Notifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "notifications"),
      where("toUid", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(60)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const out: Notif[] = [];
        snap.forEach((d) => out.push({ id: d.id, ...(d.data() as any) }));
        setItems(out);
      },
      (err) => toast(err?.message || "Couldn't load notifications")
    );

    return () => unsub();
  }, [user]);

  const prettyTime = (p: any) => {
    const dt = p?.toDate ? p.toDate() : null;
    return dt ? dt.toLocaleString() : "";
  };

  const markRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (e: any) {
      toast(e?.message || "Couldn't mark read");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-3xl">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">Notifications</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Badge unlocks, level ups, and more.</p>
      </motion.div>

      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing yet.</p>
        ) : (
          items.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-2xl border bg-secondary/15 ${
                n.read ? "border-border/40" : "border-primary/25 shadow-[0_0_0_1px_hsl(var(--primary)/0.1)]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{n.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{n.body}</p>
                  <p className="text-[11px] text-muted-foreground mt-2">{n.createdAt ? prettyTime(n.createdAt) : ""}</p>
                </div>

                {!n.read && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="px-3 py-2 rounded-xl bg-primary/15 border border-primary/25 text-sm hover:bg-primary/20 transition"
                  >
                    <Check className="w-4 h-4 inline mr-1" /> Read
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
