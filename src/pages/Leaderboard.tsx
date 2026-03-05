import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { toast } from "@/components/ui/use-toast";

type UserRow = {
  uid: string;
  displayName?: string;
  username?: string;
  avatarUrl?: string | null;
  photoURL?: string | null;
  xp?: number;
  weeklyMinutes?: number;
  totalMinutes?: number;
  streak?: number;
  tier?: string;
  level?: number;
};

function clampNum(n: any, fallback = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

export default function Leaderboard() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<"xp" | "weekly">("xp");
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const snap = await getDocs(collection(db, "stats"));
        const list: UserRow[] = [];
        snap.forEach((doc) => {
          const d = doc.data() as any;
          list.push({
            uid: d.uid || doc.id,
            displayName: d.displayName,
            username: d.username,
            avatarUrl: d.pfp ?? null,
            photoURL: d.photoURL ?? null,
            xp: clampNum(d.xp, 0),
            weeklyMinutes: clampNum(d.weeklyMinutes, 0),
            totalMinutes: clampNum(d.totalMinutes, 0),
            streak: clampNum(d.streak, 0),
            tier: d.tier,
            level: clampNum(d.level, 1),
          });
        });

        if (!alive) return;
        setRows(list);
      } catch (e: any) {
        console.error(e);
        toast({
          title: "Failed to load leaderboard",
          description: e?.message || "Unknown error",
          variant: "destructive",
        });
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const sorted = useMemo(() => {
    const copy = [...rows];
    if (tab === "xp") {
      copy.sort((a, b) => clampNum(b.xp) - clampNum(a.xp));
    } else {
      copy.sort((a, b) => clampNum(b.weeklyMinutes) - clampNum(a.weeklyMinutes));
    }
    return copy;
  }, [rows, tab]);

  const meUid = user?.uid;

  return (
    <div className="min-h-[calc(100dvh-72px)] px-4 py-6 flex justify-center overflow-x-hidden">
      <div className="w-full max-w-3xl">
        <div className="rounded-3xl bg-background/40 border border-border/40 backdrop-blur-md shadow-lg p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
              <span className="text-amber-400">🏆</span> Leaderboard
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setTab("xp")}
              className={`px-4 py-2 rounded-full text-sm border transition ${
                tab === "xp"
                  ? "bg-primary/20 border-primary/40 text-primary"
                  : "bg-secondary/10 border-border/40 text-muted-foreground hover:bg-secondary/20"
              }`}
            >
              Global (XP)
            </button>
            <button
              onClick={() => setTab("weekly")}
              className={`px-4 py-2 rounded-full text-sm border transition flex items-center gap-2 ${
                tab === "weekly"
                  ? "bg-primary/20 border-primary/40 text-primary"
                  : "bg-secondary/10 border-border/40 text-muted-foreground hover:bg-secondary/20"
              }`}
            >
              <span>🗓️</span> Weekly (Minutes)
            </button>
          </div>
        </div>

        <div className="mt-5 space-y-3 overflow-x-hidden">
          {loading ? (
            <div className="rounded-3xl bg-background/35 border border-border/40 backdrop-blur-md p-5 text-muted-foreground">
              Loading leaderboard…
            </div>
          ) : sorted.length === 0 ? (
            <div className="rounded-3xl bg-background/35 border border-border/40 backdrop-blur-md p-5 text-muted-foreground">
              No users yet.
            </div>
          ) : (
            sorted.map((u, idx) => {
              const isYou = !!meUid && u.uid === meUid;
              const rank = idx + 1;

              const name = (u.displayName || "User").trim();
              const username = (u.username || "").trim();
              const avatar =
                (u.avatarUrl && u.avatarUrl.trim()) ||
                (u.photoURL && u.photoURL.trim()) ||
                "";

              const metric =
                tab === "xp"
                  ? { label: "XP", value: clampNum(u.xp) }
                  : { label: "min", value: clampNum(u.weeklyMinutes) };

              return (
                <div
                  key={u.uid}
                  // NOTE: these are the important fixes:
                  // - w-full + min-w-0 prevents flex content from forcing layout wider than viewport
                  // - overflow-hidden stops any tiny overflow from glows/borders on mobile
                  className={`relative w-full min-w-0 overflow-hidden flex items-center justify-between gap-3 p-4 rounded-2xl bg-secondary/15 border ${
                    // Replaced the big shadow glow (can cause mobile overflow) with a ring glow.
                    isYou ? "border-primary/50 ring-1 ring-primary/40" : "border-border/40"
                  }`}
                >
                  {isYou && (
                    <div className="absolute -top-2 left-4 px-2 py-0.5 rounded-full text-[11px] bg-primary/20 text-primary border border-primary/30">
                      YOU
                    </div>
                  )}

                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 shrink-0 text-center font-bold text-amber-400 text-lg">
                      #{rank}
                    </div>

                    <img
                      src={
                        avatar ||
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96'%3E%3Crect width='100%25' height='100%25' fill='%23222'/%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' fill='%23aaa' font-size='28'%3E%3F%3C/text%3E%3C/svg%3E"
                      }
                      alt={name}
                      className="w-12 h-12 shrink-0 rounded-2xl object-cover border border-border/40"
                      loading="lazy"
                      decoding="async"
                    />

                    <button
                      onClick={() => {
                        if (username) nav(`/u/${username}`);
                      }}
                      className="min-w-0 text-left"
                      title={username ? `Open @${username}` : "No username set"}
                      disabled={!username}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="font-semibold truncate">{name}</div>
                        {isYou && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-amber-400/15 text-amber-300 border border-amber-300/30">
                            OWNER
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        Lv{clampNum(u.level, 1)} •{" "}
                        {tab === "xp"
                          ? `${clampNum(u.totalMinutes)} min total`
                          : `${clampNum(u.weeklyMinutes)} min this week`}{" "}
                        {username ? `• @${username}` : ""}
                      </div>
                    </button>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(u.uid);
                          toast({ title: "Copied UID ✅" });
                        } catch {
                          toast({
                            title: "Copy failed",
                            description: "Your browser blocked clipboard access.",
                            variant: "destructive",
                          });
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-secondary/20 border border-border/40 text-xs hover:bg-secondary/30 transition shrink-0"
                      title="Copy Firebase Auth UID"
                    >
                      <span className="inline-flex items-center gap-1">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M8 7H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-2"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <rect
                            x="9"
                            y="2"
                            width="13"
                            height="13"
                            rx="2"
                            ry="2"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        UID
                      </span>
                    </button>

                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold text-amber-400 leading-none">
                        {metric.value}
                      </div>
                      <div className="text-xs text-muted-foreground">{metric.label}</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
                }
