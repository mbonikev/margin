/** The small shared primitives every screen is built from. */

import { AU, CA, EU, GB, GH, IN, JP, KE, NG, RW, SN, TZ, UG, US, ZA } from "country-flag-icons/react/1x1";
import { useMemo, useState } from "react";
import type { ButtonHTMLAttributes, FC, HTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { HiOutlineEye, HiOutlineEyeSlash } from "react-icons/hi2";
import { Dialog, Modal as RacModal, ModalOverlay } from "react-aria-components";
import { useCurrency, usePreferences, usePrivacy } from "@/providers";
import { cx } from "@/utils";

/* ── logo.tsx ── */

type LogoVariant = "wordmark" | "mark";

interface LogoProps extends HTMLAttributes<HTMLSpanElement> {
    /** `wordmark` is the full "margin" lockup, `mark` is the circular icon only. */
    variant?: LogoVariant;
}

/**
 * The PNGs are used as alpha masks, not images, so the logo paints in whatever
 * the current accent colour is. The counter inside the "m" is transparent in the
 * source art, so it knocks through to the page behind it in both themes.
 */
const sources: Record<LogoVariant, { src: string; ratio: number }> = {
    // The full-resolution art, not the 96px favicon-sized exports — the mask is
    // scaled up as far as the sign-in backdrop, where 96px turns to mush.
    wordmark: { src: "/logos/logo-green-transparent.png", ratio: 1908 / 611 },
    mark: { src: "/logos/logo-green-2-transparent.png", ratio: 1550 / 1600 },
};

export const Logo = ({ variant = "wordmark", className, ...props }: LogoProps) => {
    const { src, ratio } = sources[variant];
    const mask = {
        maskImage: `url(${src})`,
        WebkitMaskImage: `url(${src})`,
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskPosition: "center",
        WebkitMaskPosition: "center",
    } as const;

    return <span {...props} role="img" aria-label="Margin" className={cx("inline-block shrink-0 bg-brand-solid", className)} style={{ aspectRatio: String(ratio), ...mask }} />;
};

/* ── coffee-icon.tsx ── */

/** Coffee cup, drawn to match the Heroicons v2 outline style (24px, 1.5px, round caps). */
export const Coffee = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9h13v5.5a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V9Z" />
        <path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16" />
        <path d="M7 2.5v3M11 2.5v3M15 2.5v3" />
    </svg>
);

/* ── separator.tsx ── */

interface SeparatorProps {
    orientation?: "vertical" | "horizontal";
    className?: string;
}

export const Separator = ({ orientation = "vertical", className }: SeparatorProps) => (
    <span
        role="separator"
        aria-orientation={orientation}
        className={cx("shrink-0 bg-border-secondary", orientation === "vertical" ? "h-5 w-px" : "h-px w-full", className)}
    />
);

/* ── flag.tsx ── */

/** Named imports only — `import * as flags` pulls in all ~250 countries. */
const flags: Record<string, FC<{ className?: string }>> = { AU, CA, EU, GB, GH, IN, JP, KE, NG, RW, SN, TZ, UG, US, ZA };

/**
 * The 1x1 set is used rather than 3x2: square source art fills a circular
 * container edge to edge with no cropping and no aspect-ratio fighting.
 */
export const Flag = ({ country, className }: { country: string; className?: string }) => {
    const Svg = flags[country];
    if (!Svg) return null;

    return (
        <span className={cx("relative inline-block shrink-0 overflow-hidden rounded-full", className)}>
            <Svg className="absolute inset-0 size-full" />
        </span>
    );
};

/**
 * Dropdown.Item wants a component, not an element. These are cached because a
 * component created during render is a new type every pass, which makes React
 * unmount and remount the flag — visible as a flicker each time the menu opens.
 */
const iconCache = new Map<string, FC<{ className?: string }>>();

export const flagIcon = (country: string) => {
    const cached = iconCache.get(country);
    if (cached) return cached;

    const Bound = ({ className }: { className?: string }) => <Flag country={country} className={className} />;
    Bound.displayName = `Flag(${country})`;
    iconCache.set(country, Bound);
    return Bound;
};

/* ── card.tsx ── */

/** Padding per density setting — the one place the choice has to bite. */
const padding = {
    compact: "p-3 md:p-3.5",
    comfortable: "p-4 md:p-5",
    roomy: "p-6 md:p-7",
};

/** The surface everything on the dashboard sits on: white, chubby, no border. */
export const Card = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => {
    const { preferences } = usePreferences();

    return (
        <div {...props} className={cx("rounded-3xl bg-primary shadow-xs", padding[preferences.density], className)}>
            {children}
        </div>
    );
};

/* ── action-button.tsx ── */

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    icon?: FC<{ className?: string }>;
}

/**
 * The quiet secondary action used across cards — a soft pill that picks up the
 * brand tint on hover. One component so every card wears the same face.
 */
export const ActionButton = ({ icon: Icon, children, className, ...props }: ActionButtonProps) => (
    <button
        type="button"
        {...props}
        className={cx(
            "flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-secondary px-3.5 text-sm font-medium text-tertiary",
            "transition duration-100 ease-linear hover:bg-brand-primary hover:text-brand-secondary",
            className,
        )}
    >
        {Icon && <Icon className="size-4.5 shrink-0" />}
        {children}
    </button>
);

/* ── amount.tsx ── */

interface AmountProps {
    /** Amount in the base currency. Converted to the display currency here. */
    value: number;
    /** Append the currency code after the number. Defaults to the user's setting. */
    withCode?: boolean;
    /** Hide the leading symbol — for lists where the currency is already stated. */
    hideSymbol?: boolean;
    /** Shrink the symbol relative to the figure. Only worth it on display sizes —
     *  at body size a 0.8em symbol is just small and hard to read. */
    compactSymbol?: boolean;
    /** Abbreviate to 1.5M / 684K from six figures up, for narrow spots like the
     *  stat tiles where a grouped figure would truncate mid-number. */
    compact?: boolean;
    className?: string;
}

/**
 * Every money figure in the app goes through this, so a rate fetch shows a
 * skeleton rather than a wrong number that silently corrects itself.
 */
export const Amount = ({ value, withCode, hideSymbol, compactSymbol, compact, className }: AmountProps) => {
    const { currency, formatAmount, formatWithCode, formatExact, isLoading } = useCurrency();
    const { hidden, mask } = usePrivacy();
    const { preferences } = usePreferences();

    // Rounding is applied to the base figure, before conversion — rounding the
    // converted number would give a tidy result in one currency and a ragged
    // one in every other.
    const step = preferences.rounding === "thousand" ? 1000 : preferences.rounding === "hundred" ? 100 : 1;
    const rounded = step === 1 ? value : Math.round(value / step) * step;
    const showCode = withCode ?? preferences.showCurrencyCode;

    if (isLoading) {
        // Roughly as wide as the figure will be, so the layout doesn't jump.
        const characters = Math.max(4, String(Math.round(value)).length + (showCode ? 4 : 0));

        return (
            <span
                role="status"
                aria-label="Converting"
                style={{ width: `${characters}ch` }}
                className={cx("inline-block h-[0.8em] animate-pulse rounded-full bg-tertiary align-middle", className)}
            />
        );
    }

    // The code costs four more characters, so a tight spot abbreviates sooner
    // when it is shown than when it isn't.
    const compactFrom = compact ? (showCode ? 10_000 : 100_000) : undefined;
    const text = showCode ? formatWithCode(rounded, compactFrom) : formatAmount(rounded, compactFrom);

    // Abbreviated figures keep the exact value one hover away — unless hidden.
    return (
        <span title={hidden ? undefined : formatExact(value)} className={cx("tabular-nums", className)}>
            {/* `em` so the symbol scales with whatever size the figure is set at. */}
            {!showCode && !hideSymbol && <span className={cx("mr-[0.22em] align-baseline font-medium opacity-70", compactSymbol && "text-[0.8em]")}>{currency.symbol}</span>}
            {mask(text)}
        </span>
    );
};

/* ── progress.tsx ── */

interface ProgressProps {
    /** 0–100. */
    value: number;
    label?: string;
    className?: string;
}

/** Seeded rather than raw Math.random per bubble, so a re-render never
    reshuffles them — only a fresh mount picks a new seed. */
const buildBubbles = (seed: number) =>
    Array.from({ length: 9 }, (_, index) => {
        const noise = Math.sin(seed * 12.9898 + index * 78.233) * 43758.5453;
        const random = noise - Math.floor(noise);

        return {
            id: index,
            left: 4 + ((index * 11 + Math.floor(random * 50)) % 88),
            size: 4 + Math.round(random * 4),
            drift: `${(random * 8 - 4).toFixed(1)}px`,
            delay: (random * 4).toFixed(2),
            duration: (3.2 + random * 2.4).toFixed(2),
        };
    });

/** One period of a sine-ish surface, repeated twice across a 200-wide box. */
const WAVE = "M0,8 C12.5,2 25,2 37.5,8 C50,14 62.5,14 75,8 C87.5,2 100,2 100,8 L100,24 L0,24 Z";
const WAVE_TWICE = `${WAVE} M100,8 C112.5,2 125,2 137.5,8 C150,14 162.5,14 175,8 C187.5,2 200,2 200,8 L200,24 L100,24 Z`;

export const Progress = ({ value, label, className }: ProgressProps) => {
    const percent = Math.max(0, Math.min(100, value));

    // Chosen once per mount. Without it every bar starts at the same phase on
    // every reload, so the three of them move in lockstep and it reads as a loop.
    const start = useMemo(
        () => ({
            seed: Math.random(),
            // Negative delays drop each wave in partway through its cycle.
            slowWave: -(Math.random() * 7).toFixed(2),
            fastWave: -(Math.random() * 4.5).toFixed(2),
        }),
        [],
    );

    const bubbles = useMemo(() => buildBubbles(start.seed), [start.seed]);

    return (
        <div
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            className={cx("relative h-7 w-full overflow-hidden rounded-full bg-tertiary", className)}
        >
            <div style={{ width: `${percent}%` }} className="absolute inset-y-0 left-0 overflow-hidden rounded-full bg-brand transition-[width] duration-500 ease-out">
                {/* Depth: lighter at the surface, darker at the bottom of the vessel. */}
                <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/15" />

                {/* Two surfaces at different speeds — one wave alone looks mechanical. */}
                <svg aria-hidden="true" viewBox="0 0 200 24" preserveAspectRatio="none" style={{ animation: `margin-wave 7s linear ${start.slowWave}s infinite` }} className="absolute inset-y-0 left-0 h-full w-[200%]">
                    <path d={WAVE_TWICE} fill="currentColor" className="text-white/22" />
                </svg>
                <svg
                    aria-hidden="true"
                    viewBox="0 0 200 24"
                    preserveAspectRatio="none"
                    style={{ animation: `margin-wave 4.5s linear ${start.fastWave}s infinite reverse` }}
                    className="absolute inset-y-0 left-0 h-full w-[200%] translate-y-[3px]"
                >
                    <path d={WAVE_TWICE} fill="currentColor" className="text-white/14" />
                </svg>

                {bubbles.map((bubble) => (
                    <span
                        key={bubble.id}
                        aria-hidden="true"
                        style={{
                            left: `${bubble.left}%`,
                            width: bubble.size,
                            height: bubble.size,
                            ["--drift" as string]: bubble.drift,
                            animation: `margin-bubble ${bubble.duration}s ease-in -${bubble.delay}s infinite`,
                        }}
                        className="absolute -bottom-1 rounded-full bg-white/70 shadow-[inset_0_-1px_1px_rgba(255,255,255,0.9)]"
                    />
                ))}
            </div>

            {label && <span className="absolute inset-y-0 right-3 flex items-center text-xs font-semibold tabular-nums text-secondary">{label}</span>}
        </div>
    );
};

/* ── spinner.tsx ── */

/**
 * The one busy indicator in the app.
 *
 * `currentColor` throughout, so it inherits whatever it sits inside — a brand
 * button, a muted row, a full-page guard — without a variant per context.
 * `motion-reduce:animate-none` leaves a static ring rather than a spinning one
 * for anyone who asked the OS for less movement.
 */
export const Spinner = ({ className }: { className?: string }) => (
    <svg className={cx("size-4 shrink-0 animate-spin motion-reduce:animate-none", className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        {/* The faint full ring, so the gap reads as motion rather than a defect. */}
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={2.5} className="opacity-25" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
    </svg>
);

/* ── field.tsx ── */

export const Field = ({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) => (
    <label className="block">
        <span className="text-xs font-medium text-tertiary">{label}</span>
        {children}
        {hint && <span className="mt-1 block text-xs text-quaternary">{hint}</span>}
    </label>
);

// Height and radius are the primary button's, so a field and the button under
// it read as one control stack rather than two unrelated shapes. Any change
// here has to move `h-11`/`rounded-full` on SubmitButton too.
const shell = "mt-1.5 flex h-11 w-full items-center gap-2 rounded-full bg-secondary px-4";

// The money input is the exception: it carries display-sized digits, which a
// 44px box crops. Taller, same radius.
const amountShell = "mt-1.5 flex h-14 w-full items-center gap-2 rounded-full bg-secondary px-5";
const control = "w-full min-w-0 bg-transparent text-sm font-medium text-primary outline-hidden placeholder:text-quaternary";

export const TextField = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
    <span className={shell}>
        <input {...props} className={cx(control, className)} />
    </span>
);

/**
 * A password box with a reveal toggle.
 *
 * Worth the extra control: these are typed blind on phones, and a typo in a
 * password is invisible by definition. The toggle is a real button so it is
 * reachable by keyboard, and it never submits the form around it.
 */
export const PasswordField = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => {
    const [shown, setShown] = useState(false);
    const Icon = shown ? HiOutlineEyeSlash : HiOutlineEye;

    return (
        <span className={shell}>
            <input {...props} type={shown ? "text" : "password"} className={cx(control, className)} />
            <button
                type="button"
                onClick={() => setShown((previous) => !previous)}
                aria-label={shown ? "Hide password" : "Show password"}
                className="-mr-1 shrink-0 rounded-full p-1 text-quaternary transition duration-100 ease-linear hover:text-tertiary"
            >
                <Icon className="size-4" />
            </button>
        </span>
    );
};

/** Digits-only with live grouping — money is never typed with a keyboard spinner. */
export const AmountField = ({ symbol, value, onValueChange }: { symbol: string; value: string; onValueChange: (next: string) => void }) => (
    <span className={amountShell}>
        <span className="shrink-0 text-lg font-medium text-tertiary">{symbol}</span>
        <input
            inputMode="numeric"
            placeholder="0"
            value={value ? Number(value).toLocaleString() : ""}
            onChange={(event) => onValueChange(event.target.value.replace(/[^\d]/g, ""))}
            className="w-full min-w-0 bg-transparent text-2xl font-semibold tracking-tight tabular-nums text-primary outline-hidden placeholder:text-quaternary"
        />
    </span>
);

export const ModalActions = ({
    onCancel,
    onConfirm,
    confirmLabel,
    confirmDisabled,
    leading,
}: {
    onCancel: () => void;
    onConfirm: () => void;
    confirmLabel: string;
    /** Greys out the confirm — for a form that can't be completed yet. */
    confirmDisabled?: boolean;
    /** Sits opposite the confirm button — for the odd destructive action. */
    leading?: ReactNode;
}) => (
    <div className="flex items-center justify-end gap-2">
        {leading && <div className="mr-auto">{leading}</div>}
        <button type="button" onClick={onCancel} className="h-10 rounded-full px-4 text-sm font-medium text-tertiary transition duration-100 ease-linear hover:bg-secondary">
            Cancel
        </button>
        <button
            type="button"
            onClick={onConfirm}
            disabled={confirmDisabled}
            className="h-10 rounded-full bg-brand-solid px-5 text-sm font-semibold text-white transition duration-100 ease-linear hover:bg-brand-solid_hover disabled:pointer-events-none disabled:opacity-40"
        >
            {confirmLabel}
        </button>
    </div>
);

/* ── modal.tsx ── */

interface ModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    label: string;
    children: ReactNode;
    className?: string;
}

/**
 * Bottom sheet on phones, centred panel from `sm` up — the same component either
 * way, because a centred dialog on a small screen puts the controls under the
 * thumb's blind spot.
 */
export const Modal = ({ isOpen, onOpenChange, label, children, className }: ModalProps) => (
    <ModalOverlay
        isDismissable
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        className={({ isEntering, isExiting }) =>
            cx(
                "fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4",
                isEntering && "duration-200 ease-out animate-in fade-in",
                isExiting && "duration-150 ease-in animate-out fade-out",
            )
        }
    >
        <RacModal
            className={({ isEntering, isExiting }) =>
                cx(
                    "w-full max-w-md rounded-t-3xl bg-popover shadow-xl ring-1 ring-popover sm:rounded-3xl",
                    isEntering && "duration-200 ease-out animate-in slide-in-from-bottom-4 sm:zoom-in-95 sm:slide-in-from-bottom-0",
                    isExiting && "duration-150 ease-in animate-out slide-out-to-bottom-4 sm:zoom-out-95 sm:slide-out-to-bottom-0",
                    className,
                )
            }
        >
            <Dialog aria-label={label} className="outline-hidden">
                {children}
            </Dialog>
        </RacModal>
    </ModalOverlay>
);
