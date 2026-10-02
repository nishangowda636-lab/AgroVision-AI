import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFarm } from '../context/FarmContext';
import {
  Calendar,
  CheckCircle2,
  Clock,
  PlusCircle,
  Sprout,
  Droplets,
  Bug,
  DollarSign,
  Trash2,
  Sparkles,
  Info,
  CalendarDays,
  Activity,
  Edit3,
  Layers,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Plus
} from 'lucide-react';
import api from '../services/api';

export default function CropCalendarPage() {
  const { activeFarm, farms, setActiveFarm } = useFarm();
  const [stageData, setStageData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [stageModalOpen, setStageModalOpen] = useState(false);
  const [selectedNewStage, setSelectedNewStage] = useState('');
  const [updatingStage, setUpdatingStage] = useState(false);

  const [formData, setFormData] = useState({
    event_type: 'Irrigation',
    title: '',
    description: '',
    stage: 'Vegetative Growth',
    event_date: new Date().toISOString().split('T')[0],
    cost: 0
  });

  const [submitting, setSubmitting] = useState(false);

  const eventTypes = [
    { label: '💧 Irrigation', val: 'Irrigation' },
    { label: '🌱 Fertilizer Application', val: 'Fertilizer' },
    { label: '🐛 Pest / Disease Spray', val: 'Pest Treatment' },
    { label: '👥 Labour / Weeding', val: 'Labour' },
    { label: '🍅 Harvest Picking', val: 'Harvest' },
    { label: '🔍 Crop Scouting', val: 'Scouting' },
    { label: '📝 Farm Note', val: 'General Note' }
  ];

  const fetchStageAndActivities = async () => {
    if (!activeFarm) return;
    setLoading(true);
    try {
      const [stageRes, actRes] = await Promise.allSettled([
        api.get(`/farms/${activeFarm.id}/crop-stage`),
        api.get(`/farms/${activeFarm.id}/activities`)
      ]);

      if (stageRes.status === 'fulfilled') {
        setStageData(stageRes.value.data);
        setSelectedNewStage(stageRes.value.data.active_stage);
      }
      if (actRes.status === 'fulfilled') {
        setActivities(actRes.value.data.activities || []);
      }
    } catch (err) {
      console.warn('Error fetching crop calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStageAndActivities();
  }, [activeFarm?.id]);

  const handleUpdateStage = async (e) => {
    e.preventDefault();
    if (!selectedNewStage || !activeFarm) return;
    setUpdatingStage(true);
    try {
      const res = await api.put(`/farms/${activeFarm.id}/crop-stage`, {
        stage_name: selectedNewStage
      });
      setStageData(res.data);
      setStageModalOpen(false);
      const actRes = await api.get(`/farms/${activeFarm.id}/activities`);
      setActivities(actRes.data.activities || []);
    } catch (err) {
      alert('Failed to update stage: ' + (err.response?.data?.detail || err.message));
    } finally {
      setUpdatingStage(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !activeFarm) return;
    setSubmitting(true);

    try {
      await api.post('/calendar/events', {
        farm_id: activeFarm.id,
        ...formData,
        stage: formData.stage || stageData?.active_stage || 'Vegetative Growth',
        cost: parseFloat(formData.cost) || 0.0
      });
      setModalOpen(false);
      setFormData({
        event_type: 'Irrigation',
        title: '',
        description: '',
        stage: stageData?.active_stage || 'Vegetative Growth',
        event_date: new Date().toISOString().split('T')[0],
        cost: 0
      });
      fetchStageAndActivities();
    } catch (err) {
      alert('Error recording activity: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Delete this calendar entry?')) return;
    try {
      await api.delete(`/calendar/events/${id}`);
      fetchStageAndActivities();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto selection:bg-emerald-500 selection:text-black">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1B382D] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="os-status-pill os-status-emerald">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              FAO-56 Phenology Cycle
            </span>
            <span className="text-[11px] text-[#8FA59B]">8-Stage GDD Model</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-[#F3F7F5] flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-emerald-400" />
            <span>Crop Lifecycle & Field Log</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8FA59B] mt-1">
            Standard 8-stage phenological growth tracking, active stage synchronization, and field operations log for{' '}
            <strong className="text-emerald-400">{activeFarm?.name || 'Selected Farm'}</strong> ({stageData?.crop_name || activeFarm?.crop || 'Crop'}).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {farms.length > 1 && (
            <select
              value={activeFarm?.id || ''}
              onChange={(e) => {
                const found = farms.find((f) => f.id === parseInt(e.target.value));
                if (found) setActiveFarm(found);
              }}
              className="os-input py-2 text-xs cursor-pointer font-bold text-emerald-300"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id} className="bg-[#0E1E18] text-slate-200">
                  {f.name} ({f.crop})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setStageModalOpen(true)}
            className="os-btn-secondary flex items-center gap-1.5 text-xs"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Adjust Stage</span>
          </button>

          <button
            onClick={() => setModalOpen(true)}
            className="os-btn-primary flex items-center gap-1.5 text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Log Field Activity</span>
          </button>
        </div>
      </div>

      {loading && !stageData ? (
        <div className="os-card p-16 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#8FA59B]">Loading phenological stage matrix and field activity timeline...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Lifecycle Hero Banner */}
          <div className="os-card-elevated p-6 sm:p-8 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1B382D]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    Current Ground Phenology Stage
                  </span>
                  {stageData?.is_stage_overridden && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold">
                      Manual Override Synchronized
                    </span>
                  )}
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold font-heading text-[#F3F7F5] mt-1 flex items-center gap-2">
                  <span>{stageData?.active_stage || 'Vegetative Growth'}</span>
                </h2>
                <p className="text-xs text-[#8FA59B] mt-1">
                  Sowing Date: <strong className="text-white">{stageData?.sowing_date || 'N/A'}</strong> • Cumulative Age:{' '}
                  <strong className="text-emerald-400">{stageData?.days_elapsed || 0} Days In Ground</strong>
                  {stageData?.days_to_next_stage > 0 && (
                    <span> • Next Stage Transition: ~<strong className="text-teal-300">{stageData.days_to_next_stage} days</strong></span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="p-3.5 sm:p-4 rounded-2xl bg-[#08120E] border border-[#1B382D] text-center min-w-[100px]">
                  <span className="text-2xl sm:text-3xl font-bold font-heading text-emerald-400">
                    {stageData?.days_elapsed || 0}
                  </span>
                  <span className="text-[10px] text-[#8FA59B] block font-bold uppercase tracking-wider mt-0.5">
                    Days Elapsed
                  </span>
                </div>
                <div className="p-3.5 sm:p-4 rounded-2xl bg-[#08120E] border border-[#1B382D] text-center min-w-[100px]">
                  <span className="text-2xl sm:text-3xl font-bold font-heading text-teal-300">
                    {stageData?.total_duration_days || 100}
                  </span>
                  <span className="text-[10px] text-[#8FA59B] block font-bold uppercase tracking-wider mt-0.5">
                    Total Cycle
                  </span>
                </div>
              </div>
            </div>

            {/* Stage Guidance Protocol Matrix */}
            {stageData?.stage_guidance && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-[#08120E] border border-[#1B382D] space-y-1.5">
                  <div className="flex items-center gap-2 text-teal-400 font-bold text-xs">
                    <Droplets className="w-4 h-4" />
                    <span>Irrigation Protocol</span>
                  </div>
                  <p className="text-[#8FA59B] text-xs leading-relaxed">
                    {stageData.stage_guidance.irrigation}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#08120E] border border-[#1B382D] space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <Sprout className="w-4 h-4" />
                    <span>Nutrition & NPK Protocol</span>
                  </div>
                  <p className="text-[#8FA59B] text-xs leading-relaxed">
                    {stageData.stage_guidance.npk}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#08120E] border border-[#1B382D] space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Pest / Disease Watch</span>
                  </div>
                  <p className="text-[#8FA59B] text-xs leading-relaxed">
                    {stageData.stage_guidance.disease_risks}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Standard 8-Stage Lifecycle Timeline */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-heading text-[#F3F7F5] flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-400" />
                  <span>8-Stage Phenological Growth Progression</span>
                </h3>
                <p className="text-xs text-[#8FA59B]">Click on any milestone to manually synchronize the farm's active growth stage.</p>
              </div>

              <button
                onClick={() => setStageModalOpen(true)}
                className="text-xs text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" /> Synchronize Stage
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {stageData?.all_stages?.map((stg) => {
                const isDone = stg.is_completed;
                const isCurrent = stg.is_current;

                return (
                  <div
                    key={stg.stage_index}
                    onClick={() => {
                      setSelectedNewStage(stg.stage_name);
                      setStageModalOpen(true);
                    }}
                    className={`os-card p-4 transition-all space-y-3 flex flex-col justify-between cursor-pointer ${
                      isCurrent
                        ? 'border-emerald-400 bg-[#122820] ring-1 ring-emerald-400'
                        : isDone
                        ? 'border-[#1B382D] bg-[#0A1612] opacity-90'
                        : 'border-[#1B382D]/60 bg-[#08120E] opacity-60 hover:opacity-100 hover:border-emerald-500/40'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-[#8FA59B]">
                          Stage {stg.stage_index}: Days {stg.start_day}-{stg.end_day}
                        </span>
                        {isCurrent ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-black text-[9px] font-bold">
                            Active
                          </span>
                        ) : isDone ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1 text-[10px]">
                            <CheckCircle2 className="w-3 h-3" /> Completed
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px]">Upcoming</span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-[#F3F7F5]">{stg.stage_name}</h4>
                      <p className="text-[11px] text-[#8FA59B] leading-snug">{stg.key_focus}</p>
                    </div>

                    <div className="pt-2 border-t border-[#1B382D] flex items-center justify-between text-[10px] text-[#8FA59B]">
                      <span>Duration: ~{stg.duration_days} days</span>
                      <span className="text-emerald-400 font-bold">Set Active →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Farm Activity History Log */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-heading text-[#F3F7F5] flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-emerald-400" />
                  <span>Field Activity Log ({activities.length})</span>
                </h3>
                <p className="text-xs text-[#8FA59B]">
                  Records farm plan completions, manual operations, inputs applied, and crop stage changes.
                </p>
              </div>

              <button
                onClick={() => setModalOpen(true)}
                className="os-btn-secondary text-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log New Operation</span>
              </button>
            </div>

            {activities.length === 0 ? (
              <div className="os-card p-14 text-center space-y-2">
                <Calendar className="w-8 h-8 text-[#8FA59B] mx-auto opacity-50" />
                <p className="font-bold text-xs text-[#F3F7F5]">No field activities logged yet.</p>
                <p className="text-[11px] text-[#8FA59B]">Click "Log Field Activity" or check off tasks in Today's Farm Plan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activities.map((ev) => (
                  <div
                    key={ev.id}
                    className="os-card p-4 space-y-3 flex flex-col justify-between text-xs"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                          {ev.event_type}
                        </span>
                        <span className="text-[10px] text-[#8FA59B] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {ev.event_date}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-[#F3F7F5]">{ev.title}</h4>
                      {ev.description && (
                        <p className="text-[#8FA59B] text-[11px] leading-relaxed">{ev.description}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#1B382D] text-[10px] text-[#8FA59B]">
                      <span>Stage: <strong className="text-slate-300">{ev.stage || 'General'}</strong></span>
                      {ev.cost > 0 && <span className="font-bold text-amber-400">Cost: ₹{ev.cost}</span>}
                      <button
                        onClick={() => handleDeleteEvent(ev.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                        title="Delete log record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Stage Adjustment Modal */}
      <AnimatePresence>
        {stageModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0E1E18] border border-[#1B382D] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[#1B382D] pb-3">
                <div>
                  <h3 className="font-bold font-heading text-[#F3F7F5] text-base">Adjust Crop Growth Stage</h3>
                  <p className="text-[11px] text-[#8FA59B]">
                    Synchronize platform AI models with actual field conditions
                  </p>
                </div>
                <button
                  onClick={() => setStageModalOpen(false)}
                  className="text-[#8FA59B] hover:text-white font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateStage} className="space-y-4 text-xs">
                <div>
                  <label className="text-[#8FA59B] font-bold block mb-1.5">
                    Select Ground Stage for {activeFarm?.name}:
                  </label>
                  <select
                    value={selectedNewStage}
                    onChange={(e) => setSelectedNewStage(e.target.value)}
                    className="os-input w-full py-2.5 text-xs font-bold text-white cursor-pointer"
                  >
                    {stageData?.all_stages?.map((stg) => (
                      <option key={stg.stage_index} value={stg.stage_name} className="bg-[#0E1E18]">
                        Stage {stg.stage_index}: {stg.stage_name} (Days {stg.start_day}-{stg.end_day})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-[#08120E] border border-[#1B382D] text-[11px] text-[#8FA59B] leading-relaxed">
                  💡 <strong>Impact:</strong> Changing stage automatically updates your daily irrigation dosing, NPK requirements, pest vulnerability radar, and farm plan tasks.
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setStageModalOpen(false)}
                    className="os-btn-secondary flex-1 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingStage}
                    className="os-btn-primary flex-1 text-xs"
                  >
                    {updatingStage ? 'Updating...' : 'Set Active Stage'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Log Activity Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0E1E18] border border-[#1B382D] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[#1B382D] pb-3">
                <div>
                  <h3 className="font-bold font-heading text-[#F3F7F5] text-base">Record Field Operation</h3>
                  <p className="text-[11px] text-[#8FA59B]">Log activities into your farm journal</p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-[#8FA59B] hover:text-white font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-3.5 text-xs">
                <div>
                  <label className="text-[#8FA59B] font-bold block mb-1">Activity Type</label>
                  <select
                    value={formData.event_type}
                    onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                    className="os-input w-full py-2 text-xs cursor-pointer"
                  >
                    {eventTypes.map((t) => (
                      <option key={t.val} value={t.val} className="bg-[#0E1E18]">{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[#8FA59B] font-bold block mb-1">Activity Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Applied 25kg NPK 19:19:19"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="os-input w-full py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="text-[#8FA59B] font-bold block mb-1">Notes / Observations</label>
                  <textarea
                    rows={2}
                    placeholder="Dosage, weather observations, or labor notes..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="os-input w-full py-2 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#8FA59B] font-bold block mb-1">Date</label>
                    <input
                      type="date"
                      value={formData.event_date}
                      onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                      className="os-input w-full py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[#8FA59B] font-bold block mb-1">Cost (₹ Optional)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      className="os-input w-full py-2 text-xs"
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="os-btn-secondary flex-1 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="os-btn-primary flex-1 text-xs"
                  >
                    {submitting ? 'Saving...' : 'Save Activity'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
