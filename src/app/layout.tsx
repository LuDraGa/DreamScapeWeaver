import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth/context";
import "./globals.css";

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
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
