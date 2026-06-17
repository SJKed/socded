import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from './hooks/useSocket';
import { useReconnect } from './hooks/useReconnect';
import { useGameStore } from './store/gameStore';
import { socket } from './socket';
import { RoomCodeBadge } from './components/RoomCodeBadge';
import { LobbyPage } from './pages/LobbyPage';
import { RoleRevealPage } from './pages/RoleRevealPage';
import { RoundPage } from './pages/RoundPage';
import { VotingPage } from './pages/VotingPage';
import { VoteResultPage } from './pages/VoteResultPage';
import { RoundSummaryPage } from './pages/RoundSummaryPage';
import { LeaderboardPage } from './pages/LeaderboardPage';

export function GameShell() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const phase = useGameStore((s) => s.phase);
  const roomCode = useGameStore((s) => s.roomCode);

  useSocket();
  useReconnect();

  useEffect(() => {
    if (!socket.connected) socket.connect();
  }, []);

  // If somehow on room page with no room state and no code match, go home
  useEffect(() => {
    if (roomCode && code && roomCode !== code) {
      navigate('/');
    }
  }, [roomCode, code]);

  return (
    <>
      <RoomCodeBadge />
      {phase === 'lobby' && <LobbyPage />}
      {phase === 'role_reveal' && <RoleRevealPage />}
      {phase === 'round' && <RoundPage />}
      {phase === 'voting' && <VotingPage />}
      {(phase === 'vote_result' || phase === 'topic_guess') && <VoteResultPage />}
      {phase === 'round_summary' && <RoundSummaryPage />}
      {phase === 'leaderboard' && <LeaderboardPage />}
    </>
  );
}
