import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_THEME_ID, getThemeById, normalizeThemeId, type ThemeConfig, type ThemeId } from "./themes";

type ThemeContextValue = {
  theme: ThemeConfig;
  setThemeId: (id: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const LS_KEY = "studyzen:theme";

function applyThemeToDom(theme: ThemeConfig) {
  const root = document.documentElement;

  root.setAttribute("data-theme", theme.id);
  root.setAttribute("data-density", theme.density);
  root.setAttribute("data-motion", theme.motionPreset);

  // shadcn radius
  root.style.setProperty("--radius", theme.radius.base);
  // app-specific radius
  root.style.setProperty("--radius-card", theme.radius.card);
  root.style.setProperty("--radius-button", theme.radius.button);

  // fonts
  root.style.setProperty("--font-sans", theme.font.sans);
  root.style.setProperty("--font-mono", theme.font.mono);

  // motion + icon styling
  root.style.setProperty("--motion-speed", String(theme.motionSpeed));
  root.style.setProperty("--icon-stroke", String(theme.icons.strokeWidth));
  root.style.setProperty("--icon-opacity", String(theme.icons.opacity));

  // layout density paddings
  const density = theme.density;
  const padMobile = density === "compact" ? "0.75rem" : density === "airy" ? "1.25rem" : "1rem";
  const padDesktop = density === "compact" ? "1.25rem" : density === "airy" ? "2rem" : "1.5rem";
  root.style.setProperty("--layout-pad-mobile", padMobile);
  root.style.setProperty("--layout-pad-desktop", padDesktop);

  // background layers
  root.style.setProperty("--bg-gradient", theme.background.gradient);
  root.style.setProperty("--bg-pattern-url", `url('${theme.background.patternUrl}')`);
  root.style.setProperty("--bg-noise-url", theme.background.noiseUrl ? `url('${theme.background.noiseUrl}')` : "none");
  root.style.setProperty("--bg-pattern-opacity", String(theme.background.patternOpacity));
  root.style.setProperty("--bg-noise-opacity", String(theme.background.noiseOpacity));
  root.style.setProperty("--bg-vignette-opacity", String(theme.background.vignetteOpacity));
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>(() => {
    const stored = localStorage.getItem(LS_KEY);
    return (normalizeThemeId(stored) as ThemeId) || DEFAULT_THEME_ID;
  });

  const theme = useMemo(() => getThemeById(themeId), [themeId]);

  useEffect(() => {
    applyThemeToDom(theme);
    localStorage.setItem(LS_KEY, theme.id);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setThemeId: (id: ThemeId) => setThemeIdState(id),
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
