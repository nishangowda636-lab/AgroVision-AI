import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFarm } from '../context/FarmContext';
import { useAuth } from '../context/AuthContext';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PlusCircle,
  Filter,
  Calendar,
  Layers,
  Sprout,
  Receipt,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Plus
} from 'lucide-react';
import api from '../services/api';
import offlineStorage from '../services/offlineStorage';

const EXPENSE_CATEGORIES = [
  'Seeds',
  'Fertilizer',
  'Pesticides',
  'Labour',
  'Irrigation',
  'Fuel/Electricity',
  'Machinery',
  'Equipment Rental',
  'Transport',
  'Repairs',
  'Other'
];

const INCOME_CATEGORIES = [
  'Crop Sales',
  'Produce Sales',
  'Government Subsidy',
  'Other Income'
];

const CROP_STAGES = [
  'Sowing / Planting',
  'Germination',
  'Vegetative Growth',
  'Flowering',
  'Fruiting / Grain Filling',
  'Harvest',
  'Post-Harvest & Mandi'
];

export default function FarmLedgerPage() {
  const { activeFarm } = useFarm();
  const { t } = useAuth();

  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStage, setFilterStage] = useState('All');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('expense');
  const [formCost, setFormCost] = useState('');
  const [formCategory, setFormCategory] = useState('Fertilizer');
  const [formItemName, setFormItemName] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formStage, setFormStage] = useState('Vegetative Growth');
  const [formQuantity, setFormQuantity] = useState('');
  const [formUnit, setFormUnit] = useState('kg');
  const [formNotes, setFormNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const fetchLedgerData = async () => {
    if (!activeFarm) return;
    setLoading(true);

    try {
      if (navigator.onLine) {
        const [sumRes, txRes] = await Promise.all([
          api.get(`/ledger/summary/${activeFarm.id}`),
          api.get(`/ledger/transactions/${activeFarm.id}`, {
            params: {
              type: filterType !== 'all' ? filterType : null,
              category: filterCategory !== 'All' ? filterCategory : null,
              stage: filterStage !== 'All' ? filterStage : null
            }
          })
        ]);
        setSummary(sumRes.data);
        setTransactions(txRes.data);
        offlineStorage.saveLedgerSummary(activeFarm.id, sumRes.data);
        offlineStorage.saveLedgerTransactions(activeFarm.id, txRes.data);
      } else {
        const cachedSum = offlineStorage.getLedgerSummary(activeFarm.id);
        const cachedTxs = offlineStorage.getLedgerTransactions(activeFarm.id);
        if (cachedSum) setSummary(cachedSum);
        if (cachedTxs) setTransactions(cachedTxs);
      }
    } catch (err) {
      console.warn('Network error, retrieving cached ledger records:', err);
      const cachedSum = offlineStorage.getLedgerSummary(activeFarm.id);
      const cachedTxs = offlineStorage.getLedgerTransactions(activeFarm.id);
      if (cachedSum) setSummary(cachedSum);
      if (cachedTxs) setTransactions(cachedTxs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerData();
  }, [activeFarm?.id, filterType, filterCategory, filterStage]);

  const handleOpenModal = (type) => {
    setModalType(type);
    setFormCategory(type === 'expense' ? 'Fertilizer' : 'Crop Sales');
    setFormCost('');
    setFormItemName('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormStage(activeFarm?.current_stage_override || 'Vegetative Growth');
    setFormQuantity('');
    setFormNotes('');
    setModalOpen(true);
  };

  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    if (!formCost || parseFloat(formCost) <= 0 || !activeFarm) return;

    setSubmitting(true);
    const payload = {
      farm_id: activeFarm.id,
      type: modalType,
      category: formCategory,
      crop: activeFarm.crop || 'Crop',
      item_name: formItemName || `${formCategory} (${modalType})`,
      cost: parseFloat(formCost),
      date: formDate,
      quantity: formQuantity ? parseFloat(formQuantity) : null,
      unit: formUnit,
      stage: formStage,
      provenance: 'ACTUAL',
      notes: formNotes,
      client_sync_id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)
    };

    if (navigator.onLine) {
      try {
        await api.post('/ledger/transactions', payload);
        showToast(`✓ ${modalType === 'income' ? 'Income' : 'Expense'} of ₹${parseFloat(formCost).toLocaleString()} recorded in Farm Ledger.`);
        setModalOpen(false);
        fetchLedgerData();
      } catch (err) {
        console.error('Error saving transaction online:', err);
        offlineStorage.enqueueSyncAction('RECORD_TRANSACTION', payload);
        showToast('⚠️ Saved locally (Offline Queue). Will sync automatically when connection restores.');
        setModalOpen(false);
        fetchLedgerData();
      } finally {
        setSubmitting(false);
      }
    } else {
      offlineStorage.enqueueSyncAction('RECORD_TRANSACTION', payload);
      showToast('⚠️ Offline Mode: Saved locally. Sync queued for when you reconnect.');
      setModalOpen(false);
      setSubmitting(false);
      fetchLedgerData();
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm('Delete this transaction from the Farm Ledger?')) return;
    try {
      await api.delete(`/ledger/transactions/${id}`);
      showToast('Transaction removed.');
      fetchLedgerData();
    } catch {
      showToast('Error removing transaction.');
    }
  };

  const acres = activeFarm?.size_acres || 1.0;
  const totIncome = summary?.total_income || 0;
  const totExpenses = summary?.total_expenses || 0;
  const netProfit = summary?.net_profit || (totIncome - totExpenses);
  const profitPerAcre = summary?.profit_per_acre || (netProfit / acres);
  const costPerAcre = summary?.cost_per_acre || (totExpenses / acres);
  const isProfitable = netProfit >= 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto selection:bg-[#10B981] selection:text-black">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 px-4 py-3 rounded-xl bg-[#0E1E18] border border-[#10B981]/50 text-[#10B981] text-xs font-semibold shadow-xl flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/20 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span> Farm Financial Ledger
            </span>
            <span className="text-[10px] font-medium text-[#8FA59B]">
              Actual Cost-Per-Acre & Profit Analysis
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F3F7F5] flex items-center gap-2.5">
            <DollarSign className="w-6 h-6 text-[#10B981]" />
            <span>Farm Financial Ledger & Profitability</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8FA59B] mt-0.5">
            Operational cashflow, produce sales, and margin analysis for{' '}
            <span className="text-[#F3F7F5] font-semibold">{activeFarm?.name || 'Your Farm'}</span> ({activeFarm?.crop || 'Tomato'}, {acres} Acres).
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleOpenModal('expense')}
            className="os-btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5 cursor-pointer text-[#EF4444] border-[#EF4444]/30 hover:bg-[#EF4444]/10"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Expense</span>
          </button>
          <button
            onClick={() => handleOpenModal('income')}
            className="os-btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Income</span>
          </button>
        </div>
      </div>

      {/* Top 4 Profitability Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Total Income */}
        <div className="os-card p-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#8FA59B] uppercase tracking-wider">Total Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-[#10B981]/15 text-[#10B981] flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#10B981]">
            ₹{totIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-between text-[10px] text-[#8FA59B] pt-1 border-t border-[#1B382D]">
            <span>Revenue / Acre:</span>
            <span className="font-semibold text-[#10B981]">₹{(totIncome / acres).toLocaleString('en-IN', { maximumFractionDigits: 1 })}</span>
          </div>
        </div>

        {/* 2. Total Expenses */}
        <div className="os-card p-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#8FA59B] uppercase tracking-wider">Total Expenses</span>
            <div className="w-7 h-7 rounded-lg bg-[#EF4444]/15 text-[#EF4444] flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#EF4444]">
            ₹{totExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-between text-[10px] text-[#8FA59B] pt-1 border-t border-[#1B382D]">
            <span>Cost / Acre:</span>
            <span className="font-semibold text-[#EF4444]">₹{costPerAcre.toLocaleString('en-IN', { maximumFractionDigits: 1 })}</span>
          </div>
        </div>

        {/* 3. Net Profit / Loss */}
        <div className={`os-card p-4 space-y-1.5 ${isProfitable ? 'border-[#10B981]/40' : 'border-[#EF4444]/40'}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#8FA59B] uppercase tracking-wider">
              {isProfitable ? 'Net Profit' : 'Net Loss'}
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              isProfitable ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-[#EF4444]/15 text-[#EF4444]'
            }`}>
              {summary?.roi_percent ? `${summary.roi_percent}% ROI` : 'ACTUAL'}
            </span>
          </div>
          <p className={`text-xl sm:text-2xl font-bold ${isProfitable ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
            {netProfit >= 0 ? '+' : ''}₹{netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-between text-[10px] text-[#8FA59B] pt-1 border-t border-[#1B382D]">
            <span>Profit / Acre:</span>
            <span className={`font-semibold ${isProfitable ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
              ₹{profitPerAcre.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
            </span>
          </div>
        </div>

        {/* 4. Ledger Provenance */}
        <div className="os-card p-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#8FA59B] uppercase tracking-wider">Ledger Records</span>
            <Receipt className="w-4 h-4 text-[#10B981]" />
          </div>
          <p className="text-xl font-bold text-[#F3F7F5]">
            {summary?.transaction_count || transactions.length} Entries
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-[#8FA59B] pt-1 border-t border-[#1B382D]">
            <span className="px-1.5 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] font-bold">
              ✓ Verified
            </span>
            <span>Recorded operational costs</span>
          </div>
        </div>
      </div>

      {/* Crop Stage Breakdown */}
      {summary?.stage_breakdown && summary.stage_breakdown.length > 0 && (
        <div className="os-card p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#F3F7F5] uppercase tracking-wide flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#10B981]" />
              <span>Crop Cycle Cost Distribution</span>
            </h3>
            <span className="text-[10px] text-[#8FA59B]">Synchronized with Phenology</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {summary.stage_breakdown.map((stg, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-[#08120E] border border-[#1B382D] space-y-0.5 text-xs">
                <span className="text-[10px] font-semibold text-[#10B981] block truncate">{stg.stage}</span>
                <p className="text-sm font-bold text-[#F3F7F5]">
                  ₹{stg.expenses.toLocaleString('en-IN')}
                </p>
                {stg.income > 0 && (
                  <p className="text-[10px] text-[#14B8A6] font-semibold">
                    +₹{stg.income.toLocaleString('en-IN')} (Sales)
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Bar & Transaction Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#0E1E18] p-2.5 rounded-xl border border-[#1B382D]">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter by Type */}
            <div className="flex items-center gap-1 bg-[#08120E] p-1 rounded-lg border border-[#1B382D]">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                  filterType === 'all' ? 'bg-[#10B981] text-[#08120E] font-bold' : 'text-[#8FA59B] hover:text-[#F3F7F5]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('expense')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                  filterType === 'expense' ? 'bg-[#EF4444] text-white font-bold' : 'text-[#8FA59B] hover:text-[#F3F7F5]'
                }`}
              >
                Expenses
              </button>
              <button
                onClick={() => setFilterType('income')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                  filterType === 'income' ? 'bg-[#10B981] text-[#08120E] font-bold' : 'text-[#8FA59B] hover:text-[#F3F7F5]'
                }`}
              >
                Income
              </button>
            </div>

            {/* Filter by Category */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="os-input text-xs font-semibold px-2.5 py-1 cursor-pointer bg-[#08120E]"
            >
              <option value="All">All Categories</option>
              {[...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Filter by Crop Stage */}
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="os-input text-xs font-semibold px-2.5 py-1 cursor-pointer bg-[#08120E]"
            >
              <option value="All">All Stages</option>
              {CROP_STAGES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchLedgerData}
            className="os-btn-secondary px-3 py-1 text-xs flex items-center gap-1.5 cursor-pointer self-end sm:self-auto"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Transactions Table */}
        {transactions.length === 0 ? (
          <div className="os-card p-10 text-center space-y-2 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-[#10B981]/10 text-[#10B981] flex items-center justify-center border border-[#10B981]/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#F3F7F5]">No Ledger Entries Found</h3>
            <p className="text-xs text-[#8FA59B] max-w-sm">
              Record your seed purchases, fertilizer applications, labor wages, or produce sales using the buttons above.
            </p>
          </div>
        ) : (
          <div className="os-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#08120E] border-b border-[#1B382D] text-[#8FA59B] uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Description / Item</th>
                    <th className="p-3.5">Crop Stage</th>
                    <th className="p-3.5 text-right">Amount (₹)</th>
                    <th className="p-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1B382D] text-[#F3F7F5]">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#11261F]/50 transition-colors">
                      <td className="p-3.5 font-mono text-[11px] text-[#8FA59B] whitespace-nowrap">
                        {tx.date}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            tx.type === 'income'
                              ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/25'
                              : 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/25'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-[#F3F7F5] whitespace-nowrap">
                        {tx.category}
                      </td>
                      <td className="p-3.5 max-w-xs truncate">
                        <span className="font-medium text-[#F3F7F5]">{tx.item_name}</span>
                        {tx.quantity && (
                          <span className="text-[#8FA59B] text-[10px] block">
                            Qty: {tx.quantity} {tx.unit}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-[11px] text-[#8FA59B] whitespace-nowrap">
                        {tx.stage || 'General'}
                      </td>
                      <td
                        className={`p-3.5 text-right font-mono font-bold text-sm whitespace-nowrap ${
                          tx.type === 'income' ? 'text-[#10B981]' : 'text-[#EF4444]'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}₹{tx.cost?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleDeleteTransaction(tx.id)}
                          className="p-1 rounded text-[#8FA59B] hover:text-[#EF4444] transition-colors cursor-pointer"
                          title="Delete Transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Record Transaction Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0E1E18] border border-[#1B382D] w-full max-w-lg p-6 rounded-2xl space-y-4 text-xs shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[#1B382D] pb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${modalType === 'income' ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`} />
                  <h3 className="text-base font-bold text-[#F3F7F5]">
                    {modalType === 'income' ? 'Record Produce Income' : 'Record Farm Expense'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-7 h-7 rounded-lg bg-[#08120E] text-[#8FA59B] hover:text-[#F3F7F5] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveTransaction} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-semibold text-[#8FA59B] block mb-1">
                    Amount in Rupees (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 2000"
                    value={formCost}
                    onChange={(e) => setFormCost(e.target.value)}
                    className="os-input font-mono text-sm font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[#8FA59B] block mb-1">
                      Category *
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="os-input cursor-pointer text-xs"
                    >
                      {(modalType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#8FA59B] block mb-1">
                      Transaction Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="os-input text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#8FA59B] block mb-1">
                    Description / Item Details
                  </label>
                  <input
                    type="text"
                    placeholder={`e.g. 2 Bags Neem Urea, or Mandi sale 50 crates`}
                    value={formItemName}
                    onChange={(e) => setFormItemName(e.target.value)}
                    className="os-input text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[#8FA59B] block mb-1">
                      Crop Growth Stage
                    </label>
                    <select
                      value={formStage}
                      onChange={(e) => setFormStage(e.target.value)}
                      className="os-input text-xs cursor-pointer"
                    >
                      {CROP_STAGES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <label className="text-[11px] font-semibold text-[#8FA59B] block mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        placeholder="50"
                        value={formQuantity}
                        onChange={(e) => setFormQuantity(e.target.value)}
                        className="os-input text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[#8FA59B] block mb-1">
                        Unit
                      </label>
                      <select
                        value={formUnit}
                        onChange={(e) => setFormUnit(e.target.value)}
                        className="os-input text-xs"
                      >
                        <option value="kg">kg</option>
                        <option value="bags">bags</option>
                        <option value="litres">litres</option>
                        <option value="quintals">quintals</option>
                        <option value="hours">hours</option>
                        <option value="crates">crates</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    modalType === 'income'
                      ? 'bg-[#10B981] text-[#08120E] hover:bg-[#22C55E]'
                      : 'bg-[#EF4444] text-white hover:bg-[#DC2626]'
                  }`}
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Transaction...</span>
                    </>
                  ) : (
                    <span>Save {modalType === 'income' ? 'Income' : 'Expense'} to Ledger</span>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
