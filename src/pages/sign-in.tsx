import { useState } from "react";
import { HiOutlineEnvelope } from "react-icons/hi2";
import { useNavigate } from "react-router";
import { Field, TextField } from "@/components/ui";
import { Logo } from "@/components/ui";

/**
 * Two layers in brand green at very low alpha: a dot grid that fades out before
 * it reaches the card, and two oversized marks bleeding off opposite edges.
 * Masks keep every edge soft — nothing here should draw the eye.
 */
const Backdrop = () => (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
            className="absolute inset-0 opacity-60 [background-image:radial-gradient(var(--color-border-secondary)_1px,transparent_1px)] [background-size:22px_22px]"
            style={{
                maskImage: "radial-gradient(ellipse 70% 55% at 50% 50%, transparent 20%, black 85%)",
                WebkitMaskImage: "radial-gradient(ellipse 70% 55% at 50% 50%, transparent 20%, black 85%)",
            }}
        />

        <Logo variant="mark" className="absolute -top-16 -left-20 h-72 rotate-12 opacity-[0.07] sm:h-96" />
        <Logo variant="mark" className="absolute -right-24 -bottom-24 h-80 -rotate-6 opacity-[0.05] sm:h-[28rem]" />
    </div>
);

export const SignInPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-secondary px-4 py-10">
            <Backdrop />

            <div className="relative w-full max-w-sm">
                <div className="flex flex-col items-center text-center">
                    <Logo className="h-8" />
                    <h1 className="mt-6 text-2xl font-semibold tracking-tight text-primary">Know what's spare</h1>
                    <p className="mt-1 text-sm text-tertiary">One short email each morning. No spreadsheets, no guilt.</p>
                </div>

                <div className="mt-6 rounded-3xl bg-primary p-5 shadow-xs">
                    {sent ? (
                        <div className="flex flex-col items-center gap-3 py-4 text-center">
                            <span className="flex size-11 items-center justify-center rounded-full bg-brand-primary text-brand-secondary">
                                <HiOutlineEnvelope className="size-5" />
                            </span>
                            <div>
                                <p className="text-sm font-medium text-primary">Check your inbox</p>
                                <p className="mt-0.5 text-xs text-tertiary">We sent a sign-in link to {email || "your email"}.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => void navigate("/")}
                                className="mt-1 h-10 rounded-full bg-brand-solid px-5 text-sm font-semibold text-white transition duration-100 ease-linear hover:bg-brand-solid_hover"
                            >
                                Continue
                            </button>
                        </div>
                    ) : (
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                setSent(true);
                            }}
                            className="flex flex-col gap-4"
                        >
                            {/* A link rather than a password: one less thing to lose, and
                                the product already lives in the inbox. */}
                            <Field label="Email" hint="We'll send a link — no password to remember.">
                                <TextField
                                    type="email"
                                    required
                                    autoFocus
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    placeholder="you@example.com"
                                />
                            </Field>

                            <button
                                type="submit"
                                className="h-11 w-full rounded-full bg-brand-solid text-sm font-semibold text-white transition duration-100 ease-linear hover:bg-brand-solid_hover"
                            >
                                Send me a link
                            </button>
                        </form>
                    )}
                </div>

                <p className="mt-4 text-center text-xs text-quaternary">Margin never connects to your bank. You tell it what you have.</p>
            </div>
        </main>
    );
};
