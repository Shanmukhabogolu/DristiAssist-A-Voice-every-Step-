import React, { useState, useEffect, useRef } from 'react';
import { Lock, X, CheckCircle2, User, KeyRound } from 'lucide-react';
import { SupportedLanguage } from '../types';
import { Button } from './ui/Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  language: SupportedLanguage;
}

export const SignInModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  language,
}) => {
  const [email, setEmail] = useState('reviewer@drishtiassist.org');
  const [role, setRole] = useState<'admin' | 'reviewer'>('admin');
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      localStorage.setItem('drishti_auth_user', JSON.stringify({ email, role, signedInAt: Date.now() }));
      onSuccess();
    }, 400);
  };

  const isHi = language === 'hi';
  const isTe = language === 'te';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signin-modal-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl relative space-y-5 animate-in zoom-in-95 duration-200"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-subtle)] transition cursor-pointer"
          aria-label={isHi ? 'बंद करें' : isTe ? 'మూసివేయి' : 'Close'}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-tint)] text-[var(--accent)] flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 id="signin-modal-title" className="text-lg font-bold text-[var(--ink)]">
              {isTe
                ? 'డాష్‌బోర్డ్ సైన్-ఇన్'
                : isHi
                ? 'डैशबोर्ड साइन-इन'
                : 'Admin & Telemetry Sign-In'}
            </h2>
            <p className="text-xs text-[var(--ink-muted)]">
              {isTe
                ? 'కార్యాచరణ టెలిమెట్రీని యాక్సెస్ చేయడానికి కొనసాగండి'
                : isHi
                ? 'परिचालन टेलीमेट्री देखने के लिए अधिकृत करें'
                : 'Authorized access for telemetry review & data verification'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
              {isTe ? 'అధీకృత ఇమెయిల్' : isHi ? 'अधिकृत ईमेल' : 'Authorized Email'}
            </label>
            <div className="relative">
              <input
                ref={firstInputRef}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
              />
              <User className="w-4 h-4 text-[var(--ink-muted)] absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
              {isTe ? 'పాత్ర' : isHi ? 'भूमिका' : 'Access Role'}
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`py-2 px-3 rounded-lg border text-center font-medium cursor-pointer transition ${
                  role === 'admin'
                    ? 'border-[var(--accent)] bg-[var(--accent-tint)] text-[var(--accent)] font-bold'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]'
                }`}
              >
                Lead Engineer / Admin
              </button>
              <button
                type="button"
                onClick={() => setRole('reviewer')}
                className={`py-2 px-3 rounded-lg border text-center font-medium cursor-pointer transition ${
                  role === 'reviewer'
                    ? 'border-[var(--accent)] bg-[var(--accent-tint)] text-[var(--accent)] font-bold'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]'
                }`}
              >
                Partner Reviewer
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Button variant="ghost" size="sm" type="button" onClick={onClose}>
              {isTe ? 'రద్దు చేయి' : isHi ? 'रद्द करें' : 'Cancel'}
            </Button>
            <Button size="md" type="submit" isLoading={isLoading} hasArrow>
              {isTe ? 'డాష్‌బోర్డ్‌ను తెరవండి' : isHi ? 'डैशबोर्ड खोलें' : 'Access Dashboard'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
