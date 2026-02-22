import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
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
    <div className="p-4 space-y-4">
      <div className="flex gap-3">
        <button
          onClick={() => setMode("xp")}
          className={`px-4 py-2 rounded-full ${
            mode === "xp" ? "bg-teal-600" : "bg-zinc-800"
          }`}
        >
          Global (XP)
        </button>

        <button
          onClick={() => setMode("weekly")}
          className={`px-4 py-2 rounded-full ${
            mode === "weekly" ? "bg-teal-600" : "bg-zinc-800"
          }`}
        >
          Weekly (Minutes)
        </button>
      </div>

      {users.map((u, i) => {
        const isYou = u.uid === user?.uid;

        return (
          <div
            key={u.uid}
            className={`relative p-4 rounded-xl border transition-all ${
              isYou
                ? "border-teal-400 shadow-[0_0_20px_rgba(20,184,166,0.6)]"
                : "border-zinc-800"
            }`}
          >
            {isYou && (
              <div className="absolute -top-2 left-3 text-xs bg-teal-600 px-2 py-0.5 rounded-full">
                YOU
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="text-teal-400 font-bold w-8">
                #{i + 1}
              </div>

              <img
                src={u.photoURL || "/default-avatar.png"}
                className="w-12 h-12 rounded-full object-cover"
              />

              <div className="flex-1">
                <div className="font-semibold">
                  {u.displayName || "User"}
                </div>

                <div className="text-sm text-zinc-400">
                  @{u.username || "unknown"}
                </div>
              </div>

              <div className="text-right font-semibold text-teal-400">
                {mode === "xp"
                  ? `${u.xp || 0} XP`
                  : `${u.weeklyMinutes || 0} min`}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
