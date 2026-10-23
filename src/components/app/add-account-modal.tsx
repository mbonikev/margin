import { useEffect, useState } from "react";
import type { CardTheme } from "@/components/app/account-card";
import { CardThemePicker } from "@/components/app/card-theme-picker";
import { Select } from "@/components/base/select/select";
import { AmountField, Field, ModalActions, TextField } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useCurrency } from "@/providers/currency-provider";

const kinds = [
    { id: "Mobile money", label: "Mobile money" },
    { id: "Current", label: "Bank account" },
    { id: "Savings", label: "Savings" },
    { id: "Wallet", label: "Cash" },
];

interface AddAccountModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSave?: (account: { name: string; kind: string; balance: number; theme: CardTheme }) => void;
}

export const AddAccountModal = ({ isOpen, onOpenChange, onSave }: AddAccountModalProps) => {
    const { currency } = useCurrency();
    const [name, setName] = useState("");
    const [kind, setKind] = useState(kinds[0].id);
    const [balance, setBalance] = useState("");
    const [theme, setTheme] = useState<CardTheme>("blue");

    useEffect(() => {
        if (!isOpen) return;
        setName("");
        setKind(kinds[0].id);
        setBalance("");
        setTheme("blue");
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} label="Add account">
            <div className="flex flex-col gap-4 p-5">
                <div>
                    <h2 className="text-lg font-semibold tracking-tight text-primary">Add account</h2>
                    <p className="mt-0.5 text-sm text-tertiary">A wallet, a bank account, or the cash in your pocket.</p>
                </div>

                <Field label="Name">
                    <TextField value={name} onChange={(event) => setName(event.target.value)} placeholder="MTN MoMo" />
                </Field>

                <Select label="Type" selectedKey={kind} onSelectionChange={(key) => setKind(String(key))} items={kinds}>
                    {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                </Select>

                <Field label="Balance right now" hint="You can change this any time — that's the whole idea.">
                    <AmountField symbol={currency.symbol} value={balance} onValueChange={setBalance} />
                </Field>

                <Field label="Card colour">
                    <CardThemePicker value={theme} onChange={setTheme} />
                </Field>

                <ModalActions
                    onCancel={() => onOpenChange(false)}
                    confirmLabel="Add account"
                    onConfirm={() => {
                        onSave?.({ name, kind, balance: Number(balance || 0), theme });
                        onOpenChange(false);
                    }}
                />
            </div>
        </Modal>
    );
};
