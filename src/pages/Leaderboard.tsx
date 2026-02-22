import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { levelFromXp } from "@/lib/stats";

type StatsDoc = {
  uid: string;
  displayName?: string;
  username?: string;
  photoURL?: string;
  xp?: number;
  totalMinutes?: number;
  weeklyMinutes?: number;
};

export default function Leaderboard() {
  const { user } = useAuth();
  const [mode, setMode] = useState<"xp" | "weekly">("xp");
  const [users, setUsers] = useState<StatsDoc[]>([]);

  useEffect(() => {
    const q =
      mode === "xp"
        ? query(collection(db, "stats"), orderBy("xp", "desc"), limit(50))
        : query(collection(db, "stats"), orderBy("weeklyMinutes", "desc"), limit(50));

    const unsub = onSnapshot(q, (snap) => {
      const arr: StatsDoc[] = [];
      snap.forEach((doc) => {
        arr.push(doc.data() as StatsDoc);
      });
      setUsers(arr);
    });

    return () => unsub();
  }, [mode]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="text-xl font-semibold mb-4 flex items-center gap-2">
          🏆 Leaderboard
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setMode("xp")}
            className={`px-5 py-2 rounded-full transition-all ${
              mode === "xp"
                ? "bg-teal-500 text-black shadow-lg"
                : "bg-white/10 hover:bg-white/20"
            }`}
          >
            Global (XP)
          </button>

          <button
            onClick={() => setMode("weekly")}
            className={`px-5 py-2 rounded-full transition-all ${
              mode === "weekly"
                ? "bg-teal-500 text-black shadow-lg"
                : "bg-white/10 hover:bg-white/20"
            }`}
          >
            Weekly (Minutes)
          </button>
        </div>
      </div>

      {/* List */}
      {users.map((u, i) => {
        const isYou = u.uid === user?.uid;
        const xp = u.xp || 0;
        const level = levelFromXp(xp).level;

        return (
          <div
            key={u.uid}
            className={`relative bg-white/5 backdrop-blur-xl border rounded-2xl p-5 transition-all ${
              isYou
                ? "border-teal-400 shadow-[0_0_30px_rgba(20,184,166,0.6)]"
                : "border-white/10 hover:border-white/20"
            }`}
          >
            {isYou && (
              <div className="absolute -top-3 left-4 bg-teal-500 text-black text-xs px-3 py-1 rounded-full font-semibold shadow-md">
                YOU
              </div>
            )}

            <div className="flex items-center gap-5">
              <div className="text-teal-400 font-bold text-lg w-10">
                #{i + 1}
              </div>

              <img
                src={u.photoURL || "/default-avatar.png"}
                className="w-14 h-14 rounded-full object-cover border border-white/20"
              />

              <div className="flex-1">
                <div className="text-lg font-semibold">
                  {u.displayName || "User"}
                </div>

                <div className="text-sm text-zinc-400">
                  @{u.username || "unknown"}
                </div>

                <div className="text-xs text-zinc-500 mt-1">
                  Lvl {level} • {xp} XP • {u.totalMinutes || 0} min total
                </div>
              </div>

              <div className="text-right text-teal-400 font-bold text-lg">
                {mode === "xp"
                  ? `${xp} XP`
                  : `${u.weeklyMinutes || 0} min`}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
