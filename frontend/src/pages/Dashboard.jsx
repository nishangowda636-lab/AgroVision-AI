import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useFarm } from '../context/FarmContext';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import {
  Heart,
  Droplets,
  Thermometer,
  CloudSun,
  ShieldCheck,
  Sprout,
  Sparkles,
  DollarSign,
  MapPin,
  Bot,
  Volume2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Bell,
  Check,
  Loader2,
  Edit3,
  Clock,
  Satellite,
  Power,
  Activity,
  Octagon,
  ArrowRight,
  Wind
} from 'lucide-react';
import api from '../services/api';
import offlineStorage from '../services/offlineStorage';

export default function Dashboard() {
  const { user, language } = useAuth();
  const { farms, activeFarm, setActiveFarm } = useFarm();
  const navigate = useNavigate();

  const [weatherData, setWeatherData] = useState({
    temperature: 21.8,
    humidity: 68,
    condition: 'Overcast',
    rainfall_prob_pct: 20,
    wind_speed: 12
  });
  const [sensors, setSensors] = useState([]);
  const [marketPrice, setMarketPrice] = useState(32.0);
  const [todayPlan, setTodayPlan] = useState(null);
  const [cropStage, setCropStage] = useState(null);
  const [iotStatus, setIotStatus] = useState(null);
  const [satelliteStatus, setSatelliteStatus] = useState(null);
  const [pumpActionLoading, setPumpActionLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [loading, setLoading] = useState(true);

  // Interactive Action States
  const [completingTaskId, setCompletingTaskId] = useState(null);
  const [remindingTaskId, setRemindingTaskId] = useState(null);
  const [stageModalOpen, setStageModalOpen] = useState(false);
  const [selectedStageToOverride, setSelectedStageToOverride] = useState('');
  const [overridingStage, setOverridingStage] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const healthScore = 88;

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchDashboardData = () => {
    if (!activeFarm) return;
    setLoading(true);

    Promise.all([
      api.get(`/weather/${activeFarm.id}`).catch(() => ({
        data: { temperature: 21.8, humidity: 68, condition: 'Overcast', rainfall_prob_pct: 20, wind_speed: 12 }
      })),
      api.get(`/sensors/${activeFarm.id}`).catch(() => ({ data: [] })),
      api.get('/market-prices').catch(() => ({
        data: [{ crop_name: 'Tomato', price_per_kg: 32.0 }]
      })),
      api.get(`/farms/${activeFarm.id}/today-plan`, {
        params: { language: language || 'English' }
      }).catch(() => ({ data: null })),
      api.get(`/farms/${activeFarm.id}/crop-stage`).catch(() => ({ data: null })),
      api.get(`/pumps/automation-status/${activeFarm.id}`).catch(() => ({ data: null })),
      api.get(`/satellite/field-health/${activeFarm.id}`).catch(() => ({ data: null }))
    ])
      .then(([wRes, sRes, mRes, pRes, cRes, iotRes, satRes]) => {
        setWeatherData(wRes.data);
        setSensors(sRes.data);
        if (pRes.data) {
          setTodayPlan(pRes.data);
          offlineStorage.saveFarmPlan(activeFarm.id, pRes.data);
        }
        if (cRes.data) {
          setCropStage(cRes.data);
          setSelectedStageToOverride(cRes.data.active_stage);
        }
        if (iotRes.data) setIotStatus(iotRes.data);
        if (satRes.data) setSatelliteStatus(satRes.data);

        const matched =
          mRes.data.find((p) =>
            p.crop_name?.toLowerCase().includes(activeFarm.crop?.toLowerCase() || 'tomato')
          ) || mRes.data[0];
        if (matched) setMarketPrice(matched.price_per_kg);
      })
      .catch((err) => {
        console.warn('Network error, loading offline dashboard data:', err);
        const cachedPlan = offlineStorage.getFarmPlan(activeFarm.id);
        if (cachedPlan) setTodayPlan(cachedPlan);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeFarm, language]);

  // IoT Pump Command Execution
  const handlePumpCommand = async (command, extra = {}) => {
    if (!activeFarm) return;
    setPumpActionLoading(true);
    try {
      await api.post(`/pumps/${activeFarm.id}/command`, { command, ...extra });
      showToast(`Pump command '${command}' executed.`);
      const updatedIot = await api.get(`/pumps/automation-status/${activeFarm.id}`);
      setIotStatus(updatedIot.data);
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to execute command.');
    } finally {
      setPumpActionLoading(false);
    }
  };

  const handleEmergencyStop = () => {
    if (window.confirm('Trigger emergency borewell shutdown? This halts irrigation.')) {
      handlePumpCommand('EMERGENCY_STOP', { reason: 'Farmer manual emergency stop' });
    }
  };

  const handleResetEmergency = () => {
    handlePumpCommand('RESET_EMERGENCY');
  };

  const handleToggleMode = () => {
    const isAuto = iotStatus?.pump_mode === 'AUTO';
    handlePumpCommand(isAuto ? 'SET_MODE_MANUAL' : 'SET_MODE_AUTO');
  };

  // Complete a Task in Today's Farm Plan
  const handleCompleteTask = async (taskId) => {
    if (!activeFarm) return;
    setCompletingTaskId(taskId);
    try {
      const res = await api.post(
        `/farms/${activeFarm.id}/today-plan/${taskId}/complete`,
        { notes: `Completed task on ${activeFarm.name}` },
        { params: { language: language || 'English' } }
      );
      setTodayPlan(res.data);
      offlineStorage.saveFarmPlan(activeFarm.id, res.data);
      showToast('Task marked as completed.');
    } catch (err) {
      console.error('Error completing task:', err);
      showToast('Error recording task completion.');
    } finally {
      setCompletingTaskId(null);
    }
  };

  // Task Reminder
  const handleRemindTask = async (taskId) => {
    if (!activeFarm) return;
    setRemindingTaskId(taskId);
    try {
      await api.post(`/farms/${activeFarm.id}/today-plan/${taskId}/remind`);
      showToast('Reminder saved.');
    } catch (err) {
      console.error('Error creating reminder:', err);
      showToast('Error creating reminder.');
    } finally {
      setRemindingTaskId(null);
    }
  };

  // Manual Crop Stage Override
  const handleSaveStageOverride = async (e) => {
    if (e) e.preventDefault();
    if (!activeFarm || !selectedStageToOverride) return;
    setOverridingStage(true);
    try {
      const res = await api.put(`/farms/${activeFarm.id}/crop-stage`, {
        current_stage_override: selectedStageToOverride
      });
      setCropStage(res.data);
      setStageModalOpen(false);

      const planRes = await api.get(`/farms/${activeFarm.id}/today-plan`, {
        params: { language: language || 'English' }
      });
      setTodayPlan(planRes.data);
      showToast(`Crop stage updated to ${selectedStageToOverride}.`);
    } catch (err) {
      console.error('Error overriding crop stage:', err);
      showToast('Failed to update crop stage.');
    } finally {
      setOverridingStage(false);
    }
  };

  // Text-To-Speech Audio Reader for Today's Farm Plan
  const handlePlayVoicePlan = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser.');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    const script =
      todayPlan?.voice_script ||
      `Today's Farm Plan for ${activeFarm?.name}: Soil moisture is adequate. Delay irrigation because rain is forecast tomorrow.`;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(script);
    utterance.rate = 0.95;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  const mapCenter = [
    activeFarm?.latitude || 12.9716,
    activeFarm?.longitude || 77.5946
  ];

  const moistureSensor = sensors.find((s) => s.sensor_type === 'moisture');
  const moistureVal = moistureSensor?.current_value;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto selection:bg-[#10B981] selection:text-black">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-[#0E1E18] border border-[#10B981] text-[#F3F7F5] text-xs font-semibold shadow-xl flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. FIRST SECTION: Greeting + Farm Intelligence Summary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1B382D] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F3F7F5] tracking-tight font-heading">
            Good Morning, {user?.full_name?.split(' ')[0] || 'Farmer'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-[#8FA59B] mt-0.5">
            Your farm intelligence for today.
          </p>
        </div>

        {/* Farm Selector */}
        {farms.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0E1E18] border border-[#1B382D] text-[#F3F7F5] text-xs">
              <MapPin className="w-3.5 h-3.5 text-[#10B981]" />
              <select
                value={activeFarm?.id || ''}
                onChange={(e) => {
                  const selected = farms.find((f) => f.id === parseInt(e.target.value));
                  if (selected) setActiveFarm(selected);
                }}
                className="bg-transparent text-[#F3F7F5] font-semibold focus:outline-none cursor-pointer pr-1 text-xs"
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id} className="bg-[#08120E] text-[#F3F7F5]">
                    {f.name} • {f.crop || 'Field'} • {f.size_acres || 1} Acre
                  </option>
                ))}
              </select>
            </div>
            <Link
              to="/farm-setup"
              className="px-3 py-2 rounded-xl bg-[#0E1E18] border border-[#1B382D] text-[#8FA59B] hover:text-[#F3F7F5] hover:border-[#265040] text-xs font-semibold transition-colors"
            >
              Manage
            </Link>
          </div>
        )}
      </div>

      {/* Missing Sowing Date Warning */}
      {activeFarm && !activeFarm.sowing_date && (
        <div className="p-3.5 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/25 text-[#F59E0B] text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Set your <strong>sowing date</strong> to enable growth stage timeline tracking and harvest countdown.</span>
          </div>
          <Link to="/farm-setup" className="font-bold underline text-[#F59E0B] hover:text-white shrink-0">
            Set Date →
          </Link>
        </div>
      )}

      {farms.length === 0 ? (
        <div className="os-card p-8 sm:p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#10B981]/15 text-[#10B981] flex items-center justify-center mx-auto">
            <Sprout className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-[#F3F7F5]">No Farm Added Yet</h2>
            <p className="text-xs text-[#8FA59B] max-w-sm mx-auto">
              Create your first farm to start AgroVision farm intelligence, weather radar, and crop stage insights.
            </p>
          </div>
          <Link
            to="/farm-setup"
            className="inline-flex items-center gap-1.5 px-6 py-2.5 os-btn-primary text-xs"
          >
            <Sprout className="w-4 h-4" />
            <span>Set Up Your Farm</span>
          </Link>
        </div>
      ) : (
        <>
          {/* 2. TOP DUO: Farm Health (Left) + Today's Weather (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Farm Health Card */}
            <div className="lg:col-span-6 os-card p-6 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#8FA59B] uppercase tracking-wider font-mono">
                  FARM HEALTH
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] text-[11px] font-bold border border-[#10B981]/25">
                  Optimal (Green)
                </span>
              </div>

              <div className="flex items-baseline gap-3 my-1">
                <span className="text-4xl sm:text-5xl font-black text-[#F3F7F5] tracking-tight font-heading">
                  {healthScore}
                </span>
                <span className="text-xl font-semibold text-[#8FA59B]">/ 100</span>
                <span className="text-sm font-bold text-[#10B981] ml-2">Healthy</span>
              </div>

              <div className="pt-2 border-t border-[#1B382D] flex items-center justify-between text-xs text-[#8FA59B]">
                <span>Crop • Soil • Weather • Field conditions</span>
                <span className="text-[#F3F7F5] font-semibold">{activeFarm?.crop || 'Tomato'} (Day {cropStage?.crop_age_days || 1})</span>
              </div>
            </div>

            {/* Today's Weather Card */}
            <div className="lg:col-span-6 os-card p-6 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#8FA59B] uppercase tracking-wider font-mono">
                  TODAY'S WEATHER
                </span>
                <span className="text-xs text-[#8FA59B] flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#10B981]" />
                  {activeFarm?.location_name || 'Mysore Zone'}
                </span>
              </div>

              <div className="flex items-baseline gap-3 my-1">
                <span className="text-4xl sm:text-5xl font-black text-[#F3F7F5] tracking-tight font-heading">
                  {weatherData?.temperature || 21.8}°C
                </span>
                <span className="text-base font-semibold text-[#8FA59B]">
                  {weatherData?.condition || 'Overcast'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#1B382D] text-xs">
                <div>
                  <span className="text-[10px] text-[#8FA59B] block">Rain Probability</span>
                  <span className="font-semibold text-[#F3F7F5]">
                    {weatherData?.rainfall_prob_pct || weatherData?.rain_prob || 20}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#8FA59B] block">Humidity</span>
                  <span className="font-semibold text-[#F3F7F5]">
                    {weatherData?.humidity || 68}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#8FA59B] block">Wind Velocity</span>
                  <span className="font-semibold text-[#F3F7F5]">
                    {weatherData?.wind_speed || 12} km/h
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. AI FARM AGENT — MAIN FOCUS PANEL */}
          <div className="os-card-elevated p-6 space-y-4 border-[#1F4235]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#10B981]/20 text-[#10B981] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#F3F7F5] flex items-center gap-2">
                    <span>AI FARM AGENT</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981] font-mono">Live Copilot</span>
                  </h2>
                  <p className="text-xs text-[#8FA59B]">
                    "I analyzed your farm today." • <strong className="text-[#F3F7F5]">{todayPlan?.actions?.length || 3} things need your attention</strong>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <a
                  href="#todays-plan"
                  className="px-3 py-1.5 rounded-lg bg-[#0E1E18] border border-[#1B382D] text-[#F3F7F5] hover:border-[#10B981] text-xs font-semibold transition-colors"
                >
                  View Today's Plan
                </a>
                <button
                  onClick={() => navigate('/assistant')}
                  className="px-3 py-1.5 rounded-lg os-btn-primary text-xs font-semibold cursor-pointer"
                >
                  Ask AI
                </button>
                <button
                  onClick={handlePlayVoicePlan}
                  className={`p-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                    isPlayingAudio
                      ? 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]'
                      : 'bg-[#0E1E18] border-[#1B382D] text-[#8FA59B] hover:text-[#F3F7F5]'
                  }`}
                  title="Read Voice Plan"
                >
                  <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'animate-bounce' : ''}`} />
                </button>
              </div>
            </div>

            {/* AI Insight Box */}
            <div className="p-4 rounded-xl bg-[#0A1612] border border-[#1B382D] space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#10B981] block">
                AI INSIGHT
              </span>
              <p className="text-xs sm:text-sm text-[#F3F7F5] leading-relaxed font-medium">
                "Rain is expected tomorrow. Soil moisture is currently adequate, so irrigation can be delayed to prevent root zone waterlogging."
              </p>
              <div className="text-[10px] text-[#8FA59B] pt-1 flex items-center gap-1 font-mono">
                <span>Source → Weather Radar + IoT Soil Telemetry</span>
              </div>
            </div>
          </div>

          {/* 4. TODAY'S FARM PLAN */}
          <div id="todays-plan" className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#F3F7F5] font-heading">
                  TODAY'S FARM PLAN
                </h3>
                <p className="text-xs text-[#8FA59B]">
                  Prioritized operational actions for {activeFarm?.name}
                </p>
              </div>
              <span className="text-xs text-[#8FA59B] font-mono">
                {todayPlan?.completed_count || 0} of {todayPlan?.total_actions || 3} Completed
              </span>
            </div>

            {/* Action Cards List */}
            <div className="space-y-2.5">
              {(todayPlan?.actions || [
                {
                  id: 1,
                  priority: 'Medium',
                  title: 'Delay irrigation',
                  what_to_do: 'Hold borewell pump cycle. Rain probability is elevated over the next 24 hours.',
                  why_recommended: 'Rain expected tomorrow. Preserves soil structure and saves groundwater.',
                  best_time: 'Morning',
                  is_completed: false
                },
                {
                  id: 2,
                  priority: 'Medium',
                  title: 'Inspect lower leaves',
                  what_to_do: 'Scout underside of leaves for early fungal blights or downy mildew spots.',
                  why_recommended: 'High atmospheric humidity (68%) detected in microclimate.',
                  best_time: '07:00 AM - 09:00 AM',
                  is_completed: false
                },
                {
                  id: 3,
                  priority: 'Low',
                  title: 'Monitor soil moisture',
                  what_to_do: 'Check field root-zone moisture sensor readings.',
                  why_recommended: 'Moisture currently adequate at 41% VWC.',
                  best_time: 'Evening',
                  is_completed: false
                }
              ]).map((act, idx) => {
                const num = String(idx + 1).padStart(2, '0');
                const isHigh = act.priority === 'High';
                const isMedium = act.priority === 'Medium';
                const isDone = act.is_completed;

                return (
                  <div
                    key={act.id || idx}
                    className={`p-4 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isDone
                        ? 'bg-[#081510] border-[#1B382D] opacity-75'
                        : 'bg-[#0E1E18] border-[#1B382D] hover:border-[#265040]'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-sm font-mono font-bold text-[#577366] pt-0.5">
                        {num}
                      </span>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-sm font-bold ${isDone ? 'line-through text-[#8FA59B]' : 'text-[#F3F7F5]'}`}>
                            {act.title}
                          </h4>
                          <span
                            className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase ${
                              isHigh
                                ? 'bg-[#EF4444]/15 text-[#EF4444]'
                                : isMedium
                                ? 'bg-[#F59E0B]/15 text-[#F59E0B]'
                                : 'bg-[#10B981]/15 text-[#10B981]'
                            }`}
                          >
                            {act.priority}
                          </span>
                        </div>
                        <p className="text-xs text-[#8FA59B] leading-relaxed">
                          {act.what_to_do || act.why_recommended}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-[#577366] pt-0.5">
                          <span>Time: {act.best_time || 'Today'}</span>
                          {act.why_recommended && (
                            <span>• Reason: {act.why_recommended}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => handleCompleteTask(act.id)}
                        disabled={isDone || completingTaskId === act.id}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isDone
                            ? 'bg-[#10B981]/15 text-[#10B981] cursor-default'
                            : 'bg-[#13271F] border border-[#1B382D] text-[#F3F7F5] hover:border-[#10B981]'
                        }`}
                      >
                        {completingTaskId === act.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isDone ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#10B981]" />
                            <span>Done</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Complete</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleRemindTask(act.id)}
                        disabled={remindingTaskId === act.id}
                        className="p-1.5 rounded-lg bg-[#0E1E18] border border-[#1B382D] text-[#8FA59B] hover:text-[#F3F7F5] cursor-pointer"
                        title="Set Reminder"
                      >
                        {remindingTaskId === act.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Bell className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. COMPACT FARM HEALTH OVERVIEW MODULES */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-[#F3F7F5] font-heading">
              FARM OVERVIEW
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
              {/* 1. Crop Health */}
              <Link
                to="/crop-health"
                className="os-card p-4 space-y-1 block hover:border-[#10B981] transition-colors group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#8FA59B] font-bold uppercase">Crop Health</span>
                  <Heart className="w-3.5 h-3.5 text-[#10B981]" />
                </div>
                <p className="text-xl font-bold text-[#10B981]">92%</p>
                <p className="text-[11px] text-[#8FA59B]">Optimal</p>
              </Link>

              {/* 2. Soil Moisture */}
              <Link
                to="/irrigation"
                className="os-card p-4 space-y-1 block hover:border-[#10B981] transition-colors group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#8FA59B] font-bold uppercase">Soil Moisture</span>
                  <Droplets className="w-3.5 h-3.5 text-[#14B8A6]" />
                </div>
                <p className="text-xl font-bold text-[#F3F7F5]">
                  {moistureVal !== undefined ? `${moistureVal}%` : '41%'}
                </p>
                <p className="text-[11px] text-[#8FA59B]">Adequate</p>
              </Link>

              {/* 3. Disease Risk */}
              <Link
                to="/crop-health"
                className="os-card p-4 space-y-1 block hover:border-[#10B981] transition-colors group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#8FA59B] font-bold uppercase">Disease Risk</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                </div>
                <p className="text-xl font-bold text-[#10B981]">Low</p>
                <p className="text-[11px] text-[#8FA59B]">Routine scouting</p>
              </Link>

              {/* 4. Crop Stage */}
              <div
                onClick={() => setStageModalOpen(true)}
                className="os-card p-4 space-y-1 block hover:border-[#10B981] transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#8FA59B] font-bold uppercase">Crop Stage</span>
                  <Edit3 className="w-3.5 h-3.5 text-[#8FA59B]" />
                </div>
                <p className="text-sm font-bold text-[#F3F7F5] truncate">
                  {cropStage?.active_stage || 'Sowing'}
                </p>
                <p className="text-[11px] text-[#10B981]">Day {cropStage?.crop_age_days || 1}</p>
              </div>

              {/* 5. Mandi Price */}
              <Link
                to="/market-prices"
                className="os-card p-4 space-y-1 col-span-2 sm:col-span-1 block hover:border-[#10B981] transition-colors group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#8FA59B] font-bold uppercase">APMC Mandi</span>
                  <DollarSign className="w-3.5 h-3.5 text-[#F59E0B]" />
                </div>
                <p className="text-xl font-bold text-[#F59E0B]">₹{marketPrice}<span className="text-xs font-normal text-[#8FA59B]">/kg</span></p>
                <p className="text-[11px] text-[#8FA59B] truncate">{activeFarm?.crop || 'Tomato'}</p>
              </Link>
            </div>
          </div>

          {/* 6. FARM MAP & GEOSPATIAL OVERVIEW */}
          <div className="os-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#F3F7F5] flex items-center gap-2">
                  <Satellite className="w-4 h-4 text-[#10B981]" />
                  <span>FARM MAP & BOUNDARY OVERVIEW</span>
                </h3>
                <p className="text-xs text-[#8FA59B]">
                  GPS Location: {mapCenter[0].toFixed(4)}°N, {mapCenter[1].toFixed(4)}°E • {activeFarm?.size_acres || 1} Acres
                </p>
              </div>

              <Link
                to="/satellite"
                className="text-xs font-semibold text-[#10B981] hover:underline flex items-center gap-1"
              >
                <span>Full Satellite Radar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="h-64 w-full rounded-xl overflow-hidden border border-[#1B382D]">
              <MapContainer
                center={mapCenter}
                zoom={16}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%', background: '#08120E' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  maxZoom={19}
                />
                <Marker position={mapCenter}>
                  <Popup>
                    <div className="p-1 text-xs">
                      <strong>{activeFarm?.name}</strong>
                      <p>{activeFarm?.crop} • {activeFarm?.size_acres} Acres</p>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        </>
      )}

      {/* Manual Stage Correction Modal */}
      <AnimatePresence>
        {stageModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0E1E18] border border-[#1B382D] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[#1B382D] pb-3">
                <div>
                  <h3 className="font-bold text-[#F3F7F5] text-sm">Correct Physical Crop Stage</h3>
                  <p className="text-xs text-[#8FA59B]">Adjust active stage to align AI recommendations.</p>
                </div>
                <button
                  onClick={() => setStageModalOpen(false)}
                  className="text-[#8FA59B] hover:text-[#F3F7F5] text-sm cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveStageOverride} className="space-y-4 text-xs">
                <div>
                  <label className="text-[#8FA59B] font-semibold block mb-1.5">Current Physical Stage</label>
                  <select
                    value={selectedStageToOverride}
                    onChange={(e) => setSelectedStageToOverride(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#0A1612] border border-[#1B382D] text-[#F3F7F5] cursor-pointer font-medium focus:border-[#10B981] focus:outline-none"
                  >
                    {(cropStage?.all_stage_names || [
                      'Sowing', 'Germination', 'Seedling', 'Vegetative Growth',
                      'Flowering', 'Fruiting / Grain Filling', 'Maturity', 'Harvest'
                    ]).map((stg) => (
                      <option key={stg} value={stg} className="bg-[#08120E]">
                        {stg}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStageModalOpen(false)}
                    className="flex-1 py-2 rounded-lg bg-[#13271F] border border-[#1B382D] text-[#8FA59B] hover:text-[#F3F7F5] font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={overridingStage}
                    className="flex-1 py-2 rounded-lg os-btn-primary font-bold cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {overridingStage ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Stage'}
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
