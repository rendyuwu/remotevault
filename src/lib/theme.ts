export type ThemeMode = "system" | "light" | "dark";

const STORAGE_KEY = "rv:theme";
const QUERY = "(prefers-color-scheme: dark)";
const MODES: ThemeMode[] = ["system", "light", "dark"];

function mediaQuery() {
  return window.matchMedia(QUERY);
}

function isThemeMode(value: string | null): value is ThemeMode {
  return !!value && MODES.includes(value as ThemeMode);
}

export function getThemeMode(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  return isThemeMode(stored) ? stored : "system";
}

export function resolvedTheme(mode = getThemeMode()): "light" | "dark" {
  return mode === "system" ? (mediaQuery().matches ? "dark" : "light") : mode;
}

export function applyTheme(mode = getThemeMode()) {
  document.documentElement.dataset.themeMode = mode;
  document.documentElement.dataset.theme = resolvedTheme(mode);
}

export function setThemeMode(mode: ThemeMode) {
  localStorage.setItem(STORAGE_KEY, mode);
  applyTheme(mode);
}

export function initTheme() {
  applyTheme();
  const query = mediaQuery();
  const syncSystem = () => {
    if (getThemeMode() === "system") applyTheme("system");
  };
  query.addEventListener("change", syncSystem);
  return () => query.removeEventListener("change", syncSystem);
}
