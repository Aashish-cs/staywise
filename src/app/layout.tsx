import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "StayWise",
    template: "%s | StayWise",
  },
  description:
    "Smart Stays, Better Days. AI-ranked short-term stays for guests and production-ready host workflows.",
  openGraph: {
    title: "StayWise: Smart Stays, Better Days.",
    description:
      "Smart Stays, Better Days. AI-ranked short-term stays for guests and production-ready host workflows.",
    siteName: "StayWise",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
