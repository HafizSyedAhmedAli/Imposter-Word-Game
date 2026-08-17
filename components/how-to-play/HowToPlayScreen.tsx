import SpaceBackdrop from "@/components/home/SpaceBackdrop";
import HowToPlayHeader from "./HowToPlayHeader";
import IntroSection from "./IntroSection";
import GoalCards from "./GoalCards";
import RoundStepsSection from "./RoundStepsSection";
import CrewGuideCard from "./CrewGuideCard";
import ImposterGuideCard from "./ImposterGuideCard";
import PassPhoneGuideSection from "./PassPhoneGuideSection";
import DiscussionGuideSection from "./DiscussionGuideSection";
import VotingGuideSection from "./VotingGuideSection";
import EliminationGuideSection from "./EliminationGuideSection";
import MultipleImpostersSection from "./MultipleImpostersSection";
import WinConditionsSection from "./WinConditionsSection";
import OfflineSection from "./OfflineSection";
import QuickTipsSection from "./QuickTipsSection";
import HowToPlayCTA from "./HowToPlayCTA";

/**
 * No client-only state or effects live in this screen itself, so it's a
 * plain server component -- the one client piece (ConnectionStatus,
 * inside HowToPlayHeader) is a self-contained client component and works
 * fine nested here, same as it does inside SettingsHeader.
 *
 * Reading order follows the spec's recommended structure: what it is ->
 * the goal -> how a round works -> Crew -> Imposter -> Pass the Phone ->
 * Discussion -> Voting -> Elimination -> Multiple Imposters -> How to
 * Win -> Offline Play -> Quick Tips -> Start Playing.
 */
export default function HowToPlayScreen() {
  return (
    <div className="relative flex min-h-dvh w-full justify-center">
      <SpaceBackdrop />

      <div className="flex w-full max-w-[1400px] flex-col px-4 pl-safe pr-safe pt-safe pb-safe sm:px-6 sm:py-8 lg:px-10">
        <HowToPlayHeader />

        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 py-6 lg:max-w-4xl">
          <IntroSection />
          <GoalCards />
          <RoundStepsSection />
          <CrewGuideCard />
          <ImposterGuideCard />
          <PassPhoneGuideSection />
          <DiscussionGuideSection />
          <VotingGuideSection />
          <EliminationGuideSection />
          <MultipleImpostersSection />
          <WinConditionsSection />
          <OfflineSection />
          <QuickTipsSection />
          <HowToPlayCTA />
        </main>
      </div>
    </div>
  );
}
