import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

type Playlist = {
  title: string;
  desc: string;
  id: string; // Spotify playlist id
};

const playlists: Playlist[] = [
  {
    title: "Deep Focus",
    desc: "Low-distraction instrumentals for serious studying.",
    id: "37i9dQZF1DWZeKCadgRdKQ",
  },
  {
    title: "lofi beats",
    desc: "Chill beats, minimal lyrics. The classic.",
    id: "37i9dQZF1DWWQRwui0ExPn",
  },
  {
    title: "Peaceful Piano",
    desc: "Soft piano for reading, writing, and not losing your mind.",
    id: "37i9dQZF1DX4sWSpwq3LiO",
  },
];

export default function FocusMusic() {
  const nav = useNavigate();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-3xl">
        <h2 className="text-lg font-bold">Focus Music</h2>
        <p className="text-xs text-muted-foreground mt-2">Spotify embeds. Pick one and lock in.</p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-4">
        {playlists.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(0.25, i * 0.05) }}
            className="glass-card-hover rounded-3xl border border-border/40 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold truncate">{p.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{p.desc}</p>
              </div>
              <a
                href={`https://open.spotify.com/playlist/${p.id}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs px-3 py-2 rounded-2xl border border-border/40 hover:bg-secondary/20 transition whitespace-nowrap"
              >
                Open
              </a>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-border/40">
              <iframe
                title={p.title}
                style={{ border: 0, width: "100%", height: 352 }}
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                src={`https://open.spotify.com/embed/playlist/${p.id}?utm_source=generator`}
              />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <button className="px-4 py-2 rounded-2xl border border-border/40 hover:bg-secondary/20 transition" onClick={() => nav("/focus/pomodoro")}>
          ← Back to Focus
        </button>

        <button className="px-4 py-2 rounded-2xl border border-border/40 hover:bg-secondary/20 transition" onClick={() => nav("/focus/techniques")}>
          Techniques
        </button>
      </div>
    </div>
  );
}
