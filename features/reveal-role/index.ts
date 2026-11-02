// features/reveal-role — public API. Import from "@/features/reveal-role",
// never reach into "@/features/reveal-role/ui/*" from outside this slice.
//
// Anti-tell invariant (do not break when editing anything below): the
// crew card (PlayerRevealCard) and the imposter card (ImposterRevealCard)
// must be indistinguishable to a bystander -- identical hold timing
// before "HIDE & PASS PHONE" enables, identical progress-bar markup, and
// no role-specific sound (PassPhoneScreen plays the same chime for both).
// ImposterRevealCard deliberately has no `word` prop.
export { default as PassPromptCard } from "./ui/PassPromptCard";
export { default as PrivateRevealPrompt } from "./ui/PrivateRevealPrompt";
export { default as PlayerRevealCard } from "./ui/PlayerRevealCard";
export { default as ImposterRevealCard } from "./ui/ImposterRevealCard";
export { default as AllPlayersReadyCard } from "./ui/AllPlayersReadyCard";
