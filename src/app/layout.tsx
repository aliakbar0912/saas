import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { QueryProvider } from "@/components/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nexus — AI Social Media Automation Platform",
  description:
    "Connect your social accounts, let AI create your content, engage with your audience, and automate your social workflow — all from one intelligent workspace.",
  keywords: [
    "AI social media",
    "social automation",
    "content creation",
    "AI marketing",
    "social scheduling",
    "AI workspace",
  ],
  authors: [{ name: "Nexus" }],
  openGraph: {
    title: "Nexus — AI Social Media Automation Platform",
    description:
      "Your social media, on autopilot. Connect accounts, generate content, and automate engagement — all from one intelligent workspace.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <QueryProvider>
          {children}
        </QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
