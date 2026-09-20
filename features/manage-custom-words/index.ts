// features/manage-custom-words — public API. Import from
// "@/features/manage-custom-words", never reach into
// "@/features/manage-custom-words/ui/*" from outside this slice.
//
// The CRUD itself (addCustomWord / getCustomWords / deleteCustomWord)
// lives in `@/entities/custom-word`; this slice is the UI for the
// Settings -> Custom Words screen. CustomWordCard is internal to
// CustomWordList and deliberately not exported.
export { default as CustomWordsHeader } from "./ui/CustomWordsHeader";
export { default as AddCustomWordCard } from "./ui/AddCustomWordCard";
export type { AddCustomWordOutcome } from "./ui/AddCustomWordCard";
export { default as CustomWordList } from "./ui/CustomWordList";
export { default as DeleteCustomWordDialog } from "./ui/DeleteCustomWordDialog";