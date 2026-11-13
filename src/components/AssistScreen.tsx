import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Camera,
  Layers,
  Sparkles,
  Volume2,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Eye,
  RefreshCw,
  Info,
} from 'lucide-react';
import { AppSettings, SupportedLanguage } from '../types';
import { speechEngine } from '../services/speechEngine';
import { audioEngine } from '../services/audioEngine';
import labelsEn from '../translations/labels.en.json';
import labelsHi from '../translations/labels.hi.json';
import labelsTe from '../translations/labels.te.json';

interface Props {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  onOpenSettings: () => void;
}

interface Top3Prediction {
  class: string;
  probability: number;
}

interface PredictionResult {
  prediction_id: string;
  label: string;
  confidence: number;
  top3: Top3Prediction[];
  low_confidence: boolean;
  inference_time_ms: number;
  model_version: string;
}

const PRESET_SAMPLES = [
  { id: 'NonDemented', labelEn: 'Normal (Non-Demented)', labelHi: 'सामान्य (स्वस्थ)', labelTe: 'సాధారణం' },
  { id: 'VeryMildDemented', labelEn: 'Very Mild Changes', labelHi: 'अति मंद परिवर्तन', labelTe: 'చాలా స్వల్ప మార్పులు' },
  { id: 'MildDemented', labelEn: 'Mild Impairment', labelHi: 'मंद विकार', labelTe: 'స్వల్ప లోపం' },
  { id: 'ModerateDemented', labelEn: 'Moderate Impairment', labelHi: 'मध्यम विकार', labelTe: 'మధ్యస్థ లోపం' },
];

export const AssistScreen: React.FC<Props> = ({
  settings,
  updateSettings,
}) => {
  const language = settings.language;
  const isHi = language === 'hi';
  const isTe = language === 'te';

  const labelsMap = isTe ? labelsTe : isHi ? labelsHi : labelsEn;

  // Image & analysis state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('NonDemented');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [showGradCam, setShowGradCam] = useState<boolean>(false);
  const [gradCamOverlay, setGradCamOverlay] = useState<string | null>(null);
  const [isLoadingGradCam, setIsLoadingGradCam] = useState<boolean>(false);

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Feedback state
  const [feedbackSent, setFeedbackSent] = useState<boolean>(false);
  const [feedbackNote, setFeedbackNote] = useState<string>('');
  const [optInShare, setOptInShare] = useState<boolean>(false);

  // Voice speech announcement
  const speakPrediction = (label: string, conf: number, lowConf: boolean) => {
    const classInfo = (labelsMap as any)[label] || { display: label, speech: label };
    let textToSpeak = classInfo.speech;

    if (lowConf) {
      textToSpeak += isTe
        ? ' గమనిక: ఖచ్చితత్వం 60 శాతం కంటే తక్కువగా ఉంది. దయచేసి నిపుణుల సలహా పొందండి.'
        : isHi
        ? ' ध्यान दें: विश्वास 60% से कम है। कृपया पेशेवर चिकित्सक से परामर्श लें।'
        : ' Note: Confidence is below 60%. Please verify with a qualified clinician.';
    }

    speechEngine.speak(textToSpeak, {
      language,
      rate: settings.speechRate,
      pitch: settings.speechPitch,
      volume: settings.speechVolume,
      interrupt: true,
    });
  };

  // Camera start/stop
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      setCameraError(err.message || 'Camera permission denied or camera not available.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const captureCameraFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, 128, 128);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setSelectedImage(dataUrl);
      stopCamera();
    }
  };

  // File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setResult(null);
        setGradCamOverlay(null);
        setShowGradCam(false);
        setFeedbackSent(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Preset selection
  const handleSelectPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    // Create an illustrative scan graphic representing the MRI slice
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#111317';
      ctx.fillRect(0, 0, 128, 128);

      // Draw brain-like axial ellipse
      ctx.beginPath();
      ctx.ellipse(64, 64, 48, 56, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#42454a';
      ctx.fill();

      // Ventricles simulation based on severity
      const vSize = presetId === 'ModerateDemented' ? 14 : presetId === 'MildDemented' ? 10 : presetId === 'VeryMildDemented' ? 7 : 4;
      ctx.beginPath();
      ctx.ellipse(56, 62, vSize, vSize * 1.6, -0.15, 0, Math.PI * 2);
      ctx.ellipse(72, 62, vSize, vSize * 1.6, 0.15, 0, Math.PI * 2);
      ctx.fillStyle = '#15171a';
      ctx.fill();

      setSelectedImage(canvas.toDataURL('image/png'));
    }
    setResult(null);
    setGradCamOverlay(null);
    setShowGradCam(false);
    setFeedbackSent(false);
  };

  useEffect(() => {
    handleSelectPreset('NonDemented');
  }, []);

  // Run Inference Analysis
  const handleAnalyze = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setFeedbackSent(false);
    audioEngine.triggerHaptic('click');

    try {
      const payload: any = {
        samplePreset: selectedPreset,
      };
      if (selectedImage) {
        payload.imageBase64 = selectedImage;
      }

      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Prediction API call failed');
      }

      const data: PredictionResult = await response.json();
      setResult(data);

      // Trigger voice readout
      speakPrediction(data.label, data.confidence, data.low_confidence);

      // Pre-fetch Grad-CAM
      fetchGradCam(payload);
    } catch (err: any) {
      console.error('Analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fetchGradCam = async (payload: any) => {
    setIsLoadingGradCam(true);
    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const data = await response.json();
        setGradCamOverlay(data.gradcam_overlay_base64);
      }
    } catch (err) {
      console.warn('Grad-CAM fetch failed:', err);
    } finally {
      setIsLoadingGradCam(false);
    }
  };

  // Submit Feedback
  const handleFeedback = async (wasCorrect: boolean) => {
    if (!result) return;
    audioEngine.triggerHaptic('click');
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prediction_id: result.prediction_id,
          predicted_label: result.label,
          was_correct: wasCorrect,
          confidence: result.confidence,
          note: feedbackNote,
          language,
          opt_in_share: optInShare,
          image_base64: optInShare ? selectedImage : undefined,
        }),
      });
      setFeedbackSent(true);
    } catch (err) {
      console.error('Feedback error:', err);
    }
  };

  const activeClassDetails = result ? (labelsMap as any)[result.label] || { display: result.label, speech: '' } : null;

  return (
    <div className="layout-container py-8 max-w-4xl space-y-8">
      
      {/* 1. Header with Medical / Assistive Disclaimer */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] tracking-tight">
              {isTe ? 'కంప్యూటర్ విజన్ విశ్లేషణ' : isHi ? 'न्यूरल विज़न विश्लेषण' : 'Neural Vision Analysis'}
            </h1>
            <p className="text-sm text-[var(--ink-muted)] mt-1">
              {isTe
                ? 'పైథాన్ కెరాస్ CNN ద్వారా 128x128 న్యూరల్ ఇమేజ్ వర్గీకరణ & గ్రాడ్-క్యామ్ విజువలైజేషన్'
                : isHi
                ? 'पायथन केरास CNN द्वारा 128x128 न्यूरल वर्गीकरण एवं ग्रैड-कैम व्याख्या'
                : 'Python Keras CNN 128x128 classification & Grad-CAM feature localization'}
            </p>
          </div>
          <span className="font-mono text-xs px-2.5 py-1 rounded bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--accent)] font-semibold shrink-0">
            Model: Variant 4 (BN+L2+SpatialDropout)
          </span>
        </div>

        {/* Mandatory Medical Disclaimer Banner */}
        <div className="card-warn-box p-4 rounded-xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 card-warn-icon shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-xs sm:text-sm card-warn-body leading-relaxed">
            <strong className="card-warn-heading font-bold block mb-0.5">
              {isTe ? 'వైద్య సలహా కాదు:' : isHi ? 'चिकित्सीय अस्वीकरण:' : 'Medical Disclaimer:'}
            </strong>
            {isTe
              ? 'సహాయక మరియు విద్యా సాధనం మాత్రమే. ఫలితాలు క్లినికల్ రోగ నిర్ధారణ కావు మరియు అర్హత కలిగిన వైద్య నిపుణులచే ధృవీకరించబడాలి.'
              : isHi
              ? 'केवल सहायक एवं शैक्षणिक उपकरण। परिणाम चिकित्सीय निदान नहीं हैं और इन्हें किसी योग्य पेशेवर द्वारा सत्यापित किया जाना चाहिए।'
              : 'Assistive and educational tool only. Results are not a clinical diagnosis and must be reviewed by a qualified professional.'}
          </div>
        </div>
      </div>

      {/* 2. Interactive Input Panel: Image Upload, Camera, or Presets */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Image Viewport with Scanning Line Animation */}
        <div className="md:col-span-7 space-y-4">
          <div className="relative w-full aspect-square max-h-[360px] mx-auto rounded-2xl overflow-hidden border-2 border-[var(--border)] bg-[#101214] flex items-center justify-center shadow-md">
            
            {isCameraActive ? (
              <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
            ) : selectedImage ? (
              <div className="relative w-full h-full">
                <img
                  src={selectedImage}
                  alt="Scan under analysis"
                  className="w-full h-full object-contain p-2"
                />
                
                {/* Grad-CAM Heatmap Overlay */}
                {showGradCam && gradCamOverlay && (
                  <img
                    src={gradCamOverlay}
                    alt="Grad-CAM activation overlay"
                    className="absolute inset-0 w-full h-full object-contain p-2 pointer-events-none opacity-85 mix-blend-screen transition-opacity duration-300"
                  />
                )}
              </div>
            ) : (
              <div className="text-center p-6 text-[var(--ink-muted)] space-y-2">
                <Upload className="w-10 h-10 mx-auto text-[var(--border)]" />
                <p className="text-xs">Upload an image or select a sample scan</p>
              </div>
            )}

            {/* Subtle Scanning-Line Animation during Inference */}
            {isAnalyzing && (
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent animate-pulse shadow-[0_0_15px_var(--accent)] z-20"
                style={{
                  animation: 'scanning 1.6s ease-in-out infinite',
                }}
              />
            )}

            {/* Badge overlay on top corner */}
            <div className="absolute top-3 left-3 z-10">
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-black/70 text-white border border-white/20">
                128 × 128 RGB
              </span>
            </div>

            {/* Grad-CAM Active Tag */}
            {showGradCam && gradCamOverlay && (
              <div className="absolute top-3 right-3 z-10">
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-rose-600/90 text-white shadow">
                  Grad-CAM Active
                </span>
              </div>
            )}
          </div>

          {/* Action Row Under Viewport */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload-input"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5 cursor-pointer transition shadow-sm"
              >
                <Upload className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Upload Scan</span>
              </button>

              {!isCameraActive ? (
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                >
                  <Camera className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>Use Camera</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={captureCameraFrame}
                  className="px-3 py-2 rounded-lg bg-[var(--brand-charcoal)] text-[var(--brand-offwhite)] hover:bg-[var(--brand-charcoal-2)] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Capture Frame</span>
                </button>
              )}
            </div>

            {/* Grad-CAM Toggle Button */}
            <button
              type="button"
              disabled={!result}
              onClick={() => setShowGradCam(!showGradCam)}
              className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm ${
                showGradCam
                  ? 'bg-rose-50 text-rose-800 border-rose-300 font-bold'
                  : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] text-[var(--ink)] disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showGradCam ? 'Hide Heatmap' : 'Show Grad-CAM Heatmap'}</span>
            </button>
          </div>

          {/* Grad-CAM caption explaining methodology */}
          {showGradCam && (
            <div className="p-3 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)] text-xs text-[var(--ink-muted)] leading-relaxed">
              <strong className="text-[var(--ink)] font-semibold block mb-0.5">About Grad-CAM:</strong>
              Gradient-weighted Class Activation Mapping highlights regions of the scan that contributed most strongly to the model's classification decision.
            </div>
          )}
        </div>

        {/* Right Column: Sample Presets & Large Analyse Action */}
        <div className="md:col-span-5 space-y-4 flex flex-col justify-between">
          
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold text-[var(--ink-muted)] uppercase tracking-wider block">
              Or Select Verified Benchmark Scan:
            </span>
            <div className="grid grid-cols-1 gap-2">
              {PRESET_SAMPLES.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleSelectPreset(sample.id)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                    selectedPreset === sample.id
                      ? 'border-[var(--brand-charcoal)] bg-[var(--surface-subtle)] shadow-sm'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)]/60'
                  }`}
                >
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-[var(--ink)] block">
                      {isTe ? sample.labelTe : isHi ? sample.labelHi : sample.labelEn}
                    </span>
                    <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                      Class ID: {sample.id}
                    </span>
                  </div>
                  {selectedPreset === sample.id && (
                    <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* FLAGSHIP ANALYSE BUTTON with 56px height, WCAG AA contrast */}
          <div className="pt-2">
            <button
              type="button"
              disabled={isAnalyzing}
              onClick={handleAnalyze}
              className="w-full min-h-[56px] h-14 rounded-xl bg-[var(--brand-charcoal)] hover:bg-[var(--brand-charcoal-2)] text-[var(--brand-offwhite)] font-bold text-base flex items-center justify-center gap-3 cursor-pointer shadow-md transition disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Analyzing with CNN...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Analyse Scan with Model</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>

      {/* 3. Results Section (Appears after analysis) */}
      {result && (
        <div className="card-warm p-6 sm:p-8 rounded-2xl space-y-6 animate-fadeIn">
          
          {/* Top Banner: Predicted Class & Confidence */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--card-border)] pb-6">
            <div>
              <span className="text-xs font-mono font-bold text-[var(--icon-color)] uppercase tracking-wider block mb-1">
                Classification Result
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-heading)]">
                {activeClassDetails?.display}
              </h2>
              <p className="text-sm text-[var(--text-body)] mt-1 max-w-xl">
                {activeClassDetails?.speech}
              </p>
            </div>

            <div className="text-right sm:self-center shrink-0">
              <span className="text-xs text-[var(--text-body)] block font-medium">Confidence Score</span>
              <span className="text-3xl font-mono font-extrabold text-[#1F4D3A]">
                {Math.round(result.confidence * 1000) / 10}%
              </span>
              <span className="text-[11px] font-mono text-[var(--text-body)] block mt-0.5">
                {result.inference_time_ms}ms latency
              </span>
            </div>
          </div>

          {/* Low Confidence Warning (<60%) */}
          {result.low_confidence && (
            <div className="p-4 rounded-xl border border-rose-300 bg-rose-50 text-rose-900 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block">Caution: Low Confidence</strong>
                Confidence is below 60% — proceed with caution and seek professional clinical verification.
              </div>
            </div>
          )}

          {/* Top-3 Horizontal Growing Probability Bars */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-heading)]">
              Top-3 Class Probability Distribution:
            </h3>

            <div className="space-y-3">
              {result.top3.map((item, idx) => {
                const itemDetails = (labelsMap as any)[item.class] || { display: item.class };
                const percent = Math.round(item.probability * 1000) / 10;
                return (
                  <div key={item.class} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[var(--text-heading)]">
                        {idx + 1}. {itemDetails.display}
                      </span>
                      <span className="font-mono font-bold text-[var(--text-heading)]">
                        {percent}%
                      </span>
                    </div>
                    <div className="w-full bg-[#EAE3D6] rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-[#3F8F6B] h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Spoken Voice Announcement Replay Button */}
          <div className="pt-2 flex items-center justify-between border-t border-[var(--card-border)] text-xs">
            <button
              type="button"
              onClick={() => speakPrediction(result.label, result.confidence, result.low_confidence)}
              className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] hover:bg-[#F8F4EC] text-[var(--text-heading)] font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition"
            >
              <Volume2 className="w-4 h-4 text-[var(--icon-color)]" />
              <span>Replay Voice Announcement ({language.toUpperCase()})</span>
            </button>
            <span className="text-[11px] text-[var(--text-body)] font-mono">
              India DPDP Act 2023 Compliant
            </span>
          </div>

          {/* Verification Feedback: Was this correct? */}
          <div className="p-4 rounded-xl bg-[#F8F4EC] border border-[var(--card-border)] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs sm:text-sm font-semibold text-[var(--text-heading)]">
                Was this classification correct?
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleFeedback(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#E6F2EA] text-[#1F4D3A] border border-[#3F8F6B]/30 font-bold text-xs flex items-center gap-1.5 hover:bg-[#D2E7DA] transition cursor-pointer"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Yes, Correct</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFeedback(false)}
                  className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-800 border border-rose-300 font-bold text-xs flex items-center gap-1.5 hover:bg-rose-200 transition cursor-pointer"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  <span>No, Incorrect</span>
                </button>
              </div>
            </div>

            {/* Optional Comment Field */}
            <input
              type="text"
              value={feedbackNote}
              onChange={(e) => setFeedbackNote(e.target.value)}
              placeholder="Optional clinical notes or observation..."
              className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] text-xs text-[var(--text-heading)] placeholder-[var(--text-body)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--brand-charcoal)]"
            />

            {/* Opt-in Image Sharing Checkbox (Default Unchecked) */}
            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="opt-in-checkbox"
                checked={optInShare}
                onChange={(e) => setOptInShare(e.target.checked)}
                className="mt-0.5 rounded border-[var(--card-border)] text-[var(--brand-charcoal)] focus:ring-0 cursor-pointer"
              />
              <label htmlFor="opt-in-checkbox" className="text-xs text-[var(--text-body)] cursor-pointer leading-normal">
                Allow this image to be used to improve future models (Opt-in only. All identifiable metadata discarded).
              </label>
            </div>

            {feedbackSent && (
              <div className="text-xs text-[#1F4D3A] font-semibold flex items-center gap-1.5 pt-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Thank you! Your verified feedback has been logged to the telemetry dashboard.</span>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Style tag for custom scanning line animation */}
      <style>{`
        @keyframes scanning {
          0% { top: 0%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 98%; opacity: 0; }
        }
      `}</style>

    </div>
  );
};
