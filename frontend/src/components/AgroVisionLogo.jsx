import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * AgroVisionLogo — Official AgroVision AI Brand Logo Component
 * 
 * Uses the complete, unaltered original logo image containing:
 * - Agricultural field/plant symbol & green leaves
 * - AI circuit & blue technology elements
 * - "AGROVISION AI" typography
 * - "SMART AGRICULTURE FARMING" tagline
 * 
 * Displays everything together as ONE complete image with object-fit: contain
 * and smooth Framer Motion entrance & hover animations.
 */
export default function AgroVisionLogo({
  variant = 'header', // 'header' | 'hero' | 'card' | 'sidebar' | 'compact' | 'footer' | 'emblem'
  width,
  height,
  animated = true,
  glow = true,
  className = '',
  imgClassName = '',
  onClick,
}) {
  const shouldReduceMotion = useReducedMotion();

  // Width presets for each placement across the application
  const getWidthClass = () => {
    if (width) return '';
    switch (variant) {
      case 'hero':
        return 'w-[250px] sm:w-[300px] md:w-[350px] max-w-full';
      case 'header':
        // Refined SaaS Header width: 130px–145px with object-contain
        return 'w-[130px] sm:w-[138px] md:w-[145px] max-w-full';
      case 'compact':
        return 'w-[140px] sm:w-[155px] max-w-full';
      case 'sidebar':
        // Specifically aligned for sidebar width 260px: 145px–160px width with auto height
        return 'w-[150px] sm:w-[155px] max-w-[160px]';
      case 'card':
        // Desktop 150-170px, Tablet 135-155px, Mobile 125-145px
        return 'w-[130px] sm:w-[145px] md:w-[160px] max-w-full';
      case 'footer':
        return 'w-[190px] sm:w-[210px] max-w-full';
      default:
        return 'w-[130px] sm:w-[138px] md:w-[145px] max-w-full';
    }
  };

  const styleProps = {};
  if (width) styleProps.width = typeof width === 'number' ? `${width}px` : width;
  if (height) styleProps.height = typeof height === 'number' ? `${height}px` : height;

  const LogoContent = (
    <div
      onClick={onClick}
      style={styleProps}
      className={`relative inline-flex items-center justify-center select-none group ${getWidthClass()} ${className}`}
    >
      {/* Subtle Ambient Green/Teal Glow behind logo */}
      {glow && (
        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-400/15 to-sky-500/15 pointer-events-none transition-opacity duration-300 group-hover:opacity-75 ${
            variant === 'header' ? 'blur-md opacity-25' : 'blur-lg opacity-40'
          }`}
        />
      )}

      {/* The ONE Complete Official Logo Image */}
      <img
        src="/assets/agrovision-ai-logo-transparent.png"
        onError={(e) => {
          e.currentTarget.src = '/assets/agrovision-ai-logo.png';
        }}
        alt="AgroVision AI — Smart Agriculture Farming"
        className={`relative z-10 w-full h-auto object-contain filter drop-shadow-[0_3px_12px_rgba(0,0,0,0.4)] transition-transform duration-300 ${imgClassName}`}
        loading="eager"
        decoding="async"
      />
    </div>
  );

  // Smooth entrance animation on dashboard / page load: opacity: 0 -> 1, scale: 0.97 -> 1, y: -5 -> 0 in 0.5s
  if (animated && !shouldReduceMotion) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: -5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ scale: 1.02 }}
        className="inline-flex items-center justify-center"
      >
        {LogoContent}
      </motion.div>
    );
  }

  return LogoContent;
}
