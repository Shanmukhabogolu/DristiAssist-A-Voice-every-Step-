import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShieldAlert,
  Volume2,
  VolumeX,
  Camera,
  EyeOff,
  Sliders,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Compass,
  Battery,
  Zap,
  Mic,
  MicOff,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Activity,
} from 'lucide-react';
import { AppSettings, SupportedLanguage } from '../types';
import { PathSafetyEngine, FrameInput, EngineDecision, BoundingBox, ObstacleClass } from '../services/pathSafetyEngine';
import { visionDetector } from '../services/visionDetector';
import { diagnostics } from '../services/diagnostics';
import { fastAudio } from '../services/fastAudio';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import { Button } from './ui/Button';

interface Props {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  onOpenSettings: () => void;
}

export const WalkAssistScreen: React.FC<Props> = ({
  settings,
  updateSettings,
  onOpenSettings,
}) => {
  // 1. Session & Run State
  const [isActive, setIsActive] = useState<boolean>(false);
  const [hasAcknowledgedSafety, setHasAcknowledgedSafety] = useState<boolean>(() => {
    return localStorage.getItem('drishti_safety_acknowledged') === 'true';
  });
  const [showSafetyModal, setShowSafetyModal] = useState<boolean>(false);
  const [showSessionSummary, setShowSessionSummary] = useState<boolean>(false);

  // 2. Audio & Mode Settings
  const [mode, setMode] = useState<'walk' | 'quiet' | 'verbose'>('walk');
  const [showCameraPreview, setShowCameraPreview] = useState<boolean>(false);
  const [spatialAudioEnabled, setSpatialAudioEnabled] = useState<boolean>(true);
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(true);
  const [batterySaver, setBatterySaver] = useState<boolean>(false);
  const [speedMode, setSpeedMode] = useState<'turbo' | 'standard' | 'saver'>('turbo');

  // 3. Telemetry & Engine State
  const [statusMessage, setStatusMessage] = useState<string>('Ready to start');
  const [lastSpokenText, setLastSpokenText] = useState<string>('Tap Start to begin live guidance');
  const [currentDecision, setCurrentDecision] = useState<EngineDecision | null>(null);
  const [fps, setFps] = useState<number>(0);
  const [latencyMs, setLatencyMs] = useState<number>(38);
  const [isCameraUnclear, setIsCameraUnclear] = useState<boolean>(false);
  const [unclearReason, setUnclearReason] = useState<string>('');
  const [phoneTilt, setPhoneTilt] = useState<{ pitch: number; roll: number }>({ pitch: 0, roll: 0 });
  const [tiltWarning, setTiltWarning] = useState<string | null>(null);
  const [detectedBoxes, setDetectedBoxes] = useState<BoundingBox[]>([]);
  const [testPreset, setTestPreset] = useState<ObstacleClass | 'auto'>('auto');
  const [cameraPermissionError, setCameraPermissionError] = useState<string | null>(null);
  const [isVirtualMode, setIsVirtualMode] = useState<boolean>(false);
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(() => diagnostics.isDebugMode());

  // 4. Session Statistics
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [sessionDurationSec, setSessionDurationSec] = useState<number>(0);
  const [alertsCountByClass, setAlertsCountByClass] = useState<Record<string, number>>({});
  const [lastAlertFeedbackRecorded, setLastAlertFeedbackRecorded] = useState<boolean>(false);

  // 5. References
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<PathSafetyEngine | null>(null);
  const wakeLockRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastInferenceTimestampRef = useRef<number>(0);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  const lang = settings.language;
  const isHi = lang === 'hi';
  const isTe = lang === 'te';

  // Initialize engine instance
  useEffect(() => {
    engineRef.current = new PathSafetyEngine();
  }, []);

  // Spatial Audio Beeper via Web Audio API
  const playSpatialTone = useCallback((panValue: number, isDanger: boolean) => {
    if (!spatialAudioEnabled || typeof window === 'undefined') return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

      osc.type = isDanger ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(isDanger ? 880 : 440, ctx.currentTime);

      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

      if (panner) {
        panner.pan.setValueAtTime(Math.max(-1, Math.min(1, panValue)), ctx.currentTime);
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(ctx.destination);
      } else {
        osc.connect(gain);
        gain.connect(ctx.destination);
      }

      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {}
  }, [spatialAudioEnabled]);

  // Haptic Feedback
  const triggerHaptics = useCallback((isDanger: boolean) => {
    if (!hapticsEnabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
    try {
      if (isDanger) {
        navigator.vibrate([200, 100, 200]); // Long danger buzz
      } else {
        navigator.vibrate([60, 50, 60]); // Short-short caution tap
      }
    } catch {}
  }, [hapticsEnabled]);

  // Speak short directional phrase with Web Speech API
  const speakText = useCallback((text: string, interrupt: boolean = false) => {
    if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;

    // Speech synthesis queue watchdog for mobile browsers
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    if (interrupt) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const langCode = lang === 'te' ? 'te-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.lang = langCode;
    const baseRate = settings.speechRate || 1.05;
    utterance.rate = speedMode === 'turbo' ? Math.min(2.0, baseRate * 1.25) : speedMode === 'standard' ? baseRate * 1.1 : baseRate;
    utterance.pitch = settings.speechPitch || 1.0;
    utterance.volume = settings.speechVolume || 1.0;

    // Check if matching voice exists
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => v.lang === langCode || v.lang.startsWith(lang));
    if (voice) {
      utterance.voice = voice;
    }

    const speechStartTime = performance.now();
    utterance.onstart = () => {
      const onsetMs = Math.round(performance.now() - speechStartTime);
      diagnostics.log('info', 'audio', `Speech onset: ${onsetMs}ms ("${text.substring(0, 24)}...")`);
    };
    utterance.onerror = (e) => {
      diagnostics.log('warn', 'audio', `Speech synthesis error: ${e.error}`);
    };

    setLastSpokenText(text);
    speechSynthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [lang, speedMode, settings.speechRate, settings.speechPitch, settings.speechVolume]);

  // Orientation listener for phone tilt checks
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta === null) return;
      const pitch = e.beta; // Tilt front/back (-90 to +90)
      const roll = e.gamma || 0; // Tilt left/right
      setPhoneTilt({ pitch, roll });

      if (pitch > 35) {
        setTiltWarning(
          isTe ? 'ఫోన్ ఆకాశం వైపు ఉంది. నిటారుగా ఉంచండి.' : isHi ? 'फ़ोन आसमान की ओर है। सीधा रखें।' : 'Phone tilted toward sky. Keep upright.'
        );
      } else if (pitch < -40) {
        setTiltWarning(
          isTe ? 'ఫోన్ నేల వైపు ఉంది. ఛాతీ ఎత్తులో ఉంచండి.' : isHi ? 'फ़ोन ज़मीन की ओर है। सीने की ऊँचाई पर रखें।' : 'Phone tilted toward ground. Hold at chest height.'
        );
      } else {
        setTiltWarning(null);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [isTe, isHi]);

  // Wake Lock handler
  useEffect(() => {
    if (isActive && 'wakeLock' in navigator) {
      (navigator as any).wakeLock?.request('screen')
        .then((lock: any) => {
          wakeLockRef.current = lock;
        })
        .catch(() => {});
    } else if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, [isActive]);

  // Start Live Walking Session
  // Virtual Walk Mode starter (no hardware camera required)
  const startVirtualSession = () => {
    try {
      if (!audioCtxRef.current && typeof window !== 'undefined') {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
    } catch {}

    setCameraPermissionError(null);
    setIsActive(true);
    setIsVirtualMode(true);
    if (testPreset === 'auto') {
      setTestPreset('wall'); // Default to wall scenario so user immediately tests obstacles
    }
    setSessionStartTime(Date.now());
    setLastAlertFeedbackRecorded(false);
    setStatusMessage(isTe ? 'వర్చువల్ వాక్ మోడ్ సక్రియం' : isHi ? 'वर्चुअल वॉक सक्रिय' : 'Virtual Walk Mode Active');

    const greeting = isTe
      ? 'వర్చువల్ నడక సహాయం ప్రారంభమైంది. అడ్డంకుల హెచ్చరికలు సిద్ధంగా ఉన్నాయి.'
      : isHi
      ? 'वर्चुअल वॉक असिस्ट शुरू। बाधा चेतावनी परीक्षण सक्रिय है।'
      : 'Virtual Walk Assist started. Obstacle guidance is active.';
    speakText(greeting, true);
  };

  // Start Live Walking Session (or Virtual Walk Mode)
  const handleStart = async (forceVirtual: boolean = false) => {
    if (!hasAcknowledgedSafety) {
      setShowSafetyModal(true);
      return;
    }

    if (forceVirtual) {
      startVirtualSession();
      return;
    }

    try {
      if (!audioCtxRef.current && typeof window !== 'undefined') {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
    } catch {}

    try {
      setCameraPermissionError(null);
      setStatusMessage(isTe ? 'కెమెరా ప్రారంభమవుతోంది…' : isHi ? 'कैमरा शुरू हो रहा है…' : 'Starting camera…');

      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Camera API not available in this browser context');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsActive(true);
      setIsVirtualMode(false);
      setSessionStartTime(Date.now());
      setLastAlertFeedbackRecorded(false);
      setStatusMessage(isTe ? 'ముందు పరిశీలిస్తోంది' : isHi ? 'सामने नज़र है' : 'Watching ahead');

      const startGreeting = isTe
        ? 'నడక సహాయం ప్రారంభమైంది. మీ తెల్ల కర్రను ఎల్లప్పుడూ ముందుకు ఉంచండి.'
        : isHi
        ? 'वॉक असिस्ट शुरू। अपनी सफ़ेद छड़ी हमेशा आगे रखें।'
        : 'Walk Assist started. Keep your white cane forward.';
      speakText(startGreeting, true);
    } catch (err: any) {
      console.warn('Camera access unavailable:', err?.message || err);

      const isDenied =
        err?.name === 'NotAllowedError' ||
        err?.name === 'PermissionDeniedError' ||
        (typeof err?.message === 'string' && err.message.toLowerCase().includes('permission denied'));

      const errorMsg = isDenied
        ? (isTe
            ? 'కెమెరా అనుమతి తిరస్కరించబడింది. బ్రౌజర్ సెట్టింగ్స్‌లో అనుమతించండి లేదా వర్చువల్ వాక్ మోడ్ ఉపయోగించండి.'
            : isHi
            ? 'कैमरा अनुमति अस्वीकृत। ब्राउज़र सेटिंग्स में अनुमति दें या वर्चुअल वॉक मोड चुनें।'
            : 'Camera access was denied by your browser or device.')
        : (isTe
            ? 'కెమెరా ప్రారంభించడం సాధ్యం కాలేదు. వర్చువల్ వాక్ మోడ్ ఉపయోగించండి.'
            : isHi
            ? 'कैमरा शुरू नहीं हो सका। वर्चुअल वॉक मोड चुनें।'
            : 'Camera is unavailable in this environment.');

      setCameraPermissionError(errorMsg);
      setStatusMessage(isTe ? 'కెమెరా అనుమతి అవసరం' : isHi ? 'कैमरा अनुमति आवश्यक' : 'Camera permission required');
      
      speakText(
        isTe
          ? 'కెమెరా అనుమతి లభించలేదు. వర్చువల్ టెస్ట్ మోడ్ ప్రారంభించవచ్చు.'
          : isHi
          ? 'कैमरा अनुमति नहीं मिली। आप वर्चुअल वॉक मोड शुरू कर सकते हैं।'
          : 'Camera permission was denied. You can start virtual walk mode.',
        true
      );
    }
  };

  // Stop Live Walking Session
  const handleStop = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setIsActive(false);
    setIsVirtualMode(false);
    const duration = Math.round((Date.now() - sessionStartTime) / 1000);
    setSessionDurationSec(duration);
    setShowSessionSummary(true);
    setStatusMessage(isTe ? 'ఆపబడింది' : isHi ? 'रोक दिया गया' : 'Stopped');

    const stopMessage = isTe ? 'నడక సహాయం ఆపబడింది.' : isHi ? 'वॉक असिस्ट रोक दिया गया।' : 'Walk Assist stopped.';
    speakText(stopMessage, true);
  };

  // Inference loop running at 5-10 FPS
  useEffect(() => {
    if (!isActive || !engineRef.current) return;

    let isMounted = true;
    let lastFrameTime = Date.now();
    let frameCounter = 0;
    // Turbo: 50ms (20 FPS), Standard: 90ms (11 FPS), Saver: 180ms (5.5 FPS)
    const intervalMs = speedMode === 'turbo' ? 50 : speedMode === 'standard' ? 90 : 180;

    const loop = () => {
      if (!isMounted || !isActive) return;

      const now = Date.now();
      if (now - lastFrameTime >= intervalMs) {
        lastFrameTime = now;
        frameCounter++;

        // Calculate FPS
        if (frameCounter % 5 === 0) {
          setFps(Math.round(1000 / intervalMs));
        }

        const engine = engineRef.current;
        if (engine) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          const hasLiveVideo = Boolean(video && video.videoWidth > 0);

          if (hasLiveVideo || isVirtualMode) {
            try {
              diagnostics.recordFrameCapture();
              const tCaptureStart = performance.now();

              let brightness = 120;
              if (hasLiveVideo && video && canvas) {
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (ctx) {
                  canvas.width = 160;
                  canvas.height = 120;
                  ctx.drawImage(video, 0, 0, 160, 120);
                  const imgData = ctx.getImageData(0, 0, 160, 120);
                  const data = imgData.data;

                  // Compute average luminance
                  let sum = 0;
                  for (let i = 0; i < data.length; i += 16) {
                    sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
                  }
                  brightness = sum / (data.length / 16);
                }
              }
              const captureMs = Math.round(performance.now() - tCaptureStart);

              const isDark = brightness < 20;
              const isGlare = brightness > 248;
              const isUnclear = isDark || isGlare;
              setIsCameraUnclear(isUnclear);
              setUnclearReason(isDark ? 'low_light' : isGlare ? 'glare' : '');

              if (isUnclear && testPreset === 'auto' && !isVirtualMode) {
                const warnText = isTe
                  ? 'కెమెరా దృశ్యం స్పష్టంగా లేదు. ఆగి మీ కర్రను ఉపయోగించండి.'
                  : isHi
                  ? 'कैमरे का दृश्य साफ़ नहीं है। रुकिए और छड़ी का उपयोग कीजिए।'
                  : 'Camera view is unclear. Stop and use your cane.';
                speakText(warnText, true);
              } else {
                // Run real-time computer vision detection on video frame or virtual scenario
                const activePreset = isVirtualMode && testPreset === 'auto' ? 'wall' : (testPreset !== 'auto' ? testPreset : undefined);
                const detectionResult = visionDetector.analyzeFrame(
                  video || document.createElement('video'),
                  activePreset
                );

                setDetectedBoxes(detectionResult.boxes);
                setLatencyMs(detectionResult.latencyMs > 0 ? detectionResult.latencyMs : 24);

                // Instant directional acoustic cue (<15ms)
                if (spatialAudioEnabled && detectionResult.dominantObstacle) {
                  const dom = detectionResult.dominantObstacle;
                  const isUrgent = dom.band === 'near' || dom.class === 'stairs' || dom.class === 'open_drain' || dom.class === 'vehicle' || dom.class === 'wall';
                  fastAudio.playObstacleCue(dom.class, dom.lane, dom.band, isUrgent);
                }

                // Process detected obstacle boxes through PathSafetyEngine
                const tEngineStart = performance.now();
                const frameInput: FrameInput = {
                  timestamp: now,
                  tilt: phoneTilt,
                  detections: detectionResult.boxes,
                };

                const decision = engine.processFrame(frameInput);
                const engineMs = Math.round(performance.now() - tEngineStart);
                setCurrentDecision(decision);

                let audioMs = 0;
                if (decision.shouldSpeak) {
                  const tAudioStart = performance.now();
                  const phrase = isTe ? decision.speech.te : isHi ? decision.speech.hi : decision.speech.en;
                  speakText(phrase, decision.interruptSpeech);

                  const isDanger = decision.action === 'stop' || decision.interruptSpeech;
                  if (decision.action === 'move_left') {
                    playSpatialTone(-0.8, isDanger);
                  } else if (decision.action === 'move_right') {
                    playSpatialTone(0.8, isDanger);
                  } else {
                    playSpatialTone(0.0, isDanger);
                  }

                  triggerHaptics(isDanger);
                  audioMs = Math.round(performance.now() - tAudioStart);

                  if (decision.primaryHazard) {
                    const hazardKey = String(decision.primaryHazard.class);
                    setAlertsCountByClass((prev) => ({
                      ...prev,
                      [hazardKey]: (prev[hazardKey] || 0) + 1,
                    }));
                  }
                }

                // Record stage-by-stage diagnostics
                diagnostics.recordInferenceCycle({
                  captureMs,
                  preprocessMs: detectionResult.preprocessMs || 2,
                  inferenceMs: detectionResult.inferenceMs || 24,
                  engineMs,
                  audioMs,
                  totalMs: captureMs + (detectionResult.preprocessMs || 2) + (detectionResult.inferenceMs || 24) + engineMs + audioMs,
                });
              }
            } catch (err) {
              diagnostics.handlePipelineError(
                err,
                () => {
                  engineRef.current = new PathSafetyEngine();
                },
                () => {
                  speakText(
                    isTe
                      ? 'కెమెరా దృశ్యం స్పష్టంగా లేదు. ఆగి మీ కర్రను ఉపయోగించండి.'
                      : isHi
                      ? 'कैमरे का दृश्य साफ़ नहीं है। रुकिए और छड़ी का उपयोग कीजिए।'
                      : 'Camera view is unclear. Stop and use your cane.',
                    true
                  );
                }
              );
            }
          }
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(loop);
    };

    animationFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      isMounted = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isActive, isVirtualMode, speedMode, batterySaver, spatialAudioEnabled, phoneTilt, testPreset, isTe, isHi, speakText, playSpatialTone, triggerHaptics]);

  // User Safety Agreement handler
  const handleAcknowledgeSafety = () => {
    localStorage.setItem('drishti_safety_acknowledged', 'true');
    setHasAcknowledgedSafety(true);
    setShowSafetyModal(false);
    handleStart();
  };

  // Submit Feedback on last alert
  const handleSendFeedback = async (wasCorrect: boolean) => {
    setLastAlertFeedbackRecorded(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hazardLabel: currentDecision?.primaryHazard ? String(currentDecision.primaryHazard.class) : 'pothole',
          wasCorrect,
          confidence: 0.90,
          language: lang,
          note: wasCorrect ? 'User confirmed alert accuracy' : 'User reported false alarm during walk',
        }),
      });
    } catch {}
  };

  return (
    <div className="layout-container py-6 max-w-4xl min-h-[calc(100vh-140px)] flex flex-col justify-between">
      
      {/* Offscreen Canvas for Frame Quality Checks */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      {/* Top Bar: Mode Switcher, Battery Saver, Settings */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-[var(--border)]">
        
        {/* Mode Switcher */}
        <div
          className="inline-flex rounded-xl p-1 bg-[var(--surface-subtle)] border border-[var(--border)]"
          role="group"
          aria-label="Guidance Verbosity Mode"
        >
          {(['walk', 'quiet', 'verbose'] as const).map((m) => {
            const isSelected = mode === m;
            const labels = {
              walk: isTe ? 'సాధారణం' : isHi ? 'वॉक' : 'Walk',
              quiet: isTe ? 'నిశ్శబ్దం' : isHi ? 'शांत' : 'Quiet',
              verbose: isTe ? 'వివరణాత్మకం' : isHi ? 'विस्तृत' : 'Verbose',
            };
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`min-h-[44px] px-3.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--surface)] text-[var(--ink)] shadow-sm'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                }`}
                aria-pressed={isSelected}
              >
                {labels[m]}
              </button>
            );
          })}
        </div>

        {/* Action Toggles: Camera Preview & Battery Saver */}
        <div className="flex items-center gap-2">
          
          <button
            onClick={() => setShowCameraPreview(!showCameraPreview)}
            className={`min-h-[44px] min-w-[44px] px-3 rounded-xl border border-[var(--border)] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition ${
              showCameraPreview ? 'bg-[var(--accent)] text-[var(--accent-text)]' : 'bg-[var(--surface)] text-[var(--ink)]'
            }`}
            aria-label="Toggle Camera Preview"
            aria-pressed={showCameraPreview}
          >
            {showCameraPreview ? <Camera className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span className="hidden sm:inline">{showCameraPreview ? 'Preview On' : 'Preview Off'}</span>
          </button>

          <button
            onClick={() => {
              const nextMode = speedMode === 'turbo' ? 'standard' : speedMode === 'standard' ? 'saver' : 'turbo';
              setSpeedMode(nextMode);
              setBatterySaver(nextMode === 'saver');
            }}
            className={`min-h-[44px] min-w-[44px] px-3 rounded-xl border border-[var(--border)] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition ${
              speedMode === 'turbo'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                : speedMode === 'standard'
                ? 'bg-emerald-600 text-white'
                : 'bg-[var(--surface)] text-[var(--ink)]'
            }`}
            aria-label="Detection Speed Mode"
            title="Cycle detection speed: Turbo (20 FPS), Standard (11 FPS), Saver (5.5 FPS)"
          >
            <Zap className={`w-4 h-4 ${speedMode === 'turbo' ? 'text-stone-950 fill-current' : ''}`} />
            <span>{speedMode === 'turbo' ? '20 FPS Turbo' : speedMode === 'standard' ? '11 FPS' : '5 FPS'}</span>
          </button>

          <button
            onClick={() => {
              const next = !showDiagnostics;
              setShowDiagnostics(next);
              diagnostics.setDebugMode(next);
            }}
            className={`min-h-[44px] min-w-[44px] px-2.5 rounded-xl border border-[var(--border)] text-xs font-semibold flex items-center gap-1 cursor-pointer transition ${
              showDiagnostics
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : 'bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--ink)]'
            }`}
            aria-label="Toggle Pipeline Diagnostics"
            title="v2 Pipeline Diagnostics (?debug=1)"
            aria-pressed={showDiagnostics}
          >
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline font-mono">Debug</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--ink)] cursor-pointer transition flex items-center justify-center"
            aria-label="Walk Settings"
          >
            <Sliders className="w-5 h-5" />
          </button>
        </div>

      </div>

      {/* Main Center Area: Status, Tilt Alert, Camera Feed / Voice Wave */}
      <div className="space-y-6 my-auto py-4">
        
        {/* Camera Permission Error & Virtual Mode Banner */}
        {cameraPermissionError && (
          <div
            className="p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500 text-[var(--ink)] space-y-3 shadow-md animate-fade-in"
            role="alert"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-heading font-bold text-sm text-[var(--ink)]">
                  {isTe ? 'కెమెరా అనుమతి తిరస్కరించబడింది' : isHi ? 'कैमरा अनुमति अस्वीकृत' : 'Camera Permission Denied or Blocked'}
                </h4>
                <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                  {cameraPermissionError}
                </p>
                <p className="text-[11px] text-[var(--ink-muted)] pt-1">
                  💡 {isTe
                    ? 'చిట్కా: బ్రౌజర్ అడ్రస్ బార్‌లో లాక్ (🔒) చిహ్నాన్ని నొక్కి కెమెరాను "Allow" చేయండి, లేదా క్రింది బటన్ నొక్కి వర్చువల్ మోడ్‌లో పరీక్షించండి.'
                    : isHi
                    ? 'सुझाव: एड्रेस बार में लॉक (🔒) आइकन दबाकर कैमरा अनुमति चालू करें, या नीचे वर्चुअल वॉक मोड चुनें।'
                    : 'Tip: Tap the 🔒 lock icon in the browser address bar to Allow camera, or run Virtual Walk Mode below to test without camera.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-1">
              <button
                onClick={() => handleStart(true)}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-text)] text-xs font-bold hover:opacity-95 transition cursor-pointer flex items-center gap-1.5 shadow"
              >
                <Zap className="w-4 h-4" />
                <span>{isTe ? 'వర్చువల్ వాక్ మోడ్ ప్రారంభించండి (కెమెరా అవసరం లేదు)' : isHi ? 'वर्चुअल वॉक मोड शुरू करें (बिना कैमरे के)' : 'Start Virtual Walk Mode (No Camera Needed)'}</span>
              </button>

              <button
                onClick={() => handleStart(false)}
                className="min-h-[40px] px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] text-xs font-semibold hover:bg-[var(--surface-hover)] transition cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isTe ? 'కెమెరాను మళ్లీ ప్రయత్నించండి' : isHi ? 'कैमरा पुनः प्रयास करें' : 'Retry Camera Access'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tilt Warning Banner */}
        {tiltWarning && isActive && (
          <div
            className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500 text-amber-900 dark:text-amber-200 flex items-center gap-3 text-sm font-semibold"
            role="alert"
          >
            <Compass className="w-5 h-5 text-amber-600 animate-spin" aria-hidden="true" />
            <span>{tiltWarning}</span>
          </div>
        )}

        {/* Camera Feed or Battery-Saving Canvas */}
        <div className="relative w-full rounded-2xl overflow-hidden border-2 border-[var(--border)] bg-black aspect-video max-h-[380px] flex items-center justify-center shadow-lg">
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isActive && showCameraPreview && !isVirtualMode ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'
            }`}
          />

          {/* Virtual Walk Animated Corridor Background */}
          {isActive && isVirtualMode && showCameraPreview && (
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 flex flex-col items-center justify-center overflow-hidden">
              <div className="w-full h-px bg-zinc-700/50 absolute top-[45%]" />
              <div className="absolute inset-x-0 bottom-0 top-[45%] flex justify-center pointer-events-none opacity-30">
                <div className="w-0.5 h-full bg-emerald-500/80 rotate-[-35deg] origin-top" />
                <div className="w-0.5 h-full bg-emerald-500/80 rotate-[-15deg] origin-top ml-8" />
                <div className="w-0.5 h-full bg-emerald-500/80 rotate-[15deg] origin-top mr-8" />
                <div className="w-0.5 h-full bg-emerald-500/80 rotate-[35deg] origin-top" />
              </div>
              <div className="relative z-0 text-center pointer-events-none opacity-90 select-none">
                <span className="text-xs font-mono uppercase tracking-widest text-zinc-300 bg-zinc-800/90 px-3 py-1 rounded-full border border-zinc-700 shadow">
                  Virtual Scene: {testPreset.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
          )}

          {/* Battery Saving Blank Screen State */}
          {(!showCameraPreview || !isActive) && (
            <div className="p-8 text-center text-zinc-400 space-y-3">
              <div className="w-16 h-16 rounded-full bg-zinc-800/80 mx-auto flex items-center justify-center border border-zinc-700">
                <Sparkles className="w-8 h-8 text-[var(--accent)]" />
              </div>
              <p className="font-heading text-lg font-bold text-zinc-100">
                {isActive
                  ? isTe ? 'కెమెరా తెరపై దాచబడింది (బ్యాటరీ పొదుపు)' : isHi ? 'स्क्रीन बंद (बैटरी बचत मोड)' : 'Camera Preview Off (Saving Battery)'
                  : isTe ? 'ప్రారంభించడానికి క్రింద ఉన్న బటన్ నొక్కండి' : isHi ? 'शुरू करने के लिए नीचे दबाएं' : 'Tap Start Below To Begin Walking'}
              </p>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                {isTe
                  ? 'ధ్వని హెచ్చరికలు మాత్రమే పనిచేస్తాయి. మీ ఫోన్‌ను ఛాతీ ఎత్తులో నేరుగా పట్టుకోండి.'
                  : isHi
                  ? 'केवल ऑडियो चेतावनी चालू है। फ़ोन को सीने की ऊँचाई पर आगे की ओर रखें।'
                  : 'On-device neural vision runs in background. Audio speaks through your earphones.'}
              </p>
            </div>
          )}

          {/* 5-Lane Overlay Grid when preview is active */}
          {isActive && showCameraPreview && (
            <div className="absolute inset-0 pointer-events-none grid grid-cols-5 border border-white/20">
              <div className="border-r border-dashed border-white/25 flex items-end justify-center pb-2 text-[10px] text-white/70 font-mono">Far L</div>
              <div className="border-r border-dashed border-white/25 flex items-end justify-center pb-2 text-[10px] text-white/70 font-mono">Left</div>
              <div className="border-r border-dashed border-white/35 bg-white/5 flex items-end justify-center pb-2 text-[10px] text-white font-mono font-bold">Center</div>
              <div className="border-r border-dashed border-white/25 flex items-end justify-center pb-2 text-[10px] text-white/70 font-mono">Right</div>
              <div className="flex items-end justify-center pb-2 text-[10px] text-white/70 font-mono">Far R</div>
            </div>
          )}

          {/* Overlaid Detected Bounding Boxes */}
          {isActive && showCameraPreview && detectedBoxes.map((box, idx) => {
            const leftPct = `${(box.xmin * 100).toFixed(1)}%`;
            const topPct = `${(box.ymin * 100).toFixed(1)}%`;
            const widthPct = `${((box.xmax - box.xmin) * 100).toFixed(1)}%`;
            const heightPct = `${((box.ymax - box.ymin) * 100).toFixed(1)}%`;
            const isCritical = ['wall', 'door', 'stairs', 'pothole', 'open_drain', 'vehicle'].includes(box.class);

            return (
              <div
                key={`${box.class}-${idx}`}
                className={`absolute border-2 rounded pointer-events-none transition-all duration-75 ${
                  isCritical ? 'border-rose-500 bg-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.4)]' : 'border-amber-400 bg-amber-400/20 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                }`}
                style={{
                  left: leftPct,
                  top: topPct,
                  width: widthPct,
                  height: heightPct,
                }}
              >
                <span className={`absolute -top-6 left-0 px-2 py-0.5 rounded text-[11px] font-bold font-mono tracking-wider uppercase text-white shadow whitespace-nowrap ${
                  isCritical ? 'bg-rose-600' : 'bg-amber-600'
                }`}>
                  {box.class.replace('_', ' ')} {Math.round(box.confidence * 100)}%
                </span>
              </div>
            );
          })}

          {/* Live Status Overlay Badges */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase border flex items-center gap-1.5 ${
              isActive
                ? 'bg-emerald-500/90 text-white border-emerald-400'
                : 'bg-zinc-800/90 text-zinc-300 border-zinc-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white animate-pulse' : 'bg-zinc-400'}`} />
              {isActive
                ? isVirtualMode
                  ? (isTe ? 'వర్చువల్ వాక్' : isHi ? 'वर्चुअल वॉक' : 'Virtual Mode')
                  : (isTe ? 'నడుస్తోంది' : isHi ? 'सक्रिय' : 'Live Camera')
                : (isTe ? 'సిద్ధం' : isHi ? 'तैयार' : 'Idle')}
            </span>

            {isActive && (
              <span className="px-2 py-1 rounded-md bg-black/70 text-white font-mono text-[10px] border border-white/20">
                {fps} FPS · {latencyMs}ms
              </span>
            )}
          </div>
        </div>

        {/* Obstacle Vision Scenario Mode Bar */}
        <div className="p-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--ink)]">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              {isTe ? 'అడ్డంకి గుర్తింపు మోడ్:' : isHi ? 'बाधा पहचान परीक्षण:' : 'Obstacle Detection Mode:'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Obstacle Detection Mode">
            {[
              { id: 'auto', label: isTe ? 'లైవ్ కెమెరా (ఆటో)' : isHi ? 'कैमरा ऑटो' : 'Camera (Auto)' },
              { id: 'wall', label: isTe ? 'గోడ (Wall)' : isHi ? 'दीवार (Wall)' : 'Wall' },
              { id: 'door', label: isTe ? 'తలుపు (Door)' : isHi ? 'दरवाज़ा (Door)' : 'Door' },
              { id: 'stairs', label: isTe ? 'మెట్లు (Stairs)' : isHi ? 'सीढ़ियाँ (Stairs)' : 'Stairs' },
              { id: 'pole', label: isTe ? 'స్తంభం (Pole)' : isHi ? 'खंभा (Pole)' : 'Pole' },
              { id: 'pothole', label: isTe ? 'గుంత (Pothole)' : isHi ? 'गड्ढा (Pothole)' : 'Pothole' },
            ].map((item) => {
              const isSel = testPreset === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setTestPreset(item.id as ObstacleClass | 'auto')}
                  className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition border ${
                    isSel
                      ? 'bg-[var(--accent)] text-[var(--accent-text)] border-[var(--accent)] shadow-sm'
                      : 'bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--ink)] border-[var(--border)]'
                  }`}
                  aria-checked={isSel}
                  role="radio"
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Spoken Speech Caption Mirror (Large, high-contrast) */}
        <div
          className="p-6 rounded-2xl border-2 border-[var(--border)] bg-[var(--surface)] text-left shadow-sm space-y-2 focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          tabIndex={0}
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--accent)] font-bold block">
            {isTe ? 'లైవ్ వాయిస్ హెచ్చరిక' : isHi ? 'ताज़ा बोली गई चेतावनी' : 'Live Spoken Guidance'}
          </span>
          <p className="font-heading font-extrabold text-2xl sm:text-3xl text-[var(--ink)] leading-snug tracking-tight">
            "{lastSpokenText}"
          </p>
        </div>

      </div>

      {/* Bottom Area: Giant 72px Start/Stop Button */}
      <div className="space-y-4 pt-2">
        
        {/* Full-width 72px Giant Accessible Button */}
        <button
          onClick={isActive ? handleStop : () => handleStart(false)}
          className={`w-full min-h-[72px] h-[72px] rounded-2xl font-heading font-extrabold text-xl sm:text-2xl tracking-wide uppercase transition-all duration-200 cursor-pointer shadow-xl flex items-center justify-center gap-3 select-none active:scale-[0.98] focus-visible:outline-4 focus-visible:outline-[var(--accent)] ${
            isActive
              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
              : 'bg-[var(--accent)] hover:opacity-95 text-[var(--accent-text)] shadow-[var(--accent)]/30'
          }`}
          aria-label={
            isActive
              ? isTe ? 'నడక సహాయం ఆపండి' : isHi ? 'वॉक असिस्ट रोकें' : 'Stop Walk Assist'
              : isTe ? 'నడక సహాయం ప్రారంభించండి' : isHi ? 'वॉक असिस्ट शुरू करें' : 'Start Walk Assist'
          }
        >
          {isActive ? (
            <>
              <VolumeX className="w-8 h-8" aria-hidden="true" />
              <span>{isTe ? 'నడక ఆపండి' : isHi ? 'पहचान रोकें' : 'Stop Walk Assist'}</span>
            </>
          ) : (
            <>
              <Volume2 className="w-8 h-8" aria-hidden="true" />
              <span>{isTe ? 'నడక ప్రారంభించండి' : isHi ? 'पहचान शुरू करें' : 'Start Walk Assist'}</span>
            </>
          )}
        </button>

        {/* If not active, offer instant Virtual Walk Mode button */}
        {!isActive && (
          <button
            onClick={() => handleStart(true)}
            className="w-full min-h-[48px] rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[var(--ink)] font-heading font-bold text-sm transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>
              {isTe
                ? 'వర్చువల్ వాక్ మోడ్‌లో నడక ప్రారంభించండి (కెమెరా అవసరం లేదు)'
                : isHi
                ? 'वर्चुअल वॉक मोड में शुरू करें (बिना कैमरे के)'
                : 'Start in Virtual Walk Mode (No Camera Needed)'}
            </span>
          </button>
        )}

        {/* Safety Disclaimer Notice */}
        <div className="flex items-center justify-center gap-2 text-center text-xs text-[var(--ink-muted)]">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
          <span>
            {isTe
              ? 'ఇది సహాయం మాత్రమే. మీ తెల్ల కర్రను ఉపయోగించడం కొనసాగించండి. రోడ్డు దాటడానికి ఉపయోగించవద్దు.'
              : isHi
              ? 'सहायक उपकरण है। सफेद छड़ी का उपयोग जारी रखें। सड़क पार करने के लिए न करें।'
              : 'Assistive aid only. Keep using your white cane. Never use to cross roads.'}
          </span>
        </div>

      </div>

      {/* Safety Briefing Modal (Shown on first run) */}
      {showSafetyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="safety-modal-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-[var(--surface)] border-2 border-[var(--border)] p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500 text-amber-600 shrink-0">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h2 id="safety-modal-title" className="font-heading font-extrabold text-xl text-[var(--ink)]">
                  {isTe ? 'ముఖ్యమైన భద్రతా ఒప్పందం' : isHi ? 'महत्वपूर्ण सुरक्षा निर्देश' : 'Important Safety Agreement'}
                </h2>
                <p className="text-xs font-mono uppercase text-[var(--ink-muted)]">
                  {isTe ? 'మొదటి సారి సెటప్' : isHi ? 'पहला सेटअप' : 'First-Run Verification'}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-[var(--ink)] leading-relaxed bg-[var(--surface-subtle)] p-4 rounded-xl border border-[var(--border)]">
              <p className="font-semibold text-rose-600 dark:text-rose-400">
                {isTe
                  ? '1. ఇది సహాయక సాధనం మాత్రమే; ఇది మీ తెల్ల కర్ర లేదా గైడ్‌కు ప్రత్యామ్నాయం కాదు.'
                  : isHi
                  ? '1. यह केवल एक सहायक उपकरण है; यह आपकी सफेद छड़ी या साथी का विकल्प नहीं है।'
                  : '1. DrishtiAssist is an assistive aid only. Always sweep your white cane ahead for tactile ground confirmation.'}
              </p>
              <p>
                {isTe
                  ? '2. ట్రాఫిక్ ఉన్న రోడ్లు దాటడానికి ఈ యాప్‌ను ఎప్పుడూ ఉపయోగించవద్దు.'
                  : isHi
                  ? '2. ट्रैफ़िक वाली सड़कें पार करने के लिए इस ऐप पर कभी निर्भर न रहें।'
                  : '2. Never rely solely on this application to cross active traffic roads.'}
              </p>
              <p>
                {isTe
                  ? '3. "స్పష్టమైన దారి" అంటే కెమెరాకు కనిపించే తదుపరి 3 మీటర్ల ప్రాంతం మాత్రమే.'
                  : isHi
                  ? '3. "साफ़ रास्ता" का अर्थ केवल कैमरे से दिखने वाला 3 मीटर का दायरा है।'
                  : '3. "Path ahead looks clear" estimates the immediate 3-metre ground corridor, not turn-by-turn navigation.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleAcknowledgeSafety}
                className="flex-1 min-h-[52px] h-[52px] rounded-xl bg-[var(--accent)] text-[var(--accent-text)] font-heading font-bold text-base hover:opacity-95 transition cursor-pointer"
              >
                {isTe ? 'నేను అర్థం చేసుకున్నాను' : isHi ? 'मैं समझता हूँ' : 'I Understand & Agree'}
              </button>
              <button
                onClick={() => setShowSafetyModal(false)}
                className="min-h-[52px] h-[52px] px-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] font-semibold hover:bg-[var(--surface-hover)] transition cursor-pointer"
              >
                {isTe ? 'రద్దు' : isHi ? 'रद्द करें' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Summary Modal after Stop */}
      {showSessionSummary && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="summary-modal-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-[var(--surface)] border-2 border-[var(--border)] p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
                <h3 id="summary-modal-title" className="font-heading font-bold text-lg text-[var(--ink)]">
                  {isTe ? 'నడక సారాంశం' : isHi ? 'सत्र सारांश' : 'Walk Session Summary'}
                </h3>
              </div>
              <button
                onClick={() => setShowSessionSummary(false)}
                className="p-2 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--ink-muted)] cursor-pointer"
                aria-label="Close Summary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)]">
                <span className="text-[11px] font-mono text-[var(--ink-muted)] uppercase block">Duration</span>
                <span className="font-heading font-extrabold text-2xl text-[var(--ink)]">
                  {Math.floor(sessionDurationSec / 60)}m {sessionDurationSec % 60}s
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)]">
                <span className="text-[11px] font-mono text-[var(--ink-muted)] uppercase block">Total Alerts</span>
                <span className="font-heading font-extrabold text-2xl text-[var(--ink)]">
                  {Object.values(alertsCountByClass).reduce((a, b) => a + b, 0)}
                </span>
              </div>
            </div>

            {/* Was last alert correct? */}
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] space-y-3">
              <span className="font-semibold text-xs text-[var(--ink)] block">
                {isTe ? 'చివరి హెచ్చరిక సరైనదా?' : isHi ? 'क्या अंतिम चेतावनी सही थी?' : 'Was the last guidance alert correct?'}
              </span>
              {lastAlertFeedbackRecorded ? (
                <p className="text-xs text-emerald-600 font-bold">
                  ✓ {isTe ? 'ధన్యవాదాలు! మీ అభిప్రాయం రికార్డ్ చేయబడింది.' : isHi ? 'धन्यवाद! आपकी प्रतिक्रिया दर्ज की गई।' : 'Thank you! Your feedback helps retrain the model.'}
                </p>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSendFeedback(true)}
                    className="flex-1 min-h-[44px] rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer transition"
                  >
                    {isTe ? 'సరైనది (Right)' : isHi ? 'सही (Right)' : 'Right'}
                  </button>
                  <button
                    onClick={() => handleSendFeedback(false)}
                    className="flex-1 min-h-[44px] rounded-lg bg-zinc-700 hover:bg-zinc-800 text-white font-bold text-xs cursor-pointer transition"
                  >
                    {isTe ? 'తప్పు (Wrong)' : isHi ? 'गलत (Wrong)' : 'Wrong'}
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowSessionSummary(false)}
              className="w-full min-h-[48px] rounded-xl bg-[var(--brand-charcoal)] text-white font-bold text-sm hover:opacity-95 transition cursor-pointer"
            >
              {isTe ? 'ముగించు' : isHi ? 'बंद करें' : 'Done'}
            </button>
          </div>
        </div>
      )}

      {/* Hidden Diagnostics Panel (?debug=1 or Debug toggle) */}
      {showDiagnostics && (
        <DiagnosticsPanel
          onClose={() => {
            setShowDiagnostics(false);
            diagnostics.setDebugMode(false);
          }}
        />
      )}

    </div>
  );
};
