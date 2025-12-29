'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';

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
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="abandon-dialog-title"
      aria-describedby="abandon-dialog-description"
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

