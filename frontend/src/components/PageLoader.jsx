import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import AgroVisionLogo from './AgroVisionLogo';

/**
 * PageLoader — Sleek 2026 AgroVision AI Brand Loading Animation
 */
export default function PageLoader({ message = "Initializing Agricultural Intelligence..." }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#04131B] text-white select-none">
      {/* Ambient Pulsing Glow Backdrop */}
      <motion.div
        animate={
          shouldReduceMotion
            ? { opacity: 0.3 }
            : {
                scale: [1, 1.2, 1],
                opacity: [0.25, 0.5, 0.25],
              }
        }
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-72 h-72 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none"
      />

      {/* Official AgroVision AI Logo (Complete, Unaltered) */}
      <div className="relative flex flex-col items-center z-10 space-y-6">
        <AgroVisionLogo variant="card" />

        {/* Loading Progress Bar & Status Message */}
        <div className="w-52 space-y-2.5 pt-2">
          <div className="h-1.5 w-full bg-emerald-950 rounded-full overflow-hidden border border-emerald-500/25">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="h-full w-1/2 bg-gradient-to-r from-emerald-500 via-teal-300 to-sky-400 rounded-full shadow-[0_0_10px_#10B981]"
            />
          </div>
          <p className="text-[10px] text-center font-semibold text-emerald-400/90 tracking-wider uppercase">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
