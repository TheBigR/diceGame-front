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
}

export function useGameActions({
  game,
  onGameUpdate,
  isAIGame,
  restoreAIForGame,
  aiUser,
}: UseGameActionsProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState<DiceRoll | null>(null);
  const [isDoubleSix, setIsDoubleSix] = useState(false);
  const [error, setError] = useState('');

  const handleRoll = useCallback(async () => {
    if (!game || isRolling) return;

    try {
      setIsRolling(true);
      setError('');
      soundManager.playRoll();
      const response = await apiClient.rollDice(game.id);
      onGameUpdate(response.gameState);
      setLastRoll(response.dice);
      setIsDoubleSix(response.isDoubleSix);

      if (response.isDoubleSix) {
        soundManager.playDoubleSix();
        // Double six: round score should be 0, turn should switch, game should continue
        // Verify the backend handled it correctly
        const currentPlayer = response.gameState.currentPlayerId === response.gameState.player1.id 
          ? response.gameState.player1 
          : response.gameState.player2;
        const previousPlayer = response.gameState.currentPlayerId === response.gameState.player1.id 
          ? response.gameState.player2 
          : response.gameState.player1;
        const previousRoundScore = previousPlayer.id === response.gameState.player1.id 
          ? response.gameState.player1RoundScore 
          : response.gameState.player2RoundScore;
        
        // The previous player's round score should be 0 after double six
        if (previousRoundScore !== 0) {
          console.warn('Double six occurred but round score was not reset to 0');
        }
        
        // The game should still be active
        if (response.gameState.status !== 'active') {
          console.warn('Double six occurred but game status is not active:', response.gameState.status);
        }
        
        // Clear the last roll after a delay so the message is visible
        setTimeout(() => {
          setLastRoll(null);
          setIsDoubleSix(false);
        }, 3000);
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
      setError(err.message || 'Failed to roll dice');
    } finally {
      setIsRolling(false);
    }
  }, [game, isRolling, onGameUpdate]);

  const handleHold = useCallback(async () => {
    if (!game) return;

    try {
      setError('');
      soundManager.playHold();
      const response = await apiClient.hold(game.id);
      onGameUpdate(response.gameState);
      setLastRoll(null);
      setIsDoubleSix(false);

      // Track win if game is over
      if (response.isGameOver && response.winnerId) {
        storage.incrementWin(response.winnerId);
        soundManager.playWin();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to hold');
    }
  }, [game, onGameUpdate]);

  const handleNewGame = useCallback(async () => {
    if (!game) return;

    try {
      setError('');
      const wasAIGame = isAIGame?.(game);
      const newGameState = await apiClient.newGame(game.id);
      onGameUpdate(newGameState);
      setLastRoll(null);
      setIsDoubleSix(false);
      
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
      // Try to call API endpoint, if it doesn't exist, handle client-side
      try {
        const updatedGame = await apiClient.endGame(game.id);
        onGameUpdate(updatedGame);
      } catch (apiError: any) {
        // If API endpoint doesn't exist, determine winner client-side
        console.log('API endpoint not available, determining winner client-side');
        const winnerId = game.player1Score > game.player2Score 
          ? game.player1.id 
          : game.player2Score > game.player1Score 
          ? game.player2.id 
          : undefined; // Tie
        
        const winner = winnerId 
          ? (winnerId === game.player1.id ? game.player1 : game.player2)
          : null;
        
        if (winner) {
          storage.incrementWin(winner.userId);
          soundManager.playWin();
        } else {
          // It's a tie - no winner
          console.log('Game ended in a tie');
        }
        
        // Update game state to finished
        onGameUpdate({
          ...game,
          status: 'finished',
          winnerId: winnerId, // undefined for ties
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to end game');
    }
  }, [game, onGameUpdate]);

  const clearGameState = useCallback(() => {
    setLastRoll(null);
    setIsDoubleSix(false);
    setError('');
  }, []);

  return {
    isRolling,
    lastRoll,
    isDoubleSix,
    error,
    setError,
    handleRoll,
    handleHold,
    handleNewGame,
    handleEndGame,
    clearGameState,
    setLastRoll,
    setIsDoubleSix,
  };
}

