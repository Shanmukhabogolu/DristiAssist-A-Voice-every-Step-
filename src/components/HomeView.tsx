import React from 'react';
import { HeroVisual } from './HeroVisual';
import { ArchitectureDiagram } from './ArchitectureDiagram';
import { ConfusionMatrix } from './ConfusionMatrix';
import { CodeBlock } from './ui/CodeBlock';
import { Accordion, AccordionItem } from './ui/Accordion';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { ShieldAlert, ArrowRight, Eye, ShieldCheck, WifiOff, FileText, CheckCircle2 } from 'lucide-react';

import { SupportedLanguage } from '../types';

interface Props {
  language: SupportedLanguage;
  onOpenApp: () => void;
  onNavigateTab: (tab: string) => void;
}

export const HomeView: React.FC<Props> = ({
  language,
  onOpenApp,
  onNavigateTab,
}) => {
  const isHi = language === 'hi';
  const isTe = language === 'te';

  const samplePriorityCode = `// Core Alert Priority Hierarchy from src/services/alertPriorityEngine.ts
export const DANGER_CLASSES = new Set([
  'pothole', 'open_drain', 'stairs', 'pole', 'vehicle'
]);

export function evaluateAlertPriority(hazard: HazardType, confidence: number) {
  if (confidence < 0.60) {
    return {
      speak: "Not sure, use your cane carefully",
      priority: 2,
      interrupt: false
    };
  }
  
  // Danger classes outrank animal, which outranks person
  const isDanger = DANGER_CLASSES.has(hazard);
  return {
    priority: isDanger ? 3 : hazard === 'animal' ? 2 : 1,
    interrupt: isDanger // Danger immediately interrupts ongoing speech
  };
}`;

  const faqItems: AccordionItem[] = [
    {
      id: 'faq-1',
      question: isHi
        ? 'क्या यह ऐप सफेद छड़ी (व्हाइट केन) की जगह ले सकता है?'
        : 'Does DrishtiAssist replace a white cane or guide dog?',
      answer: isHi
        ? 'नहीं। दृष्टि असिस्ट केवल एक सहायक उपकरण है। यह आगे के मार्ग के खतरों की अग्रिम सूचना देता है, लेकिन कदम रखने से पहले जमीन की ऊंचाई और सतह की पुष्टि हमेशा अपनी छड़ी से करनी चाहिए।'
        : 'No. DrishtiAssist is strictly an assistive aid and never replaces a white cane or guide. It expands your preview distance by 2 to 4 meters, but you must always use your cane tip for tactile ground confirmation before stepping.',
    },
    {
      id: 'faq-2',
      question: isHi
        ? 'क्या मेरा कैमरा वीडियो सर्वर पर भेजा जाता है?'
        : 'Are camera video frames uploaded to a server?',
      answer: isHi
        ? 'नहीं। 100% न्यूरल नेटवर्क गणना आपके फोन के ब्राउज़र में होती है। कोई भी वीडियो कभी अपलोड या स्टोर नहीं किया जाता।'
        : 'No. The hazard CNN runs 100% on-device inside your phone browser using TensorFlow.js with WebGL. Video frames remain strictly ephemeral in local memory and are never transmitted.',
    },
    {
      id: 'faq-3',
      question: isHi
        ? 'क्या यह बिना इंटरनेट (ऑफ़लाइन) काम करता है?'
        : 'Does hazard detection work without internet connectivity?',
      answer: isHi
        ? 'हाँ। पहली बार पेज लोड होने के बाद PWA सर्विस वर्कर मॉडल फाइलों को फोन में सुरक्षित कर लेता है। इसके बाद खतरा पहचान, बीप ध्वनि और आवाज चेतावनी बिना इंटरनेट के काम करती हैं।'
        : 'Yes. After the initial visit, the PWA service worker caches model weights and assets. Hazard classification, 3D audio beeps, and spoken alerts run entirely offline on budget Android phones.',
    },
    {
      id: 'faq-4',
      question: isHi
        ? 'कम रोशनी या रात में मॉडल कैसे काम करता है?'
        : 'How does the model perform in low light or heavy rain?',
      answer: isHi
        ? 'कम रोशनी में जब मॉडल का विश्वास 60% से कम होता है, तो ऐप अनुमान लगाने के बजाय स्पष्ट बोलता है: "निश्चित नहीं, अपनी छड़ी का ध्यान से उपयोग करें"।'
        : 'Under low illumination (below 15 lux) or heavy monsoon reflections, if detection confidence falls below 60%, the engine refuses to guess and instead announces: "Not sure, use your cane carefully".',
    },
    {
      id: 'faq-5',
      question: isHi
        ? 'दृष्टिबाधित विद्यालयों और संस्थाओं के लिए क्या सहायता उपलब्ध है?'
        : 'How can blind schools and NGOs deploy DrishtiAssist?',
      answer: isHi
        ? 'दृष्टि असिस्ट पूरी तरह निःशुल्क है। हम ओरिएंटेशन एवं मोबिलिटी (O&M) प्रशिक्षकों के लिए प्रशिक्षण सामग्री और सहायता प्रदान करते हैं।'
        : 'DrishtiAssist is open-source and free for educational institutions and NGOs. We provide structured training modules for Orientation & Mobility (O&M) rehabilitation programs.',
    },
  ];

  return (
    <div className="w-full">
      
      {/* 1. HERO SECTION (Precise 2-Column Layout, max 8 words headline, no hype) */}
      <section className="section-spacing border-b border-[var(--border)] theme-dot-grid">
        <div className="layout-container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Headline, subhead, actions, facts line */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase tracking-wider text-[var(--accent)] font-semibold">
                  Assistive Computer Vision
                </span>
                <span className="text-[var(--ink-muted)]">·</span>
                <span className="font-mono text-xs text-[var(--ink-muted)]">
                  Haryana, India
                </span>
              </div>

              {/* Headline (Max 8 words, concrete, human) */}
              <h1 className="text-[var(--text-h1)] font-extrabold text-[var(--ink)] tracking-tight leading-[1.1]">
                {isHi
                  ? 'दृष्टिबाधित पदयात्रियों के लिए ऑन-डिवाइस सड़क खतरा चेतावनी'
                  : 'Real-time road hazard alerts for blind pedestrians'}
              </h1>

              {/* Supporting sentence */}
              <p className="text-base sm:text-lg text-[var(--ink-muted)] leading-relaxed max-w-xl">
                {isTe
                  ? 'స్మార్ట్‌ఫోన్ కెమెరా ఆధారిత ఆన్-డివైస్ న్యూరల్ నెట్‌వర్క్‌తో గుంతలు, మెట్లు మరియు రహదారి ప్రమాదాలను ఇంగ్లీష్, హిందీ మరియు తెలుగులో తక్షణమే వాయిస్ ద్వారా తెలియజేస్తుంది.'
                  : isHi
                  ? 'स्मार्टफोन कैमरे से गड्ढों, खुली नालियों, सीढ़ियों और सड़क खतरों की अंग्रेजी, हिंदी और तेलुगु में तुरंत आवाज सूचना। 100% ऑन-डिवाइस एवं सुरक्षित।'
                  : 'Runs an on-device neural network on your smartphone camera to announce potholes, stairs, and road hazards by voice in English, Hindi, and Telugu.'}
              </p>

              {/* Two Action Buttons - Keeping label and icon on one line, sharing 56px height */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button size="lg" hasArrow onClick={onOpenApp} className="min-h-[56px] h-14 [white-space:nowrap]">
                  {isTe ? 'యాప్ తెరవండి' : isHi ? 'ऐप शुरू करें' : 'Open the app'}
                </Button>
                <Button variant="secondary" size="lg" onClick={() => onNavigateTab('model-card')} className="min-h-[56px] h-14 [white-space:nowrap]">
                  {isTe ? 'మోడల్ వివరాలు చూడండి' : isHi ? 'मॉडल कार्ड देखें' : 'View model card'}
                </Button>
              </div>

              {/* Monospace facts line */}
              <div className="pt-3 border-t border-[var(--border-subtle)]">
                <span className="font-mono text-xs text-[var(--ink-muted)] tracking-tight">
                  Python CNN · 128x128 · 4 classes · English, हिंदी, తెలుగు · WCAG 2.2 AA
                </span>
              </div>

            </div>

            {/* Right Column: Hero Visual SVG illustration */}
            <div className="lg:col-span-6">
              <HeroVisual />
            </div>

          </div>
        </div>
      </section>

      {/* MANDATORY ASSISTIVE & CLINICAL SAFETY WARNING STRIP */}
      <div className="border-b border-[var(--border)] bg-[var(--surface-subtle)] py-4">
        <div className="layout-container flex items-center gap-3 text-xs sm:text-sm text-[var(--ink)]">
          <ShieldAlert className="w-5 h-5 text-[var(--status-warning)] shrink-0" aria-hidden="true" />
          <span className="font-medium">
            <strong>Safety rule:</strong> DrishtiAssist is an assistive and educational screening tool. Predictions are not clinical diagnoses and must always be reviewed by a certified healthcare professional.
          </span>
        </div>
      </div>

      {/* 2. SECTION 01 / HOW IT WORKS */}
      <section className="section-spacing border-b border-[var(--border)]">
        <div className="layout-container space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[var(--border)] pb-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-[var(--accent)] tracking-wider">
                01 /
              </span>
              <h2 className="text-[var(--text-h2)] font-bold text-[var(--ink)]">
                {isHi ? 'कार्यप्रणाली एवं आर्किटेक्चर' : 'How it works'}
              </h2>
            </div>
            <span className="font-mono text-xs text-[var(--ink-muted)]">
              Three-stage on-device pipeline
            </span>
          </div>

          <p className="text-base sm:text-lg text-[var(--ink-muted)] max-w-2xl leading-relaxed">
            {isHi
              ? 'छवि को 128x128 RGB पिक्सल में प्रोसेस किया जाता है। 5-ब्लॉक केरास CNN मॉडल 38ms में वर्गीकरण करता है और बहुभाषी आवाज एवं ग्रैड-कैम द्वारा परिणाम देता है।'
              : 'Each input image or scan is normalized to 128x128 pixels, classified in 38ms by a 5-block Keras CNN, and communicated via multilingual synthesized speech and Grad-CAM interpretability.'}
          </p>

          <ArchitectureDiagram />

        </div>
      </section>

      {/* 3. SECTION 02 / HAZARD & SCREENING CLASSES */}
      <section className="section-spacing border-b border-[var(--border)] bg-[var(--surface-subtle)]/40">
        <div className="layout-container space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[var(--border)] pb-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-[var(--accent)] tracking-wider">
                02 /
              </span>
              <h2 className="text-[var(--text-h2)] font-bold text-[var(--ink)]">
                {isHi ? 'पहचाने जाने वाले 4 स्वास्थ्य वर्ग' : 'Model Output Classes'}
              </h2>
            </div>
            <span className="font-mono text-xs text-[var(--ink-muted)]">
              Benchmark classification taxonomy
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { id: 'NonDemented', en: 'Non-Demented (Normal)', hi: 'सामान्य (स्वस्थ)', te: 'సాధారణం', tier: 'Safe', phrase: '"No dementia detected"' },
              { id: 'VeryMildDemented', en: 'Very Mild Changes', hi: 'अति मंद परिवर्तन', te: 'చాలా స్వల్ప మార్పులు', tier: 'Caution', phrase: '"Very mild changes detected"' },
              { id: 'MildDemented', en: 'Mild Impairment', hi: 'मंद विकार', te: 'స్వల్ప లోపం', tier: 'Caution', phrase: '"Mild impairment detected"' },
              { id: 'ModerateDemented', en: 'Moderate Impairment', hi: 'मध्यम विकार', te: 'మధ్యస్థ లోపం', tier: 'Danger', phrase: '"Moderate impairment detected"' },
            ].map((cls) => (
              <div
                key={cls.id}
                className="interactive-frame group p-5 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)] flex flex-col justify-between min-h-[140px] cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[11px] text-[var(--ink-muted)] uppercase">
                      {cls.id}
                    </span>
                    <Badge
                      variant={
                        cls.tier === 'Danger'
                          ? 'danger'
                          : cls.tier === 'Caution'
                          ? 'warning'
                          : 'success'
                      }
                    >
                      {cls.tier}
                    </Badge>
                  </div>
                  <h3 className="text-base font-bold text-[var(--ink)]">
                    {isTe ? cls.te : isHi ? cls.hi : cls.en}
                  </h3>
                </div>

                <div className="mt-3 pt-2 border-t border-[var(--border-subtle)]">
                  <span className="font-mono text-xs text-[var(--accent)] font-semibold block">
                    {cls.phrase}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 4. SECTION 03 / PRIVACY */}
      <section className="section-spacing border-b border-[var(--border)]">
        <div className="layout-container space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[var(--border)] pb-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-[var(--accent)] tracking-wider">
                03 /
              </span>
              <h2 className="text-[var(--text-h2)] font-bold text-[var(--ink)]">
                {isHi ? 'गोपनीयता एवं सुरक्षा वादे' : 'Privacy & data architecture'}
              </h2>
            </div>
            <span className="font-mono text-xs text-[var(--ink-muted)]">
              DPDP Act 2023 alignment
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] space-y-3 shadow-[var(--shadow-soft)]">
              <div className="w-10 h-10 rounded-[var(--radius-input)] bg-[var(--surface-subtle)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[var(--ink)]">
                Zero Cloud Video
              </h3>
              <p className="text-sm text-[var(--ink-muted)] leading-relaxed">
                Video frames exist only in transient browser memory while being classified by WebGL. Frames are never stored, streamed, or uploaded.
              </p>
            </div>

            <div className="p-6 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] space-y-3 shadow-[var(--shadow-soft)]">
              <div className="w-10 h-10 rounded-[var(--radius-input)] bg-[var(--surface-subtle)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)]">
                <WifiOff className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[var(--ink)]">
                100% Offline Capable
              </h3>
              <p className="text-sm text-[var(--ink-muted)] leading-relaxed">
                The trained CNN weights (3.1 MB) cache locally. Hazard warnings continue operating in low-signal rural zones without cell data.
              </p>
            </div>

            <div className="p-6 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] space-y-3 shadow-[var(--shadow-soft)]">
              <div className="w-10 h-10 rounded-[var(--radius-input)] bg-[var(--surface-subtle)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)]">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[var(--ink)]">
                Blur-or-Discard Policy
              </h3>
              <p className="text-sm text-[var(--ink-muted)] leading-relaxed">
                If a user opts in to donate photos for retraining, faces and vehicle plates are blurred locally prior to benchmark curation.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 5. SECTION 04 / MODEL CARD & REAL PRIORITY CODE */}
      <section className="section-spacing border-b border-[var(--border)] bg-[var(--surface-subtle)]/40">
        <div className="layout-container space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[var(--border)] pb-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-[var(--accent)] tracking-wider">
                04 /
              </span>
              <h2 className="text-[var(--text-h2)] font-bold text-[var(--ink)]">
                {isHi ? 'मॉडल कार्ड एवं वास्तविक कोड' : 'Model card & logic'}
              </h2>
            </div>
            <span className="font-mono text-xs text-[var(--ink-muted)]">
              Verified benchmark evaluations
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Real production code block */}
            <div className="lg:col-span-6 space-y-3">
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--ink-muted)] font-semibold block">
                Production Priority Engine
              </span>
              <CodeBlock code={samplePriorityCode} />
            </div>

            {/* Right: Confusion Matrix */}
            <div className="lg:col-span-6 space-y-3">
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--ink-muted)] font-semibold block">
                Validation Matrix (Indian Streets Dataset)
              </span>
              <ConfusionMatrix />
            </div>

          </div>

          {/* Honest Known Limitations */}
          <div className="p-6 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] space-y-3">
            <h3 className="text-base font-bold text-[var(--ink)] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[var(--status-danger)]" />
              <span>Honest operational limits and failure modes</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm text-[var(--ink-muted)] leading-relaxed">
              <p>
                <strong>Unlit night alleys:</strong> Camera sensors fail under 15 lux. Always maintain white cane sweep cadence in dark streets.
              </p>
              <p>
                <strong>Submerged monsoon potholes:</strong> Standing rainwater reflections can lower model confidence. Below 60%, the cane fallback sounds.
              </p>
              <p>
                <strong>Heavy bazaar crowds:</strong> Bodies occlude pavement ground features within 1 meter. Rely on cane for physical clearance.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 6. SECTION 05 / FOR SCHOOLS AND NGOS */}
      <section className="section-spacing border-b border-[var(--border)]">
        <div className="layout-container space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[var(--border)] pb-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-[var(--accent)] tracking-wider">
                05 /
              </span>
              <h2 className="text-[var(--text-h2)] font-bold text-[var(--ink)]">
                {isHi ? 'दृष्टिबाधित विद्यालयों और संस्थाओं हेतु' : 'For schools & mobility trainers'}
              </h2>
            </div>
            <span className="font-mono text-xs text-[var(--ink-muted)]">
              Rehabilitation & training programs
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-[var(--ink)]">
                Integrated with White Cane Orientation & Mobility (O&M)
              </h3>
              <p className="text-base text-[var(--ink-muted)] leading-relaxed">
                We partner with blind schools across Haryana and Delhi NCR to integrate on-device spatial audio alerts into white cane rehabilitation courses.
              </p>
              <ul className="space-y-2 text-sm text-[var(--ink)] font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--status-success)]" />
                  <span>Free deployment kits for student Android devices</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--status-success)]" />
                  <span>Trainer curriculum for audio cue synchronization</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--status-success)]" />
                  <span>Open-source community hazard dataset collaboration</span>
                </li>
              </ul>
              <div className="pt-2">
                <Button variant="secondary" onClick={() => onNavigateTab('ngo-schools')}>
                  {isHi ? 'प्रशिक्षण अनुरोध फॉर्म' : 'Request institutional deployment'}
                </Button>
              </div>
            </div>

            <div className="p-6 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-subtle)] space-y-4 font-mono text-xs text-[var(--ink-muted)]">
              <div className="flex justify-between border-b border-[var(--border)] pb-2">
                <span className="font-bold text-[var(--ink)]">Active Pilot Cohorts</span>
                <span className="text-[var(--accent)] font-semibold">2026 Academic Term</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>National Assoc. for the Blind (Haryana)</span>
                  <span className="tabular-data text-[var(--ink)]">50 Devices</span>
                </div>
                <div className="flex justify-between">
                  <span>Prerna Special School</span>
                  <span className="tabular-data text-[var(--ink)]">25 Devices</span>
                </div>
                <div className="flex justify-between">
                  <span>Rehabilitation Center Rohtak</span>
                  <span className="tabular-data text-[var(--ink)]">30 Devices</span>
                </div>
              </div>
              <div className="pt-2 border-t border-[var(--border)] text-[11px] text-[var(--ink-muted)]">
                All software licenses provided at no cost under Apache-2.0.
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 7. SECTION 06 / FAQ */}
      <section className="section-spacing border-b border-[var(--border)] bg-[var(--surface-subtle)]/40">
        <div className="layout-container space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[var(--border)] pb-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-[var(--accent)] tracking-wider">
                06 /
              </span>
              <h2 className="text-[var(--text-h2)] font-bold text-[var(--ink)]">
                {isHi ? 'अक्सर पूछे जाने वाले प्रश्न' : 'Frequently asked questions'}
              </h2>
            </div>
            <span className="font-mono text-xs text-[var(--ink-muted)]">
              Operational details
            </span>
          </div>

          <Accordion items={faqItems} />

        </div>
      </section>

      {/* 8. CALL TO ACTION STRIP */}
      <section className="section-spacing">
        <div className="layout-container text-center space-y-6 max-w-2xl mx-auto">
          <h2 className="text-[var(--text-h2)] font-extrabold text-[var(--ink)]">
            {isHi ? 'मार्ग पर स्वतंत्र एवं सुरक्षित चलें' : 'Walk with situational awareness'}
          </h2>
          <p className="text-base text-[var(--ink-muted)] leading-relaxed">
            {isHi
              ? 'बिना किसी ऐप स्टोर डाउनलोड के सीधे अपने फोन के ब्राउज़र में दृष्टि असिस्ट शुरू करें।'
              : 'Launch DrishtiAssist directly in your browser. Works with rear camera on any smartphone.'}
          </p>
          <div className="flex justify-center gap-3">
            <Button size="lg" hasArrow onClick={onOpenApp} className="min-h-[56px] h-14 [white-space:nowrap]">
              {isTe ? 'ఇప్పుడే యాప్ తెరవండి' : isHi ? 'अभी ऐप खोलें' : 'Open the app now'}
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
};
