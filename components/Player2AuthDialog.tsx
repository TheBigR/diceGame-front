'use client';

import { useState, useEffect, forwardRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  useMediaQuery,
  useTheme,
  Slide,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import CloseIcon from '@mui/icons-material/Close';
import Player2AuthForm from './Player2AuthForm';

const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

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

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            position: 'relative',
            ...(fullScreen && {
              m: 2,
              mb: 0,
              maxHeight: '60vh',
              borderRadius: 2,
            }),
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

