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
}

export function useGameActions({
  game,
  onGameUpdate,
  isAIGame,
  restoreAIForGame,
  aiUser,
  currentUserId,
  player2Token,
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
      
      // Determine which token to use based on current player
      const currentPlayer = game.currentPlayerId === game.player1.id ? game.player1 : game.player2;
      const isPlayer2Turn = currentPlayer.userId !== currentUserId;
      const tokenToUse = isPlayer2Turn && player2Token ? player2Token : undefined;
      
      const response = await apiClient.rollDice(game.id, tokenToUse);
      onGameUpdate(response.gameState);
      setLastRoll(response.dice);
      setIsDoubleSix(response.isDoubleSix);

      if (response.isDoubleSix) {
        soundManager.playDoubleSix();
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
  }, [game, isRolling, onGameUpdate, currentUserId, player2Token]);

  const handleHold = useCallback(async () => {
    if (!game) return;

    try {
      setError('');
      soundManager.playHold();
      
      // Determine which token to use based on current player
      const currentPlayer = game.currentPlayerId === game.player1.id ? game.player1 : game.player2;
      const isPlayer2Turn = currentPlayer.userId !== currentUserId;
      const tokenToUse = isPlayer2Turn && player2Token ? player2Token : undefined;
      
      const response = await apiClient.hold(game.id, tokenToUse);
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
  }, [game, onGameUpdate, currentUserId, player2Token]);

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
      
      // First, end the current turn by holding (if there's a round score to add)
      let finalGameState = game;
      
      // Check if current player has a round score that needs to be added
      const currentPlayer = game.currentPlayerId === game.player1.id ? game.player1 : game.player2;
      const currentRoundScore = game.currentPlayerId === game.player1.id 
        ? game.player1RoundScore 
        : game.player2RoundScore;
      
      // If there's a round score, hold first to add it to the total
      if (currentRoundScore > 0) {
        try {
          // Determine which token to use based on current player
          const isPlayer2Turn = currentPlayer.userId !== currentUserId;
          const tokenToUse = isPlayer2Turn && player2Token ? player2Token : undefined;
          
          const holdResponse = await apiClient.hold(game.id, tokenToUse);
          finalGameState = holdResponse.gameState;
          onGameUpdate(finalGameState);
          
          // Track win if game ended after hold
          if (holdResponse.isGameOver && holdResponse.winnerId) {
            storage.incrementWin(holdResponse.winnerId);
            soundManager.playWin();
            return; // Game already ended, no need to call endGame
          }
        } catch (holdError: any) {
          console.warn('Failed to hold before ending game:', holdError);
          // Continue with ending game even if hold fails
        }
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
      }
    } catch (err: any) {
      setError(err.message || 'Failed to end game');
    }
  }, [game, onGameUpdate, currentUserId, player2Token]);

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

