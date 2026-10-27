import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { AuthLayout, AuthLink, SubmitButton } from "@/components/auth-shell";
import { Field, PasswordField, TextField } from "@/components/ui";
import { signIn } from "@/services/auth";
import { describeError } from "@/lib/supabase";

export const SignInPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // RequireAuth stashes where they were headed before the redirect, so a
    // deep link survives being bounced through sign-in.
    const destination = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/";

    const submit = async () => {
        setBusy(true);
        setError(null);
        try {
            await signIn({ email, password });
            void navigate(destination, { replace: true });
        } catch (cause) {
            setError(describeError(cause));
            // Keep the email, drop the password — the password is what was
            // wrong, and retyping the address every attempt is a punishment.
            setPassword("");
            setBusy(false);
        }
    };

    return (
        <AuthLayout
            title="Know what's spare"
            subtitle="One short email each morning. No spreadsheets, no guilt."
            error={error}
            footer={
                <>
                    New here? <AuthLink onPress={() => void navigate("/signup")}>Create an account</AuthLink>
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

                <div>
                    <Field label="Password">
                        {/* "current-password" rather than "password": it tells the
                            browser to offer a saved one rather than generate a new. */}
                        <PasswordField
                            name="password"
                            id="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Your password"
                        />
                    </Field>

                    <div className="mt-1.5 text-right">
                        <Link to="/forgot-password" className="text-xs font-medium text-tertiary transition duration-100 ease-linear hover:text-brand-secondary">
                            Forgot password?
                        </Link>
                    </div>
                </div>

                <SubmitButton busy={busy} className="mt-1">{busy ? "Signing in…" : "Sign in"}</SubmitButton>
            </form>
        </AuthLayout>
    );
};
