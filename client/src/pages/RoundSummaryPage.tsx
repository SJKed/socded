import { useGameStore } from '../store/gameStore';
import { socket } from '../socket';
import { PlayerList } from '../components/PlayerList';

export function RoundSummaryPage() {
  const roundSummaries = useGameStore((s) => s.roundSummaries);
  const players = useGameStore((s) => s.players);
  const hostId = useGameStore((s) => s.hostId);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const currentRound = useGameStore((s) => s.currentRound);
  const totalRounds = useGameStore((s) => s.totalRounds);

  const isHost = myPlayerId === hostId;
  const isLastRound = currentRound >= totalRounds;

  const summary = roundSummaries[roundSummaries.length - 1];
  if (!summary) return null;

  const outsiderWon =
    !summary.caughtByVote ||
    summary.outsiderGuessCorrect === true;

  return (
    <div className="page gap-lg" style={{ paddingTop: 48 }}>
      <div>
        <span className="badge badge-muted" style={{ marginBottom: 12 }}>
          Round {currentRound} of {totalRounds}
        </span>
        <h2>Round Over</h2>
      </div>

      <div
        className="card text-center"
        style={{
          padding: 28,
          borderColor: outsiderWon ? 'var(--danger)' : 'var(--success)',
        }}
      >
        <p style={{ fontSize: '2.5rem', marginBottom: 8 }}>{outsiderWon ? '🕵️' : '🏆'}</p>
        <p style={{ fontWeight: 800, fontSize: '1.4rem' }}>
          {outsiderWon ? 'Outsider wins!' : 'Group wins!'}
        </p>
        <p className="text-muted" style={{ marginTop: 8 }}>
          {summary.outsiderName} was the Outsider
        </p>
        <p style={{ marginTop: 8, color: 'var(--accent-bright)', fontWeight: 700 }}>
          Topic: {summary.topic}
        </p>
        {summary.caughtByVote && summary.outsiderGuess !== null && (
          <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: 6 }}>
            Guessed: "{summary.outsiderGuess}" — {summary.outsiderGuessCorrect ? 'correct!' : 'wrong'}
          </p>
        )}
      </div>

      <div>
        <p className="label">Scoreboard</p>
        <div className="gap-sm">
          {[...players]
            .sort((a, b) => b.score - a.score)
            .map((p) => {
              const delta = summary.scoreDelta[p.id] ?? 0;
              return (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: 'var(--bg-raised)',
                    borderRadius: 'var(--radius-sm)',
                    gap: 12,
                  }}
                >
                  <span style={{ flex: 1, fontWeight: 600 }}>
                    {p.name}
                    {p.id === myPlayerId && (
                      <span className="text-muted" style={{ fontWeight: 400, fontSize: '0.85rem' }}> (you)</span>
                    )}
                  </span>
                  {delta > 0 && (
                    <span style={{ color: 'var(--success)', fontSize: '0.9rem', fontWeight: 700 }}>
                      +{delta}
                    </span>
                  )}
                  <span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--accent-bright)' }}>
                    {p.score}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      <div className="spacer" />

      {isHost ? (
        <button
          className="btn-primary btn-lg"
          style={{ width: '100%' }}
          onClick={() => socket.emit('next_round')}
        >
          {isLastRound ? 'See Final Results' : 'Next Round'}
        </button>
      ) : (
        <p className="text-muted text-center">Waiting for host to continue…</p>
      )}
    </div>
  );
}
