'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { GameState } from '@/types';
import GameBoard from '@/components/GameBoard';
import CreateGameForm from '@/components/CreateGameForm';
import { soundManager } from '@/lib/sounds';
import { useAIPlayer } from '@/hooks/useAIPlayer';
import { useGameActions } from '@/hooks/useGameActions';
import { useGameManagement } from '@/hooks/useGameManagement';
import { Box, Button, Typography, Alert, IconButton, Tooltip, Paper, CircularProgress, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import CasinoIcon from '@mui/icons-material/Casino';
import AddIcon from '@mui/icons-material/Add';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import LogoutIcon from '@mui/icons-material/Logout';
import DeleteIcon from '@mui/icons-material/Delete';

export default function GamePage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [game, setGame] = useState<GameState | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
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

  useEffect(() => {
    // Initialize sound state from soundManager
    setSoundEnabled(soundManager.isEnabled());
  }, []);

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

  // Main Menu View
  if (viewMode === 'menu') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(to bottom right, #eff6ff, #eef2ff)',
          p: 4,
        }}
      >
        <Box sx={{ maxWidth: '48rem', mx: 'auto' }}>
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <CasinoIcon sx={{ fontSize: '3rem' }} /> Dice Game
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Welcome, {user.username}!
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Paper elevation={3} sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={() => setViewMode('create')}
                sx={{ py: 1.5 }}
              >
                Create New Game
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                startIcon={<CasinoIcon />}
                onClick={async () => {
                  await loadAvailableGames();
                  setViewMode('games-list');
                }}
                sx={{ py: 1.5 }}
              >
                Continue Existing Game
              </Button>

              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                <Tooltip title={soundEnabled ? 'Disable sounds' : 'Enable sounds'}>
                  <IconButton
                    color={soundEnabled ? 'primary' : 'default'}
                    onClick={() => {
                      const newState = !soundEnabled;
                      setSoundEnabled(newState);
                      soundManager.setEnabled(newState);
                    }}
                  >
                    {soundEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
                  </IconButton>
                </Tooltip>
                <Button
                  variant="outlined"
                  startIcon={<LogoutIcon />}
                  onClick={logout}
                  color="inherit"
                >
                  Logout
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>
    );
  }

  // Create Game View
  if (viewMode === 'create') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(to bottom right, #eff6ff, #eef2ff)',
          p: 4,
        }}
      >
        <Box sx={{ maxWidth: '42rem', mx: 'auto' }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold' }}>
                Create New Game
              </Typography>
              <Button onClick={handleBackToMenuWithCleanup} color="inherit">
                Back to Menu
              </Button>
            </Box>
            <CreateGameForm onCreateGame={createGame} currentUsername={user.username} />
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Paper>
        </Box>
      </Box>
    );
  }

  // Games List View
  if (viewMode === 'games-list') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(to bottom right, #eff6ff, #eef2ff)',
          p: 4,
        }}
      >
        <Box sx={{ maxWidth: '48rem', mx: 'auto' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold' }}>
              Your Games
            </Typography>
            <Button onClick={handleBackToMenu} color="inherit">
              Back to Menu
            </Button>
          </Box>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : availableGames.length === 0 ? (
            <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
                No games found. Create a new game to get started!
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setViewMode('create')}
              >
                Create New Game
              </Button>
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {availableGames.map((g) => (
                <Paper key={g.id} elevation={2} sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {g.player1.username} vs {g.player2.username}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        Status: {g.status} | Winning Score: {g.winningScore}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Scores: {g.player1Score} - {g.player2Score}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Button
                        variant="contained"
                        onClick={() => loadGame(g.id)}
                        disabled={isLoading}
                      >
                        Continue
                      </Button>
                      <Tooltip title="Delete game">
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteGame(g.id)}
                          disabled={isLoading}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </Box>
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
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #eff6ff, #eef2ff)',
        p: 4,
      }}
    >
      <Box
        sx={{
          mb: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '56rem',
          mx: 'auto',
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
            <CasinoIcon /> Dice Game
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Welcome, {user.username}!
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            onClick={handleBackToMenu}
            title="Back to main menu"
          >
            Main Menu
          </Button>
          <Tooltip title={soundEnabled ? 'Disable sounds' : 'Enable sounds'}>
            <IconButton
              color={soundEnabled ? 'primary' : 'default'}
              onClick={() => {
                const newState = !soundEnabled;
                setSoundEnabled(newState);
                soundManager.setEnabled(newState);
              }}
            >
              {soundEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={logout}
          >
            Logout
          </Button>
        </Box>
      </Box>

      {error && (
        <Box sx={{ maxWidth: '56rem', mx: 'auto', mb: 2 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      <GameBoard
        game={game}
        currentUserId={user.id}
        onRoll={handleRoll}
        onHold={handleHold}
        onNewGame={finalHandleNewGame}
        onAbandonGame={handleAbandonGameClick}
        onEndGame={finalHandleEndGame}
        isRolling={isRolling}
        lastRoll={lastRoll}
        isDoubleSix={isDoubleSix}
        aiName={aiName}
      />

      {/* Abandon Game Confirmation Dialog */}
      <Dialog
        open={abandonDialogOpen}
        onClose={handleAbandonGameCancel}
        aria-labelledby="abandon-dialog-title"
        aria-describedby="abandon-dialog-description"
      >
        <DialogTitle id="abandon-dialog-title">
          Abandon Game?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="abandon-dialog-description">
            Are you sure you want to abandon this game? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAbandonGameCancel} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleAbandonGameConfirm} color="error" variant="contained" autoFocus>
            Abandon Game
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


