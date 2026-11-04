import Link from "next/link";

import { primaryButton, secondaryButton, textButton } from "@/components/ui/styles";

// Placeholder home page until the real landing page is designed.
export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 px-page py-16">
      <h1 className="font-display text-7xl leading-[0.95] uppercase">Shelf</h1>
      <p className="text-lg leading-relaxed text-fg-2">
        Show who you are through what you love: your ranked favorite films, shows, books and music,
        on one page for your bio.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/signup" className={primaryButton}>
          Make your shelf
        </Link>
        <Link href="/zaid" className={secondaryButton}>
          See a demo shelf
        </Link>
      </div>
      <p className="text-sm text-muted">
        Already have one?{" "}
        <Link href="/login" className={textButton}>
          Sign in
        </Link>
      </p>
    </main>
  );
}
