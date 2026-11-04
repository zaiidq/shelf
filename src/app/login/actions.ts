"use server";

import { redirect } from "next/navigation";

import { homeFor } from "@/lib/auth";
import { isSupabaseConfigured, siteUrl } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SendCodeState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "error"; message: string; email?: string };

export type VerifyCodeState = { status: "idle" } | { status: "error"; message: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Step 1: email a sign-in code (and link). Creates the account if new. */
export async function sendCode(_prev: SendCodeState, formData: FormData): Promise<SendCodeState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return { status: "error", message: "Enter a valid email address.", email };
  }

  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message: "Sign-in isn’t set up yet (Supabase keys are missing).",
      email,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      // Where the link in the email lands (see the email template).
      emailRedirectTo: `${siteUrl}/auth/confirm`,
    },
  });

  if (error) {
    return { status: "error", message: friendlyAuthError(error.message, error.status), email };
  }
  return { status: "sent", email };
}

/** Step 2: check the code from the email and sign in. */
export async function verifyCode(
  _prev: VerifyCodeState,
  formData: FormData,
): Promise<VerifyCodeState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const token = String(formData.get("code") ?? "").replace(/\D/g, "");
  if (token.length < 6 || token.length > 10) {
    return { status: "error", message: "Enter the code from the email." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error || !data.user) {
    return {
      status: "error",
      message:
        error?.status === 429
          ? friendlyAuthError(error.message, 429)
          : "That code is wrong or has expired. Check the latest email or send a new code.",
    };
  }

  redirect(await homeFor(data.user.id));
}

/** "Continue with Google": sends the browser to Google, back to /auth/callback. */
export async function signInWithGoogle() {
  if (!isSupabaseConfigured()) redirect("/login?error=google");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${siteUrl}/auth/callback` },
  });
  if (error || !data.url) redirect("/login?error=google");
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

function friendlyAuthError(message: string, status?: number): string {
  if (status === 429 || /rate limit|security purposes|seconds/i.test(message)) {
    return "Too many attempts. Wait a minute, then try again.";
  }
  if (/signups? not allowed|disabled/i.test(message)) {
    return "New sign-ups are paused right now. Try again later.";
  }
  return "Couldn’t send the email. Check the address and try again.";
}
