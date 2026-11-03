import type { PublicProfile } from "@/lib/profile/types";

import { NowPlayingCard } from "./now-playing-card";
import { ProfileFooter } from "./profile-footer";
import { ProfileHeader } from "./profile-header";
import { ShelfSection } from "./shelf-section";

/**
 * The public profile page. Server-rendered only: no JavaScript is sent to the
 * visitor for this view, which keeps it fast in Instagram's in-app browser.
 */
export function ProfileView({ profile }: { profile: PublicProfile }) {
  return (
    <div data-accent={profile.accent} className="min-h-dvh pb-10">
      <ProfileHeader profile={profile} />
      <main className="mx-auto flex w-full max-w-[640px] flex-col gap-section px-page pt-[44px] motion-safe:animate-fade-in">
        {profile.nowPlaying ? <NowPlayingCard nowPlaying={profile.nowPlaying} /> : null}
        {profile.sections.map((section, index) => (
          <ShelfSection key={section.id} section={section} isFirst={index === 0} />
        ))}
        <ProfileFooter links={profile.links} />
      </main>
    </div>
  );
}
