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

  it("defaults `language` to english (backward compatibility)", async () => {
    expect((await getSettings()).language).toBe("english");
  });

  it("defaults `language` to english for a row saved before that field existed", async () => {
    const db = getDb();
    await db.settings.put({ id: "app", sound: true, haptics: true });
    expect((await getSettings()).language).toBe("english");
  });

  it("normalizes an invalid stored language value back to english", async () => {
    const db = getDb();
    await db.settings.put({
      id: "app",
      sound: true,
      haptics: true,
      language: "not-a-real-language",
    });
    expect((await getSettings()).language).toBe("english");
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

  it("persists a language change and it survives a fresh read (simulated reload)", async () => {
    await updateSettings({ language: "roman-urdu" });
    // getSettings() always re-reads from Dexie rather than any in-memory
    // cache, so calling it again here is equivalent to a page reload.
    expect((await getSettings()).language).toBe("roman-urdu");
  });

  it("changing the language does not clobber other settings, and vice versa", async () => {
    await updateSettings({ sound: false });
    await updateSettings({ language: "roman-urdu" });
    const settings = await getSettings();
    expect(settings.language).toBe("roman-urdu");
    expect(settings.sound).toBe(false);
  });
});

describe("resetSettings", () => {
  it("clears the saved row so settings fall back to defaults", async () => {
    await updateSettings({ sound: false, haptics: false, music: false });
    await resetSettings();
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS);
  });
});
