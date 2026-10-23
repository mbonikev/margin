import { useState } from "react";
import { Select } from "@/components/base/select/select";
import { Toggle } from "@/components/base/toggle/toggle";
import { Field, ModalActions } from "@/components/ui/field";
import { cx } from "@/utils/cx";

const hours = Array.from({ length: 24 }, (_, hour) => ({
    id: String(hour),
    label: `${String(hour).padStart(2, "0")}:00`,
}));

const tones = [
    { id: "gentle", label: "Gentle", supportingText: "A friend checking in" },
    { id: "plain", label: "Plain", supportingText: "Just the numbers" },
    { id: "direct", label: "Direct", supportingText: "Blunt when it matters" },
];

const previews: Record<string, string> = {
    gentle: "Morning. You've got 48,200 that isn't spoken for. Eight days till payday, eleven days of pace. You're good.",
    plain: "Safe to spend: 48,200. Payday in 8 days. Current pace lasts 11 days.",
    direct: "48,200 left and 8 days to go. You're spending faster than that lasts — ease off today.",
};

export const EmailSettings = () => {
    const [enabled, setEnabled] = useState(true);
    const [tone, setTone] = useState("gentle");
    const [quiet, setQuiet] = useState(true);

    return (
        <div className="flex max-w-md flex-col gap-4">
            <div>
                <h2 className="text-md font-semibold text-primary">Morning email</h2>
                <p className="mt-0.5 text-sm text-tertiary">One short note each morning. It's the whole point of Margin.</p>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-2xl bg-secondary px-4 py-3">
                <span>
                    <span className="block text-sm font-medium text-primary">Send the morning email</span>
                    <span className="block text-xs text-tertiary">14 mornings in a row so far.</span>
                </span>
                <Toggle isSelected={enabled} onChange={setEnabled} aria-label="Send the morning email" />
            </div>

            <div className={cx("flex flex-col gap-4 transition-opacity", !enabled && "pointer-events-none opacity-40")}>
                <Select label="Send at" defaultSelectedKey="7" items={hours}>
                    {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                </Select>

                <Select label="Tone" selectedKey={tone} onSelectionChange={(key) => setTone(String(key))} items={tones}>
                    {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                </Select>

                <Field label="Preview">
                    <blockquote className="mt-1.5 rounded-2xl bg-secondary px-4 py-3 text-sm text-secondary italic">“{previews[tone]}”</blockquote>
                </Field>

                <div className="flex items-center justify-between gap-4 rounded-2xl bg-secondary px-4 py-3">
                    <span>
                        <span className="block text-sm font-medium text-primary">Skip quiet days</span>
                        <span className="block text-xs text-tertiary">No email when nothing moved. Silence is earned.</span>
                    </span>
                    <Toggle isSelected={quiet} onChange={setQuiet} aria-label="Skip quiet days" />
                </div>
            </div>

            <ModalActions onCancel={() => {}} onConfirm={() => {}} confirmLabel="Save email settings" />
        </div>
    );
};
