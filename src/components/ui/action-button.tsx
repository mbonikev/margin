import type { ButtonHTMLAttributes, FC } from "react";
import { cx } from "@/utils/cx";

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
