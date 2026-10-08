import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Globe, ArrowRight, Menu, X, User, LayoutDashboard, Sparkles } from 'lucide-react';
import AgroVisionLogo from './AgroVisionLogo';
import { useAuth, LANGUAGES } from '../context/AuthContext';

export default function PublicNavbar() {
  const { user, language, changeLanguage } = useAuth();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Features', path: '/features' },
    { name: 'AI Farming', path: '/ai-farming' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-[70px] sm:h-[74px] transition-all duration-200 flex items-center border-b ${
        scrolled
          ? 'bg-[#08120E]/95 backdrop-blur-xl border-[#1B382D] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)]'
          : 'bg-[#08120E]/85 backdrop-blur-md border-[#1B382D]/80'
      }`}
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* LEFT: Official Brand Logo */}
        <div className="flex items-center shrink-0">
          <Link
            to="/"
            className="inline-flex items-center focus:outline-none rounded-lg py-1"
            aria-label="AgroVision AI Home"
          >
            <AgroVisionLogo
              variant="sidebar"
              className="block"
              imgClassName="max-h-[48px] sm:max-h-[52px] w-auto max-w-[140px] object-contain"
            />
          </Link>
        </div>

        {/* CENTER: Navigation Links (Desktop) */}
        <nav
          className="hidden lg:flex items-center justify-center gap-1"
          aria-label="Primary Navigation"
        >
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 select-none ${
                  isActive
                    ? 'bg-[#10B981]/15 text-[#F3F7F5] border border-[#10B981]/30 font-bold'
                    : 'text-[#8FA59B] hover:text-[#F3F7F5] hover:bg-[#0E1E18] border border-transparent'
                }`}
              >
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                )}
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* RIGHT: Language Selector + Auth Actions */}
        <div className="hidden lg:flex items-center gap-2.5 shrink-0">
          {/* Language Selector */}
          <div className="relative flex items-center gap-1.5 bg-[#0E1E18] border border-[#1B382D] hover:border-[#265040] rounded-lg px-2.5 py-1.5 text-xs transition-colors">
            <Globe className="w-3.5 h-3.5 text-[#10B981] shrink-0 pointer-events-none" />
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              aria-label="Select Language"
              className="bg-transparent text-xs font-semibold text-[#F3F7F5] focus:outline-none cursor-pointer pr-1"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-[#08120E] text-[#F3F7F5]">
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Authenticated vs Unauthenticated Actions */}
          {user ? (
            <Link
              to="/dashboard"
              className="os-btn-primary px-4 py-1.5 text-xs flex items-center gap-1.5"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="os-btn-secondary px-3.5 py-1.5 text-xs font-bold"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="os-btn-primary px-3.5 py-1.5 text-xs flex items-center gap-1"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-[#0E1E18] border border-[#1B382D] text-[#10B981] hover:text-[#F3F7F5] transition-colors focus:outline-none cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="lg:hidden fixed top-[70px] sm:top-[74px] left-0 right-0 bg-[#08120E]/98 border-b border-[#1B382D] px-5 py-4 space-y-3.5 backdrop-blur-2xl shadow-2xl z-40 max-h-[calc(100vh-74px)] overflow-y-auto"
          >
            {/* Nav Links */}
            <div className="flex flex-col space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center justify-between transition-colors ${
                      isActive
                        ? 'bg-[#10B981]/15 text-[#F3F7F5] border border-[#10B981]/30 font-bold'
                        : 'text-[#8FA59B] hover:text-[#F3F7F5] hover:bg-[#0E1E18] border border-transparent'
                    }`}
                  >
                    <span>{item.name}</span>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />}
                  </NavLink>
                );
              })}
            </div>

            {/* Mobile Actions: Language + Auth */}
            <div className="pt-3 border-t border-[#1B382D] flex flex-col gap-2.5">
              <div className="flex items-center gap-2 bg-[#0E1E18] border border-[#1B382D] rounded-lg px-3 py-2 text-xs">
                <Globe className="w-4 h-4 text-[#10B981] shrink-0" />
                <select
                  value={language}
                  onChange={(e) => changeLanguage(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-[#F3F7F5] w-full focus:outline-none cursor-pointer"
                  aria-label="Select Language"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code} className="bg-[#08120E] text-[#F3F7F5]">
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>

              {user ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="os-btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-1.5"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Open Farm Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="os-btn-secondary text-center py-2.5 text-xs"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="os-btn-primary text-center py-2.5 text-xs flex items-center justify-center gap-1"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
