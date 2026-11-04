import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { getCurrentUser, getOwnUsername } from "@/lib/auth";

import { WizardLoader } from "./wizard-loader";

export const metadata: Metadata = { title: "Make your shelf", robots: { index: false } };

export default function OnboardingPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col gap-8 px-page pt-10 pb-16">
      <Link href="/" className="self-start font-display text-2xl uppercase">
        Shelf
      </Link>
      {/* Reading the session happens per request, so it streams in here. */}
      <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
        <Onboarding />
      </Suspense>
    </main>
  );
}

async function Onboarding() {
  // Per-person page: render at request time, never during prerendering.
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Already published? Go to the shelf instead.
  const username = await getOwnUsername(user.id);
  if (username) redirect(`/${username}`);

  return <WizardLoader userId={user.id} />;
}
