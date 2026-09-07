import MenuMusicController from "@/components/pwa/MenuMusicController";
import NativeSplashScreenController from "@/components/pwa/NativeSplashScreenController";
import PwaInstallAnalytics from "@/components/pwa/PwaInstallAnalytics";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";
import SoundProvider from "@/components/pwa/SoundProvider";
import { GameSetupProvider } from "@/lib/game-setup-context";
import PostHogProvider from "@/lib/posthog-provider";
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
        <NativeSplashScreenController />
        <ServiceWorkerRegister />
        <SoundProvider />
        <MenuMusicController />
        <PwaInstallAnalytics />
        {/* Free pageview charts, kept separate from the 10 custom
            product events -- see lib/analytics.ts and
            lib/posthog-provider.tsx, which now handle those instead of
            Vercel's own track(), so PostHog's dashboard shows the
            custom Events panel without a Pro-plan paywall. */}
        <PostHogProvider />
      </body>
    </html>
  );
}
