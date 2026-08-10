import { MessageCircle, Vote } from "lucide-react";
import type {
  GameOptions as GameOptionsType,
  TimerSettings,
} from "@/game/game-types";
import {
  DISCUSSION_TIMER_OPTIONS,
  VOTING_TIMER_OPTIONS,
} from "@/game/game-rules";
import TimerOption from "./TimerOption";

export default function GameOptions({
  options,
  onDiscussionChange,
  onVotingChange,
}: {
  options: GameOptionsType;
  onDiscussionChange: (patch: Partial<TimerSettings>) => void;
  onVotingChange: (patch: Partial<TimerSettings>) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <TimerOption
        icon={MessageCircle}
        title="Discussion Timer"
        description="Limit time for discussion phase"
        value={options.discussionTimer}
        options={DISCUSSION_TIMER_OPTIONS}
        onChange={onDiscussionChange}
      />
      <TimerOption
        icon={Vote}
        title="Voting Timer"
        description="Limit time for voting phase"
        value={options.votingTimer}
        options={VOTING_TIMER_OPTIONS}
        onChange={onVotingChange}
      />
    </div>
  );
}
