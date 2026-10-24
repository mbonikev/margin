import { Plus, User01 } from "@untitledui/icons";
import { type FC, type ReactNode, useState } from "react";
import type { ButtonProps as AriaButtonProps } from "react-aria-components";
import { Tooltip as AriaTooltip, TooltipTrigger as AriaTooltipTrigger } from "@/components/base/tooltip";
import { cx } from "@/utils";

/* ── verified-tick.tsx ── */

const tickSizes = {
    xs: "size-2.5",
    sm: "size-3",
    md: "size-3.5",
    lg: "size-4",
    xl: "size-4.5",
    "2xl": "size-5",
    "3xl": "size-6",
    "4xl": "size-8",
};

interface VerifiedTickProps {
    size: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
    className?: string;
}

export const VerifiedTick = ({ size, className }: VerifiedTickProps) => (
    <svg className={cx("z-10 text-utility-blue-500", tickSizes[size], className)} viewBox="0 0 10 10" fill="none">
        <path
            d="M7.72237 1.77098C7.81734 2.00068 7.99965 2.18326 8.2292 2.27858L9.03413 2.61199C9.26384 2.70714 9.44635 2.88965 9.5415 3.11936C9.63665 3.34908 9.63665 3.60718 9.5415 3.83689L9.20833 4.64125C9.11313 4.87106 9.113 5.12943 9.20863 5.35913L9.54122 6.16325C9.58839 6.27702 9.61268 6.39897 9.6127 6.52214C9.61272 6.6453 9.58847 6.76726 9.54134 6.88105C9.4942 6.99484 9.42511 7.09823 9.33801 7.18531C9.2509 7.27238 9.14749 7.34144 9.03369 7.38854L8.22934 7.72171C7.99964 7.81669 7.81706 7.99899 7.72174 8.22855L7.38833 9.03348C7.29318 9.26319 7.11067 9.4457 6.88096 9.54085C6.65124 9.636 6.39314 9.636 6.16343 9.54085L5.35907 9.20767C5.12935 9.11276 4.87134 9.11295 4.64177 9.20821L3.83684 9.54115C3.60725 9.63608 3.34937 9.636 3.11984 9.54092C2.89032 9.44585 2.70791 9.26356 2.6127 9.03409L2.27918 8.22892C2.18421 7.99923 2.0019 7.81665 1.77235 7.72133L0.967421 7.38792C0.737807 7.29281 0.555355 7.11041 0.460169 6.88083C0.364983 6.65125 0.364854 6.39327 0.45981 6.16359L0.792984 5.35924C0.8879 5.12952 0.887707 4.87151 0.792445 4.64193L0.459749 3.83642C0.41258 3.72265 0.388291 3.60069 0.388272 3.47753C0.388252 3.35436 0.412501 3.2324 0.459634 3.11861C0.506767 3.00482 0.57586 2.90144 0.662965 2.81436C0.75007 2.72728 0.853479 2.65822 0.967283 2.61113L1.77164 2.27795C2.00113 2.18306 2.1836 2.00099 2.27899 1.7717L2.6124 0.966768C2.70755 0.737054 2.89006 0.554547 3.11978 0.459397C3.34949 0.364246 3.60759 0.364246 3.83731 0.459397L4.64166 0.792571C4.87138 0.887487 5.12939 0.887293 5.35897 0.792031L6.16424 0.459913C6.39392 0.364816 6.65197 0.364836 6.88164 0.459968C7.11131 0.555099 7.29379 0.737554 7.38895 0.967208L7.72247 1.77238L7.72237 1.77098Z"
            className="fill-current"
        />
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M6.95829 3.68932C7.02509 3.58439 7.04747 3.45723 7.02051 3.3358C6.99356 3.21437 6.91946 3.10862 6.81454 3.04182C6.70961 2.97502 6.58245 2.95264 6.46102 2.97959C6.33959 3.00655 6.23384 3.08064 6.16704 3.18557L4.33141 6.06995L3.49141 5.01995C3.41375 4.92281 3.30069 4.8605 3.17709 4.84673C3.05349 4.83296 2.92949 4.86885 2.83235 4.94651C2.73522 5.02417 2.67291 5.13723 2.65914 5.26083C2.64536 5.38443 2.68125 5.50843 2.75891 5.60557L4.00891 7.16807C4.0555 7.22638 4.11533 7.27271 4.18344 7.30323C4.25154 7.33375 4.32595 7.34757 4.40047 7.34353C4.47499 7.3395 4.54747 7.31773 4.61188 7.28004C4.67629 7.24234 4.73077 7.18981 4.77079 7.12682L6.95829 3.68932Z"
            fill="white"
        />
    </svg>
);

/* ── avatar-online-indicator.tsx ── */

const indicatorSizes = {
    xs: "size-1.5",
    sm: "size-2",
    md: "size-2.5",
    lg: "size-3",
    xl: "size-3.5",
    "2xl": "size-4",
    "3xl": "size-4.5",
    "4xl": "size-5",
};

interface AvatarOnlineIndicatorProps {
    size: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
    status: "online" | "offline";
    className?: string;
}

export const AvatarOnlineIndicator = ({ size, status, className }: AvatarOnlineIndicatorProps) => (
    <span
        className={cx(
            "absolute right-0 bottom-0 flex justify-center rounded-full ring-[1.5px] ring-bg-primary",
            status === "online" ? "bg-fg-success-secondary" : "bg-utility-neutral-300",
            indicatorSizes[size],
            className,
        )}
        style={{
            backgroundImage:
                "radial-gradient(43.75% 43.75% at 50% 28.75%, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.00) 100%), radial-gradient(50% 50% at 50% 50%, rgba(255, 255, 255, 0.00) 74.66%, rgba(255, 255, 255, 0.18) 100%), radial-gradient(75% 75% at 50% 0%, rgba(255, 255, 255, 0.00) 0%, rgba(255, 255, 255, 0.00) 50%, rgba(255, 255, 255, 0.08) 99%, rgba(255, 255, 255, 0.00) 100%)",
        }}
    >
        {/* Reflection */}
        <svg viewBox="0 0 7.2 2.85" fill="none" className="mt-[10%] h-[20%] w-[60%]">
            <path
                d="M7.2 1.83107C7.2 2.84235 5.58823 2.19729 3.6 2.19729C1.61177 2.19729 0 2.84235 0 1.83107C0 0.8198 1.61177 0 3.6 0C5.58823 0 7.2 0.8198 7.2 1.83107Z"
                fill="url(#reflection-gradient)"
                fillOpacity="0.4"
            />
            <defs>
                <linearGradient id="reflection-gradient" x1="3.6" y1="0" x2="3.6" y2="2.4" gradientUnits="userSpaceOnUse">
                    <stop stopColor="white" />
                    <stop offset="1" stopColor="white" stopOpacity="0.1" />
                </linearGradient>
            </defs>
        </svg>
    </span>
);

/* ── avatar-company-icon.tsx ── */

const companyIconSizes = {
    xs: "size-2",
    sm: "size-3",
    md: "size-3.5",
    lg: "size-4",
    xl: "size-4.5",
    "2xl": "size-5 ring-[1.67px]",
};

interface AvatarCompanyIconProps {
    size: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
    src: string;
    alt?: string;
}

export const AvatarCompanyIcon = ({ size, src, alt }: AvatarCompanyIconProps) => (
    <img
        src={src}
        alt={alt}
        className={cx("absolute -right-0.5 -bottom-0.5 rounded-full bg-brand-50 object-cover ring-[1.5px] ring-bg-primary", companyIconSizes[size])}
    />
);

/* ── avatar-add-button.tsx ── */

const addButtonSizes = {
    xs: { root: "size-6", icon: "size-4" },
    sm: { root: "size-8", icon: "size-4" },
    md: { root: "size-10", icon: "size-5" },
};

interface AvatarAddButtonProps extends AriaButtonProps {
    size: "xs" | "sm" | "md";
    title?: string;
    className?: string;
}

export const AvatarAddButton = ({ size, className, title = "Add user", ...props }: AvatarAddButtonProps) => (
    <AriaTooltip title={title}>
        <AriaTooltipTrigger
            {...props}
            aria-label={title}
            className={cx(
                "flex cursor-pointer items-center justify-center rounded-full border border-dashed border-primary bg-primary text-fg-quaternary outline-focus-ring transition duration-100 ease-linear hover:bg-primary_hover hover:text-fg-quaternary_hover focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50",
                addButtonSizes[size].root,
                className,
            )}
        >
            <Plus className={cx("text-current transition-inherit-all", addButtonSizes[size].icon)} />
        </AriaTooltipTrigger>
    </AriaTooltip>
);

/* ── avatar-count.tsx ── */

interface AvatarCountProps {
    count: number;
    className?: string;
}

export const AvatarCount = ({ count, className }: AvatarCountProps) => (
    <div className={cx("absolute right-0 bottom-0 p-px", className)}>
        <div className="flex size-3.5 items-center justify-center rounded-full bg-fg-error-primary text-center text-[10px] leading-[13px] font-bold text-white">
            {count}
        </div>
    </div>
);

/* ── avatar.tsx ── */

export interface AvatarProps {
    /**
     * The dimensions of the avatar, which also scale the initials, placeholder icon and status indicator.
     */
    size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
    /**
     * The class name for the outer wrapper of the avatar.
     */
    className?: string;
    /**
     * The class name for the main child of the avatar.
     */
    contentClassName?: string;
    /**
     * The URL of the avatar image. Falls back to the initials, placeholder icon or placeholder if it is missing or fails to load.
     */
    src?: string | null;
    /**
     * The alternative text for the avatar image.
     */
    alt?: string;
    /**
     * Display an inner contrast border around the avatar image.
     */
    contrastBorder?: boolean;
    /**
     * Whether the avatar should be rounded.
     * @default true
     */
    rounded?: boolean;
    /**
     * Display an outer border around the avatar.
     */
    border?: boolean;
    /**
     * Display a badge (i.e. company logo).
     */
    badge?: ReactNode;
    /**
     * Display a status indicator.
     */
    status?: "online" | "offline";
    /**
     * Display a verified tick icon.
     *
     * @default false
     */
    verified?: boolean;
    /**
     * Display a count badge.
     */
    count?: number;
    /**
     * The initials of the user to display if no image is available.
     */
    initials?: string;
    /**
     * An icon to display if no image is available.
     */
    placeholderIcon?: FC<{ className?: string }>;
    /**
     * A placeholder to display if no image is available.
     */
    placeholder?: ReactNode;

    /**
     * Whether the avatar should show a focus ring when the parent group is in focus.
     * For example, when the avatar is wrapped inside a link.
     *
     * @default false
     */
    focusable?: boolean;
}

const styles = {
    xs: { root: "size-6", rootWithBorder: "p-px", initials: "text-xs font-semibold", icon: "size-4" },
    sm: { root: "size-8", rootWithBorder: "p-px", initials: "text-sm font-semibold", icon: "size-5" },
    md: { root: "size-10", rootWithBorder: "p-px", initials: "text-md font-semibold", icon: "size-6" },
    lg: { root: "size-12", rootWithBorder: "p-[1.5px]", initials: "text-lg font-semibold", icon: "size-7" },
    xl: { root: "size-14", rootWithBorder: "p-0.5", initials: "text-xl font-semibold", icon: "size-8" },
    "2xl": { root: "size-16", rootWithBorder: "p-0.5", initials: "text-display-xs font-semibold", icon: "size-8" },
};

export const Avatar = ({
    size = "md",
    src,
    alt,
    initials,
    placeholder,
    placeholderIcon: PlaceholderIcon,
    border,
    badge,
    status,
    verified,
    count,
    focusable = false,
    rounded = true,
    className,
    contentClassName,
}: AvatarProps) => {
    const [isFailed, setIsFailed] = useState(false);

    const canShowImage = src && !isFailed;

    const renderMainContent = () => {
        if (canShowImage) {
            return <img data-avatar-img className="size-full object-cover" src={src} alt={alt} onError={() => setIsFailed(true)} />;
        }

        if (initials) {
            return <span className={cx("text-quaternary", styles[size].initials)}>{initials}</span>;
        }

        if (PlaceholderIcon) {
            return <PlaceholderIcon className={cx("text-fg-quaternary", styles[size].icon)} />;
        }

        return placeholder || <User01 className={cx("text-fg-quaternary", styles[size].icon)} />;
    };

    const renderBadgeContent = () => {
        if (status) {
            return <AvatarOnlineIndicator status={status} size={size} />;
        }

        if (verified) {
            return <VerifiedTick size={size} className={cx("absolute right-0 bottom-0", size === "xs" && "-right-px -bottom-px")} />;
        }

        if (count) {
            return <AvatarCount count={count} />;
        }

        return badge;
    };

    return (
        <div
            data-avatar
            className={cx(
                "relative inline-flex shrink-0 rounded-[7px]",
                rounded && "rounded-full",
                // Focus styles
                focusable && "outline-transparent group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-focus-ring",
                border && "ring-1 ring-secondary_alt",
                border && styles[size].rootWithBorder,
                styles[size].root,
                className,
            )}
        >
            <div
                className={cx(
                    "relative inline-flex size-full shrink-0 items-center justify-center overflow-hidden rounded-md bg-tertiary outline-[0.5px] -outline-offset-[0.5px] outline-black/16 before:inset-[0.5px]",
                    rounded && "rounded-full",
                    canShowImage &&
                        size !== "xs" &&
                        "before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-white/32 before:mask-[linear-gradient(to_bottom,black_0%,transparent_25%,transparent_75%,black_100%)]",
                    contentClassName,
                )}
            >
                {renderMainContent()}
            </div>
            {renderBadgeContent()}
        </div>
    );
};
