import { v4 as uuidv4 } from 'uuid';
import { GameRoom, Player } from '../../shared/types';

const rooms = new Map<string, GameRoom>();

const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateCode(): string {
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

export function createRoom(hostPlayer: Omit<Player, 'joinOrder'>): GameRoom {
  let code = generateCode();
  let attempts = 0;
  while (rooms.has(code) && attempts < 10) {
    code = generateCode();
    attempts++;
  }

  const player: Player = { ...hostPlayer, joinOrder: 0 };

  const room: GameRoom = {
    roomCode: code,
    phase: 'lobby',
    players: [player],
    hostId: player.id,
    settings: {
      roundCount: 3,
      timerSeconds: 300,
      clueTimeSeconds: 20,
      topicPack: 'default',
      easyMode: false,
    },
    currentRound: 0,
    outsiderOrder: [],
    currentOutsiderId: '',
    currentTopic: '',
    easyModeHints: [],
    revealedCount: 0,
    speakerOrder: [],
    currentSpeakerIndex: 0,
    speakerTimerEndsAt: null,
    speakerTimerIntervalId: null,
    timerEndsAt: null,
    timerIntervalId: null,
    voteDeadlineAt: null,
    voteTimeoutId: null,
    outsiderGuess: null,
    outsiderGuessCorrect: null,
    lastVoteBreakdown: {},
    roundSummaries: [],
    cleanupTimeoutId: null,
  };

  rooms.set(code, room);
  return room;
}

export function getRoom(code: string): GameRoom | undefined {
  return rooms.get(code);
}

export function deleteRoom(code: string): void {
  const room = rooms.get(code);
  if (room) {
    if (room.timerIntervalId) clearInterval(room.timerIntervalId);
    if (room.voteTimeoutId) clearTimeout(room.voteTimeoutId);
    if (room.cleanupTimeoutId) clearTimeout(room.cleanupTimeoutId);
  }
  rooms.delete(code);
}

export function mintPlayer(name: string, socketId: string): Omit<Player, 'joinOrder'> {
  return {
    id: uuidv4(),
    token: uuidv4(),
    name,
    socketId,
    isHost: false,
    isConnected: true,
    score: 0,
    hasVoted: false,
    vote: null,
  };
}

export function findPlayerByToken(token: string): { room: GameRoom; player: Player } | undefined {
  for (const room of rooms.values()) {
    const player = room.players.find((p) => p.token === token);
    if (player) return { room, player };
  }
  return undefined;
}
