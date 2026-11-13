import React from 'react';
import { Camera, Cpu, Volume2, ShieldCheck, WifiOff, AlertTriangle, Layers, Eye } from 'lucide-react';
import { SupportedLanguage } from '../types';
import { BrandHeaderBand } from './BrandHeaderBand';

interface Props {
  language: SupportedLanguage;
}

export const HowItWorksView: React.FC<Props> = ({ language }) => {
  const isHi = language === 'hi';
  const isTe = language === 'te';

  return (
    <div className="w-full flex flex-col">
      {/* Brand Header Band */}
      <BrandHeaderBand
        serifPrefix="01 ·"
        variant="transparent"
        title={
          isTe
            ? 'దృష్టి అసిస్ట్ ఎలా పనిచేస్తుంది'
            : isHi
            ? 'दृष्टि असिस्ट कैसे काम करता है'
            : 'HOW DRISHTIASSIST WORKS'
        }
        subtitle={
          isTe
            ? '128x128x3 ఇమేజ్ ప్రాసెసింగ్, 5-బ్లాక్ కెరాస్ CNN మోడల్ మరియు బహుభాషా వాయిస్ గైడెన్స్ ద్వారా పూర్తి విశ్లేషణ.'
            : isHi
            ? '128x128x3 छवि सामान्यीकरण, 5-ब्लॉक केरास CNN मॉडल एवं बहुभाषी ध्वनि मार्गदर्शन की त्रि-स्तरीय प्रणाली।'
            : 'Three-stage pipeline: 128x128x3 RGB normalization, 5-block Keras CNN inference, and multilingual speech with Grad-CAM.'
        }
        language={language}
      />

      <div className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col gap-10">

        {/* 3-Step Architecture Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Step 1: Preprocessing */}
          <div className="card-warm p-6 rounded-2xl flex flex-col gap-4">
            <div className="card-warm-icon-chip w-12 h-12 rounded-xl flex items-center justify-center font-bold">
              <Camera className="w-6 h-6" />
            </div>
            <h2 className="card-warm-heading text-lg font-bold">
              {isTe ? '1. ఇమేజ్ ప్రిప్రాసెసింగ్' : isHi ? '1. छवि सामान्यीकरण' : '1. 128×128 RGB Pipeline'}
            </h2>
            <p className="card-warm-body text-sm leading-relaxed">
              {isTe
                ? 'స్కాన్ లేదా కెమెరా చిత్రం 128x128 పిక్సెల్‌లకు రీసైజ్ చేయబడి 1/255.0 స్కేలింగ్‌తో నార్మలైజ్ చేయబడుతుంది.'
                : isHi
                ? 'इनपुट छवि को 128x128 आकार में बदलकर 1/255.0 स्केलिंग के साथ सामान्यीकृत (normalize) किया जाता है।'
                : 'Input images or video frames are resized to 128×128 RGB pixels and scaled by 1/255.0 to match the exact Keras training pipeline.'}
            </p>
          </div>

          {/* Step 2: 5-Block CNN */}
          <div className="card-warm p-6 rounded-2xl flex flex-col gap-4">
            <div className="card-warm-icon-chip w-12 h-12 rounded-xl flex items-center justify-center font-bold">
              <Cpu className="w-6 h-6" />
            </div>
            <h2 className="card-warm-heading text-lg font-bold">
              {isTe ? '2. 5-బ్లాక్ కెరాస్ CNN' : isHi ? '2. 5-ब्लॉक केरास CNN' : '2. 5-Block Keras CNN'}
            </h2>
            <p className="card-warm-body text-sm leading-relaxed">
              {isTe
                ? '5 కన్వోల్యూషనల్ బ్లాక్‌లు (256, 64, 256, 128, 256) బ్యాచ్ నార్మలైజేషన్ మరియు స్పాషియల్ డ్రాప్‌అవుట్‌తో 38ms లో వర్గీకరిస్తాయి.'
                : isHi
                ? '5 कनवोल्यूशनल ब्लॉक (256, 64, 256, 128, 256) बैच नॉर्मलाइजेशन और स्पेशल ड्रॉपआउट के साथ 38ms में वर्गीकरण करते हैं।'
                : '5 Conv blocks (filters: 256, 64, 256, 128, 256) with BatchNormalization and SpatialDropout2D extract features and classify in 38ms.'}
            </p>
          </div>

          {/* Step 3: Voice & Grad-CAM */}
          <div className="card-warm p-6 rounded-2xl flex flex-col gap-4">
            <div className="card-warm-icon-chip w-12 h-12 rounded-xl flex items-center justify-center font-bold">
              <Volume2 className="w-6 h-6" />
            </div>
            <h2 className="card-warm-heading text-lg font-bold">
              {isTe ? '3. వాయిస్ & గ్రాడ్-క్యామ్' : isHi ? '3. वॉयस एवं ग्रैड-कैम' : '3. Voice & Grad-CAM'}
            </h2>
            <p className="card-warm-body text-sm leading-relaxed">
              {isTe
                ? 'ఫలితం ఇంగ్లీష్, హిందీ, తెలుగులలో స్పష్టంగా వినిపించబడుతుంది మరియు గ్రాడ్-క్యామ్ ద్వారా ముఖ్య ప్రాంతాలు హైలైట్ చేయబడతాయి.'
                : isHi
                ? 'परिणाम अंग्रेजी, हिंदी और तेलुगु में बोले जाते हैं तथा ग्रैड-कैम द्वारा प्रमुख क्षेत्रों का दृश्य हीटमैप दर्शाया जाता है।'
                : 'Outcomes are announced via synthesized voice in English, Hindi, and Telugu, accompanied by an interactive Grad-CAM heatmap overlay.'}
            </p>
          </div>

        </div>

        {/* Privacy Guarantee Box */}
        <div className="card-privacy-box p-6 sm:p-8 rounded-2xl flex flex-col sm:flex-row items-start gap-5">
          <div className="card-privacy-icon-chip p-3 rounded-xl shrink-0">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="card-privacy-heading text-lg sm:text-xl font-bold">
              {isHi ? '100% डेटा गोपनीयता एवं सुरक्षा' : 'Data Privacy & Ephemeral Inferences'}
            </h2>
            <p className="card-privacy-body text-sm leading-relaxed">
              Inferences run in volatile memory. Images are never persisted to disk or shared with external parties unless you explicitly check the opt-in contribution box on the prediction screen. All patient metadata is stripped prior to processing in strict adherence with India's DPDP Act 2023.
            </p>
          </div>
        </div>

        {/* 100% Offline Capable and Assistive Safety */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="card-warm p-6 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 font-bold">
              <div className="card-warm-icon-chip w-8 h-8 rounded-lg flex items-center justify-center">
                <WifiOff className="w-4 h-4" />
              </div>
              <h3 className="card-warm-heading text-base font-bold">
                {isHi ? 'ऑफ़लाइन पूर्ण कार्यक्षमता' : 'Offline Edge Capability'}
              </h3>
            </div>
            <p className="card-warm-body text-sm leading-relaxed">
              With quantized TFLite edge models (1.08 MB) and PWA service worker caching, classification works with low latency even in remote clinics or mobile field environments with zero internet access.
            </p>
          </div>

          <div className="card-warn-box p-6 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="card-warn-icon w-5 h-5 shrink-0" />
              <h3 className="card-warn-heading text-base font-bold">
                {isHi ? 'सहायक उपकरण नियम' : 'Assistive Screening Principles'}
              </h3>
            </div>
            <p className="card-warn-body text-sm leading-relaxed">
              Machine learning classifications provide objective second-opinion screening and educational telemetry. They must always be reviewed by certified medical professionals and radiologists.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
