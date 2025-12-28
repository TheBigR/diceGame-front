'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AuthForm from '@/components/AuthForm';

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto">
        <div className="text-center pt-12 mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-2">🎲 Dice Game</h1>
          <p className="text-gray-600">Roll the dice and be the first to reach the winning score!</p>
        </div>
        <AuthForm onLogin={login} onRegister={register} isLoading={isLoading} />
      </div>
    </div>
  );
}
