"use client";

import dynamic from "next/dynamic";

/**
 * The wizard restores progress from this browser's storage, which only
 * exists in the browser, so it renders on the client only.
 */
const OnboardingWizard = dynamic(() => import("./wizard").then((m) => m.OnboardingWizard), {
  ssr: false,
  loading: () => <p className="text-sm text-muted">Loading…</p>,
});

export function WizardLoader({ userId }: { userId: string }) {
  return <OnboardingWizard userId={userId} />;
}
