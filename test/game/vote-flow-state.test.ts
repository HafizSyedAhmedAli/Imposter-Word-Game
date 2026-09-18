import { describe, it, expect } from "vitest";
import {
  getVotingOrder,
  getCurrentVoter,
  getActiveVotingOrder,
  getVotesCastCount,
  getEligibleVoteTargets,
  submitVote,
  skipVote,
  hasVoted,
  isVotingComplete,
  getVotingDuration,
  SKIP_VOTE,
} from "@/game/vote-flow";
import { baseSession } from "../helpers/fixtures";

/**
 * game/vote-flow.ts's own state-machine functions had zero direct test
 * coverage -- the existing test/game/vote-flow.test.ts file only
 * imports the SKIP_VOTE constant from here; every one of its actual
 * tests exercises game/results-flow.ts instead. This file is the real
 * coverage for this module: voting order, whose turn it is, submitting/
 * skipping a vote, and the various guard clauses that keep those two
 * actions safe against an eliminated or already-voted player.
 */

describe("getVotingOrder", () => {
  it("returns players in the same order as session.players (never role or vote order)", () => {
    const session = baseSession();
    expect(getVotingOrder(session).map((p) => p.id)).toEqual([
      "p1",
      "p2",
      "p3",
      "p4",
    ]);
  });
});

describe("getCurrentVoter / hasVoted", () => {
  it("returns the first player in order who hasn't voted yet", () => {
    const session = baseSession({ votes: { p1: "p2" } });
    expect(getCurrentVoter(session)?.id).toBe("p2");
  });

  it("returns null once every active player has voted", () => {
    const session = baseSession({
      votes: { p1: "p2", p2: "p1", p3: "p1", p4: "p1" },
    });
    expect(getCurrentVoter(session)).toBeNull();
  });

  it("skips eliminated players entirely -- they are never asked to vote", () => {
    const session = baseSession({
      eliminatedPlayerIds: ["p1"],
      votes: {},
    });
    expect(getCurrentVoter(session)?.id).toBe("p2");
  });

  it("hasVoted is false for a player with no entry in session.votes", () => {
    const session = baseSession({ votes: { p1: "p2" } });
    expect(hasVoted(session, "p1")).toBe(true);
    expect(hasVoted(session, "p2")).toBe(false);
  });

  it("hasVoted treats a missing votes field the same as an empty one, rather than crashing", () => {
    const session = baseSession();
    delete session.votes;
    expect(hasVoted(session, "p1")).toBe(false);
    expect(getCurrentVoter(session)?.id).toBe("p1");
  });
});

describe("getActiveVotingOrder / getVotesCastCount", () => {
  it("excludes eliminated players from both the order and the cast count", () => {
    const session = baseSession({
      eliminatedPlayerIds: ["p2"],
      votes: { p1: "p3", p3: "p1", p4: "p1" },
    });

    expect(getActiveVotingOrder(session).map((p) => p.id)).toEqual([
      "p1",
      "p3",
      "p4",
    ]);
    expect(getVotesCastCount(session)).toBe(3);
  });

  it("does not count a vote cast by a since-eliminated player", () => {
    // Defensive case: p2 voted earlier, then was eliminated mid-round.
    const session = baseSession({
      eliminatedPlayerIds: ["p2"],
      votes: { p1: "p3", p2: "p1" },
    });
    expect(getVotesCastCount(session)).toBe(1);
  });
});

describe("getEligibleVoteTargets", () => {
  it("includes every active player except the voter themselves", () => {
    const session = baseSession();
    const targets = getEligibleVoteTargets(session, "p2").map((p) => p.id);
    expect(targets).toEqual(["p1", "p3", "p4"]);
  });

  it("never includes an eliminated player as a target", () => {
    const session = baseSession({ eliminatedPlayerIds: ["p3"] });
    const targets = getEligibleVoteTargets(session, "p1").map((p) => p.id);
    expect(targets).toEqual(["p2", "p4"]);
  });
});

describe("submitVote", () => {
  it("records a vote from the current voter against an eligible target", () => {
    const session = baseSession();
    const next = submitVote(session, "p1", "p2");
    expect(next.votes).toEqual({ p1: "p2" });
  });

  it("is a no-op if the caller is not the current voter", () => {
    const session = baseSession({ votes: {} });
    // p2 is not yet up -- p1 hasn't voted.
    const next = submitVote(session, "p2", "p1");
    expect(next).toBe(session);
    expect(next.votes).toEqual({});
  });

  it("is a no-op if a player tries to vote for themselves", () => {
    const session = baseSession();
    const next = submitVote(session, "p1", "p1");
    expect(next).toBe(session);
  });

  it("is a no-op if the caller has already voted (so is no longer the current voter)", () => {
    const session = baseSession({ votes: { p1: "p2" } });
    const next = submitVote(session, "p1", "p3");
    expect(next.votes).toEqual({ p1: "p2" });
  });

  it("is a no-op if the voter has been eliminated", () => {
    const session = baseSession({ eliminatedPlayerIds: ["p1"] });
    const next = submitVote(session, "p1", "p2");
    expect(next).toBe(session);
  });

  it("is a no-op if the target has been eliminated", () => {
    const session = baseSession({ eliminatedPlayerIds: ["p2"] });
    // p1 is still the current voter (p2 is out of the running as a voter
    // too), but voting for the eliminated p2 must still be rejected.
    const next = submitVote(session, "p1", "p2");
    expect(next).toBe(session);
  });

  it("advances getCurrentVoter to the next player after a vote is recorded", () => {
    const session = baseSession();
    const next = submitVote(session, "p1", "p2");
    expect(getCurrentVoter(next)?.id).toBe("p2");
  });
});

describe("skipVote", () => {
  it("records SKIP_VOTE for the current voter", () => {
    const session = baseSession();
    const next = skipVote(session, "p1");
    expect(next.votes).toEqual({ p1: SKIP_VOTE });
  });

  it("is a no-op if the caller is not the current voter", () => {
    const session = baseSession();
    const next = skipVote(session, "p3");
    expect(next).toBe(session);
  });

  it("is a no-op if the caller has already voted or skipped (so is no longer the current voter)", () => {
    const session = baseSession({ votes: { p1: SKIP_VOTE } });
    const next = skipVote(session, "p1");
    expect(next).toBe(session);
  });

  it("is a no-op if the voter has been eliminated", () => {
    const session = baseSession({ eliminatedPlayerIds: ["p1"] });
    const next = skipVote(session, "p1");
    expect(next).toBe(session);
  });

  it("a skipped vote still counts toward hasVoted and the cast count", () => {
    const session = baseSession();
    const next = skipVote(session, "p1");
    expect(hasVoted(next, "p1")).toBe(true);
    expect(getVotesCastCount(next)).toBe(1);
  });
});

describe("isVotingComplete", () => {
  it("is false while any active player still hasn't voted", () => {
    const session = baseSession({ votes: { p1: "p2" } });
    expect(isVotingComplete(session)).toBe(false);
  });

  it("is true once every active player has voted or skipped", () => {
    const session = baseSession({
      votes: { p1: "p2", p2: SKIP_VOTE, p3: "p1", p4: "p1" },
    });
    expect(isVotingComplete(session)).toBe(true);
  });

  it("is true when every remaining active player has voted, even with eliminated players still unaccounted for", () => {
    const session = baseSession({
      eliminatedPlayerIds: ["p4"],
      votes: { p1: "p2", p2: "p1", p3: "p1" },
    });
    expect(isVotingComplete(session)).toBe(true);
  });
});

describe("getVotingDuration", () => {
  it("returns the configured duration when the voting timer is enabled", () => {
    const session = baseSession();
    // DEFAULT_GAME_CONFIG enables a 30s voting timer.
    expect(getVotingDuration(session)).toBe(30);
  });

  it("returns null when the voting timer is turned off", () => {
    const session = baseSession({
      config: {
        ...baseSession().config,
        options: {
          ...baseSession().config.options,
          votingTimer: { enabled: false, duration: 30 },
        },
      },
    });
    expect(getVotingDuration(session)).toBeNull();
  });
});
