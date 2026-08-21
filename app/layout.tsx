// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { GameSetupProvider } from "@/lib/game-setup-context";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";
import SoundProvider from "@/components/pwa/SoundProvider";
import MenuMusicController from "@/components/pwa/MenuMusicController";

// ...metadata / viewport unchanged...

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-iw-void text-iw-ink-100">
        <GameSetupProvider>{children}</GameSetupProvider>
        <ServiceWorkerRegister />
        <SoundProvider />
        <MenuMusicController />
      </body>
    </html>
  );
}
