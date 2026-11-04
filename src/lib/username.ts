/**
 * Username rules. The same rules are enforced by the database
 * (supabase/migrations: profiles_username_format, profiles_username_dots,
 * private.reserved_usernames); these give instant, friendly feedback.
 */

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;

/**
 * Every app route and common word. Keep in sync with
 * private.reserved_usernames in supabase/migrations/*_publish_shelf.sql.
 */
export const RESERVED_USERNAMES: ReadonlySet<string> = new Set([
  // app routes and files
  "_next", "api", "auth", "login", "logout", "signin", "signout", "signup",
  "register", "onboarding", "settings", "account", "accounts", "edit", "new",
  "explore", "search", "about", "help", "support", "contact", "terms",
  "privacy", "legal", "credits", "report", "reports", "admin", "dashboard",
  "favicon.ico", "robots.txt", "sitemap.xml", "manifest.json", "manifest.webmanifest",
  "opengraph-image", "twitter-image", "icon", "apple-icon",
  // brand and common words
  "shelf", "shelves", "official", "team", "staff", "moderator", "mod",
  "root", "system", "www", "app", "static", "assets", "public", "images",
  "img", "home", "index", "feed", "blog", "news", "status", "security",
  "docs", "mail", "email", "profile", "profiles", "user", "users", "me",
  "null", "undefined", "notifications", "messages", "films", "shows",
  "books", "music", "currently",
]); // prettier-ignore

/**
 * A basic offensive-word filter. It is intentionally short and blunt: it
 * catches obvious slurs and profanity, not everything. Reports + admin
 * takedowns (is_hidden) handle the rest.
 */
const OFFENSIVE_FRAGMENTS = [
  "nigger", "nigga", "faggot", "fagot", "retard", "kike", "spic", "chink",
  "tranny", "whore", "slut", "cunt", "fuck", "shit", "bitch", "nazi", "hitler",
  "rape", "pedo", "porn", "dick", "cock", "pussy", "asshole",
]; // prettier-ignore

/** Fragments that are also parts of normal words ("scunthorpe problem"). */
const ALLOWED_CONTAINING = ["therapist", "grape", "drape", "scrape", "dickens", "cockpit", "peacock", "hancock", "spice", "spicy", "shitake", "shiitake"]; // prettier-ignore

function containsOffensiveWord(username: string): boolean {
  const plain = username.replace(/[._0-9]/g, "");
  if (ALLOWED_CONTAINING.some((word) => plain.includes(word))) return false;
  return OFFENSIVE_FRAGMENTS.some((fragment) => plain.includes(fragment));
}

export type UsernameProblem =
  "too_short" | "too_long" | "invalid_characters" | "dots" | "reserved" | "offensive";

/** Lowercases and trims what people type ("@Zaid " → "zaid"). */
export function normalizeUsername(input: string): string {
  return input.trim().replace(/^@/, "").toLowerCase();
}

/** Returns the first problem with a (normalized) username, or null if it's fine. */
export function checkUsernameRules(username: string): UsernameProblem | null {
  if (username.length < USERNAME_MIN) return "too_short";
  if (username.length > USERNAME_MAX) return "too_long";
  if (!/^[a-z0-9_.]+$/.test(username)) return "invalid_characters";
  if (/^\.|\.$|\.\./.test(username)) return "dots";
  if (RESERVED_USERNAMES.has(username)) return "reserved";
  if (containsOffensiveWord(username)) return "offensive";
  return null;
}

export const USERNAME_MESSAGES: Record<UsernameProblem | "taken", string> = {
  too_short: `Use at least ${USERNAME_MIN} characters.`,
  too_long: `Use at most ${USERNAME_MAX} characters.`,
  invalid_characters: "Use only lowercase letters, numbers, _ and .",
  dots: "A dot can’t be first, last, or next to another dot.",
  reserved: "That name is reserved. Try another.",
  offensive: "That name isn’t allowed. Try another.",
  taken: "That name is taken. Try another.",
};
