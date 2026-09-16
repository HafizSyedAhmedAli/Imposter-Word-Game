import type { Metadata } from "next";
import StatisticsScreen from "@/components/statistics/StatisticsScreen";

export const metadata: Metadata = {
  title: "Statistics — Imposter Word Game",
  description: "Your local game history and statistics for Imposter Word Game.",
};

export default function StatisticsPage() {
  return <StatisticsScreen />;
}
