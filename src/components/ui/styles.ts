/**
 * Shared class names for form controls, so buttons and inputs look the same
 * everywhere. All controls are at least 44px tall (touch targets).
 */

export const primaryButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-6 text-[15px] font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

export const secondaryButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-line bg-surface px-6 text-[15px] font-medium text-fg transition-colors hover:border-muted disabled:cursor-not-allowed disabled:opacity-50";

export const textButton =
  "inline-flex min-h-11 items-center text-sm text-fg-2 underline decoration-fg-2/40 underline-offset-4 hover:text-fg disabled:opacity-50";

export const label = "text-sm font-medium text-fg-2";

export const input =
  "min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-base text-fg placeholder:text-muted focus-visible:border-accent focus-visible:outline-none aria-[invalid=true]:border-[#f07a5a]";

export const hint = "text-[13px] leading-snug text-muted";

export const errorText = "text-[13px] leading-snug text-[#f4a28c]";
