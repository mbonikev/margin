import { Select } from "@/components/base/select/select";
import { Field, ModalActions, TextField } from "@/components/ui/field";

const zones = [
    { id: "Africa/Kigali", label: "Kigali", supportingText: "GMT+2" },
    { id: "Africa/Nairobi", label: "Nairobi", supportingText: "GMT+3" },
    { id: "Africa/Lagos", label: "Lagos", supportingText: "GMT+1" },
    { id: "Europe/London", label: "London", supportingText: "GMT+0" },
    { id: "America/New_York", label: "New York", supportingText: "GMT−5" },
];

export const ProfileSettings = () => (
    <div className="flex max-w-md flex-col gap-4">
        <div>
            <h2 className="text-md font-semibold text-primary">Profile</h2>
            <p className="mt-0.5 text-sm text-tertiary">Your details, and the timezone your morning email follows.</p>
        </div>

        <Field label="Name">
            <TextField defaultValue="Kevin" placeholder="Your name" />
        </Field>

        <Field label="Email" hint="Where the morning email arrives.">
            <TextField type="email" defaultValue="kevin@example.com" placeholder="you@example.com" />
        </Field>

        <Select
            label="Timezone"
            hint="The email is sent at your local time, not the server's."
            defaultSelectedKey="Africa/Kigali"
            items={zones}
        >
            {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
        </Select>

        <ModalActions onCancel={() => {}} onConfirm={() => {}} confirmLabel="Save profile" />
    </div>
);
