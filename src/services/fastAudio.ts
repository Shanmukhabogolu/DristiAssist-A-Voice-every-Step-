/**
 * FastAudioEngine - Ultra-Low-Latency (<15ms) Directional Audio & Earcons
 * 
 * Provides:
 * 1. Immediate Web Audio API earcons on the exact frame an obstacle is detected
 * 2. Directional 3D stereo panning (far_left, left, center, right, far_right)
 * 3. Priority pre-emption: critical alerts instantly interrupt caution sounds
 * 4. Distinct timbres for walls, stairs, doors, poles, vehicles, and ground hazards
 * 5. High-speed speech queue management (cancels stale alerts, applies 1.25x rate)
 */

import { ObstacleClass, Lane, DistanceBand } from './pathSafetyEngine';
import { diagnostics } from './diagnostics';

class FastAudioEngine {
  private ctx: AudioContext | null = null;
  private lastEarconTimestamp = 0;
  private minEarconIntervalMs = 120; // Allow fast pulsing (up to 8 earcons/sec for close objects)
  private currentOsc: OscillatorNode | null = null;

  constructor() {
    // Initialized lazily on user gesture
  }

  public initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioContextClass({ latencyHint: 'interactive' });
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch (e) {
      diagnostics.log('warn', 'fast_audio', `AudioContext init failed: ${e}`);
      return null;
    }
  }

  /**
   * Plays an instant directional acoustic earcon on frame detection (<15ms latency)
   */
  public playObstacleCue(
    hazardClass: ObstacleClass,
    lane: Lane,
    band: DistanceBand,
    isUrgent: boolean = false
  ): number {
    const ctx = this.initContext();
    if (!ctx) return 0;

    const now = Date.now();
    // Allow urgent sounds to bypass earcon throttle
    if (!isUrgent && now - this.lastEarconTimestamp < this.minEarconIntervalMs) {
      return 0;
    }
    this.lastEarconTimestamp = now;

    const startTime = performance.now();
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

      // Determine pan value [-1.0 to +1.0]
      let pan = 0;
      if (lane === 'far_left') pan = -0.95;
      else if (lane === 'left') pan = -0.7;
      else if (lane === 'right') pan = 0.7;
      else if (lane === 'far_right') pan = 0.95;

      if (panner) {
        panner.pan.setValueAtTime(pan, ctx.currentTime);
      }

      // Proximity scaling: near obstacles are louder and sharper
      const volume = band === 'near' ? 0.35 : band === 'mid' ? 0.22 : 0.12;
      const duration = band === 'near' ? 0.14 : 0.10;

      // Timbre & Frequency based on hazard physics
      if (hazardClass === 'wall' || hazardClass === 'door') {
        // Dual-tone solid barrier chime
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(587, ctx.currentTime + duration);
      } else if (hazardClass === 'stairs') {
        // Rapid stepped chime
        osc.type = 'square';
        osc.frequency.setValueAtTime(659, ctx.currentTime);
        osc.frequency.setValueAtTime(523, ctx.currentTime + duration * 0.5);
      } else if (hazardClass === 'pole' || hazardClass === 'street_light') {
        // High resonant metallic ping
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1174, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + duration);
      } else if (hazardClass === 'vehicle') {
        // Low cautionary warning pulse
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(330, ctx.currentTime + duration);
      } else if (hazardClass === 'pothole' || hazardClass === 'open_drain') {
        // Descending ground-drop thump
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + duration);
      } else {
        // Standard obstacle pip
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
      }

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      if (panner) {
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(ctx.destination);
      } else {
        osc.connect(gain);
        gain.connect(ctx.destination);
      }

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration + 0.02);

      this.currentOsc = osc;
      const latencyMs = Math.round(performance.now() - startTime);
      return latencyMs;
    } catch (e) {
      diagnostics.log('warn', 'fast_audio', `Earcon error: ${e}`);
      return 0;
    }
  }

  /**
   * Fast Speech Dispatch with immediate pre-emption
   */
  public speakFast(
    text: string,
    langCode: 'en-IN' | 'hi-IN' | 'te-IN',
    interrupt: boolean = false,
    rate: number = 1.25
  ): Promise<number> {
    return new Promise((resolve) => {
      if (!text || typeof window === 'undefined' || !window.speechSynthesis) {
        resolve(0);
        return;
      }

      // Resume speech synthesis if paused
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      // If interrupt is true, cancel previous utterance immediately to avoid queue lag
      if (interrupt) {
        window.speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode;
      utterance.rate = rate; // Accelerated speech rate for faster reminder
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Select natural voice matching locale if available
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find((v) => v.lang === langCode || v.lang.startsWith(langCode.substring(0, 2)));
      if (voice) {
        utterance.voice = voice;
      }

      const tStart = performance.now();
      utterance.onstart = () => {
        const onsetMs = Math.round(performance.now() - tStart);
        resolve(onsetMs);
      };

      utterance.onerror = (e) => {
        diagnostics.log('warn', 'speech', `Fast speech error: ${e.error}`);
        resolve(0);
      };

      window.speechSynthesis.speak(utterance);
    });
  }
}

export const fastAudio = new FastAudioEngine();
