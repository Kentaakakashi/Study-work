import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, Music2 } from "lucide-react";
import { useEffect, useState } from "react";

type Playlist = {
  title: string;
  desc: string;
  id: string;
  embedType: "youtube-video" | "youtube-playlist";
};

const playlists: Playlist[] = [
  {
    title: "Lofi Beats",
    desc: "Chill beats for long study sessions.",
    id: "jfKfPfyJRdk",
    embedType: "youtube-video",
  },
  {
    title: "Deep Focus Piano",
    desc: "Calm piano for reading and problem solving.",
    id: "lFcSrYw-ARY",
    embedType: "youtube-video",
  },
  {
    title: "Brown Noise",
    desc: "Steady noise for locking in with fewer distractions.",
    id: "RqzGzwTY-6w",
    embedType: "youtube-video",
  },
  {
    title: "Ambient Coding",
    desc: "Atmospheric electronic focus vibes.",
    id: "DWcJFNfaw9c",
    embedType: "youtube-video",
  },
];

const MUSIC_STORAGE_KEY = "focus:selectedPlaylist";

type SavedPlaylist = {
  id: string;
  title: string;
  embedType: "youtube-video" | "youtube-playlist";
};

export default function FocusMusic() {
  const [selected, setSelected] = useState<SavedPlaylist | null>(() => {
    try {
      const raw = localStorage.getItem(MUSIC_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const sync = () => {
      try {
        const raw = localStorage.getItem(MUSIC_STORAGE_KEY);
        setSelected(raw ? JSON.parse(raw) : null);
      } catch {
        setSelected(null);
      }
    };
    window.addEventListener("focus-music-changed", sync as EventListener);
    return () => window.removeEventListener("focus-music-changed", sync as EventListener);
  }, []);

  const choosePlaylist = (p: Playlist) => {
    const next: SavedPlaylist = {
      id: p.id,
      title: p.title,
      embedType: p.embedType,
    };
    localStorage.setItem(MUSIC_STORAGE_KEY, JSON.stringify(next));
    setSelected(next);
    window.dispatchEvent(new Event("focus-music-changed"));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Link to="/focus/pomodoro" className="px-4 py-2 rounded-2xl border border-border/40 hover:bg-secondary/20 transition text-sm">
          Pomodoro
        </Link>
        <Link to="/focus/stopwatch" className="px-4 py-2 rounded-2xl border border-border/40 hover:bg-secondary/20 transition text-sm">
          Stopwatch
        </Link>
        <Link to="/focus/techniques" className="px-4 py-2 rounded-2xl border border-border/40 hover:bg-secondary/20 transition text-sm">
          Techniques
        </Link>
        <span className="px-4 py-2 rounded-2xl border border-primary/30 bg-primary/10 text-primary text-sm font-semibold">
          Music
        </span>
      </div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-3xl">
        <div className="flex items-center gap-2">
          <Music2 className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">Focus Music</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Same category system, but now using full playable sources instead of that 15-second Spotify clownery.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-4">
        {playlists.map((p, i) => {
          const active = selected?.id === p.id;
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(0.25, i * 0.05) }}
              className={`glass-card-hover rounded-3xl border p-5 ${
                active ? "border-primary/35" : "border-border/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{p.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{p.desc}</p>
                </div>
                {active && <Check className="w-4 h-4 text-primary shrink-0" />}
              </div>

              <button
                onClick={() => choosePlaylist(p)}
                className={`mt-4 w-full px-4 py-3 rounded-2xl font-semibold transition ${
                  active
                    ? "bg-primary/15 text-primary border border-primary/25"
                    : "bg-secondary/20 border border-border/40 hover:bg-secondary/30"
                }`}
              >
                {active ? "Now playing" : "Play this"}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
