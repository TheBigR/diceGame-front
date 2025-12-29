import { useEffect, useRef, useState } from 'react';
import { GameState, User, DiceRoll } from '@/types';
import { apiClient } from '@/lib/api';
import { storage } from '@/lib/storage';
import { soundManager } from '@/lib/sounds';

interface AIUser {
  user: User;
  token: string;
  name: string;
}

interface UseAIPlayerProps {
  game: GameState | null;
  currentUserId: string;
  isRolling: boolean;
  isDoubleSix: boolean;
  onGameUpdate: (game: GameState) => void;
  onLastRollUpdate: (roll: DiceRoll | null) => void;
  onDoubleSixUpdate: (value: boolean) => void;
  onRollingUpdate: (value: boolean) => void;
}

export function useAIPlayer({
  game,
  currentUserId,
  isRolling,
  isDoubleSix,
  onGameUpdate,
  onLastRollUpdate,
  onDoubleSixUpdate,
  onRollingUpdate,
}: UseAIPlayerProps) {
  const [aiUser, setAiUser] = useState<AIUser | null>(null);
  const aiProcessingRef = useRef(false);
  const lastProcessedGameStateRef = useRef<string | null>(null);

  // Register AI user
  const registerAI = async (): Promise<AIUser> => {
    const aiName = generateAIName();
    const aiPassword = `ai_${Math.random().toString(36).slice(2, 15)}`;
    
    const authResponse = await apiClient.register(aiName, aiPassword);
    const aiUserData: AIUser = {
      user: authResponse.user,
      token: authResponse.token,
      name: aiName,
    };
    
    // Store credentials for later restoration
    storage.saveAICredentials(aiName, aiPassword);
    
    setAiUser(aiUserData);
    return aiUserData;
  };

  // Clear AI user
  const clearAI = () => {
    setAiUser(null);
    aiProcessingRef.current = false;
    lastProcessedGameStateRef.current = null;
    // Don't clear credentials - we might need them for new games
  };

  // AI player logic
  useEffect(() => {
    if (!game || game.status !== 'active') {
      if (game?.status !== 'active') {
        lastProcessedGameStateRef.current = null;
        aiProcessingRef.current = false;
      }
      return;
    }

    // Check if game has AI opponent
    const aiNamePatterns = ['Shadow', 'Neon', 'Cyber', 'Quantum', 'Nova', 'Vortex', 'Phantom', 'Echo', 'Blaze', 'Storm', 'Frost', 'Thunder', 'Cosmic', 'Astral', 'Mystic', 'Razor', 'Swift', 'Iron', 'Steel', 'Crystal'];
    const hasAIOpponent = aiNamePatterns.some(pattern => 
      game.player1.username.startsWith(pattern) || game.player2.username.startsWith(pattern)
    );

    // If game has AI but we don't have aiUser, try to restore it
    if (hasAIOpponent && !aiUser) {
      restoreAIForGame(game);
      return; // Wait for AI to be restored
    }

    // Need aiUser to make moves
    if (!aiUser) {
      return;
    }
    
    // Wait for double six message to clear before continuing
    if (isDoubleSix) {
      return;
    }

    const currentPlayer = game.currentPlayerId === game.player1.id ? game.player1 : game.player2;
    // Check if it's AI's turn by comparing userId or username (fallback)
    // Also check if the current player's username matches AI name patterns as a fallback
    const isAIPlayer = aiNamePatterns.some(pattern => currentPlayer.username.startsWith(pattern));
    const isAITurn = currentPlayer.userId === aiUser.user.id || currentPlayer.username === aiUser.name || isAIPlayer;
    
    // Create a unique identifier for this game state
    const gameStateId = `${game.currentPlayerId}-${game.updatedAt}`;
    const alreadyProcessed = lastProcessedGameStateRef.current === gameStateId;
    const isNewAITurn = isAITurn && !alreadyProcessed && !aiProcessingRef.current;

    if (isNewAITurn) {
      aiProcessingRef.current = true;
      lastProcessedGameStateRef.current = gameStateId;
      
      const gameId = game.id;
      const aiPlayerId = currentPlayer.id;
      
      // AI makes a decision after a short delay
      const aiTimer = setTimeout(async () => {
        try {
          // Get latest game state
          let currentGame: GameState;
          try {
            currentGame = await apiClient.getGame(gameId);
          } catch (err) {
            console.error('Failed to fetch game state for AI:', err);
            aiProcessingRef.current = false;
            return;
          }

          // Verify it's still AI's turn
          const currentPlayerNow = currentGame.currentPlayerId === currentGame.player1.id 
            ? currentGame.player1 
            : currentGame.player2;
          
          if (currentPlayerNow.id !== aiPlayerId || currentGame.status !== 'active') {
            aiProcessingRef.current = false;
            return;
          }
          
          const isAIPlayer1 = aiPlayerId === currentGame.player1.id;
          const aiRoundScore = isAIPlayer1 ? currentGame.player1RoundScore : currentGame.player2RoundScore;
          
          // AI strategy: Roll until round score >= 87, then hold
          if (aiRoundScore >= 87) {
            // Hold
            const response = await apiClient.hold(gameId, aiUser.token);
            onGameUpdate(response.gameState);
            onLastRollUpdate(null);
            onDoubleSixUpdate(false);
            
            if (response.isGameOver && response.winnerId) {
              storage.incrementWin(response.winnerId);
              soundManager.playWin();
            }
            // After holding, turn switches - refresh game state from backend to ensure accuracy
            try {
              const refreshedState = await apiClient.getGameState(gameId);
              onGameUpdate(refreshedState);
            } catch (err) {
              console.warn('Failed to refresh game state after AI hold:', err);
            }
            // Reset flags
            aiProcessingRef.current = false;
            lastProcessedGameStateRef.current = null;
          } else {
            // Roll
            onRollingUpdate(true);
            soundManager.playRoll();
            const response = await apiClient.rollDice(gameId, aiUser.token);
            onGameUpdate(response.gameState);
            onLastRollUpdate(response.dice);
            onDoubleSixUpdate(response.isDoubleSix);
            
            if (response.isDoubleSix) {
              soundManager.playDoubleSix();
              // Double six - turn switches, refresh game state from backend
              try {
                const refreshedState = await apiClient.getGameState(gameId);
                onGameUpdate(refreshedState);
              } catch (err) {
                console.warn('Failed to refresh game state after double six:', err);
              }
              // Reset flags
              aiProcessingRef.current = false;
              lastProcessedGameStateRef.current = null;
            } else {
              // Still AI's turn - reset flags so it can continue rolling
              aiProcessingRef.current = false;
              lastProcessedGameStateRef.current = null;
            }
            
            if (response.gameState.status === 'finished' && response.gameState.winnerId) {
              const winner = response.gameState.winnerId === response.gameState.player1.id
                ? response.gameState.player1
                : response.gameState.player2;
              storage.incrementWin(winner.userId);
              soundManager.playWin();
            }
            onRollingUpdate(false);
          }
        } catch (err) {
          console.error('AI move error:', err);
          aiProcessingRef.current = false;
          lastProcessedGameStateRef.current = null;
        }
      }, 1000);

      return () => {
        clearTimeout(aiTimer);
      };
    } else if (!isAITurn) {
      lastProcessedGameStateRef.current = null;
    }
  }, [game?.currentPlayerId, game?.updatedAt, game?.status, game?.id, aiUser, isDoubleSix, onGameUpdate, onLastRollUpdate, onDoubleSixUpdate, onRollingUpdate]);

  // Check if a game has an AI opponent by checking if any player username matches AI name patterns
  const isAIGame = (gameState: GameState | null): boolean => {
    if (!gameState) return false;
    const aiNamePatterns = ['Shadow', 'Neon', 'Cyber', 'Quantum', 'Nova', 'Vortex', 'Phantom', 'Echo', 'Blaze', 'Storm', 'Frost', 'Thunder', 'Cosmic', 'Astral', 'Mystic', 'Razor', 'Swift', 'Iron', 'Steel', 'Crystal'];
    return aiNamePatterns.some(pattern => 
      gameState.player1.username.startsWith(pattern) || gameState.player2.username.startsWith(pattern)
    );
  };

  // Restore AI user if game has AI opponent but aiUser is not set
  const restoreAIForGame = async (gameState: GameState | null): Promise<void> => {
    if (!gameState || aiUser) return; // Already have AI user or no game
    
    if (isAIGame(gameState)) {
      // Find which player is the AI
      const aiNamePatterns = ['Shadow', 'Neon', 'Cyber', 'Quantum', 'Nova', 'Vortex', 'Phantom', 'Echo', 'Blaze', 'Storm', 'Frost', 'Thunder', 'Cosmic', 'Astral', 'Mystic', 'Razor', 'Swift', 'Iron', 'Steel', 'Crystal'];
      const aiPlayer = aiNamePatterns.some(pattern => gameState.player1.username.startsWith(pattern))
        ? gameState.player1
        : gameState.player2;
      
      // Try to log in with stored credentials first
      const credentials = storage.getAICredentials();
      if (credentials && credentials.username === aiPlayer.username) {
        try {
          const authResponse = await apiClient.login(credentials.username, credentials.password);
          const aiUserData: AIUser = {
            user: authResponse.user,
            token: authResponse.token,
            name: credentials.username,
          };
          setAiUser(aiUserData);
          console.log('AI user restored by logging in:', aiUserData.name);
          return;
        } catch (err) {
          console.log('Failed to log in as AI, will register new one:', err);
        }
      }
      
      // If login failed or no credentials, register a new AI user
      // This will work if the backend allows different users with similar names
      try {
        const aiUserData = await registerAI();
        console.log('AI user restored by registering new user:', aiUserData.name);
      } catch (err) {
        console.error('Failed to restore AI user:', err);
      }
    }
  };

  return {
    aiUser,
    registerAI,
    clearAI,
    aiName: aiUser?.name || null,
    isAIGame,
    restoreAIForGame,
  };
}

// Generate cool AI names
function generateAIName(): string {
  const prefixes = ['Shadow', 'Neon', 'Cyber', 'Quantum', 'Nova', 'Vortex', 'Phantom', 'Echo', 'Blaze', 'Storm', 'Frost', 'Thunder', 'Cosmic', 'Astral', 'Mystic', 'Razor', 'Swift', 'Iron', 'Steel', 'Crystal'];
  const suffixes = ['Dice', 'Roller', 'Master', 'Champion', 'Legend', 'Warrior', 'Hunter', 'Striker', 'Slayer', 'Guardian', 'Sentinel', 'Vanguard', 'Ace', 'Pro', 'Elite', 'Prime', 'Alpha', 'Omega', 'Nexus', 'Core'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  return `${prefix}${suffix}`;
}

