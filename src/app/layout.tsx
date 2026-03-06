import type { Metadata } from "next";
import { DM_Sans, Press_Start_2P, VT323 } from "next/font/google";
import { AuthProvider } from "@/lib/auth/context";
import { ClientMigration } from "@/components/client-migration";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const pressStart = Press_Start_2P({
  variable: "--font-retro-heading",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const vt323 = VT323({
  variable: "--font-retro-body",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "StoryWeaver - AI Story Generation Platform",
  description: "Create platform-optimized narrative content with AI-powered generation tools",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${pressStart.variable} ${vt323.variable}`}
    >
      <body>
        <ClientMigration />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
