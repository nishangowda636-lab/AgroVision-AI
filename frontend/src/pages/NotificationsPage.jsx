import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bell,
  Check,
  CloudSun,
  Sprout,
  DollarSign,
  Cpu,
  Bug,
  ArrowRight,
  CheckCheck,
  RefreshCw,
  Clock,
  Trash2,
  Filter,
  Droplets,
  Info,
  Sparkles,
  Globe
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function NotificationsPage() {
  const { language, changeLanguage } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const isKn = language === 'Kannada';
  const isHi = language === 'Hindi';

  const t = {
    badgeLive: isKn ? 'ಲೈವ್ ಕೃಷಿ ಟೆಲಿಮೆಟ್ರಿ' : isHi ? 'लाइव फार्म टेलीमेट्री' : 'Live Farm Telemetry',
    unread: (count) => (isKn ? `${count} ಓದದಿರುವುದು` : isHi ? `${count} अपठित` : `${count} Unread`),
    allCaughtUp: isKn ? 'ಎಲ್ಲವೂ ನವೀಕರಿಸಲಾಗಿದೆ' : isHi ? 'सब कुछ अद्यतित है' : 'All Caught Up',
    title: isKn ? 'ಕೃಷಿ ಎಚ್ಚರಿಕೆಗಳು ಮತ್ತು ಅಧಿಸೂಚನೆಗಳು' : isHi ? 'खेत अलर्ट और सूचनाएं' : 'Farm Alerts & Notifications',
    subtitle: isKn
      ? 'ರಿಯಲ್-ಟೈಮ್ ಹವಾಮಾನ ರೇಡಾರ್ ಎಚ್ಚರಿಕೆಗಳು, ರೋಗ ತಪಾಸಣೆ, ಹಂತ-ಆಧಾರಿತ ರಸಗೊಬ್ಬರ ಸಲಹೆಗಳು ಮತ್ತು ಮಂಡಿ ದರಗಳು.'
      : isHi
      ? 'रियल-टाइम मौसम रडार चेतावनी, फसल रोग निरीक्षण, अवस्था-आधारित उर्वरक अलर्ट और मंडी भाव।'
      : 'Real-time weather radar warnings, crop pathology scouting, stage-specific fertilizer alerts, and Mandi price trends.',
    syncBtn: isKn ? 'ಅಧಿಸೂಚನೆ ನವೀಕರಿಸಿ' : isHi ? 'अलर्ट सिंक करें' : 'Sync Alerts',
    scanning: isKn ? 'ಸ್ಕ್ಯಾನ್ ಆಗುತ್ತಿದೆ...' : isHi ? 'स्कैन हो रहा है...' : 'Scanning...',
    markAllRead: isKn ? 'ಎಲ್ಲವನ್ನೂ ಓದಲಾಗಿದೆ' : isHi ? 'सभी पढ़ा हुआ' : 'Mark All Read',
    clearAll: isKn ? 'ಎಲ್ಲ ತೆರವುಗೊಳಿಸಿ' : isHi ? 'सभी हटाएं' : 'Clear All',
    confirmClear: isKn
      ? 'ನೀವು ಎಲ್ಲಾ ಅಧಿಸೂಚನೆಗಳನ್ನು ಅಳಿಸಲು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ?'
      : isHi
      ? 'क्या आप वाकई सभी सूचनाओं को हटाना चाहते हैं?'
      : 'Are you sure you want to clear all notifications?',
    view: isKn ? 'ವೀಕ್ಷಿಸಿ' : isHi ? 'देखें' : 'View',
    read: isKn ? 'ಓದಲಾಗಿದೆ' : isHi ? 'पढ़ा' : 'Read',
    loading: isKn ? 'ಸ್ಮಾರ್ಟ್ ಟೆಲಿಮೆಟ್ರಿ ಎಚ್ಚರಿಕೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...' : isHi ? 'स्मार्ट टेलीमेट्री अलर्ट लोड हो रहे हैं...' : 'Loading smart telemetry alerts...',
    emptyTitle: isKn ? 'ಈ ವಿಭಾಗದಲ್ಲಿ ಯಾವುದೇ ಅಧಿಸೂಚನೆಗಳಿಲ್ಲ.' : isHi ? 'इस श्रेणी में कोई सूचना नहीं है।' : 'No notifications in this category.',
    emptySubtitle: isKn
      ? 'ಎಲ್ಲಾ ಕೃಷಿ ವ್ಯವಸ್ಥೆಗಳು ಮತ್ತು ಬೆಳೆ ಟೆಲಿಮೆಟ್ರಿ ಸುರಕ್ಷಿತ ಮಿತಿಯಲ್ಲಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿವೆ.'
      : isHi
      ? 'सभी कृषि प्रणालियां और फसल टेलीमेट्री सामान्य स्थिति में काम कर रही हैं।'
      : 'All farm systems and crop telemetry are operating within nominal parameters.',
    checkFresh: isKn ? 'ಹೊಸ ಕೃಷಿ ಘಟನೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ' : isHi ? 'ताजा फार्म इवेंट जांचें' : 'Check for Fresh Farm Events',
    tabAll: isKn ? 'ಎಲ್ಲಾ ಎಚ್ಚರಿಕೆಗಳು' : isHi ? 'सभी अलर्ट' : 'All Alerts',
    tabWeather: isKn ? '🌤️ ಹವಾಮಾನ' : isHi ? '🌤️ मौसम' : '🌤️ Weather',
    tabNutrients: isKn ? '🌱 ಪೋಷಕಾಂಶ ಮತ್ತು ಬೆಳೆಗಳು' : isHi ? '🌱 पोषक तत्व व फसलें' : '🌱 Nutrients & Crops',
    tabSensors: isKn ? '💧 ಸಂವೇದಕಗಳು ಮತ್ತು ಡ್ರಿಪ್' : isHi ? '💧 सेंसर व ड्रिप' : '💧 Sensors & Drip',
    tabHealth: isKn ? '🔬 ಬೆಳೆ ಆರೋಗ್ಯ' : isHi ? '🔬 फसल स्वास्थ्य' : '🔬 Crop Health',
    tabMarket: isKn ? '📈 ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು' : isHi ? '📈 मंडी भाव' : '📈 Market Prices'
  };

  const fetchNotifs = () => {
    setLoading(true);
    api.get('/notifications', { params: { language } })
      .then((res) => setNotifications(res.data || []))
      .catch((err) => console.error('Failed to fetch notifications:', err))
      .finally(() => setLoading(false));
  };

  const syncAlerts = async () => {
    setSyncing(true);
    try {
      const res = await api.post('/notifications/sync', null, { params: { language } });
      if (res.data?.notifications) {
        setNotifications(res.data.notifications);
      } else {
        fetchNotifs();
      }
    } catch (err) {
      console.error('Failed to sync alerts:', err);
      fetchNotifs();
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, [language]);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotif = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const clearAllNotifs = async () => {
    if (!window.confirm(t.confirmClear)) return;
    try {
      await api.delete('/notifications/clear-all');
      setNotifications([]);
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type) => {
    if (type === 'weather') return <CloudSun className="w-5 h-5 text-amber-400" />;
    if (type === 'disease') return <Bug className="w-5 h-5 text-rose-400" />;
    if (type === 'market') return <DollarSign className="w-5 h-5 text-emerald-400" />;
    if (type === 'fertilizer') return <Sprout className="w-5 h-5 text-emerald-400" />;
    if (type === 'sensor') return <Droplets className="w-5 h-5 text-teal-300" />;
    if (type === 'info') return <Info className="w-5 h-5 text-blue-400" />;
    return <Cpu className="w-5 h-5 text-teal-300" />;
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filteredNotifs = notifications.filter((n) => {
    if (filterType === 'all') return true;
    if (filterType === 'unread') return !n.is_read;
    return n.type === filterType;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto selection:bg-emerald-500 selection:text-black">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1B382D] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="os-status-pill os-status-emerald">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {t.badgeLive}
            </span>
            {unreadCount > 0 ? (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981] font-bold">
                {t.unread(unreadCount)}
              </span>
            ) : (
              <span className="text-[11px] text-[#8FA59B]">{t.allCaughtUp}</span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-[#F3F7F5] flex items-center gap-2.5">
            <Bell className="w-7 h-7 text-emerald-400" />
            <span>{t.title}</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8FA59B] mt-1">
            {t.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={syncAlerts}
            disabled={syncing || loading}
            className="os-btn-secondary px-3 py-2 text-xs flex items-center gap-1.5 cursor-pointer"
            title="Scan & Sync Farm Telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? t.scanning : t.syncBtn}</span>
          </button>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="os-btn-primary flex items-center gap-1.5 text-xs px-3 py-2 cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>{t.markAllRead}</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifs}
              className="os-btn-secondary flex items-center gap-1.5 text-xs px-3 py-2 text-[#8FA59B] hover:text-[#EF4444] cursor-pointer"
              title="Clear All Notifications"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.clearAll}</span>
            </button>
          )}
        </div>
      </div>

      {/* Select Language Controls: English, Kannada, Hindi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#08120E] border border-[#1B382D] rounded-xl p-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold text-[#F3F7F5]">
            {isKn ? 'ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ (Select Language):' : isHi ? 'भाषा चुनें (Select Language):' : 'Select Language:'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { code: 'English', label: 'English' },
            { code: 'Kannada', label: 'ಕನ್ನಡ (Kannada)' },
            { code: 'Hindi', label: 'हिन्दी (Hindi)' },
          ].map((l) => {
            const isSelected = language === l.code;
            return (
              <button
                key={l.code}
                onClick={() => changeLanguage(l.code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-400 text-black shadow-sm font-extrabold'
                    : 'bg-[#0E1E18] text-[#8FA59B] border border-[#1B382D] hover:border-emerald-500/40 hover:text-white'
                }`}
              >
                <span>{l.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { label: t.tabAll, val: 'all' },
          ...(unreadCount > 0 ? [{ label: `🔔 ${t.unread(unreadCount)}`, val: 'unread' }] : []),
          { label: t.tabWeather, val: 'weather' },
          { label: t.tabNutrients, val: 'fertilizer' },
          { label: t.tabSensors, val: 'sensor' },
          { label: t.tabHealth, val: 'disease' },
          { label: t.tabMarket, val: 'market' }
        ].map((f) => (
          <button
            key={f.val}
            onClick={() => setFilterType(f.val)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              filterType === f.val
                ? 'bg-emerald-400 text-black shadow-sm'
                : 'bg-[#0E1E18] text-[#8FA59B] border border-[#1B382D] hover:border-emerald-500/40 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="os-card p-12 text-center space-y-2">
          <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#8FA59B]">{t.loading}</p>
        </div>
      ) : filteredNotifs.length === 0 ? (
        <div className="os-card p-16 text-center space-y-3">
          <Bell className="w-8 h-8 text-[#8FA59B] mx-auto opacity-50" />
          <p className="font-bold text-xs text-[#F3F7F5]">{t.emptyTitle}</p>
          <p className="text-[11px] text-[#8FA59B]">{t.emptySubtitle}</p>
          <button
            onClick={syncAlerts}
            className="os-btn-secondary text-xs px-3.5 py-1.5 mx-auto flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
            <span>{t.checkFresh}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifs.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`os-card p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                n.is_read
                  ? 'opacity-75 hover:opacity-100'
                  : 'border-emerald-400/60 bg-[#122820] shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#08120E] border border-[#1B382D] flex items-center justify-center shrink-0 mt-0.5">
                  {getIcon(n.type)}
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs text-[#F3F7F5] truncate">{n.title}</h4>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-[#8FA59B] leading-relaxed break-words">{n.message}</p>
                  <div className="flex items-center gap-2 pt-1 text-[10px] text-[#8FA59B]">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(n.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {n.action_link && (
                  <Link
                    to={n.action_link}
                    onClick={() => !n.is_read && markAsRead(n.id)}
                    className="os-btn-primary py-1 px-2.5 text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <span>{t.view}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}

                {!n.is_read && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    className="os-btn-secondary py-1 px-2 text-[11px] flex items-center gap-1 cursor-pointer"
                    title="Mark as Read"
                  >
                    <Check className="w-3 h-3" />
                    <span className="hidden sm:inline">{t.read}</span>
                  </button>
                )}

                <button
                  onClick={() => deleteNotif(n.id)}
                  className="p-1.5 rounded-lg text-[#8FA59B] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors cursor-pointer"
                  title="Dismiss Alert"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
