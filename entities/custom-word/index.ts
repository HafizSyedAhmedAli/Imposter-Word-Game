// entities/custom-word — public API. Import from "@/entities/custom-word",
// never reach into "@/entities/custom-word/model/*" from outside this slice.
export type {
  CustomWordEntry,
  AddCustomWordResult,
} from "./model/custom-word-types";

export {
  MAX_CUSTOM_WORD_LENGTH,
  validateCustomWordText,
} from "./model/custom-word-rules";
export type {
  CustomWordValidation,
  ExistingCustomWord,
} from "./model/custom-word-rules";

export {
  addCustomWord,
  getCustomWords,
  deleteCustomWord,
  updateCustomWordHint,
  getRandomCustomWord,
  clearCustomWords,
} from "./model/custom-word-store";

export { resolveCustomWordHint } from "./model/custom-word-provider";
