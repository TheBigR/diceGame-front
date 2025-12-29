'use client';

import { Box, Alert, Paper, Typography } from '@mui/material';
import NavBar from '@/components/NavBar';
import CreateGameForm from '@/components/CreateGameForm';

interface CreateGameViewProps {
  username: string;
  onLogout: () => void;
  onBackToMenu: () => void;
  onCreateGame: (p1: string, p2: string, score: number, isAI: boolean) => void;
  error?: string;
}

export default function CreateGameView({
  username,
  onLogout,
  onBackToMenu,
  onCreateGame,
  error,
}: CreateGameViewProps) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #eff6ff, #eef2ff)',
        p: 4,
      }}
    >
      <Box sx={{ maxWidth: '56rem', mx: 'auto' }}>
        <NavBar
          username={username}
          onLogout={onLogout}
          showMainMenuButton={true}
          onMainMenuClick={onBackToMenu}
        />
        <Paper elevation={3} sx={{ p: 4, mt: 2 }}>
          <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', mb: 3 }}>
            Create New Game
          </Typography>
          <CreateGameForm onCreateGame={onCreateGame} currentUsername={username} onSwitchAccount={onLogout} />
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

