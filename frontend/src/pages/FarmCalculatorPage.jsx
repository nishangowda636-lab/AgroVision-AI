import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useFarm } from '../context/FarmContext';
import {
  Calculator,
  DollarSign,
  TrendingUp,
  Sprout,
  Droplets,
  Scale,
  Sparkles,
  PieChart,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Layers,
  Coins,
  CheckCircle2
} from 'lucide-react';
import api from '../services/api';

export default function FarmCalculatorPage() {
  const { activeFarm } = useFarm();

  const [cropName, setCropName] = useState(activeFarm?.crop || 'Tomato');
  const [sizeAcres, setSizeAcres] = useState(activeFarm?.size_acres || 2.0);
  const [irrigationMethod, setIrrigationMethod] = useState(activeFarm?.irrigation_method || 'Drip Irrigation');
  const [soilType, setSoilType] = useState(activeFarm?.soil_type || 'Loam');

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const crops = [
    'Coffee',
    'Black Pepper',
    'Cardamom',
    'Arecanut',
    'Tea',
    'Coconut',
    'Tomato',
    'Chili',
    'Maize',
    'Cotton',
    'Potato',
    'Wheat',
    'Rice',
    'Ginger',
    'Turmeric',
    'Sugarcane',
    'Onion'
  ];

  const calculate = async () => {
    setLoading(true);
    try {
      const res = await api.post('/calculator/calculate', {
        crop_name: cropName,
        size_acres: parseFloat(sizeAcres) || 1.0,
        soil_type: soilType,
        irrigation_method: irrigationMethod
      });
      setResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculate();
  }, [cropName, sizeAcres, irrigationMethod, soilType]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto selection:bg-emerald-500 selection:text-black">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1B382D] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="os-status-pill os-status-emerald">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Agronomic Economics Engine
            </span>
            <span className="text-[11px] text-[#8FA59B]">Resource & Profit Simulator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-[#F3F7F5] flex items-center gap-2.5">
            <Calculator className="w-7 h-7 text-emerald-400" />
            <span>Farm Economics & Resource Calculator</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8FA59B] mt-1">
            Simulate seed quantities, NPK fertilizer, daily irrigation, expected yield, and net profit margins based on land area.
          </p>
        </div>

        <button
          onClick={calculate}
          className="os-btn-secondary flex items-center gap-1.5 text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Recalculate Model</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Inputs Card */}
        <div className="lg:col-span-4 space-y-4">
          <div className="os-card p-5 space-y-4">
            <h3 className="font-bold text-xs text-[#F3F7F5] uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-400" />
              <span>Simulation Parameters</span>
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-[#8FA59B] font-bold block mb-1">Target Crop</label>
                <select
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  className="os-input w-full py-2.5 text-xs cursor-pointer font-bold text-white"
                >
                  {crops.map((c) => (
                    <option key={c} value={c} className="bg-[#0E1E18]">{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[#8FA59B] font-bold">Land Area</label>
                  <span className="font-bold text-emerald-400">{sizeAcres} Acres</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="50"
                  step="0.5"
                  value={sizeAcres}
                  onChange={(e) => setSizeAcres(parseFloat(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[#8FA59B] font-bold block mb-1">Irrigation Method</label>
                <select
                  value={irrigationMethod}
                  onChange={(e) => setIrrigationMethod(e.target.value)}
                  className="os-input w-full py-2 text-xs cursor-pointer"
                >
                  <option value="Drip Irrigation" className="bg-[#0E1E18]">Drip Irrigation (Optimal)</option>
                  <option value="Sprinkler System" className="bg-[#0E1E18]">Sprinkler System</option>
                  <option value="Flood / Furrow" className="bg-[#0E1E18]">Flood / Furrow</option>
                  <option value="Rainfed / Manual" className="bg-[#0E1E18]">Rainfed / Manual</option>
                </select>
              </div>

              <div>
                <label className="text-[#8FA59B] font-bold block mb-1">Soil Texture</label>
                <select
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value)}
                  className="os-input w-full py-2 text-xs cursor-pointer"
                >
                  <option value="Loam" className="bg-[#0E1E18]">Loam (Well balanced)</option>
                  <option value="Sandy Loam" className="bg-[#0E1E18]">Sandy Loam</option>
                  <option value="Clay" className="bg-[#0E1E18]">Clay (High water retention)</option>
                  <option value="Black Soil" className="bg-[#0E1E18]">Black Cotton Soil</option>
                  <option value="Red Soil" className="bg-[#0E1E18]">Red Laterite</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Calculation Results Display */}
        <div className="lg:col-span-8 space-y-4">
          {results ? (
            <div className="space-y-4">
              {/* High-Level Financial Projections Card */}
              <div className="os-card-elevated p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1B382D]">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      Economics Summary
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#F3F7F5] mt-0.5">
                      {cropName} Cultivation ({sizeAcres} Acres)
                    </h2>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] text-[#8FA59B] uppercase font-bold tracking-wider block">Estimated Net Profit</span>
                      <span className="text-2xl sm:text-3xl font-bold font-heading text-emerald-400">
                        ₹{(results.estimated_net_profit || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3 Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-[#08120E] border border-[#1B382D]">
                    <span className="text-[10px] text-[#8FA59B] uppercase font-bold block">Gross Revenue</span>
                    <span className="text-lg font-bold font-heading text-[#F3F7F5] mt-1 block">
                      ₹{(results.estimated_gross_revenue || 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-[#8FA59B]">At standard Mandi rates</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#08120E] border border-[#1B382D]">
                    <span className="text-[10px] text-[#8FA59B] uppercase font-bold block">Total Input Cost</span>
                    <span className="text-lg font-bold font-heading text-amber-400 mt-1 block">
                      ₹{(results.total_estimated_cost || 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-[#8FA59B]">Seeds, NPK, power & labor</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#08120E] border border-[#1B382D]">
                    <span className="text-[10px] text-[#8FA59B] uppercase font-bold block">Estimated Yield</span>
                    <span className="text-lg font-bold font-heading text-teal-300 mt-1 block">
                      {results.expected_yield_tons || 0} Tons
                    </span>
                    <span className="text-[10px] text-[#8FA59B]">Total harvest weight</span>
                  </div>
                </div>
              </div>

              {/* Resource Requirements Breakdown */}
              <div className="os-card p-6 space-y-4">
                <h3 className="font-bold text-sm text-[#F3F7F5] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>Agronomic Resource Requirements</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#08120E] border border-[#1B382D]">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
                      <Sprout className="w-3.5 h-3.5" />
                      <span>Seed Quantity</span>
                    </div>
                    <span className="text-base font-bold text-white">{results.seeds_required_kg || 0} kg</span>
                    <p className="text-[10px] text-[#8FA59B] mt-0.5">Certified hybrid seed</p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#08120E] border border-[#1B382D]">
                    <div className="flex items-center gap-1.5 text-teal-400 font-bold mb-1">
                      <Droplets className="w-3.5 h-3.5" />
                      <span>Daily Irrigation</span>
                    </div>
                    <span className="text-base font-bold text-white">{(results.daily_water_liters || 0).toLocaleString()} L/day</span>
                    <p className="text-[10px] text-[#8FA59B] mt-0.5">{irrigationMethod}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#08120E] border border-[#1B382D]">
                    <div className="flex items-center gap-1.5 text-emerald-300 font-bold mb-1">
                      <Coins className="w-3.5 h-3.5" />
                      <span>NPK Fertilizer</span>
                    </div>
                    <span className="text-base font-bold text-white">{results.fertilizer_kg || 0} kg</span>
                    <p className="text-[10px] text-[#8FA59B] mt-0.5">Total cycle requirement</p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#08120E] border border-[#1B382D]">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold mb-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Net Profit Margin</span>
                    </div>
                    <span className="text-base font-bold text-emerald-400">{results.profit_margin_pct || 0}%</span>
                    <p className="text-[10px] text-[#8FA59B] mt-0.5">ROI on operating capital</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="os-card p-16 text-center space-y-2">
              <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[#8FA59B]">Calculating agronomic inputs and economics...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
