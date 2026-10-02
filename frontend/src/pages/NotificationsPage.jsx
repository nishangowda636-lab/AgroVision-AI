import React, { useState, useEffect } from 'react';
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
  Layers
} from 'lucide-react';
import api from '../services/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchNotifs = () => {
    setLoading(true);
    api.get('/notifications')
      .then((res) => setNotifications(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifs();
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => api.put(`/notifications/${n.id}/read`)));
      fetchNotifs();
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type) => {
    if (type === 'weather') return <CloudSun className="w-5 h-5 text-amber-400" />;
    if (type === 'disease') return <Bug className="w-5 h-5 text-rose-400" />;
    if (type === 'market') return <DollarSign className="w-5 h-5 text-emerald-400" />;
    if (type === 'fertilizer') return <Sprout className="w-5 h-5 text-emerald-400" />;
    return <Cpu className="w-5 h-5 text-teal-300" />;
  };

  const filteredNotifs = notifications.filter(n => {
    if (filterType === 'all') return true;
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
              Event Stream
            </span>
            <span className="text-[11px] text-[#8FA59B]">Real-time Telemetry Triggers</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-[#F3F7F5] flex items-center gap-2.5">
            <Bell className="w-7 h-7 text-emerald-400" />
            <span>Farm Alerts & Notifications</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8FA59B] mt-1">
            Critical weather warnings, disease pathology alerts, IoT sensor triggers, and Mandi price shifts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchNotifs}
            className="os-btn-secondary p-2.5"
            title="Refresh Alerts"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {notifications.some(n => !n.is_read) && (
            <button
              onClick={markAllAsRead}
              className="os-btn-primary flex items-center gap-1.5 text-xs"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark All Read</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { label: 'All Alerts', val: 'all' },
          { label: '🌤️ Weather', val: 'weather' },
          { label: '🔬 Crop Health', val: 'disease' },
          { label: '📈 Market Prices', val: 'market' },
          { label: '🌱 Nutrients & Crops', val: 'fertilizer' }
        ].map(f => (
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
          <p className="text-xs text-[#8FA59B]">Loading smart telemetry alerts...</p>
        </div>
      ) : filteredNotifs.length === 0 ? (
        <div className="os-card p-16 text-center space-y-2">
          <Bell className="w-8 h-8 text-[#8FA59B] mx-auto opacity-50" />
          <p className="font-bold text-xs text-[#F3F7F5]">No notifications in this category.</p>
          <p className="text-[11px] text-[#8FA59B]">All systems are running within nominal parameters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifs.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`os-card p-4 transition-all flex items-start justify-between gap-4 ${
                n.is_read
                  ? 'opacity-70 hover:opacity-100'
                  : 'border-emerald-400/60 bg-[#122820] shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#08120E] border border-[#1B382D] flex items-center justify-center shrink-0 mt-0.5">
                  {getIcon(n.type)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs text-[#F3F7F5]">{n.title}</h4>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-[#8FA59B] leading-relaxed">{n.message}</p>
                  <div className="flex items-center gap-2 pt-1 text-[10px] text-[#8FA59B]">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(n.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                </div>
              </div>

              {!n.is_read && (
                <button
                  onClick={() => markAsRead(n.id)}
                  className="os-btn-secondary py-1 px-2.5 text-[11px] shrink-0 flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  <span>Mark Read</span>
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
