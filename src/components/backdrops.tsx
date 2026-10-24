/**
 * The page's background texture. Seven options, all drawn from two ideas the
 * brand already owns — the circle the mark is cut from, and the quiet grey the
 * cards sit on. None of them reproduce the logo: a wordmark blown up to 400px
 * is branding, not texture, and it fights the content for attention.
 *
 * Every layer is `fixed`-friendly, pointer-transparent, and built from theme
 * tokens, so each one follows the accent colour and both themes with nothing
 * to load.
 */

import { usePreferences } from "@/providers";
import { cx } from "@/utils";

export type BackdropKind = "none" | "dots" | "grid" | "arcs" | "rings" | "waves" | "glow";

export const backdrops: { id: BackdropKind; label: string }[] = [
    { id: "none", label: "None" },
    { id: "dots", label: "Dots" },
    { id: "grid", label: "Grid" },
    { id: "arcs", label: "Arcs" },
    { id: "rings", label: "Rings" },
    { id: "waves", label: "Waves" },
    { id: "glow", label: "Glow" },
];

/** Keeps the texture out of the middle, where the cards are. */
const centreMask = {
    maskImage: "radial-gradient(ellipse 70% 55% at 50% 50%, transparent 20%, black 85%)",
    WebkitMaskImage: "radial-gradient(ellipse 70% 55% at 50% 50%, transparent 20%, black 85%)",
} as const;

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.25 } as const;

const Dots = () => (
    <div
        className="absolute inset-0 opacity-60 [background-image:radial-gradient(var(--color-border-secondary)_1px,transparent_1px)] [background-size:22px_22px]"
        style={centreMask}
    />
);

const Grid = () => (
    <div
        className="absolute inset-0 opacity-50 [background-image:linear-gradient(to_right,var(--color-border-secondary)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border-secondary)_1px,transparent_1px)] [background-size:56px_56px]"
        style={centreMask}
    />
);

/** Concentric sweeps anchored off two corners — the mark's circle, opened up. */
const Arcs = () => (
    <svg aria-hidden="true" className="absolute inset-0 size-full text-brand" preserveAspectRatio="none" viewBox="0 0 100 100">
        <g opacity="0.1" {...stroke} vectorEffect="non-scaling-stroke">
            <circle cx="2" cy="14" r="18" />
            <circle cx="2" cy="14" r="27" />
            <circle cx="2" cy="14" r="36" />
            <circle cx="99" cy="92" r="22" />
            <circle cx="99" cy="92" r="32" />
            <circle cx="99" cy="92" r="43" />
        </g>
    </svg>
);

/** Loose circles, like coins set down and forgotten. */
const Rings = () => (
    <svg aria-hidden="true" className="absolute inset-0 size-full text-brand" viewBox="0 0 400 300">
        <g {...stroke}>
            <circle cx="52" cy="62" r="34" opacity="0.16" />
            <circle cx="96" cy="104" r="16" opacity="0.12" />
            <circle cx="344" cy="228" r="42" opacity="0.14" />
            <circle cx="300" cy="188" r="18" opacity="0.1" />
            <circle cx="366" cy="54" r="22" opacity="0.08" />
            <circle cx="40" cy="244" r="24" opacity="0.1" />
        </g>
    </svg>
);

/** Long, slow curves across the foot of the page. */
const Waves = () => (
    <svg aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 w-full text-brand" preserveAspectRatio="none" viewBox="0 0 400 160">
        <g {...stroke} vectorEffect="non-scaling-stroke">
            <path d="M-10 108c60 0 70-28 130-28s80 34 140 34 70-26 150-26" opacity="0.18" />
            <path d="M-10 128c60 0 70-28 130-28s80 34 140 34 70-26 150-26" opacity="0.12" />
            <path d="M-10 148c60 0 70-28 130-28s80 34 140 34 70-26 150-26" opacity="0.07" />
        </g>
    </svg>
);

/** No pattern at all — just warmth in two corners. */
const Glow = () => (
    <>
        <span className="absolute -top-32 -left-24 size-[32rem] rounded-full bg-brand-solid opacity-[0.07] blur-3xl" />
        <span className="absolute -right-28 -bottom-40 size-[36rem] rounded-full bg-brand-solid opacity-[0.05] blur-3xl" />
    </>
);

const layers: Record<BackdropKind, () => React.ReactNode> = {
    none: () => null,
    dots: Dots,
    grid: Grid,
    arcs: Arcs,
    rings: Rings,
    waves: Waves,
    glow: Glow,
};

/** The real thing: fixed, so it holds still while the page scrolls. */
export const PageBackdrop = () => {
    const { preferences } = usePreferences();
    const Layer = layers[preferences.backdrop] ?? layers.dots;

    if (preferences.backdrop === "none") return null;

    return (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
            <Layer />
        </div>
    );
};

/**
 * The same layers at tile size for the picker. Honest rather than illustrative:
 * it renders the real pattern, just cropped.
 */
export const BackdropPreview = ({ kind, className }: { kind: BackdropKind; className?: string }) => {
    const Layer = layers[kind];

    return (
        <span aria-hidden="true" className={cx("relative block overflow-hidden rounded-xl bg-secondary", className)}>
            <Layer />
        </span>
    );
};
