import { useEffect, useState } from "react";
import type { Account } from "@/components/app/account-card";
import { AmountField, Field, ModalActions, SelectField, TextField } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useCurrency } from "@/providers/currency-provider";

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
    onSave?: (entry: { kind: RecordKind; name: string; amount: number; accountId: string; date: string }) => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export const RecordModal = ({ kind, isOpen, onOpenChange, accounts, onSave }: RecordModalProps) => {
    const { currency } = useCurrency();
    const text = copy[kind];

    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
    const [date, setDate] = useState(today);

    // Reset on open so a half-finished entry never leaks into the next one.
    useEffect(() => {
        if (!isOpen) return;
        setName("");
        setAmount("");
        setAccountId(accounts[0]?.id ?? "");
        setDate(today());
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

                {kind !== "goal" && (
                    <Field label="Account">
                        <SelectField value={accountId} onChange={(event) => setAccountId(event.target.value)}>
                            {accounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                    {account.name}
                                </option>
                            ))}
                        </SelectField>
                    </Field>
                )}

                <Field label={kind === "commitment" ? "First due date" : kind === "goal" ? "Starting from" : "When"}>
                    <TextField type="date" value={date} onChange={(event) => setDate(event.target.value)} />
                </Field>

                <ModalActions
                    onCancel={() => onOpenChange(false)}
                    confirmLabel={text.confirm}
                    onConfirm={() => {
                        onSave?.({ kind, name, amount: Number(amount || 0), accountId, date });
                        onOpenChange(false);
                    }}
                />
            </div>
        </Modal>
    );
};
