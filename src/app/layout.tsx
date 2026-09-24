import type { Metadata } from "next";
import { ToastViewport } from "@/components/ui/toast";
import { siteUrl } from "@/lib/seo";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const siteDescription =
  "Smart Stays, Better Days. AI-ranked short-term stays for guests and production-ready host workflows.";

export const metadata: Metadata = {
  applicationName: "StayWise",
  metadataBase: siteUrl,
  title: {
    default: "StayWise",
    template: "%s | StayWise",
  },
  description: siteDescription,
  keywords: [
    "StayWise",
    "Smart Stays Better Days",
    "AI travel search",
    "short-term rentals",
    "vacation rentals",
    "senior design project",
  ],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "StayWise: Smart Stays, Better Days.",
    description: siteDescription,
    url: "/",
    siteName: "StayWise",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "StayWise: Smart Stays, Better Days.",
    description: siteDescription,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        {children}
        <ToastViewport />
      </body>
    </html>
  );
}
