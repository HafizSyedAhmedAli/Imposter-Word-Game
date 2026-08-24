import { describe, it, expect } from "vitest";
import {
  getStoredRoundSession,
  storeRoundSession,
  clearStoredRoundSession,
} from "@/lib/round-session-store";
import {
  getRecoverableActiveGame,
  clearActiveGameRecovery,
  markActiveGameRoute,
} from "@/lib/active-game-recovery";
import { baseSession } from "../helpers/fixtures";

describe("round-session-store", () => {
  it("returns null when nothing is stored", () => {
    expect(getStoredRoundSession()).toBeNull();
  });

  it("round-trips a session through sessionStorage", () => {
    const session = baseSession();
    storeRoundSession(session);
    expect(getStoredRoundSession()).toEqual(session);
  });

  it("survives being read multiple times (idempotent read)", () => {
    const session = baseSession();
    storeRoundSession(session);
    expect(getStoredRoundSession()).toEqual(getStoredRoundSession());
  });

  it("clearStoredRoundSession removes it", () => {
    storeRoundSession(baseSession());
    clearStoredRoundSession();
    expect(getStoredRoundSession()).toBeNull();
  });

  it("ignores malformed stored JSON instead of throwing", () => {
    sessionStorage.setItem("iw:round-session", "{not valid json");
    expect(getStoredRoundSession()).toBeNull();
  });

  it("storing a session also mirrors it into active-game-recovery (localStorage)", () => {
    const session = baseSession({ status: "ready" });
    storeRoundSession(session);
    const recoverable = getRecoverableActiveGame();
    expect(recoverable?.session.id).toBe(session.id);
  });

  it("a finished session is never mirrored as recoverable", () => {
    storeRoundSession(baseSession({ status: "ready" }));
    storeRoundSession(baseSession({ status: "finished" }));
    expect(getRecoverableActiveGame()).toBeNull();
  });

  it("clearing the round session also clears the recovery record", () => {
    storeRoundSession(baseSession({ status: "ready" }));
    clearStoredRoundSession();
    expect(getRecoverableActiveGame()).toBeNull();
  });
});

describe("active-game-recovery", () => {
  it("getRecoverableActiveGame returns null when nothing was ever saved", () => {
    expect(getRecoverableActiveGame()).toBeNull();
  });

  it("defaults a brand-new record's route to /round", () => {
    storeRoundSession(baseSession({ status: "ready" }));
    const record = getRecoverableActiveGame();
    expect(record?.route).toBe("/round");
  });

  it("markActiveGameRoute updates the remembered screen", () => {
    storeRoundSession(baseSession({ status: "ready" }));
    markActiveGameRoute("/voting");
    expect(getRecoverableActiveGame()?.route).toBe("/voting");
  });

  it("markActiveGameRoute is a no-op if there is no existing record", () => {
    markActiveGameRoute("/voting");
    expect(getRecoverableActiveGame()).toBeNull();
  });

  it("expires a record older than 24 hours", () => {
    storeRoundSession(baseSession({ status: "ready" }));
    const raw = localStorage.getItem("iw:active-game-recovery");
    const record = JSON.parse(raw!);
    record.savedAt = Date.now() - 25 * 60 * 60 * 1000;
    localStorage.setItem("iw:active-game-recovery", JSON.stringify(record));

    expect(getRecoverableActiveGame()).toBeNull();
  });

  it("clearActiveGameRecovery removes the record directly", () => {
    storeRoundSession(baseSession({ status: "ready" }));
    clearActiveGameRecovery();
    expect(getRecoverableActiveGame()).toBeNull();
  });
});