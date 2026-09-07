import type { Metadata } from "next";
import { UpdatePasswordPanel } from "@/components/update-password-panel";

export const metadata: Metadata = {
  title: "Update Password",
};

export default function UpdatePasswordPage() {
  return <UpdatePasswordPanel />;
}
