import { describe, it, expect } from "vitest";
import {
  getFinalOutcome,
  getWinReason,
  getFinalPlayerResults,
  getFinalImposters,
  getFinalVerdict,
  getFinalVoteTally,
  getRoundSummary,
} from "@/game/final-results-flow";
import { baseSession, multiImposterSession } from "../helpers/fixtures";

describe("getFinalOutcome", () => {
  it("is null while the round is still ongoing ('continue')", () => {
    const session = baseSession();
    expect(getFinalOutcome(session)).toBeNull();
  });

  it("is 'crew-win' once every imposter is eliminated", () => {
    const session = baseSession({ eliminatedPlayerIds: ["p1"] });
    expect(getFinalOutcome(session)).toBe("crew-win");
  });

  it("is 'imposter-win' once imposters are no longer outnumbered", () => {
    const session = baseSession({ eliminatedPlayerIds: ["p2", "p3"] });
    expect(getFinalOutcome(session)).toBe("imposter-win");
  });
});

describe("getWinReason", () => {
  it("names a single caught imposter", () => {
    const session = baseSession({ eliminatedPlayerIds: ["p1"] });
    expect(getWinReason(session, "crew-win")).toMatch(/imposter was caught/i);
  });

  it("names the count for multiple caught imposters", () => {
    const session = multiImposterSession({ eliminatedPlayerIds: ["p1", "p2"] });
    expect(getWinReason(session, "crew-win")).toMatch(
      /all 2 imposters were caught/i,
    );
  });

  it("explains an imposter win where no imposter was ever caught", () => {
    const session = baseSession({ eliminatedPlayerIds: ["p2", "p3"] });
    expect(getWinReason(session, "imposter-win")).toMatch(/never caught/i);
  });

  it("explains an imposter win where crew was simply outnumbered despite a catch", () => {
    // 9 players, 2 imposters: catch one imposter (p1) but also lose enough
    // crew that the remaining imposter (p2) still isn't outnumbered.
    const session = multiImposterSession({
      eliminatedPlayerIds: ["p1", "p3", "p4", "p5", "p6", "p7"],
    });
    expect(getWinReason(session, "imposter-win")).toMatch(/too many crew/i);
  });
});

describe("getFinalPlayerResults / getFinalImposters", () => {
  it("returns every player's role and elimination status in seat order", () => {
    const session = baseSession({ eliminatedPlayerIds: ["p1"] });
    const results = getFinalPlayerResults(session);
    expect(results.map((r) => r.player.id)).toEqual(["p1", "p2", "p3", "p4"]);
    expect(results.find((r) => r.player.id === "p1")).toMatchObject({
      role: "imposter",
      eliminated: true,
    });
  });

  it("getFinalImposters returns only imposter entries, works for multiple imposters", () => {
    const session = multiImposterSession();
    const imposters = getFinalImposters(session);
    expect(imposters.map((r) => r.player.id).sort()).toEqual(["p1", "p2"]);
  });
});

describe("getFinalVerdict / getFinalVoteTally", () => {
  it("reuses the same verdict/tally logic as the last vote", () => {
    const session = baseSession({ votes: { p2: "p1", p3: "p1", p4: "p1" } });
    expect(getFinalVerdict(session).type).toBe("imposter-caught");
    expect(
      getFinalVoteTally(session).find((t) => t.player.id === "p1")?.votes,
    ).toBe(3);
  });
});

describe("getRoundSummary", () => {
  it("summarizes the config and imposter count actually played", () => {
    const session = baseSession();
    const summary = getRoundSummary(session);
    expect(summary).toEqual({
      category: "Random",
      difficulty: "Medium",
      mode: "Classic",
      playerCount: 4,
      imposterCount: 1,
    });
  });

  it("reflects the real player/imposter counts for a multi-imposter game", () => {
    const session = multiImposterSession();
    const summary = getRoundSummary(session);
    expect(summary.playerCount).toBe(9);
    expect(summary.imposterCount).toBe(2);
    expect(summary.mode).toBe("Double Trouble");
  });
});
