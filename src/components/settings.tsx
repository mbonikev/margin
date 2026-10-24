/** Every settings panel, and the three row shapes they are built from. */

import { useState } from "react";
import type { ReactNode } from "react";
import { HiArrowPath, HiCheck, HiOutlineArrowDownTray, HiOutlineArrowPath, HiOutlineComputerDesktop, HiOutlineExclamationTriangle, HiOutlineMoon, HiOutlineSun, HiOutlineTrash } from "react-icons/hi2";
import { Button } from "@/components/base/button";
import { Select } from "@/components/base/select";
import { Toggle } from "@/components/base/toggle";
import { ActionButton } from "@/components/ui";
import { Field, ModalActions, TextField } from "@/components/ui";
import { Flag } from "@/components/ui";
import { demoProfile } from "@/demo-data";
import { BASE_CURRENCY, accentColors, currencies, useAccounts, useCurrency, usePreferences, usePrivacy, useTheme } from "@/providers";
import type { Preferences, ThemeMode } from "@/providers";
import { cx } from "@/utils";

/* ── setting-rows.tsx ── */

/** A titled run of rows. Every settings panel is built from these three pieces. */
export const SettingGroup = ({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) => (
    <section className="flex flex-col gap-2">
        <div>
            <h3 className="text-sm font-semibold text-primary">{title}</h3>
            {hint && <p className="mt-0.5 text-xs text-tertiary">{hint}</p>}
        </div>
        <div className="flex flex-col gap-1.5">{children}</div>
    </section>
);

const row = "flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-2xl bg-secondary px-4 py-3";

export const ToggleRow = ({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (next: boolean) => void }) => (
    <div className={row}>
        <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-primary">{label}</span>
            {hint && <span className="block text-xs text-tertiary">{hint}</span>}
        </span>
        <Toggle isSelected={value} onChange={onChange} aria-label={label} />
    </div>
);

/** A segmented picker — for the two-to-four-option choices a select would bury. */
export const ChoiceRow = <T extends string | number>({
    label,
    hint,
    value,
    options,
    onChange,
}: {
    label: string;
    hint?: string;
    value: T;
    options: { id: T; label: string }[];
    onChange: (next: T) => void;
}) => (
    <div className={row}>
        <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-primary">{label}</span>
            {hint && <span className="block text-xs text-tertiary">{hint}</span>}
        </span>

        <div className="flex shrink-0 items-center gap-0.5 rounded-full bg-primary p-0.5">
            {options.map((option) => (
                <button
                    key={String(option.id)}
                    type="button"
                    onClick={() => onChange(option.id)}
                    aria-pressed={value === option.id}
                    className={cx(
                        "h-8 rounded-full px-3 text-xs font-medium whitespace-nowrap transition duration-100 ease-linear",
                        value === option.id ? "bg-brand-solid text-white" : "text-tertiary hover:text-secondary",
                    )}
                >
                    {option.label}
                </button>
            ))}
        </div>
    </div>
);

/** A number with −/+ ends. Beats a text input for the handful of small counts here. */
export const StepperRow = ({
    label,
    hint,
    value,
    min,
    max,
    step = 1,
    format,
    onChange,
}: {
    label: string;
    hint?: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    format?: (value: number) => string;
    onChange: (next: number) => void;
}) => {
    const clamp = (next: number) => Math.min(max, Math.max(min, next));

    return (
        <div className={row}>
            <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-primary">{label}</span>
                {hint && <span className="block text-xs text-tertiary">{hint}</span>}
            </span>

            <div className="flex shrink-0 items-center gap-0.5 rounded-full bg-primary p-0.5">
                <button
                    type="button"
                    onClick={() => onChange(clamp(value - step))}
                    disabled={value <= min}
                    aria-label={`Decrease ${label}`}
                    className="size-8 rounded-full text-sm font-semibold text-tertiary transition duration-100 ease-linear hover:text-secondary disabled:opacity-40"
                >
                    −
                </button>
                <span className="min-w-16 text-center text-xs font-medium tabular-nums text-primary">{format ? format(value) : value}</span>
                <button
                    type="button"
                    onClick={() => onChange(clamp(value + step))}
                    disabled={value >= max}
                    aria-label={`Increase ${label}`}
                    className="size-8 rounded-full text-sm font-semibold text-tertiary transition duration-100 ease-linear hover:text-secondary disabled:opacity-40"
                >
                    +
                </button>
            </div>
        </div>
    );
};

/* ── theme-controls.tsx ── */

const modes: { id: ThemeMode; label: string; icon: typeof HiOutlineSun }[] = [
    { id: "light", label: "Light", icon: HiOutlineSun },
    { id: "dark", label: "Dark", icon: HiOutlineMoon },
    { id: "system", label: "System", icon: HiOutlineComputerDesktop },
];

export const ThemeControls = () => {
    const { mode, setMode, accent, setAccent } = useTheme();

    return (
        <div className="px-2 py-1.5">
            <p className="px-1.5 pb-1.5 text-xs font-medium text-quaternary">Theme</p>

            <div className="flex items-center gap-0.5 rounded-full bg-popover-hover p-0.5">
                {modes.map((item) => {
                    const Icon = item.icon;
                    const isActive = mode === item.id;

                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setMode(item.id)}
                            aria-pressed={isActive}
                            className={cx(
                                "flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full text-xs font-medium transition duration-100 ease-linear",
                                isActive ? "bg-brand-solid text-white" : "text-tertiary hover:text-secondary",
                            )}
                        >
                            <Icon className="size-4" />
                            {item.label}
                        </button>
                    );
                })}
            </div>

            <p className="px-1.5 pt-3 pb-2 text-xs font-medium text-quaternary">Accent</p>

            <div className="flex flex-wrap gap-1.5 px-1.5 pb-1">
                {accentColors.map((color) => {
                    const isActive = accent.id === color.id;

                    return (
                        <button
                            key={color.id}
                            type="button"
                            onClick={() => setAccent(color.id)}
                            aria-label={color.label}
                            aria-pressed={isActive}
                            title={color.label}
                            style={{ backgroundColor: color.hex }}
                            className={cx(
                                "flex size-6 items-center justify-center rounded-full transition duration-100 ease-linear",
                                !isActive && "hover:scale-110",
                            )}
                        >
                            {isActive && <HiCheck className="size-4 text-white" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

/* ── profile-settings.tsx ── */

const zones = [
    { id: "Africa/Kigali", label: "Kigali", supportingText: "GMT+2" },
    { id: "Africa/Nairobi", label: "Nairobi", supportingText: "GMT+3" },
    { id: "Africa/Lagos", label: "Lagos", supportingText: "GMT+1" },
    { id: "Europe/London", label: "London", supportingText: "GMT+0" },
    { id: "America/New_York", label: "New York", supportingText: "GMT−5" },
];

export const ProfileSettings = () => {
    const { preferences } = usePreferences();
    const person = preferences.demoData ? demoProfile : { name: "", email: "" };

    return (
    <div className="flex max-w-md flex-col gap-4">
        <div>
            <h2 className="text-md font-semibold text-primary">Profile</h2>
            <p className="mt-0.5 text-sm text-tertiary">Your details, and the timezone your morning email follows.</p>
        </div>

        <Field label="Name">
            <TextField key={person.name} defaultValue={person.name} placeholder="Your name" />
        </Field>

        <Field label="Email" hint="Where the morning email arrives.">
            <TextField key={person.email} type="email" defaultValue={person.email} placeholder="you@example.com" />
        </Field>

        <Select
            label="Timezone"
            hint="The email is sent at your local time, not the server's."
            defaultSelectedKey="Africa/Kigali"
            items={zones}
        >
            {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
        </Select>

        <ModalActions onCancel={() => {}} onConfirm={() => {}} confirmLabel="Save profile" />
    </div>
    );
};

/* ── appearance-settings.tsx ── */

export const AppearanceSettings = () => {
    const { preferences, set } = usePreferences();

    return (
        <div className="flex max-w-2xl flex-col gap-6">
            <div>
                <h2 className="text-md font-semibold text-primary">Appearance</h2>
                <p className="mt-0.5 text-sm text-tertiary">How Margin looks and how much of it fits on screen.</p>
            </div>

            <SettingGroup title="Theme">
                <div className="-mx-2 max-w-sm">
                    <ThemeControls />
                </div>
            </SettingGroup>

            <SettingGroup title="Layout">
                <ChoiceRow
                    label="Density"
                    hint="How much padding the cards carry."
                    value={preferences.density}
                    onChange={(value) => set("density", value)}
                    options={[
                        { id: "compact", label: "Compact" },
                        { id: "comfortable", label: "Default" },
                        { id: "roomy", label: "Roomy" },
                    ]}
                />

                <ChoiceRow
                    label="Text size"
                    hint="Scales the whole interface, not just the text."
                    value={preferences.textSize}
                    onChange={(value) => set("textSize", value)}
                    options={[
                        { id: "small", label: "Small" },
                        { id: "default", label: "Default" },
                        { id: "large", label: "Large" },
                    ]}
                />

                <ToggleRow
                    label="Animations"
                    hint="Off also respects your system's reduced-motion setting."
                    value={!preferences.reduceMotion}
                    onChange={(value) => set("reduceMotion", !value)}
                />
            </SettingGroup>

            <SettingGroup title="Account cards">
                <ToggleRow label="Light sweep" hint="The sheen that runs across a card when it appears." value={preferences.cardSheen} onChange={(value) => set("cardSheen", value)} />
                <ToggleRow label="Show card ID" hint="Margin's own reference, printed under the name." value={preferences.showCardRef} onChange={(value) => set("showCardRef", value)} />
            </SettingGroup>
        </div>
    );
};

/* ── dashboard-settings.tsx ── */

const sections: { key: keyof Preferences; label: string; hint: string }[] = [
    { key: "showStatTiles", label: "Stat tiles", hint: "Safe to spend, spent this week, balance, saved." },
    { key: "showAccountHero", label: "Account card", hint: "The big card you can flick between accounts." },
    { key: "showUpcoming", label: "Upcoming", hint: "Bills and commitments on their way." },
    { key: "showInVsOut", label: "In vs out", hint: "The monthly bars." },
    { key: "showGoals", label: "Savings goals", hint: "What you're putting aside for." },
    { key: "showActivity", label: "Recent activity", hint: "The last things you recorded." },
];

export const DashboardSettings = () => {
    const { preferences, set } = usePreferences();
    const shown = sections.filter((section) => preferences[section.key]).length;

    return (
        <div className="flex max-w-2xl flex-col gap-6">
            <div>
                <h2 className="text-md font-semibold text-primary">Dashboard</h2>
                <p className="mt-0.5 text-sm text-tertiary">Keep what you look at. Hide the rest — {shown} of {sections.length} showing.</p>
            </div>

            <SettingGroup title="Sections">
                {sections.map((section) => (
                    <ToggleRow
                        key={section.key}
                        label={section.label}
                        hint={section.hint}
                        value={Boolean(preferences[section.key])}
                        onChange={(value) => set(section.key, value as never)}
                    />
                ))}
            </SettingGroup>
        </div>
    );
};

/* ── money-settings.tsx ── */

export const MoneySettings = () => {
    const { preferences, set } = usePreferences();
    const { currency } = useCurrency();

    return (
        <div className="flex max-w-2xl flex-col gap-6">
            <div>
                <h2 className="text-md font-semibold text-primary">Money</h2>
                <p className="mt-0.5 text-sm text-tertiary">How figures are written, and what counts as a month.</p>
            </div>

            <SettingGroup title="Figures">
                <ChoiceRow
                    label="Rounding"
                    hint="Exact keeps every digit. Rounding is kinder to read at a glance."
                    value={preferences.rounding}
                    onChange={(value) => set("rounding", value)}
                    options={[
                        { id: "exact", label: "Exact" },
                        { id: "hundred", label: "Nearest 100" },
                        { id: "thousand", label: "Nearest 1k" },
                    ]}
                />

                <ToggleRow
                    label="Show currency code"
                    hint={`${currency.code} after every figure, instead of the ${currency.symbol} in front.`}
                    value={preferences.showCurrencyCode}
                    onChange={(value) => set("showCurrencyCode", value)}
                />
            </SettingGroup>

            <SettingGroup title="Your month">
                <ChoiceRow
                    label="Week starts on"
                    value={preferences.weekStart}
                    onChange={(value) => set("weekStart", value)}
                    options={[
                        { id: "monday", label: "Monday" },
                        { id: "sunday", label: "Sunday" },
                    ]}
                />

                <StepperRow
                    label="Payday"
                    hint="The day your month resets."
                    value={preferences.payday}
                    min={1}
                    max={31}
                    format={(day) => `${day}${["th", "st", "nd", "rd"][day % 10 > 3 || (day > 10 && day < 14) ? 0 : day % 10]}`}
                    onChange={(value) => set("payday", value)}
                />

                <StepperRow
                    label="Low balance warning"
                    hint="Below this, the dashboard says so."
                    value={preferences.lowBalance}
                    min={0}
                    max={500000}
                    step={5000}
                    format={(amount) => amount.toLocaleString()}
                    onChange={(value) => set("lowBalance", value)}
                />

                <StepperRow
                    label="Call a balance stale after"
                    hint="How long before Margin nudges you to update one."
                    value={preferences.staleAfterDays}
                    min={1}
                    max={30}
                    format={(days) => `${days} day${days === 1 ? "" : "s"}`}
                    onChange={(value) => set("staleAfterDays", value)}
                />
            </SettingGroup>
        </div>
    );
};

/* ── currency-settings.tsx ── */

const relative = (date: Date) => {
    const minutes = Math.round((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.round(hours / 24)}d ago`;
};

export const CurrencySettings = () => {
    const { currency, setCurrency, rates, status, lastUpdated, refresh } = useCurrency();

    return (
        <div className="flex flex-col gap-5">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-md font-semibold text-primary">Currency</h2>
                    <p className="mt-0.5 text-sm text-tertiary">
                        Balances are held in {BASE_CURRENCY} and converted for display.{" "}
                        {lastUpdated ? `Rates updated ${relative(lastUpdated)}.` : "Rates not loaded yet."}
                    </p>
                </div>

                <Button color="secondary" size="sm" iconLeading={HiArrowPath} onClick={() => void refresh()} isDisabled={status === "loading"} className="h-9 rounded-full">
                    {status === "loading" ? "Refreshing…" : "Refresh rates"}
                </Button>
            </header>

            {status === "error" && (
                <p className="flex items-center gap-2 rounded-2xl bg-warning-primary px-4 py-3 text-sm text-warning-primary">
                    <HiOutlineExclamationTriangle className="size-5 shrink-0" />
                    Couldn't reach the rate service. Amounts stay in {BASE_CURRENCY} until it's back.
                </p>
            )}

            <ul className="flex flex-col gap-1">
                {currencies.map((item) => {
                    const isActive = item.code === currency.code;
                    const rate = item.code === BASE_CURRENCY ? 1 : rates[item.code];

                    return (
                        <li key={item.code}>
                            <button
                                type="button"
                                onClick={() => setCurrency(item.code)}
                                aria-pressed={isActive}
                                className={cx(
                                    "no-press flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition duration-100 ease-linear",
                                    isActive ? "bg-brand-primary" : "hover:bg-secondary",
                                )}
                            >
                                <Flag country={item.country} className="size-7" />

                                <span className="min-w-0 flex-1">
                                    <span className={cx("block text-sm font-medium", isActive ? "text-brand-secondary" : "text-primary")}>{item.code}</span>
                                    <span className="block truncate text-xs text-tertiary">{item.name}</span>
                                </span>

                                <span className="shrink-0 text-right text-xs tabular-nums text-tertiary">
                                    {rate === undefined ? (
                                        <span className="inline-block h-3 w-16 animate-pulse rounded-full bg-tertiary" />
                                    ) : (
                                        <>
                                            1 {BASE_CURRENCY} = {rate.toLocaleString(undefined, { maximumSignificantDigits: 4 })} {item.code}
                                        </>
                                    )}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>

            <p className="text-xs text-quaternary">Rates from exchangerate-api.com, cached locally and refreshed every 6 hours.</p>
        </div>
    );
};

/* ── email-settings.tsx ── */

const hours = Array.from({ length: 24 }, (_, hour) => ({
    id: String(hour),
    label: `${String(hour).padStart(2, "0")}:00`,
}));

const tones = [
    { id: "gentle", label: "Gentle", supportingText: "A friend checking in" },
    { id: "plain", label: "Plain", supportingText: "Just the numbers" },
    { id: "direct", label: "Direct", supportingText: "Blunt when it matters" },
];

const previews: Record<string, string> = {
    gentle: "Morning. You've got 48,200 that isn't spoken for. Eight days till payday, eleven days of pace. You're good.",
    plain: "Safe to spend: 48,200. Payday in 8 days. Current pace lasts 11 days.",
    direct: "48,200 left and 8 days to go. You're spending faster than that lasts — ease off today.",
};

export const EmailSettings = () => {
    const { preferences } = usePreferences();
    const [enabled, setEnabled] = useState(true);
    const [tone, setTone] = useState("gentle");
    const [quiet, setQuiet] = useState(true);

    return (
        <div className="flex max-w-md flex-col gap-4">
            <div>
                <h2 className="text-md font-semibold text-primary">Morning email</h2>
                <p className="mt-0.5 text-sm text-tertiary">One short note each morning. It's the whole point of Margin.</p>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-2xl bg-secondary px-4 py-3">
                <span>
                    <span className="block text-sm font-medium text-primary">Send the morning email</span>
                    <span className="block text-xs text-tertiary">
                        {preferences.demoData ? `${demoProfile.emailStreak} mornings in a row so far.` : "Starts the morning after your first balance."}
                    </span>
                </span>
                <Toggle isSelected={enabled} onChange={setEnabled} aria-label="Send the morning email" />
            </div>

            <div className={cx("flex flex-col gap-4 transition-opacity", !enabled && "pointer-events-none opacity-40")}>
                <Select label="Send at" defaultSelectedKey="7" items={hours}>
                    {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                </Select>

                <Select label="Tone" selectedKey={tone} onSelectionChange={(key) => setTone(String(key))} items={tones}>
                    {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                </Select>

                <Field label="Preview">
                    <blockquote className="mt-1.5 rounded-2xl bg-secondary px-4 py-3 text-sm text-secondary italic">“{previews[tone]}”</blockquote>
                </Field>

                <div className="flex items-center justify-between gap-4 rounded-2xl bg-secondary px-4 py-3">
                    <span>
                        <span className="block text-sm font-medium text-primary">Skip quiet days</span>
                        <span className="block text-xs text-tertiary">No email when nothing moved. Silence is earned.</span>
                    </span>
                    <Toggle isSelected={quiet} onChange={setQuiet} aria-label="Skip quiet days" />
                </div>
            </div>

            <ModalActions onCancel={() => {}} onConfirm={() => {}} confirmLabel="Save email settings" />
        </div>
    );
};

/* ── notification-settings.tsx ── */

export const NotificationSettings = () => {
    const { preferences, set } = usePreferences();

    return (
        <div className="flex max-w-2xl flex-col gap-6">
            <div>
                <h2 className="text-md font-semibold text-primary">Notifications</h2>
                <p className="mt-0.5 text-sm text-tertiary">What's worth interrupting you for. Everything else waits for the morning email.</p>
            </div>

            <SettingGroup title="Tell me about">
                <ToggleRow label="Stale balances" hint="When an account hasn't been updated in a while." value={preferences.notifyStale} onChange={(value) => set("notifyStale", value)} />
                <ToggleRow label="Bills coming up" hint="A couple of days before one lands." value={preferences.notifyBills} onChange={(value) => set("notifyBills", value)} />
                <ToggleRow label="Goal milestones" hint="Every quarter of the way there." value={preferences.notifyGoals} onChange={(value) => set("notifyGoals", value)} />
            </SettingGroup>

            <SettingGroup title="In the app">
                <ToggleRow label="Unread badge" hint="The count on the bell. Off still keeps the list." value={preferences.showUnreadBadge} onChange={(value) => set("showUnreadBadge", value)} />
            </SettingGroup>
        </div>
    );
};

/* ── privacy-settings.tsx ── */

export const PrivacySettings = () => {
    const { preferences, set } = usePreferences();
    const { hidden, toggle } = usePrivacy();

    return (
        <div className="flex max-w-2xl flex-col gap-6">
            <div>
                <h2 className="text-md font-semibold text-primary">Privacy</h2>
                <p className="mt-0.5 text-sm text-tertiary">Margin never connects to your bank. This is about who can read your screen.</p>
            </div>

            <SettingGroup title="Amounts">
                <ToggleRow label="Hide amounts now" hint="The same switch as the eye in the header." value={hidden} onChange={() => toggle()} />
                <ToggleRow label="Start hidden" hint="Every time you open Margin, amounts are masked until you ask." value={preferences.privateByDefault} onChange={(value) => set("privateByDefault", value)} />
                <ToggleRow
                    label="Hide when you look away"
                    hint="Masks amounts the moment this tab loses focus."
                    value={preferences.hideOnBlur}
                    onChange={(value) => set("hideOnBlur", value)}
                />
            </SettingGroup>

            <SettingGroup title="Care">
                <ToggleRow label="Confirm before deleting" hint="Ask once before an account goes to the trash." value={preferences.confirmDelete} onChange={(value) => set("confirmDelete", value)} />
            </SettingGroup>
        </div>
    );
};

/* ── data-settings.tsx ── */

export const DataSettings = () => {
    const { preferences, set, reset } = usePreferences();
    const { accounts, trashed, purge } = useAccounts();
    const [confirming, setConfirming] = useState<"reset" | "trash" | null>(null);

    const download = () => {
        const payload = JSON.stringify({ exportedAt: new Date().toISOString(), preferences, accounts }, null, 2);
        const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = `margin-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex max-w-2xl flex-col gap-6">
            <div>
                <h2 className="text-md font-semibold text-primary">Your data</h2>
                <p className="mt-0.5 text-sm text-tertiary">It lives in this browser. Nothing here leaves your device.</p>
            </div>

            <SettingGroup title="Demo">
                <ToggleRow
                    label="Demo data"
                    hint="Fills the app with sample accounts, bills and history. Your own accounts stay untouched either way."
                    value={preferences.demoData}
                    onChange={(value) => set("demoData", value)}
                />
            </SettingGroup>

            <SettingGroup title="Export">
                <div className={row}>
                    <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-primary">Download everything</span>
                        <span className="block text-xs text-tertiary">Your accounts and settings, as one JSON file.</span>
                    </span>
                    <ActionButton icon={HiOutlineArrowDownTray} onClick={download} className="bg-primary">
                        Export
                    </ActionButton>
                </div>
            </SettingGroup>

            <SettingGroup title="Start over" hint="Neither of these touches your accounts' balances.">
                <div className={row}>
                    <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-primary">Reset all settings</span>
                        <span className="block text-xs text-tertiary">Back to how Margin arrived.</span>
                    </span>
                    {confirming === "reset" ? (
                        <ActionButton
                            icon={HiOutlineArrowPath}
                            autoFocus
                            onBlur={() => setConfirming(null)}
                            onClick={() => {
                                reset();
                                setConfirming(null);
                            }}
                            className="bg-negative-tint text-negative-ink hover:bg-negative-tint hover:text-negative-ink"
                        >
                            Sure? Reset everything
                        </ActionButton>
                    ) : (
                        <ActionButton icon={HiOutlineArrowPath} onClick={() => setConfirming("reset")} className="bg-primary">
                            Reset
                        </ActionButton>
                    )}
                </div>

                <div className={row}>
                    <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-primary">Empty the trash</span>
                        <span className="block text-xs text-tertiary">
                            {trashed.length === 0 ? "Nothing in there." : `${trashed.length} account${trashed.length === 1 ? "" : "s"} waiting. This one is forever.`}
                        </span>
                    </span>
                    {confirming === "trash" ? (
                        <ActionButton
                            icon={HiOutlineTrash}
                            autoFocus
                            onBlur={() => setConfirming(null)}
                            onClick={() => {
                                trashed.forEach((account) => purge(account.id));
                                setConfirming(null);
                            }}
                            className="bg-negative-tint text-negative-ink hover:bg-negative-tint hover:text-negative-ink"
                        >
                            Sure? This is forever
                        </ActionButton>
                    ) : (
                        <ActionButton icon={HiOutlineTrash} onClick={() => setConfirming("trash")} disabled={trashed.length === 0} className="bg-primary disabled:opacity-40">
                            Empty
                        </ActionButton>
                    )}
                </div>
            </SettingGroup>
        </div>
    );
};
