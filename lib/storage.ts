// Local storage utilities for persisting data

const WINS_KEY = 'dice_game_wins';
const USER_PREF_KEY = 'dice_game_preferences';

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
};

