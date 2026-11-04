import Link from "next/link";
import { Suspense } from "react";

import { LoginForm } from "./login-form";

/** Shared layout for /login and /signup: same form, different words. */
export function AuthPage({ title, intro }: { title: string; intro: string }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col gap-8 px-page pt-16 pb-12">
      <Link href="/" className="self-start font-display text-2xl uppercase">
        Shelf
      </Link>
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-[44px] leading-[0.95] uppercase">{title}</h1>
        <p className="text-[15px] leading-relaxed text-fg-2">{intro}</p>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
