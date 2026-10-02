import React, { useState, useEffect } from 'react';
import { useFarm } from '../context/FarmContext';
import { PieChart, DollarSign, TrendingUp, ArrowRight, ShieldCheck } from 'lucide-react';
import api from '../services/api';

export default function ProfitPlanner() {
  const { activeFarm } = useFarm();
  const [profitData, setProfitData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeFarm) {
      setLoading(true);
      api.get(`/profit/${activeFarm.id}`)
        .then((res) => setProfitData(res.data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [activeFarm]);

  if (loading || !profitData) {
    return <div className="p-8 text-center text-slate-400 text-xs">Calculating farm profit financial metrics...</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="border-b border-emerald-500/20 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
          <PieChart className="w-8 h-8 text-emerald-400" />
          <span>Farm Profit & Expense Planner</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Financial ROI calculation (Revenue - Operational Costs) for{' '}
          <span className="text-emerald-400 font-bold">{activeFarm?.name}</span> ({activeFarm?.crop}, {activeFarm?.size_acres} Acres).
        </p>
      </div>

      {/* Main Financial Hero Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30 space-y-2">
          <span className="text-xs text-slate-400 font-semibold">Estimated Gross Revenue</span>
          <p className="text-3xl font-extrabold text-white">₹{profitData.estimated_revenue?.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400">Based on {profitData.expected_yield_tons} Tonnes harvest @ ₹{profitData.market_price_per_kg}/kg</p>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-amber-500/30 space-y-2">
          <span className="text-xs text-slate-400 font-semibold">Total Farm Costs</span>
          <p className="text-3xl font-extrabold text-amber-400">₹{profitData.estimated_cost?.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400">Seeds, fertilizer, labour, irrigation & transport</p>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-emerald-500/40 space-y-2 bg-gradient-to-br from-emerald-950/60 to-teal-950/40">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-300 font-bold">Estimated Net Profit</span>
            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500 text-black">
              +{profitData.roi_percent}% ROI
            </span>
          </div>
          <p className="text-3xl font-extrabold text-emerald-300">₹{profitData.estimated_profit?.toLocaleString()}</p>
          <p className="text-[10px] text-emerald-400 font-medium">Projected net earnings after harvest</p>
        </div>
      </div>

      {/* Itemized Cost Breakdown */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-emerald-500/30 space-y-4">
        <h3 className="text-base font-bold text-white">Itemized Operational Expense Breakdown</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profitData.cost_breakdown?.map((item, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-[#06131D]/80 border border-emerald-500/20 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-white">{item.category}</h4>
                <p className="text-[10px] text-slate-400">Budget allocation</p>
              </div>
              <span className="font-extrabold text-xs text-amber-400">₹{item.cost.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
