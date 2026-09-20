// features/play-round — public API. Import from "@/features/play-round",
// never reach into "@/features/play-round/model/*" from outside this
// slice. Every one of the nine model files below has a disjoint export
// name set (checked at move time), so a plain `export *` per file is
// safe -- no name collides across them, including `getEliminatedPlayerIds`/
// `isEliminated`, which results-flow.ts re-exports from elimination.ts
// as the exact same binding (not a conflicting second definition).
export * from "./model/game-engine";
export * from "./model/game-rules";
export * from "./model/role-assignment";
export * from "./model/elimination";
export * from "./model/discussion-flow";
export * from "./model/pass-flow";
export * from "./model/vote-flow";
export * from "./model/results-flow";
export * from "./model/final-results-flow";
