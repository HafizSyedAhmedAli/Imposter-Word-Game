// features/toggle-preferences — public API. Import from
// "@/features/toggle-preferences", never reach into
// "@/features/toggle-preferences/ui/*" from outside this slice.
//
// The persisted settings themselves (GameSettings, getSettings,
// updateSettings, ...) live in `@/entities/settings`; this slice is the
// Settings-screen UI that edits them. SettingsToggleRow is internal to
// PreferencesCard and deliberately not exported.
export { default as PreferencesCard } from "./ui/PreferencesCard";
export { default as LanguageCard } from "./ui/LanguageCard";
