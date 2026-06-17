import { PublicPlayer } from 'shared/types';

interface Props {
  players: PublicPlayer[];
  myPlayerId?: string | null;
  showScore?: boolean;
  highlightId?: string | null;
}

export function PlayerList({ players, myPlayerId, showScore, highlightId }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {players.map((p) => (
        <div
          key={p.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            background: highlightId === p.id ? 'var(--accent-dim)' : 'var(--bg-raised)',
            borderRadius: 'var(--radius-sm)',
            border: highlightId === p.id ? '1px solid var(--accent)' : '1px solid transparent',
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
          {p.isHost && (
            <span className="badge badge-accent">Host</span>
          )}
          {showScore && (
            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-bright)' }}>
              {p.score} pts
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
