/**
 * The read side of the app, as hooks.
 *
 * Pages used to pick between a demo constant and an empty array. Now they call
 * one of these and get whatever is actually in the database.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { keys } from "@/lib/query";
import { useAuth } from "@/auth-provider";
import { countTrashedEntries } from "@/services/accounts";
import type { SpendPeriod } from "@/providers";
import { createEntry, deleteEntry, getDashboardSeries, getSafeToSpend, listAccountHistory, listActivity, listMonthFlows } from "@/services/entries";
import { createGoal, listGoals, trashGoal, updateGoal } from "@/services/goals";
import { createCommitment, listCommitments, trashCommitment, updateCommitment } from "@/services/commitments";
import { getProfile, updateProfile } from "@/services/profile";
import { dismiss, listNotifications, markAllRead, markRead } from "@/services/notifications";
import { tracked } from "@/lib/toast";

/** Every query here is meaningless without a session, so they all share this. */
const useEnabled = () => Boolean(useAuth().user);

export const useActivity = (limit = 50) => {
    const enabled = useEnabled();
    return useQuery({ queryKey: [...keys.activity, limit], queryFn: () => listActivity(limit), enabled });
};

export const useMonthFlows = (months = 6) => {
    const enabled = useEnabled();
    return useQuery({ queryKey: [...keys.monthFlows, months], queryFn: () => listMonthFlows(months), enabled });
};

export const useSafeToSpend = (period: SpendPeriod = "daily") => {
    const enabled = useEnabled();
    return useQuery({ queryKey: [...keys.safeToSpend, period], queryFn: () => getSafeToSpend(period), enabled });
};

export const useGoals = () => {
    const enabled = useEnabled();
    return useQuery({ queryKey: keys.goals, queryFn: listGoals, enabled });
};

export const useCommitments = () => {
    const enabled = useEnabled();
    return useQuery({ queryKey: keys.commitments, queryFn: listCommitments, enabled });
};

export const useProfile = () => {
    const enabled = useEnabled();
    return useQuery({ queryKey: keys.profile, queryFn: getProfile, enabled });
};

export const useNotifications = () => {
    const enabled = useEnabled();
    return useQuery({ queryKey: keys.notifications, queryFn: () => listNotifications(), enabled });
};

/* ── the write side ─────────────────────────────────────────────────────── */

/**
 * Recording an entry moves an account balance (via the sync trigger), which
 * changes the totals and the safe-to-spend figure — so the invalidation here is
 * deliberately wide rather than surgical.
 */
export const useRecordEntry = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: tracked(createEntry, { loading: "Recording…", success: "Recorded." }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: keys.activity });
            void queryClient.invalidateQueries({ queryKey: keys.monthFlows });
            void queryClient.invalidateQueries({ queryKey: keys.safeToSpend });
            void queryClient.invalidateQueries({ queryKey: keys.accounts });
        },
    });
};

export const useDeleteEntry = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: tracked(deleteEntry, { loading: "Deleting…", success: "Entry deleted." }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: keys.activity });
            void queryClient.invalidateQueries({ queryKey: keys.monthFlows });
            void queryClient.invalidateQueries({ queryKey: keys.accounts });
        },
    });
};

export const useGoalMutations = () => {
    const queryClient = useQueryClient();
    const refresh = () => void queryClient.invalidateQueries({ queryKey: keys.goals });

    return {
        create: useMutation({ mutationFn: tracked(createGoal, { loading: "Adding goal…", success: "Goal added." }), onSuccess: refresh }),
        update: useMutation({
            mutationFn: tracked(({ id, patch }: { id: string; patch: Parameters<typeof updateGoal>[1] }) => updateGoal(id, patch), { loading: "Saving…", success: "Goal updated." }),
            onSuccess: refresh,
        }),
        remove: useMutation({ mutationFn: tracked(trashGoal, { loading: "Removing…", success: "Goal removed." }), onSuccess: refresh }),
    };
};

export const useCommitmentMutations = () => {
    const queryClient = useQueryClient();
    // Commitments are subtracted from safe-to-spend, so that figure moves too.
    const refresh = () => {
        void queryClient.invalidateQueries({ queryKey: keys.commitments });
        void queryClient.invalidateQueries({ queryKey: keys.safeToSpend });
    };

    return {
        create: useMutation({ mutationFn: tracked(createCommitment, { loading: "Adding bill…", success: "Bill added." }), onSuccess: refresh }),
        update: useMutation({
            mutationFn: tracked(({ id, patch }: { id: string; patch: Parameters<typeof updateCommitment>[1] }) => updateCommitment(id, patch), { loading: "Saving…", success: "Bill updated." }),
            onSuccess: refresh,
        }),
        remove: useMutation({ mutationFn: tracked(trashCommitment, { loading: "Removing…", success: "Bill removed." }), onSuccess: refresh }),
    };
};

export const useProfileMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: tracked(updateProfile, { loading: "Saving…", success: "Saved." }),
        onSuccess: () => void queryClient.invalidateQueries({ queryKey: keys.profile }),
    });
};

export const useNotificationActions = () => {
    const queryClient = useQueryClient();
    const refresh = () => void queryClient.invalidateQueries({ queryKey: keys.notifications });

    return {
        markRead: useMutation({ mutationFn: markRead, onSuccess: refresh }),
        markAllRead: useMutation({ mutationFn: markAllRead, onSuccess: refresh }),
        dismiss: useMutation({ mutationFn: dismiss, onSuccess: refresh }),
    };
};

export const useDashboardSeries = (period: SpendPeriod = "daily", points = 7) => {
    const enabled = useEnabled();
    return useQuery({ queryKey: ["entries", "series", period, points], queryFn: () => getDashboardSeries(period, points), enabled });
};

/** Balance readings for one account — the history modal's only source. */
export const useAccountHistory = (accountId: string | null) => {
    const enabled = useEnabled();
    return useQuery({
        queryKey: [...keys.activity, "account", accountId],
        queryFn: () => listAccountHistory(accountId!),
        enabled: enabled && Boolean(accountId),
    });
};

/** Entry counts for trashed accounts, keyed by account id. */
export const useTrashedEntryCounts = () => {
    const enabled = useEnabled();
    return useQuery({ queryKey: [...keys.trashedAccounts, "entry-counts"], queryFn: countTrashedEntries, enabled });
};
