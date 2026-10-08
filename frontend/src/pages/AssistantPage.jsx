import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFarm } from '../context/FarmContext';
import {
  Bot,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Globe,
  RefreshCw,
  Droplets,
  Bug,
  AlertTriangle,
  CheckCircle2,
  CloudRain,
  Sprout,
  Activity,
  Receipt,
  Check,
  X,
  FileText,
  Clock,
  WifiOff,
  Edit3,
  User,
  Radio,
  Play,
  Square,
  TrendingUp
} from 'lucide-react';
import api from '../services/api';
import offlineStorage from '../services/offlineStorage';
import {
  speakAgentMessage,
  stopAgentSpeech,
  getVoicePersonas,
  getActivePersona,
  setActivePersona,
  previewVoice,
  isSpeechSupported
} from '../utils/agentVoiceService';

const INDIAN_LANGUAGES = [
  { name: 'English', code: 'en-US', native: 'English' },
  { name: 'Kannada', code: 'kn-IN', native: 'ಕನ್ನಡ' },
  { name: 'Hindi', code: 'hi-IN', native: 'हिन्दी' },
];

export default function AssistantPage() {
  const { user, language, changeLanguage } = useAuth();
  const { activeFarm, farms, setActiveFarm } = useFarm();
  const navigate = useNavigate();

  const [selectedLanguage, setSelectedLanguage] = useState(language || 'English');
  const [activePersona, setActivePersonaState] = useState(() => getActivePersona(language || 'English'));
  const [isPreviewingVoice, setIsPreviewingVoice] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [assistantState, setAssistantState] = useState('idle');
  const [farmPlan, setFarmPlan] = useState(null);
  const [isPlayingPlan, setIsPlayingPlan] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [updatingActionId, setUpdatingActionId] = useState(null);

  // Note Modal state
  const [noteModalAction, setNoteModalAction] = useState(null);
  const [farmerNoteText, setFarmerNoteText] = useState('');

  const langObj = INDIAN_LANGUAGES.find((l) => l.name === selectedLanguage) || INDIAN_LANGUAGES[0];
  const availablePersonas = getVoicePersonas(selectedLanguage);

  useEffect(() => {
    const persona = getActivePersona(selectedLanguage);
    setActivePersonaState(persona);
  }, [selectedLanguage]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      offlineStorage.processSyncQueue(api);
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cut off all voice audio when switching to another feature, navigating away, or hiding tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAgentSpeech();
        setIsPlayingPlan(false);
        setIsPreviewingVoice(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopAgentSpeech();
      setIsPlayingPlan(false);
      setIsPreviewingVoice(false);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {
          console.warn('Speech cancellation error:', e);
        }
      }
    };
  }, []);

  useEffect(() => {
    let greetingText = '';
    const farmerName = user?.full_name?.split(' ')[0] || 'Farmer';

    if (selectedLanguage === 'Kannada') {
      greetingText = activeFarm
        ? `ನಮಸ್ಕಾರ ${farmerName}! ನಾನು ನಿಮ್ಮ ಆಗ್ರೋವಿಷನ್ AI ಫಾರ್ಮ್ ಏಜೆಂಟ್. **${activeFarm.name}** (${activeFarm.crop || 'ಬೆಳೆ'}, ${activeFarm.location_name || 'ನಿಮ್ಮ ಪ್ರದೇಶ'}) ತೋಟದ ಲೈವ್ ಹವಾಮಾನ, ಮಣ್ಣಿನ ತೇವಾಂಶ ಮತ್ತು ಬೆಳೆ ಬೆಳವಣಿಗೆಯನ್ನು ಪರಿಶೀಲಿಸಿ ಇಂದಿನ ಕೃಷಿ ಯೋಜನೆಯನ್ನು ಸಿದ್ಧಪಡಿಸಿದ್ದೇನೆ.\n\nಮೇಲಿನ ಆಡಿಯೋ ಬಟನ್ ಒತ್ತಿ ಧ್ವನಿಯಲ್ಲಿ ಕೇಳಬಹುದು ಅಥವಾ ಕೆಳಗಿನ ತ್ವರಿತ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ.`
        : `ನಮಸ್ಕಾರ ${farmerName}! ಆಗ್ರೋವಿಷನ್ AI ಫಾರ್ಮ್ ಏಜೆಂಟ್‌ಗೆ ಸುಸ್ವಾಗತ. ನಿಮ್ಮ ತೋಟದ ಇಂದಿನ ಯೋಜನೆ, ನೀರಾವರಿ ಸಲಹೆ ಮತ್ತು ರೋಗ ಎಚ್ಚರಿಕೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ದಯವಿಟ್ಟು ತೋಟವನ್ನು ಆಯ್ಕೆಮಾಡಿ.`;
    } else if (selectedLanguage === 'Hindi') {
      greetingText = activeFarm
        ? `नमस्ते ${farmerName}! मैं आपका एग्रोविज़न AI फार्म एजेंट हूँ। **${activeFarm.name}** (${activeFarm.crop || 'फसल'}, ${activeFarm.location_name || 'आपका क्षेत्र'}) के लिए लाइव मौसम, मृदा नमी और फसल की स्थिति के आधार पर आज की प्राथमिकता योजना तैयार है।\n\nआप ऊपर दिए गए ऑडियो बटन से योजना सुन सकते हैं या सीधे बोलकर प्रश्न पूछ सकते हैं।`
        : `नमस्ते ${farmerName}! एग्रोविज़न AI फार्म एजेंट में आपका स्वागत है। अपने खेत की आज की योजना, सिंचाई और रोग सलाह लोड करने के लिए कृपया खेत चुनें।`;
    } else {
      greetingText = activeFarm
        ? `Namaskara ${farmerName}! I am your AI Farm Agent monitoring **${activeFarm.name}** (${activeFarm.crop || 'Crop'} in ${activeFarm.location_name || 'your region'}).\n\nI have synthesized your live weather, ${activeFarm.soil_type || 'soil'} parameters, IoT telemetry, and crop growth stage into today's action plan.`
        : `Namaskara ${farmerName}! Welcome to AgroVision AI Farm Agent. Please select or configure a farm to load your personalized Today's Farm Plan, irrigation advice, and disease alerts.`;
    }

    setMessages([
      {
        sender: 'ai',
        text: greetingText,
        time: 'Just now'
      }
    ]);
  }, [activeFarm?.id, user?.full_name, selectedLanguage]);

  const fetchTodayPlan = async () => {
    if (!activeFarm) return;
    try {
      if (navigator.onLine) {
        const res = await api.get(`/ai-farm-agent/today-plan/${activeFarm.id}`, {
          params: { language: selectedLanguage }
        });
        setFarmPlan(res.data);
        offlineStorage.saveFarmPlan(activeFarm.id, res.data);
      } else {
        const cached = offlineStorage.getFarmPlan(activeFarm.id);
        if (cached) setFarmPlan(cached);
      }
    } catch (err) {
      console.warn('Error fetching AI Farm Agent today-plan:', err);
      const cached = offlineStorage.getFarmPlan(activeFarm.id);
      if (cached) setFarmPlan(cached);
    }
  };

  useEffect(() => {
    fetchTodayPlan();
  }, [activeFarm?.id, selectedLanguage]);

  const isPlantation = activeFarm && ['coffee', 'pepper', 'black pepper', 'cardamom', 'arecanut'].some(c => (activeFarm.crop || '').toLowerCase().includes(c));

  const quickActions = selectedLanguage === 'Kannada' ? [
    { label: "ಇಂದಿನ ಯೋಜನೆ", query: "ಇಂದು ತೋಟದಲ್ಲಿ ನಾನು ಏನು ಮಾಡಬೇಕು?", icon: Sparkles },
    { label: "ಎಪಿಎಂಸಿ ಮಾರ್ಕೆಟ್ ಬೆಲೆ", query: "ಎಪಿಎಂಸಿ ಮಾರ್ಕೆಟ್ ಬೆಲೆ ಎಷ್ಟು?", icon: TrendingUp },
    { label: "ರಸಗೊಬ್ಬರ ಪ್ರಮಾಣ", query: `ನನ್ನ ${activeFarm?.size_acres || 1} ಎಕರೆ ${activeFarm?.crop || 'ಬೆಳೆ'}ಗೆ ಎಷ್ಟು ರಸಗೊಬ್ಬರ (DAP, ಯೂರಿಯಾ, ಪೊಟ್ಯಾಶ್) ಬೇಕು?`, icon: Bot },
    { label: "ನೀರಾವರಿ ಪರಿಶೀಲನೆ", query: "ನನ್ನ ಬೆಳೆಗೆ ಈಗ ನೀರಾವರಿ ಮಾಡಬೇಕಾ ಅಥವಾ ಮುಂದೂಡಬೇಕಾ?", icon: Droplets },
    { label: "ಸ್ಪ್ರೇ ಸಾಧ್ಯತೆ", query: "ಇಂದು ತೋಟದಲ್ಲಿ ಕೀಟನಾಶಕ ಅಥವಾ ಶಿಲೀಂಧ್ರನಾಶಕ ಸ್ಪ್ರೇ ಮಾಡಬಹುದೇ?", icon: CloudRain },
    { label: isPlantation ? "ರೋಗ & ತುಕ್ಕು ತಪಾಸಣೆ" : "ಬೆಳೆ ಆರೋಗ್ಯ", query: isPlantation ? `ನನ್ನ ${activeFarm?.crop || 'ಬೆಳೆ'}ಯಲ್ಲಿ ರೋಗ ಅಥವಾ ಎಲೆ ತುಕ್ಕು ನಿಯಂತ್ರಣ ಹೇಗೆ?` : "ಪ್ರಸ್ತುತ ರೋಗ ಮತ್ತು ಕೀಟಗಳ ಅಪಾಯವೇನಾದರೂ ಇದೆಯೇ?", icon: Bug },
    { label: "ಲೆಡ್ಜರ್ ಲಾಭ/ನಷ್ಟ", query: "ನನ್ನ ತೋಟದ ಒಟ್ಟು ಖರ್ಚು ಮತ್ತು ಲಾಭ ಎಷ್ಟು?", icon: Receipt }
  ] : selectedLanguage === 'Hindi' ? [
    { label: "आज की योजना", query: "आज मुझे अपने खेत में क्या करना चाहिए?", icon: Sparkles },
    { label: "एपीएमसी मंडी भाव", query: "एपीएमसी मंडी भाव क्या है?", icon: TrendingUp },
    { label: "खाद की मात्रा", query: `मेरे ${activeFarm?.size_acres || 1} एकड़ ${activeFarm?.crop || 'फसल'} के लिए कितनी खाद (DAP, यूरिया, पोटाश) चाहिए?`, icon: Bot },
    { label: "सिंचाई जांचें", query: "क्या मुझे अभी सिंचाई करनी चाहिए या टालनी चाहिए?", icon: Droplets },
    { label: "स्प्रे खिड़की", query: "क्या आज कीटनाशक या फफूंदनाशक का छिड़काव करना सुरक्षित है?", icon: CloudRain },
    { label: isPlantation ? "रोग व रस्ट नियंत्रण" : "फसल स्वास्थ्य", query: isPlantation ? `मेरी ${activeFarm?.crop || 'फसल'} में रोग नियंत्रण कैसे करें?` : "अभी फसल में कीट और रोग का क्या जोखिम है?", icon: Bug },
    { label: "लेज़र लाभ/खर्च", query: "मेरे खेत का कुल खर्च और लाभ कितना है?", icon: Receipt }
  ] : [
    { label: "Plan My Day", query: "What should I do today on my farm?", icon: Sparkles },
    { label: "APMC Market Price", query: "What is the APMC market price?", icon: TrendingUp },
    { label: "Fertilizer per Acre", query: `How much fertilizer (DAP, Urea, MOP) do I need for my ${activeFarm?.size_acres || 1} acres of ${activeFarm?.crop || 'crop'}?`, icon: Bot },
    { label: "Check Irrigation", query: "Should I irrigate my crop now or delay?", icon: Droplets },
    { label: "Can I Spray Today?", query: "Is it safe to spray fungicide or pesticide today based on wind and rain?", icon: CloudRain },
    { label: isPlantation ? "Disease & Rust Control" : "Check Crop Health", query: isPlantation ? `How to manage diseases and foliar stress on my ${activeFarm?.crop || 'plantation'}?` : "What are the disease and pest risks right now?", icon: Bug },
    { label: "Farm Profit & Ledger", query: "How much profit and expense have I recorded in my Farm Ledger?", icon: Receipt }
  ];

  const handleToggleAudio = () => {
    if (autoSpeak) {
      setAutoSpeak(false);
      stopAgentSpeech();
      setIsPlayingPlan(false);
      setIsPreviewingVoice(false);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {
          console.warn('Speech cancellation error:', e);
        }
      }
    } else {
      setAutoSpeak(true);
    }
  };

  const speakText = (text) => {
    if (!autoSpeak || !isSpeechSupported()) return;
    stopAgentSpeech();
    speakAgentMessage({
      text,
      language: selectedLanguage,
      persona: activePersona,
      onStart: () => {},
      onEnd: () => setIsPlayingPlan(false),
      onError: () => setIsPlayingPlan(false)
    });
  };

  const handleReadTodayPlan = () => {
    if (!isSpeechSupported()) {
      alert('Speech synthesis is not supported on this device.');
      return;
    }

    if (isPlayingPlan) {
      stopAgentSpeech();
      setIsPlayingPlan(false);
      return;
    }

    if (!autoSpeak) {
      setAutoSpeak(true);
    }

    const script =
      farmPlan?.voice_script ||
      farmPlan?.summary ||
      (selectedLanguage === 'Kannada'
        ? `${activeFarm?.name || 'ನಿಮ್ಮ ತೋಟ'}: ಇಂದಿನ ಕೃಷಿ ಯೋಜನೆ ಎಲ್ಲಾ ವ್ಯವಸ್ಥೆಗಳು ಸರಿಯಾಗಿವೆ.`
        : selectedLanguage === 'Hindi'
        ? `${activeFarm?.name || 'आपका खेत'}: आज की कार्य योजना सभी प्रणालियां सामान्य हैं।`
        : `Today's farm plan for ${activeFarm?.name}: All systems optimal.`);

    setIsPlayingPlan(true);
    stopAgentSpeech();
    speakAgentMessage({
      text: script,
      language: selectedLanguage,
      persona: activePersona,
      onStart: () => setIsPlayingPlan(true),
      onEnd: () => setIsPlayingPlan(false),
      onError: () => setIsPlayingPlan(false)
    });
  };

  const handleSelectPersona = (persona) => {
    setActivePersonaState(persona);
    setActivePersona(selectedLanguage, persona.id);
    handlePreviewVoice(persona);
  };

  const handlePreviewVoice = (personaToTest = activePersona) => {
    if (!isSpeechSupported()) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }
    stopAgentSpeech();
    setIsPreviewingVoice(true);
    previewVoice(selectedLanguage, personaToTest, {
      onStart: () => setIsPreviewingVoice(true),
      onEnd: () => setIsPreviewingVoice(false),
      onError: () => setIsPreviewingVoice(false)
    });
  };

  const handleUpdateActionStatus = async (actionId, newStatus, optionalNote = null) => {
    if (!activeFarm) return;
    setUpdatingActionId(actionId);

    const payload = {
      action_id: actionId,
      status: newStatus,
      note: optionalNote
    };

    try {
      if (navigator.onLine) {
        const res = await api.post(`/ai-farm-agent/today-plan/${activeFarm.id}/action-status`, payload, {
          params: { language: selectedLanguage }
        });
        setFarmPlan(res.data);
        offlineStorage.saveFarmPlan(activeFarm.id, res.data);
      } else {
        offlineStorage.enqueueSyncAction('UPDATE_ACTION_STATUS', {
          farm_id: activeFarm.id,
          ...payload
        });

        if (farmPlan && farmPlan.today_plan) {
          const updatedPlan = {
            ...farmPlan,
            today_plan: farmPlan.today_plan.map((item) =>
              item.id === actionId
                ? {
                    ...item,
                    status: newStatus,
                    is_completed: newStatus === 'COMPLETED',
                    farmer_note: optionalNote || item.farmer_note
                  }
                : item
            )
          };
          setFarmPlan(updatedPlan);
          offlineStorage.saveFarmPlan(activeFarm.id, updatedPlan);
        }
      }
    } catch (err) {
      console.error('Error updating action status:', err);
    } finally {
      setUpdatingActionId(null);
      setNoteModalAction(null);
    }
  };

  const handleConfirmAction = async (action, msgIdx) => {
    if (!action || !action.data) return;
    const payload = action.data;

    try {
      if (navigator.onLine) {
        await api.post('/ledger/transactions', payload);
      } else {
        offlineStorage.enqueueSyncAction('RECORD_TRANSACTION', payload);
      }

      setMessages((prev) => {
        const copy = [...prev];
        if (copy[msgIdx]) copy[msgIdx].action_confirmed = true;
        return [
          ...copy,
          {
            sender: 'ai',
            text: `✓ Confirmed! Recorded ₹${payload.cost?.toLocaleString()} under ${payload.category} for ${payload.crop} in your Farm Ledger.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ];
      });
      speakText(`Confirmed. Recorded in your farm ledger.`);
    } catch (err) {
      alert('Error recording transaction: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleCancelAction = (msgIdx) => {
    setMessages((prev) => {
      const copy = [...prev];
      if (copy[msgIdx]) copy[msgIdx].action_cancelled = true;
      return [
        ...copy,
        {
          sender: 'ai',
          text: 'Cancelled. The transaction was not recorded.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];
    });
    speakText('Action cancelled.');
  };

  const handleSend = async (textToSend) => {
    const query = textToSend || inputMessage;
    if (!query.trim()) return;

    const userMsg = {
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);
    setAssistantState('understanding');

    try {
      let aiText = '';
      let structured = null;
      let actionObj = null;

      const res = await api.post('/ai-farm-agent/chat', {
        farm_id: activeFarm?.id || null,
        message: query,
        language: selectedLanguage,
        page_context: 'AI Farm Co-Pilot Hub'
      });

      aiText = res.data.response;
      structured = {
        what_to_do: res.data.what_to_do,
        why: res.data.why,
        when_to_do: res.data.when_to_do,
        data_used: res.data.data_used,
        caution: res.data.caution
      };
      actionObj = res.data.action;

      if (actionObj && actionObj.type === 'navigate' && actionObj.path) {
        setTimeout(() => navigate(actionObj.path), 1500);
      }

      if (actionObj && actionObj.type === 'switch_farm' && farms && farms.length > 0) {
        const target = actionObj.target_crop?.toLowerCase();
        const matched = farms.find((f) =>
          (target && f.crop?.toLowerCase().includes(target)) ||
          (actionObj.target_text && f.name?.toLowerCase().includes(actionObj.target_text.toLowerCase()))
        );
        if (matched) {
          setActiveFarm(matched);
        }
      }

      setAssistantState('responding');
      const aiMsg = {
        sender: 'ai',
        text: aiText,
        structured: (structured.what_to_do || structured.why) ? structured : null,
        action: actionObj,
        citations: res.data.source_citations || [],
        language: res.data.language || selectedLanguage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMsg]);
      speakText(aiText);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'AgroVision AI offline or network connection error. Showing cached farm plan assistance.',
          time: 'Just now'
        }
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => setAssistantState('idle'), 3000);
    }
  };

  const handleMicClick = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser. Please use Chrome, Edge, or a modern Android browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      setAssistantState('idle');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = langObj.code;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setAssistantState('listening');
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        setAssistantState('understanding');
        handleSend(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setAssistantState('idle');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
      setAssistantState('idle');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto selection:bg-[#10B981] selection:text-black">
      {/* Offline Banner */}
      {isOffline && (
        <div className="os-card p-3 border-[#F59E0B]/30 bg-[#F59E0B]/5 flex items-center justify-between gap-3 text-xs text-[#F59E0B]">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-[#F59E0B] shrink-0" />
            <span>
              <strong>Offline Mode Active:</strong> Displaying cached Today's Farm Plan. Telemetry changes will be queued and synchronized automatically when connection restores.
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-[#F59E0B]/15 text-[10px] font-bold">Cached</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/20 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span> AI Farm Agent Co-Pilot
            </span>
            <span className="text-[10px] font-medium text-[#8FA59B]">
              Multi-Layer Telemetry Decision Engine
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F3F7F5] flex items-center gap-2.5">
            <Bot className="w-6 h-6 text-[#10B981]" />
            <span>AI Farm Agent & Advisory Co-Pilot</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8FA59B] mt-0.5">
            Synthesizing weather radar, IoT probes, crop phenology, and foliar pathology into daily actions.
          </p>
        </div>

        {/* Action Controls & Language/Voice Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {farms && farms.length > 0 && (
            <select
              value={activeFarm?.id || ''}
              onChange={(e) => {
                const found = farms.find((f) => f.id === parseInt(e.target.value));
                if (found) setActiveFarm(found);
              }}
              className="os-input text-xs font-semibold px-3 py-2 cursor-pointer bg-[#0E1E18]"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id} className="bg-[#0E1E18]">
                  🌱 {f.name} ({f.crop || 'Crop'})
                </option>
              ))}
            </select>
          )}

          {/* Voice Plan Button with Animated Soundwave */}
          <button
            onClick={handleReadTodayPlan}
            className={`text-xs px-3 py-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer shadow-md ${
              isPlayingPlan
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 animate-pulse'
                : 'bg-[#10B981]/15 border-[#10B981]/30 hover:bg-[#10B981]/25 text-[#10B981]'
            }`}
          >
            {isPlayingPlan ? (
              <>
                <Square className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="font-bold">
                  {selectedLanguage === 'Kannada' ? 'ಧ್ವನಿ ನಿಲ್ಲಿಸಿ' : selectedLanguage === 'Hindi' ? 'आवाज़ रोकें' : 'Stop Audio'}
                </span>
                <span className="flex items-center gap-0.5 ml-1 h-3">
                  <span className="w-0.5 h-full bg-amber-400 animate-bounce" />
                  <span className="w-0.5 h-2/3 bg-amber-400 animate-pulse" />
                  <span className="w-0.5 h-full bg-amber-400 animate-bounce delay-75" />
                </span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span className="font-semibold">
                  {selectedLanguage === 'Kannada'
                    ? 'ಯೋಜನೆ ಆಲಿಸಿ'
                    : selectedLanguage === 'Hindi'
                    ? 'योजना सुनें'
                    : 'Listen to Farm Plan'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FARMER LANGUAGE SELECTION BAR (English, Kannada, Hindi) */}
      {/* ========================================================================= */}
      <div className="os-card p-3 sm:p-4 border-[#10B981]/25 bg-gradient-to-r from-[#0C2419] via-[#0E1E18] to-[#0C2419] shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Section Label */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#10B981]/15 text-[#10B981] flex items-center justify-center border border-[#10B981]/30 shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#F3F7F5]">
                {selectedLanguage === 'Kannada'
                  ? 'ಕೃಷಿ ಭಾಷೆ ಆಯ್ಕೆ'
                  : selectedLanguage === 'Hindi'
                  ? 'किसान भाषा चयन'
                  : 'Farmer Language Selection'}
              </span>
              <p className="text-[11px] text-[#8FA59B]">
                {selectedLanguage === 'Kannada'
                  ? 'ನಿಮ್ಮ AI ಕೃಷಿ ಸಹಾಯಕರೊಂದಿಗೆ ಸಂವಹನ ನಡೆಸಲು ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ'
                  : selectedLanguage === 'Hindi'
                  ? 'अपने एआई फार्म एजेंट से बातचीत के लिए भाषा चुनें'
                  : 'Select communication language for your AI Farm Agent'}
              </p>
            </div>
          </div>

          {/* Languages (English, Kannada, Hindi) */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { name: 'English', label: 'English', flag: '🇬🇧' },
              { name: 'Kannada', label: 'ಕನ್ನಡ (Kannada)', flag: '🇮🇳' },
              { name: 'Hindi', label: 'हिन्दी (Hindi)', flag: '🇮🇳' }
            ].map((langItem) => {
              const isSelected = selectedLanguage === langItem.name;
              return (
                <button
                  key={langItem.name}
                  onClick={() => {
                    setSelectedLanguage(langItem.name);
                    changeLanguage(langItem.name);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                    isSelected
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.35)] scale-102 font-extrabold'
                      : 'bg-[#08120E] text-[#8FA59B] hover:text-[#F3F7F5] border border-[#1B382D] hover:border-[#10B981]/40'
                  }`}
                >
                  <span>{langItem.flag}</span>
                  <span>{langItem.label}</span>
                  {isSelected && <Check className="w-3 h-3 text-slate-950 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Farm Health Telemetry Grid */}
      {activeFarm && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* 1. Crop & Growth Stage */}
          <div className="os-card p-3 space-y-1">
            <span className="text-[10px] text-[#8FA59B] font-semibold uppercase flex items-center gap-1">
              <Sprout className="w-3 h-3 text-[#10B981]" /> Crop & Stage
            </span>
            <p className="text-xs font-bold text-[#F3F7F5] truncate">{activeFarm.crop || 'Crop'}</p>
            <p className="text-[11px] text-[#10B981] font-medium truncate">
              {farmPlan?.crop_stage || activeFarm.current_stage_override || 'Vegetative'} (Day {farmPlan?.crop_age_days || '1'})
            </p>
          </div>

          {/* 2. Soil Moisture & Sensor */}
          <div className="os-card p-3 space-y-1">
            <span className="text-[10px] text-[#8FA59B] font-semibold uppercase flex items-center gap-1">
              <Droplets className="w-3 h-3 text-[#14B8A6]" /> Soil Moisture
            </span>
            <p className="text-xs font-bold text-[#F3F7F5]">
              {farmPlan?.data_sources?.sensors?.includes('Online') ? 'Sensor Active' : 'Optimal Zone'}
            </p>
            <p className="text-[11px] text-[#14B8A6] font-medium truncate">
              {activeFarm.soil_type || 'Loam'} • pH {activeFarm.soil_ph || 6.5}
            </p>
          </div>

          {/* 3. Live Weather Radar */}
          <div className="os-card p-3 space-y-1">
            <span className="text-[10px] text-[#8FA59B] font-semibold uppercase flex items-center gap-1">
              <CloudRain className="w-3 h-3 text-[#38BDF8]" /> Weather Radar
            </span>
            <p className="text-xs font-bold text-[#F3F7F5] truncate">
              {activeFarm.location_name || 'Plot Location'}
            </p>
            <p className="text-[11px] text-[#38BDF8] font-medium">Open-Meteo High-Res</p>
          </div>

          {/* 5. Pathology Scans */}
          <div className="os-card p-3 space-y-1">
            <span className="text-[10px] text-[#8FA59B] font-semibold uppercase flex items-center gap-1">
              <Bug className="w-3 h-3 text-[#EF4444]" /> Pathology
            </span>
            <p className="text-xs font-bold text-[#F3F7F5]">AI Vision Scans</p>
            <p className="text-[11px] text-[#10B981] font-medium">Low Risk</p>
          </div>

          {/* 6. Farm Area */}
          <div className="os-card p-3 space-y-1">
            <span className="text-[10px] text-[#8FA59B] font-semibold uppercase flex items-center gap-1">
              <Activity className="w-3 h-3 text-[#F59E0B]" /> Farm Plot
            </span>
            <p className="text-xs font-bold text-[#F3F7F5]">{activeFarm.size_acres || 1.0} Acres</p>
            <p className="text-[11px] text-[#F59E0B] font-medium truncate">
              {activeFarm.irrigation_method || 'Drip Irrigation'}
            </p>
          </div>
        </div>
      )}

      {/* Proactive Alerts Ribbon */}
      {farmPlan?.alerts && farmPlan.alerts.length > 0 && (
        <div className="space-y-2">
          {farmPlan.alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`os-card p-3 flex items-center justify-between gap-3 text-xs ${
                alert.severity === 'danger'
                  ? 'border-[#EF4444]/30 bg-[#EF4444]/5 text-[#EF4444]'
                  : alert.severity === 'warning'
                  ? 'border-[#F59E0B]/30 bg-[#F59E0B]/5 text-[#F59E0B]'
                  : 'border-[#14B8A6]/30 bg-[#14B8A6]/5 text-[#14B8A6]'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <div>
                  <strong className="font-bold">{alert.title}:</strong> <span className="text-[#8FA59B]">{alert.message}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Action Buttons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {quickActions.map((qa, idx) => {
          const Icon = qa.icon;
          return (
            <button
              key={idx}
              onClick={() => handleSend(qa.query)}
              className="os-card p-2.5 text-xs font-semibold text-[#8FA59B] hover:text-[#F3F7F5] hover:border-[#10B981]/40 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Icon className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
              <span className="truncate">{qa.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Workspace: Today's Farm Plan Action Cards + Interactive AI Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Today's Farm Plan & Action Status Tracking */}
        <div className="lg:col-span-5 space-y-3.5">
          <div className="os-card p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#1B382D] pb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#10B981]" />
                <h2 className="font-bold text-xs text-[#F3F7F5] uppercase tracking-wide">Today's Farm Plan</h2>
              </div>
              <span className="text-[10px] text-[#8FA59B]">
                {farmPlan?.total_actions || 0} Actions • {farmPlan?.completed_count || 0} Done
              </span>
            </div>

            <p className="text-xs text-[#8FA59B] leading-relaxed">
              {farmPlan?.summary || "Prioritized daily farm actions synthesized from live farm telemetry."}
            </p>

            {/* Action Cards List */}
            <div className="space-y-2.5 pt-1">
              {farmPlan?.today_plan && farmPlan.today_plan.length > 0 ? (
                farmPlan.today_plan.map((actionItem) => (
                  <div
                    key={actionItem.id}
                    className={`p-3.5 rounded-xl border space-y-2 text-xs transition-all ${
                      actionItem.status === 'COMPLETED'
                        ? 'bg-[#10B981]/5 border-[#10B981]/25 opacity-85'
                        : actionItem.status === 'SKIPPED'
                        ? 'bg-[#08120E] border-[#1B382D] opacity-60'
                        : actionItem.status === 'IN_PROGRESS'
                        ? 'bg-[#14B8A6]/5 border-[#14B8A6]/30'
                        : 'bg-[#08120E] border-[#1B382D]'
                    }`}
                  >
                    {/* Header: Priority & Title */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider mt-0.5 shrink-0 ${
                            actionItem.priority === 'HIGH'
                              ? 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/25'
                              : actionItem.priority === 'MEDIUM'
                              ? 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/25'
                              : 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/25'
                          }`}
                        >
                          {actionItem.priority}
                        </span>
                        <div>
                          <h3 className={`font-bold text-[#F3F7F5] text-xs ${actionItem.status === 'COMPLETED' ? 'line-through text-[#8FA59B]' : ''}`}>
                            {actionItem.action || actionItem.title}
                          </h3>
                          <span className="text-[10px] text-[#8FA59B] block mt-0.5">
                            Window: <strong className="text-[#F3F7F5]">{actionItem.when_to_do || actionItem.best_time}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Status Selector Dropdown */}
                      <select
                        value={actionItem.status || 'PENDING'}
                        onChange={(e) => handleUpdateActionStatus(actionItem.id, e.target.value)}
                        disabled={updatingActionId === actionItem.id}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border focus:outline-none cursor-pointer ${
                          actionItem.status === 'COMPLETED'
                            ? 'bg-[#10B981]/15 border-[#10B981]/30 text-[#10B981]'
                            : actionItem.status === 'IN_PROGRESS'
                            ? 'bg-[#14B8A6]/15 border-[#14B8A6]/30 text-[#14B8A6]'
                            : actionItem.status === 'SKIPPED'
                            ? 'bg-[#08120E] border-[#1B382D] text-[#8FA59B]'
                            : 'bg-[#0E1E18] border-[#1B382D] text-[#8FA59B]'
                        }`}
                      >
                        <option value="PENDING" className="bg-[#0E1E18] text-[#F3F7F5]">Pending</option>
                        <option value="IN_PROGRESS" className="bg-[#0E1E18] text-[#14B8A6]">In Progress</option>
                        <option value="COMPLETED" className="bg-[#0E1E18] text-[#10B981]">Completed</option>
                        <option value="SKIPPED" className="bg-[#0E1E18] text-[#8FA59B]">Skipped</option>
                      </select>
                    </div>

                    {/* Rationale */}
                    <p className="text-[11px] text-[#8FA59B] leading-relaxed">
                      {actionItem.reason || actionItem.why_recommended}
                    </p>

                    {/* Condition & Source Citations */}
                    <div className="p-2 rounded-lg bg-[#0E1E18] border border-[#1B382D] space-y-0.5 text-[10px] text-[#8FA59B]">
                      <div><strong className="text-[#F3F7F5]">Trigger:</strong> {actionItem.related_condition}</div>
                      <div><strong className="text-[#F3F7F5]">Telemetry Source:</strong> <span className="text-[#10B981]">{actionItem.source_data}</span></div>
                    </div>

                    {/* Farmer Note if present */}
                    {actionItem.farmer_note && (
                      <div className="p-2 rounded-lg bg-[#10B981]/10 border border-[#10B981]/20 text-[10px] text-[#10B981] flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span><strong>Note:</strong> {actionItem.farmer_note}</span>
                      </div>
                    )}

                    {/* Bottom Action Links */}
                    <div className="pt-1 flex items-center justify-between text-[11px]">
                      <button
                        onClick={() => {
                          setNoteModalAction(actionItem);
                          setFarmerNoteText(actionItem.farmer_note || '');
                        }}
                        className="text-[#8FA59B] hover:text-[#10B981] flex items-center gap-1 font-medium cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" /> {actionItem.farmer_note ? 'Edit Note' : 'Add Note'}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSend(`Explain why "${actionItem.action || actionItem.title}" is recommended today.`)}
                          className="text-[#10B981] hover:underline font-semibold cursor-pointer"
                        >
                          Ask AI Why →
                        </button>
                        {actionItem.action_route && (
                          <Link
                            to={actionItem.action_route}
                            className="px-2 py-0.5 rounded bg-[#10B981]/15 hover:bg-[#10B981] hover:text-[#08120E] text-[#10B981] font-semibold transition-colors text-[10px]"
                          >
                            {actionItem.action_text || 'Open Tool'}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 rounded-xl bg-[#08120E] text-[#8FA59B] text-xs text-center">
                  Loading prioritized farm actions...
                </div>
              )}
            </div>

            <button
              onClick={handleReadTodayPlan}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md ${
                isPlayingPlan
                  ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 animate-pulse'
                  : 'os-btn-primary'
              }`}
            >
              {isPlayingPlan ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>
                    {selectedLanguage === 'Kannada'
                      ? 'ಧ್ವನಿ ನಿಲ್ಲಿಸಿ (Stop Voice)'
                      : selectedLanguage === 'Hindi'
                      ? 'आवाज़ रोकें (Stop Voice)'
                      : 'Stop Audio Briefing'}
                  </span>
                  <span className="flex items-center gap-0.5 ml-1 h-3">
                    <span className="w-0.5 h-full bg-amber-400 animate-bounce" />
                    <span className="w-0.5 h-2/3 bg-amber-400 animate-pulse" />
                    <span className="w-0.5 h-full bg-amber-400 animate-bounce delay-75" />
                  </span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>
                    {selectedLanguage === 'Kannada'
                      ? 'ಕನ್ನಡ ಆಡಿಯೋ ಬ್ರೀಫಿಂಗ್ ಆಲಿಸಿ'
                      : selectedLanguage === 'Hindi'
                      ? 'हिंदी ऑडियो ब्रीफिंग सुनें'
                      : 'Listen to Spoken Briefing'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: AI Co-Pilot Chat Stream */}
        <div className="lg:col-span-7 os-card flex flex-col h-[650px] overflow-hidden">
          {/* Status Header */}
          <div className="px-4 py-3 border-b border-[#1B382D] bg-[#08120E] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                assistantState === 'listening' ? 'bg-[#EF4444] animate-ping' :
                assistantState === 'understanding' ? 'bg-[#F59E0B] animate-pulse' :
                'bg-[#10B981] animate-pulse'
              }`} />
              <span className="font-semibold text-[#F3F7F5] text-xs">
                {assistantState === 'listening'
                  ? 'Listening to speech...'
                  : assistantState === 'understanding'
                  ? 'Analyzing farm telemetry...'
                  : assistantState === 'responding'
                  ? 'Synthesizing voice response...'
                  : 'AI Farm Agent Ready'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#8FA59B] text-[11px] font-medium">Audio:</span>
              <button
                type="button"
                onClick={handleToggleAudio}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                  autoSpeak
                    ? 'bg-[#10B981]/20 border-[#10B981]/50 text-[#10B981] shadow-sm hover:bg-[#10B981]/30'
                    : 'bg-[#1B382D]/40 border-[#1B382D] text-[#8FA59B] hover:text-[#F3F7F5] hover:border-[#8FA59B]/40'
                }`}
                title={autoSpeak ? 'Audio is ON — Click to turn OFF' : 'Audio is OFF — Click to turn ON'}
                aria-label={autoSpeak ? 'Turn Audio Off' : 'Turn Audio On'}
              >
                {autoSpeak ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>ON</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-[#8FA59B]" />
                    <span>OFF</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 text-xs ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-lg bg-[#10B981]/15 text-[#10B981] flex items-center justify-center shrink-0 border border-[#10B981]/25 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] p-3.5 rounded-xl leading-relaxed space-y-2 ${
                    msg.sender === 'user'
                      ? 'bg-[#10B981] text-[#08120E] font-medium rounded-br-none shadow-sm'
                      : 'bg-[#08120E] border border-[#1B382D] text-[#F3F7F5] rounded-bl-none shadow-sm'
                  }`}
                >
                  {/* Structured 5-Point Box if present */}
                  {msg.structured ? (() => {
                    const isMsgKannada = selectedLanguage === 'Kannada' || msg.language === 'Kannada' || /[\u0C80-\u0CFF]/.test(msg.text || '') || /[\u0C80-\u0CFF]/.test(msg.structured?.what_to_do || '');
                    const isMsgHindi = selectedLanguage === 'Hindi' || msg.language === 'Hindi' || /[\u0900-\u097F]/.test(msg.text || '') || /[\u0900-\u097F]/.test(msg.structured?.what_to_do || '');

                    return (
                      <div className="space-y-2 text-xs">
                        {msg.structured.what_to_do && (
                          <div className="p-2.5 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                            <span className="font-bold text-[#10B981] block text-[10px] uppercase tracking-wider">
                              {isMsgKannada ? 'ಏನು ಮಾಡಬೇಕು (WHAT TO DO)' : isMsgHindi ? 'क्या करें (WHAT TO DO)' : 'WHAT TO DO'}
                            </span>
                            <p className="text-[#F3F7F5] font-semibold whitespace-pre-line mt-0.5">{msg.structured.what_to_do}</p>
                          </div>
                        )}

                        {msg.structured.why && (
                          <div>
                            <span className="font-semibold text-[#8FA59B] block text-[10px] uppercase">
                              {isMsgKannada ? 'ಏಕೆ (WHY)' : isMsgHindi ? 'क्यों (WHY)' : 'WHY'}
                            </span>
                            <p className="text-[#8FA59B] whitespace-pre-line mt-0.5">{msg.structured.why}</p>
                          </div>
                        )}

                        {msg.structured.when_to_do && (
                          <div>
                            <span className="font-semibold text-[#8FA59B] block text-[10px] uppercase">
                              {isMsgKannada ? 'ಯಾವಾಗ (WHEN)' : isMsgHindi ? 'कब (WHEN)' : 'WHEN'}
                            </span>
                            <p className="text-[#F3F7F5] font-medium mt-0.5">{msg.structured.when_to_do}</p>
                          </div>
                        )}

                        {msg.structured.data_used && (
                          <div className="p-2 rounded-lg bg-[#0E1E18] border border-[#1B382D] text-[10px] text-[#8FA59B]">
                            <span className="font-semibold text-[#10B981]">
                              {isMsgKannada ? 'ಬಳಸಿದ ಮಾಹಿತಿ (DATA BASIS): ' : isMsgHindi ? 'डेटा आधार (DATA BASIS): ' : 'DATA BASIS: '}
                            </span>
                            <span>{msg.structured.data_used}</span>
                          </div>
                        )}

                        {msg.structured.caution && (
                          <div className="p-2 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[10px] text-[#F59E0B] flex items-start gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>
                              <strong>{isMsgKannada ? 'ಎಚ್ಚರಿಕೆ (CAUTION): ' : isMsgHindi ? 'सावधानी (CAUTION): ' : 'CAUTION: '}</strong>
                              {msg.structured.caution}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })() : (
                    <p className="whitespace-pre-line text-xs leading-relaxed">{msg.text}</p>
                  )}

                  {/* Interactive Action Confirmation Card */}
                  {msg.action && msg.action.type === 'record_expense' && !msg.action_confirmed && !msg.action_cancelled && (
                    <div className="mt-2 p-3 rounded-lg bg-[#0E1E18] border border-[#10B981]/30 space-y-2">
                      <div className="flex items-center gap-2 text-[#10B981] font-semibold text-xs">
                        <Receipt className="w-3.5 h-3.5 shrink-0" />
                        <span>{msg.action.confirmation_prompt}</span>
                      </div>
                      <div className="text-[11px] text-[#8FA59B] grid grid-cols-2 gap-1.5 bg-[#08120E] p-2 rounded border border-[#1B382D]">
                        <div>Category: <span className="font-semibold text-[#F3F7F5]">{msg.action.data.category}</span></div>
                        <div>Amount: <span className="font-bold text-[#10B981]">₹{msg.action.data.cost?.toLocaleString()}</span></div>
                        <div>Crop: <span className="font-semibold text-[#F3F7F5]">{msg.action.data.crop}</span></div>
                        <div>Stage: <span className="font-semibold text-[#F3F7F5]">{msg.action.data.stage}</span></div>
                      </div>
                      <div className="flex items-center gap-2 pt-0.5">
                        <button
                          onClick={() => handleConfirmAction(msg.action, idx)}
                          className="os-btn-primary px-3 py-1 text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                          <span>Confirm & Record</span>
                        </button>
                        <button
                          onClick={() => handleCancelAction(idx)}
                          className="os-btn-secondary px-3 py-1 text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {msg.citations && msg.citations.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {msg.citations.map((c, cIdx) => (
                        <span key={cIdx} className="text-[9px] px-1.5 py-0.5 rounded bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/25 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" /> {c}
                        </span>
                      ))}
                    </div>
                  )}

                  <span className="text-[9px] text-[#8FA59B] block text-right pt-0.5">{msg.time}</span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-[#8FA59B] pl-2">
                <RefreshCw className="w-3 h-3 animate-spin text-[#10B981]" />
                <span>AI Farm Agent reasoning through telemetry...</span>
              </div>
            )}
          </div>

          {/* Input Bar & Voice Trigger */}
          <div className="p-3 border-t border-[#1B382D] bg-[#08120E]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={handleMicClick}
                className={`p-2.5 rounded-xl transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                  isListening
                    ? 'bg-[#EF4444] text-white animate-pulse'
                    : 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 hover:bg-[#10B981] hover:text-[#08120E]'
                }`}
                title="Speak to farm agent"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={`Ask farm co-pilot in ${langObj.native} or English...`}
                className="os-input flex-1 text-xs"
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() || loading}
                className="os-btn-primary p-2.5 rounded-xl transition-all shrink-0 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Note Edit Modal */}
      {noteModalAction && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0E1E18] border border-[#1B382D] p-5 rounded-2xl space-y-3.5 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-[#1B382D] pb-2.5">
              <h3 className="font-bold text-xs text-[#F3F7F5] flex items-center gap-2">
                <Edit3 className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Add Farmer Execution Note</span>
              </h3>
              <button
                onClick={() => setNoteModalAction(null)}
                className="text-[#8FA59B] hover:text-[#F3F7F5]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[#8FA59B]">
              Record execution note for: <strong className="text-[#F3F7F5]">{noteModalAction.action || noteModalAction.title}</strong>
            </p>

            <textarea
              value={farmerNoteText}
              onChange={(e) => setFarmerNoteText(e.target.value)}
              placeholder="e.g. Completed 45 mins drip fertigation; soil responded well..."
              className="os-input w-full h-24 p-2.5 text-xs"
            />

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setNoteModalAction(null)}
                className="os-btn-secondary px-3 py-1.5 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateActionStatus(noteModalAction.id, noteModalAction.status || 'COMPLETED', farmerNoteText)}
                className="os-btn-primary px-3.5 py-1.5 text-xs cursor-pointer"
              >
                Save Note & Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
