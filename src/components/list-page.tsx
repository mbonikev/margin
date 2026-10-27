/**
 * The frame for the "view all" pages.
 *
 * These exist because the dashboard cards only ever show a slice, and their
 * View all buttons previously went nowhere (Issues.txt #10). Each page reuses
 * the same component the dashboard card does, just without a limit and without
 * a further link onward.
 */

import type { ReactNode } from "react";
import { HiOutlineArrowLeft } from "react-icons/hi2";
import { useNavigate } from "react-router";
import { Spinner } from "@/components/ui";

export const ListPage = ({ title, subtitle, loading, children }: { title: string; subtitle: string; loading?: boolean; children: ReactNode }) => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col gap-1.5 md:gap-2">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => void navigate("/")}
                    aria-label="Back to dashboard"
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-tertiary shadow-xs transition duration-100 ease-linear hover:text-brand-secondary"
                >
                    <HiOutlineArrowLeft className="size-4.5" />
                </button>

                <div className="min-w-0">
                    <h1 className="truncate text-xl font-semibold tracking-tight text-primary md:text-2xl">{title}</h1>
                    <p className="truncate text-sm text-tertiary">{subtitle}</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <Spinner className="size-6 text-quaternary" />
                </div>
            ) : (
                children
            )}
        </div>
    );
};
