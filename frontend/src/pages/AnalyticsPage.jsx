import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  BarChart3,
  TrendingUp,
  Droplets,
  DollarSign,
  Scale,
  Calendar,
  Sparkles,
  Activity,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

export default function AnalyticsPage() {
  const { activeFarm } = useFarm();
  const [filter, setFilter] = useState('30 days');

  const soilWaterData = [
    { day: 'Day 1', moisture: 48, water: 1200, cropHealth: 90 },
    { day: 'Day 5', moisture: 46, water: 1250, cropHealth: 91 },
    { day: 'Day 10', moisture: 43, water: 1100, cropHealth: 90 },
    { day: 'Day 15', moisture: 41, water: 1300, cropHealth: 89 },
    { day: 'Day 20', moisture: 45, water: 1250, cropHealth: 92 },
    { day: 'Day 25', moisture: 47, water: 1200, cropHealth: 93 },
    { day: 'Day 30', moisture: 44, water: 1250, cropHealth: 92 },
  ];

  const financialData = [
    { month: 'Jun', revenue: 45000, cost: 18000, profit: 27000, yieldTons: 1.5 },
    { month: 'Jul', revenue: 85000, cost: 24000, profit: 61000, yieldTons: 2.8 },
    { month: 'Aug', revenue: 140000, cost: 32000, profit: 108000, yieldTons: 4.8 },
  ];

  const marketPriceTrend = [
    { week: 'W1', price: 26 },
    { week: 'W2', price: 28 },
    { week: 'W3', price: 29.5 },
    { week: 'W4', price: 32 },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto selection:bg-[#10B981] selection:text-black">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/20 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span> Farm Telemetry & Trends
            </span>
            <span className="text-[10px] font-medium text-[#8FA59B]">
              Historical Telemetry & Projections
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F3F7F5] flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-[#10B981]" />
            <span>Farm Analytics & Operations Intelligence</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8FA59B] mt-0.5">
            Soil moisture kinetics, water consumption, crop vigor scores, and yield profitability for{' '}
            <span className="text-[#F3F7F5] font-semibold">{activeFarm?.name || 'Your Farm'}</span>.
          </p>
        </div>

        {/* Time Filters */}
        <div className="flex items-center gap-1 bg-[#0E1E18] p-1 rounded-xl border border-[#1B382D]">
          {['7 days', '30 days', '3 months', '1 year'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filter === f
                  ? 'bg-[#10B981] text-[#08120E] font-bold shadow-sm'
                  : 'text-[#8FA59B] hover:text-[#F3F7F5]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Soil Moisture vs Water Usage */}
        <div className="os-card p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1B382D] pb-2.5">
            <h3 className="text-xs font-bold text-[#F3F7F5] uppercase tracking-wide flex items-center gap-2">
              <Droplets className="w-4 h-4 text-[#14B8A6]" />
              <span>Soil Moisture (%) vs Crop Health Index</span>
            </h3>
            <span className="text-[10px] text-[#8FA59B] font-medium">{filter}</span>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={soilWaterData}>
                <CartesianGrid stroke="#1B382D" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" stroke="#8FA59B" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#8FA59B" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0E1E18',
                    borderColor: '#1B382D',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F3F7F5'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="moisture"
                  name="Soil Moisture %"
                  stroke="#14B8A6"
                  fill="#14B8A6"
                  fillOpacity={0.2}
                />
                <Area
                  type="monotone"
                  dataKey="cropHealth"
                  name="Crop Health Index"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Revenue vs Costs vs Profit */}
        <div className="os-card p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1B382D] pb-2.5">
            <h3 className="text-xs font-bold text-[#F3F7F5] uppercase tracking-wide flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#10B981]" />
              <span>Revenue (₹) vs Expenses (₹) vs Net Profit</span>
            </h3>
            <span className="text-[10px] text-[#8FA59B] font-medium">{filter}</span>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialData}>
                <CartesianGrid stroke="#1B382D" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" stroke="#8FA59B" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#8FA59B" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0E1E18',
                    borderColor: '#1B382D',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F3F7F5'
                  }}
                />
                <Bar dataKey="revenue" name="Revenue ₹" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cost" name="Expenses ₹" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Net Profit ₹" fill="#14B8A6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Harvest Yield Trend */}
        <div className="os-card p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1B382D] pb-2.5">
            <h3 className="text-xs font-bold text-[#F3F7F5] uppercase tracking-wide flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#F59E0B]" />
              <span>Cumulative Harvest Production (Tonnes)</span>
            </h3>
            <span className="text-[10px] text-[#8FA59B] font-medium">Seasonal Growth</span>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financialData}>
                <CartesianGrid stroke="#1B382D" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" stroke="#8FA59B" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#8FA59B" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0E1E18',
                    borderColor: '#1B382D',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F3F7F5'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="yieldTons"
                  name="Harvested Tonnes"
                  stroke="#F59E0B"
                  fill="#F59E0B"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. APMC Market Price Trend */}
        <div className="os-card p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1B382D] pb-2.5">
            <h3 className="text-xs font-bold text-[#F3F7F5] uppercase tracking-wide flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#10B981]" />
              <span>APMC Mandi Price Curve (₹/kg)</span>
            </h3>
            <span className="text-[10px] text-[#8FA59B] font-medium">Weekly Market Index</span>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={marketPriceTrend}>
                <CartesianGrid stroke="#1B382D" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" stroke="#8FA59B" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#8FA59B" fontSize={11} domain={[20, 40]} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0E1E18',
                    borderColor: '#1B382D',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F3F7F5'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  name="Mandi Price ₹/kg"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={{ fill: '#10B981', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
