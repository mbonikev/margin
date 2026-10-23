import { useState } from "react";
import { HiOutlineCog6Tooth, HiOutlinePlus, HiOutlineScale } from "react-icons/hi2";
import type { Account } from "@/components/app/account-card";
import { AccountCard } from "@/components/app/account-card";
import { AccountSettingsModal } from "@/components/app/account-detail-modal";
import { AddAccountModal } from "@/components/app/add-account-modal";
import { UpdateBalanceModal } from "@/components/app/update-balance-modal";
import { ActionButton } from "@/components/ui/action-button";
import { Amount } from "@/components/ui/amount";
import { Card } from "@/components/ui/card";
import { accounts } from "@/data/accounts";
import { cx } from "@/utils/cx";

/** Anything older than this is worth nudging about — stale balances are the one
 *  thing that quietly makes every other number on the dashboard wrong. */
const isStale = (account: Account) => /(\d+)d ago/.test(account.updated) && Number(RegExp.$1) >= 3;

export const AccountsPage = () => {
    const [target, setTarget] = useState<{ account: Account; modal: "balance" | "settings" } | null>(null);
    const [adding, setAdding] = useState(false);

    const total = accounts.reduce((sum, account) => sum + account.balance, 0);
    const stale = accounts.filter(isStale);

    return (
        <div className="flex flex-col gap-1.5 md:gap-2">
            <section aria-label="Summary" className="grid gap-1.5 md:grid-cols-3 md:gap-2">
                <Card>
                    <p className="text-xs font-medium text-tertiary md:text-sm">Total across accounts</p>
                    <Amount value={total} compactSymbol className="mt-1 block truncate text-2xl font-semibold tracking-tight text-primary md:text-3xl" />
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

            <section aria-label="Your accounts">
                <Card className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="truncate text-lg font-semibold tracking-tight text-primary md:text-xl">Your accounts</h2>
                        <ActionButton icon={HiOutlinePlus} onClick={() => setAdding(true)}>Add account</ActionButton>
                    </div>

                    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {accounts.map((account) => (
                            <li key={account.id} className="flex flex-col gap-2.5">
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

                                    {isStale(account) && (
                                        <span className="ml-auto rounded-full bg-chart-compare/15 px-2.5 py-1 text-xs font-medium text-chart-compare">Stale</span>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </Card>
            </section>

            <AddAccountModal isOpen={adding} onOpenChange={setAdding} />

            {target?.modal === "balance" && (
                <UpdateBalanceModal isOpen onOpenChange={(open) => !open && setTarget(null)} account={target.account} />
            )}
            {target?.modal === "settings" && (
                <AccountSettingsModal isOpen onOpenChange={(open) => !open && setTarget(null)} account={target.account} />
            )}
        </div>
    );
};
