import type { Metadata } from "next";
import { PasswordResetPanel } from "@/components/password-reset-panel";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Request a StayWise password reset email.",
  robots: noIndexRobots,
};

export default function ResetPasswordPage() {
  return <PasswordResetPanel />;
}
