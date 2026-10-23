import { useEffect, useMemo, useState } from "react";
import { HiOutlineArrowTrendingDown, HiOutlineArrowTrendingUp } from "react-icons/hi2";
import type { Account } from "@/components/app/account-card";
import { Amount } from "@/components/ui/amount";
import { Modal } from "@/components/ui/modal";
import { useCurrency } from "@/providers/currency-provider";
import { cx } from "@/utils/cx";

interface UpdateBalanceModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    account: Account;
    onSave?: (balance: number) => void;
}

const digitsOnly = (value: string) => value.replace(/[^\d]/g, "");

export const UpdateBalanceModal = ({ isOpen, onOpenChange, account, onSave }: UpdateBalanceModalProps) => {
    const { currency, convert } = useCurrency();
    const [raw, setRaw] = useState("");

    // Start from the current figure each time it opens, so the common case —
    // "it barely moved" — is an edit rather than retyping from scratch.
    useEffect(() => {
        if (isOpen) setRaw(String(Math.round(convert(account.balance))));
    }, [isOpen, account.balance, convert]);

    const entered = Number(digitsOnly(raw) || 0);
    const current = Math.round(convert(account.balance));
    const delta = entered - current;
    const unchanged = delta === 0;
    const down = delta < 0;

    const formatted = useMemo(() => (digitsOnly(raw) ? Number(digitsOnly(raw)).toLocaleString() : ""), [raw]);

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} label="Update balance">
            <div className="flex flex-col gap-5 p-5">
                <div>
                    <h2 className="text-lg font-semibold tracking-tight text-primary">Update balance</h2>
                    <p className="mt-0.5 text-sm text-tertiary">
                        What does {account.name} say right now?
                    </p>
                </div>

                <label className="block">
                    <span className="text-xs font-medium text-tertiary">New balance</span>

                    <span className="mt-1.5 flex items-center gap-2 rounded-2xl bg-secondary px-4 py-3">
                        <span className="shrink-0 text-lg font-medium text-tertiary">{currency.symbol}</span>
                        <input
                            autoFocus
                            inputMode="numeric"
                            value={formatted}
                            onChange={(event) => setRaw(digitsOnly(event.target.value))}
                            placeholder="0"
                            className="w-full min-w-0 bg-transparent text-2xl font-semibold tracking-tight tabular-nums text-primary outline-hidden placeholder:text-quaternary"
                        />
                    </span>
                </label>

                {/* The delta is the whole point — it is what the app computes for you. */}
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-secondary px-4 py-3">
                    <span className="text-xs text-tertiary">
                        Was <Amount value={account.balance} /> · {account.updated.toLowerCase()}
                    </span>

                    {unchanged ? (
                        <span className="shrink-0 text-xs font-medium text-tertiary">No change</span>
                    ) : (
                        <span
                            className={cx(
                                "flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
                                down ? "bg-negative-tint text-negative-ink" : "bg-positive-tint text-positive-ink",
                            )}
                        >
                            {down ? <HiOutlineArrowTrendingDown className="size-3.5" /> : <HiOutlineArrowTrendingUp className="size-3.5" />}
                            {Math.abs(delta).toLocaleString()}
                        </span>
                    )}
                </div>

                <div className="flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="h-10 rounded-full px-4 text-sm font-medium text-tertiary transition duration-100 ease-linear hover:bg-secondary"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            onSave?.(entered);
                            onOpenChange(false);
                        }}
                        className="h-10 rounded-full bg-brand-solid px-5 text-sm font-semibold text-white transition duration-100 ease-linear hover:bg-brand-solid_hover"
                    >
                        Save balance
                    </button>
                </div>
            </div>
        </Modal>
    );
};
