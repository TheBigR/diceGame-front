export interface User {
  id: string;
  username: string;
}

export interface Player {
  id: string;
  userId: string;
  username: string;
}

export interface DiceRoll {
  die1: number;
  die2: number;
  timestamp: number;
}

export interface GameState {
  id: string;
  player1: Player;
  player2: Player;
  currentPlayerId: string;
  player1Score: number;
  player2Score: number;
  player1RoundScore: number;
  player2RoundScore: number;
  winningScore: number;
  status: 'waiting' | 'active' | 'finished';
  winnerId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface RollDiceResponse {
  dice: DiceRoll;
  roundScore: number;
  isDoubleSix: boolean;
  gameState: GameState;
}

export interface HoldResponse {
  gameState: GameState;
  isGameOver: boolean;
  winnerId?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface CreateGameRequest {
  player1Username: string;
  player2Username: string;
  winningScore?: number;
}

