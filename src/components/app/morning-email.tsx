import { HiOutlineEnvelope, HiOutlineFire } from "react-icons/hi2";
import { Card } from "@/components/ui/card";
import { cx } from "@/utils/cx";

export const MorningEmail = ({ streak, sendsAt, preview, className }: { streak: number; sendsAt: string; preview: string; className?: string }) => (
    <Card className={cx("flex flex-col gap-4", className)}>
        <div className="flex items-center justify-between gap-3">
            <h2 className="truncate text-lg font-semibold tracking-tight text-primary md:text-xl">Morning email</h2>

            <span className="flex h-7 shrink-0 items-center gap-1 rounded-full bg-brand-primary px-2.5 text-xs font-semibold text-brand-secondary">
                <HiOutlineFire className="size-4" />
                {streak}
            </span>
        </div>

        {/* A sample of the thing itself — the product is the email, not the app. */}
        <blockquote className="rounded-2xl bg-secondary px-4 py-3 text-sm text-secondary italic">“{preview}”</blockquote>

        <div className="mt-auto flex items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-xs text-tertiary">
                <HiOutlineEnvelope className="size-4 shrink-0" />
                Next at {sendsAt}
            </p>

            <button
                type="button"
                className="h-8 shrink-0 rounded-full px-3 text-xs font-semibold text-brand-secondary transition duration-100 ease-linear hover:bg-brand-primary"
            >
                Edit schedule
            </button>
        </div>
    </Card>
);
