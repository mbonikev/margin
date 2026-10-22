import type { HTMLAttributes } from "react";
import { cx } from "@/utils/cx";

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
    wordmark: { src: "/logos/wordmark-green.png", ratio: 1877 / 578 },
    mark: { src: "/logos/mark-green.png", ratio: 1 },
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
