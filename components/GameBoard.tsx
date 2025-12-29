'use client';

import React, { useState, useEffect } from 'react';
import { GameState, DiceRoll } from '@/types';
import Dice from './Dice';
import { storage } from '@/lib/storage';
import { Box, Button, Typography, Paper, Alert, Chip, CircularProgress, Dialog, DialogTitle, IconButton } from '@mui/material';
import CasinoIcon from '@mui/icons-material/Casino';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CloseIcon from '@mui/icons-material/Close';
import FlagIcon from '@mui/icons-material/Flag';

interface GameBoardProps {
  game: GameState;
  currentUserId: string;
  onRoll: () => Promise<void>;
  onHold: () => Promise<void>;
  onNewGame: () => Promise<void>;
  onAbandonGame: () => Promise<void>;
  onEndGame: () => Promise<void>;
  isRolling: boolean;
  lastRoll?: DiceRoll | null;
  isDoubleSix: boolean;
  aiName?: string | null;
}

const GameBoard: React.FC<GameBoardProps> = ({
  game,
  currentUserId,
  onRoll,
  onHold,
  onNewGame,
  onAbandonGame,
  onEndGame,
  isRolling,
  lastRoll,
  isDoubleSix,
  aiName,
}) => {
  const [showDoubleSixMessage, setShowDoubleSixMessage] = useState(false);
  const [diceRolling, setDiceRolling] = useState(false);

  const currentPlayer = game.currentPlayerId === game.player1.id ? game.player1 : game.player2;
  const isMyTurn = currentPlayer.userId === currentUserId;
  const isPlayer1 = game.player1.userId === currentUserId;
  const myScore = isPlayer1 ? game.player1Score : game.player2Score;
  const myRoundScore = isPlayer1 ? game.player1RoundScore : game.player2RoundScore;
  const opponentScore = isPlayer1 ? game.player2Score : game.player1Score;
  const opponentRoundScore = isPlayer1 ? game.player2RoundScore : game.player1RoundScore;
  const opponent = isPlayer1 ? game.player2 : game.player1;

  useEffect(() => {
    if (isDoubleSix) {
      setShowDoubleSixMessage(true);
      const timer = setTimeout(() => {
        setShowDoubleSixMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowDoubleSixMessage(false);
    }
  }, [isDoubleSix]);

  useEffect(() => {
    if (isRolling) {
      setDiceRolling(true);
      const timer = setTimeout(() => {
        setDiceRolling(false);
      }, 15900); // Stop after 1.5 seconds
      return () => clearTimeout(timer);
    } else {
      // Stop rolling immediately if isRolling becomes false
      setDiceRolling(false);
    }
  }, [isRolling]);

  const player1Wins = storage.getWinCount(game.player1.userId);
  const player2Wins = storage.getWinCount(game.player2.userId);

  return (
    <Box sx={{ maxWidth: '56rem', mx: 'auto', p: 3 }}>
      {/* Double Six Modal */}
      <Dialog
        open={showDoubleSixMessage}
        onClose={() => setShowDoubleSixMessage(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            position: 'relative',
            textAlign: 'center',
            p: 3,
          },
        }}
      >
        <IconButton
          aria-label="close"
          onClick={() => setShowDoubleSixMessage(false)}
          sx={{
            position: 'absolute',
            left: 8,
            top: 8,
            color: 'grey.500',
          }}
        >
          <CloseIcon />
        </IconButton>
        <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CasinoIcon sx={{ fontSize: 60, color: 'error.main' }} />
            <Typography variant="h4" component="strong" sx={{ color: 'error.main', fontWeight: 'bold' }}>
              Double Six!
            </Typography>
            <Typography variant="h6" sx={{ color: 'text.secondary' }}>
              Round score lost!
            </Typography>
          </Box>
        </DialogTitle>
      </Dialog>

      {/* Game Over Message */}
      {game.status === 'finished' && (
        game.winnerId ? (
          <Alert severity="success" sx={{ mb: 2, textAlign: 'center' }}>
            <Typography variant="h5" component="strong">
              {game.winnerId === game.player1.id ? game.player1.username : game.player2.username} Wins!
            </Typography>
          </Alert>
        ) : (
          <Alert severity="info" sx={{ mb: 2, textAlign: 'center' }}>
            <Typography variant="h5" component="strong">
              It's a Tie! Both players have {game.player1Score} points.
            </Typography>
          </Alert>
        )
      )}

      {/* Player Scores */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
        {/* Player 1 */}
        <Paper
          elevation={game.currentPlayerId === game.player1.id ? 4 : 1}
          sx={{
            p: 3,
            border: 2,
            borderColor: game.currentPlayerId === game.player1.id ? 'primary.main' : 'grey.300',
            bgcolor: game.currentPlayerId === game.player1.id ? 'primary.50' : 'background.paper',
            transition: 'all 0.3s',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              {game.player1.username}
              {aiName && game.player1.username === aiName && (
                <Chip icon={<SmartToyIcon />} label="AI" size="small" color="secondary" />
              )}
            </Typography>
            {game.currentPlayerId === game.player1.id && (
              <Chip label="Your Turn" size="small" color="primary" />
            )}
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 0.5 }}>
            {game.player1Score}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Round: <strong>{game.player1RoundScore}</strong>
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.5, display: 'block' }}>
            Wins: {player1Wins}
          </Typography>
        </Paper>

        {/* Player 2 */}
        <Paper
          elevation={game.currentPlayerId === game.player2.id ? 4 : 1}
          sx={{
            p: 3,
            border: 2,
            borderColor: game.currentPlayerId === game.player2.id ? 'primary.main' : 'grey.300',
            bgcolor: game.currentPlayerId === game.player2.id ? 'primary.50' : 'background.paper',
            transition: 'all 0.3s',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              {game.player2.username}
              {aiName && game.player2.username === aiName && (
                <Chip icon={<SmartToyIcon />} label="AI" size="small" color="secondary" />
              )}
            </Typography>
            {game.currentPlayerId === game.player2.id && (
              <Chip label="Your Turn" size="small" color="primary" />
            )}
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 0.5 }}>
            {game.player2Score}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Round: <strong>{game.player2RoundScore}</strong>
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.5, display: 'block' }}>
            Wins: {player2Wins}
          </Typography>
        </Paper>
      </Box>

      {/* Dice Display */}
      <Paper sx={{ bgcolor: 'grey.100', p: 4, mb: 3, textAlign: 'center', minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 3, mb: 2, minHeight: '120px' }}>
          {lastRoll ? (
            <>
              <Dice value={lastRoll.die1} isRolling={diceRolling} size="lg" />
              <Dice value={lastRoll.die2} isRolling={diceRolling} size="lg" />
            </>
          ) : (
            <>
              <Dice value={1} size="lg" />
              <Dice value={1} size="lg" />
            </>
          )}
        </Box>
        <Box sx={{ minHeight: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {lastRoll ? (
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Rolled: {lastRoll.die1} + {lastRoll.die2} = {lastRoll.die1 + lastRoll.die2}
            </Typography>
          ) : (
            <Typography variant="body1" sx={{ color: 'transparent' }}>
              &nbsp;
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Game Info */}
      <Paper sx={{ bgcolor: 'grey.50', p: 2, mb: 3, textAlign: 'center' }}>
        <Typography variant="body1" sx={{ color: 'text.primary' }}>
          Winning Score: <strong>{game.winningScore}</strong>
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          {isMyTurn ? "It's your turn!" : aiName && currentPlayer.username === aiName ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <SmartToyIcon fontSize="small" />
              {aiName} is thinking...
            </Box>
          ) : (
            `Waiting for ${currentPlayer.username}...`
          )}
        </Typography>
      </Paper>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', minHeight: '56px', alignItems: 'center' }}>
        {game.status === 'active' && isMyTurn && (
          <>
            <Button
              variant="contained"
              color="success"
              size="large"
              startIcon={isRolling ? <CircularProgress size={20} color="inherit" /> : <CasinoIcon />}
              onClick={onRoll}
              disabled={isRolling || showDoubleSixMessage}
              sx={{ minWidth: '140px' }}
            >
              {isRolling ? 'Rolling...' : 'Roll Dice'}
            </Button>
            <Button
              variant="contained"
              color="warning"
              size="large"
              startIcon={<SaveIcon />}
              onClick={onHold}
              disabled={isRolling || showDoubleSixMessage}
              sx={{ minWidth: '140px' }}
            >
              End Turn
            </Button>
          </>
        )}
        <Button
          variant="contained"
          color="inherit"
          size="large"
          startIcon={<RefreshIcon />}
          onClick={onNewGame}
          sx={{ minWidth: '140px' }}
        >
          New Game
        </Button>
        {(game.status === 'waiting' || game.status === 'active') && (
          <>
            <Button
              variant="contained"
              color="success"
              size="large"
              startIcon={<FlagIcon />}
              onClick={onEndGame}
              sx={{ minWidth: '140px' }}
            >
              End Game
            </Button>
            <Button
              variant="contained"
              color="error"
              size="large"
              startIcon={<DeleteIcon />}
              onClick={onAbandonGame}
              sx={{ minWidth: '140px' }}
            >
              Abandon Game
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
};

export default GameBoard;

