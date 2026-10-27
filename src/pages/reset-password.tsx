import { useState } from "react";
import { useNavigate } from "react-router";
import { AuthLayout, AuthLink, SubmitButton } from "@/components/auth-shell";
import { Field, PasswordField } from "@/components/ui";
import { useAuth } from "@/auth-provider";
import { updatePassword } from "@/services/auth";
import { describeError } from "@/lib/supabase";

export const ResetPasswordPage = () => {
    const navigate = useNavigate();
    const { endRecovery } = useAuth();
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = async () => {
        // Checked here rather than by the schema: it is about these two fields
        // agreeing, which the service has no way to know about.
        if (password !== confirm) {
            setError("Those two don't match.");
            return;
        }

        setBusy(true);
        setError(null);
        try {
            await updatePassword(password);
            // The recovery session becomes an ordinary one; clearing the flag
            // is what lets the guards treat them as signed in again.
            endRecovery();
            void navigate("/", { replace: true });
        } catch (cause) {
            setError(describeError(cause));
            setBusy(false);
        }
    };

    return (
        <AuthLayout
            title="Set a new password"
            subtitle="Pick something you'll remember this time."
            error={error}
            footer={<AuthLink onPress={() => void navigate("/signin")}>Back to sign in</AuthLink>}
        >
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    void submit();
                }}
                className="flex flex-col gap-3"
            >
                <Field label="New password">
                    <PasswordField
                        name="password"
                        id="new-password"
                        autoComplete="new-password"
                        required
                        minLength={8}
                        autoFocus
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="At least 8 characters"
                    />
                </Field>

                <Field label="Confirm new password">
                    <PasswordField
                        name="confirm-password"
                        id="confirm-password"
                        autoComplete="new-password"
                        required
                        value={confirm}
                        onChange={(event) => setConfirm(event.target.value)}
                        placeholder="Type it again"
                    />
                </Field>

                <SubmitButton busy={busy} className="mt-1">{busy ? "Saving…" : "Save new password"}</SubmitButton>
            </form>
        </AuthLayout>
    );
};
