import React, { useState } from 'react';
import { SupportedLanguage } from '../types';
import { Volume2, X, Globe, Sparkles, Mic, HelpCircle, Check, Play } from 'lucide-react';
import { speechEngine } from '../services/speechEngine';

interface VoiceCommandsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: SupportedLanguage;
  onSelectPrompt?: (phrase: string) => void;
}

interface CommandItem {
  id: string;
  category: 'core' | 'mobility' | 'control' | 'feedback';
  en: {
    command: string;
    alias: string[];
    action: string;
    example: string;
  };
  hi: {
    command: string;
    alias: string[];
    action: string;
    example: string;
  };
  te?: {
    command: string;
    alias: string[];
    action: string;
    example: string;
  };
}

export const VOICE_COMMANDS: CommandItem[] = [
  {
    id: 'start',
    category: 'core',
    en: {
      command: 'Start / Begin',
      alias: ['"Start"', '"Begin detection"'],
      action: 'Activates camera and on-device CNN hazard detection.',
      example: 'Say "Start" to begin detecting hazards.',
    },
    hi: {
      command: 'शुरू / प्रारंभ',
      alias: ['"शुरू"', '"आरंभ करो"'],
      action: 'कैमरा और ऑन-डिवाइस खतरा वर्गीकरण सक्रिय करता है।',
      example: '"शुरू" बोलकर खतरा पहचान चालू करें।',
    },
    te: {
      command: 'ప్రారంభించు / మొదలు',
      alias: ['"ప్రారంభించు"', '"మొదలు పెట్టు"'],
      action: 'కెమెరా మరియు రోడ్డు ప్రమాదాల గుర్తింపును ప్రారంభిస్తుంది.',
      example: '"ప్రారంభించు" అని చెప్పి గుర్తింపు మొదలుపెట్టండి.',
    },
  },
  {
    id: 'stop',
    category: 'core',
    en: {
      command: 'Stop / Pause',
      alias: ['"Stop"', '"Pause"'],
      action: 'Halts hazard detection, frees camera, and mutes live radar.',
      example: 'Say "Stop" whenever taking a break or sitting down.',
    },
    hi: {
      command: 'रुक / बंद',
      alias: ['"रुक"', '"बंद करो"'],
      action: 'खतरा पहचान रोकता है और कैमरा स्टैंडबाय पर रखता है।',
      example: 'चलना रोकने पर "बंद" कहें।',
    },
    te: {
      command: 'ఆపు / విరామం',
      alias: ['"ఆపు"', '"ఆపండి"'],
      action: 'గుర్తింపును నిలిపివేసి కెమెరాను స్టాండ్‌బైలో ఉంచుతుంది.',
      example: 'విశ్రాంతి సమయంలో "ఆపు" అని చెప్పండి.',
    },
  },
  {
    id: 'read',
    category: 'mobility',
    en: {
      command: 'Read / OCR / Sign',
      alias: ['"Read"', '"Read signs"'],
      action: 'Captures frame and reads street boards, signs, or Hindi/English text.',
      example: 'Say "Read" when standing near a signboard or shop board.',
    },
    hi: {
      command: 'पढ़ो / साइन बोर्ड',
      alias: ['"पढ़ो"', '"बोर्ड पढ़ो"'],
      action: 'वर्तमान फ्रेम को स्कैन कर हिंदी व अंग्रेजी साइन बोर्ड बोलकर सुनाता है।',
      example: 'दुकान या रास्ते का बोर्ड पढ़ने के लिए "पढ़ो" कहें।',
    },
    te: {
      command: 'చదువు / బోర్డు',
      alias: ['"చదువు"', '"బోర్డు చదువు"'],
      action: 'ప్రస్తుత దృశ్యంలోని బోర్డులు లేదా సైన్‌లను చదివి వినిపిస్తుంది.',
      example: 'బోర్డు చదవడానికి "చదువు" అని చెప్పండి.',
    },
  },
  {
    id: 'describe',
    category: 'mobility',
    en: {
      command: 'Describe / Scene',
      alias: ['"Describe"', '"Scene description"'],
      action: 'Requests consent, then returns a 1-2 sentence spatial description.',
      example: 'Say "Describe" to understand unfamiliar road surroundings.',
    },
    hi: {
      command: 'विवरण / बताओ',
      alias: ['"विवरण बताओ"', '"सामने क्या है"'],
      action: 'सहमति के बाद पूरे मार्ग का 1-2 वाक्यों में प्राकृतिक विवरण देता है।',
      example: 'अनजान जगह पर रास्ता समझने के लिए "विवरण" कहें।',
    },
    te: {
      command: 'వివరించు / దృశ్యం',
      alias: ['"వివరించు"', '"దృశ్యం చెప్పు"'],
      action: 'అనుమతి తీసుకున్న తర్వాత ముందున్న దృశ్యాన్ని సంక్షిప్తంగా వివరిస్తుంది.',
      example: 'పరిసరాలను తెలుసుకోవడానికి "వివరించు" అని చెప్పండి.',
    },
  },
  {
    id: 'repeat',
    category: 'control',
    en: {
      command: 'Repeat / Again',
      alias: ['"Repeat"', '"Say again"'],
      action: 'Repeats the most recent hazard or navigation alert.',
      example: 'Say "Repeat" if ambient traffic noise masked an alert.',
    },
    hi: {
      command: 'दोहराएं / फिर से',
      alias: ['"दोहराएं"', '"फिर से बोलो"'],
      action: 'पिछली बोली गई चेतावनी या निर्देश को तुरंत फिर से दोहराता है।',
      example: 'शोर के कारण न सुनने पर "दोहराएं" कहें।',
    },
    te: {
      command: 'మళ్ళీ / మరలా',
      alias: ['"మళ్ళీ చెప్పు"', '"మరలా"'],
      action: 'చివరిగా చెప్పిన హెచ్చరికను మళ్ళీ వినిపిస్తుంది.',
      example: 'హెచ్చరిక వినబడకపోతే "మళ్ళీ" అని చెప్పండి.',
    },
  },
  {
    id: 'louder',
    category: 'control',
    en: {
      command: 'Louder / Volume Up',
      alias: ['"Louder"', '"Volume up"'],
      action: 'Increases voice alert synthesis volume by 20%.',
      example: 'Say "Louder" when entering noisy roads or markets.',
    },
    hi: {
      command: 'तेज़ / आवाज़ बढ़ाओ',
      alias: ['"तेज़"', '"आवाज़ बढ़ाओ"'],
      action: 'वॉयस अलर्ट का वॉल्यूम 20% बढ़ाता है।',
      example: 'बाज़ार या ट्रैफिक में "तेज़" बोलें।',
    },
    te: {
      command: 'పెంచు / గట్టిగా',
      alias: ['"గట్టిగా చెప్పు"', '"వాల్యూమ్ పెంచు"'],
      action: 'వాయిస్ వాల్యూమ్‌ను 20% పెంచుతుంది.',
      example: 'రద్దీ ప్రదేశాలలో "గట్టిగా" అని చెప్పండి.',
    },
  },
  {
    id: 'quieter',
    category: 'control',
    en: {
      command: 'Quieter / Volume Down',
      alias: ['"Quieter"', '"Volume down"'],
      action: 'Decreases speech alert volume for indoor or quiet environments.',
      example: 'Say "Quieter" when inside buildings or classrooms.',
    },
    hi: {
      command: 'धीमे / आवाज़ कम करो',
      alias: ['"धीमे"', '"आवाज़ कम"'],
      action: 'शांत वातावरण में वॉयस का स्तर कम करता है।',
      example: 'कमरे या शांत जगह में "धीमे" बोलें।',
    },
    te: {
      command: 'తగ్గించు / మెల్లగా',
      alias: ['"మెల్లగా"', '"వాల్యూమ్ తగ్గించు"'],
      action: 'ఇండోర్ లేదా నిశ్శబ్ద ప్రదేశాలలో వాల్యూమ్‌ను తగ్గిస్తుంది.',
      example: 'గదుల్లో ఉన్నప్పుడు "మెల్లగా" అని చెప్పండి.',
    },
  },
  {
    id: 'language',
    category: 'control',
    en: {
      command: 'Hindi / English / Telugu',
      alias: ['"Switch to Hindi"', '"English"'],
      action: 'Switches the spoken announcements and UI prompts dynamically.',
      example: 'Say "Hindi" or "English" to toggle voice language.',
    },
    hi: {
      command: 'हिन्दी / अंग्रेज़ी / तेलुगु',
      alias: ['"हिन्दी करो"', '"अंग्रेज़ी"'],
      action: 'भाषा को तुरंत हिन्दी, अंग्रेज़ी या तेलुगु में बदलता है।',
      example: '"हिन्दी" या "अंग्रेज़ी" बोलकर भाषा बदलें।',
    },
    te: {
      command: 'తెలుగు / హిందీ / ఇంగ్లీష్',
      alias: ['"తెలుగు"', '"ఇంగ్లీష్"'],
      action: 'వాయిస్ అనౌన్స్‌మెంట్‌ల భాషను తక్షణమే మారుస్తుంది.',
      example: '"తెలుగు" లేదా "హిందీ" అని చెప్పండి.',
    },
  },
  {
    id: 'feedback',
    category: 'feedback',
    en: {
      command: 'Correct / Wrong',
      alias: ['"Correct"', '"Wrong"'],
      action: 'Submits user verification feedback on the last detected hazard.',
      example: 'Say "Correct" if you verified the pothole with your cane.',
    },
    hi: {
      command: 'सही / गलत',
      alias: ['"सही"', '"गलत"'],
      action: 'अंतिम पहचाने गए खतरे के बारे में पुष्टि या सुधार दर्ज करता है।',
      example: 'छड़ी से गड्ढे की पुष्टि होने पर "सही" बोलें।',
    },
    te: {
      command: 'సరైనది / తప్పు',
      alias: ['"సరైనది"', '"తప్పు"'],
      action: 'చివరి హెచ్చరికపై మీ అభిప్రాయాన్ని నమోదు చేస్తుంది.',
      example: 'కర్రతో గుర్తించినప్పుడు "సరైనది" అని చెప్పండి.',
    },
  },
  {
    id: 'help',
    category: 'core',
    en: {
      command: 'Help / Assistance',
      alias: ['"Help"', '"What can I say"'],
      action: 'Speaks the available voice command list aloud through TTS.',
      example: 'Say "Help" anytime to hear the spoken command guide.',
    },
    hi: {
      command: 'मदद / सहायता',
      alias: ['"मदद"', '"कमांड बताओ"'],
      action: 'उपलब्ध सभी वॉयस आदेशों की सूची बोलकर सुनाता है।',
      example: 'सभी आदेश सुनने के लिए कभी भी "मदद" कहें।',
    },
    te: {
      command: 'సహాయం / హెల్ప్',
      alias: ['"సహాయం"', '"కమాండ్లు చెప్పు"'],
      action: 'అందుబాటులో ఉన్న ఆదేశాలను బిగ్గరగా చదివి వినిపిస్తుంది.',
      example: 'ఆదేశాల జాబితా వినడానికి "సహాయం" అని చెప్పండి.',
    },
  },
];

export const VoiceCommandsModal: React.FC<VoiceCommandsModalProps> = ({
  isOpen,
  onClose,
  language,
  onSelectPrompt,
}) => {
  // Toggle between English and Hindi prompt displays inside the modal
  const [promptLang, setPromptLang] = useState<'en' | 'hi'>(
    language === 'hi' ? 'hi' : 'en'
  );

  const [activeCategory, setActiveCategory] = useState<'all' | 'core' | 'mobility' | 'control' | 'feedback'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const isHindiMode = promptLang === 'hi';

  const speakPrompt = (text: string) => {
    speechEngine.speak(text, {
      language: isHindiMode ? 'hi' : 'en',
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      interrupt: true,
    });
  };

  const handlePromptClick = (examplePhrase: string, id: string) => {
    setCopiedId(id);
    speakPrompt(examplePhrase);
    if (onSelectPrompt) {
      onSelectPrompt(examplePhrase);
    }
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredCommands = activeCategory === 'all'
    ? VOICE_COMMANDS
    : VOICE_COMMANDS.filter((c) => c.category === activeCategory);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-commands-title"
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in"
    >
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-[var(--border)] flex items-start justify-between gap-4 bg-[var(--surface-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center shrink-0 shadow-sm">
              <Mic className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-[var(--accent)]">
                  Hands-Free Voice System
                </span>
                <span className="text-[var(--ink-muted)]">·</span>
                <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active Listener
                </span>
              </div>
              <h2 id="voice-commands-title" className="text-xl font-extrabold text-[var(--ink)] tracking-tight">
                {isHindiMode ? 'उपलब्ध वॉयस कमांड्स (Voice Commands)' : 'Available Voice Commands'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-[var(--radius-input)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface)] transition cursor-pointer border border-transparent hover:border-[var(--border)]"
            aria-label={isHindiMode ? 'संवाद बंद करें' : 'Close voice commands dialog'}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Toolbar: English / Hindi Prompt Toggle + Category Tabs */}
        <div className="px-5 py-3 border-b border-[var(--border-subtle)] bg-[var(--surface)] flex flex-wrap items-center justify-between gap-3">
          
          {/* Toggle between Hindi & English Prompts */}
          <div className="flex items-center gap-1.5 p-1 rounded-[var(--radius-input)] bg-[var(--surface-subtle)] border border-[var(--border)]">
            <Globe className="w-3.5 h-3.5 text-[var(--accent)] ml-1.5 shrink-0" aria-hidden="true" />
            <span className="text-xs font-mono font-medium text-[var(--ink-muted)] mr-1">
              Prompt Language:
            </span>
            <button
              onClick={() => setPromptLang('en')}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded cursor-pointer transition ${
                promptLang === 'en'
                  ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-xs'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
              }`}
              aria-pressed={promptLang === 'en'}
            >
              English
            </button>
            <button
              onClick={() => setPromptLang('hi')}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded cursor-pointer transition ${
                promptLang === 'hi'
                  ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-xs'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
              }`}
              aria-pressed={promptLang === 'hi'}
            >
              हिन्दी (Hindi)
            </button>
          </div>

          {/* Read Aloud All Commands */}
          <button
            onClick={() => {
              const fullSpeech = isHindiMode
                ? 'उपलब्ध मुख्य वॉयस आदेश हैं: शुरू, बंद, पढ़ो, विवरण, दोहराएं, तेज़, धीमे, सही, गलत, और मदद। किसी भी आदेश को टेस्ट करने के लिए उस पर क्लिक करें।'
                : 'Available voice commands are: Start, Stop, Read, Describe, Repeat, Louder, Quieter, Correct, Wrong, and Help. Say any command to control DrishtiAssist hands-free.';
              speakPrompt(fullSpeech);
            }}
            className="flex items-center gap-1.5 text-xs font-mono font-semibold px-2.5 py-1.5 rounded-[var(--radius-input)] border border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--ink)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition cursor-pointer"
            aria-label={isHindiMode ? 'सभी कमांड्स बोलकर सुनाएं' : 'Listen to all commands aloud'}
          >
            <Volume2 className="w-3.5 h-3.5 text-[var(--accent)]" aria-hidden="true" />
            <span>{isHindiMode ? 'सुनें (Listen All)' : 'Listen All'}</span>
          </button>
        </div>

        {/* Category Filters */}
        <div className="px-5 py-2 border-b border-[var(--border-subtle)] flex items-center gap-1.5 overflow-x-auto text-xs font-mono">
          {[
            { id: 'all', labelEn: 'All Commands (10)', labelHi: 'सभी (10)' },
            { id: 'core', labelEn: 'Core Actions', labelHi: 'मुख्य क्रियाएं' },
            { id: 'mobility', labelEn: 'Mobility & Vision', labelHi: 'गतिशीलता व विज़न' },
            { id: 'control', labelEn: 'Audio & Volume', labelHi: 'ऑडियो व वॉल्यूम' },
            { id: 'feedback', labelEn: 'Feedback Verification', labelHi: 'प्रतिक्रिया' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-2.5 py-1 rounded font-semibold whitespace-nowrap cursor-pointer transition ${
                activeCategory === cat.id
                  ? 'bg-[var(--ink)] text-[var(--surface)]'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-subtle)]'
              }`}
            >
              {isHindiMode ? cat.labelHi : cat.labelEn}
            </button>
          ))}
        </div>

        {/* Commands List Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-3 max-h-[55vh] focus:outline-none" tabIndex={0}>
          {filteredCommands.map((item) => {
            const data = isHindiMode ? item.hi : item.en;
            const isCopied = copiedId === item.id;

            return (
              <div
                key={item.id}
                className="p-4 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] transition shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-extrabold text-[var(--ink)] tracking-tight">
                      {data.command}
                    </span>
                    <div className="flex items-center gap-1">
                      {data.alias.map((al, idx) => (
                        <span
                          key={idx}
                          className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--ink-muted)] border border-[var(--border-subtle)]"
                        >
                          {al}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-[var(--ink)] font-medium leading-relaxed">
                    {data.action}
                  </p>

                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--ink-muted)] italic">
                    <Sparkles className="w-3 h-3 text-[var(--accent)] shrink-0" />
                    <span>{data.example}</span>
                  </div>
                </div>

                {/* Action: Test speech & select prompt */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handlePromptClick(data.example, item.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-input)] border border-[var(--border)] bg-[var(--surface-subtle)] hover:bg-[var(--accent-tint)] hover:text-[var(--accent)] hover:border-[var(--accent)] text-xs font-mono font-bold transition cursor-pointer"
                    title={isHindiMode ? 'यह वाक्यांश बोलकर सुनें' : 'Listen to this command prompt'}
                    aria-label={`Listen to ${data.command} example`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Spoken!</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{isHindiMode ? 'सुनें (Speak)' : 'Speak Prompt'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info note */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[var(--ink-muted)]">
            <HelpCircle className="w-4 h-4 text-[var(--accent)] shrink-0" />
            <span>
              {isHindiMode
                ? 'माइक चालू होने पर आप कभी भी "मदद" बोल सकते हैं।'
                : 'You can say "Help" anytime hands-free when voice listening is enabled.'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-[var(--radius-input)] bg-[var(--ink)] text-[var(--surface)] hover:opacity-90 font-mono font-bold text-xs transition cursor-pointer"
          >
            {isHindiMode ? 'समझ गया / बंद करें' : 'Got it, Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
