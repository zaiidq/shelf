"use client";

import { useSearchParams } from "next/navigation";
import { useActionState, useState, useSyncExternalStore } from "react";

import {
  errorText,
  hint,
  input,
  label,
  primaryButton,
  secondaryButton,
  textButton,
} from "@/components/ui/styles";

import {
  sendCode,
  signInWithGoogle,
  verifyCode,
  type SendCodeState,
  type VerifyCodeState,
} from "./actions";

const URL_ERRORS: Record<string, string> = {
  link: "That sign-in link is invalid or has expired. Send a new code below.",
  google: "Google sign-in didn’t finish. Try again, or use your email.",
};

/**
 * Google blocks sign-in inside apps' built-in browsers (Instagram, TikTok,
 * Facebook…). There we hide the Google button and point to the email code.
 */
const IN_APP_BROWSER = /Instagram|FBAN|FBAV|FB_IAB|TikTok|musical_ly|Bytedance|Snapchat|Line\//i;
const subscribeNever = () => () => {};
function useIsInAppBrowser(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => IN_APP_BROWSER.test(navigator.userAgent),
    () => false,
  );
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const urlError = URL_ERRORS[searchParams.get("error") ?? ""];
  const inAppBrowser = useIsInAppBrowser();

  const [sendState, sendAction, sending] = useActionState<SendCodeState, FormData>(sendCode, {
    status: "idle",
  });
  const [verifyState, verifyAction, verifying] = useActionState<VerifyCodeState, FormData>(
    verifyCode,
    { status: "idle" },
  );
  // Lets "Use a different email" go back to step 1 without a server call.
  const [editingEmail, setEditingEmail] = useState(false);

  const codeSentTo = sendState.status === "sent" && !editingEmail ? sendState.email : null;

  if (codeSentTo) {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-[15px] leading-relaxed text-fg-2">
          We sent a code to <strong className="font-semibold text-fg">{codeSentTo}</strong>. Enter
          it here, or tap the link in the email.
        </p>

        <form action={verifyAction} className="flex flex-col gap-4">
          <input type="hidden" name="email" value={codeSentTo} />
          <div className="flex flex-col gap-2">
            <label htmlFor="code" className={label}>
              Code from the email
            </label>
            <input
              id="code"
              name="code"
              className={`${input} text-center text-2xl tracking-[0.4em] tabular-nums`}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9 ]*"
              maxLength={12}
              required
              autoFocus
              aria-invalid={verifyState.status === "error"}
              aria-describedby={verifyState.status === "error" ? "code-error" : undefined}
            />
            {verifyState.status === "error" ? (
              <p id="code-error" role="alert" className={errorText}>
                {verifyState.message}
              </p>
            ) : null}
          </div>
          <button type="submit" className={primaryButton} disabled={verifying}>
            {verifying ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="flex flex-wrap gap-x-6">
          <form action={sendAction}>
            <input type="hidden" name="email" value={codeSentTo} />
            <button type="submit" className={textButton} disabled={sending}>
              {sending ? "Sending…" : "Send a new code"}
            </button>
          </form>
          <button type="button" className={textButton} onClick={() => setEditingEmail(true)}>
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  const emailError = sendState.status === "error" ? sendState.message : null;
  const previousEmail =
    sendState.status === "sent" || sendState.status === "error" ? sendState.email : undefined;

  return (
    <div className="flex flex-col gap-6">
      {urlError ? (
        <p role="alert" className={errorText}>
          {urlError}
        </p>
      ) : null}

      {inAppBrowser ? (
        <p className={hint}>
          Google sign-in doesn’t work inside this app’s browser. Use your email below, or open this
          page in Safari or Chrome.
        </p>
      ) : (
        <>
          <form action={signInWithGoogle}>
            <button type="submit" className={`${secondaryButton} w-full`}>
              <GoogleIcon />
              Continue with Google
            </button>
          </form>
          <div className="flex items-center gap-3 text-xs text-muted" aria-hidden="true">
            <span className="h-px flex-1 bg-line" />
            or
            <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}

      <form
        action={(formData) => {
          setEditingEmail(false);
          sendAction(formData);
        }}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className={label}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className={input}
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            defaultValue={previousEmail}
            required
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? "email-error" : "email-hint"}
          />
          {emailError ? (
            <p id="email-error" role="alert" className={errorText}>
              {emailError}
            </p>
          ) : (
            <p id="email-hint" className={hint}>
              We’ll email you a code. No password needed.
            </p>
          )}
        </div>
        <button type="submit" className={primaryButton} disabled={sending}>
          {sending ? "Sending…" : "Email me a code"}
        </button>
      </form>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}
