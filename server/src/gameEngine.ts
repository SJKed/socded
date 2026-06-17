import {
  GameRoom,
  Player,
  PublicPlayer,
  ClientGameState,
  RoundSummary,
  Settings,
} from '../../shared/types';
import { getTopics, pickRandom, buildEasyModeHints } from './topicPacks';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildOutsiderRotation(players: Player[]): string[] {
  return shuffle(players.map((p) => p.id));
}

export function buildSpeakerOrder(players: Player[]): string[] {
  return shuffle(players.filter((p) => p.isConnected).map((p) => p.id));
}

export function startRound(room: GameRoom): void {
  room.currentRound += 1;

  if (room.outsiderOrder.length === 0) {
    room.outsiderOrder = buildOutsiderRotation(room.players);
  }

  room.currentOutsiderId = room.outsiderOrder.shift()!;

  const topics = getTopics(room.settings.topicPack);
  room.currentTopic = pickRandom(topics);

  room.easyModeHints = room.settings.easyMode
    ? buildEasyModeHints(room.currentTopic, room.settings.topicPack)
    : [];

  room.revealedCount = 0;
  room.outsiderGuess = null;
  room.outsiderGuessCorrect = null;
  room.speakerOrder = [];
  room.currentSpeakerIndex = 0;
  room.speakerTimerEndsAt = null;
  room.timerEndsAt = null;
  room.voteDeadlineAt = null;

  for (const p of room.players) {
    p.hasVoted = false;
    p.vote = null;
  }

  room.phase = 'role_reveal';
}

export function resolveVotes(room: GameRoom): {
  mostVotedId: string | null;
  isTie: boolean;
  caughtOutsider: boolean;
  voteBreakdown: Record<string, string | null>;
} {
  const voteBreakdown: Record<string, string | null> = {};
  const tally: Record<string, number> = {};

  for (const p of room.players) {
    voteBreakdown[p.id] = p.vote;
    if (p.vote) {
      tally[p.vote] = (tally[p.vote] ?? 0) + 1;
    }
  }

  const entries = Object.entries(tally);
  if (entries.length === 0) {
    return { mostVotedId: null, isTie: true, caughtOutsider: false, voteBreakdown };
  }

  const maxVotes = Math.max(...entries.map(([, v]) => v));
  const leaders = entries.filter(([, v]) => v === maxVotes);
  const isTie = leaders.length > 1;
  const mostVotedId = isTie ? null : leaders[0][0];
  const caughtOutsider = !isTie && mostVotedId === room.currentOutsiderId;

  return { mostVotedId, isTie, caughtOutsider, voteBreakdown };
}

export function calculateScoreDelta(
  room: GameRoom,
  caughtOutsider: boolean,
  guessCorrect: boolean | null
): Record<string, number> {
  const delta: Record<string, number> = {};
  const outsiderId = room.currentOutsiderId;

  for (const p of room.players) {
    delta[p.id] = 0;
  }

  if (!caughtOutsider) {
    // Outsider won (not caught)
    delta[outsiderId] = 1;
  } else if (guessCorrect === true) {
    // Outsider was caught but guessed correctly
    delta[outsiderId] = 1;
  } else {
    // Outsider caught and wrong guess — non-outsiders win
    for (const p of room.players) {
      if (p.id !== outsiderId) {
        delta[p.id] = 1;
      }
    }
  }

  return delta;
}

export function applyScoreDelta(room: GameRoom, delta: Record<string, number>): void {
  for (const p of room.players) {
    p.score += delta[p.id] ?? 0;
  }
}

export function buildRoundSummary(
  room: GameRoom,
  caughtByVote: boolean,
  voteBreakdown: Record<string, string | null>,
  scoreDelta: Record<string, number>
): RoundSummary {
  const outsider = room.players.find((p) => p.id === room.currentOutsiderId);
  return {
    round: room.currentRound,
    outsiderId: room.currentOutsiderId,
    outsiderName: outsider?.name ?? '',
    topic: room.currentTopic,
    caughtByVote,
    outsiderGuess: room.outsiderGuess,
    outsiderGuessCorrect: room.outsiderGuessCorrect,
    voteBreakdown,
    scoreDelta,
  };
}

export function toPublicPlayer(p: Player): PublicPlayer {
  return {
    id: p.id,
    name: p.name,
    isHost: p.isHost,
    isConnected: p.isConnected,
    score: p.score,
    hasVoted: p.hasVoted,
  };
}

export function buildClientState(room: GameRoom): ClientGameState {
  const connectedVoters = room.players.filter((p) => p.isConnected);
  const currentSpeakerId = room.speakerOrder[room.currentSpeakerIndex] ?? null;
  return {
    roomCode: room.roomCode,
    phase: room.phase,
    players: room.players.map(toPublicPlayer),
    hostId: room.hostId,
    settings: { ...room.settings },
    currentRound: room.currentRound,
    totalRounds: room.settings.roundCount,
    timerEndsAt: room.timerEndsAt,
    speakerEndsAt: room.speakerTimerEndsAt,
    currentSpeakerId,
    speakerIndex: room.currentSpeakerIndex,
    totalSpeakers: room.speakerOrder.length,
    voteDeadlineAt: room.voteDeadlineAt,
    votesIn: room.players.filter((p) => p.hasVoted).length,
    totalVoters: connectedVoters.length,
    roundSummaries: room.roundSummaries,
    currentOutsiderId: room.currentOutsiderId,
  };
}

export function migrateHost(room: GameRoom): string | null {
  const connected = room.players
    .filter((p) => p.isConnected && p.id !== room.hostId)
    .sort((a, b) => a.joinOrder - b.joinOrder);

  if (connected.length === 0) return null;

  const newHost = connected[0];
  room.players.forEach((p) => (p.isHost = false));
  newHost.isHost = true;
  room.hostId = newHost.id;
  return newHost.id;
}

export function isGameOver(room: GameRoom): boolean {
  return room.currentRound >= room.settings.roundCount;
}

export function getScores(room: GameRoom): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const p of room.players) scores[p.id] = p.score;
  return scores;
}

export function resetForPlayAgain(room: GameRoom): void {
  room.phase = 'lobby';
  room.currentRound = 0;
  room.outsiderOrder = [];
  room.currentOutsiderId = '';
  room.currentTopic = '';
  room.easyModeHints = [];
  room.revealedCount = 0;
  room.timerEndsAt = null;
  room.voteDeadlineAt = null;
  room.outsiderGuess = null;
  room.outsiderGuessCorrect = null;
  room.lastVoteBreakdown = {};
  room.speakerOrder = [];
  room.currentSpeakerIndex = 0;
  room.speakerTimerEndsAt = null;
  room.roundSummaries = [];
  for (const p of room.players) {
    p.score = 0;
    p.hasVoted = false;
    p.vote = null;
  }
}

export function updateSettings(room: GameRoom, partial: Partial<Settings>): void {
  Object.assign(room.settings, partial);
}
