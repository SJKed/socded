import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { useGameStore } from '../store/gameStore';
import { useToastStore } from '../store/toastStore';
import { haptics } from '../utils/haptics';
import {
  ClientGameState,
  PublicPlayer,
  YourRolePayload,
  VoteReceivedPayload,
  VotesRevealedPayload,
} from 'shared/types';

export function useSocket() {
  const navigate = useNavigate();
  const store = useGameStore();
  const toast = useToastStore((s) => s.push);

  useEffect(() => {
    const myId = () => useGameStore.getState().myPlayerId;

    const onStateSync = (state: ClientGameState) => {
      store.applyState(state);
    };

    const onPlayerJoined = ({ player }: { player: PublicPlayer }) => {
      const isNew = !useGameStore.getState().players.some((p) => p.id === player.id);
      store.applyPlayerJoined(player);
      // Only toast in lobby for new joins (not reconnects of existing players)
      if (isNew && useGameStore.getState().phase === 'lobby') {
        toast(`${player.name} joined`, 'info');
      }
    };

    const onPlayerLeft = ({ playerId, newHostId }: { playerId: string; newHostId?: string }) => {
      const players = useGameStore.getState().players;
      const leaving = players.find((p) => p.id === playerId);
      store.applyPlayerLeft(playerId, newHostId);
      if (leaving) toast(`${leaving.name} disconnected`, 'warning');
      if (newHostId) {
        const newHost = players.find((p) => p.id === newHostId);
        if (newHost) toast(`${newHost.name} is now the host`, 'info');
      }
    };

    const onYourRole = ({ role, topic, hints }: YourRolePayload) => {
      store.setMyRole(role, topic, hints);
    };

    const onVoteReceived = ({ voterId }: VoteReceivedPayload) => {
      store.applyVoteReceived(voterId);
    };

    const onVotesRevealed = ({ voteBreakdown, mostVotedId, isTie }: VotesRevealedPayload) => {
      store.applyVotesRevealed(voteBreakdown, mostVotedId, isTie);
    };

    const onVoteCalled = ({ calledBy }: { calledBy: string; deadlineAt: number }) => {
      const players = useGameStore.getState().players;
      const caller = players.find((p) => p.id === calledBy);
      toast(`${caller?.name ?? 'Someone'} called a vote!`, 'warning');
      haptics.voteCalled();
    };

    const onSpeakerChanged = ({ speakerId, speakerName }: { speakerId: string; speakerName: string; speakerIndex: number; totalSpeakers: number; endsAt: number }) => {
      if (speakerId === myId()) {
        haptics.yourTurn();
      } else {
        haptics.turnChange();
      }
    };

    const onOutsiderCaught = ({ outsiderId }: { outsiderId: string }) => {
      const players = useGameStore.getState().players;
      const outsider = players.find((p) => p.id === outsiderId);
      toast(`🎯 ${outsider?.name ?? 'The Outsider'} was caught!`, 'warning');
      if (outsiderId === myId()) {
        haptics.caught();
        toast('You were caught! Guess the topic to win.', 'error');
      }
    };

    const onOutsiderEscaped = ({ outsiderId }: { outsiderId: string; topic: string }) => {
      const players = useGameStore.getState().players;
      const outsider = players.find((p) => p.id === outsiderId);
      if (outsiderId === myId()) {
        haptics.success();
        toast('You escaped! 🕵️', 'success');
      } else {
        toast(`${outsider?.name ?? 'Outsider'} escaped!`, 'info');
      }
    };

    const onTopicGuessResult = (result: { guess: string; correct: boolean; topic: string }) => {
      store.applyTopicGuessResult(result);
      if (result.correct) {
        haptics.success();
      }
    };

    const onKicked = () => {
      toast('You were removed from the room.', 'error');
      setTimeout(() => {
        import('../hooks/useReconnect').then(({ clearSession }) => clearSession());
        socket.disconnect();
        navigate('/');
      }, 1500);
    };

    const onGameReset = ({ state }: { state: ClientGameState }) => {
      store.clearRoleState();
      store.applyState(state);
    };

    const onReconnectSuccess = ({ state }: { state: ClientGameState }) => {
      store.applyState(state);
      navigate(`/room/${state.roomCode}`);
    };

    socket.on('state_sync', onStateSync);
    socket.on('player_joined', onPlayerJoined);
    socket.on('player_left', onPlayerLeft);
    socket.on('your_role', onYourRole);
    socket.on('vote_received', onVoteReceived);
    socket.on('votes_revealed', onVotesRevealed);
    socket.on('vote_called', onVoteCalled);
    socket.on('speaker_changed', onSpeakerChanged);
    socket.on('outsider_caught', onOutsiderCaught);
    socket.on('outsider_escaped', onOutsiderEscaped);
    socket.on('topic_guess_result', onTopicGuessResult);
    socket.on('kicked', onKicked);
    socket.on('game_reset', onGameReset);
    socket.on('reconnect_success', onReconnectSuccess);

    return () => {
      socket.off('state_sync', onStateSync);
      socket.off('player_joined', onPlayerJoined);
      socket.off('player_left', onPlayerLeft);
      socket.off('your_role', onYourRole);
      socket.off('vote_received', onVoteReceived);
      socket.off('votes_revealed', onVotesRevealed);
      socket.off('vote_called', onVoteCalled);
      socket.off('speaker_changed', onSpeakerChanged);
      socket.off('outsider_caught', onOutsiderCaught);
      socket.off('outsider_escaped', onOutsiderEscaped);
      socket.off('topic_guess_result', onTopicGuessResult);
      socket.off('kicked', onKicked);
      socket.off('game_reset', onGameReset);
      socket.off('reconnect_success', onReconnectSuccess);
    };
  }, []);
}
