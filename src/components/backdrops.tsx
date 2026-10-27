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

export type BackdropKind = "none" | "arcs" | "rings" | "waves" | "glow" | "beams";

export const backdrops: { id: BackdropKind; label: string }[] = [
    { id: "none", label: "None" },
    { id: "arcs", label: "Arcs" },
    { id: "rings", label: "Rings" },
    { id: "waves", label: "Waves" },
    { id: "glow", label: "Glow" },
    { id: "beams", label: "Beams" },
];

/**
 * Dots and Grid were removed. Anyone who had one selected still has that string
 * in their stored preferences, and it would otherwise resolve to no layer at
 * all — a blank page in the picker rather than a choice.
 */
export const resolveBackdrop = (value: string): BackdropKind =>
    (backdrops.some((option) => option.id === value) ? value : "waves") as BackdropKind;

interface LayerProps {
    preview?: boolean;
}

/** Keeps the texture out of the middle of the page, where the cards sit. */
const centreMask = {
    maskImage: "radial-gradient(ellipse 70% 55% at 50% 50%, transparent 20%, black 85%)",
    WebkitMaskImage: "radial-gradient(ellipse 70% 55% at 50% 50%, transparent 20%, black 85%)",
} as const;

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.25 } as const;

/** Concentric sweeps anchored off two corners — the mark's circle, opened up. */
const Arcs = ({ preview }: LayerProps) => (
    <svg aria-hidden="true" className="absolute inset-0 size-full text-brand" preserveAspectRatio="none" viewBox="0 0 100 100">
        <g opacity={preview ? 0.4 : 0.10} {...stroke} vectorEffect="non-scaling-stroke">
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
            <span key={position} className={cx("absolute rounded-full border border-brand", preview ? "opacity-40" : "opacity-[0.12]", position)} />
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
            <path d="M-10 108c60 0 70-28 130-28s80 34 140 34 70-26 150-26" opacity={preview ? 0.5 : 0.18} />
            <path d="M-10 128c60 0 70-28 130-28s80 34 140 34 70-26 150-26" opacity={preview ? 0.35 : 0.12} />
            <path d="M-10 148c60 0 70-28 130-28s80 34 140 34 70-26 150-26" opacity={preview ? 0.2 : 0.07} />
        </g>
    </svg>
);

/**
 * Soft blooms in opposite corners. The only layer with no strokes at all — it
 * reads as light on the page rather than as drawing, which is what makes it
 * distinct from the other five rather than a variation on them.
 */
const Glow = ({ preview }: LayerProps) => (
    <>
        <span
            className={cx(
                "absolute rounded-full bg-brand blur-3xl",
                preview ? "-top-6 -left-8 size-24 opacity-30" : "-top-32 -left-32 size-[32rem] opacity-[0.10]",
            )}
        />
        <span
            className={cx(
                "absolute rounded-full bg-brand blur-3xl",
                preview ? "-right-8 -bottom-8 size-28 opacity-25" : "-right-40 bottom-[-10rem] size-[40rem] opacity-[0.08]",
            )}
        />
    </>
);

/**
 * Long diagonals raking across the page. Skewed rather than rotated so they
 * stay parallel at any viewport ratio, and spaced unevenly so the eye reads
 * them as light rather than as a ruled grid — which is the thing Grid was
 * removed for being.
 */
const beamOffsets = ["12%", "27%", "38%", "58%", "71%", "88%"];

const Beams = ({ preview }: LayerProps) => (
    <div className="absolute inset-0 overflow-hidden" style={preview ? undefined : centreMask}>
        {beamOffsets.map((left, index) => (
            <span
                key={left}
                style={{ left }}
                className={cx(
                    "absolute -top-1/4 h-[150%] w-px -skew-x-12 bg-brand",
                    preview ? "opacity-40" : index % 2 === 0 ? "opacity-[0.14]" : "opacity-[0.07]",
                )}
            />
        ))}
    </div>
);

const layers: Record<BackdropKind, (props: LayerProps) => React.ReactNode> = {
    none: () => null,
    arcs: Arcs,
    rings: Rings,
    waves: Waves,
    glow: Glow,
    beams: Beams,
};

/** The real thing: fixed, so it holds still while the page scrolls. */
export const PageBackdrop = () => {
    const { preferences } = usePreferences();
    const Layer = layers[resolveBackdrop(preferences.backdrop)];

    if (preferences.backdrop === "none") return null;

    return (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
            <Layer />
        </div>
    );
};

/** The same pattern at tile scale, for the picker. */
export const BackdropPreview = ({ kind, className }: { kind: BackdropKind; className?: string }) => {
    const Layer = layers[resolveBackdrop(kind)];

    return (
        <span aria-hidden="true" className={cx("relative block overflow-hidden rounded-xl bg-secondary", className)}>
            <Layer preview />
        </span>
    );
};
