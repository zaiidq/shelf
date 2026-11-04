import Image from "next/image";

import { isOptimizableImage } from "@/lib/image-hosts";

import type { PublicProfile } from "@/lib/profile/types";

/** Smaller type for longer names so they never overflow a phone screen. */
function nameSizeClass(name: string): string {
  const longestWord = Math.max(...name.split(/\s+/).map((word) => word.length));
  if (longestWord > 12) return "text-[44px] sm:text-[64px]";
  if (longestWord > 8) return "text-[56px] sm:text-[80px]";
  return "text-[72px] sm:text-[96px]";
}

export function ProfileHeader({ profile }: { profile: PublicProfile }) {
  const { displayName, username, location, bio, avatarUrl, coverUrl } = profile;
  const initial = Array.from(displayName.trim() || username)[0]?.toUpperCase() ?? "?";

  return (
    <header className="relative isolate flex min-h-[340px] flex-col justify-end sm:min-h-[420px]">
      {/* Cover: uploaded image, else #1 film backdrop, else a warm dark fallback. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
        {coverUrl ? (
          <Image
            src={coverUrl}
            unoptimized={!isOptimizableImage(coverUrl)}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(120%_90%_at_70%_0%,#3a2e22_0%,#2a2219_45%,#0e0e10_100%)]" />
        )}
        {/* Fade the cover into the page background. */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgb(14_14_16/0.15)_0%,rgb(14_14_16/0.55)_45%,#0e0e10_100%)]" />
      </div>

      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-2.5 px-page pb-6">
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              unoptimized={!isOptimizableImage(avatarUrl)}
              alt={displayName}
              width={48}
              height={48}
              priority
              className="size-12 rounded-full object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex size-12 items-center justify-center rounded-full bg-accent font-display text-[22px] text-background"
            >
              {initial}
            </div>
          )}
          <p className="text-[13px] text-muted">
            @{username}
            {location ? (
              <>
                {" · "}
                <span dir="auto">{location}</span>
              </>
            ) : null}
          </p>
        </div>

        <h1
          dir="auto"
          className={`font-display leading-[0.95] tracking-[0.01em] break-words uppercase ${nameSizeClass(displayName)}`}
        >
          {displayName}
        </h1>

        {bio ? (
          <p dir="auto" className="max-w-[52ch] text-[15px] leading-[1.45] text-fg-2">
            {bio}
          </p>
        ) : null}
      </div>
    </header>
  );
}
