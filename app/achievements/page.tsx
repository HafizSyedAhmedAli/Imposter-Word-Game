import type { Metadata } from "next";
import AchievementsScreen from "@/components/achievements/AchievementsScreen";

export const metadata: Metadata = {
  title: "Achievements — Imposter Word Game",
  description:
    "Local badges and challenges earned from your Imposter Word Game history.",
};

export default function AchievementsPage() {
  return <AchievementsScreen />;
}
