import { Server } from 'socket.io';
import { GameRoom } from '../../shared/types';

export function startRoundTimer(
  io: Server,
  room: GameRoom,
  onExpire: () => void
): void {
  stopTimer(room);
  room.timerEndsAt = Date.now() + room.settings.timerSeconds * 1000;

  room.timerIntervalId = setInterval(() => {
    if (room.timerEndsAt === null) return;
    const secondsLeft = Math.max(0, Math.round((room.timerEndsAt - Date.now()) / 1000));
    io.to(room.roomCode).emit('timer_tick', { secondsLeft });
    if (secondsLeft <= 0) {
      stopTimer(room);
      onExpire();
    }
  }, 1000);
}

export function stopTimer(room: GameRoom): void {
  if (room.timerIntervalId !== null) {
    clearInterval(room.timerIntervalId);
    room.timerIntervalId = null;
  }
  room.timerEndsAt = null;
}

export function startVoteTimer(
  io: Server,
  room: GameRoom,
  seconds: number,
  onExpire: () => void
): void {
  if (room.voteTimeoutId !== null) clearTimeout(room.voteTimeoutId);
  room.voteDeadlineAt = Date.now() + seconds * 1000;
  room.voteTimeoutId = setTimeout(() => {
    room.voteTimeoutId = null;
    onExpire();
  }, seconds * 1000);
}

export function stopVoteTimer(room: GameRoom): void {
  if (room.voteTimeoutId !== null) {
    clearTimeout(room.voteTimeoutId);
    room.voteTimeoutId = null;
  }
  room.voteDeadlineAt = null;
}

export function startSpeakerTimer(
  io: Server,
  room: GameRoom,
  seconds: number,
  onExpire: () => void
): void {
  stopSpeakerTimer(room);
  room.speakerTimerEndsAt = Date.now() + seconds * 1000;
  room.speakerTimerIntervalId = setInterval(() => {
    if (room.speakerTimerEndsAt === null) return;
    const secondsLeft = Math.max(0, Math.round((room.speakerTimerEndsAt - Date.now()) / 1000));
    io.to(room.roomCode).emit('speaker_tick', { secondsLeft });
    if (secondsLeft <= 0) {
      stopSpeakerTimer(room);
      onExpire();
    }
  }, 1000);
}

export function stopSpeakerTimer(room: GameRoom): void {
  if (room.speakerTimerIntervalId !== null) {
    clearInterval(room.speakerTimerIntervalId);
    room.speakerTimerIntervalId = null;
  }
  room.speakerTimerEndsAt = null;
}
