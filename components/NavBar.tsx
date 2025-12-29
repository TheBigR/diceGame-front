'use client';

import { Box, Button, Typography, IconButton, Tooltip } from '@mui/material';
import CasinoIcon from '@mui/icons-material/Casino';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import LogoutIcon from '@mui/icons-material/Logout';
import AddIcon from '@mui/icons-material/Add';
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
    <Box
      sx={{
        mb: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '56rem',
        mx: 'auto',
        position: 'relative',
      }}
    >
      {/* Left: Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 0 auto' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          <CasinoIcon /> Dice Game
        </Typography>
      </Box>

      {/* Center: Welcome Message */}
      <Box sx={{ 
        position: 'absolute', 
        left: '50%', 
        transform: 'translateX(-50%)',
        flex: '0 0 auto',
      }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
          Welcome, {username}!
        </Typography>
      </Box>

      {/* Right: Buttons */}
      <Box sx={{ display: 'flex', gap: 1, flex: '0 0 auto', ml: 'auto' }}>
        {showMainMenuButton && onMainMenuClick && (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            onClick={onMainMenuClick}
            title="Back to main menu"
          >
            Main Menu
          </Button>
        )}
        <Tooltip title={soundEnabled ? 'Disable sounds' : 'Enable sounds'}>
          <IconButton
            color={soundEnabled ? 'primary' : 'default'}
            onClick={handleSoundToggle}
          >
            {soundEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
          </IconButton>
        </Tooltip>
        <Button
          variant="contained"
          color="inherit"
          startIcon={<LogoutIcon />}
          onClick={onLogout}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );
}

