import React, { useState, useRef } from 'react';
import { SupportedLanguage } from '../types';
import { Mic, Square, Play, Volume2, Copy, Check, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from './ui/Button';
import { speechEngine } from '../services/speechEngine';

interface AudioTranscriberProps {
  language: SupportedLanguage;
  onSendToChat?: (text: string) => void;
}

export const AudioTranscriber: React.FC<AudioTranscriberProps> = ({ language, onSendToChat }) => {
  const isHi = language === 'hi';
  const isTe = language === 'te';

  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [copied, setCopied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setAudioBase64(base64);
        };
        reader.readAsDataURL(audioBlob);

        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordSeconds(0);
      setTranscription(null);

      timerRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      console.error('Audio recording failed:', err);
      alert('Microphone access denied. Please allow microphone in browser settings.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const handleTranscribe = async () => {
    if (!audioBase64 || isTranscribing) return;

    setIsTranscribing(true);
    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType: 'audio/webm',
        }),
      });

      const data = await res.json();
      setTranscription(data.transcription || 'No speech recognized.');
    } catch (err: any) {
      console.error('Transcription error:', err);
      setTranscription('Error contacting transcription service.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleCopy = () => {
    if (!transcription) return;
    navigator.clipboard.writeText(transcription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (!transcription) return;
    speechEngine.speak(transcription, { language, interrupt: true });
  };

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* Recorder Card */}
      <div className="p-6 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-5 flex flex-col items-center text-center">
        
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--accent)] font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Speech-to-Text Model: gemini-3.5-transcribe
          </span>
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-bold text-[var(--ink)] tracking-tight">
            {isTe
              ? 'ఆడియో ట్రాన్స్‌క్రిప్షన్ (వాయిస్ రికార్డర్)'
              : isHi
              ? 'ऑडियो ट्रांसक्रिप्शन (वॉयस रिकॉर्डर)'
              : 'Microphone Audio Transcription'}
          </h3>
          <p className="text-xs sm:text-sm text-[var(--ink-muted)] max-w-md">
            {isTe
              ? 'మీ మైక్రోఫోన్‌తో ఏదైనా మాట్లాడండి లేదా వీధి శబ్దాలను రికార్డ్ చేయండి. జెమిని 3.5 ట్రాన్స్‌క్రైబ్ దానిని ఖచ్చితమైన పాఠ్యంగా మారుస్తుంది.'
              : isHi
              ? 'माइक से अपनी बात या सड़क की आवाजें रिकॉर्ड करें। जेमिनी 3.5 ट्रांसक्राइब इसे तुरंत सटीक टेक्स्ट में बदल देगा।'
              : 'Record your voice or ambient street notes. Gemini 3.5 Transcribe converts speech accurately in English, Hindi, and Telugu.'}
          </p>
        </div>

        {/* Record Button & Timer */}
        <div className="flex flex-col items-center gap-3 my-2">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-20 h-20 rounded-full flex flex-col items-center justify-center text-white shadow-md transition active:scale-95 cursor-pointer ${
              isRecording
                ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                : 'bg-[var(--accent)] hover:bg-[var(--accent-hover)]'
            }`}
            aria-label={isRecording ? 'Stop recording' : 'Start audio recording'}
          >
            {isRecording ? <Square className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
          </button>

          <span className="font-mono text-xs font-bold text-[var(--ink)]">
            {isRecording ? `Recording: ${recordSeconds}s` : 'Tap mic to record'}
          </span>
        </div>

        {/* Playback preview & Transcribe Action */}
        {audioUrl && !isRecording && (
          <div className="w-full max-w-md flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-[var(--radius-input)] bg-[var(--surface-subtle)] border border-[var(--border)]">
            <audio src={audioUrl} controls className="h-8 max-w-[200px]" />
            <Button
              variant="primary"
              size="sm"
              onClick={handleTranscribe}
              disabled={isTranscribing}
            >
              {isTranscribing ? 'Transcribing...' : 'Transcribe with Gemini'}
            </Button>
          </div>
        )}
      </div>

      {/* Transcription Output Card */}
      {transcription && (
        <div className="p-6 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <span className="font-mono text-xs uppercase font-bold text-[var(--ink-muted)]">
              Transcription Result (gemini-3.5-transcribe)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSpeak}
                className="flex items-center gap-1 text-xs font-mono font-bold text-[var(--accent)] hover:underline cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" /> Listen
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs font-mono font-bold text-[var(--accent)] hover:underline cursor-pointer ml-3"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="p-4 rounded-[var(--radius-input)] bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-sm font-medium text-[var(--ink)] leading-relaxed">
            "{transcription}"
          </div>

          {onSendToChat && (
            <div className="pt-2 flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onSendToChat(transcription)}
                className="flex items-center gap-1.5"
              >
                <span>Send to Gemini Chatbot</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
