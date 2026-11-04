import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { secondaryButton } from "@/components/ui/styles";
import { getCurrentUser, getOwnUsername } from "@/lib/auth";

import { signOut } from "../login/actions";
import { DeleteAccountForm } from "./delete-account-form";

export const metadata: Metadata = { title: "Settings", robots: { index: false } };

/** Account things only. Everything about the shelf itself is edited in place. */
export default function SettingsPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col gap-10 px-page pt-10 pb-16">
      <Link href="/" className="self-start font-display text-2xl uppercase">
        Shelf
      </Link>
      <h1 className="font-display text-[44px] leading-[0.95] uppercase">Settings</h1>
      <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
        <Account />
      </Suspense>
    </main>
  );
}

async function Account() {
  // Per-person page: render at request time, never during prerendering.
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const username = await getOwnUsername(user.id);

  return (
    <>
      <section aria-labelledby="account-heading" className="flex flex-col gap-4">
        <h2 id="account-heading" className="text-sm font-semibold tracking-wide text-fg-2">
          Account
        </h2>
        <dl className="flex flex-col gap-1 border-t border-line pt-4">
          <dt className="text-[13px] text-muted">Email</dt>
          <dd className="text-[15px]">{user.email ?? "—"}</dd>
        </dl>
        {username ? (
          <p className="text-[15px]">
            Your shelf:{" "}
            <Link href={`/${username}`} className="underline underline-offset-4">
              /{username}
            </Link>
          </p>
        ) : (
          <p className="text-[15px]">
            You haven’t published a shelf yet.{" "}
            <Link href="/onboarding" className="underline underline-offset-4">
              Make it now
            </Link>
          </p>
        )}
        <form action={signOut}>
          <button type="submit" className={secondaryButton}>
            Sign out
          </button>
        </form>
      </section>

      <section aria-labelledby="delete-heading" className="flex flex-col gap-4">
        <h2 id="delete-heading" className="text-sm font-semibold tracking-wide text-fg-2">
          Delete account
        </h2>
        <DeleteAccountForm />
      </section>
    </>
  );
}
