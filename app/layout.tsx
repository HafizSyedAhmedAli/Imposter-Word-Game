import type { Metadata, Viewport } from "next";
import "./globals.css";
import { GameSetupProvider } from "@/lib/game-setup-context";

export const metadata: Metadata = {
  title: "Imposter Word",
  description:
    "A pass-the-phone party game of secret words and not-so-secret imposters. Works fully offline, with AI-generated words when you're online.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#05051a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-iw-void text-iw-ink-100">
        <GameSetupProvider>{children}</GameSetupProvider>
      </body>
    </html>
  );
}
