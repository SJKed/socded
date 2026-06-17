import { create } from 'zustand';
import {
  ClientGameState,
  Phase,
  PublicPlayer,
  Settings,
  RoundSummary,
} from 'shared/types';

interface GameStore extends ClientGameState {
  myPlayerId: string | null;
  myRole: 'insider' | 'outsider' | null;
  myTopic: string | null;
  myHints: string[] | null;
  voteBreakdown: Record<string, string | null> | null;
  mostVotedId: string | null;
  isTie: boolean;
  topicGuessResult: { guess: string; correct: boolean; topic: string } | null;

  setMyIdentity: (playerId: string) => void;
  setMyRole: (role: 'insider' | 'outsider', topic?: string, hints?: string[]) => void;
  applyState: (state: ClientGameState) => void;
  applyPlayerJoined: (player: PublicPlayer) => void;
  applyPlayerLeft: (playerId: string, newHostId?: string) => void;
  applyVoteReceived: (voterId: string) => void;
  applyVotesRevealed: (breakdown: Record<string, string | null>, mostVotedId: string | null, isTie: boolean) => void;
  applyTopicGuessResult: (result: { guess: string; correct: boolean; topic: string }) => void;
  clearRoleState: () => void;
}

const defaultState: ClientGameState = {
  roomCode: '',
  phase: 'lobby' as Phase,
  players: [],
  hostId: '',
  settings: { roundCount: 3, timerSeconds: 300, clueTimeSeconds: 20, topicPack: 'default', easyMode: false } as Settings,
  currentRound: 0,
  totalRounds: 3,
  timerEndsAt: null,
  speakerEndsAt: null,
  currentSpeakerId: null,
  speakerIndex: 0,
  totalSpeakers: 0,
  voteDeadlineAt: null,
  votesIn: 0,
  totalVoters: 0,
  roundSummaries: [] as RoundSummary[],
  currentOutsiderId: '',
};

export const useGameStore = create<GameStore>((set) => ({
  ...defaultState,
  myPlayerId: null,
  myRole: null,
  myTopic: null,
  myHints: null,
  voteBreakdown: null,
  mostVotedId: null,
  isTie: false,
  topicGuessResult: null,

  setMyIdentity: (playerId) => set({ myPlayerId: playerId }),

  setMyRole: (role, topic, hints) =>
    set({ myRole: role, myTopic: topic ?? null, myHints: hints ?? null }),

  applyState: (state) => set({ ...state }),

  applyPlayerJoined: (player) =>
    set((s) => ({
      players: s.players.some((p) => p.id === player.id)
        ? s.players.map((p) => (p.id === player.id ? player : p))
        : [...s.players, player],
    })),

  applyPlayerLeft: (playerId, newHostId) =>
    set((s) => ({
      players: s.players.map((p) =>
        p.id === playerId
          ? { ...p, isConnected: false }
          : newHostId && p.id === newHostId
          ? { ...p, isHost: true }
          : p
      ),
      hostId: newHostId ?? s.hostId,
    })),

  applyVoteReceived: (voterId) =>
    set((s) => ({
      players: s.players.map((p) =>
        p.id === voterId ? { ...p, hasVoted: true } : p
      ),
      votesIn: s.votesIn + 1,
    })),

  applyVotesRevealed: (voteBreakdown, mostVotedId, isTie) =>
    set({ voteBreakdown, mostVotedId, isTie }),

  applyTopicGuessResult: (result) => set({ topicGuessResult: result }),

  clearRoleState: () =>
    set({
      myRole: null,
      myTopic: null,
      myHints: null,
      voteBreakdown: null,
      mostVotedId: null,
      isTie: false,
      topicGuessResult: null,
    }),
}));
