import { useMemo } from "react";
import { cx } from "@/utils/cx";

interface ProgressProps {
    /** 0–100. */
    value: number;
    label?: string;
    className?: string;
}

/** Deterministic per-value, so bubbles don't reshuffle on every render. */
const buildBubbles = (seed: number) =>
    Array.from({ length: 7 }, (_, index) => {
        const noise = Math.sin(seed * 12.9898 + index * 78.233) * 43758.5453;
        const random = noise - Math.floor(noise);

        return {
            id: index,
            left: 6 + ((index * 13 + Math.floor(random * 40)) % 84),
            size: 4 + Math.round(random * 5),
            delay: (random * 3.4).toFixed(2),
            duration: (2.8 + random * 2.6).toFixed(2),
        };
    });

export const Progress = ({ value, label, className }: ProgressProps) => {
    const percent = Math.max(0, Math.min(100, value));
    const bubbles = useMemo(() => buildBubbles(percent), [percent]);

    return (
        <div
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            className={cx("relative h-9 w-full overflow-hidden rounded-full bg-tertiary", className)}
        >
            <div style={{ width: `${percent}%` }} className="absolute inset-y-0 left-0 overflow-hidden rounded-full bg-brand transition-[width] duration-500 ease-out">
                {/* The liquid: a slow highlight drifting across the fill. */}
                <span
                    aria-hidden="true"
                    style={{ animation: "margin-liquid 6s linear infinite" }}
                    className="absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.22)_45%,transparent_90%)] bg-[length:200%_100%]"
                />

                {bubbles.map((bubble) => (
                    <span
                        key={bubble.id}
                        aria-hidden="true"
                        style={{
                            left: `${bubble.left}%`,
                            width: bubble.size,
                            height: bubble.size,
                            animation: `margin-bubble ${bubble.duration}s ease-in ${bubble.delay}s infinite`,
                        }}
                        className="absolute bottom-0 rounded-full bg-white/45"
                    />
                ))}

                {/* A brighter meniscus at the leading edge. */}
                <span aria-hidden="true" className="absolute inset-y-0 right-0 w-1.5 bg-white/25" />
            </div>

            {label && <span className="absolute inset-y-0 right-3 flex items-center text-xs font-semibold tabular-nums text-secondary">{label}</span>}
        </div>
    );
};
