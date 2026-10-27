import { useState } from "react";
import { useNavigate } from "react-router";
import { AuthLayout, AuthLink, SentNotice, SubmitButton } from "@/components/auth-shell";
import { Field, PasswordField, TextField } from "@/components/ui";
import { signUp } from "@/services/auth";
import { describeError } from "@/lib/supabase";

export const SignUpPage = () => {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);

    const submit = async () => {
        setBusy(true);
        setError(null);
        try {
            const { needsConfirmation } = await signUp({ name, email, password });
            if (!needsConfirmation) {
                // Confirmation is off on this project: they are already signed
                // in, so sending them to an inbox would be a dead end.
                void navigate("/", { replace: true });
                return;
            }
            setSent(true);
        } catch (cause) {
            setError(describeError(cause));
        } finally {
            setBusy(false);
        }
    };

    if (sent) {
        return (
            <AuthLayout title="Check your email" subtitle="One click and you're in." error={error}>
                <SentNotice email={email} note="Not there? Check spam — it's a new sender." />
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Start with what you have"
            subtitle="No bank connection. No spreadsheets. Just what's spare."
            error={error}
            footer={
                <>
                    Already have an account? <AuthLink onPress={() => void navigate("/signin")}>Sign in</AuthLink>
                </>
            }
        >
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    void submit();
                }}
                className="flex flex-col gap-3"
            >
                <Field label="Name" hint="What the morning email will call you.">
                    <TextField
                        name="name"
                        id="name"
                        autoComplete="given-name"
                        required
                        autoFocus
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Kevin"
                    />
                </Field>

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
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                    />
                </Field>

                <Field label="Password">
                    {/* "new-password" asks the browser to suggest a strong one
                        and to offer saving it, which "password" does not. */}
                    <PasswordField
                        name="password"
                        id="new-password"
                        autoComplete="new-password"
                        required
                        minLength={8}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="At least 8 characters"
                    />
                </Field>

                <SubmitButton busy={busy} className="mt-1">{busy ? "Creating account…" : "Create account"}</SubmitButton>
            </form>
        </AuthLayout>
    );
};
