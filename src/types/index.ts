export type HazardType =
  | 'clear_path'
  | 'pothole'
  | 'open_drain'
  | 'stairs'
  | 'pole'
  | 'vehicle'
  | 'person'
  | 'animal';

export type Zone = 'left' | 'center' | 'right';

export type SupportedLanguage = 'en' | 'hi' | 'te';

export interface ZonePrediction {
  zone: Zone;
  hazard: HazardType;
  confidence: number;
}

export interface AlertItem {
  id: string;
  messageEn: string;
  messageHi: string;
  messageTe: string;
  hazard: HazardType;
  zone: Zone;
  priority: number; // 3 = danger, 2 = caution, 1 = info, 0 = safe
  confidence: number;
  timestamp: number;
}

export interface AppSettings {
  language: SupportedLanguage;
  confidenceThreshold: number; // 0.40 to 0.90, default 0.60
  cooldownSeconds: number; // 1 to 10, default 4
  speechRate: number; // 0.8 to 1.5, default 1.05
  speechPitch: number; // 0.8 to 1.2, default 1.0
  speechVolume: number; // 0 to 1.0, default 1.0
  enableSpatialAudio: boolean; // Stereo panner beeps
  enableHaptics: boolean; // Mobile navigator.vibrate
  keepScreenAwake: boolean; // Screen wake lock API
  highContrastTheme: boolean; // High contrast
  batterySaverCameraOff: boolean; // Run audio only with dimmed screen
  alwaysListenVoiceCommands: boolean; // Hands-free speech recognition
  activeCameraDeviceId?: string;
  useSimulationStream?: boolean; // For desktop testing / demo
  simulationPreset?: HazardType;
}

export interface ModelMetrics {
  inferenceTimeMs: number;
  fps: number;
  backendName: string;
  isModelLoaded: boolean;
}
