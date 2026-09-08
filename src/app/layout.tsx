import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
