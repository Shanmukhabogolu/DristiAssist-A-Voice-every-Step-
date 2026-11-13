import React from 'react';
import { AppSettings } from '../types';
import { TRANSLATIONS } from '../i18n/translations';
import { speechEngine } from '../services/speechEngine';
import { audioEngine } from '../services/audioEngine';
import { useTheme } from '../context/ThemeContext';
import { AppTheme } from '../tokens/tokens';
import { X, Volume2, Sliders, Globe } from 'lucide-react';
import { Button } from './ui/Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

export const SettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  settings,
  updateSettings,
}) => {
  if (!isOpen) return null;

  const { theme, setTheme, reducedMotion, setReducedMotion } = useTheme();
  const t = TRANSLATIONS[settings.language];

  const handleTestVoice = () => {
    audioEngine.triggerHaptic('click');
    const sample =
      settings.language === 'te'
        ? 'పరీక్ష హెచ్చరిక: ముందు మెట్లు ఉన్నాయి, కర్రను జాగ్రత్తగా వాడండి.'
        : settings.language === 'hi'
        ? 'परीक्षण सूचना: सामने सीढ़ी, अपनी छड़ी आगे रखें।'
        : 'Test alert: Stairs ahead, keep cane forward.';
    speechEngine.speak(sample, {
      language: settings.language,
      rate: settings.speechRate,
      pitch: settings.speechPitch,
      volume: settings.speechVolume,
      interrupt: true,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] p-6 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[var(--accent)]" aria-hidden="true" />
            <h2 id="settings-title" className="text-lg font-bold text-[var(--ink)]">
              {settings.language === 'te'
                ? 'దృష్టి అసిస్ట్ సెట్టింగ్‌లు'
                : settings.language === 'hi'
                ? 'दृष्टि असिस्ट सेटिंग्स'
                : 'DrishtiAssist Settings'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-input)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-subtle)] transition cursor-pointer"
            aria-label="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Theme Selection */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--ink-muted)] block">
            Visual Theme
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['light', 'classic', 'contrast'] as AppTheme[]).map((tKey) => (
              <button
                key={tKey}
                onClick={() => setTheme(tKey)}
                className={`py-2 px-3 rounded-[var(--radius-input)] text-xs font-mono font-semibold capitalize border transition cursor-pointer ${
                  theme === tKey
                    ? 'bg-[var(--accent)] text-[var(--accent-text)] border-[var(--accent)]'
                    : 'bg-[var(--surface)] border-[var(--border)] text-[var(--ink)] hover:bg-[var(--surface-subtle)]'
                }`}
              >
                {tKey}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Language Selection */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--ink-muted)] block">
            Language / भाषा / భాష
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => updateSettings({ language: 'en' })}
              className={`py-2.5 px-2 rounded-[var(--radius-input)] text-xs font-mono font-semibold border transition cursor-pointer text-center ${
                settings.language === 'en'
                  ? 'bg-[var(--accent)] text-[var(--accent-text)] border-[var(--accent)]'
                  : 'bg-[var(--surface)] border-[var(--border)] text-[var(--ink)] hover:bg-[var(--surface-subtle)]'
              }`}
            >
              English
            </button>
            <button
              onClick={() => updateSettings({ language: 'hi' })}
              className={`py-2.5 px-2 rounded-[var(--radius-input)] text-xs font-mono font-semibold border transition cursor-pointer text-center ${
                settings.language === 'hi'
                  ? 'bg-[var(--accent)] text-[var(--accent-text)] border-[var(--accent)]'
                  : 'bg-[var(--surface)] border-[var(--border)] text-[var(--ink)] hover:bg-[var(--surface-subtle)]'
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => updateSettings({ language: 'te' })}
              className={`py-2.5 px-2 rounded-[var(--radius-input)] text-xs font-mono font-semibold border transition cursor-pointer text-center ${
                settings.language === 'te'
                  ? 'bg-[var(--accent)] text-[var(--accent-text)] border-[var(--accent)]'
                  : 'bg-[var(--surface)] border-[var(--border)] text-[var(--ink)] hover:bg-[var(--surface-subtle)]'
              }`}
            >
              తెలుగు
            </button>
          </div>
        </div>

        {/* 3. Sensitivity & Cooldown */}
        <div className="space-y-4 pt-3 border-t border-[var(--border-subtle)]">
          <div className="flex justify-between items-center text-xs font-mono text-[var(--ink)]">
            <span className="font-semibold">Confidence Threshold</span>
            <span className="font-bold text-[var(--accent)] tabular-data">
              {Math.round(settings.confidenceThreshold * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.40"
            max="0.90"
            step="0.05"
            value={settings.confidenceThreshold}
            onChange={(e) => updateSettings({ confidenceThreshold: parseFloat(e.target.value) })}
            className="w-full accent-[var(--accent)] cursor-pointer"
          />
          <p className="text-[11px] text-[var(--ink-muted)]">
            Below this confidence level, Drishti refuses to guess and announces: "Not sure, use your cane carefully".
          </p>
        </div>

        {/* 4. Alert Cooldown */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-mono text-[var(--ink)]">
            <span className="font-semibold">Alert Cooldown</span>
            <span className="font-bold text-[var(--accent)] tabular-data">{settings.cooldownSeconds}s</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={settings.cooldownSeconds}
            onChange={(e) => updateSettings({ cooldownSeconds: parseInt(e.target.value) })}
            className="w-full accent-[var(--accent)] cursor-pointer"
          />
        </div>

        {/* 5. Audio & Motion Toggles */}
        <div className="space-y-3 pt-3 border-t border-[var(--border-subtle)] text-xs">
          <label className="flex items-center justify-between p-3 rounded-[var(--radius-input)] border border-[var(--border)] bg-[var(--surface-subtle)] cursor-pointer">
            <span className="font-medium text-[var(--ink)]">Stereo 3D Spatial Audio Beeps</span>
            <input
              type="checkbox"
              checked={settings.enableSpatialAudio}
              onChange={(e) => updateSettings({ enableSpatialAudio: e.target.checked })}
              className="accent-[var(--accent)] cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-[var(--radius-input)] border border-[var(--border)] bg-[var(--surface-subtle)] cursor-pointer">
            <span className="font-medium text-[var(--ink)]">Mobile Haptic Vibration on Danger</span>
            <input
              type="checkbox"
              checked={settings.enableHaptics}
              onChange={(e) => updateSettings({ enableHaptics: e.target.checked })}
              className="accent-[var(--accent)] cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-[var(--radius-input)] border border-[var(--border)] bg-[var(--surface-subtle)] cursor-pointer">
            <span className="font-medium text-[var(--ink)]">Keep Screen Awake (Wake Lock)</span>
            <input
              type="checkbox"
              checked={settings.keepScreenAwake}
              onChange={(e) => updateSettings({ keepScreenAwake: e.target.checked })}
              className="accent-[var(--accent)] cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-[var(--radius-input)] border border-[var(--border)] bg-[var(--surface-subtle)] cursor-pointer">
            <span className="font-medium text-[var(--ink)]">Pause Site Animations (Reduced Motion)</span>
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(e) => setReducedMotion(e.target.checked)}
              className="accent-[var(--accent)] cursor-pointer"
            />
          </label>
        </div>

        {/* Test Speech Button & Done */}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={handleTestVoice} className="flex-1">
            <Volume2 className="w-4 h-4 mr-1 text-[var(--accent)]" />
            Test Voice
          </Button>
          <Button variant="primary" onClick={onClose} className="flex-1">
            Done
          </Button>
        </div>

      </div>
    </div>
  );
};
