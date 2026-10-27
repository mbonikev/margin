/**
 * Accounts, as the UI already understands them.
 *
 * The mapping layer exists so the database can use honest column names and
 * timestamps while `Account` in components/accounts.tsx keeps the shape every
 * screen is already written against.
 */

import { supabase } from "@/lib/supabase";
import type { AccountRow } from "@/lib/database.types";
import type { Account, CardTheme } from "@/components/accounts";

export interface TrashedAccount extends Account {
    deletedAt: number;
}

/**
 * "Updated today" / "Updated 2d ago". The database stores the instant and this
 * derives the label, so it can never go stale sitting in a row the way a stored
 * string would.
 */
export const freshness = (iso: string): string => {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
    if (days <= 0) return "Updated today";
    if (days === 1) return "Updated yesterday";
    if (days < 30) return `Updated ${days}d ago`;
    const months = Math.floor(days / 30);
    return `Updated ${months}mo ago`;
};

const toAccount = (row: AccountRow): Account => ({
    id: row.id,
    name: row.name,
    kind: row.kind,
    ref: row.ref ?? undefined,
    balance: row.balance,
    updated: freshness(row.balance_updated_at),
    theme: row.theme,
});

export const listAccounts = async (): Promise<Account[]> => {
    const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: true });

    if (error) throw error;
    return data.map(toAccount);
};

export const listTrashedAccounts = async (): Promise<TrashedAccount[]> => {
    const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .not("deleted_at", "is", null)
        // Most recently deleted first, so the thing just removed is at the top.
        .order("deleted_at", { ascending: false });

    if (error) throw error;
    return data.map((row) => ({ ...toAccount(row), deletedAt: new Date(row.deleted_at!).getTime() }));
};

export const createAccount = async (input: { name: string; kind: string; balance: number; theme: CardTheme; ref?: string }): Promise<Account> => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error("Not signed in.");

    const { data, error } = await supabase
        .from("accounts")
        .insert({
            user_id: auth.user.id,
            name: input.name,
            kind: input.kind,
            balance: input.balance,
            theme: input.theme,
            ref: input.ref ?? null,
        })
        .select()
        .single();

    if (error) throw error;
    return toAccount(data);
};

export const updateAccount = async (id: string, patch: Partial<Account>): Promise<Account> => {
    const { data, error } = await supabase
        .from("accounts")
        .update({
            ...(patch.name !== undefined && { name: patch.name }),
            ...(patch.kind !== undefined && { kind: patch.kind }),
            ...(patch.theme !== undefined && { theme: patch.theme }),
            ...(patch.ref !== undefined && { ref: patch.ref }),
            // Editing the balance by hand is a fresh reading of it, so the
            // staleness clock restarts. Renaming the account does not touch it.
            ...(patch.balance !== undefined && { balance: patch.balance, balance_updated_at: new Date().toISOString() }),
        })
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;
    return toAccount(data);
};

/** Soft delete — recoverable from the trash until it is purged. */
export const trashAccount = async (id: string): Promise<void> => {
    const { error } = await supabase.from("accounts").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
};

export const restoreAccount = async (id: string): Promise<void> => {
    const { error } = await supabase.from("accounts").update({ deleted_at: null }).eq("id", id);
    if (error) throw error;
};

/** Permanent. Entries keep their denormalised account name and survive this. */
export const purgeAccount = async (id: string): Promise<void> => {
    const { error } = await supabase.from("accounts").delete().eq("id", id);
    if (error) throw error;
};
