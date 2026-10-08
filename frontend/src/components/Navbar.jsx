import React, { useState, useEffect, useRef } from 'react';
import { useAuth, LANGUAGES } from '../context/AuthContext';
import { useFarm } from '../context/FarmContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  Bell,
  Bot,
  User as UserIcon,
  LogOut,
  ChevronDown,
  MapPin,
  Check,
  Sparkles
} from 'lucide-react';
import AgroVisionLogo from './AgroVisionLogo';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import offlineStorage from '../services/offlineStorage';

export default function Navbar({ toggleMobileSidebar }) {
  const { user, logout, language, changeLanguage } = useAuth();
  const { farms, activeFarm, setActiveFarm } = useFarm();
  const location = useLocation();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [notifCount, setNotifCount] = useState(0);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  const userMenuRef = useRef(null);
  const notifMenuRef = useRef(null);
  const langMenuRef = useRef(null);

  const [syncStatus, setSyncStatus] = useState(typeof navigator !== 'undefined' && navigator.onLine ? 'ONLINE' : 'OFFLINE');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Derive dynamic page title and subtitle from current path
  const getPageInfo = () => {
    const p = location.pathname;
    if (p.includes('dashboard')) return { title: 'Dashboard', sub: `${getGreeting()}, ${user?.full_name?.split(' ')[0] || 'Farmer'}` };
    if (p.includes('farm-setup')) return { title: 'Farm Setup', sub: 'Field boundaries, soil profile & geometry' };
    if (p.includes('sensors') || p.includes('iot')) return { title: 'IoT Sensors', sub: 'Live field moisture & ambient telemetry' };
    if (p.includes('weather')) return { title: 'Weather Intelligence', sub: 'Microclimate radar & operational impact' };
    if (p.includes('crop-health') || p.includes('disease')) return { title: 'AI Crop Analyzer', sub: 'Computer vision pathology & foliar diagnostics' };
    if (p.includes('crop-recommendation')) return { title: 'Crop Recommendation', sub: 'AI crop viability & seasonal suitability' };
    if (p.includes('yield-prediction')) return { title: 'Yield Prediction', sub: 'Regression harvest forecast & production range' };
    if (p.includes('irrigation')) return { title: 'Smart Irrigation', sub: 'Decision-first water schedule & borewell control' };
    if (p.includes('fertilizer')) return { title: 'Fertilizer Advisor', sub: 'Calibrated N-P-K nutrient formulations' };
    if (p.includes('assistant') || p.includes('ai-farm-agent') || p.includes('copilot')) return { title: 'AI Farm Agent', sub: 'Agronomic conversational copilot' };
    if (p.includes('marketplace')) return { title: 'AgroVision Marketplace', sub: 'Verified official farming products & manufacturer discovery' };
    if (p.includes('ledger') || p.includes('profit')) return { title: 'Farm Ledger', sub: 'Accounts, expense tracking & profit per acre' };
    if (p.includes('analytics')) return { title: 'Analytics', sub: 'Historical field telemetry & performance curves' };
    if (p.includes('profile')) return { title: 'Profile & Settings', sub: 'Account credentials, units & alert settings' };
    return { title: 'AgroVision AI', sub: 'Digital Farm Operating System' };
  };

  const { title, sub } = getPageInfo();

  useEffect(() => {
    const handleOnline = () => setSyncStatus('ONLINE');
    const handleOffline = () => setSyncStatus('OFFLINE');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleOutsideClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserDropdown(false);
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target)) setShowNotifDropdown(false);
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) setShowLangDropdown(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    if (user) {
      api.get('/notifications').then(res => {
        const notifList = res.data || [];
        setNotifications(notifList.slice(0, 5));
        const unread = notifList.filter(n => !n.is_read)?.length || 0;
        setNotifCount(unread);
      }).catch(() => {});
    }
  }, [user]);

  return (
    <header className="h-16 border-b border-[#1B382D] bg-[#08120E]/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-6 flex items-center justify-between">
      {/* Left: Mobile Toggle + Page Title Context */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobileSidebar}
          className="lg:hidden text-[#10B981] p-2 rounded-lg bg-[#0E1E18] border border-[#1B382D] transition-colors"
          aria-label="Toggle Navigation"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <Link to="/dashboard" className="flex lg:hidden items-center">
          <AgroVisionLogo variant="compact" />
        </Link>

        <div className="hidden lg:block">
          <h1 className="text-sm font-bold text-[#F3F7F5] leading-tight">{title}</h1>
          <p className="text-[11px] text-[#8FA59B] leading-none">{sub}</p>
        </div>
      </div>

      {/* Center / Right: Farm Selector + Telemetry Status + Language + Notifications + AI + Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Active Farm Selector */}
        {user && farms && farms.length > 0 && (
          <div className="relative">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0E1E18] border border-[#1B382D] text-[#F3F7F5] text-xs hover:border-[#265040] transition-colors">
              <MapPin className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
              <select
                value={activeFarm?.id || ''}
                onChange={(e) => {
                  const selected = farms.find((f) => f.id === parseInt(e.target.value));
                  if (selected) setActiveFarm(selected);
                }}
                className="bg-transparent text-[#F3F7F5] font-semibold focus:outline-none cursor-pointer pr-1 text-xs appearance-none"
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id} className="bg-[#08120E] text-[#F3F7F5]">
                    {f.name} • {f.crop || 'Field'} • {f.size_acres || 1} Ac
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-[#8FA59B] pointer-events-none" />
            </div>
          </div>
        )}

        {/* Live Status Chip */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-[#0E1E18] border border-[#1B382D] text-[#8FA59B]">
          <span className="w-2 h-2 rounded-full bg-[#10B981] live-dot" />
          <span className="text-[#F3F7F5]">Online</span>
        </div>

        {/* AI Quick Button */}
        <button
          onClick={() => navigate('/assistant')}
          className="px-2.5 py-1.5 rounded-lg bg-[#10B981]/15 text-[#10B981] hover:bg-[#10B981]/25 border border-[#10B981]/30 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          title="Open AI Farm Agent"
        >
          <Bot className="w-3.5 h-3.5" />
          <span className="hidden md:inline">AI Agent</span>
        </button>

        {/* Language Selector */}
        <div className="relative" ref={langMenuRef}>
          <button
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            className="p-2 rounded-lg text-[#8FA59B] hover:text-[#F3F7F5] hover:bg-[#0E1E18] border border-[#1B382D] transition-colors cursor-pointer flex items-center gap-1"
            title="Language"
          >
            <Globe className="w-3.5 h-3.5 text-[#10B981]" />
            <span className="hidden md:inline text-xs font-medium text-[#F3F7F5]">{language || 'English'}</span>
            <ChevronDown className="w-3 h-3 text-[#8FA59B]" />
          </button>

          <AnimatePresence>
            {showLangDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="absolute right-0 mt-1.5 w-44 rounded-xl bg-[#0E1E18] border border-[#1B382D] p-1.5 shadow-xl z-50 space-y-0.5"
              >
                <div className="px-2 py-1 text-[10px] font-mono text-[#577366] uppercase">Select Language</div>
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code || lang}
                    onClick={() => {
                      changeLanguage(lang.code || lang);
                      setShowLangDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      language === (lang.code || lang)
                        ? 'bg-[#10B981]/20 text-[#10B981] font-bold'
                        : 'text-[#8FA59B] hover:bg-[#13271F] hover:text-[#F3F7F5]'
                    }`}
                  >
                    <span>{lang.label || lang}</span>
                    {language === (lang.code || lang) && <Check className="w-3.5 h-3.5 text-[#10B981]" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifMenuRef}>
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="relative p-2 rounded-lg text-[#8FA59B] hover:text-[#F3F7F5] hover:bg-[#0E1E18] border border-[#1B382D] transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-3.5 h-3.5 text-[#10B981]" />
            {notifCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#EF4444] text-white text-[9px] font-bold flex items-center justify-center">
                {notifCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="absolute right-0 mt-1.5 w-80 rounded-xl bg-[#0E1E18] border border-[#1B382D] p-3 shadow-xl z-50"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#1B382D] mb-2">
                  <span className="text-xs font-bold text-[#F3F7F5]">Farm Notifications</span>
                  <Link
                    to="/notifications"
                    onClick={() => setShowNotifDropdown(false)}
                    className="text-[10px] text-[#10B981] hover:underline"
                  >
                    View All
                  </Link>
                </div>

                {notifications.length > 0 ? (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={async () => {
                          if (!n.is_read) {
                            try {
                              await api.put(`/notifications/${n.id}/read`);
                            } catch (e) {}
                            setNotifications((prev) =>
                              prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item))
                            );
                            setNotifCount((prev) => Math.max(0, prev - 1));
                          }
                          setShowNotifDropdown(false);
                          navigate(n.action_link || '/notifications');
                        }}
                        className={`p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                          n.is_read
                            ? 'bg-[#08120E] text-[#8FA59B] hover:bg-[#0E1E18]'
                            : 'bg-[#13271F] text-[#F3F7F5] border border-[#1B382D] hover:border-[#10B981]/50'
                        }`}
                      >
                        <p className="font-semibold text-[#10B981] text-[11px]">{n.title || 'Farm Alert'}</p>
                        <p className="text-[11px] text-[#8FA59B] line-clamp-2">{n.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-4 text-xs text-[#8FA59B]">No new notifications</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile */}
        {user && (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-1.5 p-1 pl-2 rounded-lg bg-[#0E1E18] border border-[#1B382D] hover:border-[#265040] transition-colors cursor-pointer"
            >
              <div className="w-6 h-6 rounded bg-[#10B981]/20 text-[#10B981] flex items-center justify-center font-bold text-xs">
                {user.full_name ? user.full_name[0].toUpperCase() : 'F'}
              </div>
              <ChevronDown className="w-3 h-3 text-[#8FA59B]" />
            </button>

            <AnimatePresence>
              {showUserDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="absolute right-0 mt-1.5 w-52 rounded-xl bg-[#0E1E18] border border-[#1B382D] p-1.5 shadow-xl z-50 space-y-1"
                >
                  <div className="p-2 border-b border-[#1B382D] mb-1">
                    <p className="text-xs font-bold text-[#F3F7F5] truncate">{user.full_name || 'Farmer'}</p>
                    <p className="text-[10px] text-[#8FA59B] truncate">{user.email}</p>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setShowUserDropdown(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#8FA59B] hover:bg-[#13271F] hover:text-[#F3F7F5] transition-colors"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>Profile & Settings</span>
                  </Link>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </header>
  );
}
