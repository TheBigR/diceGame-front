'use client';

import { Box, Typography, IconButton, Tooltip, Paper, Divider, Button } from '@mui/material';
import CasinoIcon from '@mui/icons-material/Casino';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import LogoutIcon from '@mui/icons-material/Logout';
import HomeIcon from '@mui/icons-material/Home';
import { soundManager } from '@/lib/sounds';
import { useState, useEffect } from 'react';

interface NavBarProps {
  username: string;
  onLogout: () => void;
  showMainMenuButton?: boolean;
  onMainMenuClick?: () => void;
}

export default function NavBar({
  username,
  onLogout,
  showMainMenuButton = false,
  onMainMenuClick,
}: NavBarProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    // Initialize sound state from soundManager
    setSoundEnabled(soundManager.isEnabled());
  }, []);

  const handleSoundToggle = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    soundManager.setEnabled(newState);
  };

  return (
    <Paper
      elevation={3}
      sx={{
        mb: 0.1,
        px: 3,        
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '56rem',
        mx: 'auto',
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 247, 255, 0.95) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
      }}
    >
 
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: '0 0 auto', zIndex: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: 1.5,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            boxShadow: 2,
          }}
        >
          <CasinoIcon />
        </Box>
        <Box>
        <Typography 
          variant="h5" 
          component="h1" 
          sx={{ 
            fontWeight: 700, 
            color: 'text.primary',
            letterSpacing: 0.5,
          }}
        >
          Dice Game
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'text.secondary', 
            whiteSpace: 'nowrap',
            fontWeight: 500,
          }}
        >
          Welcome, <strong>{username}</strong>!
        </Typography>
        </Box>
      </Box>



      {/* Right: Buttons */}
      <Box sx={{ display: 'flex', gap: 1, flex: '0 0 auto', ml: 'auto', zIndex: 1 }}>
        {showMainMenuButton && onMainMenuClick && (
          <>
            <Tooltip title="Back to main menu" arrow>
              <IconButton
                color="primary"
                onClick={onMainMenuClick}
                sx={{
                  border: '1px solid',
                  borderColor: 'primary.main',
                  '&:hover': {
                    bgcolor: 'primary.light',
                    borderColor: 'primary.dark',
                  },
                }}
              >
                <HomeIcon />
              </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          </>
        )}
        <Tooltip title={soundEnabled ? 'Disable sounds' : 'Enable sounds'} arrow>
          <IconButton
            color={soundEnabled ? 'primary' : 'default'}
            onClick={handleSoundToggle}
            sx={{
              border: '1px solid',
              borderColor: soundEnabled ? 'primary.main' : 'divider',
              '&:hover': {
                bgcolor: soundEnabled ? 'primary.light' : 'action.hover',
                borderColor: soundEnabled ? 'primary.dark' : 'divider',
              },
            }}
          >
            {soundEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
          </IconButton>
        </Tooltip>
        <Button
          variant="contained"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={onLogout}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: 2,
            '&:hover': {
              boxShadow: 4,
            },
          }}
        >
          Logout
        </Button>
      </Box>
    </Paper>
  );
}

