/**
 * Sending feedback.
 *
 * The recipient lives in the `FEEDBACK_TO` secret on the Edge Function, not
 * here — anything in this file ships to every visitor in the JS bundle.
 */

import { z } from "zod";
import { supabase } from "@/lib/supabase";

export const feedbackSchema = z.object({
    message: z.string().trim().min(1, "Say something first.").max(4000, "That's a bit long — trim it down?"),
});

export const sendFeedback = async (message: string): Promise<void> => {
    const parsed = feedbackSchema.parse({ message });

    const { data, error } = await supabase.functions.invoke<{ ok?: boolean; error?: string }>("send-feedback", {
        body: { message: parsed.message },
    });

    // A non-2xx comes back as `error` with the body swallowed, so the function's
    // own message is read from `data` when it made it through.
    if (error) throw new Error(data?.error ?? "Couldn't send that. Try again shortly.");
    if (data?.error) throw new Error(data.error);
};
