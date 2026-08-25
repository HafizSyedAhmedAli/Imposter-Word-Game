import { describe, it, expect } from "vitest";
import {
  getVoteTally,
  getHighestVoteCount,
  getMostVotedPlayers,
  getVerdict,
  getTotalImposterCount,
  applyVerdict,
  getRoundOutcome,
  continueRound,
} from "@/game/results-flow";
import { SKIP_VOTE } from "@/game/vote-flow";
import { baseSession, multiImposterSession } from "../helpers/fixtures";

describe("getVoteTally / getHighestVoteCount / getMostVotedPlayers", () => {
  it("tallies votes per target in stable player order", () => {
    const session = baseSession({
      votes: { p2: "p1", p3: "p1", p4: "p2" },
    });
    const tally = getVoteTally(session);
    expect(tally.map((t) => t.player.id)).toEqual(["p1", "p2", "p3", "p4"]);
    expect(tally.find((t) => t.player.id === "p1")?.votes).toBe(2);
    expect(tally.find((t) => t.player.id === "p2")?.votes).toBe(1);
  });

  it("skip votes don't count toward anyone's tally", () => {
    const session = baseSession({
      votes: { p2: "p1", p3: SKIP_VOTE, p4: SKIP_VOTE },
    });
    const tally = getVoteTally(session);
    const total = tally.reduce((sum, t) => sum + t.votes, 0);
    expect(total).toBe(1);
  });

  it("getHighestVoteCount is 0 when there are no votes", () => {
    const session = baseSession({ votes: {} });
    expect(getHighestVoteCount(getVoteTally(session))).toBe(0);
  });

  it("getMostVotedPlayers returns every player tied for first place", () => {
    const session = baseSession({
      votes: { p2: "p1", p3: "p4", p4: "p1" },
    });
    // p1 has 2 votes (from p2, p4); no one else does -- not a tie here.
    const most = getMostVotedPlayers(session);
    expect(most.map((t) => t.player.id)).toEqual(["p1"]);
  });

  it("getMostVotedPlayers detects a genuine tie", () => {
    const session = baseSession({
      votes: { p1: "p2", p2: "p1" }, // p1 <-1 vote, p2 <-1 vote
    });
    const most = getMostVotedPlayers(session);
    expect(most.map((t) => t.player.id).sort()).toEqual(["p1", "p2"]);
  });

  it("getMostVotedPlayers is empty when there are zero votes", () => {
    const session = baseSession({ votes: {} });
    expect(getMostVotedPlayers(session)).toEqual([]);
  });
});

describe("getVerdict", () => {
  it("returns a tie verdict when votes are split evenly", () => {
    const session = baseSession({ votes: { p3: "p2", p4: "p1" } });
    const verdict = getVerdict(session);
    expect(verdict.type).toBe("tie");
  });

  it("returns 'imposter-caught' when the imposter gets the most votes", () => {
    const session = baseSession({ votes: { p2: "p1", p3: "p1", p4: "p1" } });
    const verdict = getVerdict(session);
    expect(verdict).toEqual({
      type: "imposter-caught",
      eliminated: { id: "p1", name: "Ahmed" },
    });
  });

  it("returns 'wrong-player' when a crew member gets the most votes", () => {
    const session = baseSession({ votes: { p1: "p2", p3: "p2", p4: "p2" } });
    const verdict = getVerdict(session);
    expect(verdict).toEqual({
      type: "wrong-player",
      eliminated: { id: "p2", name: "Asmed" },
    });
  });
});

describe("getTotalImposterCount", () => {
  it("counts imposters directly from session.round.roles", () => {
    expect(getTotalImposterCount(baseSession())).toBe(1);
    expect(getTotalImposterCount(multiImposterSession())).toBe(2);
  });
});

describe("applyVerdict", () => {
  it("eliminates the correctly-voted player", () => {
    const session = baseSession({ votes: { p2: "p1", p3: "p1", p4: "p1" } });
    const next = applyVerdict(session);
    expect(next.eliminatedPlayerIds).toEqual(["p1"]);
  });

  it("eliminates no one on a tie", () => {
    const session = baseSession({ votes: { p3: "p2", p4: "p1" } });
    const next = applyVerdict(session);
    expect(next.eliminatedPlayerIds ?? []).toEqual([]);
  });

  it("is idempotent -- reapplying the same verdict does not double-add", () => {
    const session = baseSession({
      votes: { p2: "p1", p3: "p1", p4: "p1" },
      eliminatedPlayerIds: ["p1"],
    });
    const next = applyVerdict(session);
    expect(next.eliminatedPlayerIds).toEqual(["p1"]);
  });

  it("accumulates eliminations across rounds instead of replacing the list", () => {
    const session = baseSession({
      votes: { p2: "p3", p1: "p3", p4: "p3" },
      eliminatedPlayerIds: ["p1"],
    });
    const next = applyVerdict(session);
    expect(next.eliminatedPlayerIds).toEqual(["p1", "p3"]);
  });
});

describe("getRoundOutcome", () => {
  it("is 'crew-win' once every imposter is eliminated", () => {
    const session = baseSession({ eliminatedPlayerIds: ["p1"] });
    expect(getRoundOutcome(session)).toBe("crew-win");
  });

  it("is 'continue' while imposters remain outnumbered and alive", () => {
    const session = baseSession(); // no eliminations yet
    expect(getRoundOutcome(session)).toBe("continue");
  });

  it("is 'imposter-win' once imposters are no longer outnumbered", () => {
    // 4 players, 1 imposter: eliminate 2 crew -> 1 imposter vs 1 crew,
    // imposters no longer outnumbered.
    const session = baseSession({ eliminatedPlayerIds: ["p2", "p3"] });
    expect(getRoundOutcome(session)).toBe("imposter-win");
  });

  it("works identically for multiple imposters", () => {
    // 9 players / 2 imposters: eliminate both imposters -> crew-win.
    const session = multiImposterSession({ eliminatedPlayerIds: ["p1", "p2"] });
    expect(getRoundOutcome(session)).toBe("crew-win");
  });

  it("multi-imposter game continues while any imposter is alive and outnumbered", () => {
    const session = multiImposterSession({ eliminatedPlayerIds: ["p3"] }); // a crew member
    expect(getRoundOutcome(session)).toBe("continue");
  });
});

describe("continueRound", () => {
  it("increments the round number and resets votes", () => {
    const session = baseSession({
      votes: { p2: "p1" },
      round: { ...baseSession().round, number: 1 },
    });
    const next = continueRound(session);
    expect(next.round.number).toBe(2);
    expect(next.votes).toEqual({});
    expect(next.status).toBe("playing");
  });

  it("preserves the word, hint, and role assignments across the continuation", () => {
    const session = baseSession();
    const next = continueRound(session);
    expect(next.round.word).toBe(session.round.word);
    expect(next.round.hint).toBe(session.round.hint);
    expect(next.round.roles).toEqual(session.round.roles);
  });

  it("carries eliminatedPlayerIds over untouched", () => {
    const session = baseSession({ eliminatedPlayerIds: ["p2"] });
    const next = continueRound(session);
    expect(next.eliminatedPlayerIds).toEqual(["p2"]);
  });
});
