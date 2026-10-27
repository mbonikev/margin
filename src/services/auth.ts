/**
 * Auth, wrapped so screens never touch the Supabase client directly.
 *
 * Email and password. Supabase Auth owns the parts that are easy to get wrong —
 * password hashing, recovery-token lifetime, the confirmation mails — so there
 * is no token table here. What this file adds is one vocabulary for the app and
 * one place where redirect URLs are decided.
 *
 * Signup requires confirmation: no session exists until the link in the mail is
 * clicked. An unconfirmed address would mean the morning mail, which is the
 * entire point of Margin, quietly goes nowhere.
 */

import { z } from "zod";
import { supabase } from "@/lib/supabase";

/**
 * Where the mailed links come back to. Built from the live origin so the same
 * build works on localhost and in production without a second env var — these
 * must also be listed under Authentication -> URL Configuration in Supabase,
 * or the link bounces to the project's Site URL instead.
 */
const redirectTo = (path: string) => `${window.location.origin}${path}`;

export const emailSchema = z.string().trim().min(1, "Email is required.").email("That doesn't look like an email.");

/**
 * Eight characters, matching the Supabase project's own minimum. Deliberately
 * not a zoo of character classes: length is what actually helps, and extra
 * rules mostly push people toward "Passw0rd!".
 */
export const passwordSchema = z.string().min(8, "Use at least 8 characters.");

export const signUpSchema = z.object({
    name: z.string().trim().min(1, "What should we call you?"),
    email: emailSchema,
    password: passwordSchema,
});

export const signInSchema = z.object({
    email: emailSchema,
    // Not `passwordSchema`: an existing password set under older rules must
    // still be accepted, and the length hint belongs on signup, not here.
    password: z.string().min(1, "Enter your password."),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;

/**
 * Creates the account.
 *
 * Whether a session comes back depends on a project setting the app cannot
 * see: with "Confirm email" on, signup mails a link and grants nothing until
 * it is clicked; with it off, the person is signed in immediately. Returning
 * which happened lets the screen follow the project rather than assume — and
 * means flipping that setting for local development does not strand people on
 * a "check your email" screen when no email was ever sent.
 */
export const signUp = async (input: SignUpInput): Promise<{ needsConfirmation: boolean }> => {
    const parsed = signUpSchema.parse(input);
    const { data, error } = await supabase.auth.signUp({
        email: parsed.email,
        password: parsed.password,
        options: {
            // Read by the handle_new_user trigger to seed the profile name.
            data: { name: parsed.name },
            emailRedirectTo: redirectTo("/"),
        },
    });
    if (error) throw error;

    return { needsConfirmation: data.session === null };
};

export const signIn = async (input: SignInInput): Promise<void> => {
    const parsed = signInSchema.parse(input);
    const { error } = await supabase.auth.signInWithPassword(parsed);
    if (error) throw error;
};

export const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};

/**
 * Starts recovery. Resolves the same way whether or not the address exists —
 * Supabase does not say, and neither should the UI, or the form becomes a way
 * to test which emails have accounts.
 */
export const requestPasswordReset = async (email: string): Promise<void> => {
    const { error } = await supabase.auth.resetPasswordForEmail(emailSchema.parse(email), {
        redirectTo: redirectTo("/reset-password"),
    });
    if (error) throw error;
};

/**
 * Finishes recovery. Only works while the recovery link's session is live,
 * which is why the reset screen must not be reachable without one.
 */
export const updatePassword = async (password: string): Promise<void> => {
    const { error } = await supabase.auth.updateUser({ password: passwordSchema.parse(password) });
    if (error) throw error;
};

/**
 * The other account-recovery lever (Issues.txt #5): move the account to an inbox
 * you can still reach. Supabase mails a confirmation to the new address and
 * keeps the old one working until it is clicked, so a typo cannot lock you out.
 */
export const updateEmail = async (email: string): Promise<void> => {
    const { error } = await supabase.auth.updateUser(
        { email: emailSchema.parse(email) },
        { emailRedirectTo: redirectTo("/settings") },
    );
    if (error) throw error;
};

/** Signs every device out — the thing to reach for if a session is lost or shared. */
export const signOutEverywhere = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut({ scope: "global" });
    if (error) throw error;
};
