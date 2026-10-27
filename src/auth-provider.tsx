/**
 * Session state for the whole app.
 *
 * One subscription to `onAuthStateChange` lives here and everything else reads
 * this context, so a token refresh or a sign-out in another tab is reflected
 * everywhere at once.
 */

import { createContext, use, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextValue {
    session: Session | null;
    user: User | null;
    /** True until the first session check settles. */
    loading: boolean;
    /**
     * The app was opened from a password-recovery link. The reset screen is the
     * only thing that should render while this holds — the link grants a real
     * session, so without this flag it would land on the dashboard instead of
     * asking for the new password it was sent for.
     */
    recovering: boolean;
    /** Called once the new password is saved, returning them to normal use. */
    endRecovery: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [recovering, setRecovering] = useState(false);
    const queryClient = useQueryClient();

    useEffect(() => {
        let active = true;

        // The stored session, before any event fires — otherwise a reload
        // flashes the sign-in screen at someone who is already signed in.
        supabase.auth.getSession().then(({ data }) => {
            if (!active) return;
            setSession(data.session);
            setLoading(false);
        });

        const { data: subscription } = supabase.auth.onAuthStateChange((event, next) => {
            if (!active) return;
            setSession(next);
            setLoading(false);

            if (event === "PASSWORD_RECOVERY") setRecovering(true);

            // Cached rows belong to whoever was signed in. Dropping them on the
            // way out stops the next person seeing the last one's balances in
            // the moment before a refetch lands.
            if (event === "SIGNED_OUT") queryClient.clear();
            if (event === "SIGNED_IN") void queryClient.invalidateQueries();
        });

        return () => {
            active = false;
            subscription.subscription.unsubscribe();
        };
    }, [queryClient]);

    const value = useMemo<AuthContextValue>(
        () => ({
            session,
            user: session?.user ?? null,
            loading,
            recovering,
            endRecovery: () => setRecovering(false),
        }),
        [session, loading, recovering],
    );

    return <AuthContext value={value}>{children}</AuthContext>;
};

export const useAuth = () => {
    const ctx = use(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
};
