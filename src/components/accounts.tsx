/** The account card itself, the carousel around it, and every modal that edits one. */

import { getLocalTimeZone, today } from "@internationalized/date";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Button as AriaButton } from "react-aria-components";
import type { DateValue } from "react-aria-components";
import { HiOutlineArrowTrendingDown, HiOutlineArrowTrendingUp, HiOutlineArrowUturnLeft, HiOutlineChevronDown, HiOutlineClock, HiOutlineCog6Tooth, HiOutlinePlus, HiOutlineScale, HiOutlineTrash } from "react-icons/hi2";
import { DatePicker } from "@/components/base/date-picker";
import { Dropdown } from "@/components/base/dropdown";
import { Select } from "@/components/base/select";
import { ActionButton } from "@/components/ui";
import { NoAccountsArt } from "@/components/illustrations";
import { Amount } from "@/components/ui";
import { Card } from "@/components/ui";
import { AmountField, Field, ModalActions, TextField } from "@/components/ui";
import { Logo } from "@/components/ui";
import { Modal } from "@/components/ui";
import { Spinner } from "@/components/ui";
import { useAccountHistory, useCommitmentMutations, useGoalMutations, useRecordEntry } from "@/hooks/use-data";
import { useAccounts, useCurrency, usePreferences } from "@/providers";
import { cx } from "@/utils";

/* ── account-card.tsx ── */

export type CardTheme = "blue" | "indigo" | "violet" | "plum" | "rose" | "crimson" | "amber" | "emerald" | "teal" | "slate" | "graphite";

/** Flat, saturated card stock. Fixed art — people learn an account by its colour,
 *  so this deliberately ignores the selected accent. */
const themes: Record<CardTheme, string> = {
    blue: "bg-[#2c5fe0]",
    indigo: "bg-[#3b3a9e]",
    violet: "bg-[#5b3a9e]",
    plum: "bg-[#7a3f70]",
    rose: "bg-[#a13058]",
    crimson: "bg-[#a8322f]",
    amber: "bg-[#9a6016]",
    emerald: "bg-[#13795a]",
    teal: "bg-[#0f6670]",
    slate: "bg-[#3f4a57]",
    graphite: "bg-[#22262a]",
};

/** Ordered for the picker — the swatch row reads as a spectrum. */
export const cardThemes = Object.keys(themes) as CardTheme[];

export const cardThemeClass = (theme: CardTheme) => themes[theme];

export interface Account {
    id: string;
    name: string;
    kind: string;
    /** Margin's own reference for the account. Generated from the id if absent. */
    ref?: string;
    /** Balance in the base currency. */
    balance: number;
    updated: string;
    theme: CardTheme;
}

/**
 * A reference Margin issues itself — not a card or wallet number. It needs no
 * input from the user, carries nothing sensitive, and so needs no masking.
 */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford-style: no I, L, O or U to misread

export const accountRef = (id: string) => {
    // FNV-1a, then a linear congruential step per character — padding a single
    // hash instead gives short ids a run of leading zeros.
    let hash = 2166136261;
    for (let index = 0; index < id.length; index++) {
        hash ^= id.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }

    // xorshift32, reading the TOP 5 bits. A linear congruential generator's low
    // bits depend only on the previous low bits, so `state % 32` collides for any
    // two ids whose hash shares its last 5 bits.
    let state = hash >>> 0 || 1;
    let code = "";
    for (let index = 0; index < 8; index++) {
        state ^= state << 13;
        state >>>= 0;
        state ^= state >>> 17;
        state ^= state << 5;
        state >>>= 0;
        code += ALPHABET[state >>> 27];
    }

    return `MGN ${code.slice(0, 4)} ${code.slice(4)}`;
};

const Chip = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 34 26" fill="none" className={className} aria-hidden="true">
        <rect width="34" height="26" rx="5" fill="currentColor" opacity="0.9" />
        <path d="M12 0v26M23 0v26M0 9h34M0 17h34" stroke="#000" strokeOpacity="0.18" strokeWidth="1.5" />
    </svg>
);

const Contactless = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className={className} aria-hidden="true">
        <path d="M6 8.5a6 6 0 0 1 0 7M10 6a10 10 0 0 1 0 12M14 3.5a14 14 0 0 1 0 17" />
    </svg>
);

/**
 * A specular sweep that runs once when the card mounts — which, because the hero
 * keys the card on the account id, means once per swap. Two stops rather than
 * one: a wide soft wash for the body of the highlight and a narrow bright core,
 * which is what separates "metal catching light" from "a white bar sliding past".
 */
const Sheen = () => {
    const reduceMotion = useReducedMotion();
    const { preferences } = usePreferences();
    if (reduceMotion || !preferences.cardSheen) return null;

    return (
        <motion.span
            aria-hidden="true"
            initial={{ x: "-55%" }}
            animate={{ x: "190%" }}
            transition={{ duration: 1.3, ease: [0.4, 0, 0.3, 1], delay: 0.05 }}
            className="pointer-events-none absolute inset-y-0 left-0 w-1/2 -skew-x-12 bg-[linear-gradient(100deg,transparent_0%,rgba(255,255,255,0.06)_30%,rgba(255,255,255,0.32)_50%,rgba(255,255,255,0.06)_70%,transparent_100%)] mix-blend-overlay"
        />
    );
};

/** The soft tonal shapes that keep the card from reading as a flat rectangle. */
const Blobs = () => (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute -top-12 -right-10 size-56 rounded-full bg-white/8" />
        <span className="absolute -right-20 -bottom-24 size-64 rounded-full bg-white/6" />
        <span className="absolute top-1/3 -right-4 size-24 rounded-full bg-white/5" />
    </span>
);

export const AccountCard = ({ account, className }: { account: Account; className?: string }) => {
    const reference = account.ref ?? accountRef(account.id);
    // A colour change is applied optimistically nowhere — the card only
    // repaints once the write lands, so without this the card sits in the old
    // colour and the modal closes, and the change looks like it was ignored.
    const { pendingId } = useAccounts();
    const isSaving = pendingId === account.id;
    const { formatExact } = useCurrency();
    const { preferences } = usePreferences();
    const [copied, setCopied] = useState<string | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const copy = useCallback(async (label: string, value: string) => {
        try {
            await navigator.clipboard.writeText(value);
        } catch {
            return; // denied or insecure context — say nothing rather than lie
        }

        setCopied(label);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(null), 1600);
    }, []);

    return (
    <div
        aria-busy={isSaving || undefined}
        className={cx([
                "relative flex size-full flex-col justify-between overflow-hidden rounded-[1.35rem] p-[1.125rem] text-white",
                // Settling rather than fading: the card dips slightly and loses
                // a little colour while the write is in flight, then springs
                // back as the new theme paints. Reads as the change landing,
                // where a plain opacity drop reads as the card being disabled.
                "transition-[opacity,transform,filter] duration-300 ease-out",
                isSaving && "scale-[0.985] opacity-70 saturate-[0.85] motion-reduce:transform-none",
                // Depth, in three parts: a tight contact shadow, two wide soft ones
                // for the cast, and inset edges so the top catches light and the
                // bottom falls into shadow — what makes it read as a solid object.
                "shadow-[0_1px_2px_rgba(0,0,0,0.10),0_8px_16px_-8px_rgba(0,0,0,0.24),0_18px_36px_-20px_rgba(0,0,0,0.18)]",
                "inset-shadow-[0_1px_0_rgba(255,255,255,0.22),0_-1px_0_rgba(0,0,0,0.28)]",
            ], themes[account.theme], className)}>
        <Blobs />
        <Sheen />

        {isSaving && (
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                <Spinner className="size-6 text-white/90" />
            </span>
        )}

        {/* Light falling from above, so the surface isn't uniformly flat. */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/14 via-transparent to-black/18" />

        <div className="relative flex items-center gap-2">
            <Logo variant="mark" className="h-[1.35rem] bg-white" />
            <span className="text-white/40">/</span>
            <button
                type="button"
                onClick={() => copy("Card type", account.kind)}
                title="Copy card type"
                className="no-press -mx-1.5 rounded-lg px-1.5 py-0.5 text-[0.7875rem] font-medium transition duration-100 ease-linear hover:bg-white/12"
            >
                {account.kind}
            </button>
        </div>

        <div className="relative mt-4 flex items-center gap-3">
            <Contactless className="size-[1.625rem] text-white/80" />
            <Chip className="h-[1.625rem] w-[2.17rem] text-white/85" />
        </div>

        {/* Not font-mono: the generic monospace fallback reads thin and dead.
            The display face with tabular figures gives the chunky card look. */}
        <button
            type="button"
            onClick={() => copy("Account name", account.name)}
            title="Copy account name"
            className="no-press relative -mx-2 mb-[0.45rem] w-fit max-w-full truncate rounded-xl px-2 py-1 text-left text-[1.125rem] font-semibold tracking-tight text-white transition duration-100 ease-linear hover:bg-white/12 md:mb-[0.675rem] md:text-[1.35rem]"
        >
            {account.name}
        </button>

        <AnimatePresence>
            {copied && (
                <motion.span
                    key={copied}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="pointer-events-none absolute inset-x-0 bottom-3 z-10 mx-auto w-fit rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm"
                >
                    {copied} copied
                </motion.span>
            )}
        </AnimatePresence>

        <div className="relative flex items-end justify-between gap-3">
            {/* flex-1, not just min-w-0: without it this block shrinks below its
                content to make room for the date, and the balance truncates. */}
            <div className="min-w-0 flex-1">
                {preferences.showCardRef && (
                    <button
                        type="button"
                        onClick={() => copy("Card ID", reference)}
                        title="Copy card ID"
                        className="no-press -mx-1.5 block max-w-full truncate rounded-lg px-1.5 py-0.5 text-left text-[0.7875rem] font-medium tracking-[0.08em] tabular-nums text-white/75 transition duration-100 ease-linear hover:bg-white/12 hover:text-white"
                    >
                        {reference}
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => copy("Balance", formatExact(account.balance))}
                    title="Copy balance"
                    className="no-press -mx-1.5 block max-w-full rounded-lg px-1.5 py-0.5 text-left transition duration-100 ease-linear hover:bg-white/12"
                >
                    <Amount value={account.balance} compactSymbol className="mt-0.5 block truncate text-[1.6rem] font-semibold tracking-tight" />
                </button>
            </div>
            <p className="shrink-0 text-[0.7875rem] font-medium text-white/70">{account.updated}</p>
        </div>
    </div>
    );
};

/** The small switchable version shown beside the hero. */
export const AccountThumb = ({ account, isActive, onSelect }: { account: Account; isActive: boolean; onSelect: () => void }) => (
    <button
        type="button"
        onClick={onSelect}
        aria-label={account.name}
        aria-pressed={isActive}
        className={cx(
            "relative aspect-[1.586/1] w-16 shrink-0 overflow-hidden rounded-xl shadow-xs transition duration-100 ease-linear md:w-20",
            themes[account.theme],
            isActive ? "opacity-100" : "opacity-50 hover:opacity-80",
        )}
    >
        <span className="absolute -top-4 -right-3 size-16 rounded-full bg-white/8" />
        <span className="absolute bottom-1.5 left-2 text-[10px] font-semibold tabular-nums text-white/85">{(account.ref ?? accountRef(account.id)).slice(-4)}</span>
    </button>
);

/* ── card-theme-picker.tsx ── */

/** Shared so creating an account and editing one offer the same choice. */
export const CardThemePicker = ({ value, onChange }: { value: CardTheme; onChange: (theme: CardTheme) => void }) => (
    <span className="mt-1.5 flex flex-wrap gap-2">
        {cardThemes.map((theme) => (
            <button
                key={theme}
                type="button"
                aria-label={theme}
                aria-pressed={value === theme}
                onClick={() => onChange(theme)}
                className={cx(
                    "size-8 rounded-full transition duration-100 ease-linear",
                    cardThemeClass(theme),
                    value === theme ? "ring-2 ring-brand ring-offset-2 ring-offset-popover" : "opacity-70 hover:opacity-100",
                )}
            />
        ))}
    </span>
);

/* ── account-detail-modal.tsx ── */

/** The last few balance readings for one account. */
export const AccountHistoryModal = ({ isOpen, onOpenChange, account }: { isOpen: boolean; onOpenChange: (open: boolean) => void; account: Account }) => {
    // Only fetched while the modal is open: this is a per-account query and
    // there is no reason to run one for every card on the page.
    const { data: readings, isPending } = useAccountHistory(isOpen ? account.id : null);

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} label={`${account.name} history`} className="max-w-2xl">
            <div className="flex max-h-[85vh] flex-col gap-4 p-5">
                <div className="shrink-0">
                    <h2 className="text-lg font-semibold tracking-tight text-primary">History</h2>
                    <p className="mt-0.5 text-sm text-tertiary">
                        Balance readings for {account.name}
                        {readings && readings.length > 0 && ` · ${readings.length} recorded`}.
                    </p>
                </div>

                {isPending && (
                    <div className="flex justify-center py-8">
                        <Spinner className="size-5 text-quaternary" />
                    </div>
                )}

                {!isPending && (readings?.length ?? 0) === 0 && (
                    <p className="py-8 text-center text-sm text-tertiary">No readings yet. Update this balance and the first one lands here.</p>
                )}

                {!isPending && (readings?.length ?? 0) > 0 && (
                    // `-mx-2 px-2` so the scrollbar sits outside the rows rather
                    // than clipping their padding.
                    <ul className="-mx-2 flex min-h-0 flex-1 flex-col overflow-y-auto px-2">
                        {readings!.map((reading, index) => {
                            // The row below is the previous reading, so the delta
                            // is what changed between the two.
                            const previous = readings![index + 1];
                            const delta = previous ? reading.amount - previous.amount : 0;

                            return (
                                <li key={reading.id} className="flex items-center justify-between gap-3 px-2 py-2.5">
                                    <span className="text-sm text-tertiary">{reading.label}</span>
                                    <span className="flex items-baseline gap-2">
                                        <Amount value={reading.amount} className="text-sm font-semibold text-primary" />
                                        {previous && delta !== 0 && (
                                            <span className={delta < 0 ? "text-xs text-negative-ink" : "text-xs text-positive-ink"}>
                                                {delta < 0 ? "−" : "+"}
                                                {Math.abs(delta).toLocaleString()}
                                            </span>
                                        )}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                )}

                <div className="shrink-0">
                    <ModalActions onCancel={() => onOpenChange(false)} onConfirm={() => onOpenChange(false)} confirmLabel="Done" />
                </div>
            </div>
        </Modal>
    );
};

interface AccountSettingsModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    account: Account;
    /** Omitted where there is nowhere to restore from — the delete row is then hidden. */
    onDelete?: () => void;
    onSave?: (patch: { name: string; kind: string; theme: CardTheme }) => void;
}

export const AccountSettingsModal = ({ isOpen, onOpenChange, account, onDelete, onSave }: AccountSettingsModalProps) => {
    const [theme, setTheme] = useState<CardTheme>(account.theme);
    const [kind, setKind] = useState(account.kind);
    const [name, setName] = useState(account.name);

    // The hero keeps this mounted and swaps the account under it, so the fields
    // have to be re-seeded each time it opens or you would edit the last one.
    useEffect(() => {
        if (!isOpen) return;
        setName(account.name);
        setKind(account.kind);
        setTheme(account.theme);
    }, [isOpen, account.name, account.kind, account.theme]);
    const { preferences } = usePreferences();
    // One tap when confirmation is off, two when it's on — the ask happens in
    // the button itself rather than stacking a dialog on top of this one.
    const [confirmingDelete, setConfirmingDelete] = useState(false);

    // The card as it would look if saved. Rendering the real AccountCard rather
    // than a swatch means the colour is shown where it actually matters — the
    // themes differ far more as a full card than as a 28px circle.
    const previewAccount: Account = { ...account, name: name.trim() || account.name, kind, theme };

    return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} label={`${account.name} settings`} className="max-w-4xl">
        <div className="flex max-h-[85vh] flex-col gap-5 overflow-y-auto p-5 lg:flex-row lg:gap-6">
            {/* Above the form on a phone, beside it from `sm` up — so the card
                is the first thing seen on mobile rather than scrolled past. */}
            <div className="shrink-0 lg:w-96">
                <span className="mb-1.5 block text-xs font-medium text-tertiary">Preview</span>
                {/* No scaling: the column is now as wide as the card is on the
                    dashboard, so it renders at its natural size. Scaling was
                    only ever a way to fit fixed-size type into a smaller box,
                    and it shrank that type along with everything else.
                    1.55 rather than 1.6 gives the content the same height it
                    has on the dashboard, where nothing clips. */}
                <div className="aspect-[1.55/1] w-full max-w-sm lg:max-w-none lg:sticky lg:top-0">
                    <AccountCard account={previewAccount} />
                </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div>
                <h2 className="text-lg font-semibold tracking-tight text-primary">Account settings</h2>
                <p className="mt-0.5 text-sm text-tertiary">How {account.name} appears in Margin.</p>
            </div>

            <Field label="Name">
                <TextField value={name} onChange={(event) => setName(event.target.value)} />
            </Field>

            <KindField value={kind} onChange={setKind} />

            <Field label="Card colour" hint="Accounts are easiest to recognise by colour.">
                <CardThemePicker value={theme} onChange={setTheme} />
            </Field>

            {/* `mt-auto` rather than a fixed margin: the two columns stretch to
                the same height, so this pins the actions to the bottom of the
                form and lets whatever is left over become the gap. The minimum
                keeps them off the colour swatches when the form is the taller
                of the two. */}
            <ModalActions
                className="mt-auto pt-8"
                onCancel={() => onOpenChange(false)}
                onConfirm={() => {
                    onSave?.({ name: name.trim() || account.name, kind, theme });
                    onOpenChange(false);
                }}
                confirmLabel="Save changes"
                leading={
                    onDelete && (
                        <button
                            type="button"
                            onClick={() => {
                                if (preferences.confirmDelete && !confirmingDelete) {
                                    setConfirmingDelete(true);
                                    return;
                                }

                                onDelete();
                                onOpenChange(false);
                            }}
                            onBlur={() => setConfirmingDelete(false)}
                            title="Moved to the trash — restore it any time"
                            className={cx(
                                "flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition duration-100 ease-linear",
                                confirmingDelete ? "bg-negative-tint text-negative-ink" : "text-tertiary hover:bg-negative-tint hover:text-negative-ink",
                            )}
                        >
                            <HiOutlineTrash className="size-4.5 shrink-0" />
                            {confirmingDelete ? "Move to trash?" : "Delete"}
                        </button>
                    )
                }
            />
            </div>
        </div>
    </Modal>
);
};

/* ── add-account-modal.tsx ── */

/** The id of the row that turns the picker into a text field. */
const NEW_KIND = "__new";

/**
 * Type picker with a way out: the list is the user's own, and the last row opens
 * an input instead of selecting. A type the account already has is always
 * offered, even if it has since been deleted from the list — otherwise editing
 * an old account would silently change its type.
 */
const KindField = ({ value, onChange }: { value: string; onChange: (next: string) => void }) => {
    const { preferences, set } = usePreferences();
    const [adding, setAdding] = useState(false);
    const [draft, setDraft] = useState("");

    const kinds = preferences.accountKinds.includes(value) || !value ? preferences.accountKinds : [...preferences.accountKinds, value];
    const items = [...kinds.map((kind) => ({ id: kind, label: kind })), { id: NEW_KIND, label: "+ New type…" }];

    const commit = () => {
        const next = draft.trim();
        if (next) {
            if (!preferences.accountKinds.includes(next)) set("accountKinds", [...preferences.accountKinds, next]);
            onChange(next);
        }
        setDraft("");
        setAdding(false);
    };

    if (adding) {
        return (
            <Field label="New type" hint="Added to your list, so it's there next time.">
                <div className="flex items-center gap-2">
                    <TextField
                        autoFocus
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.preventDefault();
                                commit();
                            }
                            if (event.key === "Escape") setAdding(false);
                        }}
                        placeholder="Crypto, SACCO, piggy bank…"
                    />
                    <ActionButton onClick={commit} className="mt-1.5 shrink-0 bg-brand-primary text-brand-secondary">
                        Add
                    </ActionButton>
                </div>
            </Field>
        );
    }

    return (
        <Select
            label="Type"
            selectedKey={value}
            onSelectionChange={(key) => (String(key) === NEW_KIND ? setAdding(true) : onChange(String(key)))}
            items={items}
        >
            {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
        </Select>
    );
};

interface AddAccountModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSave?: (account: { name: string; kind: string; balance: number; theme: CardTheme }) => void;
}

export const AddAccountModal = ({ isOpen, onOpenChange, onSave }: AddAccountModalProps) => {
    const { currency, toBase } = useCurrency();
    const { preferences } = usePreferences();
    const [name, setName] = useState("");
    const [kind, setKind] = useState(preferences.accountKinds[0] ?? "");
    const [balance, setBalance] = useState("");
    const [theme, setTheme] = useState<CardTheme>("blue");

    useEffect(() => {
        if (!isOpen) return;
        setName("");
        setKind(preferences.accountKinds[0] ?? "");
        setBalance("");
        setTheme("blue");
    }, [isOpen, preferences.accountKinds]);

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} label="Add account">
            <div className="flex flex-col gap-4 p-5">
                <div>
                    <h2 className="text-lg font-semibold tracking-tight text-primary">Add account</h2>
                    <p className="mt-0.5 text-sm text-tertiary">A wallet, a bank account, or the cash in your pocket.</p>
                </div>

                <Field label="Name">
                    <TextField value={name} onChange={(event) => setName(event.target.value)} placeholder="MTN MoMo" />
                </Field>

                <KindField value={kind} onChange={setKind} />

                <Field label="Balance right now" hint="You can change this any time — that's the whole idea.">
                    <AmountField symbol={currency.symbol} value={balance} onValueChange={setBalance} />
                </Field>

                <Field label="Card colour">
                    <CardThemePicker value={theme} onChange={setTheme} />
                </Field>

                <ModalActions
                    onCancel={() => onOpenChange(false)}
                    confirmLabel="Add account"
                    onConfirm={() => {
                        // The field is labelled with the display currency's
                        // symbol, so the number typed into it is in that
                        // currency. Balances are stored in the base one.
                        onSave?.({ name, kind, balance: Math.round(toBase(Number(balance || 0))), theme });
                        onOpenChange(false);
                    }}
                />
            </div>
        </Modal>
    );
};

/* ── update-balance-modal.tsx ── */

interface UpdateBalanceModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    account: Account;
}

const digitsOnly = (value: string) => value.replace(/[^\d]/g, "");

/**
 * Saving records a `balance` entry rather than writing the account directly.
 *
 * The entry is the fact — "on this date it read this much" — and the trigger
 * derives the account's balance from the newest one. Writing the account would
 * leave the history and the card able to disagree.
 *
 * The mutation lives here rather than behind a prop: it used to take an
 * optional `onSave`, and all three call sites omitted it, so the button closed
 * the modal and saved nothing.
 */
export const UpdateBalanceModal = ({ isOpen, onOpenChange, account }: UpdateBalanceModalProps) => {
    const { currency, convert, toBase } = useCurrency();
    const record = useRecordEntry();
    const [raw, setRaw] = useState("");

    // Start from the current figure each time it opens, so the common case —
    // "it barely moved" — is an edit rather than retyping from scratch.
    useEffect(() => {
        if (isOpen) setRaw(String(Math.round(convert(account.balance))));
    }, [isOpen, account.balance, convert]);

    const entered = Number(digitsOnly(raw) || 0);
    const current = Math.round(convert(account.balance));
    const delta = entered - current;
    const unchanged = delta === 0;
    const down = delta < 0;

    const formatted = useMemo(() => (digitsOnly(raw) ? Number(digitsOnly(raw)).toLocaleString() : ""), [raw]);

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} label="Update balance">
            <div className="flex flex-col gap-5 p-5">
                <div>
                    <h2 className="text-lg font-semibold tracking-tight text-primary">Update balance</h2>
                    <p className="mt-0.5 text-sm text-tertiary">
                        What does {account.name} say right now?
                    </p>
                </div>

                <label className="block">
                    <span className="text-xs font-medium text-tertiary">New balance</span>

                    <span className="mt-1.5 flex items-center gap-2 rounded-2xl bg-secondary px-4 py-3">
                        <span className="shrink-0 text-lg font-medium text-tertiary">{currency.symbol}</span>
                        <input
                            autoFocus
                            inputMode="numeric"
                            value={formatted}
                            onChange={(event) => setRaw(digitsOnly(event.target.value))}
                            placeholder="0"
                            className="w-full min-w-0 bg-transparent text-2xl font-semibold tracking-tight tabular-nums text-primary outline-hidden placeholder:text-quaternary"
                        />
                    </span>
                </label>

                {/* The delta is the whole point — it is what the app computes for you. */}
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-secondary px-4 py-3">
                    <span className="text-xs text-tertiary">
                        Was <Amount value={account.balance} /> · {account.updated.toLowerCase()}
                    </span>

                    {unchanged ? (
                        <span className="shrink-0 text-xs font-medium text-tertiary">No change</span>
                    ) : (
                        <span
                            className={cx(
                                "flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
                                down ? "bg-negative-tint text-negative-ink" : "bg-positive-tint text-positive-ink",
                            )}
                        >
                            {down ? <HiOutlineArrowTrendingDown className="size-3.5" /> : <HiOutlineArrowTrendingUp className="size-3.5" />}
                            {Math.abs(delta).toLocaleString()}
                        </span>
                    )}
                </div>

                <div className="flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="h-10 rounded-full px-4 text-sm font-medium text-tertiary transition duration-100 ease-linear hover:bg-secondary"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        disabled={unchanged || record.isPending}
                        onClick={() => {
                            // `entered` is in the display currency; balances are
                            // stored in the base one, so it converts back before
                            // it is written.
                            const balance = Math.round(toBase(entered));
                            record.mutate(
                                {
                                    accountId: account.id,
                                    accountName: account.name,
                                    kind: "balance",
                                    name: "Balance updated",
                                    amount: balance,
                                    balanceAfter: balance,
                                },
                                { onSuccess: () => onOpenChange(false) },
                            );
                        }}
                        className="h-10 rounded-full bg-brand-solid px-5 text-sm font-semibold text-white transition duration-100 ease-linear hover:bg-brand-solid_hover disabled:pointer-events-none disabled:opacity-40"
                    >
                        {record.isPending ? "Saving…" : "Save balance"}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

/* ── record-modal.tsx ── */

export type RecordKind = "expense" | "income" | "commitment" | "goal";

const copy: Record<RecordKind, { title: string; blurb: string; nameLabel: string; namePlaceholder: string; amountLabel: string; confirm: string }> = {
    expense: { title: "Add expense", blurb: "Something you spent.", nameLabel: "What was it?", namePlaceholder: "Groceries", amountLabel: "Amount", confirm: "Add expense" },
    income: { title: "Add income", blurb: "Money that came in.", nameLabel: "Where from?", namePlaceholder: "Client payment", amountLabel: "Amount", confirm: "Add income" },
    commitment: { title: "Add recurring bill", blurb: "Something that repeats every month.", nameLabel: "What is it?", namePlaceholder: "Rent", amountLabel: "Amount each month", confirm: "Add bill" },
    goal: { title: "New savings goal", blurb: "Something you're putting money aside for.", nameLabel: "What are you saving for?", namePlaceholder: "Laptop", amountLabel: "Target", confirm: "Create goal" },
};

interface RecordModalProps {
    kind: RecordKind;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    accounts: Account[];
    /** Offered when there are no accounts to record against. */
    onAddAccount?: () => void;
}

export const RecordModal = ({ kind, isOpen, onOpenChange, accounts, onAddAccount }: RecordModalProps) => {
    const { currency, toBase } = useCurrency();
    const record = useRecordEntry();
    const goals = useGoalMutations();
    const commitments = useCommitmentMutations();
    const text = copy[kind];

    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
    const [date, setDate] = useState<DateValue | null>(() => today(getLocalTimeZone()));

    // Reset on open so a half-finished entry never leaks into the next one.
    useEffect(() => {
        if (!isOpen) return;
        setName("");
        setAmount("");
        setAccountId(accounts[0]?.id ?? "");
        setDate(today(getLocalTimeZone()));
    }, [isOpen, accounts]);

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} label={text.title}>
            <div className="flex flex-col gap-4 p-5">
                <div>
                    <h2 className="text-lg font-semibold tracking-tight text-primary">{text.title}</h2>
                    <p className="mt-0.5 text-sm text-tertiary">{text.blurb}</p>
                </div>

                <Field label={text.amountLabel}>
                    <AmountField symbol={currency.symbol} value={amount} onValueChange={setAmount} />
                </Field>

                <Field label={text.nameLabel}>
                    <TextField value={name} onChange={(event) => setName(event.target.value)} placeholder={text.namePlaceholder} />
                </Field>

                {/* An empty dropdown reads as broken, so with no accounts the field
                    says what is missing and offers the fix instead. */}
                {kind !== "goal" &&
                    (accounts.length === 0 ? (
                        <Field label="Account">
                            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-secondary px-4 py-3">
                                <span className="text-xs text-tertiary">Nothing to record against yet.</span>
                                {onAddAccount && (
                                    <ActionButton icon={HiOutlinePlus} onClick={onAddAccount} className="bg-primary">
                                        Add account
                                    </ActionButton>
                                )}
                            </div>
                        </Field>
                    ) : (
                        <Select
                            label="Account"
                            selectedKey={accountId}
                            onSelectionChange={(key) => setAccountId(String(key))}
                            items={accounts.map((account) => ({ id: account.id, label: account.name, supportingText: account.kind }))}
                        >
                            {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                        </Select>
                    ))}

                <Field label={kind === "commitment" ? "First due date" : kind === "goal" ? "Starting from" : "When"}>
                    <span className="mt-1.5 block">
                        <DatePicker value={date} onChange={setDate} />
                    </span>
                </Field>

                <ModalActions
                    onCancel={() => onOpenChange(false)}
                    confirmLabel={text.confirm}
                    confirmDisabled={(kind !== "goal" && accounts.length === 0) || record.isPending}
                    onConfirm={() => {
                        // Typed in the display currency, stored in the base one.
                        const value = Math.round(toBase(Number(amount || 0)));
                        const when = date ? date.toDate(getLocalTimeZone()) : new Date();
                        const close = { onSuccess: () => onOpenChange(false) };

                        if (kind === "goal") {
                            goals.create.mutate({ name, target: value }, close);
                            return;
                        }

                        if (kind === "commitment") {
                            commitments.create.mutate({ name, amount: value, due: when }, close);
                            return;
                        }

                        const account = accounts.find((item) => item.id === accountId);
                        if (!account) return;

                        // The account's balance after this entry, which is what
                        // the sync trigger reads to move the card.
                        const after = kind === "expense" ? account.balance - value : account.balance + value;

                        record.mutate(
                            {
                                accountId,
                                accountName: account.name,
                                kind,
                                name,
                                amount: value,
                                balanceAfter: Math.max(after, 0),
                                at: when,
                            },
                            close,
                        );
                    }}
                />
            </div>
        </Modal>
    );
};

/* ── account-hero.tsx ── */

const actions = [
    { id: "balance", label: "Update balance", icon: HiOutlineScale },
    { id: "history", label: "History", icon: HiOutlineClock },
    { id: "settings", label: "Settings", icon: HiOutlineCog6Tooth },
];

export const AccountHero = ({ accounts, className }: { accounts: Account[]; className?: string }) => {
    const { add, update, remove } = useAccounts();
    const [activeId, setActiveId] = useState(accounts[0]?.id ?? "");
    const [openModal, setOpenModal] = useState<"balance" | "history" | "settings" | null>(null);
    const [adding, setAdding] = useState(false);
    const scroller = useRef<HTMLDivElement>(null);
    const active = accounts.find((item) => item.id === activeId) ?? accounts[0];

    // Drag-to-scroll. The threshold matters: without it, a 2px wobble while
    // pressing a copyable field would swallow the click.
    const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: false });
    const [dragging, setDragging] = useState(false);

    const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
        const node = scroller.current;
        if (!node || event.button !== 0) return;

        drag.current = { active: true, startX: event.clientX, startScroll: node.scrollLeft, moved: false };
        setDragging(true);
    }, []);

    const onPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
        const node = scroller.current;
        if (!node || !drag.current.active) return;

        const delta = event.clientX - drag.current.startX;

        if (!drag.current.moved && Math.abs(delta) > 4) {
            drag.current.moved = true;
            // Captured only once this is genuinely a drag. Capturing on pointerdown
            // would retarget the click to this element and the copy buttons inside
            // the card would never receive it.
            event.currentTarget.setPointerCapture(event.pointerId);
        }

        if (drag.current.moved) node.scrollLeft = drag.current.startScroll - delta;
    }, []);

    const endDrag = useCallback((event?: ReactPointerEvent<HTMLDivElement>) => {
        if (!drag.current.active) return;
        drag.current.active = false;
        setDragging(false);

        if (event && event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    }, []);

    // Runs in the capture phase so a drag never reaches a copy button.
    const onClickCapture = useCallback((event: React.MouseEvent) => {
        if (!drag.current.moved) return;
        event.preventDefault();
        event.stopPropagation();
        drag.current.moved = false;
    }, []);

    const scrollTo = useCallback((id: string) => {
        scroller.current?.querySelector(`[data-account="${id}"]`)?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }, []);

    // Whichever card is nearest the middle is the active one.
    const onScroll = useCallback(() => {
        const node = scroller.current;
        if (!node) return;

        // Measured against the scroller's own rect: offsetLeft is relative to the
        // nearest positioned ancestor, which is not this element.
        const viewport = node.getBoundingClientRect();
        const middle = viewport.left + viewport.width / 2;

        let nearest = accounts[0]?.id ?? "";
        let best = Infinity;

        for (const child of node.children) {
            const slide = child as HTMLElement;
            const box = slide.getBoundingClientRect();
            const distance = Math.abs(box.left + box.width / 2 - middle);

            if (distance < best) {
                best = distance;
                nearest = slide.dataset.account ?? nearest;
            }
        }

        setActiveId(nearest);
    }, [accounts]);

    if (!active) {
        return (
            <Card className={cx("flex flex-col items-center justify-center gap-3 text-center", className)}>
                <NoAccountsArt />
                <h2 className="text-lg font-semibold tracking-tight text-primary md:text-xl">No accounts yet</h2>
                <p className="max-w-56 text-sm text-tertiary">Add the first one — a wallet, a bank account, or the cash in your pocket.</p>
                <ActionButton icon={HiOutlinePlus} onClick={() => setAdding(true)} className="bg-brand-primary text-brand-secondary">
                    Add account
                </ActionButton>

                <AddAccountModal isOpen={adding} onOpenChange={setAdding} onSave={add} />
            </Card>
        );
    }

    return (
        <Card className={cx("flex flex-col gap-4", className)}>
            <div className="flex min-w-0 items-center justify-between gap-3">
                <h2 className="truncate text-lg font-semibold tracking-tight text-primary md:text-xl">Accounts</h2>

                <Dropdown.Root>
                    <AriaButton className="flex h-9 min-w-0 items-center gap-1.5 rounded-full bg-secondary px-3.5 text-sm font-medium text-secondary outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2">
                        <span className="truncate">{active.name}</span>
                        <HiOutlineChevronDown className="size-4 shrink-0 text-tertiary" />
                    </AriaButton>

                    <Dropdown.Popover placement="bottom right">
                        <Dropdown.Menu
                            selectionMode="single"
                            disallowEmptySelection
                            selectedKeys={[active.id]}
                            onSelectionChange={(keys) => {
                                const next = keys === "all" ? undefined : [...keys][0];
                                if (typeof next === "string") {
                                    setActiveId(next);
                                    scrollTo(next);
                                }
                            }}
                        >
                            {accounts.map((account) => (
                                <Dropdown.Item key={account.id} id={account.id} label={account.name} addon={account.kind} />
                            ))}
                        </Dropdown.Menu>
                    </Dropdown.Popover>
                </Dropdown.Root>
            </div>

            <div className="flex flex-1 flex-col justify-center gap-3">
                {/* Scroll-snap rather than a transform carousel: native momentum,
                    keyboard and trackpad gestures all come for free. */}
                <div
                    ref={scroller}
                    data-no-native-drag
                    onScroll={onScroll}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    /* SVGs and images are natively draggable; the browser would
                       start its own drag and we would never see a pointermove. */
                    onDragStart={(event) => event.preventDefault()}
                    onClickCapture={onClickCapture}
                    className={cx(
                        "scrollbar-hide -mx-1 flex gap-3 overflow-x-auto px-1 select-none",
                        // Snapping fights a manual scrollLeft, so it is off mid-drag.
                        dragging ? "cursor-grabbing" : "cursor-grab snap-x snap-mandatory scroll-smooth",
                    )}
                >
                    {accounts.map((account) => (
                        <div key={account.id} data-account={account.id} className="h-60 w-full shrink-0 snap-center">
                            <AccountCard account={account} />
                        </div>
                    ))}
                </div>

                <div className="flex justify-center gap-1.5">
                    {accounts.map((account) => (
                        <button
                            key={account.id}
                            type="button"
                            aria-label={`Show ${account.name}`}
                            aria-current={account.id === active.id}
                            onClick={() => scrollTo(account.id)}
                            className={cx(
                                "h-1.5 rounded-full transition-all duration-200 ease-out",
                                account.id === active.id ? "w-5 bg-brand" : "w-1.5 bg-tertiary hover:bg-brand",
                            )}
                        />
                    ))}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
                {actions.map((action) => (
                    <ActionButton key={action.id} icon={action.icon} onClick={() => setOpenModal(action.id as "balance" | "history" | "settings")}>
                        {action.label}
                    </ActionButton>
                ))}
            </div>

            <UpdateBalanceModal isOpen={openModal === "balance"} onOpenChange={(open) => setOpenModal(open ? "balance" : null)} account={active} />
            <AccountHistoryModal isOpen={openModal === "history"} onOpenChange={(open) => setOpenModal(open ? "history" : null)} account={active} />
            <AccountSettingsModal
                isOpen={openModal === "settings"}
                onOpenChange={(open) => setOpenModal(open ? "settings" : null)}
                account={active}
                onSave={(patch) => update(active.id, patch)}
                onDelete={() => remove(active.id)}
            />
        </Card>
    );
};

/* ── account-trash.tsx ── */

/** "2h ago" beats a timestamp here — the only question is how recent it was. */
const sinceDeleted = (at: number) => {
    const minutes = Math.round((Date.now() - at) / 60_000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.round(minutes / 60)}h ago`;
    return `${Math.round(minutes / 1440)}d ago`;
};

/** The list only — the Accounts page frames it in a tab panel. */
export const AccountTrash = () => {
    const { trashed, restore, purge } = useAccounts();
    // Delete forever is the one thing here that can't be taken back, so it asks
    // in place rather than opening a dialog over a list of four rows.
    const [confirming, setConfirming] = useState<string | null>(null);

    if (trashed.length === 0) {
        return <p className="py-8 text-center text-sm text-tertiary">Nothing deleted. Accounts you remove wait here.</p>;
    }

    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm text-tertiary">Left out of your totals. Restore any time.</p>

            <ul className="flex flex-col gap-1.5">
                {trashed.map((account) => (
                    <li key={account.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-secondary px-3 py-2.5">
                        <span aria-hidden="true" className={`h-7 w-11 shrink-0 rounded-md opacity-60 ${cardThemeClass(account.theme)}`} />

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-primary">{account.name}</p>
                            <p className="truncate text-xs text-quaternary">
                                {account.kind} · deleted {sinceDeleted(account.deletedAt)}
                            </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                            <ActionButton icon={HiOutlineArrowUturnLeft} onClick={() => restore(account.id)} className="bg-primary">
                                Restore
                            </ActionButton>

                            {confirming === account.id ? (
                                <ActionButton
                                    icon={HiOutlineTrash}
                                    onClick={() => purge(account.id)}
                                    onBlur={() => setConfirming(null)}
                                    autoFocus
                                    className="bg-negative-tint text-negative-ink hover:bg-negative-tint hover:text-negative-ink"
                                >
                                    Sure? This is forever
                                </ActionButton>
                            ) : (
                                <ActionButton
                                    icon={HiOutlineTrash}
                                    onClick={() => setConfirming(account.id)}
                                    aria-label={`Delete ${account.name} forever`}
                                    className="bg-primary hover:bg-negative-tint hover:text-negative-ink"
                                />
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};
