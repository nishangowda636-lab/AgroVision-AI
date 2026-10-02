/**
 * AgroVision AI — Reusable Framer Motion System
 * ============================================
 * Standardized motion tokens, transition presets, and variants for
 * smooth, realistic, and accessible AgriTech SaaS micro-interactions.
 * Automatically respects user's `prefers-reduced-motion` settings.
 */

// 1. Page Transition Variants (Smooth, fast, 0.28s fade + subtle upward slide)
export const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.28,
      ease: [0.22, 1, 0.36, 1], // easeOutQuint
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: {
      duration: 0.2,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// 2. Staggered Container for Lists & Metric Grids
export const staggerContainer = (staggerDelay = 0.06, delayChildren = 0.05) => ({
  initial: {},
  animate: {
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: delayChildren,
    },
  },
});

// 3. Sequential Fade-Up Item
export const fadeUpItem = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// 4. Subtle Scale-In for Modal, Badges, and Score Rings
export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// 5. Card Hover & Elevation (Subtle translateY(-3px) without excessive bouncing)
export const cardHover = {
  rest: {
    y: 0,
    boxShadow: "0 8px 24px -6px rgba(0, 0, 0, 0.4)",
    borderColor: "rgba(16, 185, 129, 0.2)",
    transition: { duration: 0.25, ease: "easeOut" },
  },
  hover: {
    y: -3,
    boxShadow: "0 16px 32px -8px rgba(16, 185, 129, 0.25)",
    borderColor: "rgba(16, 185, 129, 0.45)",
    transition: { duration: 0.25, ease: "easeOut" },
  },
};

// 6. Interactive Button Motion (1.01-1.02 hover, 0.98 tap)
export const buttonMotion = {
  whileHover: { scale: 1.015, transition: { duration: 0.15 } },
  whileTap: { scale: 0.98, transition: { duration: 0.1 } },
};

// 7. Checkmark Completion Animation for Farm Tasks
export const checkmarkVariants = {
  initial: { pathLength: 0, opacity: 0 },
  animate: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

// 8. Live Telemetry Pulse Dot
export const pulseDotVariants = {
  animate: {
    scale: [1, 1.35, 1],
    opacity: [0.8, 1, 0.8],
    transition: {
      duration: 2.2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};
