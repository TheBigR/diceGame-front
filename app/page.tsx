'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AuthForm from '@/components/AuthForm';
import { Box, Typography, CircularProgress } from '@mui/material';
import CasinoIcon from '@mui/icons-material/Casino';

export default function Home() {
  const { user, login, register, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/game');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (user) {
    return null; // Will redirect
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #eff6ff, #eef2ff)',
      }}
    >
      <Box sx={{ maxWidth: 'container', mx: 'auto' }}>
        <Box sx={{ textAlign: 'center', pt: 6, mb: 4 }}>
          <Typography variant="h2" component="h1" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <CasinoIcon sx={{ fontSize: '3rem' }} /> Dice Game
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Roll the dice and be the first to reach the winning score!
          </Typography>
        </Box>
        <AuthForm onLogin={login} onRegister={register} isLoading={isLoading} />
      </Box>
    </Box>
  );
}
