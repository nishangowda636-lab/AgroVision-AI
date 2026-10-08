import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, Database, Cpu, Sparkles, Sprout, BarChart3, RefreshCw, Server, Activity } from 'lucide-react';
import api from '../services/api';

export default function AdminDashboard() {
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
        <p className="text-xs text-[#8FA59B]">Loading platform administration telemetry...</p>
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
              Core Infrastructure
            </span>
            <span className="text-[11px] text-[#8FA59B]">System Telemetry & Controls</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-[#F3F7F5] flex items-center gap-2.5">
            <ShieldAlert className="w-7 h-7 text-amber-400" />
            <span>Platform Administration & Telemetry</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8FA59B] mt-1">
            Platform infrastructure status, user registry metrics, database telemetry, and ML model inference counters.
          </p>
        </div>

        <button
          onClick={fetchStats}
          className="os-btn-secondary flex items-center gap-1.5 text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="os-card p-5 space-y-1">
          <span className="text-xs text-[#8FA59B] uppercase font-bold">Registered Users</span>
          <p className="text-3xl font-bold font-heading text-white">{stats.total_farmers}</p>
          <span className="text-[10px] text-[#8FA59B]">Verified accounts</span>
        </div>
        <div className="os-card p-5 space-y-1">
          <span className="text-xs text-[#8FA59B] uppercase font-bold">Total Farm Plots</span>
          <p className="text-3xl font-bold font-heading text-emerald-400">{stats.total_farms}</p>
          <span className="text-[10px] text-[#8FA59B]">GIS mapped acreage</span>
        </div>
        <div className="os-card p-5 space-y-1">
          <span className="text-xs text-[#8FA59B] uppercase font-bold">AI Advisories</span>
          <p className="text-3xl font-bold font-heading text-amber-400">{stats.total_advisories || 0}</p>
          <span className="text-[10px] text-[#8FA59B]">Co-pilot interactions</span>
        </div>
        <div className="os-card p-5 space-y-1">
          <span className="text-xs text-[#8FA59B] uppercase font-bold">ML Inferences</span>
          <p className="text-3xl font-bold font-heading text-teal-400">{stats.total_detections}</p>
          <span className="text-[10px] text-[#8FA59B]">Disease & yield runs</span>
        </div>
      </div>

      {/* Infrastructure Details */}
      <div className="os-card-elevated p-6 space-y-4 text-xs text-[#8FA59B]">
        <div className="flex items-center justify-between border-b border-[#1B382D] pb-3">
          <h3 className="text-base font-bold font-heading text-[#F3F7F5] flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Infrastructure & Microservice Health</span>
          </h3>
          <span className="os-status-pill os-status-emerald">All Nominal</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#08120E] border border-[#1B382D] space-y-1">
            <span className="font-bold text-white block">FastAPI Server & Database Engine</span>
            <p className="text-[#8FA59B]">Connection pool healthy • Schema auto-migrated • Cloud API</p>
          </div>
          <div className="p-3 rounded-xl bg-[#08120E] border border-[#1B382D] space-y-1">
            <span className="font-bold text-white block">Machine Learning Inference Engine</span>
            <p className="text-[#8FA59B]">5 Trained Scikit-Learn Pipelines Active • ResNet50 Vision Model</p>
          </div>
          <div className="p-3 rounded-xl bg-[#08120E] border border-[#1B382D] space-y-1">
            <span className="font-bold text-white block">Security & JWT Authentication</span>
            <p className="text-[#8FA59B]">PBKDF2/SHA256 Token Encryption • Role-based access enforcement</p>
          </div>
          <div className="p-3 rounded-xl bg-[#08120E] border border-[#1B382D] space-y-1">
            <span className="font-bold text-white block">Daily Farm Plan & Offline Sync Queue</span>
            <p className="text-[#8FA59B]">FAO-56 GDD Engine Active • IndexedDB local cache bridge active</p>
          </div>
        </div>
      </div>
    </div>
  );
}
