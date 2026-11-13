import { SupportedLanguage } from '../types';

export type SpeechLogCallback = (entry: {
  text: string;
  language: SupportedLanguage;
  timestamp: number;
  isDanger?: boolean;
}) => void;

export type VoiceCommandHandler = (command: string) => void;

export class SpeechEngine {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private recognition: any = null;
  private isListening: boolean = false;
  private onSpeechLogged: SpeechLogCallback | null = null;
  private onCommandReceived: VoiceCommandHandler | null = null;
  private lastSpokenText: string = '';

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices(): void {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  public setLogCallback(cb: SpeechLogCallback): void {
    this.onSpeechLogged = cb;
  }

  public setCommandCallback(cb: VoiceCommandHandler): void {
    this.onCommandReceived = cb;
  }

  public hasVoiceForLanguage(lang: SupportedLanguage): boolean {
    if (!this.synth) return false;
    const target = lang === 'te' ? 'te' : lang === 'hi' ? 'hi' : 'en';
    return this.voices.some((v) => v.lang.toLowerCase().startsWith(target));
  }

  /**
   * Speaks text using speech synthesis with priority interrupt support.
   */
  public speak(
    text: string,
    options: {
      language: SupportedLanguage;
      interrupt?: boolean;
      rate?: number;
      pitch?: number;
      volume?: number;
    }
  ): void {
    if (!this.synth || !text) return;

    const {
      language = 'en',
      interrupt = false,
      rate = 1.05,
      pitch = 1.0,
      volume = 1.0,
    } = options;

    if (interrupt) {
      this.synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    // Pick best matching voice
    const targetTag = language === 'te' ? 'te-in' : language === 'hi' ? 'hi-in' : 'en-in';
    const targetPrefix = language === 'te' ? 'te' : language === 'hi' ? 'hi' : 'en';

    let matchedVoice =
      this.voices.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith(targetTag)) ||
      this.voices.find((v) => v.lang.toLowerCase().startsWith(targetPrefix));

    // Fallback: If no Telugu or Hindi voice, pick Indian English voice
    if (!matchedVoice && (language === 'te' || language === 'hi')) {
      matchedVoice = this.voices.find((v) => v.lang.toLowerCase().startsWith('en-in')) || this.voices[0];
    }

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }
    utterance.lang = language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';

    this.lastSpokenText = text;

    if (this.onSpeechLogged) {
      this.onSpeechLogged({
        text,
        language,
        timestamp: Date.now(),
        isDanger: interrupt,
      });
    }

    try {
      this.synth.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }

  public cancel(): void {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  public getLastSpokenText(): string {
    return this.lastSpokenText;
  }

  /**
   * Hands-free voice commands using Web Speech Recognition
   */
  public startListening(language: SupportedLanguage = 'en'): boolean {
    if (typeof window === 'undefined') return false;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return false;
    }

    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {}
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang =
        language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';

      this.recognition.onresult = (event: any) => {
        const lastResultIndex = event.results.length - 1;
        const transcript = event.results[lastResultIndex][0].transcript.trim().toLowerCase();
        this.processVoiceCommand(transcript);
      };

      this.recognition.onerror = (err: any) => {
        if (err.error !== 'aborted' && err.error !== 'no-speech') {
          console.warn('Speech recognition notice:', err.error);
        }
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          try {
            this.recognition.start();
          } catch {}
        }
      };

      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (err) {
      return false;
    }
  }

  public stopListening(): void {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {}
      this.recognition = null;
    }
  }

  public isVoiceListening(): boolean {
    return this.isListening;
  }

  private processVoiceCommand(phrase: string): void {
    console.log('Voice command heard:', phrase);
    let matchedCommand = '';

    // English, Hindi & Telugu matches
    if (
      phrase.includes('start') ||
      phrase.includes('begin') ||
      phrase.includes('शुरू') ||
      phrase.includes('ప్రారంభ') ||
      phrase.includes('మొదలు')
    ) {
      matchedCommand = 'start';
    } else if (
      phrase.includes('stop') ||
      phrase.includes('pause') ||
      phrase.includes('रुक') ||
      phrase.includes('बंद') ||
      phrase.includes('ఆపు') ||
      phrase.includes('ఆపండి')
    ) {
      matchedCommand = 'stop';
    } else if (
      phrase.includes('read') ||
      phrase.includes('ocr') ||
      phrase.includes('sign') ||
      phrase.includes('पढ़') ||
      phrase.includes('पढ') ||
      phrase.includes('చదువు') ||
      phrase.includes('చదవండి')
    ) {
      matchedCommand = 'read';
    } else if (
      phrase.includes('describe') ||
      phrase.includes('scene') ||
      phrase.includes('विवरण') ||
      phrase.includes('बताओ') ||
      phrase.includes('వివరణ') ||
      phrase.includes('వివరించు')
    ) {
      matchedCommand = 'describe';
    } else if (
      phrase.includes('repeat') ||
      phrase.includes('again') ||
      phrase.includes('दोहरा') ||
      phrase.includes('మళ్ళీ') ||
      phrase.includes('మరలా')
    ) {
      matchedCommand = 'repeat';
    } else if (
      phrase.includes('louder') ||
      phrase.includes('volume up') ||
      phrase.includes('तेज़') ||
      phrase.includes('పెంచు') ||
      phrase.includes('గట్టిగా')
    ) {
      matchedCommand = 'louder';
    } else if (
      phrase.includes('quieter') ||
      phrase.includes('volume down') ||
      phrase.includes('धीमे') ||
      phrase.includes('తగ్గించు') ||
      phrase.includes('మెల్లగా')
    ) {
      matchedCommand = 'quieter';
    } else if (phrase.includes('telugu') || phrase.includes('తెలుగు')) {
      matchedCommand = 'telugu';
    } else if (phrase.includes('hindi') || phrase.includes('हिन्दी') || phrase.includes('हिंदी')) {
      matchedCommand = 'hindi';
    } else if (phrase.includes('english') || phrase.includes('अंग्रेजी') || phrase.includes('ఇంగ్లీష్')) {
      matchedCommand = 'english';
    } else if (
      phrase.includes('help') ||
      phrase.includes('मदद') ||
      phrase.includes('सहायता') ||
      phrase.includes('సహాయం')
    ) {
      matchedCommand = 'help';
    } else if (
      phrase.includes('wrong') ||
      phrase.includes('incorrect') ||
      phrase.includes('गलत') ||
      phrase.includes('తప్పు')
    ) {
      matchedCommand = 'wrong';
    } else if (
      phrase.includes('correct') ||
      phrase.includes('right') ||
      phrase.includes('सही') ||
      phrase.includes('సరైనది') ||
      phrase.includes('సరి')
    ) {
      matchedCommand = 'correct';
    }

    if (matchedCommand && this.onCommandReceived) {
      this.onCommandReceived(matchedCommand);
    }
  }
}

export const speechEngine = new SpeechEngine();
