import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ProfileView } from "@/components/profile/profile-view";
import { DEMO_USERNAME } from "@/lib/profile/demo";
import { getPublicProfile } from "@/lib/profile/get-public-profile";

/**
 * Profile pages are fully static: built once, served from the CDN, refreshed
 * in the background (see cacheLife in getPublicProfile). The build fails if
 * anything per-request (cookies, uncached data) sneaks into this route.
 */
export const ensureStatic = "navigation";

/** Pre-build the demo profile; other profiles are built on first visit. */
export async function generateStaticParams() {
  return [{ username: DEMO_USERNAME }];
}

async function loadProfile(params: PageProps<"/[username]">["params"]) {
  const { username } = await params;
  let decoded: string;
  try {
    decoded = decodeURIComponent(username);
  } catch {
    return null; // malformed URL like "/%E0"
  }
  return getPublicProfile(decoded.toLowerCase());
}

export async function generateMetadata({ params }: PageProps<"/[username]">): Promise<Metadata> {
  const profile = await loadProfile(params);
  if (!profile) return { title: "Not found" };

  const title = `${profile.displayName} (@${profile.username})`;
  const description =
    profile.bio ?? `${profile.displayName}'s favorite films, shows, books and music.`;
  return {
    title,
    description,
    alternates: { canonical: `/${profile.username}` },
    openGraph: { title: `${profile.displayName}'s Shelf`, description, type: "profile" },
  };
}

/**
 * The URL is read inside <Suspense>, as Next.js recommends: the page's
 * shell can then be shown instantly on navigation while the profile loads.
 * (Visits from a link still get the fully prerendered page.)
 */
export default function ProfilePage({ params }: PageProps<"/[username]">) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <Profile params={params} />
    </Suspense>
  );
}

async function Profile({ params }: Pick<PageProps<"/[username]">, "params">) {
  const profile = await loadProfile(params);
  if (!profile) notFound();
  return <ProfileView profile={profile} />;
}
