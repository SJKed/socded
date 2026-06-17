import { useEffect } from 'react';
import { socket } from '../socket';
import { useGameStore } from '../store/gameStore';

const STORAGE_KEY = 'outsider_session';

export interface StoredSession {
  roomCode: string;
  playerId: string;
  token: string;
  name: string;
}

export function saveSession(session: StoredSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

export function useReconnect(): void {
  const setMyIdentity = useGameStore((s) => s.setMyIdentity);

  useEffect(() => {
    const session = loadSession();
    if (!session) return;

    setMyIdentity(session.playerId);

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('join_room', {
      name: session.name,
      roomCode: session.roomCode,
      token: session.token,
    });
  }, []);
}
