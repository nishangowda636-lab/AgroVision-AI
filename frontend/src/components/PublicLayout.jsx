import React from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PublicNavbar from './PublicNavbar';
import PublicFooter from './PublicFooter';
import ScrollToTop from './ScrollToTop';

export default function PublicLayout({ children }) {
  const location = useLocation();

  return (
    <div className="relative min-h-screen bg-[#08120E] text-[#F3F7F5] flex flex-col justify-between selection:bg-emerald-500 selection:text-black overflow-x-hidden">
      <ScrollToTop />
      
      {/* Subtle Atmospheric Backdrop */}
      <div className="fixed inset-0 bg-[radial-gradient(#10b981_0.75px,transparent_0.75px)] [background-size:36px_36px] opacity-[0.05] pointer-events-none z-0" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/5 blur-[140px] pointer-events-none rounded-full z-0" />

      {/* Global Header */}
      <PublicNavbar />

      {/* Main Page Container */}
      <main className="relative z-10 flex-1 flex flex-col pt-[70px] sm:pt-[74px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
            className="flex-1 flex flex-col"
          >
            {children || <Outlet />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Unified Public Footer */}
      <PublicFooter />
    </div>
  );
}
