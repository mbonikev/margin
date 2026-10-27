/**
 * The bell.
 *
 * Rows are raised by the `build-notifications` Edge Function, never by the
 * client — RLS allows read, mark-read and dismiss only. The icon is chosen here
 * because a React component cannot live in a database row.
 */

import { HiOutlineBanknotes, HiOutlineBell, HiOutlineEnvelope, HiOutlineFlag } from "react-icons/hi2";
import { supabase } from "@/lib/supabase";
import type { NotificationKind, NotificationRow } from "@/lib/database.types";
import type { NotificationItem } from "@/components/shell";
import type { BadgeTone } from "@/components/shell";

/** Each rule's look, keyed by the kind the generator stamped on the row. */
const presentation: Record<NotificationKind, { icon: NotificationItem["icon"]; tone: BadgeTone }> = {
    stale_balance: { icon: HiOutlineBanknotes, tone: "caution" },
    bill_due: { icon: HiOutlineBell, tone: "brand" },
    goal_milestone: { icon: HiOutlineFlag, tone: "info" },
    morning_mail: { icon: HiOutlineEnvelope, tone: "info" },
};

/** "2h ago" — relative, because the bell is only ever about the recent past. */
const ago = (iso: string): string => {
    const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86_400)}d ago`;
};

const toItem = (row: NotificationRow): NotificationItem => ({
    id: row.id,
    title: row.title,
    body: row.body ?? undefined,
    time: ago(row.created_at),
    unread: row.read_at === null,
    ...presentation[row.kind],
});

export const listNotifications = async (limit = 20): Promise<NotificationItem[]> => {
    const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data.map(toItem);
};

export const markRead = async (id: string): Promise<void> => {
    const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
};

export const markAllRead = async (): Promise<void> => {
    const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
    if (error) throw error;
};

export const dismiss = async (id: string): Promise<void> => {
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) throw error;
};
