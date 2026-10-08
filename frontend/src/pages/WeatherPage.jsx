import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useFarm } from '../context/FarmContext';
import {
  CloudSun,
  Wind,
  Droplets,
  Sun,
  AlertTriangle,
  Calendar,
  Sparkles,
  CloudRain,
  ArrowRight,
  Sprout,
  MapPin,
  RefreshCw,
  Loader2,
  Thermometer,
  ShieldAlert,
  AlertOctagon,
  Eye,
  Navigation,
  Sunrise,
  Sunset,
  CheckCircle2,
  Clock,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import offlineStorage from '../services/offlineStorage';

export default function WeatherPage() {
  const { farms, activeFarm, setActiveFarm } = useFarm();
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const fetchWeatherIntelligence = (customLat = null, customLon = null) => {
    if (!activeFarm && !customLat) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const params = {};
    if (activeFarm) params.farm_id = activeFarm.id;
    if (customLat !== null && customLon !== null) {
      params.lat = customLat;
      params.lon = customLon;
    }

    api.get('/weather/intelligence', { params })
      .then((res) => {
        setWeatherData(res.data);
        if (activeFarm) {
          offlineStorage.saveWeather(activeFarm.id, res.data);
        }
      })
      .catch((err) => {
        console.warn('Network error or API failure, checking offline cache:', err);
        if (activeFarm) {
          const cached = offlineStorage.getWeather(activeFarm.id);
          if (cached) {
            setWeatherData(cached);
            showToast('📡 Loaded offline weather telemetry cache.');
          } else {
            setError(err.response?.data?.detail || 'Unable to fetch real-time meteorological intelligence.');
          }
        } else {
          setError(err.response?.data?.detail || 'Unable to load weather intelligence.');
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setGpsCoords(null);
    if (activeFarm) {
      fetchWeatherIntelligence();
    }
  }, [activeFarm?.id]);

  const handleUseBrowserGps = () => {
    if (!navigator.geolocation) {
      alert('Browser geolocation is not supported on this device.');
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(4));
        const lon = parseFloat(pos.coords.longitude.toFixed(4));
        setGpsCoords({ lat, lon });
        setGpsLoading(false);
        showToast(`📍 Acquired GPS Coordinates: ${lat}°N, ${lon}°E`);
        fetchWeatherIntelligence(lat, lon);
      },
      (err) => {
        setGpsLoading(false);
        console.error('Geolocation error:', err);
        alert('Could not acquire GPS position. Please check your browser location permissions.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // 1. EMPTY STATE: NO FARM ADDED YET
  if (!activeFarm || farms.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto selection:bg-[#10B981] selection:text-black">
        <div className="os-card p-8 sm:p-12 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20 flex items-center justify-center mx-auto shadow-sm">
            <CloudSun className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-[#F3F7F5]">No Farm Configured Yet</h2>
            <p className="text-xs sm:text-sm text-[#8FA59B] max-w-md mx-auto leading-relaxed">
              Add your farm plot to unlock hyper-local weather intelligence, 7-day microclimate projections, and crop-specific operation windows.
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

  // 2. LOADING STATE
  if (loading && !weatherData) {
    return (
      <div className="p-12 text-center text-[#8FA59B] text-xs flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="w-8 h-8 text-[#10B981] animate-spin" />
        <p className="font-semibold text-sm text-[#F3F7F5]">Syncing Weather Telemetry Feeds...</p>
        <p className="text-[#8FA59B] text-xs">Acquiring Open-Meteo microclimate data for {activeFarm.name}</p>
      </div>
    );
  }

  // 3. ERROR STATE
  if (error && !weatherData) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <div className="os-card p-6 border-[#EF4444]/30 space-y-3">
          <AlertTriangle className="w-8 h-8 text-[#EF4444] mx-auto" />
          <h3 className="text-base font-bold text-[#F3F7F5]">Weather Telemetry Sync Failed</h3>
          <p className="text-xs text-[#8FA59B]">{error}</p>
          <button
            onClick={() => fetchWeatherIntelligence()}
            className="os-btn-primary px-5 py-2 text-xs inline-flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Sync
          </button>
        </div>
      </div>
    );
  }

  const isLocationMissing = weatherData?.is_location_missing;
  const curr = weatherData?.current_weather;
  const forecast = weatherData?.forecast || [];
  const alerts = weatherData?.alerts || [];
  const farmingAdvice = weatherData?.farming_advice || [];
  const irrigationAdvice = weatherData?.irrigation_advice;
  const fertilizerAdvice = weatherData?.fertilizer_advice;
  const cropHealthAdvice = weatherData?.crop_health_advice;

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

      {/* Header & Microclimate Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/20 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span> Live Weather Radar Feed
            </span>
            <span className="text-[10px] font-medium text-[#8FA59B]">
              Open-Meteo High-Res Microclimate Engine
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F3F7F5] flex items-center gap-2.5">
            <CloudSun className="w-6 h-6 text-[#F59E0B]" />
            <span>Weather Intelligence & Field Operations</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8FA59B] mt-0.5">
            Real-time microclimate conditions and operational windows for{' '}
            <strong className="text-[#F3F7F5] font-semibold">{activeFarm?.name}</strong> ({activeFarm?.crop || 'Crop'} • {activeFarm?.current_stage_override || 'Vegetative Stage'}).
          </p>
        </div>

        {/* Action Buttons */}
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
            onClick={handleUseBrowserGps}
            disabled={gpsLoading}
            className="os-btn-secondary text-xs px-3 py-2 flex items-center gap-1.5 cursor-pointer"
            title="Acquire live GPS coordinates"
          >
            {gpsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5 text-[#14B8A6]" />}
            <span>{gpsCoords ? 'Live GPS Active' : 'Detect GPS'}</span>
          </button>

          <button
            onClick={() => fetchWeatherIntelligence(gpsCoords?.lat, gpsCoords?.lon)}
            disabled={loading}
            className="os-btn-secondary p-2 text-xs flex items-center justify-center cursor-pointer"
            title="Refresh Telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* MISSING LOCATION WARNING */}
      {isLocationMissing && (
        <div className="os-card p-5 border-[#F59E0B]/30 bg-[#F59E0B]/5 space-y-3">
          <div className="flex items-center gap-2 font-bold text-[#F59E0B] text-xs">
            <AlertTriangle className="w-4 h-4" />
            <span>Farm GPS Coordinates Not Configured</span>
          </div>
          <p className="text-xs text-[#8FA59B] leading-relaxed">
            {weatherData.location_prompt || 'Configure your farm coordinates in Farm Setup or use device GPS to receive hyper-local precipitation radar and crop safety advisories.'}
          </p>
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <Link
              to="/farm-setup"
              className="os-btn-primary px-3.5 py-1.5 text-xs inline-flex items-center gap-1.5"
            >
              <span>Set Farm Location</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={handleUseBrowserGps}
              className="os-btn-secondary px-3.5 py-1.5 text-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5 text-[#14B8A6]" />
              <span>Detect Current GPS</span>
            </button>
          </div>
        </div>
      )}

      {/* CURRENT WEATHER HERO CARD */}
      {curr && (
        <div className="os-card-elevated p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Main Temperature & Condition */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#10B981] uppercase tracking-wider">
                Current Microclimate
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/25">
                🛰️ Live Open-Meteo
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-extrabold text-[#F3F7F5] tracking-tight">{curr.temperature}°C</span>
              {curr.feels_like && (
                <span className="text-xs text-[#8FA59B] font-medium">
                  Feels like <strong className="text-[#F3F7F5] font-semibold">{curr.feels_like}°C</strong>
                </span>
              )}
            </div>

            <div>
              <p className="text-sm font-bold text-[#F3F7F5]">{curr.condition}</p>
              <p className="text-xs text-[#8FA59B] mt-0.5 leading-relaxed">{curr.description}</p>
            </div>

            <div className="pt-2 space-y-1 text-xs border-t border-[#1B382D]">
              <p className="text-[#F3F7F5] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                <span>{weatherData?.location_name || activeFarm?.location_name || 'Farm Plot'}</span>
              </p>
              <p className="text-[11px] text-[#8FA59B] font-mono">
                Lat: {weatherData?.latitude?.toFixed(4)}°N • Lon: {weatherData?.longitude?.toFixed(4)}°E
              </p>
            </div>

            {/* Sunrise & Sunset */}
            <div className="flex items-center gap-4 text-xs text-[#8FA59B] pt-1">
              <span className="flex items-center gap-1 text-[#F59E0B]">
                <Sunrise className="w-3.5 h-3.5" /> {curr.sunrise || '06:04'} AM
              </span>
              <span className="flex items-center gap-1 text-[#14B8A6]">
                <Sunset className="w-3.5 h-3.5" /> {curr.sunset || '18:32'} PM
              </span>
            </div>
          </div>

          {/* 4 Telemetry Metric Tiles */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t lg:border-t-0 lg:border-l border-[#1B382D] pt-4 lg:pt-0 lg:pl-6">
            {/* 1. Relative Humidity */}
            <div className="p-3.5 rounded-xl bg-[#08120E]/70 border border-[#1B382D] space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-[#8FA59B]">
                <Droplets className="w-3.5 h-3.5 text-[#14B8A6]" /> Humidity
              </div>
              <p className="text-xl font-bold text-[#F3F7F5]">{curr.humidity}%</p>
              <span className="text-[10px] text-[#14B8A6] block font-medium">
                {curr.humidity >= 70 ? '🦠 Fungal Alert' : 'Optimal Zone'}
              </span>
            </div>

            {/* 2. Wind Speed */}
            <div className="p-3.5 rounded-xl bg-[#08120E]/70 border border-[#1B382D] space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-[#8FA59B]">
                <Wind className="w-3.5 h-3.5 text-[#10B981]" /> Wind Speed
              </div>
              <p className="text-xl font-bold text-[#F3F7F5]">
                {curr.wind_speed} <span className="text-xs font-normal text-[#8FA59B]">km/h</span>
              </p>
              <span className="text-[10px] text-[#10B981] block font-medium">
                {curr.wind_speed >= 18 ? '🚫 Hold Foliar Spray' : '✓ Safe Spraying'}
              </span>
            </div>

            {/* 3. Rain Probability */}
            <div className="p-3.5 rounded-xl bg-[#08120E]/70 border border-[#1B382D] space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-[#8FA59B]">
                <CloudRain className="w-3.5 h-3.5 text-[#14B8A6]" /> Rain Prob.
              </div>
              <p className="text-xl font-bold text-[#14B8A6]">{curr.rain_probability}%</p>
              <span className="text-[10px] text-[#8FA59B] block font-medium">
                {curr.rainfall_mm > 0 ? `${curr.rainfall_mm} mm forecast` : 'Minimal rain'}
              </span>
            </div>

            {/* 4. UV Solar Radiation */}
            <div className="p-3.5 rounded-xl bg-[#08120E]/70 border border-[#1B382D] space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-[#8FA59B]">
                <Sun className="w-3.5 h-3.5 text-[#F59E0B]" /> UV Index
              </div>
              <p className="text-xl font-bold text-[#F3F7F5]">{curr.uv_index}</p>
              <span className="text-[10px] text-[#F59E0B] block font-medium">Solar Exposure</span>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE WEATHER HAZARD ALERTS */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#F59E0B]" />
            <h2 className="text-sm font-bold text-[#F3F7F5] uppercase tracking-wide">Weather Hazards & Alerts</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.map((alt, idx) => (
              <div
                key={idx}
                className={`os-card p-4 space-y-2 ${
                  alt.severity === 'danger'
                    ? 'border-[#EF4444]/40 bg-[#EF4444]/5'
                    : alt.severity === 'warning'
                    ? 'border-[#F59E0B]/40 bg-[#F59E0B]/5'
                    : 'border-[#14B8A6]/40 bg-[#14B8A6]/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#F3F7F5] text-xs flex items-center gap-1.5">
                    {alt.severity === 'danger' ? (
                      <AlertOctagon className="w-4 h-4 text-[#EF4444] shrink-0" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-[#F59E0B] shrink-0" />
                    )}
                    {alt.title}
                  </span>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                      alt.severity === 'danger'
                        ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30'
                        : alt.severity === 'warning'
                        ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30'
                        : 'bg-[#14B8A6]/20 text-[#14B8A6] border border-[#14B8A6]/30'
                    }`}
                  >
                    {alt.alert_type}
                  </span>
                </div>
                <p className="text-xs text-[#8FA59B] leading-relaxed">{alt.description}</p>
                {alt.action_required && (
                  <div className="text-[11px] font-medium text-[#F3F7F5] pt-1">
                    <span className="text-[#F59E0B] font-bold">Action Required:</span> {alt.action_required}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* "WHAT THIS MEANS FOR YOUR FARM TODAY" (Prominent Actionable Advice) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#10B981]" />
            <h2 className="text-sm font-bold text-[#F3F7F5] uppercase tracking-wide">
              What This Means For Your Farm Today (Agronomic Operations)
            </h2>
          </div>
          <span className="text-[11px] text-[#8FA59B]">Synthesized from live microclimate + phenology</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {farmingAdvice.map((adv, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.05 }}
              className={`os-card p-4 space-y-2.5 ${
                adv.type === 'warning'
                  ? 'border-[#F59E0B]/30'
                  : adv.type === 'danger'
                  ? 'border-[#EF4444]/30'
                  : 'border-[#10B981]/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs text-[#F3F7F5] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                  {adv.title}
                </h3>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                    adv.type === 'warning'
                      ? 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'
                      : adv.type === 'danger'
                      ? 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
                      : 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                  }`}
                >
                  {adv.category || 'Advisory'}
                </span>
              </div>

              <p className="text-xs text-[#8FA59B] leading-relaxed">
                {adv.message}
              </p>

              {adv.why && (
                <div className="p-2.5 rounded-lg bg-[#08120E] border border-[#1B382D] text-[11px] text-[#8FA59B] space-y-0.5">
                  <span className="text-[#10B981] font-semibold block">💡 Why this matters:</span>
                  <p className="leading-relaxed">{adv.why}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* THREE INTEGRATED DOMAIN INTERLOCKS: IRRIGATION, FERTILIZER, CROP HEALTH */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card 1: Irrigation Interlock */}
        {irrigationAdvice && (
          <div className="os-card p-5 space-y-3.5 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#F3F7F5] flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-[#14B8A6]" />
                  Smart Irrigation Interlock
                </span>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                    irrigationAdvice.decision.includes('Delay')
                      ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30'
                      : 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30'
                  }`}
                >
                  {irrigationAdvice.status_badge}
                </span>
              </div>

              <p className="text-xs font-bold text-[#F3F7F5]">{irrigationAdvice.decision}</p>
              <p className="text-xs text-[#8FA59B] leading-relaxed">{irrigationAdvice.reason}</p>

              <div className="p-2.5 rounded-lg bg-[#08120E] border border-[#1B382D] text-[11px] space-y-0.5">
                <span className="font-semibold text-[#14B8A6] block">⏰ Recommended Window:</span>
                <p className="text-[#8FA59B]">{irrigationAdvice.recommended_timing}</p>
                <p className="text-[#8FA59B]">{irrigationAdvice.water_saving_litres}</p>
              </div>
            </div>

            <Link
              to="/irrigation"
              className="os-btn-secondary py-2 px-3 text-xs flex items-center justify-between"
            >
              <span>Open Irrigation Command</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Card 2: Fertilizer Runoff Safety */}
        {fertilizerAdvice && (
          <div className="os-card p-5 space-y-3.5 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#F3F7F5] flex items-center gap-1.5">
                  <Sprout className="w-4 h-4 text-[#10B981]" />
                  Fertilizer Runoff Safety
                </span>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                    fertilizerAdvice.safety_status.includes('Delay')
                      ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30'
                      : 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30'
                  }`}
                >
                  {fertilizerAdvice.status_badge}
                </span>
              </div>

              <p className="text-xs font-bold text-[#F3F7F5]">{fertilizerAdvice.safety_status}</p>
              <p className="text-xs text-[#8FA59B] leading-relaxed">{fertilizerAdvice.warning}</p>

              <div className="p-2.5 rounded-lg bg-[#08120E] border border-[#1B382D] text-[11px] space-y-0.5">
                <span className="font-semibold text-[#10B981] block">🌱 Agronomic Guidance:</span>
                <p className="text-[#8FA59B]">{fertilizerAdvice.application_window}</p>
                <p className="text-[#8FA59B]">{fertilizerAdvice.agronomic_recommendation}</p>
              </div>
            </div>

            <Link
              to="/fertilizer"
              className="os-btn-secondary py-2 px-3 text-xs flex items-center justify-between"
            >
              <span>Open Fertilizer Engine</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Card 3: Fungal & Pest Pathology */}
        {cropHealthAdvice && (
          <div className="os-card p-5 space-y-3.5 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#F3F7F5] flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-[#14B8A6]" />
                  Pathogen & Fungal Risk
                </span>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                    cropHealthAdvice.fungal_risk_level.includes('High')
                      ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30'
                      : 'bg-[#14B8A6]/20 text-[#14B8A6] border border-[#14B8A6]/30'
                  }`}
                >
                  {cropHealthAdvice.risk_badge}
                </span>
              </div>

              <p className="text-xs font-bold text-[#F3F7F5]">{cropHealthAdvice.fungal_risk_level}</p>
              <p className="text-xs text-[#8FA59B] leading-relaxed">{cropHealthAdvice.scouting_advice}</p>

              <div className="p-2.5 rounded-lg bg-[#08120E] border border-[#1B382D] text-[11px] space-y-0.5">
                <span className="font-semibold text-[#14B8A6] block">🦠 Pathogens of Concern:</span>
                <p className="text-[#8FA59B] truncate">
                  {(cropHealthAdvice.pathogens_of_concern || []).join(', ')}
                </p>
                <p className="text-[#8FA59B]">{cropHealthAdvice.preventive_action}</p>
              </div>
            </div>

            <Link
              to="/crop-health"
              className="os-btn-secondary py-2 px-3 text-xs flex items-center justify-between"
            >
              <span>Scan Crop Health</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* 7-DAY AGRICULTURAL MICROCLIMATE FORECAST */}
      {forecast.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#F3F7F5] uppercase tracking-wide flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#10B981]" />
              <span>7-Day Agricultural Microclimate Outlook</span>
            </h2>
            <span className="text-[11px] text-[#8FA59B]">Daily forecast sync</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {forecast.map((day, idx) => (
              <div
                key={idx}
                className="os-card p-3 space-y-2 text-center text-xs"
              >
                <span className="font-bold text-[#10B981] text-xs block">{day.day}</span>
                <div className="text-base font-bold text-[#F3F7F5]">
                  {Math.round(day.high)}° <span className="text-xs text-[#8FA59B] font-normal">/ {Math.round(day.low)}°</span>
                </div>
                <div className="text-[10px] text-[#14B8A6] font-medium">
                  🌧️ {day.rain_prob}% Rain {day.rainfall_mm > 0 ? `(${day.rainfall_mm}mm)` : ''}
                </div>
                <div className="text-[10px] text-[#8FA59B]">
                  💨 {day.wind_speed_max} km/h
                </div>
                <p className="text-[10px] text-[#8FA59B] line-clamp-2 leading-tight">
                  {day.condition}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
