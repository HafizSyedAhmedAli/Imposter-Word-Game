import MenuMusicController from "@/components/pwa/MenuMusicController";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";
import SoundProvider from "@/components/pwa/SoundProvider";
import { GameSetupProvider } from "@/lib/game-setup-context";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
