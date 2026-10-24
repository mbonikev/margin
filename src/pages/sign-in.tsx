import { useEffect, useRef, useState } from "react";
import { HiOutlineArrowLeft } from "react-icons/hi2";
import { useNavigate } from "react-router";
import { PageBackdrop } from "@/components/backdrops";
import { Field, Logo, TextField } from "@/components/ui";
import { cx } from "@/utils";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;

/**
 * Six single-character boxes rather than one input: the code arrives as six
 * digits and is read back as six digits, and a box each makes a mistyped one
 * obvious at a glance. Paste, backspace and the arrow keys behave as they would
 * in a single field, which is the part these controls usually get wrong.
 */
const CodeInput = ({ value, onChange, onComplete }: { value: string[]; onChange: (next: string[]) => void; onComplete: () => void }) => {
    const boxes = useRef<(HTMLInputElement | null)[]>([]);

    const focus = (index: number) => boxes.current[Math.min(CODE_LENGTH - 1, Math.max(0, index))]?.focus();

    const write = (index: number, digits: string) => {
        if (!digits) return;

        const next = [...value];
        // A paste lands in whichever box took it and fills forward from there.
        [...digits].slice(0, CODE_LENGTH - index).forEach((digit, offset) => {
            next[index + offset] = digit;
        });

        onChange(next);
        focus(index + digits.length);
        if (next.every(Boolean)) onComplete();
    };

    return (
        <div className="flex justify-between gap-2">
            {Array.from({ length: CODE_LENGTH }, (_, index) => (
                <input
                    key={index}
                    ref={(node) => {
                        boxes.current[index] = node;
                    }}
                    value={value[index] ?? ""}
                    inputMode="numeric"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    aria-label={`Digit ${index + 1}`}
                    autoFocus={index === 0}
                    onChange={(event) => write(index, event.target.value.replace(/\D/g, ""))}
                    onKeyDown={(event) => {
                        if (event.key === "Backspace") {
                            event.preventDefault();
                            const next = [...value];
                            // On an empty box, clear the one before it and step
                            // back — so holding backspace walks the code out.
                            if (!next[index] && index > 0) {
                                next[index - 1] = "";
                                focus(index - 1);
                            } else {
                                next[index] = "";
                            }
                            onChange(next);
                        }
                        if (event.key === "ArrowLeft") focus(index - 1);
                        if (event.key === "ArrowRight") focus(index + 1);
                    }}
                    onFocus={(event) => event.target.select()}
                    className={cx(
                        "h-14 w-full min-w-0 rounded-2xl bg-secondary text-center text-xl font-semibold tabular-nums text-primary",
                        "outline-focus-ring transition duration-100 ease-linear focus-visible:outline-2 focus-visible:-outline-offset-2",
                    )}
                />
            ))}
        </div>
    );
};

export const SignInPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
    const [countdown, setCountdown] = useState(RESEND_SECONDS);

    // Only runs while a code is outstanding, and stops at zero rather than
    // ticking into negatives behind the scenes.
    useEffect(() => {
        if (!sent || countdown === 0) return;
        const timer = setTimeout(() => setCountdown((seconds) => seconds - 1), 1000);
        return () => clearTimeout(timer);
    }, [sent, countdown]);

    const complete = code.every(Boolean);

    const send = () => {
        setSent(true);
        setCode(Array(CODE_LENGTH).fill(""));
        setCountdown(RESEND_SECONDS);
    };

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-secondary px-4 py-10">
            <PageBackdrop />

            <div className="relative w-full max-w-sm">
                <div className="flex flex-col items-center text-center">
                    <Logo className="h-8" />
                    <h1 className="mt-6 text-2xl font-semibold tracking-tight text-primary">Know what's spare</h1>
                    <p className="mt-1 text-sm text-tertiary">One short email each morning. No spreadsheets, no guilt.</p>
                </div>

                <div className="mt-6 rounded-3xl bg-primary p-5 shadow-xs">
                    {sent ? (
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                if (complete) void navigate("/");
                            }}
                            className="flex flex-col gap-4"
                        >
                            <div className="text-center">
                                <p className="text-sm font-medium text-primary">Enter your code</p>
                                <p className="mt-0.5 text-xs text-tertiary">We sent six digits to {email || "your email"}.</p>
                            </div>

                            <CodeInput value={code} onChange={setCode} onComplete={() => void navigate("/")} />

                            <button
                                type="submit"
                                disabled={!complete}
                                className="h-11 w-full rounded-full bg-brand-solid text-sm font-semibold text-white transition duration-100 ease-linear hover:bg-brand-solid_hover disabled:pointer-events-none disabled:opacity-40"
                            >
                                Continue
                            </button>

                            <div className="flex items-center justify-between gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSent(false)}
                                    className="-ml-1 flex h-8 items-center gap-1 rounded-full px-2 text-xs font-medium text-tertiary transition duration-100 ease-linear hover:text-secondary"
                                >
                                    <HiOutlineArrowLeft className="size-3.5" />
                                    Change email
                                </button>

                                {countdown > 0 ? (
                                    <span className="px-2 text-xs tabular-nums text-quaternary">Resend in {countdown}s</span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={send}
                                        className="-mr-1 h-8 rounded-full px-2 text-xs font-semibold text-brand-secondary transition duration-100 ease-linear hover:bg-brand-primary"
                                    >
                                        Resend code
                                    </button>
                                )}
                            </div>
                        </form>
                    ) : (
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                send();
                            }}
                            className="flex flex-col gap-5"
                        >
                            {/* A code rather than a password: one less thing to lose,
                                and nothing to chase into a second tab the way a link is. */}
                            {/* Says what the address is for, rather than narrating the
                                button underneath it. */}
                            <Field label="Email" hint="Where your morning email will arrive.">
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
                                Send me a code
                            </button>
                        </form>
                    )}
                </div>

                <p className="mt-4 text-center text-xs text-quaternary">Margin never connects to your bank. You tell it what you have.</p>
            </div>
        </main>
    );
};
