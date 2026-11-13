import React, { useState, useRef, useEffect } from 'react';
import { SupportedLanguage } from '../types';
import { Send, Bot, User, Sparkles, RefreshCw, Volume2, ShieldCheck, Compass, Zap } from 'lucide-react';
import { Button } from './ui/Button';
import { speechEngine } from '../services/speechEngine';

interface GeminiChatbotProps {
  language: SupportedLanguage;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  modelUsed?: string;
  timestamp: string;
}

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({ language }) => {
  const isHi = language === 'hi';
  const isTe = language === 'te';

  const [model, setModel] = useState<'gemini-4-argon' | 'gemini-3.8-flash' | 'gemini-3.1-flash-lite'>('gemini-3.8-flash');
  const [systemRole, setSystemRole] = useState<'mobility_guide' | 'safety_assistant' | 'rehab_trainer'>('mobility_guide');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-0',
      role: 'assistant',
      text: isTe
        ? 'నమస్కారం! నేను దృష్టి AI మొబిలిటీ గైడ్. రోడ్డు నడక భద్రత, కర్ర టెక్నిక్ లేదా మార్గాల గురించి నన్ను ఏమైనా అడగండి.'
        : isHi
        ? 'नमस्ते! मैं दृष्टि AI मोबिलिटी गाइड हूँ। पैदल मार्ग सुरक्षा, सफेद छड़ी तकनीक या दिशा-निर्देशों के बारे में बेझिझक पूछें।'
        : 'Hello! I am your Drishti AI Mobility Guide. Ask me anything about tactile cane techniques, sidewalk navigation, avoiding road hazards, or route planning.',
      modelUsed: 'gemini-3.8-flash',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, text: m.text })),
          model,
          systemRole,
          language,
        }),
      });

      const data = await res.json();
      const replyText = data.reply || (isTe ? 'సమాధానం లభించలేదు.' : isHi ? 'उत्तर प्राप्त नहीं हो सका।' : 'Unable to get response.');

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: replyText,
        modelUsed: data.model || model,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: 'Error connecting to Gemini Chat API. Please check your network.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = (text: string) => {
    speechEngine.speak(text, { language, interrupt: true });
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `reset-${Date.now()}`,
        role: 'assistant',
        text: isTe ? 'సంభాషణ రీసెట్ చేయబడింది.' : isHi ? 'संवाद रीसेट किया गया।' : 'Conversation reset. How can I assist you?',
        modelUsed: model,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* Controls Bar: Model & Role Selection */}
      <div className="p-4 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] flex flex-wrap items-center justify-between gap-4">
        
        {/* Model Picker */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold uppercase text-[var(--ink-muted)]">Model:</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setModel('gemini-3.8-flash')}
              className={`px-2.5 py-1 rounded-[var(--radius-input)] text-xs font-mono font-semibold transition cursor-pointer ${
                model === 'gemini-3.8-flash'
                  ? 'bg-[var(--accent)] text-[var(--accent-text)]'
                  : 'bg-[var(--surface-subtle)] text-[var(--ink)] hover:bg-[var(--surface-subtle)]/80'
              }`}
            >
              gemini-3.8-flash (General)
            </button>
            <button
              onClick={() => setModel('gemini-3.1-flash-lite')}
              className={`px-2.5 py-1 rounded-[var(--radius-input)] text-xs font-mono font-semibold transition cursor-pointer ${
                model === 'gemini-3.1-flash-lite'
                  ? 'bg-[var(--accent)] text-[var(--accent-text)]'
                  : 'bg-[var(--surface-subtle)] text-[var(--ink)] hover:bg-[var(--surface-subtle)]/80'
              }`}
            >
              gemini-3.1-flash-lite (Fast)
            </button>
            <button
              onClick={() => setModel('gemini-4-argon')}
              className={`px-2.5 py-1 rounded-[var(--radius-input)] text-xs font-mono font-semibold transition cursor-pointer ${
                model === 'gemini-4-argon'
                  ? 'bg-[var(--accent)] text-[var(--accent-text)]'
                  : 'bg-[var(--surface-subtle)] text-[var(--ink)] hover:bg-[var(--surface-subtle)]/80'
              }`}
            >
              gemini-4-argon (Complex)
            </button>
          </div>
        </div>

        {/* System Role Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold uppercase text-[var(--ink-muted)]">Role:</span>
          <select
            value={systemRole}
            onChange={(e) => setSystemRole(e.target.value as any)}
            className="px-2.5 py-1 rounded-[var(--radius-input)] text-xs font-mono bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--ink)] cursor-pointer"
          >
            <option value="mobility_guide">🚶 Mobility & Navigation Guide</option>
            <option value="safety_assistant">🚨 Emergency & Safety Assistant</option>
            <option value="rehab_trainer">🎓 O&M Rehab Trainer</option>
          </select>

          <Button variant="ghost" size="sm" onClick={handleClearChat} aria-label="Clear chat history">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Scrollable Messages Thread */}
      <div className="rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] p-4 flex flex-col h-[480px]">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${
                m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  m.role === 'user'
                    ? 'bg-[var(--accent)] text-[var(--accent-text)]'
                    : 'bg-[var(--surface-subtle)] text-[var(--ink)] border border-[var(--border)]'
                }`}
              >
                {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[80%] rounded-[var(--radius-card)] p-3 text-xs leading-relaxed space-y-1.5 ${
                  m.role === 'user'
                    ? 'bg-[var(--accent)] text-[var(--accent-text)]'
                    : 'bg-[var(--surface-subtle)] text-[var(--ink)] border border-[var(--border)]'
                }`}
              >
                <div className="flex items-center justify-between gap-4 font-mono text-[10px] opacity-75">
                  <span className="font-bold uppercase">
                    {m.role === 'user' ? 'You' : `Drishti AI (${m.modelUsed || model})`}
                  </span>
                  <span>{m.timestamp}</span>
                </div>

                <p className="text-sm whitespace-pre-wrap">{m.text}</p>

                {m.role === 'assistant' && (
                  <div className="pt-1 flex items-center justify-end">
                    <button
                      onClick={() => handleSpeak(m.text)}
                      className="p-1 rounded text-[var(--accent)] hover:opacity-80 transition cursor-pointer flex items-center gap-1 font-mono text-[10px] font-bold"
                      aria-label="Read message aloud"
                    >
                      <Volume2 className="w-3.5 h-3.5" /> Read
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--surface-subtle)] flex items-center justify-center text-[var(--accent)]">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3 rounded-[var(--radius-card)] bg-[var(--surface-subtle)] border border-[var(--border)] text-xs text-[var(--ink-muted)] font-mono animate-pulse">
                Thinking with {model}...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form Bar */}
        <form onSubmit={handleSubmit} className="flex gap-2 pt-3 border-t border-[var(--border-subtle)] mt-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isTe
                ? 'ప్రశ్నను ఇక్కడ టైప్ చేయండి (ఉదా. మెట్లు దిగేటప్పుడు కర్రను ఎలా ఉపయోగించాలి?)...'
                : isHi
                ? 'अपना प्रश्न यहाँ लिखें (उदा. सीढ़ियों पर छड़ी का उपयोग कैसे करें?)...'
                : 'Ask a question (e.g., How should I position my white cane when approaching stairs?)...'
            }
            className="flex-1 px-3 py-2.5 rounded-[var(--radius-input)] bg-[var(--surface-subtle)] border border-[var(--border)] text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
            disabled={isLoading}
          />
          <Button type="submit" variant="primary" disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4 mr-1.5" /> Send
          </Button>
        </form>
      </div>
    </div>
  );
};
