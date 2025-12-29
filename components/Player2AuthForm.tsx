'use client';

import { useState, useEffect } from 'react';
import { Box, Button, TextField, Tabs, Tab, Alert, Typography } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { usePlayer2Auth } from '@/contexts/Player2AuthContext';

interface Player2AuthFormProps {
  onAuthSuccess: (username: string) => void;
  onCancel: () => void;
}

export default function Player2AuthForm({ onAuthSuccess, onCancel }: Player2AuthFormProps) {
  const [tab, setTab] = useState(0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = usePlayer2Auth();

  // Clear fields when component mounts (when dialog opens)
  // This runs every time the component is created (due to key prop change)
  useEffect(() => {
    // Reset all form state
    setUsername('');
    setPassword('');
    setError('');
    setTab(0);
    setIsLoading(false);
  }, []);

  // Clear fields when tab changes
  useEffect(() => {
    setUsername('');
    setPassword('');
    setError('');
  }, [tab]);

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      let result;
      if (tab === 0) {
        // Login
        result = await login(username, password);
      } else {
        // Register
        result = await register(username, password);
      }
      
      if (result.success) {
        onAuthSuccess(username);
      } else {
        setError(result.error || 'Authentication failed');
      }
    } catch (err: any) {
      // Fallback error handling (should not happen with new API)
      setError('Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Tabs value={tab} onChange={(_, newValue) => setTab(newValue)} sx={{ mb: 2 }}>
        <Tab label="Login" icon={<LoginIcon />} iconPosition="start" />
        <Tab label="Register" icon={<PersonAddIcon />} iconPosition="start" />
      </Tabs>

      {error && (
        <Alert severity="error" sx={{ fontSize: '0.875rem' }}>
          {error}
        </Alert>
      )}

      <TextField
        label="Player 2 Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        fullWidth
        disabled={isLoading}
        autoComplete="off"
        inputProps={{ autoComplete: 'off' }}
      />

      <TextField
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        fullWidth
        disabled={isLoading}
        autoComplete="new-password"
        inputProps={{ autoComplete: 'new-password' }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !isLoading && username && password) {
            handleSubmit(e as any);
          }
        }}
      />

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          type="button"
          variant="contained"
          fullWidth
          onClick={handleSubmit}
          disabled={isLoading}
          sx={{ textTransform: 'none' }}
        >
          {tab === 0 ? 'Login' : 'Register'}
        </Button>
        <Button
          type="button"
          variant="outlined"
          onClick={onCancel}
          disabled={isLoading}
          sx={{ textTransform: 'none' }}
        >
          Cancel
        </Button>
      </Box>

      <Typography variant="caption" sx={{ textAlign: 'center', color: 'text.secondary' }}>
        {tab === 0 
          ? 'Login as Player 2 to play on this device'
          : 'Register a new account for Player 2'}
      </Typography>
    </Box>
  );
}

