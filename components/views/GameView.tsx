'use client';

import { Box, Alert } from '@mui/material';
import { GameState, DiceRoll } from '@/types';
import NavBar from '@/components/NavBar';
import GameBoard from '@/components/GameBoard';
import AbandonGameDialog from '@/components/AbandonGameDialog';

interface GameViewProps {
  username: string;
  onLogout: () => void;
  onBackToMenu: () => void;
  game: GameState;
  currentUserId: string;
  player2UserId?: string | null;
  onRoll: () => Promise<void>;
  onHold: () => Promise<void>;
  onNewGame: () => Promise<void>;
  onAbandonGame: () => Promise<void>;
  onEndGame: () => Promise<void>;
  isRolling: boolean;
  lastRoll: DiceRoll | null;
  aiName?: string;
  abandonDialogOpen: boolean;
  onAbandonGameCancel: () => void;
  onAbandonGameConfirm: () => void;
  error?: string;
}

export default function GameView({
  username,
  onLogout,
  onBackToMenu,
  game,
  currentUserId,
  player2UserId,
  onRoll,
  onHold,
  onNewGame,
  onAbandonGame,
  onEndGame,
  isRolling,
  lastRoll,
  aiName,
  abandonDialogOpen,
  onAbandonGameCancel,
  onAbandonGameConfirm,
  error,
}: GameViewProps) {
  return (
    <Box
      sx={{
        height: '100vh',
        background: 'linear-gradient(to bottom right, #eff6ff, #eef2ff)',
        px: { xs: 2, sm: 4 },
        pt: { xs: 2, sm: 4 },
        pb: { xs: 2, sm: 4 },
      }}
    >
      <NavBar
        username={username}
        onLogout={onLogout}
        showMainMenuButton={true}
        onMainMenuClick={onBackToMenu}
      />

      {error && (
        <Box sx={{ maxWidth: '56rem', mx: 'auto', mb: 0.1, mt: 2 ,}}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      <GameBoard
        game={game}
        currentUserId={currentUserId}
        player2UserId={player2UserId}
        onRoll={onRoll}
        onHold={onHold}
        onNewGame={onNewGame}
        onAbandonGame={onAbandonGame}
        onEndGame={onEndGame}
        isRolling={isRolling}
        lastRoll={lastRoll}
        aiName={aiName}
      />

      <AbandonGameDialog
        open={abandonDialogOpen}
        onClose={onAbandonGameCancel}
        onConfirm={onAbandonGameConfirm}
      />
    </Box>
  );
}

