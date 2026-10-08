// AgroVision AI — Farm Agent Voice & Multilingual Speech Synthesis Engine
// Manages distinct voice personas, system voice auto-discovery, pitch/rate modulation, and playback.

export const VOICE_PROFILES = {
  Kannada: {
    code: 'kn-IN',
    label: 'ಕನ್ನಡ (Kannada)',
    flag: '🇮🇳',
    previewText: 'ನಮಸ್ಕಾರ ರೈತ ಬಾಂಧವರೇ, ನಾನು ನಿಮ್ಮ ಆಗ್ರೋವಿಷನ್ AI ಫಾರ್ಮ್ ಏಜೆಂಟ್. ನಿಮ್ಮ ತೋಟದ ಇಂದಿನ ಯೋಜನೆ ಸಿದ್ಧವಾಗಿದೆ.',
    personas: [
      {
        id: 'kn_raita_mitra',
        name: 'ರೈತ ಮಿತ್ರ (Raita Mitra)',
        role: 'Male / Elder Rural Advisor',
        badge: 'ಶಾಂತ ಧ್ವನಿ (Calm & Grounded)',
        pitch: 0.88,
        rate: 0.86,
        preferredGender: 'male',
        accentColor: 'emerald'
      },
      {
        id: 'kn_krishi_tajne',
        name: 'ಕೃಷಿ ತಜ್ಞೆ (Krishi Tajne)',
        role: 'Female / Agronomy Specialist',
        badge: 'ಸ್ಪಷ್ಟ ಧ್ವನಿ (Crisp & Articulate)',
        pitch: 1.15,
        rate: 0.92,
        preferredGender: 'female',
        accentColor: 'teal'
      }
    ]
  },
  Hindi: {
    code: 'hi-IN',
    label: 'हिन्दी (Hindi)',
    flag: '🇮🇳',
    previewText: 'नमस्ते किसान भाई, मैं आपका एग्रोविज़न AI फार्म एजेंट हूँ। आपके खेत की आज की योजना तैयार है।',
    personas: [
      {
        id: 'hi_krishi_sakhi',
        name: 'कृषि सखी (Krishi Sakhi)',
        role: 'Female / Agro Expert',
        badge: 'मधुर वाणी (Warm & Melodic)',
        pitch: 1.12,
        rate: 0.92,
        preferredGender: 'female',
        accentColor: 'teal'
      },
      {
        id: 'hi_kisan_mitra',
        name: 'किसान मित्र (Kisan Mitra)',
        role: 'Male / Field Specialist',
        badge: 'गंभीर आवाज़ (Resonant & Solid)',
        pitch: 0.88,
        rate: 0.88,
        preferredGender: 'male',
        accentColor: 'emerald'
      }
    ]
  },
  English: {
    code: 'en-IN',
    label: 'English',
    flag: '🇬🇧',
    previewText: 'Namaskara Farmer, I am your AgroVision AI Farm Agent. Today\'s prioritized farm plan is ready.',
    personas: [
      {
        id: 'en_agro_copilot',
        name: 'Agro Copilot',
        role: 'Female / Scientific Advisor',
        badge: 'Crisp Natural',
        pitch: 1.05,
        rate: 0.95,
        preferredGender: 'female',
        accentColor: 'teal'
      },
      {
        id: 'en_field_specialist',
        name: 'Field Specialist',
        role: 'Male / Agronomic Director',
        badge: 'Deep Voice',
        pitch: 0.88,
        rate: 0.90,
        preferredGender: 'male',
        accentColor: 'emerald'
      }
    ]
  },
  Telugu: {
    code: 'te-IN',
    label: 'తెలుగు (Telugu)',
    flag: '🇮🇳',
    previewText: 'నమస్కారం రైతు మిత్రులారా, నేను మీ ఆగ్రోవిజన్ AI ఫార్మ్ ఏజెంట్.',
    personas: [
      {
        id: 'te_mitra',
        name: 'రైతు మిత్ర (Raitu Mitra)',
        role: 'Field Advisor',
        badge: 'Natural',
        pitch: 0.95,
        rate: 0.90,
        preferredGender: 'male',
        accentColor: 'emerald'
      }
    ]
  },
  Tamil: {
    code: 'ta-IN',
    label: 'தமிழ் (Tamil)',
    flag: '🇮🇳',
    previewText: 'வணக்கம் விவசாய பெருமக்களே, நான் உங்கள் அக்ரோவிஷன் AI பண்ணை வழிகாட்டி.',
    personas: [
      {
        id: 'ta_sakhi',
        name: 'விவசாய தோழன் (Farm Guide)',
        role: 'Agro Guide',
        badge: 'Natural',
        pitch: 1.0,
        rate: 0.90,
        preferredGender: 'female',
        accentColor: 'emerald'
      }
    ]
  }
};

let cachedVoices = [];
let voicesLoaded = false;

function loadSystemVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  const list = window.speechSynthesis.getVoices();
  if (list && list.length > 0) {
    cachedVoices = list;
    voicesLoaded = true;
  }
  return cachedVoices;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadSystemVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    loadSystemVoices();
  };
}

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

export function getAvailableSystemVoices() {
  loadSystemVoices();
  return cachedVoices;
}

export function getLanguageConfig(language) {
  return VOICE_PROFILES[language] || VOICE_PROFILES['English'];
}

export function getVoicePersonas(language) {
  const cfg = getLanguageConfig(language);
  return cfg.personas || [];
}

export function getActivePersona(language) {
  const personas = getVoicePersonas(language);
  if (!personas || personas.length === 0) return null;

  try {
    const saved = localStorage.getItem(`agrovision_persona_${language}`);
    if (saved) {
      const match = personas.find((p) => p.id === saved);
      if (match) return match;
    }
  } catch (e) {
    // localStorage may be unavailable
  }

  return personas[0];
}

export function setActivePersona(language, personaId) {
  try {
    localStorage.setItem(`agrovision_persona_${language}`, personaId);
  } catch (e) {}
}

export function findMatchingSystemVoice(language, persona) {
  loadSystemVoices();
  const langConfig = getLanguageConfig(language);
  const targetCode = (langConfig.code || 'en-US').toLowerCase();
  const prefix = targetCode.split('-')[0];

  // 1. Filter voices for exact or prefix match
  const langVoices = cachedVoices.filter((v) => {
    const l = (v.lang || '').toLowerCase();
    const name = (v.name || '').toLowerCase();
    return l.startsWith(prefix) || l.includes(prefix) || name.includes(language.toLowerCase());
  });

  if (langVoices.length > 0) {
    if (persona?.preferredGender) {
      const g = persona.preferredGender.toLowerCase();
      const genderMatch = langVoices.find((v) => {
        const name = (v.name || '').toLowerCase();
        if (g === 'female') {
          return name.includes('female') || name.includes('swara') || name.includes('kalpana') || name.includes('neerja') || name.includes('zira') || name.includes('heera');
        } else {
          return name.includes('male') || name.includes('hemant') || name.includes('ravi') || name.includes('david') || name.includes('george') || name.includes('madhav');
        }
      });
      if (genderMatch) return genderMatch;
    }
    return langVoices[0];
  }

  // 2. Fallback to Indian English or Indian Regional voice
  const indianVoices = cachedVoices.filter((v) => {
    const l = (v.lang || '').toLowerCase();
    const n = (v.name || '').toLowerCase();
    return l === 'en-in' || l === 'hi-in' || n.includes('india');
  });

  if (indianVoices.length > 0) {
    if (persona?.preferredGender === 'male') {
      const maleIndian = indianVoices.find((v) => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('ravi') || v.name.toLowerCase().includes('hemant'));
      if (maleIndian) return maleIndian;
    }
    return indianVoices[0];
  }

  // 3. Fallback to any default voice
  return cachedVoices.find((v) => v.default) || cachedVoices[0] || null;
}

export function cleanTextForSpeech(text) {
  if (!text) return '';
  return text
    .replace(/[*_#`~>]/g, '')
    .replace(/WHAT TO DO:|WHY:|WHEN:|DATA USED:|CAUTION:/gi, '')
    .replace(/ಏನು ಮಾಡಬೇಕು:|ಏಕೆ:|ಯಾವಾಗ:|ಬಳಸಿದ ಡೇಟಾ:|ಎಚ್ಚರಿಕೆ:/gi, '')
    .replace(/क्या करें:|क्यों:|कब करें:|प्रयुक्त डेटा:|सावधानी:/gi, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function speakAgentMessage({
  text,
  language = 'English',
  persona = null,
  onStart = null,
  onEnd = null,
  onError = null
}) {
  if (!isSpeechSupported()) {
    if (onError) onError(new Error('Speech synthesis is not supported on this device.'));
    return false;
  }

  stopAgentSpeech();

  const langConfig = getLanguageConfig(language);
  const activePersona = persona || getActivePersona(language);
  const matchedVoice = findMatchingSystemVoice(language, activePersona);
  const clean = cleanTextForSpeech(text);

  if (!clean) {
    if (onEnd) onEnd();
    return false;
  }

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.lang = langConfig.code || 'en-US';

  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  // Apply tuned voice persona parameters for distinct vocal timbre
  if (activePersona) {
    utterance.pitch = activePersona.pitch ?? 1.0;
    utterance.rate = activePersona.rate ?? 0.95;
  } else {
    utterance.pitch = 1.0;
    utterance.rate = 0.95;
  }

  if (onStart) utterance.onstart = onStart;
  utterance.onend = () => {
    if (onEnd) onEnd();
  };
  utterance.onerror = (e) => {
    if (onError) onError(e);
  };

  window.speechSynthesis.speak(utterance);
  return true;
}

export function previewVoice(language, persona, callbacks = {}) {
  const langConfig = getLanguageConfig(language);
  const text = langConfig.previewText || `Hello, this is ${persona?.name || 'AgroVision Voice'}.`;
  return speakAgentMessage({
    text,
    language,
    persona,
    onStart: callbacks.onStart,
    onEnd: callbacks.onEnd,
    onError: callbacks.onError
  });
}

export function stopAgentSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.cancel();
    } catch (e) {
      console.warn('Speech cancellation error:', e);
    }
  }
}

export function speakAgentText(text, options = {}) {
  const langMap = { kn: 'Kannada', hi: 'Hindi', en: 'English' };
  const language = langMap[options.lang] || options.language || 'English';
  return speakAgentMessage({
    text,
    language,
    persona: options.persona,
    onStart: options.onStart,
    onEnd: options.onEnd,
    onError: options.onError
  });
}

