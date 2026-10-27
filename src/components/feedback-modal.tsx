/**
 * The feedback form.
 *
 * A modal rather than a mailto: a mailto exposes the recipient in the bundle,
 * and it hands the person off to whatever mail client the OS decides on, which
 * on a shared or work machine is often the wrong one or none at all.
 */

import { useState } from "react";
import { Field, Modal, ModalActions } from "@/components/ui";
import { sendFeedback } from "@/services/feedback";
import { notify } from "@/lib/toast";
import { describeError } from "@/lib/supabase";
import { cx } from "@/utils";

export const FeedbackModal = ({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (open: boolean) => void }) => {
    const [message, setMessage] = useState("");
    const [busy, setBusy] = useState(false);

    const submit = async () => {
        setBusy(true);
        try {
            await notify.promise(sendFeedback(message), { loading: "Sending…", success: "Thanks — that's been sent." });
            setMessage("");
            onOpenChange(false);
        } catch (cause) {
            // The toast already showed it; this keeps the modal open so the
            // typing is not lost to a failed send.
            void describeError(cause);
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} label="Send feedback">
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    void submit();
                }}
                className="flex flex-col gap-4 p-5"
            >
                <div>
                    <h2 className="text-lg font-semibold tracking-tight text-primary">Feedback</h2>
                    <p className="mt-0.5 text-sm text-tertiary">What's working, what isn't, what's missing. It goes straight to the person who built this.</p>
                </div>

                <Field label="Your message">
                    <textarea
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        required
                        autoFocus
                        rows={5}
                        maxLength={4000}
                        placeholder="The thing I keep wanting is…"
                        className={cx(
                            "mt-1.5 w-full resize-none rounded-2xl bg-secondary px-4 py-3",
                            "text-sm font-medium text-primary outline-hidden placeholder:text-quaternary",
                        )}
                    />
                </Field>

                <ModalActions onCancel={() => onOpenChange(false)} onConfirm={() => void submit()} confirmLabel={busy ? "Sending…" : "Send feedback"} />
            </form>
        </Modal>
    );
};
