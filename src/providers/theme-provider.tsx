import { createContext, use, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type ThemeMode = "light" | "dark" | "system";

export interface AccentColor {
    id: string;
    label: string;
    hex: string;
}

/** Accent options. Each one re-derives the whole brand ramp via color-mix. */
export const accentColors: AccentColor[] = [
    { id: "green", label: "Green", hex: "#449c63" },
    { id: "teal", label: "Teal", hex: "#0f9b8e" },
    { id: "sky", label: "Sky", hex: "#2f8fd6" },
    { id: "indigo", label: "Indigo", hex: "#5a6ee0" },
    { id: "violet", label: "Violet", hex: "#8158d6" },
    { id: "plum", label: "Plum", hex: "#a84fc4" },
    { id: "rose", label: "Rose", hex: "#d6457e" },
    { id: "coral", label: "Coral", hex: "#e0613f" },
    { id: "amber", label: "Amber", hex: "#d49420" },
    { id: "slate", label: "Slate", hex: "#5b6670" },
];

const MODE_KEY = "margin:theme-mode";
const ACCENT_KEY = "margin:accent";

interface ThemeContextValue {
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
    accent: AccentColor;
    setAccent: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const read = (key: string, fallback: string) => {
    try {
        return localStorage.getItem(key) ?? fallback;
    } catch {
        return fallback;
    }
};

const write = (key: string, value: string) => {
    try {
        localStorage.setItem(key, value);
    } catch {
        /* private mode, blocked storage — ignore */
    }
};

/**
 * Flipping the theme repaints hundreds of colours at once. Anything carrying a
 * CSS transition would animate that repaint and visibly lag behind the rest of
 * the page, so transitions are suppressed for one frame while it happens.
 */
const withoutTransitions = (mutate: () => void) => {
    const root = document.documentElement;
    root.classList.add("theme-switching");
    mutate();
    // Two frames: one to flush the style change, one to let it paint.
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("theme-switching")));
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [mode, setModeState] = useState<ThemeMode>(() => read(MODE_KEY, "system") as ThemeMode);
    const [accentId, setAccentId] = useState<string>(() => read(ACCENT_KEY, "green"));

    const accent = useMemo(() => accentColors.find((c) => c.id === accentId) ?? accentColors[0], [accentId]);

    // Apply light/dark, following the OS when mode is "system".
    useEffect(() => {
        const query = window.matchMedia("(prefers-color-scheme: dark)");

        const apply = () => {
            const isDark = mode === "dark" || (mode === "system" && query.matches);
            // `color-scheme` rides on the class via CSS — see globals.css.
            withoutTransitions(() => document.documentElement.classList.toggle("dark-mode", isDark));
        };

        apply();
        query.addEventListener("change", apply);
        return () => query.removeEventListener("change", apply);
    }, [mode]);

    // One variable drives every brand tint, hover and border in the app.
    useEffect(() => {
        withoutTransitions(() => {
            document.documentElement.style.setProperty("--color-brand", accent.hex);
            document.documentElement.style.setProperty("--color-focus", accent.hex);
        });
    }, [accent]);

    const setMode = useCallback((next: ThemeMode) => {
        setModeState(next);
        write(MODE_KEY, next);
    }, []);

    const setAccent = useCallback((id: string) => {
        setAccentId(id);
        write(ACCENT_KEY, id);
    }, []);

    const value = useMemo(() => ({ mode, setMode, accent, setAccent }), [mode, setMode, accent, setAccent]);

    return <ThemeContext value={value}>{children}</ThemeContext>;
};

export const useTheme = () => {
    const ctx = use(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
    return ctx;
};
