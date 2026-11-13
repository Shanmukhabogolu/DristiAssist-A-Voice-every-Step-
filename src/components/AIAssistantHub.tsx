import React, { useState } from 'react';
import { SupportedLanguage } from '../types';
import { Radio, MessageSquare, MapPin, Mic, Sparkles, HelpCircle } from 'lucide-react';
import { LiveVoiceCompanion } from './LiveVoiceCompanion';
import { GeminiChatbot } from './GeminiChatbot';
import { MapsGroundingSearch } from './MapsGroundingSearch';
import { AudioTranscriber } from './AudioTranscriber';
import { VoiceCommandsModal } from './VoiceCommandsModal';

interface AIAssistantHubProps {
  language: SupportedLanguage;
}

export const AIAssistantHub: React.FC<AIAssistantHubProps> = ({ language }) => {
  const isHi = language === 'hi';
  const isTe = language === 'te';

  const [activeSubTab, setActiveSubTab] = useState<'live' | 'chat' | 'grounding' | 'transcribe'>('live');

  const [isCommandsOpen, setIsCommandsOpen] = useState(false);

  const subTabs = [
    {
      id: 'live',
      labelEn: 'Voice Conversation',
      labelHi: 'लाइव वॉयस संवाद',
      labelTe: 'వాయిస్ సంభాషణ',
      badge: 'gemini-3.8-live',
      icon: Radio,
    },
    {
      id: 'chat',
      labelEn: 'Gemini Chatbot',
      labelHi: 'जेमिनी चैटबॉट',
      labelTe: 'జెమిని చాట్‌బాట్',
      badge: 'Multi-Role',
      icon: MessageSquare,
    },
    {
      id: 'grounding',
      labelEn: 'Maps Grounding',
      labelHi: 'मैप्स ग्राउंडिंग',
      labelTe: 'మ్యాప్స్ గ్రౌండింగ్',
      badge: 'googleMaps',
      icon: MapPin,
    },
    {
      id: 'transcribe',
      labelEn: 'Transcribe Audio',
      labelHi: 'ऑडियो ट्रांसक्रिप्शन',
      labelTe: 'ఆడియో ట్రాన్స్‌క్రిప్షన్',
      badge: 'gemini-3.5-transcribe',
      icon: Mic,
    },
  ];

  return (
    <div className="w-full layout-container py-8 flex flex-col gap-6">
      
      {/* Hub Header */}
      <div className="pb-4 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--accent)] font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              03 / Drishti Intelligence Hub
            </span>
            <span className="text-[var(--ink-muted)]">·</span>
            <span className="font-mono text-xs text-[var(--ink-muted)]">
              Live API, Multi-turn Chat, Maps & Transcription
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] tracking-tight mt-1">
            {isTe
              ? 'AI అసిస్టెంట్ & వాయిస్ ఇంటెలిజెన్స్'
              : isHi
              ? 'AI सहायक एवं वॉयस इंटेलिजेंस'
              : 'AI Voice & Mobility Assistant'}
          </h1>
          <p className="text-sm text-[var(--ink-muted)] max-w-2xl mt-1">
            {isTe
              ? 'రియల్-టైమ్ జెమిని లైవ్ సంభాషణలు, మల్టీ-టర్న్ చాట్‌బాట్, గూగుల్ మ్యాప్స్ గ్రౌండెడ్ నావిగేషన్ మరియు ఆడియో ట్రాన్స్‌క్రిప్షన్.'
              : isHi
              ? 'रीयल-टाइम जेमिनी लाइव बातचीत, मल्टी-टर्न चैटबॉट, गूगल मैप्स ग्राउंडेड नेविगेशन और उच्च-सटीक ऑडियो ट्रांसक्रिप्शन।'
              : 'Real-time Live API voice companion, multi-turn assistant with specialized roles, Maps Grounding, and speech-to-text transcription.'}
          </p>
        </div>

        {/* Global Voice Commands Quick Button */}
        <button
          onClick={() => setIsCommandsOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-[var(--radius-input)] border border-[var(--border)] bg-[var(--surface-subtle)] hover:bg-[var(--surface)] text-[var(--ink)] hover:text-[var(--accent)] hover:border-[var(--accent)] font-mono text-xs font-bold transition shadow-xs cursor-pointer shrink-0 self-start sm:self-center"
          aria-label={isHi ? 'वॉयस कमांड्स सूची खोलें' : 'Open voice commands list'}
        >
          <HelpCircle className="w-4 h-4 text-[var(--accent)]" />
          <span>{isHi ? 'वॉयस कमांड्स (Voice Commands)' : 'Voice Commands (EN / हिन्दी)'}</span>
        </button>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-subtle)] pb-2">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          const label = isTe ? tab.labelTe : isHi ? tab.labelHi : tab.labelEn;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-[var(--radius-input)] text-xs font-mono font-semibold transition cursor-pointer ${
                isActive
                  ? 'bg-[var(--accent)] text-[var(--accent-text)]'
                  : 'bg-[var(--surface)] text-[var(--ink)] border border-[var(--border)] hover:bg-[var(--surface-subtle)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{label}</span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-[var(--surface-subtle)] text-[var(--ink-muted)]'
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Feature Sub-View */}
      <div className="w-full">
        {activeSubTab === 'live' && <LiveVoiceCompanion language={language} />}
        {activeSubTab === 'chat' && <GeminiChatbot language={language} />}
        {activeSubTab === 'grounding' && <MapsGroundingSearch language={language} />}
        {activeSubTab === 'transcribe' && (
          <AudioTranscriber
            language={language}
            onSendToChat={(text) => {
              setActiveSubTab('chat');
            }}
          />
        )}
      </div>

      {/* Voice Commands Modal with Hindi and English Toggle */}
      <VoiceCommandsModal
        isOpen={isCommandsOpen}
        onClose={() => setIsCommandsOpen(false)}
        language={language}
      />
    </div>
  );
};
