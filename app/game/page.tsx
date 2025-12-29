'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePlayer2Auth } from '@/contexts/Player2AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { GameState } from '@/types';
import { useAIPlayer } from '@/hooks/useAIPlayer';
import { useGameActions } from '@/hooks/useGameActions';
import { useGameManagement } from '@/hooks/useGameManagement';
import { Box, CircularProgress } from '@mui/material';
import MainMenuView from '@/components/views/MainMenuView';
import CreateGameView from '@/components/views/CreateGameView';
import GamesListView from '@/components/views/GamesListView';
import GameView from '@/components/views/GameView';

export default function GamePage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const { user: player2User, token: player2Token } = usePlayer2Auth();
  const router = useRouter();
  const [game, setGame] = useState<GameState | null>(null);
  const [abandonDialogOpen, setAbandonDialogOpen] = useState(false);
  
  // Game Actions hook - manages roll, hold, newGame, endGame
  const {
    isRolling,
    lastRoll,
    isDoubleSix,
    error: actionsError,
    setError: setActionsError,
    handleRoll,
    handleHold,
    handleNewGame,
    handleEndGame,
    clearGameState,
    setLastRoll,
    setIsDoubleSix,
  } = useGameActions({
    game,
    onGameUpdate: setGame,
    isAIGame: undefined, // Will be set after AI hook
    restoreAIForGame: undefined, // Will be set after AI hook
    aiUser: undefined, // Will be set after AI hook
    currentUserId: user?.id || '',
    player2Token: player2Token,
  });

  // AI Player hook - needs game actions state
  const { aiUser, registerAI, clearAI, aiName, isAIGame, restoreAIForGame } = useAIPlayer({
    game,
    currentUserId: user?.id || '',
    isRolling,
    isDoubleSix,
    onGameUpdate: setGame,
    onLastRollUpdate: setLastRoll,
    onDoubleSixUpdate: setIsDoubleSix,
    onRollingUpdate: () => {}, // Not used, managed in game actions hook
  });

  // Re-create game actions with AI functions now available
  const gameActionsWithAI = useGameActions({
    game,
    onGameUpdate: setGame,
    isAIGame,
    restoreAIForGame,
    aiUser,
    currentUserId: user?.id || '',
    player2Token: player2Token,
  });

  // Use the game actions with AI support
  const finalHandleNewGame = gameActionsWithAI.handleNewGame;
  const finalHandleEndGame = gameActionsWithAI.handleEndGame;

  // Game Management hook
  const {
    viewMode,
    setViewMode,
    availableGames,
    isLoading,
    error: managementError,
    setError: setManagementError,
    loadAvailableGames,
    loadGame,
    createGame,
    handleDeleteGame,
    handleBackToMenu,
  } = useGameManagement({
    onGameCreated: setGame,
    registerAI,
    clearAI,
    player2Token: player2Token,
  });

  // Combined error state
  const error = actionsError || managementError;
  const setError = (msg: string) => {
    setActionsError(msg);
    setManagementError(msg);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Periodically refresh game state from backend to ensure we have the latest turn information
  useEffect(() => {
    if (!game || game.status !== 'active' || viewMode !== 'game') return;

    const refreshInterval = setInterval(async () => {
      try {
        const { apiClient } = await import('@/lib/api');
        const refreshedGame = await apiClient.getGameState(game.id);
        setGame(refreshedGame);
      } catch (err) {
        console.warn('Failed to refresh game state:', err);
      }
    }, 2000); // Refresh every 2 seconds

    return () => clearInterval(refreshInterval);
  }, [game, viewMode]);


  const handleAbandonGameClick = async () => {
    setAbandonDialogOpen(true);
  };

  const handleAbandonGameConfirm = async () => {
    if (!game) return;

    setAbandonDialogOpen(false);

    try {
      setError('');
      const { apiClient } = await import('@/lib/api');
      await apiClient.deleteGame(game.id);
      setGame(null);
      clearGameState();
      clearAI();
      handleBackToMenu();
    } catch (err: any) {      
      setGame(null);
      clearGameState();
      handleBackToMenu();
    }
  };

  const handleAbandonGameCancel = () => {
    setAbandonDialogOpen(false);
  };

  const handleBackToMenuWithCleanup = () => {
    setGame(null);
    clearGameState();
    clearAI();
    handleBackToMenu();
  };

  if (authLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return null;
  }

  // Render appropriate view based on viewMode
  if (viewMode === 'menu') {
    return (
      <MainMenuView
        username={user.username}
        onLogout={logout}
        onCreateGame={() => setViewMode('create')}
        onContinueGame={async () => {
          await loadAvailableGames();
          setViewMode('games-list');
        }}
        error={error}
      />
    );
  }

  if (viewMode === 'create') {
    return (
      <CreateGameView
        username={user.username}
        onLogout={logout}
        onBackToMenu={handleBackToMenuWithCleanup}
        onCreateGame={createGame}
        error={error}
      />
    );
  }

  if (viewMode === 'games-list') {
    return (
      <GamesListView
        username={user.username}
        onLogout={logout}
        onBackToMenu={handleBackToMenu}
        onCreateGame={() => setViewMode('create')}
        onLoadGame={loadGame}
        onDeleteGame={handleDeleteGame}
        availableGames={availableGames}
        isLoading={isLoading}
        error={error}
      />
    );
  }

  // Game View (when playing)
  if (viewMode === 'game' && !game) {
    setViewMode('menu');
    return null;
  }

  if (!game) {
    return null;
  }

  return (
    <GameView
      username={user.username}
      onLogout={logout}
      onBackToMenu={handleBackToMenu}
      game={game}
      currentUserId={user.id}
      player2UserId={player2User?.id}
      onRoll={handleRoll}
      onHold={handleHold}
      onNewGame={finalHandleNewGame}
      onAbandonGame={handleAbandonGameClick}
      onEndGame={finalHandleEndGame}
      isRolling={isRolling}
      lastRoll={lastRoll}
      isDoubleSix={isDoubleSix}
      aiName={aiName || undefined}
      abandonDialogOpen={abandonDialogOpen}
      onAbandonGameCancel={handleAbandonGameCancel}
      onAbandonGameConfirm={handleAbandonGameConfirm}
      error={error}
    />
  );
}


