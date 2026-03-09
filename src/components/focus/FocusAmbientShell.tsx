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

const STORAGE_KEY = "focus:ambient:v2";

const SCENES: SceneConfig[] = [
  {
    id: "zen-dark",
    name: "Zen Dark",
    background:
      "radial-gradient(circle at 20% 20%, rgba(250,179,0,0.14), transparent 28%), radial-gradient(circle at 80% 10%, rgba(59,130,246,0.12), transparent 30%), linear-gradient(180deg, #0b0e14 0%, #111723 100%)",
    overlay: "/themes/zen-dark/pattern.svg",
  },
  {
    id: "reading-room",
    name: "Reading Room",
    background:
      "radial-gradient(circle at 50% 20%, rgba(255,220,180,0.16), transparent 22%), linear-gradient(180deg, #1c1612 0%, #2a2018 100%)",
    overlay: "/themes/reading-room/pattern.svg",
  },
  {
    id: "neon-focus",
    name: "Neon Focus",
    background:
      "radial-gradient(circle at 20% 20%, rgba(0,255,247,0.16), transparent 25%), radial-gradient(circle at 80% 30%, rgba(255,0,153,0.15), transparent 25%), linear-gradient(180deg, #0b1220 0%, #0a0f1a 100%)",
    overlay: "/themes/neon-focus/pattern.svg",
  },
  {
    id: "blueprint",
    name: "Blueprint",
    background:
      "linear-gradient(180deg, rgba(13,34,66,0.96) 0%, rgba(10,22,42,0.98) 100%)",
    overlay: "/themes/blueprint/pattern.svg",
  },
  {
    id: "minimal-mono",
    name: "Minimal Mono",
    background:
      "linear-gradient(180deg, rgba(14,14,16,0.98) 0%, rgba(22,22,24,0.98) 100%)",
    overlay: "/themes/minimal-mono/pattern.svg",
  },
  {
    id: "forest-rain",
    name: "Forest Rain",
    background:
      "radial-gradient(circle at 50% 20%, rgba(65,132,92,0.16), transparent 26%), linear-gradient(180deg, #0f1b16 0%, #15241d 100%)",
  },
  {
    id: "sunset",
    name: "Sunset",
    background:
      "radial-gradient(circle at 50% 10%, rgba(255,190,120,0.18), transparent 25%), linear-gradient(180deg, #261421 0%, #1a2030 100%)",
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

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function loadAmbientState(): AmbientState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return {
      scene: parsed.scene || DEFAULT_STATE.scene,
      weather: parsed.weather || DEFAULT_STATE.weather,
      customBgUrl: parsed.customBgUrl || "",
      notes: parsed.notes || "",
      sounds: {
        white: Number(parsed?.sounds?.white || 0),
        brown: Number(parsed?.sounds?.brown || 0),
        pink: Number(parsed?.sounds?.pink || 0),
      },
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveAmbientState(state: AmbientState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function useNoiseMixer(volumes: AmbientState["sounds"]) {
  const ctxRef = useRef<AudioContext | null>(null);
  const gainsRef = useRef<Record<keyof AmbientState["sounds"], GainNode | null>>({
    white: null,
    brown: null,
    pink: null,
  });
  const startedRef = useRef(false);

  useEffect(() => {
    const active = Object.values(volumes).some((v) => v > 0);
    if (!active) return;

    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }

    if (!startedRef.current) {
      const ctx = ctxRef.current;

      const makeBuffer = (kind: "white" | "brown" | "pink") => {
        const length = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        let lastOut = 0;
        let b0 = 0,
          b1 = 0,
          b2 = 0,
          b3 = 0,
          b4 = 0,
          b5 = 0,
          b6 = 0;

        for (let i = 0; i < length; i++) {
          const white = Math.random() * 2 - 1;

          if (kind === "white") {
            data[i] = white * 0.28;
          } else if (kind === "brown") {
            lastOut = (lastOut + 0.02 * white) / 1.02;
            data[i] = lastOut * 3.5;
          } else {
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.969 * b2 + white * 0.153852;
            b3 = 0.8665 * b3 + white * 0.3104856;
            b4 = 0.55 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.016898;
            data[i] =
              (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
            b6 = white * 0.115926;
          }
        }

        return buffer;
      };

      (["white", "brown", "pink"] as const).forEach((kind) => {
        const source = ctx.createBufferSource();
        source.buffer = makeBuffer(kind);
        source.loop = true;

        const gain = ctx.createGain();
        gain.gain.value = clamp(volumes[kind], 0, 1);

        source.connect(gain).connect(ctx.destination);
        source.start(0);

        gainsRef.current[kind] = gain;
      });

      startedRef.current = true;
    }

    if (ctxRef.current?.state === "suspended") {
      ctxRef.current.resume().catch(() => {});
    }
  }, [volumes]);

  useEffect(() => {
    (["white", "brown", "pink"] as const).forEach((kind) => {
      const gain = gainsRef.current[kind];
      if (gain) gain.gain.value = clamp(volumes[kind], 0, 1);
    });
  }, [volumes]);
}

function WeatherLayer({
  weather,
  driftX,
  driftY,
}: {
  weather: WeatherKind;
  driftX: number;
  driftY: number;
}) {
  const particles = useMemo(() => {
    const count =
      weather === "rain"
        ? 80
        : weather === "snow"
        ? 52
        : weather === "sakura"
        ? 36
        : weather === "leaves"
        ? 30
        : weather === "stars"
        ? 44
        : 0;

    return Array.from({ length: count }).map((_, i) => {
      const sizeRand = (i * 17) % 7;
      const left = (i * 37) % 100;
      const delay = (i % 12) * 0.42;
      const duration =
        weather === "rain"
          ? 1.2 + (i % 5) * 0.18
          : weather === "snow"
          ? 6 + (i % 6) * 0.7
          : weather === "stars"
          ? 4 + (i % 6) * 0.45
          : 7 + (i % 7) * 0.75;

      return { i, left, delay, duration, sizeRand };
    });
  }, [weather]);

  if (weather === "none") return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{
        transform: `translate(${driftX * 10}px, ${driftY * 10}px)`,
      }}
    >
      {particles.map((p) => {
        const commonStyle: React.CSSProperties = {
          left: `${p.left}%`,
          top: "-12%",
          animationDelay: `${p.delay}s`,
          animationDuration: `${p.duration}s`,
        };

        if (weather === "rain") {
          return (
            <span
              key={p.i}
              className="focus-rain-particle"
              style={{
                ...commonStyle,
                height: `${26 + p.sizeRand * 5}px`,
              }}
            />
          );
        }

        if (weather === "snow") {
          const size = 4 + (p.sizeRand % 4);
          return (
            <span
              key={p.i}
              className="focus-snow-particle"
              style={{
                ...commonStyle,
                width: `${size}px`,
                height: `${size}px`,
              }}
            />
          );
        }

        if (weather === "sakura") {
          return (
            <span
              key={p.i}
              className="focus-petal-particle"
              style={commonStyle}
            >
              ✿
            </span>
          );
        }

        if (weather === "leaves") {
          return (
            <span
              key={p.i}
              className="focus-leaf-particle"
              style={commonStyle}
            >
              ✦
            </span>
          );
        }

        return (
          <span
            key={p.i}
            className="focus-star-particle"
            style={{
              left: `${p.left}%`,
              top: `${(p.i * 19) % 100}%`,
              animationDelay: `${p.delay}s`,
            }}
          />
        );
      })}
    </div>
  );
}

function ScenePanel({
  state,
  setState,
}: {
  state: AmbientState;
  setState: React.Dispatch<React.SetStateAction<AmbientState>>;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {SCENES.map((s) => (
          <button
            key={s.id}
            onClick={() => setState((prev) => ({ ...prev, scene: s.id }))}
            className={`rounded-2xl border px-3 py-3 text-left text-sm transition ${
              state.scene === s.id
                ? "border-primary/40 bg-primary/10"
                : "border-border/40 bg-secondary/20 hover:bg-secondary/30"
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Custom background URL</p>
        <input
          value={state.customBgUrl}
          onChange={(e) =>
            setState((prev) => ({ ...prev, customBgUrl: e.target.value }))
          }
          placeholder="https://... image or gif"
          className="w-full rounded-xl border border-border/40 bg-secondary/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>
    </div>
  );
}

function WeatherPanel({
  state,
  setState,
}: {
  state: AmbientState;
  setState: React.Dispatch<React.SetStateAction<AmbientState>>;
}) {
  const items: { id: WeatherKind; label: string; icon: React.ReactNode }[] = [
    { id: "none", label: "None", icon: <X className="mb-1 h-4 w-4" /> },
    { id: "rain", label: "Rain", icon: <CloudRain className="mb-1 h-4 w-4" /> },
    { id: "snow", label: "Snow", icon: <Snowflake className="mb-1 h-4 w-4" /> },
    { id: "sakura", label: "Sakura", icon: <Flower2 className="mb-1 h-4 w-4" /> },
    { id: "leaves", label: "Leaves", icon: <Leaf className="mb-1 h-4 w-4" /> },
    { id: "stars", label: "Stars", icon: <Stars className="mb-1 h-4 w-4" /> },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => setState((prev) => ({ ...prev, weather: item.id }))}
          className={`rounded-2xl border px-3 py-3 text-left text-sm transition ${
            state.weather === item.id
              ? "border-primary/40 bg-primary/10"
              : "border-border/40 bg-secondary/20 hover:bg-secondary/30"
          }`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}

function SoundPanel({
  state,
  setState,
}: {
  state: AmbientState;
  setState: React.Dispatch<React.SetStateAction<AmbientState>>;
}) {
  return (
    <div className="space-y-4">
      {([
        ["white", "White noise"],
        ["brown", "Brown noise"],
        ["pink", "Pink noise"],
      ] as const).map(([key, label]) => (
        <div key={key}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span>{label}</span>
            <span>{Math.round(state.sounds[key] * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(state.sounds[key] * 100)}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                sounds: {
                  ...prev.sounds,
                  [key]: Number(e.target.value) / 100,
                },
              }))
            }
            className="w-full accent-[hsl(var(--primary))]"
          />
        </div>
      ))}
    </div>
  );
}

function NotesPanel({
  state,
  setState,
}: {
  state: AmbientState;
  setState: React.Dispatch<React.SetStateAction<AmbientState>>;
}) {
  return (
    <textarea
      value={state.notes}
      onChange={(e) =>
        setState((prev) => ({ ...prev, notes: e.target.value }))
      }
      placeholder="Write anything here..."
      className="min-h-[220px] w-full resize-none rounded-2xl border border-border/40 bg-secondary/20 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
    />
  );
}

export default function FocusAmbientShell({
  children,
  onOpenMusic,
}: {
  children: React.ReactNode;
  onOpenMusic: () => void;
}) {
  const [state, setState] = useState<AmbientState>(() => loadAmbientState());
  const [openPanel, setOpenPanel] = useState<null | "scene" | "weather" | "sound" | "notes">(null);
  const [dockOpen, setDockOpen] = useState(true);
  const [drift, setDrift] = useState({ x: 0, y: 0 });

  useNoiseMixer(state.sounds);

  useEffect(() => {
    saveAmbientState(state);
  }, [state]);

  const scene = SCENES.find((s) => s.id === state.scene) || SCENES[0];

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-border/40 bg-background/20">
      <div
        className="absolute inset-0"
        onMouseMove={(e) => {
          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;
          setDrift({ x, y });
        }}
        onMouseLeave={() => setDrift({ x: 0, y: 0 })}
        style={{
          background: state.customBgUrl
            ? `linear-gradient(rgba(0,0,0,0.22), rgba(0,0,0,0.45)), url(${state.customBgUrl}) center / cover no-repeat`
            : scene.background,
        }}
      >
        {scene.overlay && !state.customBgUrl && (
          <div
            className="absolute inset-0 opacity-[0.14] mix-blend-screen"
            style={{
              backgroundImage: `url(${scene.overlay})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              transform: `translate(${drift.x * 8}px, ${drift.y * 8}px) scale(1.03)`,
            }}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/10 to-black/35" />
        <WeatherLayer weather={state.weather} driftX={drift.x} driftY={drift.y} />
      </div>

      <div className="relative z-10 p-4 pb-24 md:p-5 md:pb-24">{children}</div>

      {openPanel && (
        <div className="absolute left-4 top-4 z-30 w-[min(92vw,390px)] rounded-3xl border border-border/40 bg-background/75 p-4 backdrop-blur-xl shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold">
              {openPanel === "scene" && "Scene"}
              {openPanel === "weather" && "Weather"}
              {openPanel === "sound" && "White noise"}
              {openPanel === "notes" && "Notes"}
            </p>
            <button
              onClick={() => setOpenPanel(null)}
              className="rounded-xl p-2 transition hover:bg-secondary/30"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {openPanel === "scene" && <ScenePanel state={state} setState={setState} />}
          {openPanel === "weather" && <WeatherPanel state={state} setState={setState} />}
          {openPanel === "sound" && <SoundPanel state={state} setState={setState} />}
          {openPanel === "notes" && <NotesPanel state={state} setState={setState} />}
        </div>
      )}

      <div className="absolute bottom-4 right-4 z-30 flex items-end gap-2">
        {dockOpen && (
          <div className="focus-ambient-dock">
            <button
              onClick={() => setOpenPanel(openPanel === "scene" ? null : "scene")}
              className="focus-ambient-chip"
            >
              <ImageIcon className="h-4 w-4" />
              <span>Scene</span>
            </button>

            <button
              onClick={() => setOpenPanel(openPanel === "weather" ? null : "weather")}
              className="focus-ambient-chip"
            >
              <CloudRain className="h-4 w-4" />
              <span>Weather</span>
            </button>

            <button
              onClick={() => setOpenPanel(openPanel === "sound" ? null : "sound")}
              className="focus-ambient-chip"
            >
              <Volume2 className="h-4 w-4" />
              <span>Noise</span>
            </button>

            <button
              onClick={() => setOpenPanel(openPanel === "notes" ? null : "notes")}
              className="focus-ambient-chip"
            >
              <NotebookPen className="h-4 w-4" />
              <span>Notes</span>
            </button>

            <button onClick={onOpenMusic} className="focus-ambient-chip">
              <Music4 className="h-4 w-4" />
              <span>Music</span>
            </button>
          </div>
        )}

        <button
          onClick={() => setDockOpen((v) => !v)}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/40 bg-background/65 backdrop-blur-xl transition hover:bg-background/80"
          title={dockOpen ? "Collapse tools" : "Open tools"}
        >
          {dockOpen ? (
            <PanelBottomClose className="h-5 w-5" />
          ) : (
            <PanelBottomOpen className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  );
      }
