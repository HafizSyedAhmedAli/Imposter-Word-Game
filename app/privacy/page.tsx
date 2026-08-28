import type { Metadata } from "next";
import PrivacyPolicyScreen from "@/components/privacy/PrivacyPolicyScreen";

export const metadata: Metadata = {
  title: "Privacy Policy — Imposter Word Game",
  description:
    "How Imposter Word Game handles information: what stays on your device and what's sent to generate words.",
};

export default function PrivacyPage() {
  return <PrivacyPolicyScreen />;
}