import { describe, it, expect } from "vitest";
import {
  getStoredGameSetup,
  storeGameSetup,
  clearStoredGameSetup,
} from "@/lib/game-setup-store";
import { DEFAULT_GAME_CONFIG } from "@/game/game-rules";

describe("game-setup-store", () => {
  it("returns null when nothing is stored", () => {
    expect(getStoredGameSetup()).toBeNull();
  });

  it("round-trips config + players through sessionStorage", () => {
    const setup = {
      config: DEFAULT_GAME_CONFIG,
      players: [{ id: "p1", name: "Alice" }],
    };
    storeGameSetup(setup);
    expect(getStoredGameSetup()).toEqual(setup);
  });

  it("clearStoredGameSetup removes it", () => {
    storeGameSetup({ config: DEFAULT_GAME_CONFIG, players: [] });
    clearStoredGameSetup();
    expect(getStoredGameSetup()).toBeNull();
  });

  it("ignores malformed stored JSON instead of throwing", () => {
    sessionStorage.setItem("iw:game-setup", "{not valid json");
    expect(getStoredGameSetup()).toBeNull();
  });
});