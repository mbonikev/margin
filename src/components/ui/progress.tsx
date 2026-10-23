import { useMemo } from "react";
import { cx } from "@/utils/cx";

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
