/**
 * Who may see which routes.
 *
 * Both guards wait for `loading` to settle before deciding. Redirecting while
 * the stored session is still being read would bounce a signed-in person to the
 * sign-in screen on every refresh.
 */

import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/auth-provider";
import { Logo, Spinner } from "@/components/ui";

/** Shown only for the moment the session check takes. */
const Checking = () => (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-secondary">
        <Logo className="h-8" />
        <Spinner className="size-5 text-quaternary" />
        <span className="sr-only">Loading</span>
    </main>
);

export const RequireAuth = () => {
    const { user, loading, recovering } = useAuth();
    const location = useLocation();

    if (loading) return <Checking />;
    // `state` remembers where they were headed so sign-in can finish the trip.
    if (!user) return <Navigate to="/signin" replace state={{ from: location }} />;
    // A recovery link signs them in for real, so the session alone would let
    // them straight into the app with the password they have forgotten still
    // set. Finishing the reset is the only thing on offer until it is done.
    if (recovering) return <Navigate to="/reset-password" replace />;
    return <Outlet />;
};

/** Keeps a signed-in person off the sign-in and sign-up screens. */
export const RequireAnon = () => {
    const { user, loading, recovering } = useAuth();

    if (loading) return <Checking />;
    if (recovering) return <Navigate to="/reset-password" replace />;
    if (user) return <Navigate to="/" replace />;
    return <Outlet />;
};

/**
 * The reset screen sits outside both guards: it needs the session the recovery
 * link created, which makes it neither anonymous nor ordinary use.
 */
export const RequireRecovery = () => {
    const { user, loading } = useAuth();

    if (loading) return <Checking />;
    // No session means the link expired, was already used, or was never
    // followed — there is nothing to reset, so start again.
    if (!user) return <Navigate to="/forgot-password" replace />;
    return <Outlet />;
};
