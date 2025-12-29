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
      console.log(`[API] Token present: ${token.substring(0, 20)}...`);
    } else {
      console.warn(`[API] No token found for ${options.method || 'GET'} ${endpoint}`);
    }

    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`[API] ${options.method || 'GET'} ${url}`, { 
      hasToken: !!token,
      headers: { ...headers, Authorization: token ? `Bearer ${token.substring(0, 20)}...` : 'none' },
      body: options.body 
    });
    
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    console.log(`[API] Response status: ${response.status} for ${options.method || 'GET'} ${url}`);

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        // Read as text first, then try to parse as JSON
        const text = await response.text();
        if (text) {
          try {
            const error = JSON.parse(text);
            errorMessage = error.error || error.message || errorMessage;
          } catch {
            // Not JSON, use the text as error message
            errorMessage = text || errorMessage;
          }
        }
      } catch {
        // If we can't read the response, use the status-based message
      }
      throw new Error(errorMessage);
    }

    // Handle empty responses (e.g., 204 No Content for DELETE requests)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return undefined as T;
    }

    // Try to parse JSON, but handle empty responses gracefully
    const text = await response.text();
    if (!text) {
      return undefined as T;
    }

    return JSON.parse(text);
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

  async getMe(customToken?: string | null): Promise<User> {
    return this.request<User>('/api/auth/me', {}, customToken);
  }

  // Game endpoints
  async createGame(data: CreateGameRequest, player2Token?: string | null): Promise<GameState> {
    // If player2Token is provided, use it for the request (player2 is creating the game)
    // Otherwise, use the default token (player1 is creating the game)
    return this.request<GameState>('/api/games', {
      method: 'POST',
      body: JSON.stringify(data),
    }, player2Token);
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

  async newGame(gameId: string, winningScore?: number, token?: string | null): Promise<GameState> {
    return this.request<GameState>(`/api/games/${gameId}/new-game`, {
      method: 'POST',
      body: JSON.stringify({ winningScore }),
    }, token);
  }

  async deleteGame(gameId: string): Promise<void> {
    return this.request<void>(`/api/games/${gameId}`, {
      method: 'DELETE',
    });
  }

  async endGame(gameId: string): Promise<GameState> {
    return this.request<GameState>(`/api/games/${gameId}/end`, {
      method: 'POST',
    });
  }
}

export const apiClient = new ApiClient();

