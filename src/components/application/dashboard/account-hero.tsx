import { useState } from "react";
import { Button as AriaButton } from "react-aria-components";
import { HiOutlineChevronDown, HiOutlineClock, HiOutlineCog6Tooth, HiOutlineScale } from "react-icons/hi2";
import type { Account } from "@/components/application/accounts/account-card";
import { AccountCard, AccountThumb } from "@/components/application/accounts/account-card";
import { Card } from "@/components/base/card/card";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { cx } from "@/utils/cx";

const actions = [
    { id: "balance", label: "Update balance", icon: HiOutlineScale },
    { id: "history", label: "History", icon: HiOutlineClock },
    { id: "settings", label: "Settings", icon: HiOutlineCog6Tooth },
];

export const AccountHero = ({ accounts, className }: { accounts: Account[]; className?: string }) => {
    const [activeId, setActiveId] = useState(accounts[0].id);
    const active = accounts.find((item) => item.id === activeId) ?? accounts[0];

    return (
        <Card className={cx("flex flex-col gap-4", className)}>
            <div className="flex items-start justify-between gap-3">
                <Dropdown.Root>
                    <AriaButton className="flex h-9 items-center gap-1.5 rounded-full bg-secondary px-3.5 text-sm font-medium text-secondary outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2">
                        {active.name}
                        <HiOutlineChevronDown className="size-4 text-tertiary" />
                    </AriaButton>

                    <Dropdown.Popover placement="bottom left">
                        <Dropdown.Menu
                            selectionMode="single"
                            disallowEmptySelection
                            selectedKeys={[active.id]}
                            onSelectionChange={(keys) => {
                                const next = keys === "all" ? undefined : [...keys][0];
                                if (typeof next === "string") setActiveId(next);
                            }}
                        >
                            {accounts.map((account) => (
                                <Dropdown.Item key={account.id} id={account.id} label={account.name} addon={account.kind} />
                            ))}
                        </Dropdown.Menu>
                    </Dropdown.Popover>
                </Dropdown.Root>
            </div>

            <div className="flex flex-1 items-center gap-4">
                <div className="min-w-0 flex-1">
                    <AccountCard account={active} className="mx-auto max-w-sm" />
                </div>

                <div className="flex shrink-0 flex-col gap-2">
                    {accounts.map((account) => (
                        <AccountThumb key={account.id} account={account} isActive={account.id === active.id} onSelect={() => setActiveId(account.id)} />
                    ))}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
                {actions.map((action) => (
                    <button
                        key={action.id}
                        type="button"
                        className="flex h-9 items-center gap-1.5 rounded-full bg-secondary px-3.5 text-sm font-medium text-tertiary transition duration-100 ease-linear hover:bg-brand-primary hover:text-brand-secondary"
                    >
                        <action.icon className="size-4.5 shrink-0" />
                        {action.label}
                    </button>
                ))}
            </div>
        </Card>
    );
};
