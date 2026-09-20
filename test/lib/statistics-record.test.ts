import { describe, it, expect } from "vitest";
import { buildCompletedGameRecord } from "@/entities/statistics";
import { baseSession, multiImposterSession } from "../helpers/fixtures";
import type { RoundSession } from "@/game/game-types";
import type { VotingHistoryEntry } from "@/entities/voting-history";

/**
 * Pure, no-IndexedDB tests for the "Statistics Recorder" step -- see
 * lib/statistics-record.ts's doc comment for the full pipeline this is
 * one link in. Every assertion here checks that the built record
 * matches what game/final-results-flow.ts already determined, never a
 * second, independently-computed answer.
 */

const votingHistory: VotingHistoryEntry[] = [
  {
    round: 1,
    tally: [
      { playerId: "p1", playerName: "Ahmed", votes: 3 },
      { playerId: "p2", playerName: "Asmed", votes: 1 },
    ],
    verdict: { type: "imposter-caught", eliminatedPlayerId: "p1" },
  },
];

describe("buildCompletedGameRecord", () => {
  it("builds a crew-win record with the imposter correctly marked eliminated", () => {
    const session: RoundSession = baseSession({
      eliminatedPlayerIds: ["p1"],
      votingHistory,
    });
    const record = buildCompletedGameRecord(session, "crew-win");

    expect(record.id).toBe(session.id);
    expect(record.winner).toBe("crew-win");
    expect(record.playerCount).toBe(4);
    expect(record.imposterCount).toBe(1);
    expect(record.roundsPlayed).toBe(1);
    expect(record.impostersCaught).toBe(1);
    expect(record.category).toBe(session.config.category);
    expect(record.difficulty).toBe(session.config.difficulty);
    expect(record.mode).toBe(session.config.mode);

    const imposter = record.players.find((p) => p.playerId === "p1");
    expect(imposter?.role).toBe("imposter");
    expect(imposter?.eliminated).toBe(true);
    expect(imposter?.votesReceived).toBe(3);

    const crewMember = record.players.find((p) => p.playerId === "p2");
    expect(crewMember?.role).toBe("player");
    expect(crewMember?.eliminated).toBe(false);
    expect(crewMember?.votesReceived).toBe(1);
  });

  it("normalizes and trims every player's name", () => {
    const session = baseSession({
      players: [
        { id: "p1", name: "  Ahmed  " },
        { id: "p2", name: "ASMED" },
        { id: "p3", name: "Mali" },
        { id: "p4", name: "Hafsa" },
      ],
    });
    const record = buildCompletedGameRecord(session, "imposter-win");

    const ahmed = record.players.find((p) => p.playerId === "p1");
    expect(ahmed?.name).toBe("Ahmed");
    expect(ahmed?.normalizedName).toBe("ahmed");

    const asmed = record.players.find((p) => p.playerId === "p2");
    expect(asmed?.normalizedName).toBe("asmed");
  });

  it("counts every imposter caught in a multi-imposter game", () => {
    const session = multiImposterSession({
      eliminatedPlayerIds: ["p1", "p2"],
    });
    const record = buildCompletedGameRecord(session, "crew-win");

    expect(record.imposterCount).toBe(2);
    expect(record.impostersCaught).toBe(2);
    expect(record.players.filter((p) => p.role === "imposter")).toHaveLength(2);
  });

  it("records zero votes received when no voting history exists yet", () => {
    const session = baseSession({ eliminatedPlayerIds: ["p1"] });
    const record = buildCompletedGameRecord(session, "crew-win");
    expect(record.players.every((p) => p.votesReceived === 0)).toBe(true);
  });

  it("sums votes received across multiple recorded voting rounds", () => {
    const session = baseSession({
      eliminatedPlayerIds: ["p1"],
      votingHistory: [
        ...votingHistory,
        {
          round: 2,
          tally: [{ playerId: "p1", playerName: "Ahmed", votes: 2 }],
          verdict: { type: "wrong-player", eliminatedPlayerId: "p2" },
        },
      ],
    });
    const record = buildCompletedGameRecord(session, "crew-win");
    const imposter = record.players.find((p) => p.playerId === "p1");
    expect(imposter?.votesReceived).toBe(5);
  });
});
