import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { pageVariants } from '../utils/motion';

/**
 * PageTransition — Standardized page wrapper for smooth, fast, accessible page transitions.
 */
export default function PageTransition({ children, className = '' }) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={`w-full ${className}`}>{children}</div>;
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`w-full ${className}`}
    >
      {children}
    </motion.div>
  );
}
