import { useRef, useState } from 'react';

interface Props {
  onRevealed: () => void;
  revealed: boolean;
  children: React.ReactNode;
}

const HOLD_MS = 700;

export function HoldToReveal({ onRevealed, revealed, children }: Props) {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);

  function startHold() {
    if (revealed) return;
    startRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min(1, elapsed / HOLD_MS);
      setProgress(pct);
      if (pct >= 1) {
        clearHold();
        onRevealed();
      }
    }, 16);
  }

  function clearHold() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setProgress(0);
  }

  if (revealed) {
    return <>{children}</>;
  }

  const circumference = 2 * Math.PI * 38;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 32,
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <div
        onPointerDown={startHold}
        onPointerUp={clearHold}
        onPointerCancel={clearHold}
        onPointerLeave={clearHold}
        style={{
          touchAction: 'none',
          cursor: 'pointer',
          position: 'relative',
          width: 96,
          height: 96,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width={96}
          height={96}
          style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}
        >
          <circle cx={48} cy={48} r={38} fill="none" stroke="var(--bg-raised)" strokeWidth={6} />
          <circle
            cx={48}
            cy={48}
            r={38}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={6}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            strokeLinecap="round"
            style={{ transition: progress === 0 ? 'stroke-dashoffset 0.1s' : 'none' }}
          />
        </svg>
        <span style={{ fontSize: '2rem' }}>👁</span>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', textAlign: 'center' }}>
        Hold to reveal your role
      </p>
    </div>
  );
}
