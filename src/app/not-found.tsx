import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-5 px-page py-16">
      <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">404</p>
      <h1 className="font-display text-6xl leading-[0.95] uppercase">Nothing on this shelf</h1>
      <p className="text-base leading-relaxed text-fg-2">
        This page doesn’t exist, or the profile isn’t available.
      </p>
      <p>
        <Link href="/" className="inline-flex min-h-11 items-center underline underline-offset-4">
          Go to the home page
        </Link>
      </p>
    </main>
  );
}
