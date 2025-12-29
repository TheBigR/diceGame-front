'use client';

import { useState } from 'react';
import { Box, Button, TextField, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, Alert, Typography, InputAdornment, IconButton } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import LogoutIcon from '@mui/icons-material/Logout';
import { usePlayer2Auth } from '@/contexts/Player2AuthContext';
import Player2AuthDialog from './Player2AuthDialog';

interface CreateGameFormProps {
  onCreateGame: (p1: string, p2: string, score: number, isAI: boolean) => void;
  currentUsername: string;
  onSwitchAccount: () => void;
}

export default function CreateGameForm({
  onCreateGame,
  currentUsername,
  onSwitchAccount,
}: CreateGameFormProps) {
  const [player1, setPlayer1] = useState(currentUsername);
  const [player2, setPlayer2] = useState('');
  const [winningScore, setWinningScore] = useState(100);
  const [opponentType, setOpponentType] = useState<'human' | 'ai'>('human');
  const [showPlayer2Auth, setShowPlayer2Auth] = useState(false);
  const { user: player2User, logout: player2Logout } = usePlayer2Auth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isAI = opponentType === 'ai';
    
    if (isAI) {
      onCreateGame(player1, 'AI', winningScore, true);
      return;
    }

    // For human player, ensure player2 is authenticated
    if (!player2User) {
      setShowPlayer2Auth(true);
      return;
    }

    if (player1 && player2User.username) {
      onCreateGame(player1, player2User.username, winningScore, false);
    }
  };

  const handlePlayer2AuthSuccess = (username: string) => {
    setPlayer2(username);
    setShowPlayer2Auth(false);
  };

  const handlePlayer2AuthCancel = () => {
    setShowPlayer2Auth(false);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Player 1 (You)"
        value={player1}
        onChange={(e) => setPlayer1(e.target.value)}
        required
        fullWidth
        disabled
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Button
                variant="outlined"
                size="small"
                startIcon={<SwapHorizIcon />}
                onClick={onSwitchAccount}
                sx={{ textTransform: 'none', ml: 1 }}
              >
                Switch Account
              </Button>
            </InputAdornment>
          ),
        }}
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {player2User ? (
              <Box>
                <Alert 
                  severity="success" 
                  sx={{ mb: 1 }}
                  action={
                    <IconButton
                      aria-label="logout player 2"
                      color="inherit"
                      size="small"
                      onClick={() => {
                        player2Logout();
                        setPlayer2('');
                      }}
                    >
                      <LogoutIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  Player 2 authenticated as: <strong>{player2User.username}</strong>
                </Alert>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    player2Logout();
                    setPlayer2('');
                  }}
                  sx={{ textTransform: 'none' }}
                >
                  Switch Player 2 Account
                </Button>
              </Box>
            ) : (
              <Box>
                <Alert severity="info" sx={{ mb: 1, fontSize: '0.875rem' }}>
                  Player 2 needs to authenticate to play on this device
                </Alert>
                <Button
                  variant="contained"
                  onClick={() => setShowPlayer2Auth(true)}
                  sx={{ textTransform: 'none' }}
                >
                  Authenticate Player 2
                </Button>
              </Box>
            )}
          </Box>
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
        sx={{ py: 1.5, fontWeight: 'semibold', textTransform: 'none' }}
      >
        Create Game
      </Button>
      <Typography variant="caption" sx={{ textAlign: 'center', color: 'text.secondary' }}>
        Tip: You can enter any username for Player 2, or play against AI
      </Typography>

      <Player2AuthDialog
        open={showPlayer2Auth}
        onClose={handlePlayer2AuthCancel}
        onAuthSuccess={handlePlayer2AuthSuccess}
      />
    </Box>
  );
}

