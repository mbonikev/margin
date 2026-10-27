import { ListPage } from "@/components/list-page";
import { Card } from "@/components/ui";
import { NoNotificationsArt } from "@/components/illustrations";
import { useNotificationActions, useNotifications } from "@/hooks/use-data";
import { cx } from "@/utils";

export const NotificationsPage = () => {
    const { data, isPending } = useNotifications();
    const actions = useNotificationActions();
    const items = data ?? [];
    const unread = items.filter((item) => item.unread).length;

    return (
        <ListPage title="Notifications" subtitle={unread > 0 ? `${unread} unread` : "You're all caught up."} loading={isPending}>
            <Card className="flex flex-col gap-1">
                {items.length === 0 && (
                    <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                        <NoNotificationsArt />
                        <p className="text-sm text-tertiary">Nothing yet. Stale balances, bills and goal milestones land here.</p>
                    </div>
                )}

                {items.map((item) => {
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.id}
                            type="button"
                            // Opening one is what marks it read; there is no
                            // separate "mark read" affordance per row to miss.
                            onClick={() => item.unread && actions.markRead.mutate(item.id)}
                            className={cx(
                                "flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition duration-100 ease-linear",
                                item.unread ? "bg-secondary" : "hover:bg-secondary",
                            )}
                        >
                            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-primary text-brand-secondary">
                                <Icon className="size-4" />
                            </span>

                            <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-2">
                                    <span className="truncate text-sm font-medium text-primary">{item.title}</span>
                                    {item.unread && <span className="size-1.5 shrink-0 rounded-full bg-brand-solid" aria-label="Unread" />}
                                </span>
                                {item.body && <span className="mt-0.5 block text-xs text-tertiary">{item.body}</span>}
                                <span className="mt-1 block text-xs text-quaternary">{item.time}</span>
                            </span>
                        </button>
                    );
                })}
            </Card>
        </ListPage>
    );
};
