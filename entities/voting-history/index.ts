// entities/voting-history — public API. Import from
// "@/entities/voting-history", never reach into
// "@/entities/voting-history/model/*" from outside this slice.
export type {
  VotingHistoryEntry,
  VotingHistoryTallyEntry,
  VotingHistoryVerdict,
} from "./model/voting-history-types";
