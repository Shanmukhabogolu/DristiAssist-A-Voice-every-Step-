/**
 * Feature Flags for Walk Assistant v2 (Non-Regression Architecture)
 * 
 * Allows granular, additive rollout of v2 capabilities while providing
 * instant fallback to v1 behavior if any flag is toggled off.
 */

export interface FeatureFlags {
  WALK_V2_DETECTOR: boolean;        // Tiered detector + letterbox un-padding + NMS
  WALK_V2_PROXIMITY_AUDIO: boolean; // Continuous distance-scaled Geiger pulses & Audio Sprites
  WALK_V2_ASSISTANT: boolean;       // Hands-free voice commands & wake-word spotter
  WALK_V2_DEPTH: boolean;           // Monocular depth & unknown obstacle fallback
  [key: string]: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  WALK_V2_DETECTOR: true,
  WALK_V2_PROXIMITY_AUDIO: true,
  WALK_V2_ASSISTANT: true,
  WALK_V2_DEPTH: true,
};

const STORAGE_KEY = 'drishti_walk_v2_feature_flags';

class FeatureFlagManager {
  private flags: FeatureFlags;
  private listeners: Set<(flags: FeatureFlags) => void> = new Set();

  constructor() {
    this.flags = { ...DEFAULT_FEATURE_FLAGS };
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.flags = { ...DEFAULT_FEATURE_FLAGS, ...JSON.parse(stored) };
        }
      } catch (e) {
        console.warn('Failed to parse feature flags from localStorage:', e);
      }
    }
  }

  public get<K extends keyof FeatureFlags>(key: K): boolean {
    return this.flags[key];
  }

  public getAll(): FeatureFlags {
    return { ...this.flags };
  }

  public set(key: keyof FeatureFlags, value: boolean): void {
    this.flags[key] = value;
    this.save();
    this.notify();
  }

  public setAll(newFlags: Partial<Record<string, boolean>>): void {
    for (const [k, v] of Object.entries(newFlags)) {
      if (typeof v === 'boolean') {
        this.flags[k] = v;
      }
    }
    this.save();
    this.notify();
  }

  public resetToDefaults(): void {
    this.flags = { ...DEFAULT_FEATURE_FLAGS };
    this.save();
    this.notify();
  }

  public subscribe(listener: (flags: FeatureFlags) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private save(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.flags));
      } catch (e) {
        console.warn('Failed to save feature flags to localStorage:', e);
      }
    }
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.getAll());
      } catch (e) {
        console.error('Feature flag subscriber error:', e);
      }
    }
  }
}

export const featureFlags = new FeatureFlagManager();
