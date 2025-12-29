'use client';

import { useState } from 'react';
import { Box, Button, TextField, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, Alert, Typography } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';

interface CreateGameFormProps {
  onCreateGame: (p1: string, p2: string, score: number, isAI: boolean) => void;
  currentUsername: string;
}

export default function CreateGameForm({
  onCreateGame,
  currentUsername,
}: CreateGameFormProps) {
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
        sx={{ py: 1.5, fontWeight: 'semibold', textTransform: 'none' }}
      >
        Create Game
      </Button>
      <Typography variant="caption" sx={{ textAlign: 'center', color: 'text.secondary' }}>
        Tip: You can enter any username for Player 2, or play against AI
      </Typography>
    </Box>
  );
}

