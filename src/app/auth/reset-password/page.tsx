import type { Metadata } from "next";
import { PasswordResetPanel } from "@/components/password-reset-panel";

export const metadata: Metadata = {
  title: "Reset Password",
};

export default function ResetPasswordPage() {
  return <PasswordResetPanel />;
}
