'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Player2AuthForm from './Player2AuthForm';

interface Player2AuthDialogProps {
  open: boolean;
  onClose: () => void;
  onAuthSuccess: (username: string) => void;
}

export default function Player2AuthDialog({
  open,
  onClose,
  onAuthSuccess,
}: Player2AuthDialogProps) {
  const [formKey, setFormKey] = useState(0);

  // Reset form when dialog opens - increment key to force remount with fresh state
  useEffect(() => {
    if (open) {
      // Force complete remount of form to clear all fields
      setFormKey((prev) => prev + 1);
    }
  }, [open]);

  const handleAuthSuccess = (username: string) => {
    onAuthSuccess(username);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            position: 'relative',
          },
        },
      }}
    >
      <DialogTitle sx={{ position: 'relative', pr: 6 }}>
        Authenticate Player 2
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Player2AuthForm
            key={formKey}
            onAuthSuccess={handleAuthSuccess}
            onCancel={handleCancel}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
}

