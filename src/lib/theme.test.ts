import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applyTheme, getThemeMode, initTheme, resolvedTheme, setThemeMode } from "./theme";

function mockMatchMedia(matches: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(() => ({
      matches,
      media: "(prefers-color-scheme: dark)",
      addEventListener: (_event: string, cb: (event: MediaQueryListEvent) => void) => listeners.add(cb),
      removeEventListener: (_event: string, cb: (event: MediaQueryListEvent) => void) => listeners.delete(cb),
      dispatchEvent: () => true,
    })),
  });
  return (nextMatches: boolean) => {
    matches = nextMatches;
    listeners.forEach((listener) => listener({ matches: nextMatches } as MediaQueryListEvent));
  };
}

describe("theme", () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
    delete document.documentElement.dataset.themeMode;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("defaults to system and resolves from OS preference", () => {
    mockMatchMedia(true);

    expect(getThemeMode()).toBe("system");
    expect(resolvedTheme()).toBe("dark");
    applyTheme();
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(document.documentElement).toHaveAttribute("data-theme-mode", "system");
  });

  it("persists explicit light and dark modes", () => {
    mockMatchMedia(true);

    setThemeMode("light");
    expect(localStorage.getItem("rv:theme")).toBe("light");
    expect(document.documentElement).toHaveAttribute("data-theme", "light");

    setThemeMode("dark");
    expect(localStorage.getItem("rv:theme")).toBe("dark");
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });

  it("updates live while system mode tracks OS changes", () => {
    const dispatch = mockMatchMedia(false);
    const cleanup = initTheme();

    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    dispatch(true);
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");

    setThemeMode("light");
    dispatch(false);
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    cleanup();
  });
});
