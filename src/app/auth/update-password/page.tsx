import type { Metadata } from "next";
import { UpdatePasswordPanel } from "@/components/update-password-panel";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Update Password",
  description: "Choose a new password for your StayWise account.",
  robots: noIndexRobots,
};

export default function UpdatePasswordPage() {
  return <UpdatePasswordPanel />;
}
