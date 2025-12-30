import { useState, useCallback } from 'react';
import { GameState, DiceRoll } from '@/types';
import { apiClient } from '@/lib/api';
import { storage } from '@/lib/storage';
import { soundManager } from '@/lib/sounds';

interface UseGameActionsProps {
  game: GameState | null;
  onGameUpdate: (game: GameState) => void;
  isAIGame?: (game: GameState | null) => boolean;
  restoreAIForGame?: (game: GameState | null) => Promise<void>;
  aiUser?: any;
  currentUserId?: string;
  player2Token?: string | null;
  player2UserId?: string | null;
}

export function useGameActions({
  game,
  onGameUpdate,
  isAIGame,
  restoreAIForGame,
  aiUser,
  currentUserId,
  player2Token,
  player2UserId,
}: UseGameActionsProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState<DiceRoll | null>(null);
  const [error, setError] = useState('');

  const handleRoll = useCallback(async () => {
    if (!game || isRolling) return;

    try {
      setIsRolling(true);
      setError('');
      
      // Refresh game state from backend to ensure we have the latest turn information
      let currentGameState = game;
      try {
        const refreshedGame = await apiClient.getGameState(game.id);
        currentGameState = refreshedGame;
        onGameUpdate(refreshedGame);
        // Check if it's still the player's turn after refresh
        const refreshedCurrentPlayer = refreshedGame.currentPlayerId === refreshedGame.player1.id 
          ? refreshedGame.player1 
          : refreshedGame.player2;
        const isStillMyTurn = refreshedCurrentPlayer.userId === currentUserId || 
          (player2UserId && refreshedCurrentPlayer.userId === player2UserId);
        if (!isStillMyTurn) {
          setError('It is not your turn');
          setIsRolling(false);
          return;
        }
      } catch (refreshError: any) {
        console.error('Failed to refresh game state before roll:', refreshError);
        setError('Failed to refresh game state. Please try again.');
        setIsRolling(false);
        return;
      }
      
      soundManager.playRoll();
      
      // Determine which token to use based on current player (use refreshed state)
      const currentPlayer = currentGameState.currentPlayerId === currentGameState.player1.id 
        ? currentGameState.player1 
        : currentGameState.player2;
      const isPlayer2Turn = currentPlayer.userId !== currentUserId;
      const tokenToUse = isPlayer2Turn && player2Token ? player2Token : undefined;
      
      console.log(`[Roll] Using token for player: ${isPlayer2Turn ? 'Player 2' : 'Player 1'}, currentPlayerId: ${currentGameState.currentPlayerId}`);
      const response = await apiClient.rollDice(currentGameState.id, tokenToUse);
      onGameUpdate(response.gameState);
      setLastRoll(response.dice);

      if (response.isDoubleSix) {
        soundManager.playDoubleSix();
        // Double six - backend should have switched turn, refresh game state to ensure sync
        try {
          const refreshedState = await apiClient.getGameState(currentGameState.id);
          onGameUpdate(refreshedState);
        } catch (err) {
          console.warn('Failed to refresh game state after double six:', err);
        }
        // Don't clear lastRoll here - let the component handle it after showing the dialog
      }

      // Track win if game is over (but double six should NOT end the game)
      if (response.gameState.status === 'finished' && response.gameState.winnerId) {
        const winner = response.gameState.winnerId === response.gameState.player1.id
          ? response.gameState.player1
          : response.gameState.player2;
        storage.incrementWin(winner.userId);
        soundManager.playWin();
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to roll dice';
      console.error('Roll dice error:', err);
      setError(errorMessage);
    } finally {
      setIsRolling(false);
    }
  }, [game, isRolling, onGameUpdate, currentUserId, player2Token, player2UserId]);

  const handleHold = useCallback(async () => {
    if (!game) return;

    try {
      setError('');
      
      // Refresh game state from backend to ensure we have the latest turn information
      let currentGameState = game;
      try {
        const refreshedGame = await apiClient.getGameState(game.id);
        currentGameState = refreshedGame;
        onGameUpdate(refreshedGame);
        // Check if it's still the player's turn after refresh
        const refreshedCurrentPlayer = refreshedGame.currentPlayerId === refreshedGame.player1.id 
          ? refreshedGame.player1 
          : refreshedGame.player2;
        const isStillMyTurn = refreshedCurrentPlayer.userId === currentUserId || 
          (player2UserId && refreshedCurrentPlayer.userId === player2UserId);
        if (!isStillMyTurn) {
          setError('It is not your turn');
          return;
        }
      } catch (refreshError: any) {
        console.error('Failed to refresh game state before hold:', refreshError);
        setError('Failed to refresh game state. Please try again.');
        return;
      }
      
      soundManager.playHold();
      
      // Determine which token to use based on current player (use refreshed state)
      const currentPlayer = currentGameState.currentPlayerId === currentGameState.player1.id 
        ? currentGameState.player1 
        : currentGameState.player2;
      const isPlayer2Turn = currentPlayer.userId !== currentUserId;
      const tokenToUse = isPlayer2Turn && player2Token ? player2Token : undefined;
      
      console.log(`[Hold] Using token for player: ${isPlayer2Turn ? 'Player 2' : 'Player 1'}, currentPlayerId: ${currentGameState.currentPlayerId}`);
      const response = await apiClient.hold(currentGameState.id, tokenToUse);
      onGameUpdate(response.gameState);
      setLastRoll(null);

      // Track win if game is over
      if (response.isGameOver && response.winnerId) {
        storage.incrementWin(response.winnerId);
        soundManager.playWin();
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to hold';
      console.error('Hold error:', err);
      setError(errorMessage);
    }
  }, [game, onGameUpdate, currentUserId, player2Token, player2UserId]);

  const handleNewGame = useCallback(async () => {
    if (!game) return;

    try {
      setError('');
      const wasAIGame = isAIGame?.(game);
      const newGameState = await apiClient.newGame(game.id);
      onGameUpdate(newGameState);
      setLastRoll(null);
      
      // If the original game had an AI opponent, restore AI for the new game
      if (wasAIGame && restoreAIForGame) {
        // Check if the new game still has the same AI player
        const newGameHasAI = isAIGame?.(newGameState);
        if (newGameHasAI && !aiUser) {
          // AI user might not match new game's player IDs, restore it
          await restoreAIForGame(newGameState);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start new game');
    }
  }, [game, onGameUpdate, isAIGame, restoreAIForGame, aiUser]);

  const handleEndGame = useCallback(async () => {
    if (!game) return;

    try {
      setError('');
      
      // Refresh game state from backend to ensure we have the latest information
      let finalGameState = game;
      try {
        const refreshedGame = await apiClient.getGameState(game.id);
        finalGameState = refreshedGame;
        onGameUpdate(refreshedGame);
      } catch (refreshError) {
        console.warn('Failed to refresh game state before end game:', refreshError);
        // Continue with current state
      }
      
      // Check if Player 2 hasn't played yet (only for human vs human games, not AI)
      // If Player 2 has score 0 and round score 0, and it's Player 1's turn, treat as abandon
      const isPlayer1Turn = finalGameState.currentPlayerId === finalGameState.player1.id;
      const player2HasNotPlayed = finalGameState.player2Score === 0 && finalGameState.player2RoundScore === 0;
      
      // Check if it's a human vs human game (not AI)
      const aiNamePatterns = ['Shadow', 'Neon', 'Cyber', 'Quantum', 'Nova', 'Vortex', 'Phantom', 'Echo', 'Blaze', 'Storm', 'Frost', 'Thunder', 'Cosmic', 'Astral', 'Mystic', 'Razor', 'Swift', 'Iron', 'Steel', 'Crystal'];
      const isAIGame = aiNamePatterns.some(pattern => 
        finalGameState.player2.username.startsWith(pattern)
      );
      
      // If Player 2 hasn't played and it's a human game, treat as abandon
      if (!isAIGame && player2HasNotPlayed && isPlayer1Turn) {
        console.log('Player 2 has not played yet - treating End Game as Abandon Game');
        // Throw a special error that will be caught and handled as abandon
        throw new Error('ABANDON_GAME');
      }
      
      // First, end the current turn by holding (if there's a round score to add)
      // Check if current player has a round score that needs to be added
      const currentPlayer = finalGameState.currentPlayerId === finalGameState.player1.id 
        ? finalGameState.player1 
        : finalGameState.player2;
      const currentRoundScore = finalGameState.currentPlayerId === finalGameState.player1.id 
        ? finalGameState.player1RoundScore 
        : finalGameState.player2RoundScore;
      
      // If there's a round score, hold first to add it to the total
      if (currentRoundScore > 0) {
        try {
          // Determine which token to use based on current player
          const isPlayer2Turn = currentPlayer.userId !== currentUserId;
          const tokenToUse = isPlayer2Turn && player2Token ? player2Token : undefined;
          
          const holdResponse = await apiClient.hold(finalGameState.id, tokenToUse);
          finalGameState = holdResponse.gameState;
          onGameUpdate(finalGameState);
          
          // Track win if game ended after hold
          if (holdResponse.isGameOver && holdResponse.winnerId) {
            storage.incrementWin(holdResponse.winnerId);
            soundManager.playWin();
            return; // Game already ended, no need to call endGame
          }
        } catch (holdError: any) {
          console.error('Failed to hold before ending game:', holdError);
          // Continue with ending game even if hold fails
        }
      }
      
      // Refresh game state again after hold (if it happened) to get latest state
      try {
        const refreshedAfterHold = await apiClient.getGameState(finalGameState.id);
        finalGameState = refreshedAfterHold;
        onGameUpdate(refreshedAfterHold);
      } catch (refreshError) {
        console.warn('Failed to refresh game state after hold:', refreshError);
        // Continue with current state
      }
      
      // Now end the game - backend will determine the winner
      // Recalculate token based on final game state (turn may have changed after hold)
      const finalCurrentPlayer = finalGameState.currentPlayerId === finalGameState.player1.id 
        ? finalGameState.player1 
        : finalGameState.player2;
      const isPlayer2Turn = finalCurrentPlayer.userId !== currentUserId;
      const finalTokenToUse = isPlayer2Turn && player2Token ? player2Token : undefined;
      
      const updatedGame = await apiClient.endGame(finalGameState.id, finalTokenToUse);
      onGameUpdate(updatedGame);
      
      // Track win if backend determined a winner
      if (updatedGame.status === 'finished' && updatedGame.winnerId) {
        const winner = updatedGame.winnerId === updatedGame.player1.id 
          ? updatedGame.player1 
          : updatedGame.player2;
        storage.incrementWin(winner.userId);
        soundManager.playWin();
      } else if (updatedGame.status === 'finished' && !updatedGame.winnerId) {
        // It's a tie - both players have the same score
        console.log('Game ended in a tie - both players have', updatedGame.player1Score, 'points');
        // Don't increment wins for either player in a tie
      }
    } catch (err: any) {
      // If this is an abandon game error, re-throw it so it can be handled as abandon
      if (err.message === 'ABANDON_GAME') {
        throw err;
      }
      const errorMessage = err.message || 'Failed to end game';
      console.error('End game error:', err);
      setError(errorMessage);
    }
  }, [game, onGameUpdate, currentUserId, player2Token, player2UserId]);

  const clearGameState = useCallback(() => {
    setLastRoll(null);
    setError('');
  }, []);

  return {
    isRolling,
    lastRoll,
    error,
    setError,
    handleRoll,
    handleHold,
    handleNewGame,
    handleEndGame,
    clearGameState,
    setLastRoll,
  };
}

