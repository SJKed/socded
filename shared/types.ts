export type Phase =
  | 'lobby'
  | 'role_reveal'
  | 'round'
  | 'voting'
  | 'vote_result'
  | 'topic_guess'
  | 'round_summary'
  | 'leaderboard';

export interface Settings {
  roundCount: number;
  timerSeconds: number;
  clueTimeSeconds: number;
  topicPack: string;
  easyMode: boolean;
}

export interface Player {
  id: string;
  token: string;
  name: string;
  socketId: string;
  isHost: boolean;
  isConnected: boolean;
  joinOrder: number;
  score: number;
  hasVoted: boolean;
  vote: string | null;
}

export interface PublicPlayer {
  id: string;
  name: string;
  isHost: boolean;
  isConnected: boolean;
  score: number;
  hasVoted: boolean;
}

export interface RoundSummary {
  round: number;
  outsiderId: string;
  outsiderName: string;
  topic: string;
  caughtByVote: boolean;
  outsiderGuess: string | null;
  outsiderGuessCorrect: boolean | null;
  voteBreakdown: Record<string, string | null>;
  scoreDelta: Record<string, number>;
}

export interface GameRoom {
  roomCode: string;
  phase: Phase;
  players: Player[];
  hostId: string;
  settings: Settings;
  currentRound: number;
  outsiderOrder: string[];
  currentOutsiderId: string;
  currentTopic: string;
  easyModeHints: string[];
  revealedCount: number;
  speakerOrder: string[];
  currentSpeakerIndex: number;
  speakerTimerEndsAt: number | null;
  speakerTimerIntervalId: ReturnType<typeof setInterval> | null;
  timerEndsAt: number | null;
  timerIntervalId: ReturnType<typeof setInterval> | null;
  voteDeadlineAt: number | null;
  voteTimeoutId: ReturnType<typeof setTimeout> | null;
  outsiderGuess: string | null;
  outsiderGuessCorrect: boolean | null;
  lastVoteBreakdown: Record<string, string | null>;
  roundSummaries: RoundSummary[];
  cleanupTimeoutId: ReturnType<typeof setTimeout> | null;
}

export interface ClientGameState {
  roomCode: string;
  phase: Phase;
  players: PublicPlayer[];
  hostId: string;
  settings: Settings;
  currentRound: number;
  totalRounds: number;
  timerEndsAt: number | null;
  speakerEndsAt: number | null;
  currentSpeakerId: string | null;
  speakerIndex: number;
  totalSpeakers: number;
  voteDeadlineAt: number | null;
  votesIn: number;
  totalVoters: number;
  roundSummaries: RoundSummary[];
  currentOutsiderId: string;
}

// C→S event payloads
export interface CreateRoomPayload { name: string }
export interface JoinRoomPayload { name: string; roomCode: string; token?: string }
export interface UpdateSettingsPayload { roundCount?: number; timerSeconds?: number; topicPack?: string; easyMode?: boolean }
export interface SubmitVotePayload { targetId: string | null }
export interface SubmitTopicGuessPayload { guess: string }

// S→C event payloads
export interface CreateRoomAckPayload { roomCode: string; playerId: string; token: string }
export interface JoinRoomAckPayload { ok: boolean; error?: string; playerId?: string; token?: string }
export interface YourRolePayload { role: 'insider' | 'outsider'; topic?: string; hints?: string[] }
export interface AllRevealedPayload { startsAt: number }
export interface TimerTickPayload { secondsLeft: number }
export interface VoteCalledPayload { calledBy: string; deadlineAt: number }
export interface VoteReceivedPayload { voterId: string }
export interface VotesRevealedPayload { voteBreakdown: Record<string, string | null>; mostVotedId: string | null; isTie: boolean }
export interface OutsiderCaughtPayload { outsiderId: string }
export interface OutsiderEscapedPayload { outsiderId: string; topic: string }
export interface TopicGuessResultPayload { guess: string; correct: boolean; topic: string }
export interface RoundSummaryPayload { summary: RoundSummary; scores: Record<string, number> }
export interface GameOverPayload { scores: Record<string, number>; roundSummaries: RoundSummary[] }
export interface ErrorPayload { code: string; message: string }
