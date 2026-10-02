import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useFarm } from '../context/FarmContext';
import { useAuth } from '../context/AuthContext';
import {
  Sprout,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Clock,
  Lightbulb,
  ShieldAlert,
  MapPin,
  RefreshCw,
  Loader2,
  ArrowRight,
  PlusCircle,
  History,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
  Info,
  Droplets,
  CloudRain,
  Sun,
  CloudSun,
  Sliders,
  Cpu,
  Award,
  FlaskConical,
  HelpCircle,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

const POPULAR_CROPS = [
  'Tomato',
  'Potato',
  'Rice',
  'Wheat',
  'Sugarcane',
  'Maize',
  'Cotton',
  'Groundnut',
  'Gram',
  'Onion',
  'Mustard',
  'Soyabean',
  'Banana',
  'Chilli',
  'Brinjal',
  'Cabbage',
  'Barley',
  'Jowar',
  'Bajra',
  'Moong(Green Gram)',
  'Urad',
  'Arhar/Tur',
  'Sunflower',
  'Sesamum',
  'Coffee'
];

const CROP_STAGES = [
  'Initial / Seedling',
  'Vegetative Growth',
  'Flowering / Tillering',
  'Fruiting / Grain Filling',
  'Maturation / Harvest'
];

const SOIL_TYPES = [
  'Loam',
  'Red Sandy Loam',
  'Black Cotton Soil',
  'Alluvial',
  'Laterite'
];

export default function FertilizerPage() {
  const { farms, activeFarm, setActiveFarm } = useFarm();
  const { user } = useAuth();

  // Agronomic Inputs
  const [selectedCrop, setSelectedCrop] = useState(activeFarm?.crop || 'Tomato');
  const [cropStage, setCropStage] = useState(activeFarm?.current_stage_override || 'Vegetative Growth');
  const [soilType, setSoilType] = useState(activeFarm?.soil_type || 'Loam');
  const [nitrogen, setNitrogen] = useState(activeFarm?.nitrogen !== undefined && activeFarm?.nitrogen !== null ? activeFarm.nitrogen : '');
  const [phosphorus, setPhosphorus] = useState(activeFarm?.phosphorus !== undefined && activeFarm?.phosphorus !== null ? activeFarm.phosphorus : '');
  const [potassium, setPotassium] = useState(activeFarm?.potassium !== undefined && activeFarm?.potassium !== null ? activeFarm.potassium : '');
  const [soilPh, setSoilPh] = useState(activeFarm?.soil_ph !== undefined && activeFarm?.soil_ph !== null ? activeFarm.soil_ph : '6.5');
  const [areaAcres, setAreaAcres] = useState(activeFarm?.size_acres || 2.0);
  const [prevFertilizer, setPrevFertilizer] = useState('');

  // Weather Telemetry
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Recommendation Output State
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);

  // Application History & Modal State
  const [history, setHistory] = useState([]);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [submittingApp, setSubmittingApp] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Modal Fields
  const [formProduct, setFormProduct] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formQuantity, setFormQuantity] = useState('');
  const [formUnit, setFormUnit] = useState('kg');
  const [formArea, setFormArea] = useState('');
  const [formStage, setFormStage] = useState('');
  const [formNutrient, setFormNutrient] = useState('Nitrogen');
  const [formMethod, setFormMethod] = useState('Fertigation / Drip');
  const [formNotes, setFormNotes] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  useEffect(() => {
    if (activeFarm) {
      const crop = activeFarm.crop || 'Tomato';
      const area = activeFarm.size_acres || 1.0;
      const soil = activeFarm.soil_type || 'Loam';
      const stage = activeFarm.current_stage_override || 'Vegetative Growth';
      const n = activeFarm.nitrogen !== undefined && activeFarm.nitrogen !== null ? activeFarm.nitrogen : '';
      const p = activeFarm.phosphorus !== undefined && activeFarm.phosphorus !== null ? activeFarm.phosphorus : '';
      const k = activeFarm.potassium !== undefined && activeFarm.potassium !== null ? activeFarm.potassium : '';
      const ph = activeFarm.soil_ph !== undefined && activeFarm.soil_ph !== null ? activeFarm.soil_ph : '6.5';

      setSelectedCrop(crop);
      setAreaAcres(area);
      setSoilType(soil);
      setCropStage(stage);
      setNitrogen(n);
      setPhosphorus(p);
      setPotassium(k);
      setSoilPh(ph);
      setFormArea(area);
      setFormStage(stage);

      fetchLiveWeather(activeFarm);
      fetchHistory(activeFarm.id);
      handleGetRecommendation(activeFarm, { crop, area, soil, stage, n, p, k, ph });
    }
  }, [activeFarm?.id]);

  useEffect(() => {
    api.get('/fertilizer-recommendation/model-info')
      .then((res) => setModelInfo(res.data))
      .catch((err) => console.log('Fertilizer model info notice:', err));
  }, []);

  const fetchLiveWeather = (farm) => {
    if (!farm) return;
    setWeatherLoading(true);
    api.get(`/weather/${farm.id}`)
      .then((res) => {
        setWeather({
          temperature: res.data.temperature ?? 28.0,
          humidity: res.data.humidity ?? 65.0,
          rainfall_mm: res.data.rainfall_mm ?? 0.0,
          rain_prob: res.data.rainfall_prob_pct ?? res.data.rain_prob ?? 10.0,
          condition: res.data.condition || 'Clear'
        });
      })
      .catch(() => {
        setWeather({
          temperature: 28.0,
          humidity: 60.0,
          rainfall_mm: 0.0,
          rain_prob: 10.0,
          condition: 'Clear'
        });
      })
      .finally(() => setWeatherLoading(false));
  };

  const fetchHistory = (farmId) => {
    api.get(`/fertilizer/applications/${farmId}`)
      .then((res) => setHistory(res.data || []))
      .catch(() => setHistory([]));
  };

  const handleGetRecommendation = (farmOverride = null, valuesOverride = null) => {
    const targetFarm = farmOverride || activeFarm;
    if (!targetFarm) return;

    setLoading(true);
    setError(null);

    const c = valuesOverride ? valuesOverride.crop : selectedCrop;
    const st = valuesOverride ? valuesOverride.stage : cropStage;
    const s = valuesOverride ? valuesOverride.soil : soilType;
    const n = valuesOverride ? valuesOverride.n : nitrogen;
    const p = valuesOverride ? valuesOverride.p : phosphorus;
    const k = valuesOverride ? valuesOverride.k : potassium;
    const ph = valuesOverride ? valuesOverride.ph : soilPh;
    const a = valuesOverride ? valuesOverride.area : areaAcres;

    const payload = {
      farm_id: targetFarm.id,
      crop: c || targetFarm.crop || 'Tomato',
      crop_stage: st || targetFarm.current_stage_override || 'Vegetative Growth',
      soil_type: s || targetFarm.soil_type || 'Loam',
      nitrogen: n === '' || n === null || n === undefined ? null : parseFloat(n),
      phosphorus: p === '' || p === null || p === undefined ? null : parseFloat(p),
      potassium: k === '' || k === null || k === undefined ? null : parseFloat(k),
      ph: ph === '' || ph === null || ph === undefined ? null : parseFloat(ph),
      temperature: weather?.temperature ?? null,
      humidity: weather?.humidity ?? null,
      rainfall: weather?.rainfall_mm ?? null,
      farm_area: parseFloat(a || targetFarm.size_acres || 1.0),
      previous_fertilizer: prevFertilizer || undefined
    };

    api.post('/fertilizer-recommendation/predict', payload)
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        console.error('Fertilizer prediction error:', err);
        setError(err.response?.data?.detail || 'Unable to generate real fertilizer recommendation.');
      })
      .finally(() => setLoading(false));
  };

  const handleLogApplication = async (e) => {
    e.preventDefault();
    if (!activeFarm || !formProduct || !formQuantity) {
      alert('Please fill in product name and quantity.');
      return;
    }

    setSubmittingApp(true);
    try {
      await api.post('/fertilizer/applications', {
        farm_id: activeFarm.id,
        product_name: formProduct,
        date_applied: formDate,
        quantity: parseFloat(formQuantity),
        unit: formUnit,
        area_applied_acres: parseFloat(formArea || activeFarm.size_acres || 1.0),
        crop: selectedCrop || activeFarm.crop || 'Crop',
        crop_stage: formStage || cropStage || 'Vegetative',
        nutrient_focus: formNutrient,
        application_method: formMethod,
        notes: formNotes
      });

      setIsLogModalOpen(false);
      setFormProduct('');
      setFormQuantity('');
      setFormNotes('');
      showToast(`✓ Logged ${formProduct} in Application History!`);
      fetchHistory(activeFarm.id);
      handleGetRecommendation();
    } catch (err) {
      console.error('Error recording application:', err);
      alert('Failed to save fertilizer application: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSubmittingApp(false);
    }
  };

  const handleDeleteApplication = async (appId) => {
    if (!confirm('Remove this application record?')) return;
    try {
      await api.delete(`/fertilizer/applications/${appId}`);
      showToast('Application record deleted.');
      fetchHistory(activeFarm.id);
    } catch (err) {
      console.error(err);
    }
  };

  if (!activeFarm || farms.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto selection:bg-[#10B981] selection:text-black">
        <div className="os-card p-8 sm:p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 flex items-center justify-center mx-auto shadow-sm">
            <Sprout className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold text-[#F3F7F5]">No Farm Configured Yet</h2>
            <p className="text-xs sm:text-sm text-[#8FA59B] max-w-md mx-auto leading-relaxed">
              Add your farm plot with soil characteristics to receive calibrated N-P-K nutrient dosage schedules and weather-safe application advisories.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/farm-setup"
              className="os-btn-primary px-6 py-2.5 text-xs inline-flex items-center gap-2"
            >
              <Sprout className="w-4 h-4" />
              <span>Configure Farm Coordinates</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const dosageItems = data?.dosage_items || [];
  const warnings = data?.application_warnings || [];
  const isRainDelay = data?.status === 'Delay Application';
  const isMissingSoil = data?.status === 'More Soil Data Required';
  const isAvailable = data?.status === 'Recommendation Available';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto selection:bg-[#10B981] selection:text-black">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 px-4 py-3 rounded-xl bg-[#0E1E18] border border-[#10B981]/50 text-[#10B981] text-xs font-semibold shadow-xl flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Farm Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/20 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span> ICAR Agronomic Benchmark
            </span>
            {modelInfo && (
              <span className="text-[10px] font-medium text-[#8FA59B]">
                {modelInfo.classifier_name} ({(modelInfo.test_accuracy * 100).toFixed(1)}% Benchmark)
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F3F7F5] flex items-center gap-2.5">
            <Sprout className="w-6 h-6 text-[#10B981]" />
            <span>Precision Fertilizer & Nutrient Prescription</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8FA59B] mt-0.5">
            Targeted NPK deficit calculation, stage-specific fertilizer formulations, and weather runoff safety for{' '}
            <strong className="text-[#F3F7F5] font-semibold">{activeFarm?.name}</strong> ({activeFarm?.crop || selectedCrop} • {activeFarm?.size_acres} Acres).
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {farms.length > 1 && (
            <select
              value={activeFarm?.id || ''}
              onChange={(e) => {
                const selected = farms.find((f) => f.id === parseInt(e.target.value));
                if (selected) setActiveFarm(selected);
              }}
              className="os-input text-xs font-semibold px-3 py-2 cursor-pointer bg-[#0E1E18]"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id} className="bg-[#0E1E18]">
                  🌱 {f.name} ({f.crop || 'Crop'} • {f.size_acres} Ac)
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setIsLogModalOpen(true)}
            className="os-btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Log Application</span>
          </button>

          <button
            onClick={() => handleGetRecommendation()}
            disabled={loading}
            className="os-btn-secondary p-2 text-xs flex items-center justify-center cursor-pointer"
            title="Recalculate Recommendation"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Model Benchmark Card */}
      {modelInfo && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="os-card p-3 text-xs flex items-center gap-2.5">
            <Cpu className="w-4 h-4 text-[#10B981] shrink-0" />
            <div>
              <span className="text-[10px] text-[#8FA59B] uppercase font-semibold block">Trained Classifier</span>
              <p className="font-bold text-[#F3F7F5] truncate text-xs">{modelInfo.classifier_name}</p>
            </div>
          </div>

          <div className="os-card p-3 text-xs flex items-center gap-2.5">
            <Award className="w-4 h-4 text-[#14B8A6] shrink-0" />
            <div>
              <span className="text-[10px] text-[#8FA59B] uppercase font-semibold block">Holdout Accuracy</span>
              <p className="font-bold text-[#14B8A6] text-xs">{(modelInfo.test_accuracy * 100).toFixed(2)}%</p>
            </div>
          </div>

          <div className="os-card p-3 text-xs flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-[#10B981] shrink-0" />
            <div>
              <span className="text-[10px] text-[#8FA59B] uppercase font-semibold block">Dataset Size</span>
              <p className="font-bold text-[#F3F7F5] text-xs">{(modelInfo.total_samples || 16000).toLocaleString()} Samples</p>
            </div>
          </div>

          <div className="os-card p-3 text-xs flex items-center gap-2.5">
            <FlaskConical className="w-4 h-4 text-[#14B8A6] shrink-0" />
            <div>
              <span className="text-[10px] text-[#8FA59B] uppercase font-semibold block">Supported Products</span>
              <p className="font-bold text-[#F3F7F5] text-xs">{modelInfo.supported_fertilizers?.length || 11} Formulations</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Parameters & Weather Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column (2 Cols): Farm & Soil Input Parameters */}
        <div className="lg:col-span-2 os-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1B382D] pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#10B981]" />
              <h2 className="text-xs font-bold text-[#F3F7F5] uppercase tracking-wide">Soil Chemistry & Field Parameters</h2>
            </div>
            <span className="text-[11px] text-[#8FA59B]">
              Plot: <strong className="text-[#F3F7F5]">{activeFarm.name}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Crop Selector */}
            <div className="space-y-1">
              <label className="text-[#8FA59B] font-medium block text-[11px]">Target Crop *</label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="os-input font-semibold text-xs cursor-pointer w-full bg-[#08120E]"
              >
                {POPULAR_CROPS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Growth Stage Selector */}
            <div className="space-y-1">
              <label className="text-[#8FA59B] font-medium block text-[11px]">Crop Growth Stage *</label>
              <select
                value={cropStage}
                onChange={(e) => setCropStage(e.target.value)}
                className="os-input font-semibold text-xs cursor-pointer w-full bg-[#08120E]"
              >
                {CROP_STAGES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Soil Type */}
            <div className="space-y-1">
              <label className="text-[#8FA59B] font-medium block text-[11px]">Soil Texture Type *</label>
              <select
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
                className="os-input font-semibold text-xs cursor-pointer w-full bg-[#08120E]"
              >
                {SOIL_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Farm Area */}
            <div className="space-y-1">
              <label className="text-[#8FA59B] font-medium block text-[11px]">Farm Land Area (Acres) *</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={areaAcres}
                onChange={(e) => setAreaAcres(e.target.value)}
                className="os-input font-bold text-xs"
              />
            </div>
          </div>

          {/* Soil NPK & pH Input Row */}
          <div className="p-3.5 rounded-xl bg-[#08120E] border border-[#1B382D] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#F3F7F5] flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5 text-[#10B981]" />
                Soil Laboratory Test Values (kg/ha)
              </span>
              <span className="text-[10px] text-[#8FA59B]">Calibrated for target yield</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="space-y-1">
                <label className="text-[#10B981] font-semibold block text-[11px]">Nitrogen (N)</label>
                <input
                  type="number"
                  step="1"
                  placeholder="e.g. 80"
                  value={nitrogen}
                  onChange={(e) => setNitrogen(e.target.value)}
                  className="os-input font-bold text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#14B8A6] font-semibold block text-[11px]">Phosphorus (P)</label>
                <input
                  type="number"
                  step="1"
                  placeholder="e.g. 40"
                  value={phosphorus}
                  onChange={(e) => setPhosphorus(e.target.value)}
                  className="os-input font-bold text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#38BDF8] font-semibold block text-[11px]">Potassium (K)</label>
                <input
                  type="number"
                  step="1"
                  placeholder="e.g. 40"
                  value={potassium}
                  onChange={(e) => setPotassium(e.target.value)}
                  className="os-input font-bold text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#F59E0B] font-semibold block text-[11px]">Soil pH</label>
                <input
                  type="number"
                  step="0.1"
                  min="3.0"
                  max="10.0"
                  placeholder="6.5"
                  value={soilPh}
                  onChange={(e) => setSoilPh(e.target.value)}
                  className="os-input font-bold text-xs"
                />
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-1">
            <button
              onClick={() => handleGetRecommendation()}
              disabled={loading}
              className="os-btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Computing Targeted Nutrient Plan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Calculate Fertilizer Dosage</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column (1 Col): Live Weather Safety Radar */}
        <div className="os-card p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#1B382D] pb-3">
              <div className="flex items-center gap-2">
                <CloudSun className="w-4 h-4 text-[#10B981]" />
                <h3 className="text-xs font-bold text-[#F3F7F5] uppercase tracking-wide">Weather Runoff Safety Radar</h3>
              </div>
              <span className="text-[10px] text-[#8FA59B]">Live Feed</span>
            </div>

            {weatherLoading ? (
              <div className="py-6 text-center text-[#8FA59B] text-xs flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#10B981]" />
                <span>Syncing satellite radar...</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="p-3 rounded-lg bg-[#08120E] border border-[#1B382D] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-[#F59E0B]" />
                    <div>
                      <span className="text-[10px] text-[#8FA59B] block">Temperature</span>
                      <span className="text-xs font-bold text-[#F3F7F5]">{weather?.temperature ?? 28}°C</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-[#14B8A6]" />
                    <div>
                      <span className="text-[10px] text-[#8FA59B] block">Humidity</span>
                      <span className="text-xs font-bold text-[#F3F7F5]">{weather?.humidity ?? 65}%</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#08120E] border border-[#1B382D] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CloudRain className="w-4 h-4 text-[#38BDF8]" />
                    <div>
                      <span className="text-[10px] text-[#8FA59B] block">Precipitation</span>
                      <span className="text-xs font-bold text-[#F3F7F5]">{weather?.rainfall_mm ?? 0} mm</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#8FA59B] block">Rain Probability</span>
                    <span className="text-xs font-bold text-[#14B8A6]">{weather?.rain_prob ?? 10}%</span>
                  </div>
                </div>

                {/* Weather Application Advisory Interlock */}
                <div
                  className={`p-3 rounded-lg border text-xs space-y-1 ${
                    (weather?.rainfall_mm || 0) >= 5.0
                      ? 'bg-[#EF4444]/5 border-[#EF4444]/30 text-[#EF4444]'
                      : 'bg-[#10B981]/5 border-[#10B981]/30 text-[#10B981]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    {(weather?.rainfall_mm || 0) >= 5.0 ? (
                      <AlertTriangle className="w-4 h-4 text-[#EF4444] shrink-0" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0" />
                    )}
                    <span>
                      {(weather?.rainfall_mm || 0) >= 5.0
                        ? 'High Leaching & Runoff Risk'
                        : 'Weather Safe for Application'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8FA59B] leading-relaxed">
                    {(weather?.rainfall_mm || 0) >= 5.0
                      ? 'Heavy precipitation forecast. Delay chemical fertilizer broadcasting until soil drains.'
                      : 'Optimal temperature and low precipitation window provide ideal nutrient absorption conditions.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 text-[10px] text-[#8FA59B] leading-relaxed border-t border-[#1B382D]">
            <span className="text-[#10B981] font-semibold">Agronomic Note: </span>
            Applying soluble N/P nutrients before heavy precipitation triggers rapid runoff and root zone leaching.
          </div>
        </div>
      </div>

      {/* Duplicate / Recent Application Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w, idx) => (
            <div
              key={idx}
              className="os-card p-4 border-[#F59E0B]/30 bg-[#F59E0B]/5 text-xs text-[#F59E0B] flex items-start gap-2.5"
            >
              <ShieldAlert className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#F59E0B] block">Recent Application Detected:</span>
                <p className="mt-0.5 text-[#8FA59B] leading-relaxed">{w}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="os-card p-4 border-[#EF4444]/30 bg-[#EF4444]/5 text-[#EF4444] text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Advisory Engine Notice:</span>
            <p className="text-[#8FA59B]">{error}</p>
          </div>
        </div>
      )}

      {/* RESULT SECTION */}
      {data && (
        <div className="os-card p-5 sm:p-6 space-y-5">
          {/* Status Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1B382D] pb-5">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#8FA59B] uppercase tracking-wider">
                {data.crop_stage || cropStage} • {data.crop || selectedCrop}
              </span>
              <h2 className="text-lg sm:text-2xl font-bold text-[#F3F7F5]">{data.recommendation}</h2>
              <p className="text-xs text-[#10B981] font-medium">
                Nutrient Focus: {data.nutrient_status}
              </p>
            </div>

            {/* Status Badge */}
            <div>
              {isAvailable && (
                <span className="px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Prescription Ready
                </span>
              )}
              {isMissingSoil && (
                <span className="px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  More Soil Data Required
                </span>
              )}
              {isRainDelay && (
                <span className="px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Delay Application
                </span>
              )}
            </div>
          </div>

          {/* Missing Data Guidance */}
          {isMissingSoil && data.missing_data && data.missing_data.length > 0 && (
            <div className="p-4 rounded-xl bg-[#F59E0B]/5 border border-[#F59E0B]/30 text-xs text-[#F59E0B] space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-[#F59E0B]">
                <Lightbulb className="w-4 h-4" />
                <span>Soil Laboratory Test Data Needed</span>
              </div>
              <p className="text-[#8FA59B] leading-relaxed">
                To prevent over-fertilization or acute nutrient deficiency, our agronomic engine requires actual laboratory soil test values for:{' '}
                <strong className="text-[#F3F7F5]">{data.missing_data.join(', ')}</strong>.
              </p>
            </div>
          )}

          {/* Key Metrics: Dosage Items */}
          {data.quantity > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#F3F7F5] uppercase tracking-wide flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#10B981]" />
                  <span>Recommended Formulations (Total for {data.farm_area || areaAcres || activeFarm?.size_acres} Acres)</span>
                </h3>
                <span className="text-xs text-[#14B8A6] font-medium">
                  {data.confidence ? data.confidence : `Accuracy: ${(data.model_accuracy * 100).toFixed(1)}%`}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {dosageItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#08120E] border border-[#1B382D] space-y-2.5 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-[#F3F7F5]">{item.fertilizer_name}</span>
                        <span className="text-[9px] px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] font-bold uppercase shrink-0">
                          {item.nutrient_category}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between border-b border-[#1B382D] pb-1.5">
                        <span className="text-base font-bold text-[#10B981]">{item.dose_per_acre}</span>
                        <span className="text-xs font-semibold text-[#14B8A6]">{item.total_for_farm}</span>
                      </div>

                      <div className="text-[11px] text-[#8FA59B] space-y-0.5">
                        <span className="font-semibold text-[#F3F7F5] block text-[10px] uppercase">
                          Method
                        </span>
                        <p>{item.application_method}</p>
                      </div>

                      <div className="text-[11px] text-[#8FA59B] space-y-0.5 p-2 rounded-lg bg-[#0E1E18] border border-[#1B382D]">
                        <span className="font-semibold text-[#10B981] block text-[10px]">
                          💡 Rationale:
                        </span>
                        <p className="leading-relaxed">{item.why}</p>
                      </div>
                    </div>

                    <div className="pt-1.5 border-t border-[#1B382D] text-[10px] text-[#8FA59B]">
                      <strong className="text-[#10B981]">Soil Basis: </strong>
                      {item.soil_basis}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Structured Guidance Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* When to Apply */}
            <div className="p-3.5 rounded-xl bg-[#08120E] border border-[#1B382D] space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#10B981]">
                <Clock className="w-3.5 h-3.5" />
                <span>When to Apply (Timing)</span>
              </div>
              <p className="text-xs text-[#8FA59B] leading-relaxed">{data.timing}</p>
            </div>

            {/* How to Apply */}
            <div className="p-3.5 rounded-xl bg-[#08120E] border border-[#1B382D] space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#14B8A6]">
                <Layers className="w-3.5 h-3.5" />
                <span>How to Apply (Delivery)</span>
              </div>
              <p className="text-xs text-[#8FA59B] leading-relaxed">{data.application_method}</p>
            </div>

            {/* Why This Recommendation */}
            <div className="p-3.5 rounded-xl bg-[#08120E] border border-[#1B382D] space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#10B981]">
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Agronomic Rationale</span>
              </div>
              <p className="text-xs text-[#8FA59B] leading-relaxed">{data.reason}</p>
            </div>

            {/* Weather Advice */}
            <div
              className={`p-3.5 rounded-xl border space-y-1 ${
                isRainDelay
                  ? 'bg-[#EF4444]/5 border-[#EF4444]/30 text-[#EF4444]'
                  : 'bg-[#08120E] border-[#1B382D] text-[#8FA59B]'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <CloudRain className={`w-3.5 h-3.5 ${isRainDelay ? 'text-[#EF4444]' : 'text-[#38BDF8]'}`} />
                <span>Weather Runoff Advisory</span>
              </div>
              <p className="text-xs text-[#8FA59B] leading-relaxed">{data.weather_advice}</p>
            </div>
          </div>

          {/* Safety Precautions */}
          <div className="p-3.5 rounded-xl bg-[#F59E0B]/5 border border-[#F59E0B]/20 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#F59E0B]">
              <ShieldAlert className="w-4 h-4" />
              <span>Chemical Safety & Handling Precautions</span>
            </div>
            <ul className="space-y-1 text-xs text-[#8FA59B] list-disc list-inside">
              {(data.precautions || []).map((prec, i) => (
                <li key={i} className="leading-relaxed">
                  {prec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Application Timeline & History Section */}
      <div className="os-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1B382D] pb-3">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-[#10B981]" />
            <div>
              <h3 className="text-sm font-bold text-[#F3F7F5] uppercase tracking-wide">Farm Application Log</h3>
              <p className="text-[11px] text-[#8FA59B]">
                {history.length} recorded fertilizer doses for {activeFarm.name}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsLogModalOpen(true)}
            className="os-btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Add Log</span>
          </button>
        </div>

        {history.length === 0 ? (
          <div className="p-6 text-center text-[#8FA59B] text-xs space-y-1">
            <p>No fertilizer applications logged yet for this plot.</p>
            <p className="text-[11px]">Record past applications to track nutrient carryover and prevent duplicate dosing.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {history.map((app) => (
              <div
                key={app.id}
                className="p-3.5 rounded-xl bg-[#08120E] border border-[#1B382D] space-y-1.5 text-xs relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#F3F7F5] text-xs">{app.product_name}</span>
                  <button
                    onClick={() => handleDeleteApplication(app.id)}
                    className="text-[#8FA59B] hover:text-[#EF4444] transition-colors p-1 cursor-pointer"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-baseline justify-between text-[#10B981] font-bold text-sm">
                  <span>
                    {app.quantity} {app.unit}
                  </span>
                  <span className="text-xs text-[#8FA59B] font-normal">{app.area_applied_acres} Acres</span>
                </div>

                <div className="text-[11px] text-[#8FA59B] space-y-0.5 pt-1 border-t border-[#1B382D]">
                  <p>Stage: <strong className="text-[#F3F7F5]">{app.crop_stage}</strong></p>
                  <p>Method: {app.application_method}</p>
                  {app.notes && <p className="italic">"{app.notes}"</p>}
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#8FA59B] pt-0.5">
                  <span>{app.crop}</span>
                  <span>📅 {app.date_applied}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log Application Modal */}
      <AnimatePresence>
        {isLogModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0E1E18] border border-[#1B382D] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[#1B382D] pb-3">
                <div>
                  <h3 className="text-base font-bold text-[#F3F7F5]">Record Fertilizer Application</h3>
                  <p className="text-[11px] text-[#8FA59B]">Logs dose to farm timeline & prevents duplicate application</p>
                </div>
                <button
                  onClick={() => setIsLogModalOpen(false)}
                  className="text-[#8FA59B] hover:text-[#F3F7F5] font-bold text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleLogApplication} className="space-y-3 text-xs">
                <div>
                  <label className="text-[#8FA59B] font-medium block mb-1">Product / Fertilizer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Neem-Coated Urea, MOP, DAP"
                    value={formProduct}
                    onChange={(e) => setFormProduct(e.target.value)}
                    className="os-input font-medium text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#8FA59B] font-medium block mb-1">Application Date *</label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="os-input font-medium text-xs cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-[#8FA59B] font-medium block mb-1">Quantity Applied *</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.1"
                        required
                        placeholder="50"
                        value={formQuantity}
                        onChange={(e) => setFormQuantity(e.target.value)}
                        className="os-input font-bold text-xs"
                      />
                      <select
                        value={formUnit}
                        onChange={(e) => setFormUnit(e.target.value)}
                        className="os-input px-2 text-xs font-semibold"
                      >
                        <option value="kg">kg</option>
                        <option value="liters">liters</option>
                        <option value="bags">bags</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#8FA59B] font-medium block mb-1">Area Applied (Acres)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formArea}
                      onChange={(e) => setFormArea(e.target.value)}
                      className="os-input text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[#8FA59B] font-medium block mb-1">Crop Stage</label>
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
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#8FA59B] font-medium block mb-1">Nutrient Focus</label>
                    <select
                      value={formNutrient}
                      onChange={(e) => setFormNutrient(e.target.value)}
                      className="os-input text-xs cursor-pointer"
                    >
                      <option value="Nitrogen">Nitrogen (N)</option>
                      <option value="Phosphorus">Phosphorus (P)</option>
                      <option value="Potassium">Potassium (K)</option>
                      <option value="Balanced NPK">Balanced NPK</option>
                      <option value="Micronutrient">Micronutrients</option>
                      <option value="Organic">Organic Compost</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[#8FA59B] font-medium block mb-1">Delivery Method</label>
                    <select
                      value={formMethod}
                      onChange={(e) => setFormMethod(e.target.value)}
                      className="os-input text-xs cursor-pointer"
                    >
                      <option value="Fertigation / Drip">Fertigation / Drip</option>
                      <option value="Basal Soil Application">Basal Soil Application</option>
                      <option value="Top-dressing">Top-dressing</option>
                      <option value="Foliar Spray">Foliar Spray</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[#8FA59B] font-medium block mb-1">Notes / Observations</label>
                  <input
                    type="text"
                    placeholder="e.g. Applied in morning drip cycle"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="os-input text-xs"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsLogModalOpen(false)}
                    className="os-btn-secondary flex-1 py-2 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingApp}
                    className="os-btn-primary flex-1 py-2 text-xs flex items-center justify-center gap-1.5"
                  >
                    {submittingApp ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Application'}
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
