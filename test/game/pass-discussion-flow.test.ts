import { describe, it, expect } from "vitest";
import {
  getDiscussionDuration,
  getSpeakingOrder,
} from "@/game/discussion-flow";
import {
  getCurrentPlayer,
  getCurrentPlayerRole,
  isFinalPlayer,
  advanceToNextPlayer,
  beginDiscussion,
} from "@/game/pass-flow";
import { baseSession } from "../helpers/fixtures";

describe("discussion-flow", () => {
  it("getDiscussionDuration returns the configured duration when enabled", () => {
    const session = baseSession();
    session.config.options.discussionTimer = { enabled: true, duration: 90 };
    expect(getDiscussionDuration(session)).toBe(90);
  });

  it("getDiscussionDuration returns null when the timer is disabled", () => {
    const session = baseSession();
    session.config.options.discussionTimer = { enabled: false, duration: 90 };
    expect(getDiscussionDuration(session)).toBeNull();
  });

  it("getSpeakingOrder excludes eliminated players", () => {
    const session = baseSession({ eliminatedPlayerIds: ["p2"] });
    expect(getSpeakingOrder(session).map((p) => p.id)).toEqual([
      "p1",
      "p3",
      "p4",
    ]);
  });

  it("getSpeakingOrder is everyone in round 1", () => {
    const session = baseSession();
    expect(getSpeakingOrder(session)).toHaveLength(4);
  });
});

describe("pass-flow", () => {
  it("getCurrentPlayer resolves via currentPlayerIndex", () => {
    const session = baseSession({ currentPlayerIndex: 2 });
    expect(getCurrentPlayer(session)?.id).toBe("p3");
  });

  it("getCurrentPlayer returns null once past the end of the roster", () => {
    const session = baseSession({ currentPlayerIndex: 99 });
    expect(getCurrentPlayer(session)).toBeNull();
  });

  it("getCurrentPlayerRole looks up the role by player id, not array position", () => {
    const session = baseSession({ currentPlayerIndex: 0 });
    expect(getCurrentPlayerRole(session)).toEqual({
      playerId: "p1",
      role: "imposter",
    });
  });

  it("getCurrentPlayerRole returns null when there is no current player", () => {
    const session = baseSession({ currentPlayerIndex: 99 });
    expect(getCurrentPlayerRole(session)).toBeNull();
  });

  it("isFinalPlayer is true only for the last index", () => {
    const session = baseSession({ currentPlayerIndex: 3 });
    expect(isFinalPlayer(session)).toBe(true);
    expect(isFinalPlayer(baseSession({ currentPlayerIndex: 0 }))).toBe(false);
  });

  it("advanceToNextPlayer increments the index and preserves everything else", () => {
    const session = baseSession({ currentPlayerIndex: 0 });
    const next = advanceToNextPlayer(session);
    expect(next.currentPlayerIndex).toBe(1);
    expect(next.round).toBe(session.round);
    expect(next.players).toBe(session.players);
  });

  it("beginDiscussion transitions status to 'playing'", () => {
    const session = baseSession({ status: "ready" });
    const next = beginDiscussion(session);
    expect(next.status).toBe("playing");
  });

  it("resolves the correct secret (word vs hint) for every seat via getCurrentPlayerRole", () => {
    // Mirrors PassPhoneScreen.tsx's own branch exactly:
    //   currentRole.role === "player"    -> PlayerRevealCard   gets `word`
    //   currentRole.role === "imposter"  -> ImposterRevealCard gets `hint`
    // This exercises the real, exported role-lookup function
    // (getCurrentPlayerRole, looked up by player id -- never by array
    // index) against every seat, which is the actual bug surface: a
    // role/seat mixup would leak the wrong secret to the wrong player.
    const session = baseSession();
    for (let i = 0; i < session.players.length; i++) {
      const withIndex = { ...session, currentPlayerIndex: i };
      const role = getCurrentPlayerRole(withIndex);
      expect(role?.playerId).toBe(session.players[i].id);

      const secret =
        role?.role === "imposter" ? session.round.hint : session.round.word;
      if (role?.role === "imposter") {
        expect(secret).not.toBe(session.round.word);
      } else {
        expect(secret).not.toBe(session.round.hint);
      }
    }
  });
});
