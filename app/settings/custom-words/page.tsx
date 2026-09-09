import type { Metadata } from "next";
import CustomWordsScreen from "@/components/settings/custom-words/CustomWordsScreen";

export const metadata: Metadata = {
  title: "Custom Words — Imposter Word Game",
  description: "Add and manage your own secret words for Imposter Word Game.",
};

export default function CustomWordsPage() {
  return <CustomWordsScreen />;
}
