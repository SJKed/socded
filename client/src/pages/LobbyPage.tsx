import { useGameStore } from '../store/gameStore';
import { socket } from '../socket';
import { PlayerList } from '../components/PlayerList';
import { HostSettings } from '../components/HostSettings';

export function LobbyPage() {
  const players = useGameStore((s) => s.players);
  const hostId = useGameStore((s) => s.hostId);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const roomCode = useGameStore((s) => s.roomCode);
  const isHost = myPlayerId === hostId;
  const connectedCount = players.filter((p) => p.isConnected).length;
  const canStart = connectedCount >= 4;

  return (
    <div className="page gap-lg" style={{ paddingTop: 48 }}>
      <div>
        <p className="label">Room Code</p>
        <h1 style={{ fontSize: 'clamp(3rem, 16vw, 5rem)', letterSpacing: '0.15em', color: 'var(--accent-bright)' }}>
          {roomCode}
        </h1>
        <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: 4 }}>
          Share this code with friends
        </p>
      </div>

      <div>
        <p className="label">{connectedCount} Player{connectedCount !== 1 ? 's' : ''}</p>
        <PlayerList players={players} myPlayerId={myPlayerId} />
      </div>

      {isHost && <HostSettings />}

      <div className="spacer" />

      {isHost ? (
        <div className="gap-sm">
          {!canStart && (
            <p className="text-muted text-center" style={{ fontSize: '0.9rem' }}>
              Need at least 4 players to start
            </p>
          )}
          <button
            className="btn-primary btn-lg"
            style={{ width: '100%' }}
            disabled={!canStart}
            onClick={() => socket.emit('start_game')}
          >
            Start Game
          </button>
        </div>
      ) : (
        <p className="text-muted text-center" style={{ fontSize: '0.95rem' }}>
          Waiting for the host to start…
        </p>
      )}
    </div>
  );
}
