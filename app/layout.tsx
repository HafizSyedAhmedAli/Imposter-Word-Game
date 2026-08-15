import type { Metadata, Viewport } from "next";
import "./globals.css";
import { GameSetupProvider } from "@/lib/game-setup-context";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "Imposter Word",
  description:
    "A pass-the-phone party game of secret words and not-so-secret imposters. Works fully offline, with AI-generated words when you're online.",
  applicationName: "Imposter Word",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "Imposter Word",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
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
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
