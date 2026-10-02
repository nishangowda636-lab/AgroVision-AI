import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Volume2, Bot, X, Sparkles, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFarm } from '../context/FarmContext';
import api from '../services/api';
import { scaleIn } from '../utils/motion';

const LANG_CODE_MAP = {
  'English': 'en-US',
  'Kannada': 'kn-IN',
  'Hindi': 'hi-IN',
  'Telugu': 'te-IN',
  'Tamil': 'ta-IN',
  'Malayalam': 'ml-IN',
  'Marathi': 'mr-IN',
  'Bengali': 'bn-IN',
  'Gujarati': 'gu-IN',
  'Punjabi': 'pa-IN',
  'Odia': 'or-IN',
  'Urdu': 'ur-IN'
};

export default function VoiceWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [activeLang, setActiveLang] = useState('English');
  const [processing, setProcessing] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const { language } = useAuth();
  const { activeFarm } = useFarm();
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (language && LANG_CODE_MAP[language]) {
      setActiveLang(language);
    }
  }, [language]);

  const handleStartVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = LANG_CODE_MAP[activeLang] || 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('Listening...');
      setPendingAction(null);
    };

    recognition.onresult = async (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setIsListening(false);
      await sendQuery(text);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setTranscript('Could not capture audio. Please tap mic and try again.');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const sendQuery = async (queryText) => {
    setProcessing(true);
    setPendingAction(null);
    try {
      let reply = '';
      let actionObj = null;

      if (activeFarm?.id) {
        const res = await api.post(`/farms/${activeFarm.id}/ai-agent`, {
          message: queryText,
          language: activeLang
        });
        reply = res.data.response;
        actionObj = res.data.action;
      } else {
        const res = await api.post('/assistant/chat', {
          farm_id: null,
          message: queryText,
          language: activeLang,
          page_context: 'voice_widget'
        });
        reply = res.data.response;
      }

      setResponse(reply);
      setPendingAction(actionObj);
      speakResponse(reply);
    } catch {
      const fallback = 'Sorry, could not process your request right now. Please check your farm connection.';
      setResponse(fallback);
      speakResponse(fallback);
    } finally {
      setProcessing(false);
    }
  };

  const speakResponse = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_CODE_MAP[activeLang] || 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleStopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  };

  return (
    <>
      {/* Floating Co-Pilot Voice Button */}
      <div className="fixed bottom-20 lg:bottom-6 right-5 z-40">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`relative p-3.5 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-2xl cursor-pointer ${
            isListening
              ? 'bg-rose-500 text-white shadow-[0_0_25px_rgba(244,63,94,0.6)]'
              : speaking
              ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-glow-emerald'
              : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-glow-emerald hover:brightness-110'
          }`}
          title="AgroVision AI Farm Co-Pilot"
        >
          {/* Subtle Pulse Ring when listening */}
          {isListening && (
            <span className="absolute inset-0 rounded-2xl bg-rose-500/40 animate-ping pointer-events-none" />
          )}

          {isListening ? (
            <Mic className="w-5 h-5 animate-pulse" />
          ) : speaking ? (
            <div className="flex items-center gap-0.5 h-5 px-0.5">
              <span className="w-1 bg-slate-950 rounded-full audio-bar-1" />
              <span className="w-1 bg-slate-950 rounded-full audio-bar-2" />
              <span className="w-1 bg-slate-950 rounded-full audio-bar-3" />
              <span className="w-1 bg-slate-950 rounded-full audio-bar-4" />
            </div>
          ) : (
            <Bot className="w-5 h-5" />
          )}
        </motion.button>
      </div>

      {/* Voice Co-Pilot Modal / Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            {...scaleIn}
            className="fixed bottom-36 lg:bottom-20 right-5 w-84 sm:w-96 rounded-3xl glass-panel-dark border border-emerald-500/30 p-5 shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-emerald-500/15">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-100 font-heading">AI Farm Co-Pilot</h3>
                  <p className="text-[10px] text-emerald-400 font-mono">AgroVision Voice Engine</p>
                </div>
              </div>
              <button
                onClick={() => {
                  handleStopSpeaking();
                  setIsOpen(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-emerald-950/40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Area */}
            <div className="py-4 space-y-3 min-h-[140px] flex flex-col justify-center">
              {isListening && (
                <div className="text-center space-y-2 py-3">
                  <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/40 animate-pulse">
                    <Mic className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold text-rose-300">Listening to your question...</p>
                  <p className="text-[11px] text-slate-400">Ask about weather, irrigation, crop health, or fertilizer</p>
                </div>
              )}

              {processing && (
                <div className="text-center space-y-2 py-3">
                  <Loader2 className="w-7 h-7 text-emerald-400 animate-spin mx-auto" />
                  <p className="text-xs font-semibold text-emerald-300">Analyzing farm intelligence...</p>
                </div>
              )}

              {!isListening && !processing && transcript && (
                <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/15 text-[11px] text-slate-300">
                  <span className="text-[10px] font-mono text-emerald-400/80 block uppercase">You Asked:</span>
                  {transcript}
                </div>
              )}

              {!isListening && !processing && response && (
                <div className="p-3 rounded-2xl bg-emerald-950/50 border border-emerald-500/25 text-xs text-slate-200 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  <span className="text-[10px] font-mono text-emerald-400 block uppercase font-bold">Co-Pilot Advisory:</span>
                  <p className="leading-relaxed whitespace-pre-line">{response}</p>
                </div>
              )}

              {!isListening && !processing && !transcript && !response && (
                <div className="text-center py-4 text-xs text-slate-400 space-y-2">
                  <p>Tap the microphone below to ask a question in your preferred language.</p>
                  <p className="text-[10px] font-mono text-emerald-400">Language: {activeLang}</p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="pt-3 border-t border-emerald-500/15 flex items-center justify-between gap-2">
              <button
                onClick={handleStartVoice}
                disabled={isListening || processing}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-glow-emerald hover:brightness-110 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Mic className="w-4 h-4" />
                <span>{isListening ? 'Listening...' : 'Tap to Speak'}</span>
              </button>

              {speaking && (
                <button
                  onClick={handleStopSpeaking}
                  className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 transition-colors"
                  title="Stop Audio"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
