// features/recover-active-game — public API. Import from
// "@/features/recover-active-game", never reach into
// "@/features/recover-active-game/ui/*" from outside this slice.
//
// Invariant (do not weaken): recovery must ALWAYS require a deliberate
// tap. Auto-resuming a pass-the-phone game on relaunch could put a
// role/word on screen in front of the wrong player. The prompt is a
// modal with no neutral "dismiss" -- Escape is a no-op -- and nothing is
// restored until "RESUME GAME" is pressed. Guarded by
// test/features/recover-active-game/recovery-prompt.test.tsx.
//
// The storage side (getRecoverableActiveGame, markActiveGameRoute,
// clearActiveGameRecovery, the 24h expiry) lives in `@/entities/round`.
export { default as GameRecoveryPrompt } from "./ui/GameRecoveryPrompt";
