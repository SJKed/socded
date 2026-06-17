import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { useGameStore } from '../store/gameStore';
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

  useEffect(() => {
    const onStateSync = (state: ClientGameState) => {
      store.applyState(state);
    };

    const onPlayerJoined = ({ player }: { player: PublicPlayer }) => {
      store.applyPlayerJoined(player);
    };

    const onPlayerLeft = ({
      playerId,
      newHostId,
    }: {
      playerId: string;
      newHostId?: string;
    }) => {
      store.applyPlayerLeft(playerId, newHostId);
    };

    const onYourRole = ({ role, topic, hints }: YourRolePayload) => {
      store.setMyRole(role, topic, hints);
    };

    const onVoteReceived = ({ voterId }: VoteReceivedPayload) => {
      store.applyVoteReceived(voterId);
    };

    const onVotesRevealed = ({
      voteBreakdown,
      mostVotedId,
      isTie,
    }: VotesRevealedPayload) => {
      store.applyVotesRevealed(voteBreakdown, mostVotedId, isTie);
    };

    const onTopicGuessResult = (result: {
      guess: string;
      correct: boolean;
      topic: string;
    }) => {
      store.applyTopicGuessResult(result);
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
    socket.on('topic_guess_result', onTopicGuessResult);
    socket.on('game_reset', onGameReset);
    socket.on('reconnect_success', onReconnectSuccess);

    return () => {
      socket.off('state_sync', onStateSync);
      socket.off('player_joined', onPlayerJoined);
      socket.off('player_left', onPlayerLeft);
      socket.off('your_role', onYourRole);
      socket.off('vote_received', onVoteReceived);
      socket.off('votes_revealed', onVotesRevealed);
      socket.off('topic_guess_result', onTopicGuessResult);
      socket.off('game_reset', onGameReset);
      socket.off('reconnect_success', onReconnectSuccess);
    };
  }, []);
}
