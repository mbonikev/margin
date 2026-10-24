/**
 * The page's background texture. Six options, all drawn from two ideas the
 * brand already owns — the circle the mark is cut from, and the quiet grey the
 * cards sit on. None of them reproduce the logo: a wordmark blown up to 400px
 * is branding, not texture, and it fights the content for attention.
 *
 * Each layer takes a `preview` flag rather than being scaled down by CSS: a
 * 22px dot grid shrunk into a 70px tile is one dot, and a mask that clears the
 * middle of a page clears the whole of a tile. The preview therefore redraws
 * the same pattern at tile scale — same shapes, same colours, different numbers
 * — which is the only honest way to show what you are picking.
 */

import { usePreferences } from "@/providers";
import { cx } from "@/utils";

export type BackdropKind = "none" | "dots" | "grid" | "arcs" | "rings" | "waves";

export const backdrops: { id: BackdropKind; label: string }[] = [
    { id: "none", label: "None" },
    { id: "dots", label: "Dots" },
    { id: "grid", label: "Grid" },
    { id: "arcs", label: "Arcs" },
    { id: "rings", label: "Rings" },
    { id: "waves", label: "Waves" },
];

interface LayerProps {
    preview?: boolean;
}

/** Keeps the texture out of the middle of the page, where the cards sit. */
const centreMask = {
    maskImage: "radial-gradient(ellipse 70% 55% at 50% 50%, transparent 20%, black 85%)",
    WebkitMaskImage: "radial-gradient(ellipse 70% 55% at 50% 50%, transparent 20%, black 85%)",
} as const;

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.25 } as const;

const Dots = ({ preview }: LayerProps) => (
    <div
        className={cx(
            "absolute inset-0 text-quaternary [background-image:radial-gradient(currentColor_1px,transparent_1px)]",
            preview ? "opacity-45 [background-size:9px_9px]" : "opacity-30 [background-size:22px_22px]",
        )}
        style={preview ? undefined : centreMask}
    />
);

const Grid = ({ preview }: LayerProps) => (
    <div
        className={cx(
            "absolute inset-0 text-quaternary [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)]",
            preview ? "opacity-40 [background-size:14px_14px]" : "opacity-[0.06] [background-size:64px_64px]",
        )}
        style={preview ? undefined : centreMask}
    />
);

/** Concentric sweeps anchored off two corners — the mark's circle, opened up. */
const Arcs = ({ preview }: LayerProps) => (
    <svg aria-hidden="true" className="absolute inset-0 size-full text-brand" preserveAspectRatio="none" viewBox="0 0 100 100">
        <g opacity={preview ? 0.4 : 0.18} {...stroke} vectorEffect="non-scaling-stroke">
            <circle cx="2" cy="14" r="18" />
            <circle cx="2" cy="14" r="27" />
            <circle cx="2" cy="14" r="36" />
            <circle cx="99" cy="92" r="22" />
            <circle cx="99" cy="92" r="32" />
            <circle cx="99" cy="92" r="43" />
        </g>
    </svg>
);

/** Loose circles, like coins set down and forgotten. Positioned rather than
 *  drawn in one viewBox, so each one lands in a gutter instead of being
 *  letterboxed into the middle where the cards cover it. */
const pageRings = [
    "top-[8%] -left-28 size-80",
    "top-[46%] -left-16 size-44",
    "bottom-[6%] left-[10%] size-56",
    "-right-28 top-[18%] size-72",
    "right-[6%] bottom-[22%] size-52",
    "-right-16 bottom-[-6%] size-96",
];

const previewRings = ["top-1 left-2 size-10", "bottom-1 left-10 size-6", "top-2 right-6 size-7", "-bottom-2 -right-3 size-14"];

const Rings = ({ preview }: LayerProps) => (
    <>
        {(preview ? previewRings : pageRings).map((position) => (
            <span key={position} className={cx("absolute rounded-full border border-brand", preview ? "opacity-40" : "opacity-20", position)} />
        ))}
    </>
);

/** Long, slow curves across the foot of the page. */
const Waves = ({ preview }: LayerProps) => (
    <svg
        aria-hidden="true"
        className={cx("absolute inset-x-0 bottom-0 w-full text-brand", preview ? "h-full" : "h-1/2")}
        preserveAspectRatio="none"
        viewBox="0 0 400 160"
    >
        <g {...stroke} vectorEffect="non-scaling-stroke">
            <path d="M-10 108c60 0 70-28 130-28s80 34 140 34 70-26 150-26" opacity={preview ? 0.5 : 0.3} />
            <path d="M-10 128c60 0 70-28 130-28s80 34 140 34 70-26 150-26" opacity={preview ? 0.35 : 0.2} />
            <path d="M-10 148c60 0 70-28 130-28s80 34 140 34 70-26 150-26" opacity={preview ? 0.2 : 0.12} />
        </g>
    </svg>
);

const layers: Record<BackdropKind, (props: LayerProps) => React.ReactNode> = {
    none: () => null,
    dots: Dots,
    grid: Grid,
    arcs: Arcs,
    rings: Rings,
    waves: Waves,
};

/** The real thing: fixed, so it holds still while the page scrolls. */
export const PageBackdrop = () => {
    const { preferences } = usePreferences();
    const Layer = layers[preferences.backdrop] ?? layers.waves;

    if (preferences.backdrop === "none") return null;

    return (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
            <Layer />
        </div>
    );
};

/** The same pattern at tile scale, for the picker. */
export const BackdropPreview = ({ kind, className }: { kind: BackdropKind; className?: string }) => {
    const Layer = layers[kind];

    return (
        <span aria-hidden="true" className={cx("relative block overflow-hidden rounded-xl bg-secondary", className)}>
            <Layer preview />
        </span>
    );
};
