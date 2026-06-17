import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { VoteGrid } from '../components/VoteGrid';
import { CountdownTimer } from '../components/CountdownTimer';

export function VotingPage() {
  const players = useGameStore((s) => s.players);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const voteDeadlineAt = useGameStore((s) => s.voteDeadlineAt);
  const votesIn = useGameStore((s) => s.votesIn);
  const totalVoters = useGameStore((s) => s.totalVoters);
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="page gap-lg" style={{ paddingTop: 48 }}>
      <div>
        <h2 style={{ marginBottom: 4 }}>Vote</h2>
        <p className="text-muted" style={{ fontSize: '0.9rem' }}>
          Who is the Outsider?
        </p>
      </div>

      <CountdownTimer endsAt={voteDeadlineAt} totalSeconds={20} urgent={10} />

      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        {votesIn} / {totalVoters} voted
      </div>

      <VoteGrid
        players={players}
        myPlayerId={myPlayerId}
        submitted={submitted}
        onSubmit={() => setSubmitted(true)}
      />
    </div>
  );
}
