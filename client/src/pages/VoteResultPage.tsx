import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { socket } from '../socket';
import { CountdownTimer } from '../components/CountdownTimer';

export function VoteResultPage() {
  const phase = useGameStore((s) => s.phase);
  const players = useGameStore((s) => s.players);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const currentOutsiderId = useGameStore((s) => s.currentOutsiderId);
  const voteBreakdown = useGameStore((s) => s.voteBreakdown);
  const mostVotedId = useGameStore((s) => s.mostVotedId);
  const isTie = useGameStore((s) => s.isTie);
  const voteDeadlineAt = useGameStore((s) => s.voteDeadlineAt);
  const topicGuessResult = useGameStore((s) => s.topicGuessResult);

  const [guess, setGuess] = useState('');
  const [guessSent, setGuessSent] = useState(false);

  const amOutsider = myPlayerId === currentOutsiderId;
  const outsider = players.find((p) => p.id === currentOutsiderId);

  function submitGuess() {
    if (!guess.trim() || guessSent) return;
    socket.emit('submit_topic_guess', { guess: guess.trim() });
    setGuessSent(true);
  }

  // vote_result phase — tallies shown
  if (phase === 'vote_result') {
    return (
      <div className="page gap-lg" style={{ paddingTop: 48 }}>
        <h2>Results</h2>

        {isTie ? (
          <div className="card text-center" style={{ padding: 24 }}>
            <p style={{ fontSize: '2rem', marginBottom: 8 }}>🤝</p>
            <p style={{ fontWeight: 700, fontSize: '1.2rem' }}>It's a tie!</p>
            <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: 8 }}>
              No majority — returning to discussion
            </p>
          </div>
        ) : mostVotedId === currentOutsiderId ? (
          <div className="card text-center" style={{ padding: 24, borderColor: 'var(--danger)' }}>
            <p style={{ fontSize: '2rem', marginBottom: 8 }}>🎯</p>
            <p style={{ fontWeight: 700, fontSize: '1.2rem' }}>
              {outsider?.name} was caught!
            </p>
          </div>
        ) : (
          <div className="card text-center" style={{ padding: 24, borderColor: 'var(--accent)' }}>
            <p style={{ fontSize: '2rem', marginBottom: 8 }}>❌</p>
            <p style={{ fontWeight: 700, fontSize: '1.2rem' }}>Wrong! The Outsider escapes.</p>
            <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: 8 }}>
              {players.find((p) => p.id === mostVotedId)?.name} was voted out
            </p>
          </div>
        )}

        {voteBreakdown && (
          <div>
            <p className="label">Vote Breakdown</p>
            <div className="gap-sm">
              {players.map((p) => {
                const votedForId = voteBreakdown[p.id];
                const votedForName = players.find((x) => x.id === votedForId)?.name;
                return (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: 'var(--bg-raised)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{p.name}</span>
                    <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                      → {votedForName ?? 'skipped'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // topic_guess phase
  return (
    <div className="page gap-lg" style={{ paddingTop: 48 }}>
      <div className="card text-center" style={{ padding: 24, borderColor: 'var(--danger)' }}>
        <p style={{ fontSize: '2rem', marginBottom: 8 }}>🎯</p>
        <p style={{ fontWeight: 700, fontSize: '1.2rem' }}>
          {outsider?.name} was caught!
        </p>
        <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: 8 }}>
          {amOutsider
            ? 'Guess the secret topic to win anyway!'
            : `Waiting for ${outsider?.name} to guess the topic…`}
        </p>
      </div>

      {amOutsider && !topicGuessResult && (
        <>
          <CountdownTimer endsAt={voteDeadlineAt} totalSeconds={30} urgent={10} />
          <div className="gap-md">
            <div>
              <p className="label">Your Guess</p>
              <input
                type="text"
                placeholder="What's the secret topic?"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitGuess()}
                disabled={guessSent}
                autoFocus
              />
            </div>
            <button
              className="btn-primary btn-lg"
              style={{ width: '100%' }}
              onClick={submitGuess}
              disabled={!guess.trim() || guessSent}
            >
              {guessSent ? 'Submitted…' : 'Submit Guess'}
            </button>
          </div>
        </>
      )}

      {!amOutsider && !topicGuessResult && (
        <div className="text-center text-muted" style={{ paddingTop: 16 }}>
          <p>Waiting for {outsider?.name} to guess…</p>
        </div>
      )}

      {topicGuessResult && (
        <div
          className="card text-center"
          style={{
            padding: 24,
            borderColor: topicGuessResult.correct ? 'var(--success)' : 'var(--danger)',
          }}
        >
          <p style={{ fontSize: '2rem', marginBottom: 8 }}>
            {topicGuessResult.correct ? '✅' : '❌'}
          </p>
          <p style={{ fontWeight: 700, fontSize: '1.2rem' }}>
            {topicGuessResult.correct ? 'Correct guess!' : 'Wrong guess!'}
          </p>
          <p className="text-muted" style={{ marginTop: 8 }}>
            The topic was <strong>{topicGuessResult.topic}</strong>
          </p>
          {topicGuessResult.guess && (
            <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: 4 }}>
              {outsider?.name} guessed: "{topicGuessResult.guess}"
            </p>
          )}
        </div>
      )}
    </div>
  );
}
