'use client';

import { Box, Typography, IconButton, Tooltip, Paper, Button, useMediaQuery, useTheme } from '@mui/material';
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
        mb: 1,
        px: { xs: 1.5, sm: 3 },
        py: { xs: 0.75, sm: 1 },
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: { xs: 0.75, sm: 1 },
        maxWidth: { xs: '100%', sm: '56rem' },
        mx: 'auto',
        width: '100%',
        boxSizing: 'border-box',
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 247, 255, 0.95) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
 
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1.5 }, flex: '1 1 auto', zIndex: 1, minWidth: 0 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: { xs: 28, sm: 40 },
            height: { xs: 28, sm: 40 },
            borderRadius: 1.5,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            boxShadow: 2,
            flexShrink: 0,
          }}
        >
          <CasinoIcon sx={{ fontSize: { xs: '1.1rem', sm: '1.75rem' } }} />
        </Box>
        <Box sx={{ minWidth: 0, flex: '1 1 auto' }}>
          <Typography 
            variant={isMobile ? "h6" : "h5"}
            component="h1" 
            sx={{ 
              fontWeight: 700, 
              color: 'text.primary',
              letterSpacing: 0.5,
              fontSize: { xs: '0.875rem', sm: '1.5rem' },
              lineHeight: { xs: 1.2, sm: 1.5 },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
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
              fontSize: { xs: '0.65rem', sm: '0.875rem' },
              lineHeight: { xs: 1.2, sm: 1.5 },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Welcome, <strong>{username}</strong>!
          </Typography>
        </Box>
      </Box>



            {/* Right: Buttons */}
            <Box sx={{ display: 'flex', gap: { xs: 0.25, sm: 1 }, flex: '0 0 auto', zIndex: 1, alignItems: 'center', flexShrink: 0 }}>
        {showMainMenuButton && onMainMenuClick && (
          <Tooltip title="Back to main menu" arrow>
            <IconButton
              color="primary"
              onClick={onMainMenuClick}
              size={isMobile ? 'small' : 'medium'}
              sx={{
                border: '1px solid',
                borderColor: 'primary.main',
                '&:hover': {
                  bgcolor: 'primary.light',
                  borderColor: 'primary.dark',
                },
              }}
            >
              <HomeIcon fontSize={isMobile ? 'small' : 'medium'} />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title={soundEnabled ? 'Disable sounds' : 'Enable sounds'} arrow>
          <IconButton
            color={soundEnabled ? 'primary' : 'default'}
            onClick={handleSoundToggle}
            size={isMobile ? 'small' : 'medium'}
            sx={{
              border: '1px solid',
              borderColor: soundEnabled ? 'primary.main' : 'divider',
              '&:hover': {
                bgcolor: soundEnabled ? 'primary.light' : 'action.hover',
                borderColor: soundEnabled ? 'primary.dark' : 'divider',
              },
            }}
          >
            {soundEnabled ? <VolumeUpIcon fontSize={isMobile ? 'small' : 'medium'} /> : <VolumeOffIcon fontSize={isMobile ? 'small' : 'medium'} />}
          </IconButton>
        </Tooltip>
        {isMobile ? (
          <Tooltip title="Logout" arrow>
            <IconButton
              color="error"
              onClick={onLogout}
              size="small"
              sx={{
                border: '1px solid',
                borderColor: 'error.main',
                '&:hover': {
                  bgcolor: 'error.light',
                  borderColor: 'error.dark',
                },
              }}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : (
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
        )}
      </Box>
    </Paper>
  );
}

