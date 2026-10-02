import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, Sprout, Bug, MapPin, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';
import api from '../services/api';

export default function OfficerDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = () => {
    setLoading(true);
    api.get('/admin/stats')
      .then((res) => setStats(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="p-16 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-[#8FA59B]">Loading Agricultural Extension Officer portal...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto selection:bg-emerald-500 selection:text-black">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1B382D] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="os-status-pill os-status-emerald">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Agronomy Field Operations
            </span>
            <span className="text-[11px] text-[#8FA59B]">KVK Extension Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-[#F3F7F5] flex items-center gap-2.5">
            <ShieldAlert className="w-7 h-7 text-emerald-400" />
            <span>Agricultural Extension Officer Portal</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8FA59B] mt-1">
            Regional agricultural cluster metrics, crop pathogen outbreak alerts, and farm advisory monitoring.
          </p>
        </div>

        <button
          onClick={fetchStats}
          className="os-btn-secondary flex items-center gap-1.5 text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="os-card p-5 space-y-1">
          <span className="text-xs text-[#8FA59B] uppercase font-bold">Registered Farmers</span>
          <p className="text-3xl font-bold font-heading text-white">{stats.total_farmers}</p>
          <span className="text-[10px] text-[#8FA59B]">In regional jurisdiction</span>
        </div>
        <div className="os-card p-5 space-y-1">
          <span className="text-xs text-[#8FA59B] uppercase font-bold">Farms Monitored</span>
          <p className="text-3xl font-bold font-heading text-emerald-400">{stats.total_farms}</p>
          <span className="text-[10px] text-[#8FA59B]">Under active surveillance</span>
        </div>
        <div className="os-card p-5 space-y-1">
          <span className="text-xs text-[#8FA59B] uppercase font-bold">AI Pathogen Scans</span>
          <p className="text-3xl font-bold font-heading text-teal-400">{stats.total_detections}</p>
          <span className="text-[10px] text-[#8FA59B]">Diagnostic scans run</span>
        </div>
        <div className="os-card p-5 space-y-1">
          <span className="text-xs text-[#8FA59B] uppercase font-bold">Advisories Dispatched</span>
          <p className="text-3xl font-bold font-heading text-amber-400">{stats.total_advisories || 0}</p>
          <span className="text-[10px] text-[#8FA59B]">Prescription notifications</span>
        </div>
      </div>

      {/* Outbreak Surveillance Card */}
      <div className="os-card-elevated p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1B382D] pb-3">
          <h3 className="text-base font-bold font-heading text-[#F3F7F5] flex items-center gap-2">
            <Bug className="w-4 h-4 text-rose-400" />
            <span>Regional Pathogen & Pest Surveillance Matrix</span>
          </h3>
          <span className="text-xs text-[#8FA59B]">Live Cluster Reporting</span>
        </div>

        <div className="space-y-3">
          {stats.disease_trends && stats.disease_trends.length > 0 ? (
            stats.disease_trends.map((item, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-[#08120E] border border-[#1B382D] flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-white text-sm">{item.crop} — {item.disease}</span>
                  <span className="text-[11px] text-[#8FA59B] block">{item.count} confirmed cases reported in regional cluster</span>
                </div>
                <span className="px-3 py-1 rounded-full font-bold text-[10px] bg-rose-500/15 text-rose-300 border border-rose-500/30">
                  {item.risk || 'Elevated'} Risk Outbreak
                </span>
              </div>
            ))
          ) : (
            <div className="p-4 rounded-2xl bg-[#08120E] border border-[#1B382D] flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-white text-sm">Tomato — Early Blight (Alternaria solani)</span>
                <span className="text-[11px] text-[#8FA59B] block">4 confirmed cases reported in Mandya / Mysore cluster</span>
              </div>
              <span className="px-3 py-1 rounded-full font-bold text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Moderate Risk
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
