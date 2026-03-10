import { useEffect, useMemo, useRef, useState } from "react";
import {
  CloudRain,
  Snowflake,
  Flower2,
  Leaf,
  Stars,
  Image as ImageIcon,
  NotebookPen,
  Volume2,
  Music4,
  X,
  PanelBottomOpen,
  PanelBottomClose,
} from "lucide-react";

type WeatherKind = "none" | "rain" | "snow" | "sakura" | "leaves" | "stars";

type SceneId =
  | "zen-dark"
  | "reading-room"
  | "neon-focus"
  | "blueprint"
  | "minimal-mono"
  | "forest-rain"
  | "sunset";

type SceneConfig = {
  id: SceneId;
  name: string;
  background: string;
  overlay?: string;
};

type AmbientState = {
  scene: SceneId;
  weather: WeatherKind;
  customBgUrl: string;
  notes: string;
  sounds: {
    white: number;
    brown: number;
    pink: number;
  };
};

const STORAGE_KEY = "focus:ambient:v3";

const SCENES: SceneConfig[] = [
  {
    id: "zen-dark",
    name: "Zen Dark",
    background:
      "radial-gradient(circle at 20% 20%, rgba(250,179,0,0.14), transparent 28%), radial-gradient(circle at 80% 10%, rgba(59,130,246,0.12), transparent 30%), linear-gradient(180deg,#0b0e14 0%,#111723 100%)",
  },
  {
    id: "reading-room",
    name: "Reading Room",
    background:
      "radial-gradient(circle at 50% 20%, rgba(255,220,180,0.16), transparent 22%), linear-gradient(180deg,#1c1612 0%,#2a2018 100%)",
  },
  {
    id: "neon-focus",
    name: "Neon Focus",
    background:
      "radial-gradient(circle at 20% 20%, rgba(0,255,247,0.16), transparent 25%), radial-gradient(circle at 80% 30%, rgba(255,0,153,0.15), transparent 25%), linear-gradient(180deg,#0b1220 0%,#0a0f1a 100%)",
  },
  {
    id: "blueprint",
    name: "Blueprint",
    background:
      "linear-gradient(180deg, rgba(13,34,66,0.96) 0%, rgba(10,22,42,0.98) 100%)",
  },
  {
    id: "minimal-mono",
    name: "Minimal Mono",
    background:
      "linear-gradient(180deg,#0a0a0a 0%,#151515 100%)",
  },
  {
    id: "forest-rain",
    name: "Forest Rain",
    background:
      "linear-gradient(180deg,#0f2d1e 0%,#091c12 100%)",
  },
  {
    id: "sunset",
    name: "Sunset",
    background:
      "linear-gradient(180deg,#4a1d1d 0%,#1b0d0d 100%)",
  },
];

const DEFAULT_STATE: AmbientState = {
  scene: "zen-dark",
  weather: "none",
  customBgUrl: "",
  notes: "",
  sounds: {
    white: 0,
    brown: 0,
    pink: 0,
  },
};

function loadState(): AmbientState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(saved) };
  } catch {
    return DEFAULT_STATE;
  }
}

export default function FocusAmbientShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<AmbientState>(() => loadState());
  const [dockOpen, setDockOpen] = useState(true);
  const [notesOpen, setNotesOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const scene = useMemo(
    () => SCENES.find((s) => s.id === state.scene) ?? SCENES[0],
    [state.scene]
  );

  function setWeather(kind: WeatherKind) {
    setState((s) => ({ ...s, weather: kind }));
  }

  function setScene(id: SceneId) {
    setState((s) => ({ ...s, scene: id }));
  }

  function updateNotes(notes: string) {
    setState((s) => ({ ...s, notes }));
  }

  return (
    <div className="relative w-full h-full overflow-hidden">

      {/* background */}
      <div
        className="absolute inset-0 -z-10"
        style={{ background: scene.background }}
      />

      {/* weather */}
      <WeatherLayer type={state.weather} />

      {/* focus content */}
      <div className="relative h-full">{children}</div>

      {/* dock */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="focus-ambient-dock">

          <button
            className="focus-ambient-chip"
            onClick={() => setDockOpen(!dockOpen)}
          >
            {dockOpen ? <PanelBottomClose size={16} /> : <PanelBottomOpen size={16} />}
          </button>

          {dockOpen && (
            <>
              <button
                className="focus-ambient-chip"
                onClick={() => setWeather("rain")}
              >
                <CloudRain size={16} />
              </button>

              <button
                className="focus-ambient-chip"
                onClick={() => setWeather("snow")}
              >
                <Snowflake size={16} />
              </button>

              <button
                className="focus-ambient-chip"
                onClick={() => setWeather("sakura")}
              >
                <Flower2 size={16} />
              </button>

              <button
                className="focus-ambient-chip"
                onClick={() => setWeather("leaves")}
              >
                <Leaf size={16} />
              </button>

              <button
                className="focus-ambient-chip"
                onClick={() => setWeather("stars")}
              >
                <Stars size={16} />
              </button>

              <button
                className="focus-ambient-chip"
                onClick={() => setNotesOpen(!notesOpen)}
              >
                <NotebookPen size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* notes */}
      {notesOpen && (
        <div className="fixed right-6 bottom-24 w-72 p-3 rounded-xl bg-black/60 backdrop-blur-lg text-white">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm">Focus Notes</span>
            <button onClick={() => setNotesOpen(false)}>
              <X size={16} />
            </button>
          </div>

          <textarea
            className="w-full h-32 text-sm bg-transparent outline-none resize-none"
            value={state.notes}
            onChange={(e) => updateNotes(e.target.value)}
            placeholder="Write quick focus notes..."
          />
        </div>
      )}
    </div>
  );
}

function WeatherLayer({ type }: { type: WeatherKind }) {
  const particles = useMemo(() => {
    const count = 80;
    return new Array(count).fill(0).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 6 + Math.random() * 6,
      size: 2 + Math.random() * 4,
    }));
  }, [type]);

  if (type === "none") return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => {
        let cls = "";

        if (type === "rain") cls = "focus-rain-particle";
        if (type === "snow") cls = "focus-snow-particle";
        if (type === "sakura") cls = "focus-petal-particle";
        if (type === "leaves") cls = "focus-leaf-particle";
        if (type === "stars") cls = "focus-star-particle";

        return (
          <span
            key={p.id}
            className={cls}
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              width: p.size,
              height: p.size,
            }}
          />
        );
      })}
    </div>
  );
}
