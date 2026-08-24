import { describe, it, expect, afterEach } from "vitest";
import { getDb } from "@/lib/db";
import {
  getSettings,
  updateSettings,
  resetSettings,
  DEFAULT_SETTINGS,
} from "@/lib/settings-store";

afterEach(async () => {
  const db = getDb();
  await db.settings.clear();
  await db.words.clear();
});

describe("getSettings", () => {
  it("returns defaults when nothing has been saved", async () => {
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("defaults `music` in for a row saved before that field existed", async () => {
    const db = getDb();
    await db.settings.put({ id: "app", sound: false, haptics: true });
    const settings = await getSettings();
    expect(settings.music).toBe(DEFAULT_SETTINGS.music);
    expect(settings.sound).toBe(false);
  });
});

describe("updateSettings", () => {
  it("persists a change and can be read back", async () => {
    await updateSettings({ sound: false });
    const settings = await getSettings();
    expect(settings.sound).toBe(false);
  });

  it("merges a patch without clobbering other fields", async () => {
    await updateSettings({ sound: false });
    await updateSettings({ haptics: false });
    const settings = await getSettings();
    expect(settings.sound).toBe(false);
    expect(settings.haptics).toBe(false);
    expect(settings.music).toBe(DEFAULT_SETTINGS.music);
  });
});

describe("resetSettings", () => {
  it("clears the saved row so settings fall back to defaults", async () => {
    await updateSettings({ sound: false, haptics: false, music: false });
    await resetSettings();
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS);
  });
});
