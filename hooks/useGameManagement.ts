import { useState, useCallback } from 'react';
import { GameState } from '@/types';
import { apiClient } from '@/lib/api';

type ViewMode = 'menu' | 'create' | 'game' | 'games-list';

interface UseGameManagementProps {
  onGameCreated: (game: GameState) => void;
  registerAI?: () => Promise<any>;
  clearAI?: () => void;
}

export function useGameManagement({
  onGameCreated,
  registerAI,
  clearAI,
}: UseGameManagementProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('menu');
  const [availableGames, setAvailableGames] = useState<GameState[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loadAvailableGames = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const games = await apiClient.getMyGames();
      setAvailableGames(games);
    } catch (err: any) {
      setError(err.message || 'Failed to load games');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadGame = useCallback(async (gameId: string) => {
    try {
      setIsLoading(true);
      setError('');
      const fullGame = await apiClient.getGame(gameId);
      onGameCreated(fullGame);
      setViewMode('game');
    } catch (err: any) {
      setError(err.message || 'Failed to load game');
    } finally {
      setIsLoading(false);
    }
  }, [onGameCreated]);

  const createGame = useCallback(async (
    player1Username: string,
    player2Username: string,
    winningScore = 100,
    isAI: boolean = false
  ) => {
    try {
      setIsLoading(true);
      setError('');
      
      let actualPlayer2Username = player2Username;
      
      // If AI opponent, register a new user
      if (isAI) {
        try {
          const aiUserData = await registerAI?.();
          actualPlayer2Username = aiUserData?.name || player2Username;
        } catch (err: any) {
          setError(err.message || 'Failed to create AI opponent');
          setIsLoading(false);
          return;
        }
      } else {
        clearAI?.();
      }
      
      const newGame = await apiClient.createGame({
        player1Username,
        player2Username: actualPlayer2Username,
        winningScore,
      });
      onGameCreated(newGame);
      setViewMode('game');
    } catch (err: any) {
      setError(err.message || 'Failed to create game');
    } finally {
      setIsLoading(false);
    }
  }, [onGameCreated, registerAI, clearAI]);

  const handleDeleteGame = useCallback(async (gameId: string) => {
    if (!confirm('Are you sure you want to delete this game? This action cannot be undone.')) {
      return;
    }

    try {
      setError('');
      setIsLoading(true);
      await apiClient.deleteGame(gameId);
      // Remove the game from the list
      setAvailableGames(prevGames => prevGames.filter(g => g.id !== gameId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete game');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleBackToMenu = useCallback(() => {
    setViewMode('menu');
    setError('');
  }, []);

  return {
    viewMode,
    setViewMode,
    availableGames,
    isLoading,
    error,
    setError,
    loadAvailableGames,
    loadGame,
    createGame,
    handleDeleteGame,
    handleBackToMenu,
  };
}

