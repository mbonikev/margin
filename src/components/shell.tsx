/** The frame around every page: header, nav, footer and the header's popovers. */

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import type { FC } from "react";
import { Button as AriaButton, Dialog, DialogTrigger, Popover } from "react-aria-components";
import type { Selection } from "react-aria-components";
import { HiOutlineArrowPath, HiOutlineArrowRight, HiOutlineArrowRightOnRectangle, HiOutlineArrowTrendingDown, HiOutlineArrowTrendingUp, HiOutlineBell, HiOutlineCheck, HiOutlineCog6Tooth, HiOutlineEye, HiOutlineEyeSlash, HiOutlineFlag, HiOutlinePlus, HiOutlineScale, HiOutlineTrash, HiOutlineUser, HiOutlineXMark } from "react-icons/hi2";
import { NavLink, Outlet, useNavigate } from "react-router";
import { demoNotifications } from "@/demo-data";
import { AddAccountModal, RecordModal } from "@/components/accounts";
import { PageBackdrop } from "@/components/illustrations";
import type { RecordKind } from "@/components/accounts";
import { ThemeControls } from "@/components/settings";
import { UpdateBalanceModal } from "@/components/accounts";
import { Avatar } from "@/components/base/avatar";
import { Button } from "@/components/base/button";
import { Dropdown } from "@/components/base/dropdown";
import { Coffee } from "@/components/ui";
import { Flag, flagIcon } from "@/components/ui";
import { Logo } from "@/components/ui";
import { Separator } from "@/components/ui";
import { currencies, useAccounts, useCurrency, usePreferences, usePrivacy } from "@/providers";
import { cx } from "@/utils";

/* ── privacy-toggle.tsx ── */

export const PrivacyToggle = () => {
    const { hidden, toggle } = usePrivacy();
    const Icon = hidden ? HiOutlineEyeSlash : HiOutlineEye;

    return (
        <AriaButton
            onPress={toggle}
            aria-pressed={hidden}
            aria-label={hidden ? "Show amounts" : "Hide amounts"}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-tertiary shadow-xs transition duration-100 ease-linear outline-focus-ring hover:text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 md:size-9"
        >
            <Icon className="size-5" />
        </AriaButton>
    );
};

/* ── currency-select.tsx ── */

export const CurrencySelect = () => {
    const { currency, setCurrency } = useCurrency();

    const onSelectionChange = (keys: Selection) => {
        const next = keys === "all" ? undefined : [...keys][0];
        if (typeof next === "string") setCurrency(next);
    };

    return (
        <Dropdown.Root>
            <AriaButton
                aria-label={`Display currency: ${currency.name}`}
                className="hidden h-11 shrink-0 items-center gap-2 rounded-full px-3 sm:flex text-sm font-medium text-tertiary transition duration-100 ease-linear outline-focus-ring hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 md:h-9"
            >
                <Flag country={currency.country} className="size-5" />
                {/* Fixed width: codes are all 3 letters but not all the same
                    width, and a reflow here would shift the whole header. */}
                <span className="w-8 text-center">{currency.code}</span>
            </AriaButton>

            <Dropdown.Popover placement="bottom right">
                <Dropdown.Menu
                    selectionMode="single"
                    disallowEmptySelection
                    selectedKeys={[currency.code]}
                    onSelectionChange={onSelectionChange}
                    className="max-h-80"
                >
                    {currencies.map((item) => (
                        <Dropdown.Item key={item.code} id={item.code} label={item.code} icon={flagIcon(item.country)} addon={item.symbol} textValue={`${item.code} ${item.name}`} />
                    ))}
                </Dropdown.Menu>
            </Dropdown.Popover>
        </Dropdown.Root>
    );
};

/* ── notifications-popover.tsx ── */

export type BadgeTone = "brand" | "caution" | "info";

export interface NotificationItem {
    id: string;
    title: string;
    body?: string;
    time: string;
    unread?: boolean;
    initials?: string;
    avatarUrl?: string;
    icon: FC<{ className?: string }>;
    tone: BadgeTone;
}

const toneStyles: Record<BadgeTone, string> = {
    brand: "bg-brand-solid text-white",
    caution: "bg-warning-solid text-white",
    info: "bg-info text-white",
};

const NotificationRow = ({ item }: { item: NotificationItem }) => {
    const Icon = item.icon;

    return (
        <button type="button" className="no-press flex w-full gap-3 px-4 py-3 text-left transition duration-100 ease-linear hover:bg-popover-hover">
            <Avatar
                size="sm"
                src={item.avatarUrl}
                initials={item.initials}
                alt=""
                className="mt-0.5 size-9"
                badge={
                    <span className={cx("absolute -right-0.5 -bottom-0.5 flex size-4.5 items-center justify-center rounded-full ring-2 ring-bg-primary", toneStyles[item.tone])}>
                        <Icon className="size-2.5" />
                    </span>
                }
            />

            <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                    <span className="truncate text-sm font-medium text-primary">{item.title}</span>
                    <span className="shrink-0 text-xs text-quaternary">{item.time}</span>
                </span>
                {item.body && <span className="mt-0.5 block truncate text-sm text-tertiary">{item.body}</span>}
            </span>

            {item.unread && <span aria-label="Unread" className="mt-2 size-2 shrink-0 rounded-full bg-brand-solid" />}
        </button>
    );
};

const filters = ["all", "unread"] as const;
type Filter = (typeof filters)[number];

export const NotificationsPopover = () => {
    const reduceMotion = useReducedMotion();
    const [filter, setFilter] = useState<Filter>("all");
    const { preferences } = usePreferences();
    const feed = preferences.demoData ? demoNotifications : [];
    const items = filter === "unread" ? feed.filter((item) => item.unread) : feed;
    const unreadCount = feed.filter((item) => item.unread).length;
    const showBadge = preferences.showUnreadBadge && unreadCount > 0;

    return (
        <DialogTrigger>
            <AriaButton
                aria-label={`Notifications${showBadge ? `, ${unreadCount} unread` : ""}`}
                className="relative flex size-11 shrink-0 items-center justify-center rounded-full md:size-9 text-tertiary transition duration-100 ease-linear outline-focus-ring hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2"
            >
                <HiOutlineBell className="size-6 md:size-5.5" />
                {showBadge && (
                    <span className="absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-solid px-1 text-[0.625rem] leading-none font-semibold text-white ring-2 ring-bg-primary">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </AriaButton>

            <Popover
                placement="bottom right"
                offset={8}
                className={({ isEntering, isExiting }) =>
                    cx(
                        "w-[min(22rem,calc(100vw-2rem))] origin-(--trigger-anchor-point) overflow-hidden rounded-3xl bg-popover shadow-xl ring-1 ring-popover will-change-transform",
                        isEntering && "duration-150 ease-out animate-in fade-in placement-bottom:slide-in-from-top-0.5",
                        isExiting && "duration-100 ease-in animate-out fade-out placement-bottom:slide-out-to-top-0.5",
                    )
                }
            >
                <Dialog aria-label="Notifications" className="outline-hidden">
                    {({ close }) => (
                        <>
                            <header className="flex items-center gap-2 px-4 pt-4 pb-2">
                                <h2 className="flex-1 text-md font-semibold text-primary">Notifications</h2>

                                <div className="flex items-center gap-0.5 rounded-full bg-popover-hover p-0.5">
                                    {filters.map((key) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setFilter(key)}
                                            className={cx(
                                                "h-7 rounded-full px-3 text-xs font-medium capitalize transition duration-100 ease-linear",
                                                filter === key ? "bg-brand-solid text-white" : "text-tertiary hover:text-secondary",
                                            )}
                                        >
                                            {key}
                                        </button>
                                    ))}
                                </div>

                                <AriaButton
                                    aria-label="Close notifications"
                                    onPress={close}
                                    className="flex size-7 shrink-0 items-center justify-center rounded-full text-tertiary transition duration-100 ease-linear outline-focus-ring hover:bg-secondary focus-visible:outline-2"
                                >
                                    <HiOutlineXMark className="size-4.5" />
                                </AriaButton>
                            </header>

                            <div className="max-h-[24rem] divide-y divide-border-secondary overflow-y-auto">
                                {items.length > 0 ? (
                                    items.map((item, index) => (
                                        <motion.div
                                            key={`${filter}-${item.id}`}
                                            initial={reduceMotion ? false : { opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.18, ease: "easeOut", delay: reduceMotion ? 0 : index * 0.035 }}
                                        >
                                            <NotificationRow item={item} />
                                        </motion.div>
                                    ))
                                ) : (
                                    <p className="px-4 py-10 text-center text-sm text-tertiary">You're all caught up.</p>
                                )}
                            </div>

                            <footer className="flex items-center gap-1 px-3 py-2">
                                <button type="button" className="flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium text-tertiary transition duration-100 ease-linear hover:bg-brand-popover hover:text-brand-secondary">
                                    <HiOutlineCheck className="size-4" />
                                    Mark all read
                                </button>
                                <button type="button" className="flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium text-tertiary transition duration-100 ease-linear hover:bg-brand-popover hover:text-brand-secondary">
                                    <HiOutlineTrash className="size-4" />
                                    Clear all
                                </button>
                                <button type="button" className="ml-auto flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold text-brand-secondary transition hover:bg-brand-popover">
                                    View all
                                    <HiOutlineArrowRight className="size-4" />
                                </button>
                            </footer>
                        </>
                    )}
                </Dialog>
            </Popover>
        </DialogTrigger>
    );
};

/* ── profile-menu.tsx ── */

const PanelItem = ({ icon: Icon, label, onPress }: { icon: FC<{ className?: string }>; label: string; onPress?: () => void }) => (
    <button
        type="button"
        onClick={onPress}
        className={cx(
            "flex h-9 w-full items-center rounded-full px-3.5 text-sm font-medium text-tertiary transition duration-100 ease-linear",
            "hover:bg-brand-popover hover:text-brand-secondary",
        )}
    >
        <Icon className="mr-3 size-5 shrink-0" />
        {label}
    </button>
);

export const ProfileMenu = () => {
    const navigate = useNavigate();

    return (
    <DialogTrigger>
        <AriaButton
            aria-label="Account menu"
            className="group ml-1.5 rounded-full outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
        >
            <Avatar size="sm" initials="K" alt="Your account" className="size-11 md:size-9" focusable />
        </AriaButton>

        <Popover
            placement="bottom right"
            offset={8}
            className={({ isEntering, isExiting }) =>
                cx(
                    "w-[min(16rem,calc(100vw-2rem))] origin-(--trigger-anchor-point) overflow-hidden rounded-[1.625rem] bg-popover shadow-xl ring-1 ring-popover md:rounded-[1.375rem] will-change-transform",
                    isEntering && "duration-150 ease-out animate-in fade-in placement-bottom:slide-in-from-top-0.5",
                    isExiting && "duration-100 ease-in animate-out fade-out placement-bottom:slide-out-to-top-0.5",
                )
            }
        >
            <Dialog aria-label="Account" className="outline-hidden">
                <div className="flex flex-col gap-0.5 p-1">
                    <PanelItem icon={HiOutlineUser} label="View profile" onPress={() => void navigate("/profile")} />
                    <PanelItem icon={HiOutlineCog6Tooth} label="Settings" onPress={() => void navigate("/settings")} />
                </div>

                <Separator orientation="horizontal" className="mx-auto my-1 w-[86%]" />

                <ThemeControls />

                <Separator orientation="horizontal" className="mx-auto my-1 w-[86%]" />

                <div className="p-1">
                    <PanelItem icon={HiOutlineArrowRightOnRectangle} label="Sign out" onPress={() => void navigate("/signin")} />
                </div>
            </Dialog>
        </Popover>
    </DialogTrigger>
);
};

/* ── app-footer.tsx ── */

const BUY_ME_A_COFFEE_URL = "https://buymeacoffee.com/margin";
const PORTFOLIO_URL = "https://mbonikev.site";

/** One line about who made this, and the only place to say thanks. */
export const AppFooter = () => (
    <footer className="relative mx-auto w-full max-w-[88rem] px-4 pb-24 md:px-8 md:pb-4">
        {/* Stacked and centred on a phone: side by side, the line has to truncate
            to fit the coffee button, and a half-sentence is worse than two rows. */}
        <div className="flex flex-col items-center gap-2 border-t border-secondary py-3 text-center sm:flex-row sm:justify-between sm:gap-4 sm:text-left">
            <div className="flex items-center gap-2.5">
                <Logo variant="mark" className="h-5 shrink-0" />
                <p className="text-sm text-tertiary">
                    Built by{" "}
                    <a
                        href={PORTFOLIO_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-secondary underline underline-offset-2 transition duration-100 ease-linear hover:text-primary"
                    >
                        one person
                    </a>
                    , tired of guessing.
                </p>
            </div>

            <Button
                href={BUY_ME_A_COFFEE_URL}
                target="_blank"
                rel="noreferrer"
                color="link-gray"
                size="sm"
                iconLeading={Coffee}
            >
                Buy me a coffee
            </Button>
        </div>
    </footer>
);

/* ── app-layout.tsx ── */

const navItems = [
    { label: "Dashboard", to: "/" },
    { label: "Accounts", to: "/accounts" },
];

/** Ordered by how often they get used: daily actions first, setup last. */
const recordActions = [
    { id: "balance", label: "Update balance", icon: HiOutlineScale },
    { id: "expense", label: "Add expense", icon: HiOutlineArrowTrendingDown },
    { id: "income", label: "Add income", icon: HiOutlineArrowTrendingUp },
];

const recordSetup = [
    { id: "commitment", label: "Add recurring bill", icon: HiOutlineArrowPath },
    { id: "goal", label: "New savings goal", icon: HiOutlineFlag },
];

/**
 * The top bar and the mobile bottom bar both render this, so each needs its own
 * `layoutId` — a shared one would make Motion try to tween between a visible
 * element and a `display:none` one, which reads as a jump.
 */
const NavLinks = ({ layoutId }: { layoutId: string }) => {
    const reduceMotion = useReducedMotion();

    return (
        <>
            {navItems.map((item) => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    className="relative flex h-11 items-center rounded-full px-5 text-base font-medium whitespace-nowrap md:h-9 md:px-4 md:text-sm"
                >
                    {({ isActive }) => (
                        <>
                            {isActive && (
                                <motion.span
                                    layoutId={layoutId}
                                    className="absolute inset-0 rounded-full bg-brand-primary"
                                    transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 32 }}
                                />
                            )}
                            <span className={cx("relative z-10", isActive ? "text-brand-secondary" : "text-tertiary")}>{item.label}</span>
                        </>
                    )}
                </NavLink>
            ))}
        </>
    );
};

export const AppLayout = () => {
    const { accounts, add } = useAccounts();
    const [recording, setRecording] = useState<RecordKind | null>(null);
    const [updatingBalance, setUpdatingBalance] = useState(false);

    return (
        <div className="relative min-h-screen overflow-x-clip bg-secondary">
            <PageBackdrop />

            {/* Full-width wrapper so the blur spans the viewport, with the inner
                row still constrained to the page width. */}
            <header className="sticky top-0 z-50 bg-header backdrop-blur-xl">
                <div className="mx-auto flex w-full max-w-[88rem] items-center justify-between gap-2 px-4 py-4 md:px-8 md:py-5">
                <NavLink to="/" aria-label="Margin — home" className="rounded-md outline-brand focus-visible:outline-2 focus-visible:outline-offset-4">
                    {/* The wordmark is ~117px wide at this height — too much of a
                        393px viewport once the controls are laid out beside it. */}
                    <Logo variant="mark" className="h-9 sm:hidden" />
                    <Logo className="hidden h-7 sm:block" />
                </NavLink>

                <div className="flex min-w-0 shrink items-center gap-1.5 sm:gap-2">
                    <PrivacyToggle />

                    <Dropdown.Root>
                        <Button
                            color="primary"
                            size="sm"
                            iconLeading={HiOutlinePlus}
                            aria-label="Record"
                            className="h-11 rounded-full text-base font-medium max-sm:w-11 max-sm:gap-0 max-sm:px-0 max-sm:*:data-text:hidden sm:px-4 md:h-9 md:text-sm"
                        >
                            Record
                        </Button>

                        <Dropdown.Popover placement="bottom right">
                            <Dropdown.Menu
                                onAction={(key) => {
                                    if (key === "balance") setUpdatingBalance(true);
                                    else setRecording(key as RecordKind);
                                }}
                            >
                                {recordActions.map((type) => (
                                    <Dropdown.Item key={type.id} id={type.id} label={type.label} icon={type.icon} />
                                ))}

                                <Dropdown.Separator />

                                {recordSetup.map((type) => (
                                    <Dropdown.Item key={type.id} id={type.id} label={type.label} icon={type.icon} />
                                ))}
                            </Dropdown.Menu>
                        </Dropdown.Popover>
                    </Dropdown.Root>

                    <div className="flex h-13 items-center gap-1 rounded-full bg-primary p-1 shadow-xs md:h-11">
                        <div className="hidden items-center gap-1 md:flex">
                            <NavLinks layoutId="nav-pill-top" />
                            <Separator className="mx-1.5" />
                        </div>

                        <CurrencySelect />

                        <NotificationsPopover />
                        <ProfileMenu />
                    </div>
                    </div>
                </div>
            </header>

            {/* `relative` on the content: the backdrop is positioned, so static
                siblings would paint underneath it. */}
            <main className="relative mx-auto w-full max-w-[88rem] px-4 pb-4 md:px-8 md:pb-6">
                <Outlet />
            </main>

            <AppFooter />

            <nav
                aria-label="Primary"
                className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden"
            >
                <div className="pointer-events-auto flex h-13 items-center gap-1 rounded-full bg-popover p-1 shadow-[0_4px_12px_rgba(0,0,0,0.10),0_16px_32px_-12px_rgba(0,0,0,0.22)] ring-1 ring-popover">
                    <NavLinks layoutId="nav-pill-bottom" />
                </div>
            </nav>

            {accounts[0] ? (
                <UpdateBalanceModal isOpen={updatingBalance} onOpenChange={setUpdatingBalance} account={accounts[0]} />
            ) : (
                <AddAccountModal isOpen={updatingBalance} onOpenChange={setUpdatingBalance} onSave={add} />
            )}
            <RecordModal
                kind={recording ?? "expense"}
                isOpen={recording !== null}
                onOpenChange={(open) => !open && setRecording(null)}
                accounts={accounts}
            />
        </div>
    );
};
