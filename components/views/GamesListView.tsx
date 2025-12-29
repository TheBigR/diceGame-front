'use client';

import { Box, Button, Typography, Alert, Paper, CircularProgress, Tooltip, IconButton } from '@mui/material';
import { GameState } from '@/types';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import NavBar from '@/components/NavBar';

interface GamesListViewProps {
  username: string;
  onLogout: () => void;
  onBackToMenu: () => void;
  onCreateGame: () => void;
  onLoadGame: (gameId: string) => void;
  onDeleteGame: (gameId: string) => void;
  availableGames: GameState[];
  isLoading: boolean;
  error?: string;
}

export default function GamesListView({
  username,
  onLogout,
  onBackToMenu,
  onCreateGame,
  onLoadGame,
  onDeleteGame,
  availableGames,
  isLoading,
  error,
}: GamesListViewProps) {
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
        <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', mb: 3, mt: 2 }}>
          Your Games
        </Typography>

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
              onClick={onCreateGame}
              sx={{ textTransform: 'none' }}
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
                      onClick={() => onLoadGame(g.id)}
                      disabled={isLoading}
                      sx={{ textTransform: 'none' }}
                    >
                      Continue
                    </Button>
                    <Tooltip title="Delete game">
                      <IconButton
                        color="error"
                        onClick={() => onDeleteGame(g.id)}
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

