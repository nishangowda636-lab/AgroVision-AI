import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import AgroVisionLogo from './AgroVisionLogo';
import {
  LayoutDashboard,
  Sprout,
  Cpu,
  CloudSun,
  Heart,
  Sparkles,
  BarChart3,
  Droplets,
  FlaskConical,
  Bot,
  DollarSign,
  TrendingUp,
  User,
  LogOut,
  MapPin,
  Calendar,
  Layers,
  ChevronRight,
  ShoppingBag,
  Landmark
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { user, logout, t } = useAuth();
  const location = useLocation();

  const navGroups = [
    {
      group: 'OVERVIEW',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Farm Setup', path: '/farm-setup', icon: Sprout },
      ]
    },
    {
      group: 'MONITOR',
      items: [
        { name: 'IoT Sensors', path: '/sensors', icon: Cpu },
        { name: 'Weather', path: '/weather', icon: CloudSun },
        { name: 'Crop Health', path: '/crop-health', icon: Heart },
      ]
    },
    {
      group: 'INTELLIGENCE',
      items: [
        { name: 'Crop Recommendation', path: '/crop-recommendation', icon: Sparkles },
        { name: 'Yield Prediction', path: '/yield-prediction', icon: BarChart3 },
        { name: 'Smart Irrigation', path: '/irrigation', icon: Droplets },
        { name: 'Fertilizer Advisor', path: '/fertilizer', icon: FlaskConical },
      ]
    },
    {
      group: 'AI & MANAGEMENT',
      items: [
        { name: 'AI Farm Agent', path: '/assistant', icon: Bot, badge: 'AI' },
        { name: 'Government Schemes', path: '/government-schemes', icon: Landmark },
        { name: 'Marketplace', path: '/marketplace', icon: ShoppingBag },
        { name: 'Farm Ledger', path: '/ledger', icon: DollarSign },
        { name: 'Analytics', path: '/analytics', icon: TrendingUp },
      ]
    },
    {
      group: 'ACCOUNT',
      items: [
        { name: 'Profile & Settings', path: '/profile', icon: User },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Slim Modern Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 bg-[#08120E] border-r border-[#1B382D] z-50 flex flex-col h-screen transition-transform duration-250 ease-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Dedicated Fixed Logo Header */}
        <div className="sidebar-logo h-[118px] min-h-[110px] max-h-[125px] px-4 py-2 border-b border-[#1B382D] flex items-center justify-center shrink-0 bg-[#08120E] overflow-hidden select-none">
          <NavLink
            to="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-center focus:outline-none w-full h-full my-auto"
          >
            <AgroVisionLogo
              variant="sidebar"
              className="mx-auto block"
              imgClassName="max-h-[96px] w-auto max-w-[155px] object-contain block mx-auto"
            />
          </NavLink>
        </div>

        {/* Scrollable Navigation Groupings (Starts with clean spacing below the logo) */}
        <div className="flex-1 overflow-y-auto pt-4 pb-3 px-2.5 space-y-4 custom-scrollbar">
          {navGroups.map((grp) => (
            <div key={grp.group} className="space-y-0.5">
              <div className="px-3 pb-1.5 text-[10px] font-bold tracking-wider text-[#577366] font-mono uppercase">
                {grp.group}
              </div>

              {grp.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || 
                  (item.path === '/assistant' && (location.pathname === '/ai-farm-agent' || location.pathname === '/copilot')) ||
                  (item.path === '/irrigation' && location.pathname === '/smart-irrigation') ||
                  (item.path === '/crop-health' && location.pathname === '/disease-detection') ||
                  (item.path === '/sensors' && location.pathname === '/iot') ||
                  (item.path === '/government-schemes' && location.pathname === '/government-services') ||
                  (item.path === '/ledger' && location.pathname === '/profit');

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`relative flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-[#10B981]/12 text-[#F3F7F5] font-semibold'
                        : 'text-[#8FA59B] hover:text-[#F3F7F5] hover:bg-[#0E1E18]'
                    }`}
                  >
                    {/* Active Accent Left Indicator Line */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4.5 rounded-r bg-[#10B981]" />
                    )}

                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 transition-transform ${
                        isActive ? 'text-[#10B981]' : 'text-[#8FA59B]'
                      }`} />
                      <span className="truncate">{item.name}</span>
                    </div>

                    {item.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom Farmer Profile & Logout */}
        {user && (
          <div className="p-3 border-t border-[#1B382D] bg-[#06100C]">
            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#0E1E18] border border-[#1B382D]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#10B981]/15 text-[#10B981] flex items-center justify-center font-bold text-xs shrink-0 border border-[#10B981]/25">
                  {user.full_name ? user.full_name[0].toUpperCase() : 'F'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#F3F7F5] truncate">{user.full_name || 'Farmer'}</p>
                  <div className="flex items-center gap-1 text-[10px] text-[#8FA59B]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] inline-block" />
                    <span>Online</span>
                  </div>
                </div>
              </div>
              <button
                onClick={logout}
                title="Logout"
                className="p-1.5 rounded-lg text-[#8FA59B] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
