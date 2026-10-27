/**
 * The database as TypeScript.
 *
 * Hand-written to match supabase/migrations. Regenerate it from a live database
 * with `npm run db:types`, which overwrites this file — so schema changes belong
 * in a migration, never here.
 *
 * Every amount is a whole number of the base currency (RWF). `bigint` columns
 * arrive as `number`: RWF totals stay far inside the safe integer range, so the
 * precision loss that normally makes bigint-as-number a trap cannot bite here.
 */

export type CardTheme = "blue" | "indigo" | "violet" | "plum" | "rose" | "crimson" | "amber" | "emerald" | "teal" | "slate" | "graphite";

export type EntryKind = "income" | "expense" | "balance" | "goal_deposit" | "goal_withdrawal";

export type Pressure = "ok" | "tight" | "over";

export type NotificationKind = "stale_balance" | "bill_due" | "goal_milestone" | "morning_mail";

/** A foreign key, in the shape PostgREST's type checker expects. */
type Relationship = {
    foreignKeyName: string;
    columns: string[];
    isOneToOne?: boolean;
    referencedRelation: string;
    referencedColumns: string[];
};

/**
 * A table's three faces — what comes back, what goes in, what a patch may
 * touch — plus the foreign keys that make embedded selects type-check.
 */
type Table<Row, Insert, Update, Rels extends Relationship[] = []> = {
    Row: Row;
    Insert: Insert;
    Update: Update;
    Relationships: Rels;
};

export type ProfileRow = {
    id: string;
    name: string;
    avatar_url: string | null;
    email_streak: number;
    morning_mail_hour: number;
    morning_mail_enabled: boolean;
    timezone: string;
    created_at: string;
    /** Last morning mail, as a local calendar day. Drives the streak. */
    last_mail_on: string | null;
};

export type AccountRow = {
    id: string;
    user_id: string;
    name: string;
    kind: string;
    ref: string | null;
    balance: number;
    theme: CardTheme;
    balance_updated_at: string;
    created_at: string;
    deleted_at: string | null;
};

export type EntryRow = {
    id: string;
    user_id: string;
    account_id: string | null;
    account_name: string;
    kind: EntryKind;
    name: string;
    note: string | null;
    amount: number;
    balance_after: number | null;
    occurred_at: string;
    created_at: string;
    /** Set only on goal transfers. */
    goal_id: string | null;
};

export type GoalRow = {
    id: string;
    user_id: string;
    name: string;
    saved: number;
    target: number;
    started_at: string;
    reached_at: string | null;
    deleted_at: string | null;
};

export type CommitmentRow = {
    id: string;
    user_id: string;
    name: string;
    amount: number;
    due_on: string;
    pressure: Pressure;
    recurs_monthly: boolean;
    deleted_at: string | null;
};

export type PreferencesRow = {
    user_id: string;
    /** The flat `Preferences` record from providers.tsx, merged over defaults. */
    data: Record<string, unknown>;
    updated_at: string;
};

export type DailySnapshotRow = {
    user_id: string;
    day: string;
    total_balance: number;
    safe_to_spend: number;
    total_saved: number;
};

export type NotificationRow = {
    id: string;
    user_id: string;
    kind: NotificationKind;
    title: string;
    body: string | null;
    read_at: string | null;
    created_at: string;
    subject_id: string | null;
    dedupe_key: string;
};

/** Columns the database fills in for you, so callers never have to. */
type Generated = "id" | "created_at" | "goal_id";

/** `entries.account_id` -> `accounts.id`, the only join the app makes. */
type EntryRelationships = [
    {
        foreignKeyName: "entries_account_id_fkey";
        columns: ["account_id"];
        isOneToOne: false;
        referencedRelation: "accounts";
        referencedColumns: ["id"];
    },
];

export type Database = {
    /** Unlocks the PostgREST 13 surface (`maxAffected`, spread-on-many). */
    __InternalSupabase: { PostgrestVersion: "13.0.5" };
    public: {
        Tables: {
            profiles: Table<ProfileRow, Pick<ProfileRow, "id"> & Partial<ProfileRow>, Partial<ProfileRow>>;
            accounts: Table<
                AccountRow,
                Omit<AccountRow, Generated | "deleted_at" | "balance_updated_at"> & Partial<Pick<AccountRow, "balance_updated_at">>,
                Partial<Omit<AccountRow, "id" | "user_id">>
            >;
            entries: Table<EntryRow, Omit<EntryRow, Generated>, Partial<Omit<EntryRow, "id" | "user_id">>, EntryRelationships>;
            goals: Table<
                GoalRow,
                Omit<GoalRow, "id" | "reached_at" | "deleted_at" | "started_at"> & Partial<Pick<GoalRow, "started_at">>,
                Partial<Omit<GoalRow, "id" | "user_id">>
            >;
            commitments: Table<CommitmentRow, Omit<CommitmentRow, "id" | "deleted_at">, Partial<Omit<CommitmentRow, "id" | "user_id">>>;
            preferences: Table<PreferencesRow, Pick<PreferencesRow, "user_id"> & Partial<PreferencesRow>, Partial<Pick<PreferencesRow, "data">>>;
            notifications: Table<NotificationRow, Omit<NotificationRow, Generated>, Partial<Pick<NotificationRow, "read_at">>>;
            // Read-only to the client; written by the snapshot job.
            daily_snapshots: Table<DailySnapshotRow, never, never>;
        };
        Views: Record<never, never>;
        Functions: {
            month_flows: {
                Args: { n_months?: number };
                Returns: { month: string; total_in: number; total_out: number }[];
            };
            move_goal_money: {
                Args: { p_goal_id: string; p_account_id: string; p_amount: number; p_direction?: string };
                Returns: undefined;
            };
            safe_to_spend: {
                Args: { period?: string };
                Returns: number;
            };
            /** Service-role only: execute is revoked from anon/authenticated. */
            safe_to_spend_for: {
                Args: { uid: string; period?: string };
                Returns: number;
            };
            dashboard_series: {
                Args: { period?: string; points?: number };
                Returns: { bucket: string; total_balance: number; safe_to_spend: number; total_saved: number; spent: number }[];
            };
        };
        Enums: {
            card_theme: CardTheme;
            entry_kind: EntryKind;
            pressure: Pressure;
            notification_kind: NotificationKind;
        };
    };
}
