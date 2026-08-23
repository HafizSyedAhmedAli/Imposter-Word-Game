import { describe, it, expect } from "vitest";
import {
  getEliminatedPlayerIds,
  isEliminated,
  getActivePlayers,
} from "@/game/elimination";
import type { RoundSession } from "@/game/game-types";
import { baseSession } from "../helpers/fixtures";

describe("elimination helpers", () => {
  it("getEliminatedPlayerIds defaults to an empty array when the field is missing", () => {
    const session = baseSession();
    delete (session as Partial<RoundSession>).eliminatedPlayerIds;
    expect(getEliminatedPlayerIds(session)).toEqual([]);
  });

  it("getEliminatedPlayerIds returns the stored list", () => {
    const session = baseSession({ eliminatedPlayerIds: ["p1", "p2"] });
    expect(getEliminatedPlayerIds(session)).toEqual(["p1", "p2"]);
  });

  it("isEliminated is true only for players in the eliminated list", () => {
    const session = baseSession({ eliminatedPlayerIds: ["p1"] });
    expect(isEliminated(session, "p1")).toBe(true);
    expect(isEliminated(session, "p2")).toBe(false);
  });

  it("getActivePlayers excludes eliminated players but keeps original order", () => {
    const session = baseSession({ eliminatedPlayerIds: ["p2"] });
    const active = getActivePlayers(session);
    expect(active.map((p) => p.id)).toEqual(
      session.players.filter((p) => p.id !== "p2").map((p) => p.id),
    );
  });

  it("getActivePlayers returns everyone when nobody is eliminated", () => {
    const session = baseSession();
    expect(getActivePlayers(session)).toHaveLength(session.players.length);
  });

  it("never mutates session.players when computing active players", () => {
    const session = baseSession({ eliminatedPlayerIds: ["p1"] });
    const before = [...session.players];
    getActivePlayers(session);
    expect(session.players).toEqual(before);
  });
});
