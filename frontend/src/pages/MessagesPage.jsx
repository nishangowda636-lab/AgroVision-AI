import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, User as UserIcon, ShieldCheck, Clock, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/messages/conversations');
      setConversations(res.data);
      if (res.data.length > 0 && !activeUser) {
        setActiveUser(res.data[0]);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (recipientId) => {
    if (!recipientId) return;
    try {
      const res = await api.get(`/messages/${recipientId}`);
      setMessages(res.data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeUser) {
      fetchMessages(activeUser.user_id);
    }
  }, [activeUser]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeUser) return;

    const content = inputText;
    setInputText('');

    try {
      await api.post('/messages', {
        receiver_id: activeUser.user_id,
        content: content
      });
      fetchMessages(activeUser.user_id);
      fetchConversations();
    } catch (err) {
      alert('Error sending message: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto h-[calc(100vh-5rem)] flex flex-col selection:bg-emerald-500 selection:text-black">
      {/* Header */}
      <div className="border-b border-[#1B382D] pb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="os-status-pill os-status-emerald">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Advisory Channel
            </span>
            <span className="text-[11px] text-[#8FA59B]">Extension Officer Direct Link</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-[#F3F7F5] flex items-center gap-2.5">
            <MessageSquare className="w-7 h-7 text-emerald-400" />
            <span>Agricultural Advisory Messaging</span>
          </h1>
          <p className="text-xs text-[#8FA59B] mt-0.5">
            Direct communication channel between farmers, agronomy specialists, and Krishi Vigyan Kendra extension officers.
          </p>
        </div>
      </div>

      {/* Main Split Chat Layout */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-0 os-card-elevated overflow-hidden min-h-0">
        {/* Left: Conversation Threads List */}
        <div className="border-r border-[#1B382D] flex flex-col h-full overflow-hidden bg-[#08120E]">
          <div className="p-3.5 border-b border-[#1B382D] flex items-center justify-between">
            <h3 className="font-bold text-xs text-[#F3F7F5] uppercase tracking-wider">Active Conversations ({conversations.length})</h3>
            <button
              onClick={fetchConversations}
              className="text-[#8FA59B] hover:text-emerald-400 p-1 cursor-pointer"
              title="Refresh inbox"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#1B382D]">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8FA59B]">
                No active conversations yet.
              </div>
            ) : (
              conversations.map((c) => {
                const isSelected = activeUser?.user_id === c.user_id;
                return (
                  <div
                    key={c.user_id}
                    onClick={() => setActiveUser(c)}
                    className={`p-3.5 transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? 'bg-[#122820] border-l-3 border-emerald-400'
                        : 'hover:bg-[#0E1E18]'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-400 text-black font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                      {c.user_name?.charAt(0) || 'U'}
                    </div>

                    <div className="flex-1 overflow-hidden space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#F3F7F5] truncate">{c.user_name}</span>
                        {c.unread_count > 0 && (
                          <span className="px-2 py-0.2 rounded-full bg-emerald-400 text-black text-[10px] font-bold">
                            {c.unread_count}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#8FA59B] truncate">{c.last_message}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Chat Area */}
        <div className="md:col-span-2 flex flex-col h-full overflow-hidden bg-[#0E1E18]">
          {activeUser ? (
            <>
              {/* Active Header */}
              <div className="p-3.5 border-b border-[#1B382D] bg-[#08120E] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-400 text-black font-bold flex items-center justify-center text-xs">
                    {activeUser.user_name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-[#F3F7F5] flex items-center gap-1.5">
                      <span>{activeUser.user_name}</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    </h3>
                    <p className="text-[10px] text-emerald-400 font-medium">{activeUser.user_role || 'AgroVision Advisory Specialist'}</p>
                  </div>
                </div>
              </div>

              {/* Messages Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="p-12 text-center text-xs text-[#8FA59B]">
                    No messages in this conversation yet. Send an agronomy inquiry below.
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
                          className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                            isMe
                              ? 'bg-emerald-400 text-black font-semibold rounded-br-none shadow-sm'
                              : 'bg-[#08120E] border border-[#1B382D] text-[#F3F7F5] rounded-bl-none'
                          }`}
                        >
                          <p>{m.content}</p>
                        </div>
                        <span className="text-[9px] text-[#8FA59B] mt-1 px-1">
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-[#1B382D] bg-[#08120E] flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Type an advisory message to ${activeUser.user_name}...`}
                  className="os-input flex-1 py-2.5 text-xs"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="os-btn-primary p-2.5 text-xs flex items-center justify-center shrink-0 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-[#8FA59B] text-xs">
              Select an advisory conversation on the left to start messaging.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
