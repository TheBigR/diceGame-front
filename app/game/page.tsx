'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { GameState, DiceRoll } from '@/types';
import { apiClient } from '@/lib/api';
import GameBoard from '@/components/GameBoard';
import { storage } from '@/lib/storage';
import { soundManager } from '@/lib/sounds';
import { useAIPlayer } from '@/hooks/useAIPlayer';
import { Box, Button, Typography, Alert, IconButton, Tooltip, Paper, CircularProgress, TextField, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import CasinoIcon from '@mui/icons-material/Casino';
import AddIcon from '@mui/icons-material/Add';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import LogoutIcon from '@mui/icons-material/Logout';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import DeleteIcon from '@mui/icons-material/Delete';

type ViewMode = 'menu' | 'create' | 'game' | 'games-list';

export default function GamePage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('menu');
  const [game, setGame] = useState<GameState | null>(null);
  const [availableGames, setAvailableGames] = useState<GameState[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState<DiceRoll | null>(null);
  const [isDoubleSix, setIsDoubleSix] = useState(false);
  const [error, setError] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [abandonDialogOpen, setAbandonDialogOpen] = useState(false);
  
  // AI Player hook
  const { aiUser, registerAI, clearAI, aiName, isAIGame, restoreAIForGame } = useAIPlayer({
    game,
    currentUserId: user?.id || '',
    isRolling,
    isDoubleSix,
    onGameUpdate: setGame,
    onLastRollUpdate: setLastRoll,
    onDoubleSixUpdate: setIsDoubleSix,
    onRollingUpdate: setIsRolling,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    // Initialize sound state from soundManager
    setSoundEnabled(soundManager.isEnabled());
  }, []);

  const loadAvailableGames = async () => {
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
  };

  const loadGame = async (gameId: string) => {
    try {
      setIsLoading(true);
      setError('');
      const fullGame = await apiClient.getGame(gameId);
      setGame(fullGame);
      setViewMode('game');
    } catch (err: any) {
      setError(err.message || 'Failed to load game');
    } finally {
      setIsLoading(false);
    }
  };

  const createGame = async (player1Username: string, player2Username: string, winningScore = 100, isAI: boolean = false) => {
    try {
      setIsLoading(true);
      setError('');
      
      let actualPlayer2Username = player2Username;
      
      // If AI opponent, register a new user
      if (isAI) {
        try {
          const aiUserData = await registerAI();
          actualPlayer2Username = aiUserData.name;
        } catch (err: any) {
          setError(err.message || 'Failed to create AI opponent');
          setIsLoading(false);
          return;
        }
      } else {
        clearAI();
      }
      
      const newGame = await apiClient.createGame({
        player1Username,
        player2Username: actualPlayer2Username,
        winningScore,
      });
      setGame(newGame);
      setViewMode('game');
    } catch (err: any) {
      setError(err.message || 'Failed to create game');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoll = useCallback(async () => {
    if (!game || isRolling) return;

    try {
      setIsRolling(true);
      setError('');
      soundManager.playRoll();
      const response = await apiClient.rollDice(game.id);
      setGame(response.gameState);
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
  }, [game, isRolling]);

  const handleHold = useCallback(async () => {
    if (!game) return;

    try {
      setError('');
      soundManager.playHold();
      const response = await apiClient.hold(game.id);
      setGame(response.gameState);
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
  }, [game]);


  const handleNewGame = async () => {
    if (!game) return;

    try {
      setError('');
      const wasAIGame = isAIGame(game);
      const newGameState = await apiClient.newGame(game.id);
      setGame(newGameState);
      setLastRoll(null);
      setIsDoubleSix(false);
      
      // If the original game had an AI opponent, restore AI for the new game
      if (wasAIGame) {
        // Check if the new game still has the same AI player
        const newGameHasAI = isAIGame(newGameState);
        if (newGameHasAI && !aiUser) {
          // AI user might not match new game's player IDs, restore it
          await restoreAIForGame(newGameState);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start new game');
    }
  };

  const handleAbandonGameClick = async () => {
    setAbandonDialogOpen(true);
  };

  const handleAbandonGameConfirm = async () => {
    if (!game) return;

    setAbandonDialogOpen(false);

    try {
      setError('');
      await apiClient.deleteGame(game.id);
      setGame(null);
      setLastRoll(null);
      setIsDoubleSix(false);
      clearAI();
      setViewMode('menu');
    } catch (err: any) {
      // If delete fails, just clear the game locally (might not exist on backend)
      setGame(null);
      setError('');
      setViewMode('menu');
    }
  };

  const handleAbandonGameCancel = () => {
    setAbandonDialogOpen(false);
  };

  const handleEndGame = async () => {
    if (!game) return;

    try {
      setError('');
      // Try to call API endpoint, if it doesn't exist, handle client-side
      try {
        const updatedGame = await apiClient.endGame(game.id);
        setGame(updatedGame);
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
        setGame({
          ...game,
          status: 'finished',
          winnerId: winnerId, // undefined for ties
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to end game');
    }
  };

  const handleBackToMenu = () => {
    setGame(null);
    setLastRoll(null);
    setIsDoubleSix(false);
    clearAI();
    setViewMode('menu');
    setError('');
  };

  const handleDeleteGame = async (gameId: string) => {
    if (!confirm('Are you sure you want to delete this game? This action cannot be undone.')) {
      return;
    }

    if (!user) {
      setError('You must be logged in to delete games. Please log in first.');
      return;
    }

    try {
      setError('');
      setIsLoading(true);
      console.log('Deleting game with ID:', gameId);
      console.log('Current user:', user?.username);
      console.log('Token in localStorage:', !!localStorage.getItem('token'));
      
      await apiClient.deleteGame(gameId);
      console.log('Game deleted successfully');
      // Remove the game from the list
      setAvailableGames(prevGames => {
        const filtered = prevGames.filter(g => g.id !== gameId);
        console.log('Updated games list, removed game:', gameId, 'Remaining:', filtered.length);
        return filtered;
      });
    } catch (err: any) {
      console.error('Error deleting game:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        gameId: gameId,
      });
      setError(err.message || 'Failed to delete game');
    } finally {
      setIsLoading(false);
    }
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
              <Button onClick={handleBackToMenu} color="inherit">
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
        onNewGame={handleNewGame}
        onAbandonGame={handleAbandonGameClick}
        onEndGame={handleEndGame}
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

function CreateGameForm({
  onCreateGame,
  currentUsername,
}: {
  onCreateGame: (p1: string, p2: string, score: number, isAI: boolean) => void;
  currentUsername: string;
}) {
  const [player1, setPlayer1] = useState(currentUsername);
  const [player2, setPlayer2] = useState('');
  const [winningScore, setWinningScore] = useState(100);
  const [opponentType, setOpponentType] = useState<'human' | 'ai'>('human');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isAI = opponentType === 'ai';
    const player2Username = isAI ? 'AI' : player2;
    if (player1 && player2Username) {
      onCreateGame(player1, player2Username, winningScore, isAI);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Player 1 (You)"
        value={player1}
        onChange={(e) => setPlayer1(e.target.value)}
        required
        fullWidth
      />
      
      <FormControl component="fieldset">
        <FormLabel component="legend">Opponent</FormLabel>
        <RadioGroup
          row
          value={opponentType}
          onChange={(e) => setOpponentType(e.target.value as 'human' | 'ai')}
          sx={{ mb: 1 }}
        >
          <FormControlLabel value="human" control={<Radio />} label="Human Player" />
          <FormControlLabel 
            value="ai" 
            control={<Radio />} 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <SmartToyIcon fontSize="small" /> AI Opponent
              </Box>
            } 
          />
        </RadioGroup>
        {opponentType === 'human' && (
          <TextField
            label="Player 2 Username"
            value={player2}
            onChange={(e) => setPlayer2(e.target.value)}
            placeholder="Enter player 2 username (can be any username)"
            required
            fullWidth
          />
        )}
        {opponentType === 'ai' && (
          <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
            You'll be playing against an AI opponent
          </Alert>
        )}
      </FormControl>
      
      <TextField
        label="Winning Score"
        type="number"
        value={winningScore}
        onChange={(e) => setWinningScore(parseInt(e.target.value) || 100)}
        inputProps={{ min: 1 }}
        required
        fullWidth
      />
      <Button
        type="submit"
        variant="contained"
        fullWidth
        sx={{ py: 1.5, fontWeight: 'semibold' }}
      >
        Create Game
      </Button>
      <Typography variant="caption" sx={{ textAlign: 'center', color: 'text.secondary' }}>
        Tip: You can enter any username for Player 2, or play against AI
      </Typography>
    </Box>
  );
}

