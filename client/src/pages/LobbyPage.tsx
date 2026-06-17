import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { socket } from '../socket';
import { HostSettings } from '../components/HostSettings';
import { ShareModal } from '../components/ShareModal';

export function LobbyPage() {
  const players = useGameStore((s) => s.players);
  const hostId = useGameStore((s) => s.hostId);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const roomCode = useGameStore((s) => s.roomCode);
  const isHost = myPlayerId === hostId;
  const connectedCount = players.filter((p) => p.isConnected).length;
  const canStart = connectedCount >= 4;
  const [showShare, setShowShare] = useState(false);

  return (
    <div className="page gap-lg" style={{ paddingTop: 48 }}>
      {/* Room code + share */}
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p className="label">Room Code</p>
            <h1 style={{ fontSize: 'clamp(3rem, 16vw, 5rem)', letterSpacing: '0.15em', color: 'var(--accent-bright)', lineHeight: 1 }}>
              {roomCode}
            </h1>
            <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: 4 }}>
              Share this code with friends
            </p>
          </div>
          <button
            onClick={() => setShowShare(true)}
            style={{
              marginTop: 4,
              minHeight: 44,
              padding: '0 16px',
              background: 'var(--bg-raised)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text)',
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>⬆️</span> Share
          </button>
        </div>
      </div>

      {/* Player list */}
      <div>
        <p className="label">{connectedCount} Player{connectedCount !== 1 ? 's' : ''}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {players.map((p) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                background: 'var(--bg-raised)',
                borderRadius: 'var(--radius-sm)',
                opacity: p.isConnected ? 1 : 0.45,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: p.isConnected ? '#38a169' : '#555',
                  flexShrink: 0,
                }}
              />
              <span style={{ flex: 1, fontWeight: 600, fontSize: '1.05rem' }}>
                {p.name}
                {p.id === myPlayerId && (
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.85rem' }}> (you)</span>
                )}
              </span>
              {p.isHost && <span className="badge badge-accent">Host</span>}
              {isHost && p.id !== myPlayerId && (
                <button
                  onClick={() => socket.emit('kick_player', { playerId: p.id })}
                  style={{
                    minHeight: 'unset',
                    height: 32,
                    width: 32,
                    padding: 0,
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={`Remove ${p.name}`}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {isHost && <HostSettings />}

      <div className="spacer" />

      {isHost ? (
        <div className="gap-sm">
          {!canStart && (
            <p className="text-muted text-center" style={{ fontSize: '0.9rem' }}>
              Need at least 4 players to start
            </p>
          )}
          <button
            className="btn-primary btn-lg"
            style={{ width: '100%' }}
            disabled={!canStart}
            onClick={() => socket.emit('start_game')}
          >
            Start Game
          </button>
        </div>
      ) : (
        <p className="text-muted text-center" style={{ fontSize: '0.95rem' }}>
          Waiting for the host to start…
        </p>
      )}

      {showShare && <ShareModal roomCode={roomCode} onClose={() => setShowShare(false)} />}
    </div>
  );
}
