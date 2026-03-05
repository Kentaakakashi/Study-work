export type ThemeId =
  | "zen-dark"
  | "blueprint"
  | "reading-room"
  | "neon-focus"
  | "minimal-mono";

export type Density = "comfortable" | "compact" | "airy";
export type MotionPreset = "smooth" | "snappy" | "floaty";

export type ThemeConfig = {
  id: ThemeId;
  name: string;
  description: string;
  density: Density;
  motionPreset: MotionPreset;
  motionSpeed: number; // 0.7..1.4 (multiplier)

  // Design tokens
  radius: {
    base: string; // feeds --radius used by shadcn
    card: string;
    button: string;
  };

  font: {
    sans: string; // CSS font-family value
    mono: string;
  };

  icons: {
    strokeWidth: number;
    opacity: number;
  };

  background: {
    gradient: string; // CSS gradient
    patternUrl: string; // /themes/.../pattern.svg
    noiseUrl?: string; // /themes/_shared/noise.svg
    patternOpacity: number; // 0..1
    noiseOpacity: number; // 0..1
    vignetteOpacity: number; // 0..1
  };
};

export const THEMES: ThemeConfig[] = [
  {
    id: "zen-dark",
    name: "Zen Dark",
    description: "Calm, glassy, and distraction-free.",
    density: "comfortable",
    motionPreset: "smooth",
    motionSpeed: 1.0,
    radius: { base: "0.9rem", card: "1.25rem", button: "0.9rem" },
    font: {
      sans: "'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
    },
    icons: { strokeWidth: 2, opacity: 0.95 },
    background: {
      gradient:
        "radial-gradient(1200px circle at 20% 10%, rgba(0, 255, 204, 0.10), transparent 55%), radial-gradient(900px circle at 80% 30%, rgba(178, 82, 255, 0.08), transparent 60%), linear-gradient(180deg, rgba(10, 12, 18, 1), rgba(6, 7, 11, 1))",
      patternUrl: "/themes/zen-dark/pattern.svg",
      noiseUrl: "/themes/_shared/noise.svg",
      patternOpacity: 0.25,
      noiseOpacity: 0.06,
      vignetteOpacity: 0.22,
    },
  },
  {
    id: "blueprint",
    name: "Blueprint",
    description: "Sharp, technical, and grid-based focus.",
    density: "compact",
    motionPreset: "snappy",
    motionSpeed: 1.2,
    radius: { base: "0.55rem", card: "0.85rem", button: "0.6rem" },
    font: {
      sans: "'Space Grotesk', system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
    },
    icons: { strokeWidth: 1.75, opacity: 0.92 },
    background: {
      gradient:
        "radial-gradient(1100px circle at 30% 15%, rgba(56, 189, 248, 0.10), transparent 55%), radial-gradient(900px circle at 80% 40%, rgba(99, 102, 241, 0.08), transparent 60%), linear-gradient(180deg, rgba(7, 11, 20, 1), rgba(5, 8, 15, 1))",
      patternUrl: "/themes/blueprint/pattern.svg",
      noiseUrl: "/themes/_shared/noise.svg",
      patternOpacity: 0.35,
      noiseOpacity: 0.05,
      vignetteOpacity: 0.24,
    },
  },
  {
    id: "reading-room",
    name: "Reading Room",
    description: "Warm, soft, and perfect for long sessions.",
    density: "airy",
    motionPreset: "smooth",
    motionSpeed: 0.85,
    radius: { base: "1.05rem", card: "1.5rem", button: "1.05rem" },
    font: {
      sans: "'Plus Jakarta Sans', system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
    },
    icons: { strokeWidth: 2.1, opacity: 0.9 },
    background: {
      gradient:
        "radial-gradient(1200px circle at 15% 15%, rgba(234, 179, 8, 0.09), transparent 55%), radial-gradient(1000px circle at 85% 30%, rgba(244, 114, 182, 0.07), transparent 60%), linear-gradient(180deg, rgba(12, 10, 8, 1), rgba(8, 7, 6, 1))",
      patternUrl: "/themes/reading-room/pattern.svg",
      noiseUrl: "/themes/_shared/noise.svg",
      patternOpacity: 0.22,
      noiseOpacity: 0.07,
      vignetteOpacity: 0.28,
    },
  },
  {
    id: "neon-focus",
    name: "Neon Focus",
    description: "Glowy, premium, and high-energy study mode.",
    density: "comfortable",
    motionPreset: "floaty",
    motionSpeed: 1.05,
    radius: { base: "0.95rem", card: "1.35rem", button: "0.95rem" },
    font: {
      sans: "'Outfit', system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
    },
    icons: { strokeWidth: 2, opacity: 1 },
    background: {
      gradient:
        "radial-gradient(1200px circle at 18% 14%, rgba(0, 255, 204, 0.14), transparent 55%), radial-gradient(1000px circle at 78% 28%, rgba(178, 82, 255, 0.12), transparent 62%), linear-gradient(180deg, rgba(8, 8, 12, 1), rgba(5, 5, 8, 1))",
      patternUrl: "/themes/neon-focus/pattern.svg",
      noiseUrl: "/themes/_shared/noise.svg",
      patternOpacity: 0.28,
      noiseOpacity: 0.05,
      vignetteOpacity: 0.2,
    },
  },
  {
    id: "minimal-mono",
    name: "Minimal Mono",
    description: "Ultra-clean, fast, and brutally focused.",
    density: "compact",
    motionPreset: "snappy",
    motionSpeed: 1.35,
    radius: { base: "0.4rem", card: "0.6rem", button: "0.45rem" },
    font: {
      sans: "'IBM Plex Sans', system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
    },
    icons: { strokeWidth: 1.6, opacity: 0.85 },
    background: {
      gradient:
        "radial-gradient(1000px circle at 20% 15%, rgba(255, 255, 255, 0.05), transparent 60%), linear-gradient(180deg, rgba(8, 8, 9, 1), rgba(4, 4, 5, 1))",
      patternUrl: "/themes/minimal-mono/pattern.svg",
      noiseUrl: "/themes/_shared/noise.svg",
      patternOpacity: 0.18,
      noiseOpacity: 0.03,
      vignetteOpacity: 0.18,
    },
  },
];

export const DEFAULT_THEME_ID: ThemeId = "zen-dark";

// Back-compat for your old theme keys.
export function normalizeThemeId(id: string | null | undefined): ThemeId {
  if (!id) return DEFAULT_THEME_ID;

  const raw = String(id);
  if (THEMES.some((t) => t.id === raw)) return raw as ThemeId;

  // old keys
  if (raw === "neon") return "neon-focus";
  if (raw === "lofi") return "reading-room";
  if (raw === "sakura") return "zen-dark";

  return DEFAULT_THEME_ID;
}

export function getThemeById(id: string | null | undefined): ThemeConfig {
  const normalized = normalizeThemeId(id);
  return THEMES.find((t) => t.id === normalized)!;
  }
