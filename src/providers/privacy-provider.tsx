import { createContext, use, useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";

const STORAGE_KEY = "margin:privacy";

interface PrivacyContextValue {
    hidden: boolean;
    toggle: () => void;
    /** Replaces a figure with stars of the same length, so nothing reflows. */
    mask: (text: string) => string;
}

const PrivacyContext = createContext<PrivacyContextValue | null>(null);

export const PrivacyProvider = ({ children }: { children: ReactNode }) => {
    const [hidden, setHidden] = useState(() => {
        try {
            return localStorage.getItem(STORAGE_KEY) === "1";
        } catch {
            return false;
        }
    });

    const toggle = useCallback(() => {
        setHidden((previous) => {
            const next = !previous;
            try {
                localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
            } catch {
                /* blocked storage — the choice just won't persist */
            }
            return next;
        });
    }, []);

    const value = useMemo<PrivacyContextValue>(
        () => ({
            hidden,
            toggle,
            mask: (text: string) => (hidden ? "*".repeat(Math.min(text.length, 12)) : text),
        }),
        [hidden, toggle],
    );

    return <PrivacyContext value={value}>{children}</PrivacyContext>;
};

export const usePrivacy = () => {
    const ctx = use(PrivacyContext);
    if (!ctx) throw new Error("usePrivacy must be used inside <PrivacyProvider>");
    return ctx;
};
