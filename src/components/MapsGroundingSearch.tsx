import React, { useState } from 'react';
import { SupportedLanguage } from '../types';
import { MapPin, Search, ExternalLink, Navigation, Volume2, Sparkles, Compass } from 'lucide-react';
import { Button } from './ui/Button';
import { speechEngine } from '../services/speechEngine';

interface MapsGroundingSearchProps {
  language: SupportedLanguage;
}

interface GroundingLink {
  maps?: {
    title?: string;
    uri?: string;
    placeAnswerSources?: {
      reviewSnippets?: { text: string }[];
    };
  };
  web?: {
    title?: string;
    uri?: string;
  };
}

export const MapsGroundingSearch: React.FC<MapsGroundingSearchProps> = ({ language }) => {
  const isHi = language === 'hi';
  const isTe = language === 'te';

  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [groundingChunks, setGroundingChunks] = useState<GroundingLink[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const sampleQueries = [
    isTe
      ? 'హర్యానాలో టెక్టైల్ పేవింగ్ గల మెట్రో స్టేషన్లను కనుగొనండి'
      : isHi
      ? 'हरियाणा में स्पर्शनीय पीली टाइल वाले निकटतम मेट्रो स्टेशन खोजें'
      : 'Find metro stations with tactile paving near Gurugram',
    isTe
      ? 'పాదచారుల సురక్షిత క్రాసింగ్‌లు మరియు ఆడియో సిగ్నల్స్ ఎక్కడ ఉన్నాయి?'
      : isHi
      ? 'ऑडियो सिग्नल वाले सुरक्षित पैदल पार-पथ कहाँ हैं?'
      : 'Pedestrian crossings with tactile curb ramps and audio signals',
    isTe
      ? 'సమీపంలోని బ్లైండ్ స్కూల్స్ మరియు పునరావాస కేంద్రాలు'
      : isHi
      ? 'निकटतम दृष्टिबाधित संस्थान व पुनर्वास केंद्र'
      : 'National Association for the Blind rehabilitation centers',
  ];

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || isLoading) return;

    setIsLoading(true);
    setResultText(null);
    setGroundingChunks([]);

    try {
      const res = await fetch('/api/maps-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          latitude: userLocation?.lat || 28.4595,
          longitude: userLocation?.lng || 77.0266,
          language,
        }),
      });

      const data = await res.json();
      setResultText(data.reply || 'No grounded information found.');
      setGroundingChunks(data.groundingChunks || []);
    } catch (err: any) {
      console.error('Maps Grounding error:', err);
      setResultText('Failed to query Google Maps Grounding. Please check your network.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = (text: string) => {
    speechEngine.speak(text, { language, interrupt: true });
  };

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* Search Header Card */}
      <div className="p-6 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-4">
        
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--accent)] font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Google Maps Grounding (gemini-3.8-flash + googleMaps tool)
          </span>
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-bold text-[var(--ink)] tracking-tight">
            {isTe
              ? 'గూగుల్ మ్యాప్స్ గ్రౌండెడ్ సమాచారం'
              : isHi
              ? 'गूगल मैप्स ग्राउंडेड जानकारी'
              : 'Maps-Grounded Location Intelligence'}
          </h3>
          <p className="text-xs sm:text-sm text-[var(--ink-muted)]">
            {isTe
              ? 'గూగుల్ మ్యాప్స్ ద్వారా ఖచ్చితమైన భౌగోళిక సమాచారం. టెక్టైల్ మార్గాలు, ఆడియో సిగ్నల్స్ మరియు యాక్సెసిబుల్ ప్రదేశాలను ధృవీకరించిన లింక్‌లతో పొందండి.'
              : isHi
              ? 'गूगल मैप्स डेटा द्वारा प्रमाणित भौगोलिक जानकारी। स्पर्शनीय मार्ग, ऑडियो सिग्नल व सुगम्य स्थानों के सीधे आधिकारिक लिंक।'
              : 'Directly queries Google Maps Platform for real-world spatial knowledge, returning verified map URLs and accessible place summaries.'}
          </p>
        </div>

        {/* Search Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query);
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--ink-muted)]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for accessible metro stations, crossings, or hospitals..."
              className="w-full pl-9 pr-3 py-2.5 rounded-[var(--radius-input)] bg-[var(--surface-subtle)] border border-[var(--border)] text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
              disabled={isLoading}
            />
          </div>
          <Button type="submit" variant="primary" disabled={isLoading || !query.trim()}>
            {isLoading ? 'Grounding...' : 'Search'}
          </Button>
        </form>

        {/* Suggested Queries */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-[11px] font-mono text-[var(--ink-muted)] uppercase font-semibold">
            Suggested:
          </span>
          {sampleQueries.map((sq, i) => (
            <button
              key={i}
              onClick={() => {
                setQuery(sq);
                handleSearch(sq);
              }}
              className="text-xs px-2.5 py-1 rounded-[var(--radius-input)] bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--ink)] hover:border-[var(--accent)] transition cursor-pointer text-left"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Results View */}
      {resultText && (
        <div className="p-6 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <span className="font-mono text-xs uppercase font-bold text-[var(--ink-muted)]">
              Grounded Response
            </span>
            <button
              onClick={() => handleSpeak(resultText)}
              className="flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--accent)] hover:underline cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" /> Read Answer Aloud
            </button>
          </div>

          <p className="text-sm text-[var(--ink)] whitespace-pre-wrap leading-relaxed">
            {resultText}
          </p>

          {/* Mandatory Google Maps Grounding Links */}
          {groundingChunks.length > 0 && (
            <div className="pt-4 border-t border-[var(--border-subtle)] space-y-2">
              <span className="font-mono text-xs uppercase font-bold text-[var(--accent)] block">
                Google Maps Verified Sources & Places:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {groundingChunks.map((chunk, idx) => {
                  const title = chunk.maps?.title || chunk.web?.title || 'Google Maps Location';
                  const uri = chunk.maps?.uri || chunk.web?.uri || '#';
                  return (
                    <a
                      key={idx}
                      href={uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-[var(--radius-input)] bg-[var(--surface-subtle)] border border-[var(--border)] hover:border-[var(--accent)] flex items-center justify-between gap-2 group transition text-xs font-semibold text-[var(--ink)]"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                        <span className="truncate group-hover:text-[var(--accent)]">{title}</span>
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-[var(--ink-muted)] shrink-0" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
