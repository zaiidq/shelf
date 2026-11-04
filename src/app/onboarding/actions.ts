"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser, getOwnUsername } from "@/lib/auth";
import { profileCacheTag } from "@/lib/profile/get-public-profile";
import type { EntryStatus, SectionKind } from "@/lib/profile/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkUsernameRules, normalizeUsername, USERNAME_MESSAGES } from "@/lib/username";

export type UsernameCheck = { ok: true; username: string } | { ok: false; message: string };

/** Live check while typing: rules first, then "is it taken?". */
export async function checkUsername(raw: string): Promise<UsernameCheck> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Your session ended. Sign in again." };

  const username = normalizeUsername(String(raw).slice(0, 60));
  const problem = checkUsernameRules(username);
  if (problem) return { ok: false, message: USERNAME_MESSAGES[problem] };

  // The admin client also sees hidden profiles, whose names are taken too.
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (error) return { ok: false, message: "Couldn’t check that name. Try again." };
  if (data && data.id !== user.id) return { ok: false, message: USERNAME_MESSAGES.taken };
  return { ok: true, username };
}

export type PublishInput = {
  username: string;
  displayName: string;
  bio: string;
  avatarPath: string | null;
  sectionKind: SectionKind;
  items: {
    mediaItemId: string;
    status: EntryStatus;
    rating: number | null;
    whyILoveIt: string;
    progress: string;
  }[];
};

export type PublishResult = { ok: false; message: string; field?: "username" };

const SECTION_KINDS: ReadonlySet<string> = new Set(["films", "shows", "books", "music"]);
const STATUSES: ReadonlySet<string> = new Set([
  "favorite", "watching", "reading", "listening", "playing", "completed", "dropped", "want",
]); // prettier-ignore
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Creates the profile, its sections and first items in one database
 * transaction (publish_shelf), then opens the new page.
 */
export async function publishShelf(input: PublishInput): Promise<PublishResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Your session ended. Sign in again." };

  const existing = await getOwnUsername(user.id);
  if (existing) redirect(`/${existing}`);

  // Validate everything again on the server; never trust the browser.
  const username = normalizeUsername(String(input.username ?? ""));
  const problem = checkUsernameRules(username);
  if (problem) return { ok: false, message: USERNAME_MESSAGES[problem], field: "username" };

  const displayName = String(input.displayName ?? "").trim();
  if (displayName.length < 1 || displayName.length > 50) {
    return { ok: false, message: "Add your name (up to 50 characters)." };
  }
  const bio = String(input.bio ?? "").trim();
  if (bio.length > 160) return { ok: false, message: "Keep your bio under 160 characters." };

  const avatarPath = input.avatarPath ? String(input.avatarPath) : null;
  if (avatarPath && !avatarPath.startsWith(`${user.id}/`)) {
    return { ok: false, message: "That photo can’t be used. Upload it again." };
  }

  if (!SECTION_KINDS.has(input.sectionKind)) return { ok: false, message: "Pick a section." };

  const items = Array.isArray(input.items) ? input.items.slice(0, 50) : [];
  if (items.length < 3) return { ok: false, message: "Add at least 3 favorites first." };
  for (const item of items) {
    const ratingOk =
      item.rating === null ||
      (Number.isInteger(item.rating) && item.rating >= 1 && item.rating <= 5);
    if (
      !UUID.test(String(item.mediaItemId)) ||
      !STATUSES.has(item.status) ||
      !ratingOk ||
      String(item.whyILoveIt ?? "").length > 280 ||
      String(item.progress ?? "").length > 40
    ) {
      return {
        ok: false,
        message: "One of your items has invalid details. Remove it and add it again.",
      };
    }
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("publish_shelf", {
    p_username: username,
    p_display_name: displayName,
    p_bio: bio,
    p_avatar_path: avatarPath ?? undefined,
    p_section_kind: input.sectionKind,
    p_items: items.map((item) => ({
      media_item_id: item.mediaItemId,
      status: item.status,
      rating: item.rating,
      why_i_love_it: String(item.whyILoveIt ?? "").trim() || null,
      progress: String(item.progress ?? "").trim() || null,
    })),
  });

  if (error || !data) {
    console.error("[publishShelf]", error);
    if (error?.code === "23505" && /username/i.test(error.message)) {
      return { ok: false, message: USERNAME_MESSAGES.taken, field: "username" };
    }
    if (/reserved/i.test(error?.message ?? "")) {
      return { ok: false, message: USERNAME_MESSAGES.reserved, field: "username" };
    }
    if (/already has a shelf/i.test(error?.message ?? "")) {
      redirect("/onboarding");
    }
    return { ok: false, message: "Couldn’t publish your shelf. Try again." };
  }

  // The page may have been cached as "not found" before; refresh it now.
  updateTag(profileCacheTag(data));
  redirect(`/${data}`);
}
