import { Server, Socket } from 'socket.io';
import {
  createRoom,
  getRoom,
  deleteRoom,
  mintPlayer,
  findPlayerByToken,
} from './roomManager';
import {
  buildClientState,
  startRound,
  buildSpeakerOrder,
  resolveVotes,
  calculateScoreDelta,
  applyScoreDelta,
  buildRoundSummary,
  migrateHost,
  isGameOver,
  getScores,
  resetForPlayAgain,
  updateSettings,
  toPublicPlayer,
} from './gameEngine';
import {
  startRoundTimer,
  stopTimer,
  startVoteTimer,
  stopVoteTimer,
  startSpeakerTimer,
  stopSpeakerTimer,
} from './timerService';
import {
  CreateRoomPayload,
  JoinRoomPayload,
  UpdateSettingsPayload,
  SubmitVotePayload,
  SubmitTopicGuessPayload,
  GameRoom,
  Player,
} from '../../shared/types';

const VOTE_WINDOW_SECONDS = 20;
const TOPIC_GUESS_SECONDS = 30;

function broadcastState(io: Server, room: GameRoom): void {
  io.to(room.roomCode).emit('state_sync', buildClientState(room));
}

function sendRole(socket: Socket, room: GameRoom, player: Player): void {
  if (player.id === room.currentOutsiderId) {
    socket.emit('your_role', {
      role: 'outsider',
      hints: room.settings.easyMode ? room.easyModeHints : undefined,
    });
  } else {
    socket.emit('your_role', {
      role: 'insider',
      topic: room.currentTopic,
    });
  }
}

export function registerHandlers(io: Server, socket: Socket): void {
  // ── Create Room ──────────────────────────────────────────────────────────
  socket.on('create_room', ({ name }: CreateRoomPayload) => {
    if (!name?.trim()) {
      socket.emit('error', { code: 'INVALID_NAME', message: 'Name is required.' });
      return;
    }

    const base = mintPlayer(name.trim(), socket.id);
    const hostBase = { ...base, isHost: true };
    const room = createRoom(hostBase);
    const player = room.players[0];

    socket.join(room.roomCode);
    socket.data.playerId = player.id;
    socket.data.roomCode = room.roomCode;

    socket.emit('create_room_ack', {
      roomCode: room.roomCode,
      playerId: player.id,
      token: player.token,
    });

    broadcastState(io, room);
  });

  // ── Join Room ─────────────────────────────────────────────────────────────
  socket.on('join_room', ({ name, roomCode, token }: JoinRoomPayload) => {
    const code = roomCode?.toUpperCase().trim();
    const room = getRoom(code);

    if (!room) {
      socket.emit('join_room_ack', { ok: false, error: 'Room not found.' });
      return;
    }

    // Reconnect path
    if (token) {
      const existing = findPlayerByToken(token);
      if (existing && existing.room.roomCode === code) {
        const { player } = existing;
        player.socketId = socket.id;
        player.isConnected = true;
        if (room.cleanupTimeoutId) {
          clearTimeout(room.cleanupTimeoutId);
          room.cleanupTimeoutId = null;
        }

        socket.join(code);
        socket.data.playerId = player.id;
        socket.data.roomCode = code;

        socket.emit('join_room_ack', { ok: true, playerId: player.id, token: player.token });
        socket.emit('reconnect_success', { state: buildClientState(room) });

        if (room.phase !== 'lobby') {
          sendRole(socket, room, player);
        }

        socket.to(code).emit('player_joined', { player: toPublicPlayer(player) });
        broadcastState(io, room);
        return;
      }
    }

    // New player
    if (room.phase !== 'lobby') {
      socket.emit('join_room_ack', { ok: false, error: 'Game already in progress.' });
      return;
    }

    if (!name?.trim()) {
      socket.emit('join_room_ack', { ok: false, error: 'Name is required.' });
      return;
    }

    const trimmed = name.trim();
    if (room.players.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      socket.emit('join_room_ack', { ok: false, error: 'Name already taken.' });
      return;
    }

    if (room.players.length >= 10) {
      socket.emit('join_room_ack', { ok: false, error: 'Room is full.' });
      return;
    }

    const joinOrder = Math.max(...room.players.map((p) => p.joinOrder)) + 1;
    const base = mintPlayer(trimmed, socket.id);
    const player: Player = { ...base, joinOrder };
    room.players.push(player);

    socket.join(code);
    socket.data.playerId = player.id;
    socket.data.roomCode = code;

    socket.emit('join_room_ack', { ok: true, playerId: player.id, token: player.token });
    broadcastState(io, room);
  });

  // ── Update Settings ───────────────────────────────────────────────────────
  socket.on('update_settings', (payload: UpdateSettingsPayload) => {
    const room = getRoom(socket.data.roomCode);
    if (!room || room.phase !== 'lobby') return;
    const player = room.players.find((p) => p.id === socket.data.playerId);
    if (!player?.isHost) return;

    updateSettings(room, payload);
    broadcastState(io, room);
  });

  // ── Start Game ────────────────────────────────────────────────────────────
  socket.on('start_game', () => {
    const room = getRoom(socket.data.roomCode);
    if (!room || room.phase !== 'lobby') return;
    const player = room.players.find((p) => p.id === socket.data.playerId);
    if (!player?.isHost) return;

    const connected = room.players.filter((p) => p.isConnected);
    if (connected.length < 4) {
      socket.emit('error', { code: 'NOT_ENOUGH_PLAYERS', message: 'Need at least 4 players.' });
      return;
    }

    startRound(room);
    broadcastState(io, room);

    for (const p of room.players) {
      const pSocket = io.sockets.sockets.get(p.socketId);
      if (pSocket) sendRole(pSocket, room, p);
    }
  });

  // ── Reveal Ack ────────────────────────────────────────────────────────────
  socket.on('reveal_ack', () => {
    const room = getRoom(socket.data.roomCode);
    if (!room || room.phase !== 'role_reveal') return;

    const player = room.players.find((p) => p.id === socket.data.playerId);
    if (!player || player.hasVoted) return; // reuse hasVoted as "has ack'd reveal"

    player.hasVoted = true;
    room.revealedCount += 1;

    broadcastState(io, room);

    const connectedCount = room.players.filter((p) => p.isConnected).length;
    if (room.revealedCount >= connectedCount) {
      const startsAt = Date.now() + 2000;
      io.to(room.roomCode).emit('all_revealed', { startsAt });

      setTimeout(() => {
        const r = getRoom(room.roomCode);
        if (!r || r.phase !== 'role_reveal') return;
        r.phase = 'round';

        for (const p of r.players) {
          p.hasVoted = false;
          p.vote = null;
        }

        // Start main round timer (hard cap — outsider wins if it expires)
        startRoundTimer(io, r, () => {
          const rr = getRoom(r.roomCode);
          if (!rr || rr.phase !== 'round') return;
          stopSpeakerTimer(rr);
          rr.phase = 'round_summary';

          const delta = calculateScoreDelta(rr, false, null);
          applyScoreDelta(rr, delta);
          const summary = buildRoundSummary(rr, false, {}, delta);
          rr.roundSummaries.push(summary);

          io.to(rr.roomCode).emit('timer_expired', {});
          broadcastState(io, rr);
          io.to(rr.roomCode).emit('round_summary_shown', { summary, scores: getScores(rr) });
        });

        // Start speaker rotation
        advanceSpeaker(io, r);

        broadcastState(io, r);
      }, 2000);
    }
  });

  // ── End My Turn ───────────────────────────────────────────────────────────
  socket.on('end_my_turn', () => {
    const room = getRoom(socket.data.roomCode);
    if (!room || room.phase !== 'round') return;
    if (room.speakerOrder[room.currentSpeakerIndex] !== socket.data.playerId) return;

    stopSpeakerTimer(room);
    advanceSpeaker(io, room);
    broadcastState(io, room);
  });

  // ── Call Vote ─────────────────────────────────────────────────────────────
  socket.on('call_vote', () => {
    const room = getRoom(socket.data.roomCode);
    if (!room || room.phase !== 'round') return;

    const player = room.players.find((p) => p.id === socket.data.playerId);
    if (!player) return;

    stopTimer(room);
    stopSpeakerTimer(room);
    room.phase = 'voting';

    for (const p of room.players) {
      p.hasVoted = false;
      p.vote = null;
    }

    startVoteTimer(io, room, VOTE_WINDOW_SECONDS, () => {
      resolveAndBroadcastVote(io, room);
    });

    broadcastState(io, room);
    io.to(room.roomCode).emit('vote_called', {
      calledBy: player.id,
      deadlineAt: room.voteDeadlineAt,
    });
  });

  // ── Submit Vote ───────────────────────────────────────────────────────────
  socket.on('submit_vote', ({ targetId }: SubmitVotePayload) => {
    const room = getRoom(socket.data.roomCode);
    if (!room || room.phase !== 'voting') return;

    const player = room.players.find((p) => p.id === socket.data.playerId);
    if (!player || player.hasVoted) return;

    player.hasVoted = true;
    player.vote = targetId;

    broadcastState(io, room);
    socket.to(room.roomCode).emit('vote_received', { voterId: player.id });

    const connected = room.players.filter((p) => p.isConnected);
    const allVoted = connected.every((p) => p.hasVoted);
    if (allVoted) {
      stopVoteTimer(room);
      resolveAndBroadcastVote(io, room);
    }
  });

  // ── Submit Topic Guess ────────────────────────────────────────────────────
  socket.on('submit_topic_guess', ({ guess }: SubmitTopicGuessPayload) => {
    const room = getRoom(socket.data.roomCode);
    if (!room || room.phase !== 'topic_guess') return;
    if (socket.data.playerId !== room.currentOutsiderId) return;

    stopVoteTimer(room);

    const correct =
      guess.trim().toLowerCase() === room.currentTopic.toLowerCase();
    room.outsiderGuess = guess.trim();
    room.outsiderGuessCorrect = correct;

    const delta = calculateScoreDelta(room, true, correct);
    applyScoreDelta(room, delta);
    const summary = buildRoundSummary(room, true, room.lastVoteBreakdown, delta);
    room.roundSummaries.push(summary);

    room.phase = 'round_summary';

    io.to(room.roomCode).emit('topic_guess_result', {
      guess: guess.trim(),
      correct,
      topic: room.currentTopic,
    });
    broadcastState(io, room);
    io.to(room.roomCode).emit('round_summary_shown', { summary, scores: getScores(room) });
  });

  // ── Next Round ────────────────────────────────────────────────────────────
  socket.on('next_round', () => {
    const room = getRoom(socket.data.roomCode);
    if (!room || room.phase !== 'round_summary') return;
    const player = room.players.find((p) => p.id === socket.data.playerId);
    if (!player?.isHost) return;

    if (isGameOver(room)) {
      room.phase = 'leaderboard';
      broadcastState(io, room);
      io.to(room.roomCode).emit('game_over', {
        scores: getScores(room),
        roundSummaries: room.roundSummaries,
      });
      return;
    }

    startRound(room);
    broadcastState(io, room);

    for (const p of room.players) {
      const pSocket = io.sockets.sockets.get(p.socketId);
      if (pSocket) sendRole(pSocket, room, p);
    }
  });

  // ── Play Again ────────────────────────────────────────────────────────────
  socket.on('play_again', () => {
    const room = getRoom(socket.data.roomCode);
    if (!room || room.phase !== 'leaderboard') return;
    const player = room.players.find((p) => p.id === socket.data.playerId);
    if (!player?.isHost) return;

    resetForPlayAgain(room);
    broadcastState(io, room);
    io.to(room.roomCode).emit('game_reset', { state: buildClientState(room) });
  });

  // ── Disconnect ────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const room = getRoom(socket.data.roomCode);
    if (!room) return;

    const player = room.players.find((p) => p.id === socket.data.playerId);
    if (!player) return;

    player.isConnected = false;

    let newHostId: string | undefined;
    if (player.isHost) {
      player.isHost = false;
      const promoted = migrateHost(room);
      if (promoted) newHostId = promoted;
    }

    io.to(room.roomCode).emit('player_left', {
      playerId: player.id,
      newHostId,
    });

    const connected = room.players.filter((p) => p.isConnected);

    if (connected.length === 0) {
      room.cleanupTimeoutId = setTimeout(() => {
        deleteRoom(room.roomCode);
      }, 60_000);
    } else {
      // If everyone voted, resolve early
      if (room.phase === 'voting') {
        const allVoted = connected.every((p) => p.hasVoted);
        if (allVoted) {
          stopVoteTimer(room);
          resolveAndBroadcastVote(io, room);
          return;
        }
      }
      broadcastState(io, room);
    }
  });
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function advanceSpeaker(io: Server, room: GameRoom): void {
  if (room.phase !== 'round') return;

  // Build a fresh rotation when starting or when a full lap is done
  if (
    room.speakerOrder.length === 0 ||
    room.currentSpeakerIndex >= room.speakerOrder.length
  ) {
    room.speakerOrder = buildSpeakerOrder(room.players);
    room.currentSpeakerIndex = 0;
  }

  const speakerId = room.speakerOrder[room.currentSpeakerIndex];
  const speaker = room.players.find((p) => p.id === speakerId);

  io.to(room.roomCode).emit('speaker_changed', {
    speakerId,
    speakerName: speaker?.name ?? '',
    speakerIndex: room.currentSpeakerIndex,
    totalSpeakers: room.speakerOrder.length,
    endsAt: Date.now() + room.settings.clueTimeSeconds * 1000,
  });

  startSpeakerTimer(io, room, room.settings.clueTimeSeconds, () => {
    const r = getRoom(room.roomCode);
    if (!r || r.phase !== 'round') return;
    r.currentSpeakerIndex += 1;
    advanceSpeaker(io, r);
    broadcastState(io, r);
  });
}

function resolveAndBroadcastVote(io: Server, room: GameRoom): void {
  const { mostVotedId, isTie, caughtOutsider, voteBreakdown } = resolveVotes(room);
  room.lastVoteBreakdown = voteBreakdown;

  room.phase = 'vote_result';
  broadcastState(io, room);

  io.to(room.roomCode).emit('votes_revealed', { voteBreakdown, mostVotedId, isTie });

  if (caughtOutsider) {
    room.phase = 'topic_guess';
    broadcastState(io, room);
    io.to(room.roomCode).emit('outsider_caught', { outsiderId: room.currentOutsiderId });

    // 30s for outsider to guess
    startVoteTimer(io, room, TOPIC_GUESS_SECONDS, () => {
      const r = getRoom(room.roomCode);
      if (!r || r.phase !== 'topic_guess') return;

      // Time's up — outsider fails
      r.outsiderGuessCorrect = false;
      const delta = calculateScoreDelta(r, true, false);
      applyScoreDelta(r, delta);
      const summary = buildRoundSummary(r, true, r.lastVoteBreakdown, delta);
      r.roundSummaries.push(summary);
      r.phase = 'round_summary';

      io.to(r.roomCode).emit('topic_guess_result', {
        guess: '',
        correct: false,
        topic: r.currentTopic,
      });
      broadcastState(io, r);
      io.to(r.roomCode).emit('round_summary_shown', { summary, scores: getScores(r) });
    });
  } else {
    // Outsider escaped
    const delta = calculateScoreDelta(room, false, null);
    applyScoreDelta(room, delta);
    const summary = buildRoundSummary(room, false, voteBreakdown, delta);
    room.roundSummaries.push(summary);
    room.phase = 'round_summary';

    io.to(room.roomCode).emit('outsider_escaped', {
      outsiderId: room.currentOutsiderId,
      topic: room.currentTopic,
    });
    broadcastState(io, room);
    io.to(room.roomCode).emit('round_summary_shown', {
      summary,
      scores: getScores(room),
    });
  }
}
