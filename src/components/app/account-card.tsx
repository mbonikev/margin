import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Amount } from "@/components/ui/amount";
import { useCurrency } from "@/providers/currency-provider";
import { Logo } from "@/components/ui/logo";
import { cx } from "@/utils/cx";

export type CardTheme = "blue" | "indigo" | "violet" | "plum" | "rose" | "crimson" | "amber" | "emerald" | "teal" | "slate" | "graphite";

/** Flat, saturated card stock. Fixed art — people learn an account by its colour,
 *  so this deliberately ignores the selected accent. */
const themes: Record<CardTheme, string> = {
    blue: "bg-[#2c5fe0]",
    indigo: "bg-[#3b3a9e]",
    violet: "bg-[#5b3a9e]",
    plum: "bg-[#7a3f70]",
    rose: "bg-[#a13058]",
    crimson: "bg-[#a8322f]",
    amber: "bg-[#9a6016]",
    emerald: "bg-[#13795a]",
    teal: "bg-[#0f6670]",
    slate: "bg-[#3f4a57]",
    graphite: "bg-[#22262a]",
};

/** Ordered for the picker — the swatch row reads as a spectrum. */
export const cardThemes = Object.keys(themes) as CardTheme[];

export const cardThemeClass = (theme: CardTheme) => themes[theme];

export interface Account {
    id: string;
    name: string;
    kind: string;
    /** Margin's own reference for the account. Generated from the id if absent. */
    ref?: string;
    /** Balance in the base currency. */
    balance: number;
    updated: string;
    theme: CardTheme;
}

/**
 * A reference Margin issues itself — not a card or wallet number. It needs no
 * input from the user, carries nothing sensitive, and so needs no masking.
 */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford-style: no I, L, O or U to misread

export const accountRef = (id: string) => {
    // FNV-1a, then a linear congruential step per character — padding a single
    // hash instead gives short ids a run of leading zeros.
    let hash = 2166136261;
    for (let index = 0; index < id.length; index++) {
        hash ^= id.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }

    // xorshift32, reading the TOP 5 bits. A linear congruential generator's low
    // bits depend only on the previous low bits, so `state % 32` collides for any
    // two ids whose hash shares its last 5 bits.
    let state = hash >>> 0 || 1;
    let code = "";
    for (let index = 0; index < 8; index++) {
        state ^= state << 13;
        state >>>= 0;
        state ^= state >>> 17;
        state ^= state << 5;
        state >>>= 0;
        code += ALPHABET[state >>> 27];
    }

    return `MGN ${code.slice(0, 4)} ${code.slice(4)}`;
};

const Chip = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 34 26" fill="none" className={className} aria-hidden="true">
        <rect width="34" height="26" rx="5" fill="currentColor" opacity="0.9" />
        <path d="M12 0v26M23 0v26M0 9h34M0 17h34" stroke="#000" strokeOpacity="0.18" strokeWidth="1.5" />
    </svg>
);

const Contactless = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className={className} aria-hidden="true">
        <path d="M6 8.5a6 6 0 0 1 0 7M10 6a10 10 0 0 1 0 12M14 3.5a14 14 0 0 1 0 17" />
    </svg>
);

/**
 * A specular sweep that runs once when the card mounts — which, because the hero
 * keys the card on the account id, means once per swap. Two stops rather than
 * one: a wide soft wash for the body of the highlight and a narrow bright core,
 * which is what separates "metal catching light" from "a white bar sliding past".
 */
const Sheen = () => {
    const reduceMotion = useReducedMotion();
    if (reduceMotion) return null;

    return (
        <motion.span
            aria-hidden="true"
            initial={{ x: "-55%" }}
            animate={{ x: "190%" }}
            transition={{ duration: 1.3, ease: [0.4, 0, 0.3, 1], delay: 0.05 }}
            className="pointer-events-none absolute inset-y-0 left-0 w-1/2 -skew-x-12 bg-[linear-gradient(100deg,transparent_0%,rgba(255,255,255,0.06)_30%,rgba(255,255,255,0.32)_50%,rgba(255,255,255,0.06)_70%,transparent_100%)] mix-blend-overlay"
        />
    );
};

/** The soft tonal shapes that keep the card from reading as a flat rectangle. */
const Blobs = () => (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute -top-12 -right-10 size-56 rounded-full bg-white/8" />
        <span className="absolute -right-20 -bottom-24 size-64 rounded-full bg-white/6" />
        <span className="absolute top-1/3 -right-4 size-24 rounded-full bg-white/5" />
    </span>
);

export const AccountCard = ({ account, className }: { account: Account; className?: string }) => {
    const reference = account.ref ?? accountRef(account.id);
    const { formatExact } = useCurrency();
    const [copied, setCopied] = useState<string | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const copy = useCallback(async (label: string, value: string) => {
        try {
            await navigator.clipboard.writeText(value);
        } catch {
            return; // denied or insecure context — say nothing rather than lie
        }

        setCopied(label);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(null), 1600);
    }, []);

    return (
    <div className={cx([
                "relative flex size-full flex-col justify-between overflow-hidden rounded-[1.35rem] p-[1.125rem] text-white",
                // Depth, in three parts: a tight contact shadow, two wide soft ones
                // for the cast, and inset edges so the top catches light and the
                // bottom falls into shadow — what makes it read as a solid object.
                "shadow-[0_1px_2px_rgba(0,0,0,0.10),0_8px_16px_-8px_rgba(0,0,0,0.24),0_18px_36px_-20px_rgba(0,0,0,0.18)]",
                "inset-shadow-[0_1px_0_rgba(255,255,255,0.22),0_-1px_0_rgba(0,0,0,0.28)]",
            ], themes[account.theme], className)}>
        <Blobs />
        <Sheen />

        {/* Light falling from above, so the surface isn't uniformly flat. */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/14 via-transparent to-black/18" />

        <div className="relative flex items-center gap-2">
            <Logo variant="mark" className="h-[1.35rem] bg-white" />
            <span className="text-white/40">/</span>
            <button
                type="button"
                onClick={() => copy("Card type", account.kind)}
                title="Copy card type"
                className="no-press -mx-1.5 rounded-lg px-1.5 py-0.5 text-[0.7875rem] font-medium transition duration-100 ease-linear hover:bg-white/12"
            >
                {account.kind}
            </button>
        </div>

        <div className="relative mt-4 flex items-center gap-3">
            <Contactless className="size-[1.625rem] text-white/80" />
            <Chip className="h-[1.625rem] w-[2.17rem] text-white/85" />
        </div>

        {/* Not font-mono: the generic monospace fallback reads thin and dead.
            The display face with tabular figures gives the chunky card look. */}
        <button
            type="button"
            onClick={() => copy("Account name", account.name)}
            title="Copy account name"
            className="no-press relative -mx-2 mb-[0.45rem] w-fit max-w-full truncate rounded-xl px-2 py-1 text-left text-[1.125rem] font-semibold tracking-tight text-white transition duration-100 ease-linear hover:bg-white/12 md:mb-[0.675rem] md:text-[1.35rem]"
        >
            {account.name}
        </button>

        <AnimatePresence>
            {copied && (
                <motion.span
                    key={copied}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="pointer-events-none absolute inset-x-0 bottom-3 z-10 mx-auto w-fit rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm"
                >
                    {copied} copied
                </motion.span>
            )}
        </AnimatePresence>

        <div className="relative flex items-end justify-between gap-3">
            {/* flex-1, not just min-w-0: without it this block shrinks below its
                content to make room for the date, and the balance truncates. */}
            <div className="min-w-0 flex-1">
                <button
                    type="button"
                    onClick={() => copy("Card ID", reference)}
                    title="Copy card ID"
                    className="no-press -mx-1.5 block max-w-full truncate rounded-lg px-1.5 py-0.5 text-left text-[0.7875rem] font-medium tracking-[0.08em] tabular-nums text-white/75 transition duration-100 ease-linear hover:bg-white/12 hover:text-white"
                >
                    {reference}
                </button>
                <button
                    type="button"
                    onClick={() => copy("Balance", formatExact(account.balance))}
                    title="Copy balance"
                    className="no-press -mx-1.5 block max-w-full rounded-lg px-1.5 py-0.5 text-left transition duration-100 ease-linear hover:bg-white/12"
                >
                    <Amount value={account.balance} compactSymbol className="mt-0.5 block truncate text-[1.6rem] font-semibold tracking-tight" />
                </button>
            </div>
            <p className="shrink-0 text-[0.7875rem] font-medium text-white/70">{account.updated}</p>
        </div>
    </div>
    );
};

/** The small switchable version shown beside the hero. */
export const AccountThumb = ({ account, isActive, onSelect }: { account: Account; isActive: boolean; onSelect: () => void }) => (
    <button
        type="button"
        onClick={onSelect}
        aria-label={account.name}
        aria-pressed={isActive}
        className={cx(
            "relative aspect-[1.586/1] w-16 shrink-0 overflow-hidden rounded-xl shadow-xs transition duration-100 ease-linear md:w-20",
            themes[account.theme],
            isActive ? "opacity-100" : "opacity-50 hover:opacity-80",
        )}
    >
        <span className="absolute -top-4 -right-3 size-16 rounded-full bg-white/8" />
        <span className="absolute bottom-1.5 left-2 text-[10px] font-semibold tabular-nums text-white/85">{(account.ref ?? accountRef(account.id)).slice(-4)}</span>
    </button>
);
