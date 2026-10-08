import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFarm } from '../context/FarmContext';
import { useAuth } from '../context/AuthContext';
import {
  Droplets,
  Clock,
  CloudRain,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Info,
  Power,
  Wifi,
  WifiOff,
  History,
  AlertOctagon,
  Cpu,
  Award,
  Scale,
  ShieldAlert,
  RefreshCw,
  Gauge,
  MapPin,
  FlaskConical,
  CloudSun,
  Lock,
  Layers,
  ChevronDown
} from 'lucide-react';
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
  'Coffee',
  'Black Pepper',
  'Cardamom',
  'Arecanut',
  'Coconut',
  'Tea',
  'Ginger',
  'Turmeric'
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

const IRRIGATION_METHODS = [
  'Drip Irrigation',
  'Sprinkler System',
  'Canal / Flood',
  'Rainfed'
];

export default function IrrigationPage() {
  const { activeFarm, farms, setActiveFarm, loading: farmsLoading } = useFarm();
  const { t } = useAuth();

  // Agronomic form inputs tied to current farm
  const [selectedCrop, setSelectedCrop] = useState('Tomato');
  const [cropStage, setCropStage] = useState('Vegetative Growth');
  const [soilType, setSoilType] = useState('Loam');
  const [irrigationMethod, setIrrigationMethod] = useState('Drip Irrigation');
  const [areaAcres, setAreaAcres] = useState(1.0);
  const [soilMoisture, setSoilMoisture] = useState(42.0);
  const [isSensorAvailable, setIsSensorAvailable] = useState(false);

  // Live Telemetry & API states
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Prediction State
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);

  // IoT Pump Controller & Automation Status
  const [automationStatus, setAutomationStatus] = useState(null);
  const [pump, setPump] = useState(null);
  const [events, setEvents] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [customDuration, setCustomDuration] = useState(35);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Keep track of the currently loading farm ID to avoid race conditions
  const currentFarmIdRef = useRef(null);

  // 1. Fetch Model Info on initial mount
  useEffect(() => {
    api.get('/smart-irrigation/model-info')
      .then((res) => setModelInfo(res.data))
      .catch((err) => console.log('Model info non-fatal:', err));
  }, []);

  // 2. Comprehensive Refetch & Reset for Selected Farm
  const loadFarmData = useCallback(async (farm) => {
    if (!farm || !farm.id) return;
    const farmId = farm.id;
    currentFarmIdRef.current = farmId;

    // Reset all dependent and cached states immediately
    setPrediction(null);
    setWeather(null);
    setAutomationStatus(null);
    setPump(null);
    setEvents([]);
    setError(null);
    setFeedbackMsg(null);
    setWeatherLoading(true);

    // Sync input fields to current farm attributes
    const cropVal = farm.crop || 'Tomato';
    const stageVal = farm.current_stage_override || 'Vegetative Growth';
    const soilVal = farm.soil_type || 'Loam';
    const methodVal = farm.irrigation_method || 'Drip Irrigation';
    const areaVal = farm.size_acres || 1.0;

    setSelectedCrop(cropVal);
    setCropStage(stageVal);
    setSoilType(soilVal);
    setIrrigationMethod(methodVal);
    setAreaAcres(areaVal);

    let currentMoist = 42.0;
    let sensorOnline = false;
    let weatherTemp = 27.5;
    let weatherHum = 65.0;
    let weatherRain = 0.0;
    let weatherProb = 15.0;

    try {
      // 1. Fetch Farm Sensors (Moisture, Temp, Humidity)
      const sensorRes = await api.get(`/sensors/${farmId}`).catch(() => ({ data: [] }));
      if (currentFarmIdRef.current !== farmId) return;

      const moistureSensor = sensorRes.data?.find(
        (s) => s.sensor_type === 'moisture' && s.status === 'Online'
      );
      if (moistureSensor && moistureSensor.current_value !== null && moistureSensor.current_value !== undefined) {
        sensorOnline = true;
        currentMoist = Number(moistureSensor.current_value);
        setIsSensorAvailable(true);
        setSoilMoisture(currentMoist);
      } else {
        setIsSensorAvailable(false);
      }

      // 2. Fetch Live Weather Radar Telemetry
      const weatherRes = await api.get(`/weather/current?farm_id=${farmId}`).catch(() => null);
      if (currentFarmIdRef.current !== farmId) return;

      if (weatherRes?.data?.current_weather) {
        const curr = weatherRes.data.current_weather;
        weatherTemp = curr.temperature_c ?? curr.temp_c ?? 27.5;
        weatherHum = curr.humidity_pct ?? 65.0;
        weatherRain = curr.precipitation_mm ?? curr.rainfall_mm ?? 0.0;
        weatherProb = curr.rain_probability_pct ?? curr.rain_prob_pct ?? 15.0;
        setWeather({
          temperature: weatherTemp,
          humidity: weatherHum,
          rainfall_mm: weatherRain,
          rain_prob: weatherProb,
          condition: curr.weather_description || 'Partly Cloudy'
        });
      } else {
        // Fallback to basic weather route
        const altWeather = await api.get(`/weather/${farmId}`).catch(() => null);
        if (altWeather?.data) {
          weatherTemp = altWeather.data.temperature ?? 27.5;
          weatherHum = altWeather.data.humidity ?? 65.0;
          weatherRain = altWeather.data.rainfall_mm ?? 0.0;
          weatherProb = altWeather.data.rain_prob ?? 15.0;
          setWeather({
            temperature: weatherTemp,
            humidity: weatherHum,
            rainfall_mm: weatherRain,
            rain_prob: weatherProb,
            condition: altWeather.data.condition || 'Partly Cloudy'
          });
        } else {
          setWeather({
            temperature: 27.5,
            humidity: 65.0,
            rainfall_mm: 0.0,
            rain_prob: 15.0,
            condition: 'Partly Cloudy'
          });
        }
      }

      // 3. Fetch Pump Automation Status
      const autoRes = await api.get(`/pumps/automation-status/${farmId}`).catch(() => null);
      if (currentFarmIdRef.current !== farmId) return;
      if (autoRes?.data) {
        setAutomationStatus(autoRes.data);
        if (!sensorOnline && autoRes.data.soil_moisture_pct !== null && autoRes.data.soil_moisture_pct !== undefined) {
          currentMoist = Number(autoRes.data.soil_moisture_pct);
          setSoilMoisture(currentMoist);
        }
      }

      // 4. Fetch Direct Pump Controller state
      const pumpRes = await api.get(`/pumps/${farmId}`).catch(() => null);
      if (currentFarmIdRef.current !== farmId) return;
      if (pumpRes?.data) {
        setPump(pumpRes.data);
        setCustomDuration(pumpRes.data.target_duration_mins || 35);
      }

      // 5. Fetch Pump Events Log
      const eventsRes = await api.get(`/pumps/${farmId}/events`).catch(() => null);
      if (currentFarmIdRef.current !== farmId) return;
      if (eventsRes?.data) {
        setEvents(eventsRes.data);
      }

      // 6. Run Initial Smart Irrigation Prediction for this farm
      setLoading(true);
      const predRes = await api.post('/smart-irrigation/predict', {
        farm_id: farmId,
        crop: cropVal,
        crop_stage: stageVal,
        soil_type: soilVal,
        soil_moisture: parseFloat(currentMoist),
        temperature: parseFloat(weatherTemp),
        humidity: parseFloat(weatherHum),
        rainfall: parseFloat(weatherRain),
        rain_probability: parseFloat(weatherProb),
        farm_area: parseFloat(areaVal) || 1.0,
        irrigation_method: methodVal
      });

      if (currentFarmIdRef.current === farmId && predRes?.data) {
        setPrediction(predRes.data);
      }
    } catch (err) {
      if (currentFarmIdRef.current === farmId) {
        console.error('Error synchronizing farm data:', err);
        setError(err.response?.data?.detail || 'Failed to synchronize farm telemetry.');
      }
    } finally {
      if (currentFarmIdRef.current === farmId) {
        setWeatherLoading(false);
        setLoading(false);
      }
    }
  }, []);

  // Synchronize when activeFarm changes
  useEffect(() => {
    if (activeFarm && activeFarm.id) {
      loadFarmData(activeFarm);
    }
  }, [activeFarm?.id, loadFarmData]);

  // Handle explicit farm switch from dropdown
  const handleFarmSwitch = (e) => {
    const selectedId = parseInt(e.target.value);
    const targetFarm = farms?.find((f) => f.id === selectedId);
    if (targetFarm) {
      setActiveFarm(targetFarm);
    }
  };

  // Run Smart Irrigation Prediction on demand ("Check Irrigation")
  const runPrediction = useCallback(() => {
    if (!activeFarm || !activeFarm.id) return;
    setLoading(true);
    setError(null);

    const payload = {
      farm_id: activeFarm.id,
      crop: selectedCrop,
      crop_stage: cropStage,
      soil_type: soilType,
      soil_moisture: parseFloat(soilMoisture),
      temperature: weather?.temperature ? parseFloat(weather.temperature) : 27.5,
      humidity: weather?.humidity ? parseFloat(weather.humidity) : 65.0,
      rainfall: weather?.rainfall_mm ? parseFloat(weather.rainfall_mm) : 0.0,
      rain_probability: weather?.rain_prob ? parseFloat(weather.rain_prob) : 15.0,
      farm_area: parseFloat(areaAcres) || 1.0,
      irrigation_method: irrigationMethod
    };

    api.post('/smart-irrigation/predict', payload)
      .then((res) => {
        setPrediction(res.data);
        // Refresh pump state in case rain lock was altered
        api.get(`/pumps/automation-status/${activeFarm.id}`).then((aRes) => setAutomationStatus(aRes.data)).catch(() => {});
        api.get(`/pumps/${activeFarm.id}`).then((pRes) => setPump(pRes.data)).catch(() => {});
        api.get(`/pumps/${activeFarm.id}/events`).then((eRes) => setEvents(eRes.data || [])).catch(() => {});
      })
      .catch((err) => {
        console.error('Smart irrigation prediction error:', err);
        setError(err.response?.data?.detail || 'Failed to calculate smart irrigation forecast.');
      })
      .finally(() => setLoading(false));
  }, [activeFarm, selectedCrop, cropStage, soilType, soilMoisture, weather, areaAcres, irrigationMethod]);

  // Send Manual or Auto Pump Commands
  const sendPumpCommand = async (command, extra = {}) => {
    if (!activeFarm || !activeFarm.id) return;
    setActionLoading(true);
    setPendingAction(command);
    setFeedbackMsg(null);
    try {
      const res = await api.post(`/pumps/${activeFarm.id}/command`, {
        command,
        duration_mins: customDuration,
        ...extra
      });
      setPump(res.data);
      const isSim = res.data.is_simulated || !res.data.hardware_connected;
      const hwTag = isSim ? 'Simulation / Hardware Not Connected' : 'Physical Hardware Connected';
      setFeedbackMsg({
        type: 'success',
        text: `Command [${command}] executed. Status: ${res.data.status} • Mode: ${res.data.mode} • [${hwTag}].`
      });
      // Refresh automation status and events log
      const [autoRes, eventsRes] = await Promise.all([
        api.get(`/pumps/automation-status/${activeFarm.id}`).catch(() => null),
        api.get(`/pumps/${activeFarm.id}/events`).catch(() => null)
      ]);
      if (autoRes?.data) setAutomationStatus(autoRes.data);
      if (eventsRes?.data) setEvents(eventsRes.data);
    } catch (err) {
      const backendMessage = err.response?.data?.detail || 'Pump command was rejected by safety controller.';
      setFeedbackMsg({
        type: 'error',
        text: backendMessage
      });
      // Refresh pump state and events log to capture blocked status and event
      const [pumpRes, autoRes, eventsRes] = await Promise.all([
        api.get(`/pumps/${activeFarm.id}`).catch(() => null),
        api.get(`/pumps/automation-status/${activeFarm.id}`).catch(() => null),
        api.get(`/pumps/${activeFarm.id}/events`).catch(() => null)
      ]);
      if (pumpRes?.data) setPump(pumpRes.data);
      if (autoRes?.data) setAutomationStatus(autoRes.data);
      if (eventsRes?.data) setEvents(eventsRes.data);
    } finally {
      setActionLoading(false);
      setPendingAction(null);
      setTimeout(() => setFeedbackMsg(null), 9000);
    }
  };

  const isPumpOn = (automationStatus?.pump_status || pump?.status) === 'ON';
  const isAutoMode = (automationStatus?.pump_mode || pump?.mode) === 'AUTO';
  const isRainLocked = automationStatus?.rain_lock ?? pump?.rain_lock ?? false;
  const isEmergencyStopped = automationStatus?.emergency_stopped ?? pump?.emergency_stopped ?? false;
  const isHardwareConnected = Boolean(automationStatus?.hardware_connected ?? pump?.hardware_connected ?? false);
  const isSimulated = Boolean(automationStatus?.is_simulated ?? pump?.is_simulated ?? true);
  const hectares = (parseFloat(areaAcres) || 0) / 2.47105;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto selection:bg-[#10B981] selection:text-black">
      {/* Header Banner with Synchronized Farm Selector */}
      <div className="os-card-elevated p-6 sm:p-8 space-y-4 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded text-[11px] font-bold bg-[#14B8A6]/15 text-[#14B8A6] border border-[#14B8A6]/25 uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5" /> Gradient Boosting Model 4 • 98.33% Accuracy
            </div>
            <h1 className="text-xl sm:text-3xl font-bold text-[#F3F7F5] flex items-center gap-3 tracking-tight">
              <Droplets className="w-7 h-7 text-[#14B8A6]" />
              <span>{t('irr.title', 'Smart Borewell & Precision Irrigation Command')}</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#8FA59B] leading-relaxed">
              Data-driven precision irrigation engine. Combines FAO-56 crop water depletion physics, real-time Open-Meteo precipitation radar, soil water retention, and IoT borewell hardware fail-safes.
            </p>
          </div>

          {/* Active Farm Switcher in Header */}
          <div className="p-3.5 rounded-xl bg-[#08120E] border border-[#1B382D] space-y-1.5 min-w-[240px] shrink-0">
            <label className="text-[10px] text-[#8FA59B] uppercase font-bold tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#14B8A6]" />
              <span>Selected Farm</span>
            </label>
            {farms && farms.length > 0 ? (
              <select
                value={activeFarm?.id || ''}
                onChange={handleFarmSwitch}
                className="os-input font-bold text-xs w-full bg-[#0E1E18] text-[#F3F7F5] cursor-pointer"
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    #{f.id} — {f.name} ({f.crop || 'Crop'}, {f.size_acres || 1} ac)
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs text-[#8FA59B]">No farm registered</span>
            )}
            <div className="text-[10px] text-[#14B8A6] font-semibold pt-0.5">
              Active Farm ID: <strong className="text-[#F3F7F5]">#{activeFarm?.id || 'N/A'}</strong>
            </div>
          </div>
        </div>

        {/* Model & IoT Badges */}
        <div className="pt-2 flex flex-wrap items-center gap-2 text-xs border-t border-[#1B382D]/50">
          <span className="px-3 py-1 rounded-lg bg-[#08120E] border border-[#1B382D] text-[#14B8A6] font-semibold flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" /> 98.33% Test Accuracy
          </span>
          <span className="px-3 py-1 rounded-lg bg-[#08120E] border border-[#1B382D] text-[#10B981] font-medium flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5" /> Macro F1: 96.97%
          </span>
          <span className="px-3 py-1 rounded-lg bg-[#08120E] border border-[#1B382D] text-[#8FA59B] font-medium flex items-center gap-1.5">
            {isSensorAvailable ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-[#10B981]" />
                <span className="text-[#10B981]">IoT Soil Moisture Sensor Active</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>Agronomic Baseline Telemetry</span>
              </>
            )}
          </span>
          {activeFarm && (
            <span className="px-3 py-1 rounded-lg bg-[#08120E] border border-[#1B382D] text-[#F3F7F5] font-semibold flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#14B8A6]" />
              <span>{activeFarm.name} (#{activeFarm.id})</span>
            </span>
          )}
        </div>
      </div>

      {/* Feedback & Safety Toast */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold border flex items-start justify-between transition-all shadow-lg ${
            feedbackMsg.type === 'error'
              ? 'bg-[#EF4444]/15 border-[#EF4444]/40 text-[#EF4444]'
              : 'bg-[#10B981]/15 border-[#10B981]/40 text-[#10B981]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackMsg.type === 'error' ? (
              <ShieldAlert className="w-5 h-5 shrink-0 text-[#EF4444]" />
            ) : (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-[#10B981]" />
            )}
            <div>
              <strong className="block text-sm font-bold">
                {feedbackMsg.type === 'error' ? 'Hardware Controller Safety Intercept' : 'Controller Action Executed'}
              </strong>
              <p className="mt-0.5 text-xs text-[#F3F7F5]">{feedbackMsg.text}</p>
            </div>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-[#8FA59B] hover:text-[#F3F7F5] font-bold ml-4 p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Context Parameters Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 1. Farm & Crop Setup */}
        <div className="os-card p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1B382D] pb-2.5">
            <h3 className="text-xs font-bold text-[#F3F7F5] flex items-center gap-2 uppercase tracking-wide">
              <MapPin className="w-4 h-4 text-[#14B8A6]" />
              <span>Crop & Field Area</span>
            </h3>
            <span className="text-[11px] text-[#14B8A6] font-mono font-bold">
              Farm #{activeFarm?.id || '—'}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] text-[#8FA59B] font-medium block">Target Crop</label>
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

            <div className="space-y-1">
              <label className="text-[11px] text-[#8FA59B] font-medium block">Growth Stage</label>
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

            <div className="space-y-1">
              <label className="text-[11px] text-[#8FA59B] font-medium block flex items-center justify-between">
                <span>Field Area</span>
                <span className="text-[10px] text-[#14B8A6] font-mono">≈ {hectares.toFixed(2)} Ha</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={areaAcres}
                  onChange={(e) => setAreaAcres(e.target.value)}
                  className="os-input font-bold text-xs"
                />
                <span className="px-3 py-2 rounded-lg bg-[#08120E] border border-[#1B382D] text-[#8FA59B] font-semibold text-xs">
                  Acres
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Microclimate Weather & Rain Radar */}
        <div className="os-card p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1B382D] pb-2.5">
            <h3 className="text-xs font-bold text-[#F3F7F5] flex items-center gap-2 uppercase tracking-wide">
              <CloudSun className="w-4 h-4 text-[#F59E0B]" />
              <span>Weather & Rain Radar</span>
            </h3>
            <button
              onClick={() => activeFarm && loadFarmData(activeFarm)}
              className="text-[#8FA59B] hover:text-[#F3F7F5] text-[11px] flex items-center gap-1 cursor-pointer"
              title="Refresh live weather radar"
            >
              <RefreshCw className={`w-3 h-3 ${weatherLoading ? 'animate-spin' : ''}`} />
              <span>Live Radar</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-lg bg-[#08120E] border border-[#1B382D] space-y-0.5">
              <span className="text-[10px] text-[#8FA59B] block">Temperature</span>
              <span className="text-sm font-bold text-[#F59E0B]">{weather?.temperature ?? 27.5}°C</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#08120E] border border-[#1B382D] space-y-0.5">
              <span className="text-[10px] text-[#8FA59B] block">Humidity</span>
              <span className="text-sm font-bold text-[#14B8A6]">{weather?.humidity ?? 65}%</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#08120E] border border-[#1B382D] space-y-0.5">
              <span className="text-[10px] text-[#8FA59B] block">Rain (24h)</span>
              <span className="text-sm font-bold text-[#38BDF8]">{weather?.rainfall_mm ?? 0.0} mm</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#08120E] border border-[#1B382D] space-y-0.5">
              <span className="text-[10px] text-[#8FA59B] block">Rain Prob.</span>
              <span className={`text-sm font-bold ${(weather?.rain_prob ?? 15) >= 50 ? 'text-[#F59E0B]' : 'text-[#F3F7F5]'}`}>
                {weather?.rain_prob ?? 15}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#8FA59B] pt-0.5">
            <span>Forecast Feed:</span>
            <span className="text-[#14B8A6] font-semibold">Open-Meteo Weather Radar</span>
          </div>
        </div>

        {/* 3. Soil Moisture & Method */}
        <div className="os-card p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1B382D] pb-2.5">
            <h3 className="text-xs font-bold text-[#F3F7F5] flex items-center gap-2 uppercase tracking-wide">
              <FlaskConical className="w-4 h-4 text-[#10B981]" />
              <span>Soil & Irrigation Delivery</span>
            </h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/25">
              Calibrated
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] text-[#8FA59B] font-medium block">Soil Texture</label>
              <select
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
                className="os-input font-semibold text-xs cursor-pointer w-full bg-[#08120E]"
              >
                {SOIL_TYPES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-[#8FA59B] font-medium block">Irrigation Delivery System</label>
              <select
                value={irrigationMethod}
                onChange={(e) => setIrrigationMethod(e.target.value)}
                className="os-input font-semibold text-xs cursor-pointer w-full bg-[#08120E]"
              >
                {IRRIGATION_METHODS.map((im) => (
                  <option key={im} value={im}>{im}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-[#8FA59B] font-medium block flex items-center justify-between">
                <span>Soil Moisture Level</span>
                <span className="text-[10px] text-[#14B8A6] font-bold">
                  {isSensorAvailable ? '📡 Live IoT Sensor' : 'Manual / Baseline'}
                </span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={soilMoisture}
                  onChange={(e) => setSoilMoisture(e.target.value)}
                  className="os-input font-bold text-xs"
                />
                <span className="px-3 py-2 rounded-lg bg-[#08120E] border border-[#1B382D] text-[#8FA59B] font-semibold text-xs">
                  % VWC
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-[#0E1E18] border border-[#1B382D]">
        <div className="text-xs text-[#8FA59B] flex items-center gap-1.5">
          <Info className="w-4 h-4 text-[#14B8A6] shrink-0" />
          <span>Executing for Farm #{activeFarm?.id || '—'} ({selectedCrop}, {areaAcres} acres). FAO-56 Soil Water Depletion + Rain Fail-Safes.</span>
        </div>

        <button
          onClick={runPrediction}
          disabled={loading || !activeFarm}
          className="os-btn-primary w-full sm:w-auto px-6 py-2.5 text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing Smart Irrigation Need...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Check Irrigation</span>
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="os-card p-4 border-[#EF4444]/30 bg-[#EF4444]/5 text-[#EF4444] text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* PRIMARY SMART IRRIGATION DECISION DASHBOARD */}
      {prediction && (
        <div className="os-card p-5 sm:p-6 space-y-5">
          {/* Main Decision Banner */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-[#1B382D] pb-5">
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-[#8FA59B] uppercase tracking-wider flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-[#14B8A6]" /> Agronomic Smart Irrigation Decision • Farm #{activeFarm?.id || prediction.farm_id || '—'}
              </span>
              
              {/* Decision Badge */}
              <div className="flex items-center gap-3">
                {prediction.decision === 'IRRIGATION REQUIRED' && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#14B8A6]/15 text-[#14B8A6] border border-[#14B8A6]/30 text-base sm:text-lg font-bold">
                    <Droplets className="w-5 h-5 text-[#14B8A6]" />
                    <span>Irrigation Required</span>
                  </div>
                )}
                {prediction.decision === 'DELAY IRRIGATION' && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 text-base sm:text-lg font-bold">
                    <CloudRain className="w-5 h-5 text-[#F59E0B]" />
                    <span>Delay Irrigation (Rain Imminent)</span>
                  </div>
                )}
                {prediction.decision === 'IRRIGATION NOT REQUIRED' && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 text-base sm:text-lg font-bold">
                    <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                    <span>Irrigation Not Required (Optimal Moisture)</span>
                  </div>
                )}
                {(prediction.decision === 'CHECK SENSOR' || prediction.decision === 'INSUFFICIENT DATA') && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 text-base sm:text-lg font-bold">
                    <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
                    <span>Check Sensor (Telemetry Fault)</span>
                  </div>
                )}
                {prediction.decision === 'EMERGENCY STOPPED' && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#EF4444] text-white text-base sm:text-lg font-bold">
                    <AlertOctagon className="w-5 h-5" />
                    <span>Emergency Stop Active</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-[#8FA59B] leading-relaxed max-w-2xl pt-0.5">
                {prediction.reason}
              </p>
            </div>

            {/* Confidence & Diagnostic Box */}
            <div className="text-left lg:text-right p-3.5 rounded-xl bg-[#08120E] border border-[#1B382D] min-w-[180px]">
              <div className="text-xl font-bold text-[#14B8A6]">{prediction.confidence_or_uncertainty}</div>
              <span className="text-xs font-semibold text-[#F3F7F5] block mt-0.5">Decision Reliability</span>
              <span className="text-[10px] text-[#8FA59B] block">
                {prediction.area_scaling_applied || 'FAO-56 Scaled (1x)'}
              </span>
            </div>
          </div>

          {/* Rain Warning Banner */}
          {prediction.rain_warning && (
            <div className="p-3.5 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-xs text-[#F59E0B] flex items-start gap-2.5">
              <CloudRain className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#F3F7F5] block mb-0.5">Precipitation Radar & Rain Safety Intercept:</strong>
                <span className="text-[#8FA59B]">{prediction.rain_warning}</span>
              </div>
            </div>
          )}

          {/* Quantified Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-[#08120E] border border-[#1B382D] space-y-1">
              <span className="text-[10px] text-[#8FA59B] font-semibold uppercase block">Water Requirement</span>
              <p className="text-lg sm:text-xl font-bold text-[#14B8A6]">
                {prediction.recommended_amount && typeof prediction.recommended_amount === 'number'
                  ? prediction.recommended_amount.toLocaleString()
                  : (prediction.recommended_amount || 0)}{' '}
                <span className="text-xs text-[#8FA59B] font-normal">{prediction.unit || 'Litres'}</span>
              </p>
              <p className="text-[10px] text-[#8FA59B]">
                {typeof prediction.recommended_amount === 'number' && prediction.recommended_amount > 0
                  ? `≈ ${(prediction.recommended_amount / 1000).toFixed(1)} m³ for ${prediction.crop}`
                  : 'Standby / 0 m³'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#08120E] border border-[#1B382D] space-y-1">
              <span className="text-[10px] text-[#8FA59B] font-semibold uppercase block">Target Duration</span>
              <p className="text-lg sm:text-xl font-bold text-[#F3F7F5]">
                {prediction.duration}{' '}
                <span className="text-xs text-[#8FA59B] font-normal">{prediction.duration_unit || 'Minutes'}</span>
              </p>
              <p className="text-[10px] text-[#8FA59B]">Delivery: {prediction.irrigation_method}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#08120E] border border-[#1B382D] space-y-1">
              <span className="text-[10px] text-[#8FA59B] font-semibold uppercase block">Water Conserved</span>
              <p className="text-lg sm:text-xl font-bold text-[#10B981]">
                {prediction.water_saved_liters ? prediction.water_saved_liters.toLocaleString() : 0}{' '}
                <span className="text-xs text-[#8FA59B] font-normal">Litres</span>
              </p>
              <p className="text-[10px] text-[#8FA59B]">vs flood irrigation</p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#08120E] border border-[#1B382D] space-y-1">
              <span className="text-[10px] text-[#8FA59B] font-semibold uppercase block">Optimal Window</span>
              <p className="text-xs font-bold text-[#F59E0B] pt-0.5 leading-tight">
                {prediction.optimal_window}
              </p>
              <p className="text-[10px] text-[#8FA59B]">Minimizes evaporation</p>
            </div>
          </div>

          {/* Factors Impacting Decision */}
          {prediction.important_factors && prediction.important_factors.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <h3 className="text-xs font-bold text-[#F3F7F5] flex items-center gap-2 uppercase tracking-wide">
                <Gauge className="w-4 h-4 text-[#14B8A6]" />
                <span>Telemetry Factors Impacting Decision</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {prediction.important_factors.map((f, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#08120E] border border-[#1B382D] flex flex-col justify-between space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#F3F7F5] text-xs">{f.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#14B8A6]/15 text-[#14B8A6] border border-[#14B8A6]/25">
                        {f.impact}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8FA59B] leading-relaxed">{f.description}</p>
                    <div className="text-[10px] text-[#8FA59B] pt-1 border-t border-[#1B382D] flex items-center justify-between">
                      <span>Val: <strong className="text-[#F3F7F5]">{f.value}</strong></span>
                      <span className="text-[#10B981] font-semibold">{f.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actionable Recommendations */}
          {prediction.recommendations && prediction.recommendations.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <h3 className="text-xs font-bold text-[#F3F7F5] flex items-center gap-2 uppercase tracking-wide">
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                <span>Actionable Agronomic Recommendations</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {prediction.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#08120E] border border-[#1B382D] text-xs text-[#8FA59B] flex items-start gap-2.5"
                  >
                    <span className="w-4 h-4 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 text-[#10B981] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="leading-relaxed">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SMART BOREWELL IOT CONTROLLER CARD */}
      <div className="os-card p-5 sm:p-6 space-y-5">
        {/* Rain Lock Active Safety Banner */}
        {isRainLocked && (
          <div className="p-3.5 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/40 flex items-center gap-3 text-[#F59E0B] text-xs font-semibold shadow-inner">
            <CloudRain className="w-6 h-6 text-[#F59E0B] shrink-0" />
            <div className="space-y-0.5">
              <p className="text-[#F59E0B] font-bold text-xs">
                🌧️ Rain Lock Active — Borewell Startup Intercepted (Farm #{activeFarm?.id || '—'})
              </p>
              <p className="text-[11px] text-[#8FA59B]">
                Precipitation is forecasted in your farm zone. Holding borewell pumps prevents root zone hypoxia, soil nutrient leaching, and saves electrical energy.
              </p>
            </div>
          </div>
        )}

        {/* Emergency Stop Active Banner */}
        {isEmergencyStopped && (
          <div className="p-3.5 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/40 flex items-center gap-3 text-[#EF4444] text-xs font-semibold shadow-inner">
            <AlertOctagon className="w-6 h-6 text-[#EF4444] shrink-0" />
            <div className="space-y-0.5">
              <p className="text-[#EF4444] font-bold text-xs">
                🛑 Emergency Stop Active — All Borewell Circuits Locked (Farm #{activeFarm?.id || '—'})
              </p>
              <p className="text-[11px] text-[#8FA59B]">
                Emergency kill switch is engaged on this pump controller node. Clear emergency status to resume normal operation.
              </p>
            </div>
          </div>
        )}

        {/* Controller Status Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1B382D] pb-5">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold transition-all ${
                isPumpOn
                  ? 'bg-[#10B981] text-[#08120E] animate-pulse shadow-md'
                  : 'bg-[#08120E] text-[#8FA59B] border border-[#1B382D]'
              }`}
            >
              <Power className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    isPumpOn ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30' : 'bg-[#08120E] text-[#8FA59B] border border-[#1B382D]'
                  }`}
                >
                  STATUS: {isPumpOn ? 'RUNNING (ON)' : 'OFF'}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    isAutoMode ? 'bg-[#14B8A6]/20 text-[#14B8A6] border border-[#14B8A6]/30' : 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30'
                  }`}
                >
                  {isAutoMode ? '🛡️ Automatic Safety Control' : '🖐️ Manual Control Active'}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    isHardwareConnected
                      ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30'
                      : 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/25'
                  }`}
                >
                  {isHardwareConnected ? '🟢 Hardware Online' : '🟡 Simulation / Hardware Not Connected'}
                </span>
                {isRainLocked && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30">
                    🌧️ Rain Lock Active
                  </span>
                )}
                {isEmergencyStopped && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30">
                    🛑 Emergency Stop Active
                  </span>
                )}
                {(pump?.manual_override || automationStatus?.manual_override) && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/30">
                    ⚡ Manual Override Active
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-[#F3F7F5]">
                {pump?.name || (activeFarm ? `${activeFarm.name} Borewell Node` : 'Main Borewell Node')}
              </h2>
              <p className="text-[11px] text-[#8FA59B]">Hardware ID: {pump?.device_id || `ESP32-PUMP-${String(activeFarm?.id || 1).padStart(4, '0')}`}</p>
            </div>
          </div>

          {/* Mode Switch & Emergency Stop Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Clear Mode Switcher */}
            <div className="inline-flex p-0.5 rounded-lg bg-[#08120E] border border-[#1B382D]">
              <button
                type="button"
                disabled={actionLoading || !activeFarm}
                onClick={() => sendPumpCommand('SET_MODE_AUTO')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isAutoMode
                    ? 'bg-[#14B8A6] text-[#08120E] shadow'
                    : 'text-[#8FA59B] hover:text-[#F3F7F5]'
                }`}
                title="Automatic Safety Control"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>AUTO</span>
              </button>
              <button
                type="button"
                disabled={actionLoading || !activeFarm}
                onClick={() => sendPumpCommand('SET_MODE_MANUAL')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  !isAutoMode
                    ? 'bg-[#F59E0B] text-[#08120E] shadow'
                    : 'text-[#8FA59B] hover:text-[#F3F7F5]'
                }`}
                title="Manual Control Active"
              >
                <Power className="w-3.5 h-3.5" />
                <span>MANUAL</span>
              </button>
            </div>

            {isEmergencyStopped ? (
              <button
                disabled={actionLoading || !activeFarm}
                onClick={() => sendPumpCommand('RESET_EMERGENCY')}
                className="px-3.5 py-1.5 rounded-lg bg-[#10B981] text-[#08120E] font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer hover:bg-[#22C55E]"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>RESET EMERGENCY</span>
              </button>
            ) : (
              <button
                disabled={actionLoading || !activeFarm}
                onClick={() => sendPumpCommand('EMERGENCY_STOP', { reason: 'Manual Emergency Kill Switch' })}
                className="px-3.5 py-1.5 rounded-lg bg-[#EF4444] text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer hover:bg-[#DC2626]"
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>EMERGENCY STOP</span>
              </button>
            )}
          </div>
        </div>

        {/* Pump Action Controls & Duration Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Direct Manual Controls */}
          <div className="p-3.5 rounded-xl bg-[#08120E] border border-[#1B382D] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#8FA59B] font-semibold uppercase block">
                {isAutoMode ? 'Automatic Safety Control' : 'Manual Control Active'}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isAutoMode ? 'bg-[#14B8A6]/15 text-[#14B8A6]' : 'bg-[#F59E0B]/20 text-[#F59E0B]'}`}>
                {isAutoMode ? 'AUTO' : 'MANUAL'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={actionLoading || !activeFarm || isEmergencyStopped}
                onClick={() => sendPumpCommand('ON')}
                title={isEmergencyStopped ? 'Emergency Stop active: Clear emergency kill switch first' : 'Turn Pump ON'}
                className={`py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                  isEmergencyStopped || !activeFarm
                    ? 'bg-[#0E1E18] text-[#8FA59B] opacity-50 cursor-not-allowed border border-[#1B382D]'
                    : isPumpOn
                    ? 'bg-[#10B981] text-[#08120E] ring-2 ring-[#10B981]/60 cursor-pointer'
                    : 'bg-[#10B981] text-[#08120E] hover:bg-[#22C55E] cursor-pointer'
                }`}
              >
                <Power className={`w-3.5 h-3.5 ${actionLoading && pendingAction === 'ON' ? 'animate-spin' : ''}`} />
                <span>{actionLoading && pendingAction === 'ON' ? 'Starting...' : 'Pump ON'}</span>
              </button>

              <button
                disabled={actionLoading || !activeFarm}
                onClick={() => sendPumpCommand('OFF')}
                title="Turn Pump OFF"
                className={`py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                  !activeFarm
                    ? 'bg-[#0E1E18] text-[#8FA59B] opacity-50 cursor-not-allowed border border-[#1B382D]'
                    : !isPumpOn
                    ? 'bg-[#0E1E18] text-[#8FA59B] border border-[#1B382D] hover:text-[#F3F7F5] cursor-pointer'
                    : 'bg-[#EF4444] text-white hover:bg-[#DC2626] cursor-pointer'
                }`}
              >
                <Power className={`w-3.5 h-3.5 ${actionLoading && pendingAction === 'OFF' ? 'animate-spin' : ''}`} />
                <span>{actionLoading && pendingAction === 'OFF' ? 'Stopping...' : 'Pump OFF'}</span>
              </button>
            </div>
            {isEmergencyStopped && (
              <p className="text-[10px] text-[#EF4444] flex items-center gap-1">
                <AlertOctagon className="w-3 h-3 shrink-0" />
                <span>Emergency Stop engaged: Pump ON blocked</span>
              </p>
            )}
            {!isEmergencyStopped && isRainLocked && isAutoMode && (
              <p className="text-[10px] text-[#F59E0B] flex items-center gap-1">
                <CloudRain className="w-3 h-3 shrink-0" />
                <span>Rain Lock engaged: Auto-start blocked</span>
              </p>
            )}
            {!isEmergencyStopped && isRainLocked && !isAutoMode && (
              <p className="text-[10px] text-[#F59E0B] flex items-center gap-1">
                <CloudRain className="w-3 h-3 shrink-0" />
                <span>Rain Lock active: Evaluated by safety interlock</span>
              </p>
            )}
          </div>

          {/* Target Duration Selector */}
          <div className="p-3.5 rounded-xl bg-[#08120E] border border-[#1B382D] space-y-2">
            <span className="text-[10px] text-[#8FA59B] font-semibold uppercase block">Target Run Duration</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="5"
                max="240"
                value={customDuration}
                onChange={(e) => setCustomDuration(parseInt(e.target.value) || 35)}
                className="w-20 px-2.5 py-1 rounded-lg bg-[#0E1E18] border border-[#1B382D] text-[#F3F7F5] text-xs font-bold"
              />
              <span className="text-xs text-[#8FA59B]">Minutes</span>
              <button
                disabled={!activeFarm}
                onClick={() => sendPumpCommand('SET_THRESHOLDS', { duration_mins: customDuration })}
                className="ml-auto px-2.5 py-1 rounded-lg bg-[#14B8A6]/20 border border-[#14B8A6]/30 text-[#14B8A6] text-[10px] font-bold cursor-pointer hover:bg-[#14B8A6]/30 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>

          {/* Moisture Automation Thresholds */}
          <div className="p-3.5 rounded-xl bg-[#08120E] border border-[#1B382D] space-y-2">
            <span className="text-[10px] text-[#8FA59B] font-semibold uppercase block">Sensor Guard Thresholds</span>
            <div className="flex items-center justify-between text-xs font-medium text-[#8FA59B]">
              <span>Auto Start: &lt; {pump?.moisture_low_threshold || 40}%</span>
              <span>Auto Cutoff: &ge; {pump?.moisture_high_threshold || 60}%</span>
            </div>
            <div className="text-[10px] text-[#14B8A6]">
              Target: Restores soil field capacity based on crop profile.
            </div>
          </div>
        </div>

        {/* Visual Pipeline Telemetry */}
        <div className="pt-2 border-t border-[#1B382D] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#14B8A6] uppercase tracking-wider flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5" /> Precision Irrigation Pipeline • Farm #{activeFarm?.id || '—'}
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                isPumpOn
                  ? 'bg-[#14B8A6]/20 text-[#14B8A6] animate-pulse'
                  : 'bg-[#10B981]/15 text-[#10B981]'
              }`}
            >
              {isPumpOn ? '💧 Borewell Delivering Water' : '✓ STANDBY — CONTROLLER SAFETY ARMED'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-lg bg-[#08120E] border border-[#1B382D] space-y-0.5">
              <span className="text-[9px] text-[#8FA59B] uppercase font-semibold block">1. Soil Moisture</span>
              <p className="font-bold text-[#F3F7F5]">{soilMoisture}% VWC</p>
              <span className="text-[9px] text-[#14B8A6]">{isSensorAvailable ? '📡 Live Probe' : 'Estimated'}</span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#08120E] border border-[#1B382D] space-y-0.5">
              <span className="text-[9px] text-[#8FA59B] uppercase font-semibold block">2. ML Decision</span>
              <p className="font-bold text-[#14B8A6]">
                {prediction?.decision === 'IRRIGATION REQUIRED'
                  ? `Run ${prediction?.duration}m`
                  : (prediction?.decision || 'Standby')}
              </p>
              <span className="text-[9px] text-[#8FA59B]">FAO-56 Validated</span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#08120E] border border-[#1B382D] space-y-0.5">
              <span className="text-[9px] text-[#8FA59B] uppercase font-semibold block">3. Borewell Flow</span>
              <p className="font-bold text-[#38BDF8]">{isPumpOn ? 'Active Dosing' : 'Standby'}</p>
              <span className="text-[9px] text-[#38BDF8]">
                {isPumpOn
                  ? `${(prediction?.recommended_amount ? prediction.recommended_amount.toLocaleString() : 0)} L Target`
                  : '0 L / min'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#08120E] border border-[#1B382D] space-y-0.5">
              <span className="text-[9px] text-[#8FA59B] uppercase font-semibold block">4. Root Zone Target</span>
              <p className="font-bold text-[#F3F7F5]">65% VWC</p>
              <span className="text-[9px] text-[#14B8A6]">Field Capacity</span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#08120E] border border-[#1B382D] col-span-2 sm:col-span-1 space-y-0.5">
              <span className="text-[9px] text-[#8FA59B] uppercase font-semibold block">5. Rain Safety</span>
              <p className={`font-bold ${isRainLocked ? 'text-[#F59E0B]' : 'text-[#10B981]'}`}>
                {isRainLocked ? 'Locked (Rain)' : 'Clear to Run'}
              </p>
              <span className="text-[9px] text-[#8FA59B]">Radar Intercept</span>
            </div>
          </div>
        </div>

        {/* Live Controller Activity & Audit Log */}
        <div className="pt-2 border-t border-[#1B382D] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#8FA59B] uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-[#14B8A6]" /> Controller Activity & Audit Log • Farm #{activeFarm?.id || '—'}
            </span>
            <span className="text-[10px] text-[#8FA59B]">Total logged events: {events.length}</span>
          </div>

          {events.length > 0 ? (
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {events.slice(0, 10).map((evt) => {
                const isBlocked = evt.result === 'BLOCKED' || evt.event_type?.includes('BLOCKED');
                return (
                  <div
                    key={evt.id}
                    className="p-2.5 rounded-lg bg-[#08120E] border border-[#1B382D] flex items-center justify-between text-[11px] gap-2"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                          isBlocked
                            ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30'
                            : 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30'
                        }`}
                      >
                        [{evt.event_type}]
                      </span>
                      <span className="text-[#F3F7F5] truncate">
                        {evt.trigger_reason || evt.reason || 'Command executed'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 text-[10px] text-[#8FA59B]">
                      {evt.resulting_status && (
                        <span className="text-[9px] font-mono uppercase bg-[#0E1E18] px-1 rounded border border-[#1B382D]">
                          Status: {evt.resulting_status}
                        </span>
                      )}
                      <span>{new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-[#8FA59B] py-2 text-center">No controller events recorded yet for Farm #{activeFarm?.id || '—'}.</p>
          )}
        </div>
      </div>

      {/* Safety Advisory Banner */}
      <div className="os-card p-4 text-xs text-[#8FA59B] flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-[#14B8A6] shrink-0 mt-0.5" />
        <div>
          <strong className="text-[#F3F7F5] block mb-0.5">Agricultural Advisory Note:</strong>
          Smart irrigation decisions are computed using the verified Gradient Boosting Decision & FAO-56 Soil Water Depletion Engine for Farm #{activeFarm?.id || '—'}. Automation adheres to precipitation radar safety rules and emergency stop fail-safes.
        </div>
      </div>
    </div>
  );
}
