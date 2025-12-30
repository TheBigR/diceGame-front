'use client';

import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { GameState, DiceRoll } from '@/types';
import Dice from './Dice';
import { storage } from '@/lib/storage';
import { Box, Button, Typography, Paper, Alert, Chip, CircularProgress, Dialog, DialogTitle, IconButton, useMediaQuery, useTheme, Slide } from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
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
  player2UserId?: string | null;
  onRoll: () => Promise<void>;
  onHold: () => Promise<void>;
  onNewGame: () => Promise<void>;
  onAbandonGame: () => Promise<void>;
  onEndGame: () => Promise<void>;
  isRolling: boolean;
  lastRoll?: DiceRoll | null;
  aiName?: string | null;
}

const GameBoard: React.FC<GameBoardProps> = ({
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
}) => {
  const [showDoubleSixMessage, setShowDoubleSixMessage] = useState(false);
  const [diceRolling, setDiceRolling] = useState(false);
  const [isDoubleSix, setIsDoubleSix] = useState(false);
  const lastDoubleSixRollRef = useRef<string | null>(null);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const Transition = forwardRef(function Transition(
    props: TransitionProps & {
      children: React.ReactElement;
    },
    ref: React.Ref<unknown>,
  ) {
    // Filter out Dialog-specific props that shouldn't be passed to Slide
    const { 
      closeAfterTransition, 
      slotProps, 
      slots, 
      disableEscapeKeyDown,
      disableBackdropClick,
      disableScrollLock,
      hideBackdrop,
      onBackdropClick,
      onClose,
      open,
      ...slideProps 
    } = props as any;
    return <Slide direction="up" ref={ref} {...slideProps} />;
  });

  const currentPlayer = game.currentPlayerId === game.player1.id ? game.player1 : game.player2;
  // Check if it's either Player 1's or Player 2's turn (for two human players on same machine)
  const isMyTurn = currentPlayer.userId === currentUserId || (player2UserId && currentPlayer.userId === player2UserId);
  

  // Check if the last roll was a double six and handle it - show modal for ANY double six
  useEffect(() => {
    // Create a unique key for this roll to prevent showing modal multiple times for the same roll
    const rollKey = lastRoll ? `${lastRoll.die1}-${lastRoll.die2}` : null;
    
    // Show modal if it's a double six and we haven't already shown it for this roll
    if (lastRoll?.die1 === 6 && lastRoll?.die2 === 6 && lastDoubleSixRollRef.current !== rollKey && !isDoubleSix) {
      console.log('[Double Six] Detected double six, showing modal', { rollKey, lastRoll });
      // Mark this roll as handled
      lastDoubleSixRollRef.current = rollKey;
      // Set double six state, show modal, disable roll button
      setIsDoubleSix(true);
      setShowDoubleSixMessage(true);
      
      // After 3 seconds: hide modal, set isDoubleSix to false, and end the turn (if it's the player's turn)
      const timer = setTimeout(() => {
        console.log('[Double Six] Timer expired, closing modal');
        setShowDoubleSixMessage(false);
        setIsDoubleSix(false);
        // End the turn by calling hold (which will switch turns) - only if it's the player's turn
        if (isMyTurn) {
          onHold();
        }
        // Reset ref after modal closes
        lastDoubleSixRollRef.current = null;
      }, 4500);
      
      return () => clearTimeout(timer);
    } else if (!lastRoll || (lastRoll && (lastRoll.die1 !== 6 || lastRoll.die2 !== 6))) {
      // Reset if lastRoll is cleared or it's not a double six
      if (isDoubleSix) {
        console.log('[Double Six] Resetting double six state');
        setIsDoubleSix(false);
        setShowDoubleSixMessage(false);
      }
      // Reset ref when roll changes to non-double-six
      if (lastRoll && (lastRoll.die1 !== 6 || lastRoll.die2 !== 6)) {
        lastDoubleSixRollRef.current = null;
      }
    }
  }, [lastRoll, isMyTurn, isDoubleSix, onHold]);

  useEffect(() => {
    if (isRolling) {
      setDiceRolling(true);
      const timer = setTimeout(() => {
        setDiceRolling(false);
      }, 1500); // Stop after 1.5 seconds
      return () => clearTimeout(timer);
    } else {
      // Stop rolling immediately if isRolling becomes false
      setDiceRolling(false);
    }
  }, [isRolling]);

  const player1Wins = storage.getWinCount(game.player1.userId);
  const player2Wins = storage.getWinCount(game.player2.userId);

  return (
    <>
      {/* Double Six Modal - only render when open to avoid layout issues */}
      {showDoubleSixMessage && (
        <Dialog
          open={showDoubleSixMessage}
          onClose={() => {
            // Allow manual close - close dialog and reset state
            setShowDoubleSixMessage(false);
            setIsDoubleSix(false);
            // If it's still the player's turn, end it
            if (isMyTurn) {
              onHold();
            }
          }}
          TransitionComponent={Transition}
          slotProps={{
            paper: {
              sx: {
                position: 'relative',
                textAlign: 'center',
                p: 3,
                ...(fullScreen && {
                  m: 2,
                  mb: 0,
                  maxHeight: '60vh',
                  borderRadius: 2,
                }),
              },
            },
          }}
          maxWidth="sm"
          fullWidth
        >
        <IconButton
          aria-label="close"
          onClick={() => {
            // Allow manual close
            setShowDoubleSixMessage(false);
            setIsDoubleSix(false);
            // If it's still the player's turn, end it
            if (isMyTurn) {
              onHold();
            }
          }}
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
      )}

      <Box sx={{ maxWidth: '56rem', mx: 'auto'}}>

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
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 1 }}>
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
      <Paper sx={{ bgcolor: 'grey.100', p: 4, mb: 1.5, textAlign: 'center', minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
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
        <Typography variant="body2" component="div" sx={{ color: 'text.secondary', mt: 0.5 }}>
          {game.status === 'finished' ? (
            'Game ended'
          ) : isMyTurn ? (
            "It's your turn!"
          ) : aiName && currentPlayer.username === aiName ? (
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
              size="medium"
              startIcon={isRolling ? <CircularProgress size={20} color="inherit" /> : <CasinoIcon />}
              onClick={onRoll}
              disabled={isRolling || isDoubleSix}
              sx={{ minWidth: '140px', textTransform: 'none' }}
            >
              {isRolling ? 'Rolling...' : 'Roll Dice'}
            </Button>
            <Button
              variant="contained"
              color="warning"
              size="medium"
              startIcon={<SaveIcon />}
              onClick={onHold}
              disabled={isRolling || isDoubleSix}
              sx={{ minWidth: '140px', textTransform: 'none' }}
            >
              End Turn
            </Button>
          </>
        )}
        <Button
          variant="contained"
          color="inherit"
          size="medium"
          startIcon={<RefreshIcon />}
          onClick={onNewGame}
          sx={{ minWidth: '140px', textTransform: 'none' }}
        >
          New Game
        </Button>
        {(game.status === 'waiting' || game.status === 'active') && (
          <>
            <Button
              variant="contained"
              color="success"
              size="medium"
              startIcon={<FlagIcon />}
              onClick={onEndGame}
              sx={{ minWidth: '140px', textTransform: 'none' }}
            >
              End Game
            </Button>
            <Button
              variant="contained"
              color="error"
              size="medium"
              startIcon={<DeleteIcon />}
              onClick={onAbandonGame}
              sx={{ minWidth: '140px', textTransform: 'none' }}
            >
              Abandon Game
            </Button>
          </> 
        )}
      </Box>
      </Box>
    </>
  );
};

export default GameBoard;

