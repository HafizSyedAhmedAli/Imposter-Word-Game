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

describe("getVotingOrder", () => {
  it("matches session.players order exactly", () => {
    const session = baseSession();
    expect(getVotingOrder(session)).toBe(session.players);
  });
});

describe("getCurrentVoter", () => {
  it("returns the first active player who hasn't voted yet", () => {
    const session = baseSession({ votes: { p1: "p2" } });
    expect(getCurrentVoter(session)?.id).toBe("p2");
  });

  it("skips eliminated players", () => {
    const session = baseSession({ eliminatedPlayerIds: ["p1"] });
    expect(getCurrentVoter(session)?.id).toBe("p2");
  });

  it("returns null once everyone active has voted", () => {
    const session = baseSession({
      votes: { p1: "p2", p2: "p1", p3: "p1", p4: "p1" },
    });
    expect(getCurrentVoter(session)).toBeNull();
  });
});

describe("getActiveVotingOrder / getVotesCastCount", () => {
  it("counts only active, voted players", () => {
    const session = baseSession({
      eliminatedPlayerIds: ["p4"],
      votes: { p1: "p2", p2: "p1" },
    });
    expect(getActiveVotingOrder(session)).toHaveLength(3);
    expect(getVotesCastCount(session)).toBe(2);
  });
});

describe("getEligibleVoteTargets", () => {
  it("excludes the voter themselves and eliminated players", () => {
    const session = baseSession({ eliminatedPlayerIds: ["p3"] });
    const targets = getEligibleVoteTargets(session, "p1").map((p) => p.id);
    expect(targets).toEqual(["p2", "p4"]);
  });
});

describe("submitVote", () => {
  it("records a vote from the current voter", () => {
    const session = baseSession();
    const next = submitVote(session, "p1", "p2");
    expect(next.votes).toEqual({ p1: "p2" });
  });

  it("is a no-op if the voter isn't the current voter", () => {
    const session = baseSession();
    // p2 tries to vote before p1 (the actual current voter) has.
    const next = submitVote(session, "p2", "p1");
    expect(next).toBe(session);
  });

  it("rejects self-voting", () => {
    const session = baseSession();
    const next = submitVote(session, "p1", "p1");
    expect(next).toBe(session);
  });

  it("rejects a duplicate vote from the same voter", () => {
    const session = baseSession({ votes: { p1: "p2" } });
    // p1 already voted; even though getCurrentVoter now resolves to p2,
    // an attempt to vote again "as p1" must be rejected.
    const next = submitVote(session, "p1", "p3");
    expect(next).toBe(session);
  });

  it("rejects a vote targeting an eliminated player", () => {
    const session = baseSession({ eliminatedPlayerIds: ["p2"] });
    const next = submitVote(session, "p1", "p2");
    expect(next).toBe(session);
  });

  it("does not mutate the original session", () => {
    const session = baseSession();
    const before = JSON.stringify(session);
    submitVote(session, "p1", "p2");
    expect(JSON.stringify(session)).toBe(before);
  });
});

describe("skipVote", () => {
  it("records the skip sentinel for the current voter", () => {
    const session = baseSession();
    const next = skipVote(session, "p1");
    expect(next.votes?.p1).toBe(SKIP_VOTE);
  });

  it("is a no-op for a player who isn't the current voter", () => {
    const session = baseSession();
    const next = skipVote(session, "p2");
    expect(next).toBe(session);
  });

  it("is a no-op for an eliminated player", () => {
    const session = baseSession({ eliminatedPlayerIds: ["p1"] });
    const next = skipVote(session, "p1");
    expect(next).toBe(session);
  });

  it("a skip vote does not count toward any player's tally (see results-flow)", () => {
    const session = baseSession();
    const next = skipVote(session, "p1");
    expect(Object.values(next.votes ?? {})).toContain(SKIP_VOTE);
    // getEligibleVoteTargets never includes the sentinel as a real player,
    // and results-flow's tally only counts values matching real player ids.
    expect(session.players.some((p) => p.id === SKIP_VOTE)).toBe(false);
  });
});

describe("hasVoted / isVotingComplete", () => {
  it("hasVoted is false for a missing votes field entirely", () => {
    const session = baseSession();
    delete session.votes;
    expect(hasVoted(session, "p1")).toBe(false);
    expect(isVotingComplete(session)).toBe(false);
  });

  it("isVotingComplete is true once every active player has voted or skipped", () => {
    const session = baseSession({
      votes: { p1: "p2", p2: SKIP_VOTE, p3: "p1", p4: "p1" },
    });
    expect(isVotingComplete(session)).toBe(true);
  });
});

describe("getVotingDuration", () => {
  it("returns the configured duration when the voting timer is enabled", () => {
    const session = baseSession();
    session.config.options.votingTimer = { enabled: true, duration: 45 };
    expect(getVotingDuration(session)).toBe(45);
  });

  it("returns null when the voting timer is disabled", () => {
    const session = baseSession();
    session.config.options.votingTimer = { enabled: false, duration: 45 };
    expect(getVotingDuration(session)).toBeNull();
  });
});
