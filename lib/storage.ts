// Local storage utilities for persisting data

const WINS_KEY = 'dice_game_wins';
const USER_PREF_KEY = 'dice_game_preferences';
const AI_CREDENTIALS_KEY = 'dice_game_ai_credentials';
const PLAYER2_TOKEN_KEY = 'dice_game_player2_token';
const PLAYER2_USER_KEY = 'dice_game_player2_user';

export interface WinsRecord {
  [userId: string]: number;
}

export interface UserPreferences {
  soundEnabled: boolean;
  musicEnabled: boolean;
}

export const storage = {
  // Wins tracking
  getWins(): WinsRecord {
    if (typeof window === 'undefined') return {};
    const data = localStorage.getItem(WINS_KEY);
    return data ? JSON.parse(data) : {};
  },

  saveWins(wins: WinsRecord): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(WINS_KEY, JSON.stringify(wins));
  },

  incrementWin(userId: string): void {
    const wins = this.getWins();
    wins[userId] = (wins[userId] || 0) + 1;
    this.saveWins(wins);
  },

  getWinCount(userId: string): number {
    const wins = this.getWins();
    return wins[userId] || 0;
  },

  // User preferences
  getPreferences(): UserPreferences {
    if (typeof window === 'undefined') return { soundEnabled: true, musicEnabled: false };
    const data = localStorage.getItem(USER_PREF_KEY);
    return data ? JSON.parse(data) : { soundEnabled: true, musicEnabled: false };
  },

  savePreferences(prefs: UserPreferences): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USER_PREF_KEY, JSON.stringify(prefs));
  },

  // AI credentials storage
  saveAICredentials(username: string, password: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(AI_CREDENTIALS_KEY, JSON.stringify({ username, password }));
  },

  getAICredentials(): { username: string; password: string } | null {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(AI_CREDENTIALS_KEY);
    return data ? JSON.parse(data) : null;
  },

  clearAICredentials(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(AI_CREDENTIALS_KEY);
  },

  // Player 2 credentials storage (for two human players on same machine)
  savePlayer2Auth(token: string, user: { id: string; username: string }): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(PLAYER2_TOKEN_KEY, token);
    localStorage.setItem(PLAYER2_USER_KEY, JSON.stringify(user));
  },

  getPlayer2Auth(): { token: string; user: { id: string; username: string } } | null {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem(PLAYER2_TOKEN_KEY);
    const userStr = localStorage.getItem(PLAYER2_USER_KEY);
    if (token && userStr) {
      return { token, user: JSON.parse(userStr) };
    }
    return null;
  },

  clearPlayer2Auth(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(PLAYER2_TOKEN_KEY);
    localStorage.removeItem(PLAYER2_USER_KEY);
  },
};

