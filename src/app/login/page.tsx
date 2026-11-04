import type { Metadata } from "next";

import { AuthPage } from "./auth-page";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthPage
      title="Sign in"
      intro="New here? Signing in with your email creates your shelf, too."
    />
  );
}
