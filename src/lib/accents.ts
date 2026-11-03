/**
 * The fixed accent palette a user can pick from.
 * Every color keeps at least 4.5:1 contrast for small text on #0E0E10.
 *
 * Keep in sync with:
 *  - the [data-accent] rules in src/app/globals.css
 *  - the profiles_accent_valid check in supabase/migrations
 */
export const ACCENTS = {
  amber: { label: "Amber", hex: "#E8B04B" }, // 9.9:1
  sky: { label: "Sky", hex: "#6CB6FF" }, // 9.0:1
  mint: { label: "Mint", hex: "#5FD3A5" }, // 10.4:1
  coral: { label: "Coral", hex: "#F07A5A" }, // 7.0:1
  lilac: { label: "Lilac", hex: "#B79CFF" }, // 8.5:1
  rose: { label: "Rose", hex: "#F47FA8" }, // 7.8:1
  lime: { label: "Lime", hex: "#B5D95A" }, // 12.0:1
} as const;

export type AccentKey = keyof typeof ACCENTS;

export const DEFAULT_ACCENT: AccentKey = "amber";

export function isAccentKey(value: unknown): value is AccentKey {
  return typeof value === "string" && Object.hasOwn(ACCENTS, value);
}
