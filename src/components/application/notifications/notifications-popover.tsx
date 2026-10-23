import { useState } from "react";
import type { FC } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Button as AriaButton, Dialog, DialogTrigger, Popover } from "react-aria-components";
import { HiOutlineArrowRight, HiOutlineBanknotes, HiOutlineBell, HiOutlineCheck, HiOutlineEnvelope, HiOutlineFlag, HiOutlineTrash, HiOutlineXMark } from "react-icons/hi2";
import { Avatar } from "@/components/base/avatar/avatar";
import { cx } from "@/utils/cx";

type BadgeTone = "brand" | "caution" | "info";

interface NotificationItem {
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

/** Placeholder data — replace with a real feed once the backend exists. */
const sampleNotifications: NotificationItem[] = [
    {
        id: "1",
        title: "Your balance is 3 days stale",
        body: "MTN MoMo, last seen Friday.",
        time: "2h ago",
        unread: true,
        icon: HiOutlineBanknotes,
        tone: "caution",
    },
    {
        id: "2",
        title: "Rent is due in 2 days",
        body: "450,000 leaves you 184,000.",
        time: "5h ago",
        unread: true,
        icon: HiOutlineBell,
        tone: "brand",
    },
    {
        id: "3",
        title: "Laptop fund passed 40%",
        body: "168,000 of 420,000.",
        time: "1d ago",
        icon: HiOutlineFlag,
        tone: "info",
    },
    {
        id: "4",
        title: "Your morning email went out",
        body: "14 mornings in a row.",
        time: "1d ago",
        icon: HiOutlineEnvelope,
        tone: "info",
    },
];

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
    const items = filter === "unread" ? sampleNotifications.filter((n) => n.unread) : sampleNotifications;
    const unreadCount = sampleNotifications.filter((n) => n.unread).length;

    return (
        <DialogTrigger>
            <AriaButton
                aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
                className="relative flex size-11 shrink-0 items-center justify-center rounded-full md:size-9 text-tertiary transition duration-100 ease-linear outline-focus-ring hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2"
            >
                <HiOutlineBell className="size-6 md:size-5.5" />
                {unreadCount > 0 && (
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
                        "w-[min(22rem,calc(100vw-2rem))] origin-(--trigger-anchor-point) overflow-hidden rounded-3xl bg-popover shadow-xl will-change-transform",
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
