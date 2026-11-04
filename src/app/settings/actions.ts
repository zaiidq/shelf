"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser, getOwnUsername } from "@/lib/auth";
import { profileCacheTag } from "@/lib/profile/get-public-profile";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DeleteState = { status: "idle" } | { status: "error"; message: string };

/**
 * Permanently deletes the account: uploaded images, then the auth user.
 * The profile, sections, entries and links go with it (ON DELETE CASCADE).
 */
export async function deleteAccount(_prev: DeleteState, formData: FormData): Promise<DeleteState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (
    String(formData.get("confirm") ?? "")
      .trim()
      .toLowerCase() !== "delete"
  ) {
    return { status: "error", message: "Type DELETE to confirm." };
  }

  const username = await getOwnUsername(user.id);
  const admin = createSupabaseAdminClient();

  // Remove the user's files from both buckets.
  for (const bucket of ["avatars", "covers"] as const) {
    const { data: files } = await admin.storage.from(bucket).list(user.id, { limit: 1000 });
    if (files && files.length > 0) {
      await admin.storage.from(bucket).remove(files.map((file) => `${user.id}/${file.name}`));
    }
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("[deleteAccount]", error);
    return { status: "error", message: "Couldn’t delete your account. Try again." };
  }

  // End this browser's session and take the public page down right away.
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  if (username) updateTag(profileCacheTag(username));
  redirect("/");
}
