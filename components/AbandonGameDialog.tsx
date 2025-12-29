'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  useMediaQuery,
  useTheme,
  Slide,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { forwardRef } from 'react';

const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface AbandonGameDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

export default function AbandonGameDialog({
  open,
  onClose,
  onConfirm,
  title = 'Abandon Game?',
  message = 'Are you sure you want to abandon this game? This action cannot be undone.',
  confirmText = 'Abandon Game',
  cancelText = 'Cancel',
}: AbandonGameDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      aria-labelledby="abandon-dialog-title"
      aria-describedby="abandon-dialog-description"
      slotProps={{
        paper: {
          sx: {
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
      <DialogTitle id="abandon-dialog-title">
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="abandon-dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none' }}>
          {cancelText}
        </Button>
        <Button onClick={handleConfirm} color="error" variant="contained" autoFocus sx={{ textTransform: 'none' }}>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

