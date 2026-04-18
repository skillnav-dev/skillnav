"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

type V2Theme = "light" | "fresh" | "dark";
const CYCLE: V2Theme[] = ["light", "fresh", "dark"];
const STORAGE_KEY = "skillnav:v2-theme";
const LABELS: Record<V2Theme, string> = {
  light: "暖",
  fresh: "清爽",
  dark: "深",
};

// External store wrapping localStorage + a per-tab in-memory fallback. Broadcasts
// across same-tab calls via a tiny event bus so other components re-render.
const listeners = new Set<() => void>();
let cached: V2Theme | null = null;

function readTheme(): V2Theme {
  if (cached) return cached;
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY) as V2Theme | null;
  cached = stored && CYCLE.includes(stored) ? stored : "light";
  return cached;
}

function setTheme(next: V2Theme) {
  cached = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, next);
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function cycleTheme() {
  const cur = readTheme();
  setTheme(CYCLE[(CYCLE.indexOf(cur) + 1) % CYCLE.length]);
}

const ThemeCtx = createContext<{ theme: V2Theme; cycle: () => void } | null>(
  null,
);

export function ThemeShell({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    subscribe,
    readTheme,
    () => "light" as const,
  );

  return (
    <ThemeCtx.Provider value={{ theme, cycle: cycleTheme }}>
      <div className="trending-v2" data-theme={theme}>
        {children}
      </div>
    </ThemeCtx.Provider>
  );
}

export function ThemeToggleButton() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) return null;
  return (
    <button
      className="v-theme-toggle"
      onClick={ctx.cycle}
      title={`当前：${LABELS[ctx.theme]}，点击切换`}
      aria-label={`切换主题，当前 ${LABELS[ctx.theme]}`}
    >
      {ctx.theme === "dark" ? "◐" : ctx.theme === "fresh" ? "◯" : "●"}
    </button>
  );
}
