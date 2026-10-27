/** The shared TanStack Query client. */

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Balances change only when the person records something, and every
            // mutation here invalidates what it touched. A minute of staleness
            // keeps navigation instant without ever showing a stale figure.
            staleTime: 60_000,
            retry: (failureCount, error) => {
                // Never retry a refused request: RLS denials and expired
                // sessions fail identically every time.
                const status = (error as { status?: number }).status;
                if (status === 401 || status === 403) return false;
                return failureCount < 2;
            },
            refetchOnWindowFocus: true,
        },
    },
});

/**
 * Query keys in one place, so an invalidation and the query it is meant to
 * clear cannot drift apart.
 */
export const keys = {
    profile: ["profile"] as const,
    preferences: ["preferences"] as const,
    accounts: ["accounts"] as const,
    trashedAccounts: ["accounts", "trash"] as const,
    activity: ["entries", "activity"] as const,
    monthFlows: ["entries", "flows"] as const,
    safeToSpend: ["entries", "safe-to-spend"] as const,
    goals: ["goals"] as const,
    commitments: ["commitments"] as const,
    notifications: ["notifications"] as const,
};
