import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * AgroVisionBackground — 2026 Ambient Agriculture + AI Tech Backdrop
 * 
 * Features:
 * - Agriculture-themed particle system (drifting micro-leaves, golden seeds, glowing telemetry, dew droplets)
 * - Faint cyber-agri circuit matrix & animated data-flow pulses (Farm → Sensors → AI → Recommendation)
 * - Layered ambient emerald/teal/navy lighting
 * - Hardware-accelerated and fully respects `prefers-reduced-motion`
 */
export default function AgroVisionBackground() {
  const shouldReduceMotion = useReducedMotion();

  // Agricultural particles: Micro-leaves, golden seeds, telemetry dots, water droplets
  const agriParticles = [
    { id: 1, type: 'leaf', x: '10%', y: '20%', size: 14, duration: 22, delay: 0, opacity: 0.22 },
    { id: 2, type: 'leaf', x: '88%', y: '30%', size: 12, duration: 26, delay: 3, opacity: 0.18 },
    { id: 3, type: 'leaf', x: '45%', y: '80%', size: 16, duration: 24, delay: 6, opacity: 0.2 },
    { id: 4, type: 'seed', x: '22%', y: '45%', size: 3, duration: 18, delay: 1, color: 'bg-amber-300/60' },
    { id: 5, type: 'seed', x: '75%', y: '18%', size: 2.5, duration: 20, delay: 4, color: 'bg-emerald-300/60' },
    { id: 6, type: 'droplet', x: '68%', y: '72%', size: 4, duration: 16, delay: 2, color: 'bg-cyan-400/50' },
    { id: 7, type: 'droplet', x: '15%', y: '75%', size: 3.5, duration: 19, delay: 5, color: 'bg-teal-300/50' },
    { id: 8, type: 'data', x: '52%', y: '25%', size: 3, duration: 17, delay: 2.5, color: 'bg-emerald-400/70' },
    { id: 9, type: 'data', x: '82%', y: '85%', size: 2.5, duration: 23, delay: 4.5, color: 'bg-sky-400/60' },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* 1. Layered Ambient Lighting Orbs */}
      <div className="absolute -top-[20%] -left-[10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-br from-emerald-600/10 via-teal-700/5 to-transparent blur-[140px]" />
      <div className="absolute top-[35%] -right-[15%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-bl from-sky-600/8 via-emerald-800/6 to-transparent blur-[150px]" />
      <div className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[50vw] rounded-full bg-gradient-to-tr from-[#0B2B1D]/40 via-teal-950/20 to-transparent blur-[130px]" />

      {/* 2. Micro Faint Cyber-Agri Matrix Grid */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, #10b981 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* 3. AI Data-Flow Vectors (Farm → Sensors → AI → Action) */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.06]"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
      >
        <defs>
          <linearGradient id="agriLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#14B8A6" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Primary Data Pathway */}
        <path
          d="M-50 180 H280 L380 280 V650 L480 750 H1600"
          stroke="url(#agriLineGrad)"
          strokeWidth="1.2"
          strokeDasharray="6 8"
        />

        {/* Cross Telemetry Line */}
        <path
          d="M1200 -50 V220 L1100 320 H720 L620 420 V1100"
          stroke="url(#agriLineGrad)"
          strokeWidth="1.2"
          strokeDasharray="4 6"
        />

        {/* Sensor Node Rings */}
        <circle cx="380" cy="280" r="3.5" fill="#10B981" />
        <circle cx="480" cy="750" r="3.5" fill="#14B8A6" />
        <circle cx="1100" cy="320" r="3.5" fill="#38BDF8" />
        <circle cx="620" cy="420" r="3.5" fill="#10B981" />
      </svg>

      {/* 4. Agriculture Particle System */}
      {!shouldReduceMotion &&
        agriParticles.map((p) => {
          if (p.type === 'leaf') {
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 0, rotate: 0 }}
                animate={{
                  y: [-18, 18, -18],
                  x: [-12, 12, -12],
                  rotate: [-14, 14, -14],
                  opacity: [p.opacity * 0.7, p.opacity, p.opacity * 0.7],
                }}
                transition={{
                  duration: p.duration,
                  repeat: Infinity,
                  delay: p.delay,
                  ease: 'easeInOut',
                }}
                style={{
                  left: p.x,
                  top: p.y,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                }}
                className="absolute text-emerald-400 pointer-events-none"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                  <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
                </svg>
              </motion.div>
            );
          }

          if (p.type === 'droplet') {
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0.2, y: 0 }}
                animate={{
                  y: [-14, 14, -14],
                  opacity: [0.2, 0.6, 0.2],
                  scale: [0.9, 1.1, 0.9],
                }}
                transition={{
                  duration: p.duration,
                  repeat: Infinity,
                  delay: p.delay,
                  ease: 'easeInOut',
                }}
                style={{
                  left: p.x,
                  top: p.y,
                  width: `${p.size}px`,
                  height: `${p.size * 1.3}px`,
                }}
                className={`absolute rounded-full ${p.color} blur-[0.3px] shadow-[0_0_8px_rgba(56,189,248,0.5)]`}
              />
            );
          }

          // Seeds / Data points
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0.2, y: 0 }}
              animate={{
                y: [-12, 12, -12],
                x: [-8, 8, -8],
                opacity: [0.2, 0.7, 0.2],
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                delay: p.delay,
                ease: 'easeInOut',
              }}
              style={{
                left: p.x,
                top: p.y,
                width: `${p.size}px`,
                height: `${p.size}px`,
              }}
              className={`absolute rounded-full ${p.color} blur-[0.4px] shadow-[0_0_6px_currentColor]`}
            />
          );
        })}
    </div>
  );
}

