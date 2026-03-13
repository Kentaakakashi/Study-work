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
  Sparkles,
  Palette,
  X,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";

type WeatherKind = "none" | "rain" | "snow" | "sakura" | "leaves" | "stars";
type PanelTab = "weather" | "scene" | "sound" | "notes";

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
  accent: string;
};

type AmbientState = {
  scene: SceneId;
  weather: WeatherKind;
  notes: string;
  sounds: {
    white: number;
    brown: number;
    pink: number;
  };
};

type FocusAmbientShellProps = {
  children: React.ReactNode;
  onOpenMusic?: () => void;
};

type Particle = {
  id: number;
  left: number;
  top?: number;
  delay: number;
  duration: number;
  drift: number;
  size: number;
  opacity: number;
};

const STORAGE_KEY = "focus:ambient:v4";

const SCENES: SceneConfig[] = [
  {
    id: "zen-dark",
    name: "Zen Dark",
    accent: "rgba(250,179,0,0.35)",
    background:
      "radial-gradient(circle at 18% 16%, rgba(250,179,0,0.18), transparent 24%), radial-gradient(circle at 82% 18%, rgba(59,130,246,0.14), transparent 28%), radial-gradient(circle at 50% 70%, rgba(168,85,247,0.10), transparent 32%), linear-gradient(180deg, #0a0d14 0%, #0f1522 100%)",
  },
  {
    id: "reading-room",
    name: "Reading Room",
    accent: "rgba(255,205,150,0.35)",
    background:
      "radial-gradient(circle at 50% 18%, rgba(255,210,160,0.18), transparent 24%), radial-gradient(circle at 10% 85%, rgba(130,80,45,0.18), transparent 30%), linear-gradient(180deg, #1d1510 0%, #2b1f18 100%)",
  },
  {
    id: "neon-focus",
    name: "Neon Focus",
    accent: "rgba(0,255,247,0.35)",
    background:
      "radial-gradient(circle at 20% 20%, rgba(0,255,247,0.18), transparent 24%), radial-gradient(circle at 80% 24%, rgba(255,0,153,0.17), transparent 24%), radial-gradient(circle at 50% 75%, rgba(120,90,255,0.14), transparent 30%), linear-gradient(180deg, #08111c 0%, #090d16 100%)",
  },
  {
    id: "blueprint",
    name: "Blueprint",
    accent: "rgba(72,175,255,0.35)",
    background:
      "radial-gradient(circle at 50% 0%, rgba(72,175,255,0.15), transparent 26%), linear-gradient(180deg, rgba(12,30,57,0.98) 0%, rgba(8,19,38,1) 100%)",
  },
  {
    id: "minimal-mono",
    name: "Minimal Mono",
    accent: "rgba(255,255,255,0.18)",
    background:
      "radial-gradient(circle at 50% 12%, rgba(255,255,255,0.08), transparent 20%), linear-gradient(180deg, #090909 0%, #151515 100%)",
  },
  {
    id: "forest-rain",
    name: "Forest Rain",
    accent: "rgba(74,222,128,0.28)",
    background:
      "radial-gradient(circle at 25% 20%, rgba(74,222,128,0.16), transparent 22%), radial-gradient(circle at 80% 75%, rgba(34,197,94,0.10), transparent 28%), linear-gradient(180deg, #0d2217 0%, #08140d 100%)",
  },
  {
    id: "sunset",
    name: "Sunset",
    accent: "rgba(255,160,90,0.34)",
    background:
      "radial-gradient(circle at 50% 18%, rgba(255,180,110,0.18), transparent 24%), radial-gradient(circle at 78% 28%, rgba(255,90,120,0.12), transparent 24%), linear-gradient(180deg, #3a1616 0%, #13090a 100%)",
  },
];

const DEFAULT_STATE: AmbientState = {
  scene: "zen-dark",
  weather: "none",
  notes: "",
  sounds: {
    white: 0,
    brown: 0,
    pink: 0,
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function loadAmbientState(): AmbientState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;

    const parsed = JSON.parse(raw);

    return {
      scene: SCENES.some((s) => s.id === parsed?.scene) ? parsed.scene : DEFAULT_STATE.scene,
      weather: ["none", "rain", "snow", "sakura", "leaves", "stars"].includes(parsed?.weather)
        ? parsed.weather
        : DEFAULT_STATE.weather,
      notes: typeof parsed?.notes === "string" ? parsed.notes : "",
      sounds: {
        white: clamp(Number(parsed?.sounds?.white) || 0, 0, 100),
        brown: clamp(Number(parsed?.sounds?.brown) || 0, 0, 100),
        pink: clamp(Number(parsed?.sounds?.pink) || 0, 0, 100),
      },
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function makeSeededParticles(type: WeatherKind, mobile: boolean): Particle[] {
  const counts: Record<Exclude<WeatherKind, "none">, number> = {
    rain: mobile ? 46 : 90,
    snow: mobile ? 32 : 60,
    sakura: mobile ? 24 : 40,
    leaves: mobile ? 18 : 28,
    stars: mobile ? 36 : 65,
  };

  if (type === "none") return [];

  const count = counts[type];
  const particles: Particle[] = [];

  for (let i = 0; i < count; i += 1) {
    const seed = i * 9973 + type.length * 131;
    const r1 = ((seed * 37) % 1000) / 1000;
    const r2 = ((seed * 67) % 1000) / 1000;
    const r3 = ((seed * 97) % 1000) / 1000;
    const r4 = ((seed * 139) % 1000) / 1000;
    const r5 = ((seed * 191) % 1000) / 1000;
    const r6 = ((seed * 223) % 1000) / 1000;

    particles.push({
      id: i,
      left: r1 * 100,
      top: r6 * 100,
      delay: -r2 * 8,
      duration:
        type === "rain"
          ? 0.8 + r3 * 0.9
          : type === "snow"
          ? 7 + r3 * 6
          : type === "stars"
          ? 2.2 + r3 * 2.2
          : 8 + r3 * 6,
      drift:
        type === "rain"
          ? 8 + r4 * 20
          : type === "snow"
          ? -30 + r4 * 60
          : -55 + r4 * 110,
      size:
        type === "rain"
          ? 1 + r5 * 1.4
          : type === "snow"
          ? 3 + r5 * 5
          : type === "stars"
          ? 1.5 + r5 * 2.5
          : 8 + r5 * 10,
      opacity:
        type === "rain"
          ? 0.28 + r6 * 0.35
          : type === "stars"
          ? 0.35 + r6 * 0.65
          : 0.55 + r6 * 0.35,
    });
  }

  return particles;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768;
  });

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return isMobile;
}

function createNoiseBuffer(
  audioContext: AudioContext,
  color: "white" | "brown" | "pink"
) {
  const bufferSize = audioContext.sampleRate * 2;
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const output = buffer.getChannelData(0);

  if (color === "white") {
    for (let i = 0; i < bufferSize; i += 1) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  if (color === "brown") {
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i += 1) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      output[i] = lastOut * 3.5;
    }
    return buffer;
  }

  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;

  for (let i = 0; i < bufferSize; i += 1) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }

  return buffer;
}

export default function FocusAmbientShell({
  children,
  onOpenMusic,
}: FocusAmbientShellProps) {
  const isMobile = useIsMobile();
  const [state, setState] = useState<AmbientState>(() => loadAmbientState());
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<PanelTab>("weather");
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioNodesRef = useRef<
    Partial<
      Record<
        "white" | "brown" | "pink",
        { source: AudioBufferSourceNode; gain: GainNode }
      >
    >
  >({});

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    return () => {
      Object.values(audioNodesRef.current).forEach((node) => {
        try {
          node?.source.stop();
        } catch {
          //
        }
      });

      try {
        audioContextRef.current?.close();
      } catch {
        //
      }
    };
  }, []);

  const scene = useMemo(
    () => SCENES.find((item) => item.id === state.scene) ?? SCENES[0],
    [state.scene]
  );

  const particles = useMemo(
    () => makeSeededParticles(state.weather, isMobile),
    [state.weather, isMobile]
  );

  async function ensureAudioContext() {
    if (typeof window === "undefined") return null;

    if (!audioContextRef.current) {
      const Ctx =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (!Ctx) return null;

      audioContextRef.current = new Ctx();
    }

    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }

    return audioContextRef.current;
  }

  async function setNoiseVolume(color: "white" | "brown" | "pink", value: number) {
    const next = clamp(value, 0, 100);

    setState((prev) => ({
      ...prev,
      sounds: {
        ...prev.sounds,
        [color]: next,
      },
    }));

    const ctx = await ensureAudioContext();
    if (!ctx) return;

    const normalized = next / 100;

    if (normalized <= 0.001) {
      const existing = audioNodesRef.current[color];
      if (existing) {
        try {
          existing.source.stop();
        } catch {
          //
        }
        existing.source.disconnect();
        existing.gain.disconnect();
        delete audioNodesRef.current[color];
      }
      return;
    }

    let existing = audioNodesRef.current[color];
    if (!existing) {
      const source = ctx.createBufferSource();
      source.buffer = createNoiseBuffer(ctx, color);
      source.loop = true;

      const gain = ctx.createGain();
      gain.gain.value = normalized * 0.18;

      source.connect(gain);
      gain.connect(ctx.destination);
      source.start(0);

      existing = { source, gain };
      audioNodesRef.current[color] = existing;
    }

    existing.gain.gain.value = normalized * 0.18;
  }

  function setWeather(kind: WeatherKind) {
    setState((prev) => ({
      ...prev,
      weather: prev.weather === kind ? "none" : kind,
    }));
  }

  function setScene(sceneId: SceneId) {
    setState((prev) => ({
      ...prev,
      scene: sceneId,
    }));
  }

  function updateNotes(value: string) {
    setState((prev) => ({
      ...prev,
      notes: value,
    }));
  }

  return (
    <div className="focus-ambient-shell">
      <div
        className="focus-ambient-bg"
        style={{ background: scene.background }}
      />

      <div
        className="focus-ambient-vignette"
        style={{
          background: `radial-gradient(circle at 50% 20%, transparent 0%, rgba(0,0,0,0.04) 35%, rgba(0,0,0,0.36) 100%), radial-gradient(circle at 50% 0%, ${scene.accent}, transparent 42%)`,
        }}
      />

      <WeatherLayer type={state.weather} particles={particles} />

      <div className="focus-ambient-content">
        {children}
      </div>

      <div className="focus-ambient-launcher-wrap">
        {menuOpen && (
          <div className="focus-ambient-panel">
            <div className="focus-ambient-panel-header">
              <div>
                <p className="focus-ambient-panel-eyebrow">Focus Environment</p>
                <h3 className="focus-ambient-panel-title">Ambient Controls</h3>
              </div>

              <button
                type="button"
                className="focus-ambient-close-btn"
                onClick={() => setMenuOpen(false)}
                aria-label="Close ambient controls"
              >
                <X size={16} />
              </button>
            </div>

            <div className="focus-ambient-tabs">
              <button
                type="button"
                className={`focus-ambient-tab ${activeTab === "weather" ? "is-active" : ""}`}
                onClick={() => setActiveTab("weather")}
              >
                <Sparkles size={15} />
                Motion
              </button>

              <button
                type="button"
                className={`focus-ambient-tab ${activeTab === "scene" ? "is-active" : ""}`}
                onClick={() => setActiveTab("scene")}
              >
                <Palette size={15} />
                Gallery
              </button>

              <button
                type="button"
                className={`focus-ambient-tab ${activeTab === "sound" ? "is-active" : ""}`}
                onClick={() => setActiveTab("sound")}
              >
                <Volume2 size={15} />
                Sound
              </button>

              <button
                type="button"
                className={`focus-ambient-tab ${activeTab === "notes" ? "is-active" : ""}`}
                onClick={() => setActiveTab("notes")}
              >
                <NotebookPen size={15} />
                Notes
              </button>
            </div>

            <div className="focus-ambient-panel-body">
              {activeTab === "weather" && (
                <div className="focus-ambient-grid">
                  <AmbientOptionButton
                    label="Off"
                    active={state.weather === "none"}
                    onClick={() => setWeather("none")}
                    icon={<X size={15} />}
                  />
                  <AmbientOptionButton
                    label="Rain"
                    active={state.weather === "rain"}
                    onClick={() => setWeather("rain")}
                    icon={<CloudRain size={15} />}
                  />
                  <AmbientOptionButton
                    label="Snow"
                    active={state.weather === "snow"}
                    onClick={() => setWeather("snow")}
                    icon={<Snowflake size={15} />}
                  />
                  <AmbientOptionButton
                    label="Sakura"
                    active={state.weather === "sakura"}
                    onClick={() => setWeather("sakura")}
                    icon={<Flower2 size={15} />}
                  />
                  <AmbientOptionButton
                    label="Leaves"
                    active={state.weather === "leaves"}
                    onClick={() => setWeather("leaves")}
                    icon={<Leaf size={15} />}
                  />
                  <AmbientOptionButton
                    label="Stars"
                    active={state.weather === "stars"}
                    onClick={() => setWeather("stars")}
                    icon={<Stars size={15} />}
                  />
                </div>
              )}

              {activeTab === "scene" && (
                <div className="focus-scene-list">
                  {SCENES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setScene(item.id)}
                      className={`focus-scene-card ${state.scene === item.id ? "is-active" : ""}`}
                    >
                      <div
                        className="focus-scene-preview"
                        style={{ background: item.background }}
                      />
                      <div className="focus-scene-meta">
                        <span>{item.name}</span>
                        {state.scene === item.id && <span className="focus-scene-live">Live</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === "sound" && (
                <div className="focus-sound-list">
                  <SoundSlider
                    label="White Noise"
                    value={state.sounds.white}
                    onChange={(value) => void setNoiseVolume("white", value)}
                  />
                  <SoundSlider
                    label="Brown Noise"
                    value={state.sounds.brown}
                    onChange={(value) => void setNoiseVolume("brown", value)}
                  />
                  <SoundSlider
                    label="Pink Noise"
                    value={state.sounds.pink}
                    onChange={(value) => void setNoiseVolume("pink", value)}
                  />

                  <button
                    type="button"
                    className="focus-ambient-music-btn"
                    onClick={() => {
                      onOpenMusic?.();
                      setMenuOpen(false);
                    }}
                  >
                    <Music4 size={16} />
                    Open Music Page
                  </button>
                </div>
              )}

              {activeTab === "notes" && (
                <div className="focus-notes-panel">
                  <div className="focus-notes-header">
                    <ImageIcon size={15} />
                    <span>Quick notes for your session</span>
                  </div>
                  <textarea
                    className="focus-notes-textarea"
                    value={state.notes}
                    onChange={(e) => updateNotes(e.target.value)}
                    placeholder="Write your task, target, formula, chapter, or whatever your sleep-deprived academic soul needs..."
                  />
                </div>
              )}
            </div>
          </div>
        )}

        <button
          type="button"
          className={`focus-ambient-launcher ${menuOpen ? "is-open" : ""}`}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Open ambient controls"
        >
          {menuOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
        </button>
      </div>
    </div>
  );
}

function AmbientOptionButton({
  label,
  active,
  icon,
  onClick,
}: {
  label: string;
  active: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`focus-ambient-option ${active ? "is-active" : ""}`}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function SoundSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="focus-sound-card">
      <div className="focus-sound-top">
        <span>{label}</span>
        <span>{value}%</span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="focus-sound-range"
      />
    </label>
  );
}

function WeatherLayer({
  type,
  particles,
}: {
  type: WeatherKind;
  particles: Particle[];
}) {
  if (type === "none") return null;

  return (
    <div className="focus-weather-layer" aria-hidden="true">
      {type === "stars" ? (
        particles.map((particle) => (
          <span
            key={particle.id}
            className="focus-star-particle"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top ?? 0}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          />
        ))
      ) : (
        particles.map((particle) => {
          const cls =
            type === "rain"
              ? "focus-rain-particle"
              : type === "snow"
              ? "focus-snow-particle"
              : type === "sakura"
              ? "focus-petal-particle"
              : "focus-leaf-particle";

          return (
            <span
              key={particle.id}
              className={cls}
              style={
                {
                  left: `${particle.left}%`,
                  width:
                    type === "rain"
                      ? `${particle.size}px`
                      : `${particle.size}px`,
                  height:
                    type === "rain"
                      ? `${particle.size * 34}px`
                      : `${particle.size * 1.1}px`,
                  opacity: particle.opacity,
                  animationDelay: `${particle.delay}s`,
                  animationDuration: `${particle.duration}s`,
                  "--focus-drift": `${particle.drift}px`,
                } as React.CSSProperties
              }
            />
          );
        })
      )}
    </div>
  );
                      }
