import type { Metadata } from "next";

import { AuthPage } from "../login/auth-page";

export const metadata: Metadata = { title: "Make your shelf" };

export default function SignupPage() {
  return (
    <AuthPage
      title="Make your shelf"
      intro="One page with the films, shows, books and music that say who you are. Free."
    />
  );
}
