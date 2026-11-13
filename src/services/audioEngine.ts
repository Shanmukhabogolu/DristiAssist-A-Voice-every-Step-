import { HazardType, Zone } from '../types';
import { getHazardPriority } from './alertPriorityEngine';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Lazily initialized on first user gesture
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  public unlock(): void {
    this.initContext();
  }

  /**
   * Plays a 3D spatially-panned audio cue and triggers haptic vibration.
   */
  public playHazardCue(hazard: HazardType, zone: Zone, enableSpatial: boolean = true): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const priority = getHazardPriority(hazard);
    if (priority === 0) return; // Silent for clear path

    const now = ctx.currentTime;

    // Spatial panning: Left = -0.8, Center = 0, Right = 0.8
    let panValue = 0;
    if (enableSpatial) {
      if (zone === 'left') panValue = -0.8;
      if (zone === 'right') panValue = 0.8;
    }

    // Audio graph: Oscillator -> Gain -> Panner -> Destination
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    let pannerNode: StereoPannerNode | null = null;
    if (ctx.createStereoPanner) {
      pannerNode = ctx.createStereoPanner();
      pannerNode.pan.setValueAtTime(panValue, now);
      osc.connect(gain);
      gain.connect(pannerNode);
      pannerNode.connect(ctx.destination);
    } else {
      osc.connect(gain);
      gain.connect(ctx.destination);
    }

    // Pitch and duration based on priority:
    // Priority 3 (Danger): High urgent double-beep (880Hz -> 1046Hz)
    // Priority 2 (Caution): Medium alert tone (587Hz)
    // Priority 1 (Info): Gentle low tone (440Hz)
    if (priority >= 3) {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1046, now + 0.08);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

      osc.start(now);
      osc.stop(now + 0.2);

      // Trigger second rapid chirp for danger
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        try {
          const osc2 = this.ctx.createOscillator();
          const gain2 = this.ctx.createGain();
          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(1174, this.ctx.currentTime);
          gain2.gain.setValueAtTime(0.25, this.ctx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
          osc2.connect(gain2);
          if (pannerNode) gain2.connect(pannerNode);
          else gain2.connect(this.ctx.destination);
          osc2.start();
          osc2.stop(this.ctx.currentTime + 0.16);
        } catch {}
      }, 120);

      this.triggerHaptic('danger');
    } else if (priority === 2) {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.16);
      this.triggerHaptic('caution');
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.11);
    }
  }

  /**
   * Haptic vibration patterns on supported mobile devices
   */
  public triggerHaptic(type: 'danger' | 'caution' | 'click'): void {
    if (typeof window === 'undefined' || !navigator.vibrate) return;
    try {
      if (type === 'danger') {
        // Urgent pattern: 150ms vibrate, 70ms pause, 150ms vibrate
        navigator.vibrate([150, 70, 150]);
      } else if (type === 'caution') {
        navigator.vibrate([90]);
      } else {
        navigator.vibrate([35]);
      }
    } catch {}
  }
}

export const audioEngine = new AudioEngine();
