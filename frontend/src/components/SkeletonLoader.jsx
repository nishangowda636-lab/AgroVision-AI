import React from 'react';

/**
 * SkeletonCard — Standardized shimmer placeholder for KPI and dashboard cards
 */
export function SkeletonCard({ className = '', height = 'h-32' }) {
  return (
    <div className={`glass-panel p-5 rounded-2xl border border-emerald-500/20 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="w-24 h-4 skeleton-shimmer rounded" />
        <div className="w-8 h-8 skeleton-shimmer rounded-xl" />
      </div>
      <div className={`w-3/4 ${height} skeleton-shimmer rounded-xl mb-3`} />
      <div className="w-1/2 h-3 skeleton-shimmer rounded" />
    </div>
  );
}

/**
 * SkeletonChart — Shimmer placeholder for Recharts and analytical views
 */
export function SkeletonChart({ className = '', height = 'h-64' }) {
  return (
    <div className={`glass-panel p-6 rounded-3xl border border-emerald-500/20 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="w-36 h-5 skeleton-shimmer rounded mb-2" />
          <div className="w-48 h-3 skeleton-shimmer rounded" />
        </div>
        <div className="w-28 h-8 skeleton-shimmer rounded-xl" />
      </div>
      <div className={`w-full ${height} skeleton-shimmer rounded-2xl`} />
    </div>
  );
}

/**
 * SkeletonTable — Shimmer placeholder for ledger and disease scan histories
 */
export function SkeletonTable({ rows = 4, className = '' }) {
  return (
    <div className={`glass-panel p-6 rounded-3xl border border-emerald-500/20 space-y-3 ${className}`}>
      <div className="w-40 h-5 skeleton-shimmer rounded mb-4" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3 border-b border-emerald-500/10">
          <div className="w-10 h-10 skeleton-shimmer rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="w-1/3 h-4 skeleton-shimmer rounded" />
            <div className="w-1/4 h-3 skeleton-shimmer rounded" />
          </div>
          <div className="w-20 h-6 skeleton-shimmer rounded-lg" />
        </div>
      ))}
    </div>
  );
}
