'use client';

import { Box, Button, Alert, Paper } from '@mui/material';
import CasinoIcon from '@mui/icons-material/Casino';
import AddIcon from '@mui/icons-material/Add';
import NavBar from '@/components/NavBar';

interface MainMenuViewProps {
  username: string;
  onLogout: () => void;
  onCreateGame: () => void;
  onContinueGame: () => Promise<void>;
  error?: string;
}

export default function MainMenuView({
  username,
  onLogout,
  onCreateGame,
  onContinueGame,
  error,
}: MainMenuViewProps) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #eff6ff, #eef2ff)',
        p: { xs: 2, sm: 4 },
      }}
    >
      <Box sx={{ maxWidth: '56rem', mx: 'auto' }}>
        <NavBar
          username={username}
          onLogout={onLogout}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, mt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={onCreateGame}
              sx={{ py: 1.5, textTransform: 'none' }}
            >
              Create New Game
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              startIcon={<CasinoIcon />}
              onClick={onContinueGame}
              sx={{ py: 1.5, textTransform: 'none' }}
            >
              Continue Existing Game
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

