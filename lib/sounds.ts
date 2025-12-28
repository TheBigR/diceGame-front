// Sound effects utility
// Note: In a real app, you'd want to load actual audio files
// For now, we'll use Web Audio API to generate simple sounds

import { storage } from './storage';

class SoundManager {
  private audioContext: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const prefs = storage.getPreferences();
        this.soundEnabled = prefs.soundEnabled;
      } catch (e) {
        console.warn('Audio context not available');
      }
    }
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
    if (!this.audioContext || !this.soundEnabled) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (e) {
      // Silently fail if audio can't be played
    }
  }

  playRoll() {
    // Short, pleasant sound for rolling
    this.playTone(440, 0.1, 'sine');
    setTimeout(() => this.playTone(550, 0.1, 'sine'), 50);
  }

  playDoubleSix() {
    // Lower, more dramatic sound for double six
    this.playTone(200, 0.2, 'sawtooth');
    setTimeout(() => this.playTone(150, 0.3, 'sawtooth'), 100);
  }

  playHold() {
    // Confirmation sound
    this.playTone(330, 0.15, 'square');
  }

  playWin() {
    // Victory fanfare
    const notes = [523, 659, 784, 1047]; // C, E, G, C
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'sine'), i * 150);
    });
  }

  setEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    const prefs = storage.getPreferences();
    prefs.soundEnabled = enabled;
    storage.savePreferences(prefs);
  }

  isEnabled(): boolean {
    return this.soundEnabled;
  }
}

export const soundManager = new SoundManager();

