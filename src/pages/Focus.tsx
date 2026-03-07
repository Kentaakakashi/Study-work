import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Music2, ExternalLink, X } from "lucide-react";
import { useEffect, useState } from "react";
import Pomodoro from "./Pomodoro";
import Stopwatch from "./Stopwatch";
import FocusTechniques from "./FocusTechniques";
import FocusMusic from "./FocusMusic";

const MUSIC_STORAGE_KEY = "focus:selectedPlaylist";

type SavedPlaylist = {
  id: string;
  title: string;
  embedType: "youtube-video" | "youtube-playlist";
};

function getPlayerSrc(playlist: SavedPlaylist) {
  if (playlist.embedType === "youtube-playlist") {
    return `https://www.youtube.com/embed/videoseries?list=${playlist.id}&autoplay=1&controls=1&rel=0`;
  }
  return `https://www.youtube.com/embed/${playlist.id}?autoplay=1&controls=1&rel=0&loop=1&playlist=${playlist.id}`;
}

export default function Focus() {
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState<SavedPlaylist | null>(() => {
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
        setPlaylist(raw ? JSON.parse(raw) : null);
      } catch {
        setPlaylist(null);
      }
    };

    window.addEventListener("focus-music-changed", sync as EventListener);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("focus-music-changed", sync as EventListener);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Routes>
        <Route index element={<Navigate to="pomodoro" replace />} />
        <Route path="pomodoro" element={<Pomodoro />} />
        <Route path="stopwatch" element={<Stopwatch />} />
        <Route path="techniques" element={<FocusTechniques />} />
        <Route path="music" element={<FocusMusic />} />
        <Route path="*" element={<Navigate to="pomodoro" replace />} />
      </Routes>

      {playlist && (
        <div className="glass-card p-4 rounded-3xl border border-border/40">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="min-w-0 flex items-center gap-2">
              <Music2 className="w-4 h-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">Focus Music</p>
                <p className="text-xs text-muted-foreground truncate">{playlist.title}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/focus/music")}
                className="px-3 py-2 rounded-xl border border-border/40 hover:bg-secondary/20 transition text-xs"
              >
                <ExternalLink className="w-4 h-4 inline mr-1" />
                Change
              </button>

              <button
                onClick={() => {
                  localStorage.removeItem(MUSIC_STORAGE_KEY);
                  setPlaylist(null);
                  window.dispatchEvent(new Event("focus-music-changed"));
                }}
                className="px-3 py-2 rounded-xl border border-border/40 hover:bg-secondary/20 transition text-xs"
              >
                <X className="w-4 h-4 inline mr-1" />
                Stop
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border/40">
            <iframe
              title={playlist.title}
              style={{ border: 0, width: "100%", height: 220 }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              loading="lazy"
              src={getPlayerSrc(playlist)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
