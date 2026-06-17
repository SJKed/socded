import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { socket } from '../socket';
import { haptics } from '../utils/haptics';

export function RoundPage() {
  const players = useGameStore((s) => s.players);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const myRole = useGameStore((s) => s.myRole);
  const currentRound = useGameStore((s) => s.currentRound);
  const totalRounds = useGameStore((s) => s.totalRounds);
  const timerEndsAt = useGameStore((s) => s.timerEndsAt);
  const speakerEndsAt = useGameStore((s) => s.speakerEndsAt);
  const currentSpeakerId = useGameStore((s) => s.currentSpeakerId);
  const speakerIndex = useGameStore((s) => s.speakerIndex);
  const totalSpeakers = useGameStore((s) => s.totalSpeakers);
  const settings = useGameStore((s) => s.settings);

  const [speakerSecondsLeft, setSpeakerSecondsLeft] = useState(settings.clueTimeSeconds);
  const [roundSecondsLeft, setRoundSecondsLeft] = useState(settings.timerSeconds);
  const prevSpeakerSeconds = useRef(settings.clueTimeSeconds);

  const isMyTurn = currentSpeakerId === myPlayerId;
  const currentSpeaker = players.find((p) => p.id === currentSpeakerId);

  useEffect(() => {
    if (!speakerEndsAt) return;
    const tick = () => {
      const left = Math.max(0, Math.round((speakerEndsAt - Date.now()) / 1000));
      setSpeakerSecondsLeft(left);
      // Haptic tick for the last 3 seconds on your own turn
      if (isMyTurn && left <= 3 && left > 0 && left !== prevSpeakerSeconds.current) {
        haptics.tick();
      }
      prevSpeakerSeconds.current = left;
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [speakerEndsAt, isMyTurn]);

  useEffect(() => {
    if (!timerEndsAt || timerEndsAt > 9_000_000_000_000) return;
    const tick = () => setRoundSecondsLeft(Math.max(0, Math.round((timerEndsAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [timerEndsAt]);

  const speakerPct = Math.min(1, speakerSecondsLeft / settings.clueTimeSeconds);
  const isUrgent = speakerSecondsLeft <= 5;
  const circumference = 2 * Math.PI * 54;
  const hasMaxTimer = timerEndsAt !== null && timerEndsAt < 9_000_000_000_000;

  const mins = Math.floor(roundSecondsLeft / 60);
  const secs = roundSecondsLeft % 60;
  const roundDisplay = `${mins}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className="page" style={{ paddingTop: 52, gap: 0 }}>

      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <span className="badge badge-muted">Round {currentRound}/{totalRounds}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {hasMaxTimer && (
            <span className="text-muted" style={{ fontSize: '0.85rem', fontVariantNumeric: 'tabular-nums' }}>
              {roundDisplay}
            </span>
          )}
          <span
            className="badge"
            style={{
              background: myRole === 'outsider' ? 'rgba(229,62,62,0.15)' : 'var(--accent-dim)',
              color: myRole === 'outsider' ? 'var(--danger)' : 'var(--accent-bright)',
            }}
          >
            {myRole === 'outsider' ? '🕵️ Outsider' : '✓ Insider'}
          </span>
        </div>
      </div>

      {/* Speaker spotlight */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          padding: '0 8px',
        }}
      >
        {/* Circular timer */}
        <div style={{ position: 'relative', width: 132, height: 132 }}>
          <svg width={132} height={132} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={66} cy={66} r={54} fill="none" stroke="var(--bg-raised)" strokeWidth={8} />
            <circle
              cx={66}
              cy={66}
              r={54}
              fill="none"
              stroke={isUrgent ? 'var(--danger)' : isMyTurn ? 'var(--accent)' : 'var(--text-muted)'}
              strokeWidth={8}
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - speakerPct)}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s linear, stroke 0.3s' }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <span
              style={{
                fontSize: '2.2rem',
                fontWeight: 900,
                fontVariantNumeric: 'tabular-nums',
                color: isUrgent ? 'var(--danger)' : 'var(--text)',
                lineHeight: 1,
                transition: 'color 0.3s',
              }}
            >
              {speakerSecondsLeft}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>sec</span>
          </div>
        </div>

        {/* Speaker name */}
        {isMyTurn ? (
          <div style={{ textAlign: 'center', gap: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                fontSize: 'clamp(1.6rem, 8vw, 2.4rem)',
                fontWeight: 900,
                color: 'var(--accent-bright)',
                letterSpacing: '-0.01em',
              }}
            >
              Your turn!
            </div>
            <p className="text-muted" style={{ fontSize: '0.95rem' }}>
              Give a clue without saying the topic
            </p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', gap: 6, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Now speaking</div>
            <div
              style={{
                fontSize: 'clamp(1.6rem, 8vw, 2.4rem)',
                fontWeight: 900,
                letterSpacing: '-0.01em',
              }}
            >
              {currentSpeaker?.name ?? '…'}
            </div>
          </div>
        )}

        {/* Turn indicator dots */}
        {totalSpeakers > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 240 }}>
            {Array.from({ length: totalSpeakers }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: i < speakerIndex
                    ? 'var(--text-muted)'
                    : i === speakerIndex
                    ? (isMyTurn ? 'var(--accent-bright)' : 'var(--text)')
                    : 'var(--bg-raised)',
                  border: i === speakerIndex ? '2px solid currentColor' : '2px solid transparent',
                  transition: 'background 0.3s',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Player list — compact */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {players.map((p) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                background: p.id === currentSpeakerId ? 'var(--accent-dim)' : 'var(--bg-raised)',
                borderRadius: 'var(--radius-sm)',
                border: p.id === currentSpeakerId ? '1px solid var(--accent)' : '1px solid transparent',
                opacity: p.isConnected ? 1 : 0.4,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: p.isConnected ? '#38a169' : '#555',
                  flexShrink: 0,
                }}
              />
              <span style={{ flex: 1, fontWeight: p.id === currentSpeakerId ? 700 : 500 }}>
                {p.name}
                {p.id === myPlayerId && (
                  <span className="text-muted" style={{ fontWeight: 400, fontSize: '0.8rem' }}> (you)</span>
                )}
              </span>
              {p.id === currentSpeakerId && (
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-bright)', fontWeight: 700 }}>speaking</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 8 }}>
        {isMyTurn && (
          <button
            className="btn-primary btn-lg"
            style={{ width: '100%' }}
            onClick={() => socket.emit('end_my_turn')}
          >
            Done — Pass Turn
          </button>
        )}
        <button
          style={{
            width: '100%',
            minHeight: 56,
            background: 'rgba(229,62,62,0.12)',
            color: 'var(--danger)',
            border: '1px solid rgba(229,62,62,0.3)',
            borderRadius: 'var(--radius)',
            fontSize: '1rem',
            fontWeight: 700,
          }}
          onClick={() => socket.emit('call_vote')}
        >
          Call a Vote
        </button>
      </div>
    </div>
  );
}
