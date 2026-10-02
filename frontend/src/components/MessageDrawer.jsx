import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageSquare } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function MessageDrawer({
  isOpen,
  onClose,
  recipientId,
  recipientName = 'Agricultural Officer'
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const defaultReplies = [
    "Can you advise on pest control for my crop?",
    "What is the recommended fertilizer dosage?",
    "How can I prevent waterlogging during rains?"
  ];

  const fetchMessages = async () => {
    if (!recipientId || !isOpen) return;
    try {
      const res = await api.get(`/messages/${recipientId}`);
      setMessages(res.data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  useEffect(() => {
    if (recipientId && isOpen) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 4000);
      return () => clearInterval(interval);
    }
  }, [recipientId, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (textToSend) => {
    const content = textToSend || inputText;
    if (!content.trim() || !recipientId) return;

    setInputText('');
    setLoading(true);

    try {
      await api.post('/messages', {
        receiver_id: recipientId,
        content: content
      });
      fetchMessages();
    } catch (err) {
      alert('Error sending message: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-md bg-[#04131B] border-l border-emerald-500/30 h-full flex flex-col justify-between shadow-2xl"
        >
          {/* Drawer Header */}
          <div className="p-4 border-b border-emerald-500/20 flex items-center justify-between bg-emerald-950/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-black font-extrabold flex items-center justify-center text-sm shadow-glow-emerald">
                {recipientName?.charAt(0) || 'O'}
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">{recipientName}</h3>
                <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Direct AgroVision Advisory
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-emerald-900/50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
                <p>Start a direct, secure conversation with {recipientName}.</p>
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.sender_id === user?.id;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? 'bg-emerald-600 text-black font-semibold rounded-br-none shadow-md'
                          : 'bg-[#0B2B1D] border border-emerald-500/30 text-slate-200 rounded-bl-none'
                      }`}
                    >
                      <p>{m.content}</p>
                    </div>
                    <span className="text-[9px] text-slate-500 mt-1 px-1">
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Suggestions Chips */}
          <div className="px-3 py-2 border-t border-emerald-500/10 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {defaultReplies.map((reply, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(reply)}
                className="px-2.5 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[10px] whitespace-nowrap hover:bg-emerald-900 cursor-pointer shrink-0"
              >
                {reply}
              </button>
            ))}
          </div>

          {/* Chat Input */}
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-3 border-t border-emerald-500/20 bg-[#04131B] flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Message ${recipientName}...`}
              className="flex-1 px-3 py-2.5 rounded-xl glass-input text-xs"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="p-2.5 rounded-xl bg-emerald-500 text-black font-bold shadow-glow-emerald hover:bg-emerald-400 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
