import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { buttonMotion } from '../utils/motion';

/**
 * EmptyState — Helpful, professional empty state card with actionable guidance
 */
export default function EmptyState({
  icon: Icon = Sparkles,
  title = 'No Data Available',
  description = 'There is currently no telemetry or records for this farm section.',
  actionLabel,
  onAction,
  actionLink,
  className = ''
}) {
  return (
    <div className={`glass-panel p-8 sm:p-12 rounded-3xl border border-emerald-500/20 text-center flex flex-col items-center justify-center max-w-md mx-auto ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-4 shadow-glow-emerald">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-slate-100 mb-2 font-heading">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6 max-w-sm">
        {description}
      </p>

      {actionLabel && (
        actionLink ? (
          <a
            href={actionLink}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-glow-emerald hover:brightness-110 transition-all cursor-pointer"
          >
            <span>{actionLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        ) : (
          <motion.button
            {...buttonMotion}
            onClick={onAction}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-glow-emerald hover:brightness-110 transition-all cursor-pointer"
          >
            <span>{actionLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        )
      )}
    </div>
  );
}
