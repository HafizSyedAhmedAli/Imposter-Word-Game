// entities/word — public API. Import from "@/entities/word", never
// reach into "@/entities/word/model/*" from outside this slice.
export type { WordProvider } from "./model/word-provider";

export { AiWordProvider } from "./model/ai-word-provider";
export { IndexedDbCacheProvider } from "./model/indexeddb-cache-provider";
export { FallbackWordProvider } from "./model/fallback-word-provider";

export { FALLBACK_WORDS, getRandomFallbackWord } from "./model/fallback-words";
export type { FallbackWordEntry } from "./model/fallback-words";
