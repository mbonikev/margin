import type { Account } from "@/components/app/account-card";
import { Amount } from "@/components/ui/amount";
import { Field, ModalActions, SelectField, TextField } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";

/** The last few balance readings for one account. */
export const AccountHistoryModal = ({ isOpen, onOpenChange, account }: { isOpen: boolean; onOpenChange: (open: boolean) => void; account: Account }) => {
    const readings = [
        { at: "Today", amount: account.balance },
        { at: "3 days ago", amount: Math.round(account.balance * 1.08) },
        { at: "Last week", amount: Math.round(account.balance * 0.94) },
        { at: "2 weeks ago", amount: Math.round(account.balance * 1.15) },
    ];

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} label={`${account.name} history`}>
            <div className="flex flex-col gap-4 p-5">
                <div>
                    <h2 className="text-lg font-semibold tracking-tight text-primary">History</h2>
                    <p className="mt-0.5 text-sm text-tertiary">Balance readings for {account.name}.</p>
                </div>

                <ul className="flex flex-col">
                    {readings.map((reading, index) => {
                        const previous = readings[index + 1];
                        const delta = previous ? reading.amount - previous.amount : 0;

                        return (
                            <li key={reading.at} className="flex items-center justify-between gap-3 rounded-xl px-2 py-2.5 hover:bg-secondary">
                                <span className="text-sm text-tertiary">{reading.at}</span>
                                <span className="flex items-baseline gap-2">
                                    <Amount value={reading.amount} className="text-sm font-semibold text-primary" />
                                    {previous && (
                                        <span className={delta < 0 ? "text-xs text-negative-ink" : "text-xs text-positive-ink"}>
                                            {delta < 0 ? "−" : "+"}
                                            {Math.abs(delta).toLocaleString()}
                                        </span>
                                    )}
                                </span>
                            </li>
                        );
                    })}
                </ul>

                <ModalActions onCancel={() => onOpenChange(false)} onConfirm={() => onOpenChange(false)} confirmLabel="Done" />
            </div>
        </Modal>
    );
};

export const AccountSettingsModal = ({ isOpen, onOpenChange, account }: { isOpen: boolean; onOpenChange: (open: boolean) => void; account: Account }) => (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} label={`${account.name} settings`}>
        <div className="flex flex-col gap-4 p-5">
            <div>
                <h2 className="text-lg font-semibold tracking-tight text-primary">Account settings</h2>
                <p className="mt-0.5 text-sm text-tertiary">How {account.name} appears in Margin.</p>
            </div>

            <Field label="Name">
                <TextField defaultValue={account.name} />
            </Field>

            <Field label="Type">
                <TextField defaultValue={account.kind} />
            </Field>

            <Field label="Card colour" hint="Accounts are easiest to recognise by colour.">
                <SelectField defaultValue={account.theme}>
                    <option value="blue">Blue</option>
                    <option value="graphite">Graphite</option>
                    <option value="emerald">Emerald</option>
                    <option value="plum">Plum</option>
                </SelectField>
            </Field>

            <ModalActions onCancel={() => onOpenChange(false)} onConfirm={() => onOpenChange(false)} confirmLabel="Save changes" />
        </div>
    </Modal>
);
