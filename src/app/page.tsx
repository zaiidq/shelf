import Link from "next/link";

// Placeholder home page until the real landing page is designed.
export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 px-page py-16">
      <h1 className="font-display text-7xl leading-[0.95] uppercase">Shelf</h1>
      <p className="text-lg leading-relaxed text-fg-2">
        Show who you are through what you love: your ranked favorite films, shows, books and music,
        on one page for your bio.
      </p>
      <p>
        <Link
          href="/zaid"
          className="inline-flex min-h-11 items-center rounded-full bg-accent px-5 font-semibold text-background"
        >
          See a demo shelf
        </Link>
      </p>
    </main>
  );
}
