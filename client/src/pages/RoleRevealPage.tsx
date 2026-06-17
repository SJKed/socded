import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { socket } from '../socket';
import { HoldToReveal } from '../components/HoldToReveal';

export function RoleRevealPage() {
  const [revealed, setRevealed] = useState(false);
  const [ackSent, setAckSent] = useState(false);
  const myRole = useGameStore((s) => s.myRole);
  const myTopic = useGameStore((s) => s.myTopic);
  const myHints = useGameStore((s) => s.myHints);
  const votesIn = useGameStore((s) => s.votesIn);
  const totalVoters = useGameStore((s) => s.totalVoters);
  const currentRound = useGameStore((s) => s.currentRound);
  const totalRounds = useGameStore((s) => s.totalRounds);

  const isOutsider = myRole === 'outsider';

  function handleRevealed() {
    setRevealed(true);
    if (!ackSent) {
      socket.emit('reveal_ack');
      setAckSent(true);
    }
  }

  return (
    <div
      className="page"
      style={{
        background: isOutsider && revealed ? '#1a0a0a' : 'var(--bg)',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 32,
        minHeight: '100dvh',
        textAlign: 'center',
        transition: 'background 0.4s',
      }}
    >
      <p className="text-muted" style={{ position: 'absolute', top: 20, fontSize: '0.9rem' }}>
        Round {currentRound} of {totalRounds}
      </p>

      {!revealed ? (
        <HoldToReveal onRevealed={handleRevealed} revealed={revealed}>
          <div />
        </HoldToReveal>
      ) : (
        <div className="gap-md" style={{ width: '100%', maxWidth: 380 }}>
          {isOutsider ? (
            <>
              <div
                style={{
                  fontSize: '4rem',
                  lineHeight: 1,
                  marginBottom: 8,
                }}
              >
                🕵️
              </div>
              <h2 style={{ color: 'var(--danger)', fontSize: '1.8rem' }}>You're the Outsider</h2>
              <p className="text-muted" style={{ fontSize: '1rem', lineHeight: 1.6 }}>
                You don't know the topic. Bluff, listen carefully, and try to figure it out.
              </p>
              {myHints && myHints.length > 0 && (
                <div className="card" style={{ marginTop: 8 }}>
                  <p className="label" style={{ marginBottom: 12 }}>One of these is the topic</p>
                  <div className="gap-sm">
                    {myHints.map((h) => (
                      <div
                        key={h}
                        style={{
                          padding: '14px 16px',
                          background: 'var(--bg-raised)',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: 600,
                          fontSize: '1.05rem',
                        }}
                      >
                        {h}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>The topic is</div>
              <div
                style={{
                  fontSize: 'clamp(2rem, 10vw, 3.5rem)',
                  fontWeight: 900,
                  color: 'var(--accent-bright)',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.1,
                }}
              >
                {myTopic}
              </div>
              <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                Don't say the topic directly. Ask vague questions.
              </p>
            </>
          )}
        </div>
      )}

      {revealed && ackSent && (
        <div style={{ position: 'absolute', bottom: 32, left: 0, right: 0, textAlign: 'center' }}>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>
            {votesIn} of {totalVoters} ready
          </p>
          <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: 4 }}>
            Waiting for everyone to reveal…
          </p>
        </div>
      )}
    </div>
  );
}
