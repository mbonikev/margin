import type { HTMLAttributes } from "react";
import { cx } from "@/utils/cx";

type LogoVariant = "wordmark" | "mark";

interface LogoProps extends HTMLAttributes<HTMLSpanElement> {
    /** `wordmark` is the full "margin" lockup, `mark` is the circular icon only. */
    variant?: LogoVariant;
}

const sources: Record<LogoVariant, { light: string; dark: string; width: number; height: number }> = {
    wordmark: { light: "/logos/wordmark-green.png", dark: "/logos/wordmark-white.png", width: 312, height: 96 },
    mark: { light: "/logos/mark-green.png", dark: "/logos/mark-white.png", width: 96, height: 96 },
};

export const Logo = ({ variant = "wordmark", className, ...props }: LogoProps) => {
    const { light, dark, width, height } = sources[variant];

    return (
        <span {...props} className={cx("inline-flex shrink-0 items-center", className)}>
            <img src={light} width={width} height={height} alt="Margin" className="h-full w-auto dark:hidden" />
            <img src={dark} width={width} height={height} alt="" aria-hidden="true" className="hidden h-full w-auto dark:block" />
        </span>
    );
};
