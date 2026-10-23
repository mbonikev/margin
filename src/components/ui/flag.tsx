import type { FC } from "react";
import { AU, CA, EU, GB, GH, IN, JP, KE, NG, RW, SN, TZ, UG, US, ZA } from "country-flag-icons/react/1x1";
import { cx } from "@/utils/cx";

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
