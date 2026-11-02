// features/install-pwa — public API. Import from "@/features/install-pwa",
// never reach into "@/features/install-pwa/ui/*" or "/model/*" from
// outside this slice.
//
// `useInstallPrompt` is deliberately NOT exported: both install UIs
// below live in this slice and are its only consumers.
export { default as InstallAppButton } from "./ui/InstallAppButton";
export { default as InstallAppCard } from "./ui/InstallAppCard";
export { default as PwaInstallAnalytics } from "./ui/PwaInstallAnalytics";
