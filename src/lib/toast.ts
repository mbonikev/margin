/**
 * Toasts for every write the app makes.
 *
 * Reads stay silent — a toast for something the person did not ask for is
 * noise. Writes get one, because a mutation that changes a row somewhere else
 * on the page is otherwise invisible.
 *
 * Styling is deferred to `<Toaster>` in main.tsx so the shapes and colours live
 * with the rest of the theme rather than being repeated at every call site.
 */

import toast from "react-hot-toast";
import { describeError } from "@/lib/supabase";

/**
 * The floor on how quickly a write may appear to finish.
 *
 * A round trip to Postgres can land in well under 100ms, and a toast that
 * flashes straight to "Done" reads as nothing having happened at all — the
 * person is left unsure whether they actually pressed anything. Holding the
 * pending state briefly makes the work legible. Short enough that it never
 * feels like waiting.
 */
const MIN_PENDING_MS = 450;

const atLeast = async <T>(promise: Promise<T>, ms: number): Promise<T> => {
    // Failures are exempt: an error should surface as soon as it is known.
    const [result] = await Promise.all([promise, new Promise((resolve) => setTimeout(resolve, ms))]);
    return result;
};

export const notify = {
    success: (message: string) => toast.success(message),
    error: (message: string) => toast.error(message),

    /**
     * One toast that moves from spinner to tick or cross, rather than a result
     * appearing from nowhere.
     */
    promise: <T>(promise: Promise<T>, messages: { loading: string; success: string; error?: string }) =>
        toast.promise(atLeast(promise, MIN_PENDING_MS), {
            loading: messages.loading,
            success: messages.success,
            // The thrown error usually says more than a fixed string can.
            error: (cause: unknown) => describeError(cause) || messages.error || "Something went wrong.",
        }),

    dismiss: () => toast.dismiss(),
};

/**
 * Wraps a mutation function so calling it reports itself.
 *
 * Applied at the hook rather than the call site, so a screen that reuses an
 * existing mutation cannot forget to show progress, and the wording for a given
 * action stays the same wherever it is triggered from.
 */
export const tracked =
    <TArgs extends unknown[], TResult>(fn: (...args: TArgs) => Promise<TResult>, messages: { loading: string; success: string }) =>
    (...args: TArgs): Promise<TResult> =>
        notify.promise(fn(...args), messages);
