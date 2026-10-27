/**
 * The frame every auth screen sits in.
 *
 * Four screens — sign in, sign up, forgot, reset — share one layout so they
 * cannot drift apart, and one submit button so every one of them shows a
 * spinner while it waits. The missing busy state was the thing that made these
 * feel dead: a form that looks identical before and after you press it reads as
 * broken, and people press again.
 */

import type { ReactNode } from "react";
import { HiOutlineEnvelope } from "react-icons/hi2";
import { PageBackdrop } from "@/components/backdrops";
import { Logo, Spinner } from "@/components/ui";
import { cx } from "@/utils";

export const AuthLayout = ({ title, subtitle, error, children, footer }: { title: string; subtitle: string; error?: string | null; children: ReactNode; footer?: ReactNode }) => (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-secondary px-4 py-10">
        <PageBackdrop />

        <div className="relative w-full max-w-sm">
            <div className="flex flex-col items-center text-center">
                <Logo className="h-8" />
                <h1 className="mt-6 text-2xl font-semibold tracking-tight text-primary">{title}</h1>
                <p className="mt-1 text-sm text-tertiary">{subtitle}</p>
            </div>

            {/* `role="alert"` so a screen reader announces the failure rather
                than leaving it to be discovered on a re-read of the page. */}
            {error && (
                <p role="alert" className="mt-4 rounded-2xl bg-error-primary px-4 py-3 text-center text-xs font-medium text-error-primary">
                    {error}
                </p>
            )}

            <div className="mt-6 rounded-3xl bg-primary p-5 shadow-xs">{children}</div>

            {footer && <div className="mt-4 text-center text-xs text-tertiary">{footer}</div>}

            <p className="mt-4 text-center text-xs text-quaternary">Margin never connects to your bank. You tell it what you have.</p>
        </div>
    </main>
);

/**
 * The primary action. Keeps its label while busy and puts the spinner beside
 * it, so the button does not change width mid-press and shift the layout.
 */
export const SubmitButton = ({ busy, children, className }: { busy?: boolean; children: ReactNode; className?: string }) => (
    <button
        type="submit"
        disabled={busy}
        className={cx(
            "flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand-solid text-sm font-semibold text-white",
            "transition duration-100 ease-linear hover:bg-brand-solid_hover disabled:pointer-events-none disabled:opacity-60",
            className,
        )}
    >
        {busy && <Spinner />}
        {children}
    </button>
);

/**
 * The panel shown once a mail is on its way.
 *
 * Deliberately terse: the layout's title and subtitle already say what
 * happened, so all this adds is the address it went to and what to do if it
 * does not arrive.
 */
export const SentNotice = ({ email, note }: { email: string; note: string }) => (
    <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-brand-primary text-brand-secondary">
            <HiOutlineEnvelope className="size-6" />
        </span>
        <p className="text-sm font-medium break-all text-primary">{email}</p>
        <p className="text-xs text-quaternary">{note}</p>
    </div>
);

/** The quiet text link under the card — "Create one", "Sign in instead". */
export const AuthLink = ({ onPress, children }: { onPress: () => void; children: ReactNode }) => (
    <button type="button" onClick={onPress} className="font-semibold text-brand-secondary transition duration-100 ease-linear hover:underline">
        {children}
    </button>
);
