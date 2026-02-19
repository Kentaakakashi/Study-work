import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

type StatUser = {
  uid: string;
  displayName?: string;
  username?: string;
  photoURL?: string;
  xp?: number;
  totalMinutes?: number;
  weeklyMinutes?: number;
};

const Leaderboard = () => {
  const [users, setUsers] = useState<StatUser[]>([]);
  const [mode, setMode] = useState<"global" | "weekly">("global");

  useEffect(() => {
    fetchLeaderboard();
  }, [mode]);

  const fetchLeaderboard = async () => {
    try {
      const q =
        mode === "global"
          ? query(collection(db, "stats"), orderBy("xp", "desc"), limit(50))
          : query(collection(db, "stats"), orderBy("weeklyMinutes", "desc"), limit(50));

      const snap = await getDocs(q);

      const data: StatUser[] = snap.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      })) as StatUser[];

      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const getLevel = (xp: number = 0) => {
    return Math.floor(xp / 100) + 1;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-4">
      <div className="glass-card p-6 rounded-3xl">
        <h2 className="text-xl font-bold mb-4">🏆 Leaderboard</h2>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setMode("global")}
            className={`px-4 py-2 rounded-xl ${
              mode === "global"
                ? "bg-primary/20 border border-primary/40"
                : "bg-secondary/20 border border-border/40"
            }`}
          >
            Global (XP)
          </button>

          <button
            onClick={() => setMode("weekly")}
            className={`px-4 py-2 rounded-xl ${
              mode === "weekly"
                ? "bg-primary/20 border border-primary/40"
                : "bg-secondary/20 border border-border/40"
            }`}
          >
            Weekly (Minutes)
          </button>
        </div>

        <div className="space-y-3">
          {users.length === 0 ? (
            <p className="text-muted-foreground text-sm">No data yet.</p>
          ) : (
            users.map((u, index) => {
              const name =
                u.displayName ||
                u.username ||
                "User";

              const score =
                mode === "global"
                  ? `${u.xp || 0} XP`
                  : `${u.weeklyMinutes || 0} min`;

              return (
                <div
                  key={u.uid}
                  className="flex items-center justify-between p-4 rounded-2xl bg-secondary/15 border border-border/40"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center font-bold">
                      #{index + 1}
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold truncate">{name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        Lvl {getLevel(u.xp)} • {u.xp || 0} XP • {u.totalMinutes || 0} min total
                      </p>
                    </div>
                  </div>

                  <p className="font-bold text-primary">{score}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
