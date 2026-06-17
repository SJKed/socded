import { useGameStore } from '../store/gameStore';
import { socket } from '../socket';
import { clearSession } from '../hooks/useReconnect';
import { useNavigate } from 'react-router-dom';

const MEDALS = ['🥇', '🥈', '🥉'];

export function LeaderboardPage() {
  const players = useGameStore((s) => s.players);
  const hostId = useGameStore((s) => s.hostId);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const navigate = useNavigate();

  const isHost = myPlayerId === hostId;
  const sorted = [...players].sort((a, b) => b.score - a.score);

  function handlePlayAgain() {
    socket.emit('play_again');
  }

  function handleLeave() {
    clearSession();
    socket.disconnect();
    navigate('/');
  }

  return (
    <div className="page gap-lg" style={{ paddingTop: 48 }}>
      <div className="text-center">
        <p style={{ fontSize: '3rem', marginBottom: 8 }}>🏆</p>
        <h1>Final Results</h1>
      </div>

      <div className="gap-sm">
        {sorted.map((p, i) => (
          <div
            key={p.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '16px 20px',
              background: i === 0 ? 'rgba(124,58,237,0.15)' : 'var(--bg-surface)',
              border: `1px solid ${i === 0 ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)',
            }}
          >
            <span style={{ fontSize: '1.6rem', width: 36, textAlign: 'center' }}>
              {MEDALS[i] ?? `${i + 1}.`}
            </span>
            <span style={{ flex: 1, fontWeight: i === 0 ? 800 : 600, fontSize: '1.1rem' }}>
              {p.name}
              {p.id === myPlayerId && (
                <span className="text-muted" style={{ fontWeight: 400, fontSize: '0.85rem' }}> (you)</span>
              )}
            </span>
            <span
              style={{
                fontWeight: 800,
                fontSize: '1.4rem',
                color: i === 0 ? 'var(--accent-bright)' : 'var(--text)',
              }}
            >
              {p.score}
            </span>
          </div>
        ))}
      </div>

      <div className="spacer" />

      <div className="gap-sm">
        {isHost && (
          <button className="btn-primary btn-lg" style={{ width: '100%' }} onClick={handlePlayAgain}>
            Play Again
          </button>
        )}
        <button className="btn-ghost" style={{ width: '100%' }} onClick={handleLeave}>
          Leave Game
        </button>
      </div>
    </div>
  );
}
