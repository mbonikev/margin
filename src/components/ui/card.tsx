import type { HTMLAttributes } from "react";
import { cx } from "@/utils/cx";

/** The surface everything on the dashboard sits on: white, chubby, no border. */
export const Card = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <div {...props} className={cx("rounded-3xl bg-primary p-4 shadow-xs md:p-5", className)}>
        {children}
    </div>
);
