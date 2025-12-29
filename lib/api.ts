import {
  AuthResponse,
  GameState,
  CreateGameRequest,
  RollDiceResponse,
  HoldResponse,
  User,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    customToken?: string | null
  ): Promise<T> {
    const token = customToken || this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async register(username: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async getMe(): Promise<User> {
    return this.request<User>('/api/auth/me');
  }

  // Game endpoints
  async createGame(data: CreateGameRequest): Promise<GameState> {
    return this.request<GameState>('/api/games', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getGame(gameId: string): Promise<GameState> {
    return this.request<GameState>(`/api/games/${gameId}`);
  }

  async getMyGames(): Promise<GameState[]> {
    return this.request<GameState[]>('/api/games/my-games');
  }

  async rollDice(gameId: string, token?: string): Promise<RollDiceResponse> {
    return this.request<RollDiceResponse>(`/api/games/${gameId}/roll`, {
      method: 'POST',
    }, token);
  }

  async hold(gameId: string, token?: string): Promise<HoldResponse> {
    return this.request<HoldResponse>(`/api/games/${gameId}/hold`, {
      method: 'POST',
    }, token);
  }

  async newGame(gameId: string, winningScore?: number): Promise<GameState> {
    return this.request<GameState>(`/api/games/${gameId}/new-game`, {
      method: 'POST',
      body: JSON.stringify({ winningScore }),
    });
  }

  async deleteGame(gameId: string): Promise<void> {
    return this.request<void>(`/api/games/${gameId}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();

