import React, { useState, useEffect, useRef } from 'react';
import { SupportedLanguage } from '../types';
import { Mic, MicOff, Volume2, Radio, AlertCircle, Sparkles, Send, Square, HelpCircle, MessageSquare } from 'lucide-react';
import { Button } from './ui/Button';
import { VoiceCommandsModal } from './VoiceCommandsModal';

interface LiveVoiceCompanionProps {
  language: SupportedLanguage;
}

export const LiveVoiceCompanion: React.FC<LiveVoiceCompanionProps> = ({ language }) => {
  const isHi = language === 'hi';
  const isTe = language === 'te';

  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [statusText, setStatusText] = useState<string>('Ready to connect');
  const [transcript, setTranscript] = useState<{ role: 'user' | 'assistant'; text: string; time: string }[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isSpeakingModel, setIsSpeakingModel] = useState(false);
  const [isCommandsModalOpen, setIsCommandsModalOpen] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);

  // Convert Float32Array to 16kHz PCM Int16 base64
  const pcmToBase64 = (float32Array: Float32Array): string => {
    const l = float32Array.length;
    const buffer = new ArrayBuffer(l * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < l; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  // Convert base64 24kHz raw PCM back to Float32Array
  const base64ToFloat32 = (base64: string): Float32Array => {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768.0;
    }
    return float32;
  };

  const playNextChunk = () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsSpeakingModel(false);
      return;
    }

    isPlayingRef.current = true;
    setIsSpeakingModel(true);

    if (!outputAudioCtxRef.current) {
      outputAudioCtxRef.current = new AudioContext({ sampleRate: 24000 });
    }

    const chunk = audioQueueRef.current.shift()!;
    const buffer = outputAudioCtxRef.current.createBuffer(1, chunk.length, 24000);
    buffer.getChannelData(0).set(chunk);

    const source = outputAudioCtxRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(outputAudioCtxRef.current.destination);
    source.onended = () => {
      playNextChunk();
    };
    source.start();
  };

  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/live-voice`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setStatusText(
        isTe ? 'కనెక్ట్ అయింది. మాట్లాడటానికి మైక్ ప్రారంభించండి.' :
        isHi ? 'लाइव कनेक्टेड। बोलने के लिए माइक चालू करें।' :
        'Live API Connected. Turn on mic to speak.'
      );
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.interrupted) {
          audioQueueRef.current = [];
          isPlayingRef.current = false;
          setIsSpeakingModel(false);
        }

        if (msg.audio) {
          const float32 = base64ToFloat32(msg.audio);
          audioQueueRef.current.push(float32);
          if (!isPlayingRef.current) {
            playNextChunk();
          }
        }

        if (msg.text) {
          setTranscript((prev) => [
            ...prev,
            {
              role: 'assistant',
              text: msg.text,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
      } catch (err) {
        console.warn('WS message error:', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setIsRecording(false);
      setStatusText(isTe ? 'కనెక్షన్ ముగిసింది.' : isHi ? 'कनेक्शन बंद हुआ।' : 'Live API Disconnected.');
    };

    ws.onerror = () => {
      setStatusText('Connection error with Live API.');
    };
  };

  const startVoiceStreaming = async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      connectWebSocket();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      const inputAudioCtx = new AudioContext({ sampleRate: 16000 });
      inputAudioCtxRef.current = inputAudioCtx;

      const source = inputAudioCtx.createMediaStreamSource(stream);
      const processor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      source.connect(processor);
      processor.connect(inputAudioCtx.destination);

      processor.onaudioprocess = (e) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const base64Audio = pcmToBase64(inputData);
          wsRef.current.send(JSON.stringify({ audio: base64Audio }));
        }
      };

      setIsRecording(true);
      setStatusText(
        isTe ? 'వినబడుతోంది... మాట్లాడండి' :
        isHi ? 'सुन रहा है... बोलिए' :
        'Listening live... speak naturally'
      );
      // Automatically open the commands guide modal on assistant activation if not opened before
      const hasSeenGuide = sessionStorage.getItem('drishti_seen_voice_commands');
      if (!hasSeenGuide) {
        setIsCommandsModalOpen(true);
        sessionStorage.setItem('drishti_seen_voice_commands', 'true');
      }
    } catch (err: any) {
      console.error('Mic access error:', err);
      setStatusText('Microphone permission required for Live voice.');
    }
  };

  const stopVoiceStreaming = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close();
      inputAudioCtxRef.current = null;
    }
    setIsRecording(false);
    setStatusText(isTe ? 'మైక్ ఆఫ్ చేయబడింది.' : isHi ? 'माइक बंद किया गया।' : 'Microphone paused.');
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    const userText = textInput.trim();
    setTextInput('');

    setTranscript((prev) => [
      ...prev,
      {
        role: 'user',
        text: userText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text: userText }));
    } else {
      // Reconnect and send
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live-voice`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onopen = () => {
        setIsConnected(true);
        ws.send(JSON.stringify({ text: userText }));
      };
    }
  };

  useEffect(() => {
    return () => {
      stopVoiceStreaming();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* Live Conversation Controls Card */}
      <div className="p-6 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-sm flex flex-col items-center text-center gap-6">
        
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--accent)] font-bold">
            Gemini Live API (gemini-3.8-live)
          </span>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-[var(--ink)] tracking-tight">
          {isTe
            ? 'రియల్-టైమ్ వాయిస్ సంభాషణ'
            : isHi
            ? 'रीयल-टाइम वॉयस बातचीत'
            : 'Real-Time Voice Conversation'}
        </h3>
        
        <p className="text-xs sm:text-sm text-[var(--ink-muted)] max-w-lg leading-relaxed">
          {isTe
            ? 'జెమిని 3.8 లైవ్‌తో తక్కువ జాప్యంతో సహజమైన సంభాషణ. నడక భద్రత, కర్ర టెక్నిక్ లేదా తక్షణ సూచనల కోసం నేరుగా మాట్లాడండి.'
            : isHi
            ? 'जेमिनी 3.8 लाइव द्वारा अति-त्वरित ध्वनि संवाद। सड़क पर सुरक्षा, सफेद छड़ी तकनीक या मार्ग परामर्श के लिए सहजता से बोलें।'
            : 'Low-latency natural conversation via Gemini 3.8 Live API. Ask about cane technique, walking orientation, or immediate reassurance.'}
        </p>

        {/* Big Pulsing Mic Button */}
        <div className="relative flex items-center justify-center my-2">
          {isRecording && (
            <div className="absolute w-32 h-32 rounded-full bg-[var(--accent)]/15 animate-ping" />
          )}
          {isSpeakingModel && (
            <div className="absolute w-36 h-36 rounded-full bg-emerald-500/20 animate-pulse" />
          )}
          
          <button
            onClick={isRecording ? stopVoiceStreaming : startVoiceStreaming}
            className={`w-24 h-24 rounded-full flex flex-col items-center justify-center gap-1 text-white shadow-lg transition-transform active:scale-95 cursor-pointer z-10 ${
              isRecording
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[var(--accent)] hover:bg-[var(--accent-hover)]'
            }`}
            aria-label={isRecording ? 'Stop voice stream' : 'Start live voice conversation'}
          >
            {isRecording ? <Square className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider">
              {isRecording ? 'Stop' : 'Start Talk'}
            </span>
          </button>
        </div>

        {/* Live Status indicator & Voice Commands Guide Button */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 text-[var(--ink-muted)]">
            <Radio className={`w-4 h-4 ${isRecording ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
            <span className="font-semibold">{statusText}</span>
          </div>

          <button
            onClick={() => setIsCommandsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-input)] border border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--ink)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition cursor-pointer font-bold"
            aria-label="Open Voice Commands Guide"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>{isHi ? 'वॉयस कमांड्स सूची (Voice Commands)' : 'Voice Commands Guide'}</span>
          </button>
        </div>
      </div>

      {/* Transcript & Message Thread */}
      <div className="p-6 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <span className="font-mono text-xs uppercase font-bold text-[var(--ink-muted)] tracking-wider">
            Live Conversation Transcript
          </span>
          <span className="text-xs font-mono text-[var(--accent)]">
            Audio I/O: 16kHz in / 24kHz out
          </span>
        </div>

        <div className="max-h-64 overflow-y-auto space-y-3 pr-2 flex flex-col">
          {transcript.length === 0 ? (
            <div className="text-center py-8 text-xs text-[var(--ink-muted)] font-mono">
              Press "Start Talk" above or type below to begin speaking with Gemini Live.
            </div>
          ) : (
            transcript.map((item, idx) => (
              <div
                key={idx}
                className={`flex flex-col gap-1 max-w-[85%] rounded-[var(--radius-input)] p-3 text-xs leading-relaxed ${
                  item.role === 'user'
                    ? 'self-end bg-[var(--accent)] text-[var(--accent-text)]'
                    : 'self-start bg-[var(--surface-subtle)] text-[var(--ink)] border border-[var(--border)]'
                }`}
              >
                <div className="flex items-center justify-between gap-4 font-mono text-[10px] opacity-75">
                  <span className="font-bold uppercase">{item.role === 'user' ? 'You' : 'Drishti Live'}</span>
                  <span>{item.time}</span>
                </div>
                <p className="text-sm">{item.text}</p>
              </div>
            ))
          )}
        </div>

        {/* Text Input Fallback Bar */}
        <form onSubmit={handleSendText} className="flex gap-2 pt-2 border-t border-[var(--border-subtle)]">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type a message to Gemini Live (or speak with mic above)..."
            className="flex-1 px-3 py-2 rounded-[var(--radius-input)] bg-[var(--surface-subtle)] border border-[var(--border)] text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
          />
          <Button type="submit" size="sm" variant="primary">
            <Send className="w-4 h-4 mr-1.5" /> Send
          </Button>
        </form>
      </div>

      {/* Voice Commands Modal with English and Hindi toggleable prompts */}
      <VoiceCommandsModal
        isOpen={isCommandsModalOpen}
        onClose={() => setIsCommandsModalOpen(false)}
        language={language}
        onSelectPrompt={(phrase) => {
          setTextInput(phrase);
        }}
      />
    </div>
  );
};
