import type { InputHTMLAttributes, ReactNode } from "react";
import { cx } from "@/utils/cx";

export const Field = ({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) => (
    <label className="block">
        <span className="text-xs font-medium text-tertiary">{label}</span>
        {children}
        {hint && <span className="mt-1 block text-xs text-quaternary">{hint}</span>}
    </label>
);

const shell = "mt-1.5 flex w-full items-center gap-2 rounded-2xl bg-secondary px-4 py-3";
const control = "w-full min-w-0 bg-transparent text-sm font-medium text-primary outline-hidden placeholder:text-quaternary";

export const TextField = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
    <span className={shell}>
        <input {...props} className={cx(control, className)} />
    </span>
);

/** Digits-only with live grouping — money is never typed with a keyboard spinner. */
export const AmountField = ({ symbol, value, onValueChange }: { symbol: string; value: string; onValueChange: (next: string) => void }) => (
    <span className={shell}>
        <span className="shrink-0 text-lg font-medium text-tertiary">{symbol}</span>
        <input
            inputMode="numeric"
            placeholder="0"
            value={value ? Number(value).toLocaleString() : ""}
            onChange={(event) => onValueChange(event.target.value.replace(/[^\d]/g, ""))}
            className="w-full min-w-0 bg-transparent text-2xl font-semibold tracking-tight tabular-nums text-primary outline-hidden placeholder:text-quaternary"
        />
    </span>
);

export const ModalActions = ({ onCancel, onConfirm, confirmLabel }: { onCancel: () => void; onConfirm: () => void; confirmLabel: string }) => (
    <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel} className="h-10 rounded-full px-4 text-sm font-medium text-tertiary transition duration-100 ease-linear hover:bg-secondary">
            Cancel
        </button>
        <button
            type="button"
            onClick={onConfirm}
            className="h-10 rounded-full bg-brand-solid px-5 text-sm font-semibold text-white transition duration-100 ease-linear hover:bg-brand-solid_hover"
        >
            {confirmLabel}
        </button>
    </div>
);
