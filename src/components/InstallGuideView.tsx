import React, { useState, useEffect } from 'react';
import { PWAInstallButton } from './PWAInstallButton';
import { Download, Smartphone, Apple, CheckCircle2, Wifi, WifiOff } from 'lucide-react';

import { SupportedLanguage } from '../types';

interface Props {
  language: SupportedLanguage;
}

export const InstallGuideView: React.FC<Props> = ({ language }) => {
  const isHi = language === 'hi';
  const isTe = language === 'te';
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8">
      
      {/* Title */}
      <div className="text-center space-y-3">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          {isHi ? 'दृष्टि असिस्ट इंस्टॉल करें' : 'Install DrishtiAssist on Your Phone'}
        </h1>
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          {isHi
            ? 'बिना प्ले स्टोर या ऐप स्टोर के सीधे अपने फोन की होम स्क्रीन पर जोड़ें। यह पूरी तरह ऑफ़लाइन काम करता है।'
            : 'Install directly to your home screen as a standalone Progressive Web App (PWA). Works 100% offline without Play Store downloads.'}
        </p>
      </div>

      {/* Online/Offline Status Diagnostic Card */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isOnline ? (
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Wifi className="w-5 h-5" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <WifiOff className="w-5 h-5" />
            </div>
          )}
          <div>
            <h2 className="text-sm font-bold text-white">
              {isOnline
                ? isHi ? 'इंटरनेट कनेक्टेड (मॉडल कैश्ड)' : 'Connected (Model & Assets Cached)'
                : isHi ? 'ऑफ़लाइन मोड सक्रिय' : 'Offline Mode Active'}
            </h2>
            <p className="text-xs text-slate-400">
              {isHi
                ? 'दृष्टि असिस्ट का न्यूरल नेटवर्क आपके फोन में सुरक्षित है।'
                : 'TensorFlow.js CNN weights and labels are cached for offline navigation.'}
            </p>
          </div>
        </div>

        <div>
          <PWAInstallButton language={language} />
        </div>
      </div>

      {/* Platform Instructions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Android Instructions */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isHi ? 'एंड्रॉयड (Android / Chrome)' : 'Android (Chrome / Brave)'}
              </h2>
              <span className="text-xs text-slate-400">
                {isHi ? 'सर्वोत्तम अनुभव' : 'Recommended for Indian budget phones'}
              </span>
            </div>
          </div>

          <ol className="space-y-3 text-sm text-slate-300 list-decimal list-inside leading-relaxed">
            <li>
              {isHi
                ? 'ऊपर दिए गए पीले "ऐप इंस्टॉल करें" बटन को दबाएं।'
                : 'Tap the yellow "Install App" button at the top of the screen.'}
            </li>
            <li>
              {isHi
                ? 'यदि बटन न दिखे, तो क्रोम में ऊपर दाईं ओर तीन डॉट्स (⋮) दबाएं।'
                : 'If the prompt does not appear, tap Chrome menu (⋮) in the top-right.'}
            </li>
            <li>
              {isHi
                ? '"होम स्क्रीन में जोड़ें" (Add to Home screen) या "ऐप इंस्टॉल करें" चुनें।'
                : 'Select "Add to Home screen" or "Install app".'}
            </li>
            <li>
              {isHi
                ? 'पुष्टि करें। अब दृष्टि असिस्ट ऐप आइकन की तरह फुल-स्क्रीन चलेगा।'
                : 'Confirm. DrishtiAssist will now open full-screen with native camera performance.'}
            </li>
          </ol>
        </div>

        {/* iOS Instructions */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Apple className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isHi ? 'एप्पल आईफोन (iPhone / Safari)' : 'Apple iPhone (Safari)'}
              </h2>
              <span className="text-xs text-slate-400">iOS 16.4+</span>
            </div>
          </div>

          <ol className="space-y-3 text-sm text-slate-300 list-decimal list-inside leading-relaxed">
            <li>
              {isHi
                ? 'इस पेज को केवल Safari ब्राउज़र में खोलें।'
                : 'Open this website in Safari on your iPhone.'}
            </li>
            <li>
              {isHi
                ? 'सफारी के नीचे शेयर बटन (तीर वाला बॉक्स) दबाएं।'
                : 'Tap the Share icon (square with upward arrow) in the Safari toolbar.'}
            </li>
            <li>
              {isHi
                ? 'नीचे स्क्रॉल करें और "Add to Home Screen" (होम स्क्रीन में जोड़ें) चुनें।'
                : 'Scroll down and tap "Add to Home Screen".'}
            </li>
            <li>
              {isHi
                ? 'ऊपर दाएं कोने में "Add" दबाएं।'
                : 'Tap "Add" in the top-right corner.'}
            </li>
          </ol>
        </div>

      </div>

      {/* Offline Verification Checklist */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          {isHi ? 'ऑफ़लाइन तत्परता चेकलिस्ट' : 'Offline Readiness Verification'}
        </h2>
        <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">✓</span>
            <span>{isHi ? '128x128 सीएनएन मॉडल ब्राउज़र कैश में उपलब्ध' : '128x128 CNN Model files cached in browser storage'}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">✓</span>
            <span>{isHi ? 'वेब स्पीच ऑडियो इंजन बिना इंटरनेट काम करने के लिए तैयार' : 'Web Speech API works natively without internet connection'}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">✓</span>
            <span>{isHi ? '3D स्टीरियो ऑडियो बीप स्थानीय वेब ऑडियो एपीआई पर आधारित' : '3D stereo beeps run entirely locally on Web Audio API'}</span>
          </li>
        </ul>
      </div>

    </div>
  );
};
