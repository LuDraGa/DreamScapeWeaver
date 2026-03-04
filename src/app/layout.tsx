import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { AuthProvider } from "@/lib/auth/context";
import { ClientMigration } from "@/components/client-migration";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
    <html lang="en" className={dmSans.className}>
      <body>
        <ClientMigration />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
