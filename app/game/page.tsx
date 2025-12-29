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
import { Box, Button, Typography, Alert, IconButton, Tooltip, Paper, CircularProgress, TextField, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel } from '@mui/material';
import CasinoIcon from '@mui/icons-material/Casino';
import AddIcon from '@mui/icons-material/Add';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import LogoutIcon from '@mui/icons-material/Logout';
import SmartToyIcon from '@mui/icons-material/SmartToy';

export default function GamePage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [game, setGame] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRolling, setIsRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState<DiceRoll | null>(null);
  const [isDoubleSix, setIsDoubleSix] = useState(false);
  const [error, setError] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // AI Player hook
  const { aiUser, registerAI, clearAI, aiName } = useAIPlayer({
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
    if (user) {
      loadGame();
    }
  }, [user]);

  useEffect(() => {
    // Initialize sound state from soundManager
    setSoundEnabled(soundManager.isEnabled());
  }, []);

  const loadGame = async () => {
    try {
      setIsLoading(true);
      const games = await apiClient.getMyGames();
      if (games.length > 0) {
        // Load the most recent active game, or the most recent game
        const activeGame = games.find((g) => g.status === 'active') || games[0];
        setGame(activeGame);
        if (activeGame) {
          const fullGame = await apiClient.getGame(activeGame.id);
          setGame(fullGame);
          
          // Check if this game has an AI player - try to match by checking if player2 username matches a pattern
          // or if we need to restore aiUser from storage
          // For now, we'll rely on the aiUser state being set when creating the game
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load games');
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
      }

      // Track win if game is over
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
      const newGameState = await apiClient.newGame(game.id);
      setGame(newGameState);
      setLastRoll(null);
      setIsDoubleSix(false);
    } catch (err: any) {
      setError(err.message || 'Failed to start new game');
    }
  };

  const handleAbandonGame = async () => {
    if (!game) return;

    if (!confirm('Are you sure you want to abandon this game? This action cannot be undone.')) {
      return;
    }

    try {
      setError('');
      await apiClient.deleteGame(game.id);
      setGame(null); // Return to game creation screen
      setLastRoll(null);
      setIsDoubleSix(false);
    } catch (err: any) {
      // If delete fails, just clear the game locally (might not exist on backend)
      setGame(null);
      setError('');
    }
  };

  if (authLoading || isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h5">Loading...</Typography>
      </Box>
    );
  }

  if (!user) {
    return null;
  }

  if (!game) {
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
            <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', mb: 3 }}>
              Create New Game
            </Typography>
            <CreateGameForm onCreateGame={createGame} currentUsername={user.username} />
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            <Button
              onClick={logout}
              sx={{ mt: 2 }}
              size="small"
              color="inherit"
            >
              Logout
            </Button>
          </Paper>
        </Box>
      </Box>
    );
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
            onClick={() => setGame(null)}
            title="Create a new game"
          >
            New Game
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
        onAbandonGame={handleAbandonGame}
        isRolling={isRolling}
        lastRoll={lastRoll}
        isDoubleSix={isDoubleSix}
        aiName={aiName}
      />
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

