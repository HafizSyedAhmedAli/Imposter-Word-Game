// entities/settings — public API. Import from "@/entities/settings", never
// reach into "@/entities/settings/model/*" from outside this slice.
export {
  getSettings,
  updateSettings,
  resetSettings,
  DEFAULT_SETTINGS,
} from "./model/settings-store";
export type { GameSettings } from "./model/settings-store";
