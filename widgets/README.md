# widgets

Composed UI blocks tied to a specific screen's layout — not independent
capabilities (that's `features/`), not full routes (that's `pages/`).

Planned slices (not yet moved — see `../ARCHITECTURE.md`):

- `widgets/discussion-panel` — `DiscussionScreen` + its Controls/Players/
  Status/Timer/Tips cards
- `widgets/pass-phone-panel` — `PassPhoneScreen` + AllPlayersReady/
  PassPrompt/LeaveRoundDialog cards
- `widgets/vote-panel` — `VoteScreen` + AllVotesCast/TimesUp/VoteRecorded/
  VotingTimer cards
- `widgets/results-panel`, `widgets/final-results-panel`
- `widgets/round-preparation-panel`
- `widgets/statistics-panel`, `widgets/achievements-panel`

Import from other layers: `features/`, `entities/`, `shared/`.
