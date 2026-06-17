import { useEffect, useState } from 'react';

interface Props {
  endsAt: number | null;
  totalSeconds: number;
  urgent?: number;
}

export function CountdownTimer({ endsAt, totalSeconds, urgent = 30 }: Props) {
  const [secondsLeft, setSecondsLeft] = useState<number>(totalSeconds);

  useEffect(() => {
    if (endsAt === null) return;

    const tick = () => {
      const left = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setSecondsLeft(left);
    };

    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [endsAt]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const display = `${mins}:${secs.toString().padStart(2, '0')}`;
  const isUrgent = secondsLeft <= urgent;
  const pct = endsAt ? Math.min(1, secondsLeft / totalSeconds) : 1;

  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          fontSize: 'clamp(4rem, 20vw, 7rem)',
          fontWeight: 900,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.02em',
          color: isUrgent ? 'var(--danger)' : 'var(--text)',
          lineHeight: 1,
          transition: 'color 0.3s',
        }}
      >
        {display}
      </div>
      <div
        style={{
          height: 6,
          background: 'var(--bg-raised)',
          borderRadius: 999,
          marginTop: 16,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct * 100}%`,
            background: isUrgent ? 'var(--danger)' : 'var(--accent)',
            borderRadius: 999,
            transition: 'width 0.5s linear, background 0.3s',
          }}
        />
      </div>
    </div>
  );
}
