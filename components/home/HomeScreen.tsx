import { BookOpenText, Users, BarChart3 } from "lucide-react";
import SpaceBackdrop from "./SpaceBackdrop";
import HomeHeader from "./HomeHeader";
import GameLogo from "./GameLogo";
import PrimaryPlayButton from "./PrimaryPlayButton";
import HomeMenuItem from "./HomeMenuItem";
import OfflineAiCard from "./OfflineAiCard";
import HomeFooter from "./HomeFooter";

export default function HomeScreen() {
  return (
    <div className="relative flex min-h-dvh w-full justify-center">
      <SpaceBackdrop />

      <div className="flex w-full max-w-md flex-col px-4 pl-safe pr-safe pt-safe pb-safe sm:px-6 sm:py-8">
        <HomeHeader />

        <main className="flex flex-1 flex-col items-center justify-center gap-7 py-6">
          <GameLogo />

          <div className="flex w-full flex-col gap-3">
            <PrimaryPlayButton />

            <nav
              aria-label="Main menu"
              className="flex flex-col gap-2.5 animate-iw-fade-up"
              style={{ animationDelay: "220ms" }}
            >
              <HomeMenuItem
                href="/how-to-play"
                icon={BookOpenText}
                title="HOW TO PLAY"
                subtitle="Learn the rules"
              />
              <HomeMenuItem
                href="/settings"
                icon={Users}
                title="GAME SETTINGS"
                subtitle="Timers, sounds and more"
              />
              <HomeMenuItem
                href="/statistics"
                icon={BarChart3}
                title="STATISTICS"
                subtitle="View your game stats"
              />
            </nav>
          </div>

          <OfflineAiCard />
        </main>

        <HomeFooter />
      </div>
    </div>
  );
}
