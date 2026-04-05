import { Audio } from 'expo-av';

/**
 * Sound Design System
 *
 * A lightweight sound manager for UI feedback sounds.
 * Preloads sounds into a pool, respects mute, debounces rapid triggers.
 *
 * Sound palette: calm, organic, rewarding, non-fatiguing.
 * Cultural inspiration: singing bowl harmonics, bansuri breathiness, madal warmth.
 */

export type SoundName =
  | 'tap'
  | 'select'
  | 'correct'
  | 'incorrect'
  | 'progress'
  | 'complete'
  | 'streak'
  | 'levelup';

// Placeholder sine-wave tones — replace with production sounds later.
// These will 404 until actual .wav files are created.
const SOUND_FILES: Record<SoundName, any> = {
  tap:        require('@/assets/sounds/tap.wav'),
  select:     require('@/assets/sounds/select.wav'),
  correct:    require('@/assets/sounds/correct.wav'),
  incorrect:  require('@/assets/sounds/incorrect.wav'),
  progress:   require('@/assets/sounds/progress.wav'),
  complete:   require('@/assets/sounds/complete.wav'),
  streak:     require('@/assets/sounds/streak.wav'),
  levelup:    require('@/assets/sounds/levelup.wav'),
};

const VOLUMES: Record<SoundName, number> = {
  tap:        0.3,
  select:     0.4,
  correct:    0.6,
  incorrect:  0.5,
  progress:   0.3,
  complete:   0.8,
  streak:     0.8,
  levelup:    0.9,
};

// Minimum ms between plays of the same sound (debounce)
const DEBOUNCE_MS = 100;

class SoundManager {
  private pool: Map<SoundName, Audio.Sound> = new Map();
  private lastPlayed: Map<SoundName, number> = new Map();
  private _muted = false;
  private _loaded = false;

  get isLoaded() { return this._loaded; }
  get isMuted() { return this._muted; }

  /**
   * Preload all sound files into the pool.
   * Call once on app mount (e.g. in root _layout.tsx).
   */
  async preload(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: false, // respect silent switch
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      for (const [name, file] of Object.entries(SOUND_FILES)) {
        try {
          const { sound } = await Audio.Sound.createAsync(file, {
            shouldPlay: false,
            volume: VOLUMES[name as SoundName],
          });
          this.pool.set(name as SoundName, sound);
        } catch (err) {
          // Sound file missing — skip silently in development
          console.warn(`[SoundManager] Failed to load "${name}":`, err);
        }
      }
      this._loaded = true;
    } catch (err) {
      console.warn('[SoundManager] Audio mode setup failed:', err);
    }
  }

  /**
   * Play a named sound. Debounces rapid triggers.
   */
  async play(name: SoundName): Promise<void> {
    if (this._muted || !this._loaded) return;

    const now = Date.now();
    const last = this.lastPlayed.get(name) || 0;
    if (now - last < DEBOUNCE_MS) return;
    this.lastPlayed.set(name, now);

    const sound = this.pool.get(name);
    if (!sound) return;

    try {
      await sound.setPositionAsync(0);
      await sound.setVolumeAsync(VOLUMES[name]);
      await sound.playAsync();
    } catch {
      // Sound may have been unloaded — ignore
    }
  }

  /** Mute/unmute all sounds */
  setMuted(muted: boolean): void {
    this._muted = muted;
  }

  /** Cleanup: unload all sounds. Call on app teardown. */
  async cleanup(): Promise<void> {
    for (const sound of this.pool.values()) {
      try { await sound.unloadAsync(); } catch {}
    }
    this.pool.clear();
    this._loaded = false;
  }
}

/** Singleton sound manager instance */
export const soundManager = new SoundManager();
