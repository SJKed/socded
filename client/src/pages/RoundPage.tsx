import { useGameStore } from '../store/gameStore';
import { socket } from '../socket';
import { CountdownTimer } from '../components/CountdownTimer';
import { PlayerList } from '../components/PlayerList';

export function RoundPage() {
  const timerEndsAt = useGameStore((s) => s.timerEndsAt);
  const players = useGameStore((s) => s.players);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const myRole = useGameStore((s) => s.myRole);
  const currentRound = useGameStore((s) => s.currentRound);
  const totalRounds = useGameStore((s) => s.totalRounds);
  const settings = useGameStore((s) => s.settings);

  return (
    <div className="page gap-lg" style={{ paddingTop: 52 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="badge badge-muted">Round {currentRound}/{totalRounds}</span>
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

      <CountdownTimer
        endsAt={timerEndsAt}
        totalSeconds={settings.timerSeconds}
        urgent={30}
      />

      <div>
        <p className="label">Players</p>
        <PlayerList players={players} myPlayerId={myPlayerId} />
      </div>

      <div className="spacer" />

      <button
        className="btn-danger btn-lg"
        style={{ width: '100%' }}
        onClick={() => socket.emit('call_vote')}
      >
        Call a Vote
      </button>
    </div>
  );
}
