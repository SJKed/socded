import { useGameStore } from '../store/gameStore';

export function RoomCodeBadge() {
  const roomCode = useGameStore((s) => s.roomCode);
  if (!roomCode) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 'env(safe-area-inset-top, 0)',
      right: 0,
      padding: '8px 14px',
      background: 'var(--bg-surface)',
      borderBottomLeftRadius: 'var(--radius-sm)',
      borderBottom: '1px solid var(--border)',
      borderLeft: '1px solid var(--border)',
      fontSize: '0.75rem',
      fontWeight: 700,
      letterSpacing: '0.12em',
      color: 'var(--text-muted)',
      zIndex: 100,
    }}>
      {roomCode}
    </div>
  );
}
