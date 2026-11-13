import { HazardType, Zone, SupportedLanguage } from '../types';

export interface TranslationSchema {
  needs_review?: boolean;
  appName: string;
  tagline: string;
  nav: {
    howItWorks: string;
    details: string;
    contact: string;
    openApp: string;
    appearance: string;
  };
  hero: {
    headline: string;
    sub: string;
    openApp: string;
    seeHowItWorks: string;
    factsLine: string;
  };
  howItWorks: {
    label: string;
    title: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
  };
  whatItDetects: {
    label: string;
    title: string;
    intro: string;
  };
  privacyAndSafety: {
    label: string;
    privacyTitle: string;
    privacyDesc: string;
    safetyTitle: string;
    safetyDesc: string;
    readDetails: string;
  };
  finalCta: {
    title: string;
    sub: string;
    button: string;
  };
  footer: {
    disclaimer: string;
    details: string;
    contact: string;
    privacy: string;
    accessibility: string;
    pauseAnimations: string;
    playAnimations: string;
  };
  assist: {
    safetyNotice: string;
    startDetection: string;
    stopDetection: string;
    spokenAlerts: string;
    noAlertsYet: string;
    feedbackPrompt: string;
    correct: string;
    wrong: string;
    thanksFeedback: string;
    readSigns: string;
    describeScene: string;
    repeatLast: string;
    voiceMicOn: string;
    voiceMicOff: string;
    cameraPreview: string;
    dimBattery: string;
    showVideo: string;
    simMode: string;
    liveCamera: string;
    cameraPermissionDenied: string;
    noTextFound: string;
    ocrReading: string;
    describingScene: string;
    cloudOfflineNotice: string;
    consentModalTitle: string;
    consentModalMessage: string;
    consentConfirm: string;
    consentCancel: string;
    noVoiceWarning: string;
  };
  hazards: Record<HazardType, string>;
  hazard_classes?: Record<HazardType, string>;
  zones: Record<Zone, string>;
  lowConfidence: string;
  headers?: {
    howItWorks: string;
    details: string;
    contact: string;
    openApp: string;
    appearance: string;
  };
  steps?: {
    label: string;
    title: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
  };
  privacy?: {
    label: string;
    privacyTitle: string;
    privacyDesc: string;
    safetyTitle: string;
    safetyDesc: string;
    readDetails: string;
  };
  privacy_statements?: {
    label: string;
    privacyTitle: string;
    privacyDesc: string;
    safetyTitle: string;
    safetyDesc: string;
    readDetails: string;
  };
}

export interface LanguageMeta {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  markedForNativeReview: boolean;
  status: 'verified' | 'pending_native_review';
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { code: 'en', name: 'English', nativeName: 'English', markedForNativeReview: false, status: 'verified' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', markedForNativeReview: false, status: 'verified' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', markedForNativeReview: true, status: 'pending_native_review' },
];

export function isLanguageMarkedForReview(lang: SupportedLanguage): boolean {
  return TRANSLATIONS[lang]?.needs_review ?? false;
}

export function getTranslation(lang: SupportedLanguage): TranslationSchema {
  return TRANSLATIONS[lang] || TRANSLATIONS.en;
}

export const TRANSLATIONS: Record<SupportedLanguage, TranslationSchema> = {
  en: {
    needs_review: false,
    appName: 'DrishtiAssist',
    tagline: 'Accessible on-device hazard detection for blind pedestrians',
    nav: {
      howItWorks: 'How it works',
      details: 'Details',
      contact: 'Contact',
      openApp: 'Open the app',
      appearance: 'Appearance',
    },
    hero: {
      headline: 'Hear what is in your path.',
      sub: 'Point your phone ahead. The app warns you by voice about potholes, stairs, poles and vehicles.',
      openApp: 'Open the app',
      seeHowItWorks: 'See how it works',
      factsLine: 'Works offline · Private by default · English, हिंदी, తెలుగు',
    },
    howItWorks: {
      label: '01 / How it works',
      title: 'Three steps, no setup.',
      step1Title: '1. Hold it forward',
      step1Desc: 'Keep your phone at chest height with the camera facing ahead.',
      step2Title: '2. It checks the view',
      step2Desc: 'The app looks at the left, centre and right, on your phone.',
      step3Title: '3. You listen',
      step3Desc: 'You hear short warnings, most urgent first, such as "Pothole, left."',
    },
    whatItDetects: {
      label: '02 / What it detects',
      title: 'Eight things it tells you about.',
      intro: 'Tap any item to hear how it sounds.',
    },
    privacyAndSafety: {
      label: '03 / Privacy and safety',
      privacyTitle: 'Privacy',
      privacyDesc:
        'Your camera stays on your phone. Video is processed on the device. Nothing is recorded or uploaded unless you choose to share a photo to help improve the app.',
      safetyTitle: 'Safety',
      safetyDesc:
        'An aid, not a replacement. Keep using your white cane or guide. Do not rely on this app alone to cross roads.',
      readDetails: 'Read the details',
    },
    finalCta: {
      title: 'Try it on your phone.',
      sub: 'Open it in your browser. No download and no account needed.',
      button: 'Open the app',
    },
    footer: {
      disclaimer: 'An assistive aid. Not a replacement for a white cane or guide.',
      details: 'Details',
      contact: 'Contact',
      privacy: 'Privacy',
      accessibility: 'Accessibility',
      pauseAnimations: 'Pause animations',
      playAnimations: 'Play animations',
    },
    assist: {
      safetyNotice:
        'An aid, not a replacement. Keep using your white cane or guide. Do not rely on this app alone to cross roads.',
      startDetection: 'Start Detection',
      stopDetection: 'Stop Detection',
      spokenAlerts: 'Live Spoken Alerts',
      noAlertsYet: 'No alerts yet. Tap "Start Detection" to begin.',
      feedbackPrompt: 'Was this alert correct?',
      correct: 'Correct',
      wrong: 'Wrong',
      thanksFeedback: 'Feedback recorded.',
      readSigns: 'Read Sign (OCR)',
      describeScene: 'Describe Scene',
      repeatLast: 'Repeat',
      voiceMicOn: 'Mic On',
      voiceMicOff: 'Mic Off',
      cameraPreview: 'Camera Preview',
      dimBattery: 'Dim (Battery)',
      showVideo: 'Show Video',
      simMode: 'Sim Mode',
      liveCamera: 'Live Camera',
      cameraPermissionDenied:
        'Camera permission was denied. Please allow camera access in your browser settings.',
      noTextFound: 'No text found in view.',
      ocrReading: 'Reading sign text...',
      describingScene: 'Describing scene...',
      cloudOfflineNotice: 'Internet connection required for cloud scene description.',
      consentModalTitle: 'AI Scene Description Consent',
      consentModalMessage:
        'DrishtiAssist sends this single photo to describe what is ahead. No photos are stored.',
      consentConfirm: 'Confirm & Send',
      consentCancel: 'Cancel',
      noVoiceWarning:
        'Notice: An English voice was used because a local voice is not installed on this device. You can install an Indian voice in your phone’s Text-to-Speech settings.',
    },
    hazards: {
      pothole: 'Pothole',
      open_drain: 'Open drain',
      stairs: 'Stairs',
      pole: 'Pole',
      vehicle: 'Vehicle',
      animal: 'Animal',
      person: 'Person',
      clear_path: 'Clear path',
    },
    zones: {
      left: 'left',
      center: 'ahead',
      right: 'right',
    },
    lowConfidence: 'Not sure, use your cane carefully.',
  },

  hi: {
    needs_review: true,
    appName: 'दृष्टि असिस्ट',
    tagline: 'दृष्टिबाधित पदयात्रियों के लिए ऑन-डिवाइस खतरा चेतावनी',
    nav: {
      howItWorks: 'यह कैसे काम करता है',
      details: 'विवरण',
      contact: 'संपर्क',
      openApp: 'ऐप खोलें',
      appearance: 'दिखावट',
    },
    hero: {
      headline: 'अपने रास्ते की बाधाएँ सुनिए।',
      sub: 'फ़ोन को सामने की ओर रखिए। ऐप गड्ढे, सीढ़ियाँ, खंभे और गाड़ियों के बारे में आवाज़ में चेतावनी देता है।',
      openApp: 'ऐप खोलें',
      seeHowItWorks: 'यह कैसे काम करता है',
      factsLine: 'Works offline · Private by default · English, हिंदी, తెలుగు',
    },
    howItWorks: {
      label: '01 / कार्यप्रणाली',
      title: 'तीन कदम, कोई सेटअप नहीं।',
      step1Title: '1. फ़ोन सामने रखिए',
      step1Desc: 'फ़ोन को सीने की ऊँचाई पर, कैमरा आगे की ओर रखिए।',
      step2Title: '2. फ़ोन पर जाँच',
      step2Desc: 'ऐप सामने के बाएँ, बीच और दाएँ हिस्से को फ़ोन पर ही जाँचता है।',
      step3Title: '3. आवाज़ सुनिए',
      step3Desc: 'सबसे ज़रूरी चेतावनी पहले, छोटे वाक्यों में, जैसे "गड्ढा, बाएँ"।',
    },
    whatItDetects: {
      label: '02 / पहचान',
      title: 'आठ बातें जो ऐप बताता है।',
      intro: 'आवाज़ सुनने के लिए किसी भी वस्तु पर टैप करें।',
    },
    privacyAndSafety: {
      label: '03 / गोपनीयता एवं सुरक्षा',
      privacyTitle: 'Privacy',
      privacyDesc:
        'आपका कैमरा आपके फ़ोन से बाहर नहीं जाता। वीडियो फ़ोन पर ही प्रोसेस होता है। जब तक आप ऐप सुधारने के लिए कोई फ़ोटो साझा करने का चुनाव नहीं करते, कुछ भी रिकॉर्ड या अपलोड नहीं होता।',
      safetyTitle: 'Safety',
      safetyDesc:
        'यह सहायक है, विकल्प नहीं। अपनी सफ़ेद छड़ी या साथी का उपयोग जारी रखिए। सड़क पार करने के लिए सिर्फ़ इस ऐप पर भरोसा न करें।',
      readDetails: 'विस्तृत जानकारी पढ़ें',
    },
    finalCta: {
      title: 'अपने फ़ोन पर आज़माइए।',
      sub: 'ब्राउज़र में खोलिए। न डाउनलोड, न अकाउंट।',
      button: 'ऐप खोलें',
    },
    footer: {
      disclaimer: 'यह सहायक है, विकल्प नहीं। अपनी सफ़ेद छड़ी या साथी का उपयोग जारी रखिए।',
      details: 'विवरण',
      contact: 'संपर्क',
      privacy: 'गोपनीयता',
      accessibility: 'सुलभता',
      pauseAnimations: 'एनिमेशन रोकें',
      playAnimations: 'एनिमेशन चलाएं',
    },
    assist: {
      safetyNotice:
        'यह सहायक है, विकल्प नहीं। अपनी सफ़ेद छड़ी या साथी का उपयोग जारी रखिए। सड़क पार करने के लिए सिर्फ़ इस ऐप पर भरोसा न करें।',
      startDetection: 'पहचान शुरू करें',
      stopDetection: 'पहचान रोकें',
      spokenAlerts: 'बोली गई सूचनाएँ',
      noAlertsYet: 'अभी कोई चेतावनी नहीं है। "पहचान शुरू करें" दबाएं।',
      feedbackPrompt: 'क्या यह चेतावनी सही थी?',
      correct: 'सही',
      wrong: 'गलत',
      thanksFeedback: 'प्रतिक्रिया दर्ज की गई।',
      readSigns: 'बोर्ड पढ़ें (OCR)',
      describeScene: 'दृश्य विवरण',
      repeatLast: 'दोहराएं',
      voiceMicOn: 'माइक चालू',
      voiceMicOff: 'माइक बंद',
      cameraPreview: 'कैमरा दृश्य',
      dimBattery: 'स्क्रीन डिम करें',
      showVideo: 'वीडियो दिखाएं',
      simMode: 'सिम मोड',
      liveCamera: 'फोन कैमरा',
      cameraPermissionDenied:
        'कैमरा अनुमति अस्वीकृत है। कृपया ब्राउज़र सेटिंग्स में कैमरा चालू करें।',
      noTextFound: 'कैमरे के सामने कोई टेक्स्ट नहीं मिला।',
      ocrReading: 'टेक्स्ट पढ़ा जा रहा है...',
      describingScene: 'दृश्य का विश्लेषण हो रहा है...',
      cloudOfflineNotice: 'दृश्य विवरण के लिए इंटरनेट कनेक्शन आवश्यक है।',
      consentModalTitle: 'AI दृश्य विवरण की अनुमति',
      consentModalMessage:
        'दृष्टि असिस्ट सामने का दृश्य समझाने के लिए केवल यह एक फोटो भेजेगा। कोई फोटो सेव नहीं होगा।',
      consentConfirm: 'सहमति दें और भेजें',
      consentCancel: 'रद्द करें',
      noVoiceWarning:
        'सूचना: आपके डिवाइस में हिंदी आवाज़ नहीं मिली। आप फ़ोन की टेक्स्ट-टू-स्पीच सेटिंग्स में हिंदी आवाज़ डाउनलोड कर सकते हैं।',
    },
    hazards: {
      pothole: 'गड्ढा',
      open_drain: 'खुली नाली',
      stairs: 'सीढ़ियाँ',
      pole: 'खंभा',
      vehicle: 'गाड़ी',
      animal: 'जानवर',
      person: 'व्यक्ति',
      clear_path: 'रास्ता साफ़ है',
    },
    zones: {
      left: 'बाएँ',
      center: 'सामने',
      right: 'दाएँ',
    },
    lowConfidence: 'पक्का नहीं, छड़ी से सावधानी रखें।',
  },

  te: {
    needs_review: true,
    appName: 'దృష్టి అసిస్ట్',
    tagline: 'అంధుల కోసం ఆన్-డివైస్ రోడ్డు ప్రమాద హెచ్చరికలు',
    nav: {
      howItWorks: 'ఇది ఎలా పనిచేస్తుంది',
      details: 'వివరాలు',
      contact: 'సంప్రదించండి',
      openApp: 'యాప్ తెరవండి',
      appearance: 'రూపురేఖలు',
    },
    hero: {
      headline: 'మీ దారిలో ఏముందో వినండి.',
      sub: 'ఫోన్ను ముందు వైపు పెట్టండి. గుంతలు, మెట్లు, స్తంభాలు, వాహనాల గురించి యాప్ మాటల్లో హెచ్చరిస్తుంది.',
      openApp: 'యాప్ తెరవండి',
      seeHowItWorks: 'ఇది ఎలా పనిచేస్తుంది',
      factsLine: 'Works offline · Private by default · English, हिंदी, తెలుగు',
    },
    howItWorks: {
      label: '01 / ఎలా పనిచేస్తుంది',
      title: 'మూడు అడుగులు, సెటప్ అవసరం లేదు.',
      step1Title: '1. ఫోన్ను ముందుకు పట్టుకోండి',
      step1Desc: 'ఫోన్ను ఛాతీ ఎత్తులో, కెమెరా ముందు వైపు ఉండేలా పట్టుకోండి.',
      step2Title: '2. ఫోన్లోనే గుర్తింపు',
      step2Desc: 'ఎడమ, మధ్య, కుడి భాగాలను యాప్ ఫోన్లోనే పరిశీలిస్తుంది.',
      step3Title: '3. మాట వినండి',
      step3Desc: 'అత్యంత ముఖ్యమైన హెచ్చరిక ముందుగా, చిన్న మాటల్లో, ఉదా. "గుంత, ఎడమ".',
    },
    whatItDetects: {
      label: '02 / గుర్తింపు',
      title: 'ఎనిమిది విషయాల గురించి చెబుతుంది.',
      intro: 'శబ్దం వినడానికి ఏదైనా అంశాన్ని నొక్కండి.',
    },
    privacyAndSafety: {
      label: '03 / గోప్యత మరియు భద్రత',
      privacyTitle: 'Privacy',
      privacyDesc:
        'మీ కెమెరా మీ ఫోన్ దాటి వెళ్లదు. వీడియో ఫోన్లోనే ప్రాసెస్ అవుతుంది. యాప్ను మెరుగుపరచడానికి మీరు ఫోటో పంచుకోవాలని ఎంచుకుంటే తప్ప, ఏదీ రికార్డ్ లేదా అప్లోడ్ కాదు.',
      safetyTitle: 'Safety',
      safetyDesc:
        'ఇది సహాయం మాత్రమే, ప్రత్యామ్నాయం కాదు. మీ తెల్ల కర్ర లేదా తోడును వాడటం కొనసాగించండి. రోడ్డు దాటడానికి ఈ యాప్పై మాత్రమే ఆధారపడకండి.',
      readDetails: 'వివరాలు చదవండి',
    },
    finalCta: {
      title: 'మీ ఫోన్లో ప్రయత్నించండి.',
      sub: 'బ్రౌజర్లో తెరవండి. డౌన్లోడ్ లేదా ఖాతా అవసరం లేదు.',
      button: 'యాప్ తెరవండి',
    },
    footer: {
      disclaimer: 'ఇది సహాయం మాత్రమే, ప్రత్యామ్నాయం కాదు. మీ తెల్ల కర్ర లేదా తోడును వాడటం కొనసాగించండి.',
      details: 'వివరాలు',
      contact: 'సంప్రదించండి',
      privacy: 'గోప్యత',
      accessibility: 'యాక్సెసిబిలిటీ',
      pauseAnimations: 'యానిమేషన్లు ఆపండి',
      playAnimations: 'యానిమేషన్లు ఆడించండి',
    },
    assist: {
      safetyNotice:
        'ఇది సహాయం మాత్రమే, ప్రత్యామ్నాయం కాదు. మీ తెల్ల కర్ర లేదా తోడును వాడటం కొనసాగించండి. రోడ్డు దాటడానికి ఈ యాప్పై మాత్రమే ఆధారపడకండి.',
      startDetection: 'గుర్తింపు ప్రారంభించండి',
      stopDetection: 'ఆపండి',
      spokenAlerts: 'చెప్పిన హెచ్చరికలు',
      noAlertsYet: 'ఇంకా హెచ్చరికలు లేవు. ప్రారంభించడానికి నొక్కండి.',
      feedbackPrompt: 'ఈ హెచ్చరిక సరైనదా?',
      correct: 'సరైనది',
      wrong: 'తప్పు',
      thanksFeedback: 'ధన్యవాదాలు, నమోదు చేయబడింది.',
      readSigns: 'బోర్డు చదవండి (OCR)',
      describeScene: 'పరిసరాల వివరణ',
      repeatLast: 'మళ్ళీ చెప్పండి',
      voiceMicOn: 'మైక్ ఆన్',
      voiceMicOff: 'మైక్ ఆఫ్',
      cameraPreview: 'కెమెరా వీక్షణ',
      dimBattery: 'స్క్రీన్ తగ్గించండి',
      showVideo: 'వీడియో చూపించు',
      simMode: 'సిమ్ మోడ్',
      liveCamera: 'కెమెరా',
      cameraPermissionDenied:
        'కెమెరా అనుమతి లభించలేదు. దయచేసి బ్రౌజర్ సెట్టింగ్స్‌లో అనుమతించండి.',
      noTextFound: 'ఏమీ అక్షరాలు కనిపించలేదు.',
      ocrReading: 'బోర్డు చదువుతోంది...',
      describingScene: 'పరిసరాలను వివరిస్తోంది...',
      cloudOfflineNotice: 'వివరణ కోసం ఇంటర్నెట్ అవసరం.',
      consentModalTitle: 'AI వివరణ అనుమతి',
      consentModalMessage:
        'ముందున్న దృశ్యాన్ని వివరించడానికి ఈ ఒక్క ఫోటో పంపబడుతుంది. ఫోటోలు దాచబడవు.',
      consentConfirm: 'అంగీకరించి పంపండి',
      consentCancel: 'రద్దు చేయండి',
      noVoiceWarning:
        'గమనిక: మీ ఫోన్‌లో తెలుగు వాయిస్ లేదు. ఫోన్ టెక్స్ట్-టు-స్పీచ్ సెట్టింగ్స్‌లో తెలుగు వాయిస్ డౌన్‌లోడ్ చేసుకోవచ్చు.',
    },
    hazards: {
      pothole: 'గుంత',
      open_drain: 'తెరిచి ఉన్న కాలువ',
      stairs: 'మెట్లు',
      pole: 'స్తంభం',
      vehicle: 'వాహనం',
      animal: 'జంతువు',
      person: 'వ్యక్తి',
      clear_path: 'దారి స్పష్టంగా ఉంది',
    },
    zones: {
      left: 'ఎడమ',
      center: 'ముందు',
      right: 'కుడి',
    },
    lowConfidence: 'ఖచ్చితంగా తెలియదు, కర్రతో జాగ్రత్తగా వెళ్లండి.',
  },
};
