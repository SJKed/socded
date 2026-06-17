import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { useGameStore } from '../store/gameStore';
import { saveSession } from '../hooks/useReconnect';
import {
  CreateRoomAckPayload,
  JoinRoomAckPayload,
} from 'shared/types';

export function LandingPage() {
  const navigate = useNavigate();
  const setMyIdentity = useGameStore((s) => s.setMyIdentity);
  const [mode, setMode] = useState<'home' | 'create' | 'join'>('home');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function connect() {
    if (!socket.connected) socket.connect();
  }

  function handleCreate() {
    if (!name.trim()) { setError('Enter your name first.'); return; }
    setError('');
    setLoading(true);
    connect();

    socket.once('create_room_ack', (payload: CreateRoomAckPayload) => {
      setLoading(false);
      setMyIdentity(payload.playerId);
      saveSession({ roomCode: payload.roomCode, playerId: payload.playerId, token: payload.token, name: name.trim() });
      navigate(`/room/${payload.roomCode}`);
    });

    socket.emit('create_room', { name: name.trim() });
  }

  function handleJoin() {
    if (!name.trim()) { setError('Enter your name.'); return; }
    if (!code.trim()) { setError('Enter a room code.'); return; }
    setError('');
    setLoading(true);
    connect();

    socket.once('join_room_ack', (payload: JoinRoomAckPayload) => {
      setLoading(false);
      if (!payload.ok || !payload.playerId || !payload.token) {
        setError(payload.error ?? 'Could not join room.');
        return;
      }
      setMyIdentity(payload.playerId);
      saveSession({ roomCode: code.toUpperCase().trim(), playerId: payload.playerId, token: payload.token, name: name.trim() });
      navigate(`/room/${code.toUpperCase().trim()}`);
    });

    socket.emit('join_room', { name: name.trim(), roomCode: code.toUpperCase().trim() });
  }

  return (
    <div className="page" style={{ justifyContent: 'center', gap: 32, maxWidth: 420, margin: '0 auto', width: '100%' }}>
      <div className="text-center">
        <h1 style={{ fontSize: 'clamp(2.5rem, 12vw, 4rem)', letterSpacing: '-0.02em' }}>
          Outsider
        </h1>
        <p className="text-muted" style={{ marginTop: 8, fontSize: '1.05rem' }}>
          The real-life social deduction game
        </p>
      </div>

      {mode === 'home' && (
        <div className="gap-md">
          <button
            className="btn-primary btn-lg"
            style={{ width: '100%' }}
            onClick={() => setMode('create')}
          >
            Create Room
          </button>
          <button
            className="btn-ghost btn-lg"
            style={{ width: '100%' }}
            onClick={() => setMode('join')}
          >
            Join Room
          </button>
        </div>
      )}

      {mode === 'create' && (
        <div className="gap-md">
          <div>
            <p className="label">Your Name</p>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              maxLength={20}
              autoFocus
            />
          </div>
          {error && <p className="text-danger" style={{ fontSize: '0.9rem' }}>{error}</p>}
          <button
            className="btn-primary btn-lg"
            style={{ width: '100%' }}
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? 'Creating…' : 'Create Room'}
          </button>
          <button className="btn-ghost" style={{ width: '100%' }} onClick={() => { setMode('home'); setError(''); }}>
            Back
          </button>
        </div>
      )}

      {mode === 'join' && (
        <div className="gap-md">
          <div>
            <p className="label">Your Name</p>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              autoFocus
            />
          </div>
          <div>
            <p className="label">Room Code</p>
            <input
              type="text"
              placeholder="e.g. ABCD"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 4))}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              style={{ letterSpacing: '0.2em', fontWeight: 700, fontSize: '1.4rem', textAlign: 'center' }}
              maxLength={4}
            />
          </div>
          {error && <p className="text-danger" style={{ fontSize: '0.9rem' }}>{error}</p>}
          <button
            className="btn-primary btn-lg"
            style={{ width: '100%' }}
            onClick={handleJoin}
            disabled={loading}
          >
            {loading ? 'Joining…' : 'Join Room'}
          </button>
          <button className="btn-ghost" style={{ width: '100%' }} onClick={() => { setMode('home'); setError(''); }}>
            Back
          </button>
        </div>
      )}
    </div>
  );
}
