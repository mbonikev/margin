import { useState } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-aria-components";
import { HiOutlineCog6Tooth, HiOutlinePlus, HiOutlineScale } from "react-icons/hi2";
import type { Account } from "@/components/accounts";
import { AccountCard } from "@/components/accounts";
import { AccountSettingsModal } from "@/components/accounts";
import { AccountTrash } from "@/components/accounts";
import { NoAccountsArt } from "@/components/illustrations";
import { AddAccountModal } from "@/components/accounts";
import { UpdateBalanceModal } from "@/components/accounts";
import { ActionButton } from "@/components/ui";
import { Spinner } from "@/components/ui";
import { Amount } from "@/components/ui";
import { Card } from "@/components/ui";
import { useAccounts } from "@/providers";
import { useReveal } from "@/hooks/use-reveal";
import { usePreferences } from "@/providers";
import { cx } from "@/utils";

/** Stale balances are the one thing that quietly makes every other number on the
 *  dashboard wrong, so the threshold is the user's to set. */
const isStale = (account: Account, afterDays: number) => {
    const match = /(\d+)d ago/.exec(account.updated);
    return match !== null && Number(match[1]) >= afterDays;
};

export const AccountsPage = () => {
    const { accounts, trashed, add, update, remove, isLoading } = useAccounts();
    const reveal = useReveal(isLoading);
    const { preferences } = usePreferences();
    const [target, setTarget] = useState<{ account: Account; modal: "balance" | "settings" } | null>(null);
    const [adding, setAdding] = useState(false);

    const total = accounts.reduce((sum, account) => sum + account.balance, 0);
    const stale = accounts.filter((account) => isStale(account, preferences.staleAfterDays));

    const tabs = [
        { id: "accounts", label: "Your accounts", count: accounts.length },
        { id: "trash", label: "Trash", count: trashed.length },
    ];

    // Same reasoning as the dashboard: the summary tiles would otherwise read
    // "FRw 0" and "0 accounts" for a moment, which is a lie rather than a gap.
    if (isLoading) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-3">
                <Spinner className="size-6 text-quaternary" />
                <p className="text-sm text-tertiary">Loading your accounts…</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1.5 md:gap-2">
            <section aria-label="Summary" className={cx("grid min-w-0 gap-1.5 md:grid-cols-3 md:gap-2", reveal(0))}>
                <Card>
                    <p className="text-xs font-medium text-tertiary md:text-sm">Total across accounts</p>
                    <Amount value={total} compactSymbol compact className="mt-1 block truncate text-2xl font-semibold tracking-tight text-primary md:text-3xl" />
                </Card>

                <Card>
                    <p className="text-xs font-medium text-tertiary md:text-sm">Accounts</p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-primary md:text-3xl">{accounts.length}</p>
                </Card>

                <Card>
                    <p className="text-xs font-medium text-tertiary md:text-sm">Need updating</p>
                    <p className={cx("mt-1 text-2xl font-semibold tracking-tight tabular-nums md:text-3xl", stale.length ? "text-chart-compare" : "text-primary")}>
                        {stale.length}
                    </p>
                </Card>
            </section>

            <Tabs defaultSelectedKey="accounts" className={cx("flex flex-col gap-1.5 md:gap-2", reveal(1))}>
                <div className="flex items-center justify-between gap-3">
                    <TabList aria-label="Accounts" className="flex gap-1 overflow-x-auto rounded-full bg-primary p-1 shadow-xs scrollbar-hide">
                        {tabs.map((tab) => (
                            <Tab
                                key={tab.id}
                                id={tab.id}
                                className={({ isSelected }) =>
                                    cx(
                                        "flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-4 text-sm font-medium whitespace-nowrap transition duration-100 ease-linear outline-focus-ring focus-visible:outline-2 focus-visible:-outline-offset-2",
                                        isSelected ? "bg-brand-primary text-brand-secondary" : "text-tertiary hover:text-secondary",
                                    )
                                }
                            >
                                {({ isSelected }) => (
                                    <>
                                        {tab.label}
                                        <span className={cx("text-xs tabular-nums", isSelected ? "opacity-70" : "text-quaternary")}>{tab.count}</span>
                                    </>
                                )}
                            </Tab>
                        ))}
                    </TabList>

                    <ActionButton icon={HiOutlinePlus} onClick={() => setAdding(true)} className="bg-primary shadow-xs">
                        <span className="max-sm:sr-only">Add account</span>
                    </ActionButton>
                </div>

                <Card>
                    <TabPanel id="accounts" className="outline-hidden">
                        {accounts.length === 0 && (
                            <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
                                <NoAccountsArt />
                                <p className="text-sm font-medium text-primary">No accounts yet</p>
                                <p className="max-w-64 text-sm text-tertiary">Margin never connects to your bank — you tell it what you have.</p>
                                <ActionButton icon={HiOutlinePlus} onClick={() => setAdding(true)} className="bg-brand-primary text-brand-secondary">
                                    Add your first account
                                </ActionButton>
                            </div>
                        )}

                        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {accounts.map((account) => (
                                <li key={account.id} className="flex min-w-0 flex-col gap-2.5">
                                    <div className="h-52">
                                        <AccountCard account={account} />
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <ActionButton icon={HiOutlineScale} onClick={() => setTarget({ account, modal: "balance" })}>
                                            Update
                                        </ActionButton>
                                        <ActionButton icon={HiOutlineCog6Tooth} onClick={() => setTarget({ account, modal: "settings" })}>
                                            Settings
                                        </ActionButton>

                                        {isStale(account, preferences.staleAfterDays) && (
                                            <span className="ml-auto rounded-full bg-chart-compare/15 px-2.5 py-1 text-xs font-medium text-chart-compare">Stale</span>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </TabPanel>

                    <TabPanel id="trash" className="outline-hidden">
                        <AccountTrash />
                    </TabPanel>
                </Card>
            </Tabs>

            <AddAccountModal isOpen={adding} onOpenChange={setAdding} onSave={add} />

            {target?.modal === "balance" && (
                <UpdateBalanceModal isOpen onOpenChange={(open) => !open && setTarget(null)} account={target.account} />
            )}
            {target?.modal === "settings" && (
                <AccountSettingsModal
                    isOpen
                    onOpenChange={(open) => !open && setTarget(null)}
                    account={target.account}
                    onSave={(patch) => update(target.account.id, patch)}
                    onDelete={() => remove(target.account.id)}
                />
            )}
        </div>
    );
};
