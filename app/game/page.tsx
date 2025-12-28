'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { GameState, DiceRoll } from '@/types';
import { apiClient } from '@/lib/api';
import GameBoard from '@/components/GameBoard';
import { storage } from '@/lib/storage';
import { soundManager } from '@/lib/sounds';

export default function GamePage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [game, setGame] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRolling, setIsRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState<DiceRoll | null>(null);
  const [isDoubleSix, setIsDoubleSix] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadGame();
    }
  }, [user]);

  const loadGame = async () => {
    try {
      setIsLoading(true);
      const games = await apiClient.getMyGames();
      if (games.length > 0) {
        // Load the most recent active game, or the most recent game
        const activeGame = games.find((g) => g.status === 'active') || games[0];
        setGame(activeGame);
        if (activeGame) {
          const fullGame = await apiClient.getGame(activeGame.id);
          setGame(fullGame);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load games');
    } finally {
      setIsLoading(false);
    }
  };

  const createGame = async (player1Username: string, player2Username: string, winningScore = 100) => {
    try {
      setIsLoading(true);
      setError('');
      const newGame = await apiClient.createGame({
        player1Username,
        player2Username,
        winningScore,
      });
      setGame(newGame);
    } catch (err: any) {
      setError(err.message || 'Failed to create game');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoll = async () => {
    if (!game || isRolling) return;

    try {
      setIsRolling(true);
      setError('');
      soundManager.playRoll();
      const response = await apiClient.rollDice(game.id);
      setGame(response.gameState);
      setLastRoll(response.dice);
      setIsDoubleSix(response.isDoubleSix);

      if (response.isDoubleSix) {
        soundManager.playDoubleSix();
      }

      // Track win if game is over
      if (response.gameState.status === 'finished' && response.gameState.winnerId) {
        const winner = response.gameState.winnerId === response.gameState.player1.id
          ? response.gameState.player1
          : response.gameState.player2;
        storage.incrementWin(winner.userId);
        soundManager.playWin();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to roll dice');
    } finally {
      setIsRolling(false);
    }
  };

  const handleHold = async () => {
    if (!game) return;

    try {
      setError('');
      soundManager.playHold();
      const response = await apiClient.hold(game.id);
      setGame(response.gameState);
      setLastRoll(null);
      setIsDoubleSix(false);

      // Track win if game is over
      if (response.isGameOver && response.winnerId) {
        storage.incrementWin(response.winnerId);
        soundManager.playWin();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to hold');
    }
  };

  const handleNewGame = async () => {
    if (!game) return;

    try {
      setError('');
      const newGameState = await apiClient.newGame(game.id);
      setGame(newGameState);
      setLastRoll(null);
      setIsDoubleSix(false);
    } catch (err: any) {
      setError(err.message || 'Failed to start new game');
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Create New Game</h2>
            <CreateGameForm onCreateGame={createGame} currentUsername={user.username} />
            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}
            <button
              onClick={logout}
              className="mt-4 text-sm text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="mb-4 flex justify-between items-center max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🎲 Dice Game</h1>
          <p className="text-sm text-gray-600">Welcome, {user.username}!</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const enabled = !soundManager.isEnabled();
              soundManager.setEnabled(enabled);
            }}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            title={soundManager.isEnabled() ? 'Disable sounds' : 'Enable sounds'}
          >
            {soundManager.isEnabled() ? '🔊' : '🔇'}
          </button>
          <button
            onClick={logout}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {error && (
        <div className="max-w-4xl mx-auto mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <GameBoard
        game={game}
        currentUserId={user.id}
        onRoll={handleRoll}
        onHold={handleHold}
        onNewGame={handleNewGame}
        isRolling={isRolling}
        lastRoll={lastRoll}
        isDoubleSix={isDoubleSix}
      />
    </div>
  );
}

function CreateGameForm({
  onCreateGame,
  currentUsername,
}: {
  onCreateGame: (p1: string, p2: string, score: number) => void;
  currentUsername: string;
}) {
  const [player1, setPlayer1] = useState(currentUsername);
  const [player2, setPlayer2] = useState('');
  const [winningScore, setWinningScore] = useState(100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (player1 && player2) {
      onCreateGame(player1, player2, winningScore);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Player 1</label>
        <input
          type="text"
          value={player1}
          onChange={(e) => setPlayer1(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Player 2</label>
        <input
          type="text"
          value={player2}
          onChange={(e) => setPlayer2(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="Enter player 2 username"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Winning Score</label>
        <input
          type="number"
          value={winningScore}
          onChange={(e) => setWinningScore(parseInt(e.target.value) || 100)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          min="1"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
      >
        Create Game
      </button>
    </form>
  );
}

