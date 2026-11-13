/**
 * Real-Time Pipeline Diagnostics & Error Boundary Service for Walk Assistant v2
 * 
 * Provides:
 * - Stage-by-stage latency telemetry (Capture, Preprocessing, Inference, Safety Engine, Audio Onset)
 * - Frame drops & inferences-per-second accounting
 * - In-memory rolling log buffer (Last 20 events/errors; no images stored)
 * - Automated pipeline self-healing error boundary (max 3 restarts before safe fallback)
 * - Activation via URL parameter (?debug=1) or settings toggle
 */

export interface StageLatencies {
  captureMs: number;
  preprocessMs: number;
  inferenceMs: number;
  engineMs: number;
  audioMs: number;
  totalMs: number;
}

export interface DiagnosticsSnapshot {
  version: string;
  fps: number;
  inferencesPerSecond: number;
  droppedFrames: number;
  latencies: StageLatencies;
  p50TotalMs: number;
  p95TotalMs: number;
  restartCount: number;
  maxRestartsExceeded: boolean;
  recentLogs: LogEntry[];
  flags: Record<string, boolean>;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  stage: string;
  message: string;
}

class DiagnosticsService {
  public readonly version = '2.0.0-walk-v2';
  private debugMode = false;
  private fpsCounter = 0;
  private inferenceCounter = 0;
  private droppedFramesCounter = 0;
  private restartCounter = 0;
  private maxRestarts = 3;
  private lastFpsTimestamp = Date.now();
  private currentFps = 0;
  private currentIps = 0;

  private currentLatencies: StageLatencies = {
    captureMs: 0,
    preprocessMs: 0,
    inferenceMs: 0,
    engineMs: 0,
    audioMs: 0,
    totalMs: 0,
  };

  private latencyHistory: number[] = [];
  private readonly maxLatencyHistory = 100;
  private logs: LogEntry[] = [];
  private readonly maxLogs = 20;
  private subscribers: Set<(snapshot: DiagnosticsSnapshot) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        this.debugMode = urlParams.get('debug') === '1' || localStorage.getItem('drishti_debug_mode') === 'true';
      } catch (e) {
        this.debugMode = false;
      }
    }
  }

  public isDebugMode(): boolean {
    return this.debugMode;
  }

  public setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('drishti_debug_mode', enabled ? 'true' : 'false');
    }
    this.notify();
  }

  public recordFrameCapture(): void {
    this.fpsCounter++;
    this.checkOneSecondTick();
  }

  public recordDroppedFrame(reason: string): void {
    this.droppedFramesCounter++;
    this.log('warn', 'pipeline', `Frame dropped: ${reason}`);
  }

  public recordInferenceCycle(latencies: StageLatencies): void {
    this.inferenceCounter++;
    this.currentLatencies = latencies;
    this.latencyHistory.push(latencies.totalMs);
    if (this.latencyHistory.length > this.maxLatencyHistory) {
      this.latencyHistory.shift();
    }
    this.checkOneSecondTick();
    if (this.debugMode) {
      this.notify();
    }
  }

  private checkOneSecondTick(): void {
    const now = Date.now();
    if (now - this.lastFpsTimestamp >= 1000) {
      const elapsedSec = (now - this.lastFpsTimestamp) / 1000;
      this.currentFps = Math.round(this.fpsCounter / elapsedSec);
      this.currentIps = Math.round(this.inferenceCounter / elapsedSec);
      this.fpsCounter = 0;
      this.inferenceCounter = 0;
      this.lastFpsTimestamp = now;
      this.notify();
    }
  }

  public log(level: 'info' | 'warn' | 'error', stage: string, message: string): void {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      level,
      stage,
      message,
    };
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
    if (level === 'error') {
      console.warn(`[DrishtiDiagnostics][${stage}] ${message}`);
    }
    this.notify();
  }

  public handlePipelineError(error: any, restartCallback: () => void, fallbackCallback: () => void): void {
    this.restartCounter++;
    const errText = error?.message || String(error);
    this.log('error', 'error_boundary', `Pipeline fault detected (attempt ${this.restartCounter}/${this.maxRestarts}): ${errText}`);

    if (this.restartCounter <= this.maxRestarts) {
      this.log('info', 'self_healing', `Restarting vision pipeline...`);
      try {
        restartCallback();
      } catch (restartErr) {
        this.log('error', 'self_healing', `Restart failed: ${restartErr}`);
      }
    } else {
      this.log('error', 'self_healing', `Max restart attempts reached. Triggering safe cane advisory.`);
      fallbackCallback();
    }
    this.notify();
  }

  public resetRestarts(): void {
    this.restartCounter = 0;
  }

  public getPercentiles(): { p50: number; p95: number } {
    if (this.latencyHistory.length === 0) return { p50: 0, p95: 0 };
    const sorted = [...this.latencyHistory].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    return { p50: Math.round(p50), p95: Math.round(p95) };
  }

  public getSnapshot(flagsRecord: Record<string, boolean> = {}): DiagnosticsSnapshot {
    const { p50, p95 } = this.getPercentiles();
    return {
      version: this.version,
      fps: this.currentFps,
      inferencesPerSecond: this.currentIps,
      droppedFrames: this.droppedFramesCounter,
      latencies: { ...this.currentLatencies },
      p50TotalMs: p50,
      p95TotalMs: p95,
      restartCount: this.restartCounter,
      maxRestartsExceeded: this.restartCounter > this.maxRestarts,
      recentLogs: [...this.logs],
      flags: flagsRecord,
    };
  }

  public subscribe(listener: (snapshot: DiagnosticsSnapshot) => void): () => void {
    this.subscribers.add(listener);
    return () => this.subscribers.delete(listener);
  }

  private notify(): void {
    if (this.subscribers.size === 0) return;
    const snap = this.getSnapshot();
    for (const sub of this.subscribers) {
      try {
        sub(snap);
      } catch {}
    }
  }
}

export const diagnostics = new DiagnosticsService();
