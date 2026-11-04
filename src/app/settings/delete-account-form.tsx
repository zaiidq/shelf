"use client";

import { useActionState, useId } from "react";

import { errorText, hint, input, label } from "@/components/ui/styles";

import { deleteAccount, type DeleteState } from "./actions";

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState<DeleteState, FormData>(deleteAccount, {
    status: "idle",
  });
  const inputId = useId();

  return (
    <form action={action} className="flex flex-col gap-3">
      <p className={hint}>
        This permanently deletes your shelf, your photo and your account. It can’t be undone.
      </p>
      <label htmlFor={inputId} className={label}>
        Type DELETE to confirm
      </label>
      <input
        id={inputId}
        name="confirm"
        className={input}
        autoComplete="off"
        autoCapitalize="characters"
        aria-invalid={state.status === "error"}
        aria-describedby={state.status === "error" ? `${inputId}-error` : undefined}
      />
      {state.status === "error" ? (
        <p id={`${inputId}-error`} role="alert" className={errorText}>
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#f07a5a] px-6 text-[15px] font-semibold text-[#f4a28c] hover:bg-[#f07a5a]/10 disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Delete my account"}
      </button>
    </form>
  );
}
