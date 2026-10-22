import { cx } from "@/utils/cx";

interface SeparatorProps {
    orientation?: "vertical" | "horizontal";
    className?: string;
}

export const Separator = ({ orientation = "vertical", className }: SeparatorProps) => (
    <span
        role="separator"
        aria-orientation={orientation}
        className={cx("shrink-0 bg-border-secondary", orientation === "vertical" ? "h-5 w-px" : "h-px w-full", className)}
    />
);
