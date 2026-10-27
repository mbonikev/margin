import { useState } from "react";
import { useNavigate } from "react-router";
import { AuthLayout, AuthLink, SentNotice, SubmitButton } from "@/components/auth-shell";
import { Field, TextField } from "@/components/ui";
import { requestPasswordReset } from "@/services/auth";
import { describeError } from "@/lib/supabase";

export const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);

    const submit = async () => {
        setBusy(true);
        setError(null);
        try {
            await requestPasswordReset(email);
            setSent(true);
        } catch (cause) {
            setError(describeError(cause));
        } finally {
            setBusy(false);
        }
    };

    if (sent) {
        return (
            <AuthLayout
                title="Check your email"
                subtitle="A reset link is on its way."
                footer={<AuthLink onPress={() => void navigate("/signin")}>Back to sign in</AuthLink>}
            >
                {/* Says "if" on purpose. Confirming which addresses have
                    accounts would turn this form into a way to find out. */}
                <SentNotice email={email} note="If that address has an account, the link is in its inbox now." />
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Forgot your password?"
            subtitle="We'll email you a link to set a new one."
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
                <Field label="Email">
                    <TextField
                        type="email"
                        name="email"
                        id="email"
                        autoComplete="email"
                        inputMode="email"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        required
                        autoFocus
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                    />
                </Field>

                <SubmitButton busy={busy} className="mt-1">{busy ? "Sending…" : "Email me a reset link"}</SubmitButton>
            </form>
        </AuthLayout>
    );
};
