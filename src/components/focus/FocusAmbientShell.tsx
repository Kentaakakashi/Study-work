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
  PlaySquare,
} from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

type WeatherKind = "none" | "rain" | "snow" | "sakura" | "leaves" | "stars";
type PanelTab = "weather" | "scene" | "sound" | "notes";
type SceneGroup = "static" | "gradient" | "video";

type BuiltInSceneId =
  | "zen-dark"
  | "reading-room"
  | "neon-focus"
  | "blueprint"
  | "minimal-mono"
  | "forest-rain"
  | "sunset"
  | "rain-room";

type SceneConfig = {
  id: string;
  name: string;
  accent: string;
  background: string;
  group: SceneGroup;
  sourceUrl?: string;
  previewUrl?: string;
  posterSrc?: string;
  isBuiltIn?: boolean;
};

type AmbientState = {
  scene: string;
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

type AmbientSceneDoc = {
  id: string;
  name: string;
  type: "static" | "video";
  sourceUrl: string;
  previewUrl?: string;
  posterUrl?: string;
  accent?: string;
  background?: string;
  isVisible?: boolean;
};

const STORAGE_KEY = "focus:ambient:v7";

const CLOUDINARY_RAIN_ROOM_VIDEO =
  "https://res.cloudinary.com/dkfh3juaf/video/upload/f_auto,q_auto:best,vc_auto/rain-room-loop_jgosv4.mp4";

const BUILT_IN_SCENES: SceneConfig[] = [
  {
    id: "rain-room",
    name: "Rain Room",
    group: "video",
    isBuiltIn: true,
    accent: "rgba(140, 220, 255, 0.20)",
    background:
      "linear-gradient(180deg, rgba(7,12,18,0.94) 0%, rgba(8,13,20,0.98) 100%)",
    sourceUrl: CLOUDINARY_RAIN_ROOM_VIDEO,
    previewUrl: CLOUDINARY_RAIN_ROOM_VIDEO,
  },
  {
    id: "zen-dark",
    name: "Zen Dark",
    group: "gradient",
    isBuiltIn: true,
    accent: "rgba(250,179,0,0.35)",
    background:
      "radial-gradient(circle at 18% 16%, rgba(250,179,0,0.18), transparent 24%), radial-gradient(circle at 82% 18%, rgba(59,130,246,0.14), transparent 28%), radial-gradient(circle at 50% 70%, rgba(168,85,247,0.10), transparent 32%), linear-gradient(180deg, #0a0d14 0%, #0f1522 100%)",
  },
  {
    id: "reading-room",
    name: "Reading Room",
    group: "gradient",
    isBuiltIn: true,
    accent: "rgba(255,205,150,0.35)",
    background:
      "radial-gradient(circle at 50% 18%, rgba(255,210,160,0.18), transparent 24%), radial-gradient(circle at 10% 85%, rgba(130,80,45,0.18), transparent 30%), linear-gradient(180deg, #1d1510 0%, #2b1f18 100%)",
  },
  {
    id: "neon-focus",
    name: "Neon Focus",
    group: "gradient",
    isBuiltIn: true,
    accent: "rgba(0,255,247,0.35)",
    background:
      "radial-gradient(circle at 20% 20%, rgba(0,255,247,0.18), transparent 24%), radial-gradient(circle at 80% 24%, rgba(255,0,153,0.17), transparent 24%), radial-gradient(circle at 50% 75%, rgba(120,90,255,0.14), transparent 30%), linear-gradient(180deg, #08111c 0%, #090d16 100%)",
  },
  {
    id: "blueprint",
    name: "Blueprint",
    group: "gradient",
    isBuiltIn: true,
    accent: "rgba(72,175,255,0.35)",
    background:
      "radial-gradient(circle at 50% 0%, rgba(72,175,255,0.15), transparent 26%), linear-gradient(180deg, rgba(12,30,57,0.98) 0%, rgba(8,19,38,1) 100%)",
  },
  {
    id: "minimal-mono",
    name: "Minimal Mono",
    group: "gradient",
    isBuiltIn: true,
    accent: "rgba(255,255,255,0.18)",
    background:
      "radial-gradient(circle at 50% 12%, rgba(255,255,255,0.08), transparent 20%), linear-gradient(180deg, #090909 0%, #151515 100%)",
  },
  {
    id: "forest-rain",
    name: "Forest Rain",
    group: "gradient",
    isBuiltIn: true,
    accent: "rgba(74,222,128,0.28)",
    background:
      "radial-gradient(circle at 25% 20%, rgba(74,222,128,0.16), transparent 22%), radial-gradient(circle at 80% 75%, rgba(34,197,94,0.10), transparent 28%), linear-gradient(180deg, #0d2217 0%, #08140d 100%)",
  },
  {
    id: "sunset",
    name: "Sunset",
    group: "gradient",
    isBuiltIn: true,
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

function hashString(input: string) {
  let h = 1779033703 ^ input.length;
  for (let i = 0; i < input.length; i += 1) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function random() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function loadAmbientState(): AmbientState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;

    const parsed = JSON.parse(raw);

    return {
      scene: typeof parsed?.scene === "string" ? parsed.scene : DEFAULT_STATE.scene,
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

function optimizeCloudinaryMediaUrl(
  url?: string,
  kind: "video" | "image" = "image"
) {
  if (!url || !url.includes("res.cloudinary.com")) return url || "";

  const uploadMarker =
    kind === "video" ? "/video/upload/" : "/image/upload/";

  if (!url.includes(uploadMarker)) return url;

  const qualitySegment =
    kind === "video"
      ? "f_auto,q_auto:best,vc_auto"
      : "f_auto,q_auto:best";

  const escapedMarker = uploadMarker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const transformRegex = new RegExp(
    `${escapedMarker}(?:[^/]+/)?`,
    "i"
  );

  return url.replace(transformRegex, `${uploadMarker}${qualitySegment}/`);
}

function getSceneSourceUrl(scene: SceneConfig) {
  if (!scene.sourceUrl) return "";
  return optimizeCloudinaryMediaUrl(
    scene.sourceUrl,
    scene.group === "video" ? "video" : "image"
  );
}

function getScenePreviewUrl(scene: SceneConfig) {
  const raw = scene.previewUrl || scene.posterSrc || scene.sourceUrl || "";
  return optimizeCloudinaryMediaUrl(raw, "image");
}

function makeSeededParticles(type: WeatherKind, mobile: boolean): Particle[] {
  const counts: Record<Exclude<WeatherKind, "none">, number> = {
    rain: mobile ? 46 : 90,
    snow: mobile ? 30 : 58,
    sakura: mobile ? 24 : 42,
    leaves: mobile ? 18 : 30,
    stars: mobile ? 42 : 80,
  };

  if (type === "none") return [];

  const count = counts[type];
  const particles: Particle[] = [];

  const typeSeed = hashString(`${type}-${mobile ? "mobile" : "desktop"}`);
  const random = mulberry32(typeSeed);

  for (let i = 0; i < count; i += 1) {
    const spreadBase = (i + random()) / count;
    const spreadJitter = (random() - 0.5) * (mobile ? 1.8 : 1.2);
    const left = clamp(spreadBase * 100 + spreadJitter, 1, 99);

    const top = random() * 100;
    const delay = -random() * (type === "stars" ? 4 : 10);

    const duration =
      type === "rain"
        ? 0.9 + random() * 0.9
        : type === "snow"
          ? 7 + random() * 5
          : type === "stars"
            ? 2.2 + random() * 2.2
            : 8 + random() * 5;

    const drift =
      type === "rain"
        ? 8 + random() * 18
        : type === "snow"
          ? -28 + random() * 56
          : -55 + random() * 110;

    const size =
      type === "rain"
        ? 1 + random() * 1.3
        : type === "snow"
          ? 3 + random() * 4.5
          : type === "stars"
            ? 1.5 + random() * 2.6
            : 8 + random() * 9;

    const opacity =
      type === "rain"
        ? 0.26 + random() * 0.34
        : type === "stars"
          ? 0.4 + random() * 0.55
          : 0.56 + random() * 0.3;

    particles.push({
      id: i,
      left,
      top,
      delay,
      duration,
      drift,
      size,
      opacity,
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

function normalizeAmbientScene(doc: AmbientSceneDoc): SceneConfig | null {
  if (!doc?.id || !doc?.name || !doc?.sourceUrl) return null;
  if (doc.isVisible === false) return null;

  const type = doc.type === "video" ? "video" : "static";

  return {
    id: doc.id,
    name: doc.name,
    group: type,
    accent: doc.accent || (type === "video" ? "rgba(140,220,255,0.18)" : "rgba(255,255,255,0.14)"),
    background:
      doc.background ||
      (type === "static"
        ? "linear-gradient(180deg, rgba(10,10,14,0.72) 0%, rgba(6,8,12,0.88) 100%)"
        : "linear-gradient(180deg, rgba(7,12,18,0.94) 0%, rgba(8,13,20,0.98) 100%)"),
    sourceUrl: doc.sourceUrl,
    previewUrl: doc.previewUrl || doc.posterUrl || doc.sourceUrl,
    posterSrc: doc.posterUrl,
  };
}

function ScenePreview({ scene }: { scene: SceneConfig }) {
  const badgeLabel = scene.group === "video" ? "Video" : scene.group === "static" ? "Static" : null;
  const badgeIcon = scene.group === "video" ? <PlaySquare size={12} /> : scene.group === "static" ? <ImageIcon size={12} /> : null;
  const sceneSourceUrl = getSceneSourceUrl(scene);
  const scenePreviewUrl = getScenePreviewUrl(scene);

  return (
    <div
      className="focus-scene-preview"
      style={{
        position: "relative",
        overflow: "hidden",
        background: scene.background,
      }}
    >
      {scene.group === "video" && sceneSourceUrl && (
        <video
          key={scene.id}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={scenePreviewUrl}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.88,
          }}
        >
          <source src={sceneSourceUrl} type="video/mp4" />
        </video>
      )}

      {scene.group === "static" && sceneSourceUrl && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${sceneSourceUrl})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
            opacity: 0.92,
          }}
        />
      )}

      {(scene.group === "video" || scene.group === "static") && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.28) 100%)",
          }}
        />
      )}

      {badgeLabel && badgeIcon && (
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 8px",
            borderRadius: 999,
            background: "rgba(8,8,12,0.65)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.88)",
            fontSize: 11,
            fontWeight: 700,
            zIndex: 2,
          }}
        >
          {badgeIcon}
          {badgeLabel}
        </div>
      )}
    </div>
  );
}

function AmbientStaticLayer({ scene }: { scene: SceneConfig }) {
  const sceneSourceUrl = getSceneSourceUrl(scene);
  if (scene.group !== "static" || !sceneSourceUrl) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${sceneSourceUrl})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(4,7,12,0.28) 0%, rgba(6,10,18,0.46) 100%)",
        }}
      />
    </div>
  );
}

function AmbientVideoLayer({ scene }: { scene: SceneConfig }) {
  const sceneSourceUrl = getSceneSourceUrl(scene);
  const scenePreviewUrl = getScenePreviewUrl(scene);

  if (scene.group !== "video" || !sceneSourceUrl) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
      }}
      aria-hidden="true"
    >
      <video
        key={scene.id}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={scenePreviewUrl}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      >
        <source src={sceneSourceUrl} type="video/mp4" />
      </video>

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(4,7,12,0.28) 0%, rgba(6,10,18,0.40) 100%)",
        }}
      />
    </div>
  );
}

function GallerySectionTabs({
  section,
  onChange,
}: {
  section: SceneGroup;
  onChange: (section: SceneGroup) => void;
}) {
  const tabs: SceneGroup[] = ["static", "gradient", "video"];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: 8,
        marginBottom: 12,
      }}
    >
      {tabs.map((tab) => {
        const active = section === tab;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            style={{
              minHeight: 40,
              borderRadius: 14,
              border: active
                ? "1px solid rgba(255, 179, 0, 0.24)"
                : "1px solid rgba(255,255,255,0.08)",
              background: active ? "rgba(255,179,0,0.14)" : "rgba(255,255,255,0.04)",
              color: active ? "rgba(255,223,160,0.98)" : "rgba(255,255,255,0.78)",
              fontSize: 12,
              fontWeight: 700,
              textTransform: "capitalize",
            }}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}

export default function FocusAmbientShell({
  children,
  onOpenMusic,
}: FocusAmbientShellProps) {
  const isMobile = useIsMobile();
  const [state, setState] = useState<AmbientState>(() => loadAmbientState());
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<PanelTab>("weather");
  const [gallerySection, setGallerySection] = useState<SceneGroup>("video");
  const [customScenes, setCustomScenes] = useState<SceneConfig[]>([]);
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
    const unsub = onSnapshot(collection(db, "ambientScenes"), (snap) => {
      const next = snap.docs
        .map((item) => normalizeAmbientScene({ id: item.id, ...(item.data() as Omit<AmbientSceneDoc, "id">) }))
        .filter((item): item is SceneConfig => Boolean(item));

      next.sort((a, b) => a.name.localeCompare(b.name));
      setCustomScenes(next);
    });

    return () => unsub();
  }, []);

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

  const allScenes = useMemo(() => [...BUILT_IN_SCENES, ...customScenes], [customScenes]);

  const scene = useMemo(() => {
    return allScenes.find((item) => item.id === state.scene) ?? BUILT_IN_SCENES[0];
  }, [allScenes, state.scene]);

  useEffect(() => {
    const exists = allScenes.some((item) => item.id === state.scene);
    if (!exists) {
      setState((prev) => ({ ...prev, scene: DEFAULT_STATE.scene }));
    }
  }, [allScenes, state.scene]);

  const galleryScenes = useMemo(() => {
    return allScenes.filter((item) => item.group === gallerySection);
  }, [allScenes, gallerySection]);

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

  function setScene(sceneId: string) {
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

      <AmbientStaticLayer scene={scene} />
      <AmbientVideoLayer scene={scene} />

      <div
        className="focus-ambient-vignette"
        style={{
          background: `radial-gradient(circle at 50% 20%, transparent 0%, rgba(0,0,0,0.04) 35%, rgba(0,0,0,0.36) 100%), radial-gradient(circle at 50% 0%, ${scene.accent}, transparent 42%)`,
        }}
      />

      <WeatherLayer type={state.weather} particles={particles} />

      <div className="focus-ambient-content">{children}</div>

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
                <div>
                  <GallerySectionTabs section={gallerySection} onChange={setGallerySection} />

                  {galleryScenes.length === 0 ? (
                    <div
                      style={{
                        borderRadius: 18,
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.035)",
                        padding: "1rem",
                        color: "rgba(255,255,255,0.72)",
                        fontSize: 14,
                      }}
                    >
                      No {gallerySection} backgrounds yet. Add some from the admin ambient scene manager.
                    </div>
                  ) : (
                    <div className="focus-scene-list">
                      {galleryScenes.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setScene(item.id)}
                          className={`focus-scene-card ${state.scene === item.id ? "is-active" : ""}`}
                        >
                          <ScenePreview scene={item} />
                          <div className="focus-scene-meta">
                            <span>{item.name}</span>
                            {state.scene === item.id && <span className="focus-scene-live">Live</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
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
                  width: `${particle.size}px`,
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
