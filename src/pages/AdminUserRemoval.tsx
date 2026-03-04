import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Trash2, UserX } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export default function AdminUserRemoval() {
  const { user } = useAuth();
  const [uid, setUid] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const validUid = useMemo(() => uid.trim().length >= 20, [uid]);
  const canNuke = useMemo(() => validUid && confirm.trim().toUpperCase() === "DELETE", [validUid, confirm]);

  const run = async () => {
    if (!user) return toast("Login required");
    if (!canNuke) return toast("Type DELETE to confirm");

    try {
      setLoading(true);
      const token = await user.getIdToken();

      const res = await fetch("/.netlify/functions/admin-delete-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUid: uid.trim() }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Delete failed");

      toast("User deleted ✅");
      setUid("");
      setConfirm("");
    } catch (e: any) {
      toast(e?.message || "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <UserX className="w-5 h-5 text-red-400" />
        <h1 className="text-xl font-bold">User Removal</h1>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-3xl space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            This is a hard delete: it'll uhm wipe the user’s data from rntire database and delete their Firebase Auth account 😗🎀
            It will <span className="text-foreground font-semibold">refuse</span> to delete owners.
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Target UID</label>
          <input
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            placeholder="Paste user UID here"
            className="w-full px-4 py-3 rounded-2xl bg-secondary/20 border border-border/40 outline-none focus:border-primary/60"
          />
          <p className="text-xs text-muted-foreground">Tip: you can copy UIDs from the leaderboard (owners only).</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">
            Type <span className="text-red-300">DELETE</span> to confirm
          </label>
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="DELETE"
            className="w-full px-4 py-3 rounded-2xl bg-secondary/20 border border-border/40 outline-none focus:border-red-400/60"
          />
        </div>

        <button
          disabled={!canNuke || loading}
          onClick={run}
          className="w-full py-3 rounded-2xl bg-red-500/80 hover:bg-red-500 disabled:opacity-50 disabled:hover:bg-red-500/80 transition text-white font-semibold flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          {loading ? "Deleting…" : "Delete user"}
        </button>
      </motion.div>
    </div>
  );
}
