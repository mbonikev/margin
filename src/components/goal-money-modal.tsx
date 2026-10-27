/**
 * Moving money in or out of a goal.
 *
 * A goal is a destination, not a label: depositing genuinely takes the money
 * out of an account and withdrawing puts it back. Both sides move in one RPC,
 * because a browser that drops between two writes would leave the money in
 * neither place or in both.
 */

import { useState } from "react";
import { AmountField, Field, Modal, ModalActions } from "@/components/ui";
import { Select } from "@/components/base/select";
import { useAccounts, useCurrency } from "@/providers";
import { useGoalMutations } from "@/hooks/use-data";
import type { Goal } from "@/components/dashboard";

export const GoalMoneyModal = ({
    goal,
    direction,
    isOpen,
    onOpenChange,
}: {
    goal: Goal;
    direction: "deposit" | "withdraw";
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}) => {
    const { accounts } = useAccounts();
    const { currency, toBase } = useCurrency();
    const { move } = useGoalMutations();
    // No reset effect: the caller only renders this while a goal is selected,
    // so it mounts fresh every time and the initialisers do the job.
    const [amount, setAmount] = useState("");
    const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");

    const depositing = direction === "deposit";

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} label={depositing ? "Add to goal" : "Take from goal"}>
            <div className="flex flex-col gap-4 p-5">
                <div>
                    <h2 className="text-lg font-semibold tracking-tight text-primary">{depositing ? `Add to ${goal.name}` : `Take from ${goal.name}`}</h2>
                    <p className="mt-0.5 text-sm text-tertiary">
                        {depositing ? "This leaves the account you pick and sits in the goal." : "This comes out of the goal and back into the account you pick."}
                    </p>
                </div>

                <Field label="Amount">
                    <AmountField symbol={currency.symbol} value={amount} onValueChange={setAmount} />
                </Field>

                <Select
                    label={depositing ? "From" : "Back into"}
                    selectedKey={accountId}
                    onSelectionChange={(key) => setAccountId(String(key))}
                    items={accounts.map((account) => ({ id: account.id, label: account.name, supportingText: account.kind }))}
                >
                    {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                </Select>

                <ModalActions
                    onCancel={() => onOpenChange(false)}
                    confirmDisabled={!accountId || !amount || move.isPending}
                    confirmLabel={depositing ? "Add to goal" : "Take out"}
                    onConfirm={() =>
                        move.mutate(
                            {
                                goalId: goal.id,
                                accountId,
                                // Typed in the display currency, stored in base.
                                amount: Math.round(toBase(Number(amount || 0))),
                                direction,
                            },
                            { onSuccess: () => onOpenChange(false) },
                        )
                    }
                />
            </div>
        </Modal>
    );
};
