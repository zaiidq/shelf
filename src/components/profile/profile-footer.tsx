import Link from "next/link";

import { platformLabel } from "@/lib/profile/labels";
import type { SocialLink } from "@/lib/profile/types";

/** Social links last and small, then the Shelf wordmark. */
export function ProfileFooter({ links }: { links: SocialLink[] }) {
  return (
    <footer className="flex flex-col gap-4 border-t border-line pt-3.5">
      {links.length > 0 ? (
        <nav aria-label="Social links">
          <ul className="flex flex-wrap gap-x-[18px] text-[13px]">
            {links.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  rel="me noopener noreferrer"
                  target="_blank"
                  className="inline-flex min-h-11 items-center text-fg underline decoration-fg/40 underline-offset-4 hover:text-white hover:decoration-white"
                >
                  {platformLabel(link.platform)}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
      <Link
        href="/"
        className="inline-flex min-h-11 items-center self-start text-xs text-faint hover:text-fg-2"
      >
        shelf
      </Link>
    </footer>
  );
}
