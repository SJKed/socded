import { useState } from 'react';
import { PublicPlayer } from 'shared/types';
import { socket } from '../socket';

interface Props {
  players: PublicPlayer[];
  myPlayerId: string | null;
  submitted: boolean;
  onSubmit: () => void;
}

export function VoteGrid({ players, myPlayerId, submitted, onSubmit }: Props) {
  const [selected, setSelected] = useState<string | null>(undefined as unknown as null);
  const [skipped, setSkipped] = useState(false);

  const others = players.filter((p) => p.id !== myPlayerId && p.isConnected);

  function handleSelect(id: string) {
    if (submitted) return;
    setSkipped(false);
    setSelected((prev) => (prev === id ? null : id));
  }

  function handleSkip() {
    if (submitted) return;
    setSelected(null);
    setSkipped(true);
  }

  function handleSubmit() {
    if (submitted) return;
    const targetId = skipped ? null : selected;
    socket.emit('submit_vote', { targetId });
    onSubmit();
  }

  const canSubmit = selected !== null || skipped;

  if (submitted) {
    return (
      <div className="card text-center gap-md" style={{ padding: 32 }}>
        <p style={{ fontSize: '2rem' }}>✓</p>
        <p style={{ fontWeight: 600 }}>Vote submitted</p>
        <p className="text-muted" style={{ fontSize: '0.9rem' }}>Waiting for others…</p>
      </div>
    );
  }

  return (
    <div className="gap-md">
      <div style={{ display: 'grid', gap: 10 }}>
        {others.map((p) => (
          <button
            key={p.id}
            onClick={() => handleSelect(p.id)}
            style={{
              background: selected === p.id ? 'var(--accent)' : 'var(--bg-raised)',
              color: 'var(--text)',
              border: selected === p.id
                ? '2px solid var(--accent-bright)'
                : '2px solid var(--border)',
              minHeight: 64,
              fontSize: '1.1rem',
              fontWeight: 600,
              borderRadius: 'var(--radius)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {p.name}
          </button>
        ))}
      </div>

      <button
        onClick={handleSkip}
        style={{
          background: skipped ? 'var(--bg-raised)' : 'transparent',
          color: skipped ? 'var(--text)' : 'var(--text-muted)',
          border: skipped ? '2px solid var(--border)' : '2px solid transparent',
          minHeight: 48,
          fontSize: '0.95rem',
          borderRadius: 'var(--radius-sm)',
        }}
      >
        Skip (abstain)
      </button>

      <button
        className="btn-primary btn-lg"
        onClick={handleSubmit}
        disabled={!canSubmit}
        style={{ width: '100%' }}
      >
        Lock In Vote
      </button>
    </div>
  );
}
