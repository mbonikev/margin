import { useCallback, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Button as AriaButton } from "react-aria-components";
import { HiOutlineChevronDown, HiOutlineClock, HiOutlineCog6Tooth, HiOutlineScale } from "react-icons/hi2";
import type { Account } from "@/components/app/account-card";
import { AccountCard } from "@/components/app/account-card";
import { ActionButton } from "@/components/ui/action-button";
import { Card } from "@/components/ui/card";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { cx } from "@/utils/cx";

const actions = [
    { id: "balance", label: "Update balance", icon: HiOutlineScale },
    { id: "history", label: "History", icon: HiOutlineClock },
    { id: "settings", label: "Settings", icon: HiOutlineCog6Tooth },
];

export const AccountHero = ({ accounts, className }: { accounts: Account[]; className?: string }) => {
    const [activeId, setActiveId] = useState(accounts[0].id);
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
        if (Math.abs(delta) > 4) drag.current.moved = true;
        node.scrollLeft = drag.current.startScroll - delta;
    }, []);

    const endDrag = useCallback(() => {
        if (!drag.current.active) return;
        drag.current.active = false;
        setDragging(false);
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

        let nearest = accounts[0].id;
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

    return (
        <Card className={cx("flex flex-col gap-4", className)}>
            <div className="flex items-center justify-between gap-3">
                <h2 className="truncate text-lg font-semibold tracking-tight text-primary md:text-xl">Accounts</h2>

                <Dropdown.Root>
                    <AriaButton className="flex h-9 items-center gap-1.5 rounded-full bg-secondary px-3.5 text-sm font-medium text-secondary outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2">
                        {active.name}
                        <HiOutlineChevronDown className="size-4 text-tertiary" />
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
                    onScroll={onScroll}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={endDrag}
                    onPointerLeave={endDrag}
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
                    <ActionButton key={action.id} icon={action.icon}>
                        {action.label}
                    </ActionButton>
                ))}
            </div>
        </Card>
    );
};
