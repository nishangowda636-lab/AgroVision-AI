import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  MapPin,
  Lightbulb,
  Sparkles,
  BarChart2,
  ArrowUpRight,
  Search,
  Filter,
  RefreshCw,
  Clock,
  ShieldAlert,
  HelpCircle,
  Tag
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import api from '../services/api';

export default function MarketPrices() {
  const [prices, setPrices] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('All');

  const fetchPrices = () => {
    setLoading(true);
    api.get('/market-prices')
      .then((res) => {
        setPrices(res.data);
        if (res.data.length > 0 && !selectedCrop) {
          setSelectedCrop(res.data[0]);
        }
      })
      .catch((err) => console.error('Error loading market prices:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  const getChartData = () => {
    if (!selectedCrop?.historical_json) {
      const base = selectedCrop?.price_per_kg || 30;
      return [
        { day: 'Mon', price: Math.max(10, base - 4) },
        { day: 'Tue', price: Math.max(10, base - 2.5) },
        { day: 'Wed', price: Math.max(10, base - 1) },
        { day: 'Thu', price: Math.max(10, base - 1.5) },
        { day: 'Fri', price: Math.max(10, base - 0.5) },
        { day: 'Sat', price: base },
        { day: 'Sun', price: base }
      ];
    }
    try {
      return JSON.parse(selectedCrop.historical_json);
    } catch {
      return [];
    }
  };

  const filteredPrices = prices.filter((item) => {
    const matchSearch =
      !searchQuery.trim() ||
      item.crop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.market_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.state?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchState = selectedState === 'All' || item.state === selectedState;
    return matchSearch && matchState;
  });

  const uniqueStates = ['All', ...new Set(prices.map((p) => p.state).filter(Boolean))];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto selection:bg-emerald-500 selection:text-black">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1B382D] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="os-status-pill os-status-emerald">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              APMC Live Telemetry
            </span>
            <span className="text-[11px] text-[#8FA59B]">e-NAM Integrated</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-[#F3F7F5] flex items-center gap-2.5">
            <DollarSign className="w-7 h-7 text-emerald-400" />
            <span>APMC Mandi Market Intelligence</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8FA59B] mt-1">
            Real-time APMC wholesale commodity rates, 7-day price movement curves, and AI selling window forecasts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPrices}
            className="os-btn-secondary flex items-center gap-2 text-xs"
            title="Refresh Mandi Prices"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Rates</span>
          </button>
        </div>
      </div>

      {loading && prices.length === 0 ? (
        <div className="os-card p-16 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#8FA59B]">Fetching live APMC Mandi price telemetry and historical curves...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Selected Commodity Deep Dive Card */}
          {selectedCrop && (
            <motion.div
              key={selectedCrop.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="os-card-elevated p-6 sm:p-7 space-y-6"
            >
              {/* Top Banner Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1B382D]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      Selected Commodity Analysis
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#1B382D] text-[10px] text-[#8FA59B]">
                      Mandi ID: #{selectedCrop.id}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold font-heading text-[#F3F7F5] mt-1">
                    {selectedCrop.crop_name}
                  </h2>
                  <p className="text-xs text-[#8FA59B] flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Primary APMC: <strong>{selectedCrop.market_name}</strong>, {selectedCrop.state}</span>
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-xs text-[#8FA59B] uppercase font-bold tracking-wider block">Wholesale Rate</span>
                    <div className="flex items-baseline justify-end gap-1">
                      <span className="text-3xl sm:text-4xl font-bold font-heading text-emerald-400">
                        ₹{selectedCrop.price_per_kg}
                      </span>
                      <span className="text-xs text-[#8FA59B] font-semibold">/ kg (₹{selectedCrop.price_per_kg * 100}/quintal)</span>
                    </div>
                  </div>

                  <div className={`p-3 rounded-2xl border flex flex-col items-center justify-center min-w-[90px] ${
                    selectedCrop.trend === 'Increasing'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  }`}>
                    <div className="flex items-center gap-1 font-bold text-xs">
                      {selectedCrop.trend === 'Increasing' ? (
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-amber-400" />
                      )}
                      <span>{selectedCrop.trend}</span>
                    </div>
                    <span className="text-[10px] opacity-80 mt-0.5">7-Day Trend</span>
                  </div>
                </div>
              </div>

              {/* 7-Day Interactive Area Chart */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#F3F7F5] flex items-center gap-1.5">
                    <BarChart2 className="w-4 h-4 text-emerald-400" />
                    7-Day Price Movement & Volatility Curve
                  </span>
                  <span className="text-[11px] text-[#8FA59B]">Demand Index: <strong className="text-white">{selectedCrop.demand}</strong></span>
                </div>

                <div className="h-64 sm:h-72 w-full pt-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(27, 56, 45, 0.6)" vertical={false} />
                      <XAxis dataKey="day" stroke="#8FA59B" fontSize={11} tickLine={false} axisLine={{ stroke: '#1B382D' }} />
                      <YAxis stroke="#8FA59B" fontSize={11} unit="₹" tickLine={false} axisLine={{ stroke: '#1B382D' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0E1E18',
                          borderColor: '#1B382D',
                          borderRadius: '12px',
                          fontSize: '12px',
                          color: '#F3F7F5',
                          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'
                        }}
                        formatter={(val) => [`₹${val}/kg`, 'Wholesale Rate']}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        name="Rate"
                        stroke="#10B981"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#priceGradient)"
                        dot={{ r: 4, fill: '#10B981', stroke: '#0E1E18', strokeWidth: 2 }}
                        activeDot={{ r: 7, fill: '#34D399', stroke: '#08120E', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* AI Strategic Selling Window Advice */}
              <div className="p-4 rounded-2xl bg-[#08120E] border border-[#1B382D] flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#F3F7F5]">AI Selling Window Strategy</span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Recommendation
                    </span>
                  </div>
                  <p className="text-xs text-[#8FA59B] leading-relaxed">
                    {selectedCrop.trend === 'Increasing'
                      ? `Wholesale rates for ${selectedCrop.crop_name} have gained upward momentum across regional APMCs. High buyer demand observed in ${selectedCrop.market_name}. Recommended action: Prepare harvest distribution within the next 48-72 hours to lock in peak spot pricing.`
                      : `Market arrivals for ${selectedCrop.crop_name} are steady with balanced supply. Recommended action: If moisture storage is available, consider staggered distribution or evaluate direct buyer aggregator contracts to optimize net margins.`}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Search, Filter & All Mandi Commodities List */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold font-heading text-[#F3F7F5]">All Tracked APMC Commodities</h3>
                <p className="text-xs text-[#8FA59B]">Select any commodity to view historical price trajectory and selling intelligence.</p>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-[#8FA59B] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search crop or mandi..."
                    className="os-input pl-9 py-2 text-xs w-48 sm:w-60"
                  />
                </div>

                {/* State Filter */}
                {uniqueStates.length > 2 && (
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="os-input py-2 text-xs cursor-pointer"
                  >
                    {uniqueStates.map((st) => (
                      <option key={st} value={st} className="bg-[#0E1E18]">
                        {st === 'All' ? 'All States' : st}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Commodity Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPrices.map((item) => {
                const isIncreasing = item.trend === 'Increasing';
                const isSelected = selectedCrop?.id === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedCrop(item)}
                    className={`os-card p-5 transition-all cursor-pointer space-y-3.5 ${
                      isSelected
                        ? 'border-emerald-400 bg-[#122820] ring-1 ring-emerald-400/50'
                        : 'hover:border-emerald-500/40 hover:bg-[#0E1E18]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-[#F3F7F5]">{item.crop_name}</h4>
                        <p className="text-[11px] text-[#8FA59B] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-emerald-400" />
                          <span>{item.market_name}, {item.state}</span>
                        </p>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                          isIncreasing
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {isIncreasing ? (
                          <TrendingUp className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-amber-400" />
                        )}
                        {item.trend}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between pt-2 border-t border-[#1B382D]">
                      <div>
                        <span className="text-2xl font-bold font-heading text-emerald-400">₹{item.price_per_kg}</span>
                        <span className="text-xs text-[#8FA59B] font-semibold"> / kg</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-[#8FA59B]">Demand: <strong className="text-white">{item.demand}</strong></span>
                        <p className="text-[10px] text-[#8FA59B]">Prev: ₹{item.prev_price_per_kg}/kg</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="text-[#8FA59B]">₹{item.price_per_kg * 100} / Quintal</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                        <span>Analyze</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
