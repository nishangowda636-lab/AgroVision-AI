import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFarm } from '../context/FarmContext';
import { useAuth } from '../context/AuthContext';
import FarmMap, { reverseGeocode } from '../components/FarmMap';
import api from '../services/api';
import {
  Sprout,
  MapPin,
  Droplets,
  Calendar,
  Check,
  ArrowRight,
  ArrowLeft,
  Search,
  CheckCircle2,
  Sparkles,
  Cpu,
  Layers,
  Leaf,
  Trash2,
  AlertTriangle,
  Plus,
  Navigation,
  Loader2,
  ShieldAlert,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FarmSetup() {
  const { user, token } = useAuth();
  const { fetchFarms, farms, activeFarm, setActiveFarm, deleteFarm } = useFarm();
  const navigate = useNavigate();

  // Mode: 'manage' (view existing farms) or 'wizard' (create new farm)
  const [viewMode, setViewMode] = useState(farms.length > 0 ? 'manage' : 'wizard');
  const [step, setStep] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (farms.length === 0) {
      setViewMode('wizard');
    }
  }, [farms.length]);

  // Delete modal state
  const [deletingFarm, setDeletingFarm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // GPS locating state
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('idle'); // 'idle' | 'locating' | 'success' | 'error'
  const [gpsMessage, setGpsMessage] = useState('');
  const [gpsError, setGpsError] = useState('');

  const defaultFormState = {
    name: '',
    size_acres: 1.0,
    location_name: '',
    latitude: 12.9716,
    longitude: 77.5946,
    soil_type: 'Loam',
    soil_ph: 6.5,
    nitrogen: 120.0,
    phosphorus: 35.0,
    potassium: 150.0,
    water_source: 'Borewell',
    irrigation_method: 'Drip Irrigation',
    crop: 'Tomato',
    crop_variety: 'Hybrid F1',
    sowing_date: new Date().toISOString().split('T')[0],
    expected_harvest: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]
  };

  const [formData, setFormData] = useState(defaultFormState);
  const [saving, setSaving] = useState(false);
  const [searchingLocation, setSearchingLocation] = useState(false);

  const stepsList = [
    { num: 1, label: 'Farm Information' },
    { num: 2, label: 'Location & GPS' },
    { num: 3, label: 'Soil & NPK' },
    { num: 4, label: 'Crop & Irrigation' },
    { num: 5, label: 'Complete' },
  ];

  const handleLocationSelect = (lat, lng, locationName) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      location_name: locationName || prev.location_name || `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`
    }));
  };

  // Browser Geolocation API for Current Location
  const handleUseCurrentLocation = () => {
    if (isLocatingGps) return;

    if (!('geolocation' in navigator) || !navigator.geolocation) {
      const msg = 'Geolocation is not supported by this browser.';
      setGpsError(msg);
      setGpsStatus('error');
      alert(msg);
      return;
    }

    setIsLocatingGps(true);
    setGpsStatus('locating');
    setGpsError('');
    setGpsMessage('Locating...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setIsLocatingGps(false);
        setGpsStatus('success');
        setGpsError('');
        setGpsMessage('Location detected');

        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        // Immediately update coordinates so map marker and lat/lng fields update instantly
        const defaultLoc = `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          location_name: prev.location_name || defaultLoc
        }));

        // Asynchronously resolve address name without blocking coordinate updates
        try {
          const resolvedName = await reverseGeocode(lat, lng);
          if (resolvedName) {
            setFormData((prev) => ({
              ...prev,
              location_name: resolvedName
            }));
          }
        } catch (err) {
          console.warn('Reverse geocode error:', err);
        }

        // Return button state to normal after 2.5s
        setTimeout(() => {
          setGpsStatus('idle');
          setGpsMessage('');
        }, 2500);
      },
      (error) => {
        setIsLocatingGps(false);
        setGpsStatus('error');
        setGpsMessage('');

        let msg = 'Could not acquire GPS location.';
        if (error.code === 1 || error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission was denied. Please allow location access in your browser and try again.';
        } else if (error.code === 2 || error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Your current location could not be determined. Please check your device location/GPS and try again.';
        } else if (error.code === 3 || error.code === error.TIMEOUT) {
          msg = 'Location request timed out. Please try again.';
        }

        setGpsError(msg);
        alert(msg);

        setTimeout(() => {
          setGpsStatus('idle');
        }, 5000);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const handleFindLocation = async () => {
    if (!formData.location_name.trim()) return;
    setSearchingLocation(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.location_name)}&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const resolvedName = await reverseGeocode(lat, lng) || data[0].display_name.split(',').slice(0, 3).join(', ');
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          location_name: resolvedName
        }));
      } else {
        alert(`Location "${formData.location_name}" not found. Try searching for a nearby district, taluk, or village.`);
      }
    } catch {
      alert('Error finding location on map.');
    } finally {
      setSearchingLocation(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!token || !user) {
      alert('You must be signed in to create a farm. Redirecting to login...');
      navigate('/login');
      return;
    }
    if (!formData.name.trim()) {
      alert('Please provide a Farm Name in Step 1.');
      setStep(1);
      return;
    }

    setSaving(true);
    try {
      await api.post('/farms', formData);
      await fetchFarms();
      setIsCompleted(true);
      setStep(5);
    } catch (err) {
      if (err.response?.status === 401) {
        alert('Your session has expired. Please sign in again.');
        navigate('/login');
        return;
      }
      alert('Error creating farm: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingFarm) return;
    setIsDeleting(true);
    const res = await deleteFarm(deletingFarm.id);
    setIsDeleting(false);
    setDeletingFarm(null);

    if (!res.success) {
      alert('Failed to delete farm: ' + res.error);
    }
  };

  const startNewFarmWizard = () => {
    setFormData({
      ...defaultFormState,
      sowing_date: new Date().toISOString().split('T')[0],
      expected_harvest: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]
    });
    setStep(1);
    setIsCompleted(false);
    setViewMode('wizard');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto selection:bg-emerald-500 selection:text-black">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#1B382D] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="os-status-pill os-status-emerald">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Geospatial Farm Registry
            </span>
            <span className="text-[11px] text-[#8FA59B]">GPS & Soil Profiler</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-[#F3F7F5] flex items-center gap-2.5">
            <Sprout className="w-7 h-7 text-emerald-400" />
            <span>Farm Setup & Land Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8FA59B] mt-1">
            Configure your farm plots, GPS telemetry, soil chemistry, and crop cycle schedules.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {farms.length > 0 && viewMode === 'manage' && (
            <button
              onClick={startNewFarmWizard}
              className="os-btn-primary flex items-center gap-1.5 text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Farm</span>
            </button>
          )}

          {farms.length > 0 && viewMode === 'wizard' && !isCompleted && (
            <button
              onClick={() => setViewMode('manage')}
              className="os-btn-secondary text-xs"
            >
              ← View Registered Farms ({farms.length})
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: MANAGE EXISTING FARMS */}
      {viewMode === 'manage' && farms.length > 0 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-heading text-[#F3F7F5] flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Registered Farm Plots ({farms.length})</span>
            </h2>
            <span className="text-xs text-[#8FA59B]">
              Active: <strong className="text-emerald-400">{activeFarm?.name || 'None'}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {farms.map((farm) => {
              const isActive = activeFarm?.id === farm.id;
              return (
                <div
                  key={farm.id}
                  className={`os-card p-5 transition-all flex flex-col justify-between space-y-4 ${
                    isActive
                      ? 'border-emerald-400 bg-[#122820] ring-1 ring-emerald-400/50'
                      : 'hover:border-emerald-500/40'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-[#F3F7F5] flex items-center gap-1.5">
                        <Leaf className="w-4 h-4 text-emerald-400" />
                        {farm.name}
                      </span>
                      {isActive ? (
                        <span className="os-status-pill os-status-emerald">
                          Active Farm
                        </span>
                      ) : (
                        <button
                          onClick={() => setActiveFarm(farm)}
                          className="os-btn-secondary py-1 px-2.5 text-[10px]"
                        >
                          Select Plot
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-[#08120E] border border-[#1B382D]">
                        <span className="text-[10px] text-[#8FA59B] block">Cultivated Crop</span>
                        <span className="font-bold text-emerald-300">{farm.crop || 'Field Crop'}</span>
                        {farm.crop_variety && (
                          <span className="text-[10px] text-[#8FA59B] block truncate">{farm.crop_variety}</span>
                        )}
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#08120E] border border-[#1B382D]">
                        <span className="text-[10px] text-[#8FA59B] block">Land Area</span>
                        <span className="font-bold text-white">{farm.size_acres} Acres</span>
                        <span className="text-[10px] text-[#8FA59B] block">{farm.soil_type || 'Loam'}</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#08120E] border border-[#1B382D] text-[11px] text-[#8FA59B] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{farm.location_name || `${farm.latitude?.toFixed(4)}°N, ${farm.longitude?.toFixed(4)}°E`}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#1B382D] text-xs">
                    <button
                      onClick={() => {
                        setActiveFarm(farm);
                        navigate('/dashboard');
                      }}
                      className="text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open Command Center</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setDeletingFarm(farm)}
                      className="px-2.5 py-1 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: NO FARMS EMPTY STATE */}
      {viewMode === 'manage' && farms.length === 0 && (
        <div className="os-card p-14 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <Sprout className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl font-bold font-heading text-[#F3F7F5]">No Farm Added Yet</h3>
            <p className="text-xs text-[#8FA59B] max-w-md mx-auto leading-relaxed">
              Set up your first farm plot with GPS coordinates and soil parameters to receive AI weather alerts, irrigation dosing, and disease detection.
            </p>
          </div>
          <button
            onClick={startNewFarmWizard}
            className="os-btn-primary text-xs inline-flex items-center gap-1.5"
          >
            <span>Set Up Your Farm 🌱</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* VIEW 3: 5-STEP WIZARD */}
      {viewMode === 'wizard' && (
        <div className="space-y-6">
          {/* 5-Step Progress Indicator */}
          <div className="grid grid-cols-5 gap-2 bg-[#08120E] p-1.5 rounded-2xl border border-[#1B382D]">
            {stepsList.map((s) => (
              <div
                key={s.num}
                className={`py-2 text-center rounded-xl transition-all ${
                  step === s.num
                    ? 'bg-emerald-400 text-black font-bold shadow-sm'
                    : step > s.num
                    ? 'bg-[#1B382D] text-emerald-300 font-semibold'
                    : 'text-[#8FA59B] font-medium opacity-60'
                }`}
              >
                <span className="text-xs font-bold block sm:inline">{s.num}.</span>
                <span className="text-[10px] sm:text-xs ml-1 hidden md:inline">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Step Content Card */}
          <div className="os-card-elevated p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {/* STEP 1: Farm Basic Information */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <div className="border-b border-[#1B382D] pb-3">
                    <h3 className="text-base font-bold font-heading text-[#F3F7F5] flex items-center gap-2">
                      <Sprout className="w-4 h-4 text-emerald-400" />
                      <span>1. Farm Basic Information</span>
                    </h3>
                    <p className="text-xs text-[#8FA59B] mt-0.5">Name your farm plot and specify land area.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-[#8FA59B] block mb-1">Farm Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Kaveri Basin Organic Farm"
                        className="os-input w-full py-2.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#8FA59B] block mb-1">Farm Size (Acres) *</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        required
                        value={formData.size_acres}
                        onChange={(e) => setFormData({ ...formData, size_acres: parseFloat(e.target.value) || 1 })}
                        className="os-input w-full py-2.5 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-[#8FA59B] block mb-1">Primary Cultivated Crop</label>
                      <select
                        value={formData.crop}
                        onChange={(e) => setFormData({ ...formData, crop: e.target.value })}
                        className="os-input w-full py-2.5 text-xs cursor-pointer"
                      >
                        <optgroup label="🌱 Plantation & Spices" className="bg-[#081711] text-emerald-400 font-bold">
                          <option value="Coffee" className="bg-[#0E1E18] text-[#F3F7F5]">Coffee (Coffea arabica / robusta)</option>
                          <option value="Black Pepper" className="bg-[#0E1E18] text-[#F3F7F5]">Black Pepper (Piper nigrum)</option>
                          <option value="Cardamom" className="bg-[#0E1E18] text-[#F3F7F5]">Cardamom (Elettaria cardamomum)</option>
                          <option value="Arecanut" className="bg-[#0E1E18] text-[#F3F7F5]">Arecanut / Betel Nut (Areca catechu)</option>
                          <option value="Tea" className="bg-[#0E1E18] text-[#F3F7F5]">Tea (Camellia sinensis)</option>
                          <option value="Coconut" className="bg-[#0E1E18] text-[#F3F7F5]">Coconut (Cocos nucifera)</option>
                          <option value="Rubber" className="bg-[#0E1E18] text-[#F3F7F5]">Rubber (Hevea brasiliensis)</option>
                          <option value="Ginger" className="bg-[#0E1E18] text-[#F3F7F5]">Ginger (Zingiber officinale)</option>
                          <option value="Turmeric" className="bg-[#0E1E18] text-[#F3F7F5]">Turmeric (Curcuma longa)</option>
                        </optgroup>

                        <optgroup label="🌾 Cereals & Millets" className="bg-[#081711] text-emerald-400 font-bold">
                          <option value="Rice" className="bg-[#0E1E18] text-[#F3F7F5]">Rice / Paddy (Oryza sativa)</option>
                          <option value="Wheat" className="bg-[#0E1E18] text-[#F3F7F5]">Wheat (Triticum aestivum)</option>
                          <option value="Maize" className="bg-[#0E1E18] text-[#F3F7F5]">Maize / Corn (Zea mays)</option>
                          <option value="Ragi" className="bg-[#0E1E18] text-[#F3F7F5]">Finger Millet / Ragi (Eleusine coracana)</option>
                          <option value="Jowar" className="bg-[#0E1E18] text-[#F3F7F5]">Jowar / Sorghum (Sorghum bicolor)</option>
                          <option value="Bajra" className="bg-[#0E1E18] text-[#F3F7F5]">Bajra / Pearl Millet (Pennisetum glaucum)</option>
                          <option value="Barley" className="bg-[#0E1E18] text-[#F3F7F5]">Barley (Hordeum vulgare)</option>
                        </optgroup>

                        <optgroup label="🍅 Vegetables & Fruits" className="bg-[#081711] text-emerald-400 font-bold">
                          <option value="Tomato" className="bg-[#0E1E18] text-[#F3F7F5]">Tomato (Solanum lycopersicum)</option>
                          <option value="Chili" className="bg-[#0E1E18] text-[#F3F7F5]">Green Chili / Hot Pepper (Capsicum annuum)</option>
                          <option value="Potato" className="bg-[#0E1E18] text-[#F3F7F5]">Potato (Solanum tuberosum)</option>
                          <option value="Onion" className="bg-[#0E1E18] text-[#F3F7F5]">Onion (Allium cepa)</option>
                          <option value="Brinjal" className="bg-[#0E1E18] text-[#F3F7F5]">Brinjal / Eggplant (Solanum melongena)</option>
                          <option value="Cabbage" className="bg-[#0E1E18] text-[#F3F7F5]">Cabbage (Brassica oleracea)</option>
                          <option value="Banana" className="bg-[#0E1E18] text-[#F3F7F5]">Banana (Musa acuminata)</option>
                          <option value="Pomegranate" className="bg-[#0E1E18] text-[#F3F7F5]">Pomegranate (Punica granatum)</option>
                          <option value="Mango" className="bg-[#0E1E18] text-[#F3F7F5]">Mango (Mangifera indica)</option>
                        </optgroup>

                        <optgroup label="💵 Cash & Commercial Crops" className="bg-[#081711] text-emerald-400 font-bold">
                          <option value="Cotton" className="bg-[#0E1E18] text-[#F3F7F5]">Cotton (Gossypium hirsutum)</option>
                          <option value="Sugarcane" className="bg-[#0E1E18] text-[#F3F7F5]">Sugarcane (Saccharum officinarum)</option>
                          <option value="Tobacco" className="bg-[#0E1E18] text-[#F3F7F5]">Tobacco (Nicotiana tabacum)</option>
                        </optgroup>

                        <optgroup label="🥜 Pulses & Oilseeds" className="bg-[#081711] text-emerald-400 font-bold">
                          <option value="Groundnut" className="bg-[#0E1E18] text-[#F3F7F5]">Groundnut / Peanut (Arachis hypogaea)</option>
                          <option value="Soybean" className="bg-[#0E1E18] text-[#F3F7F5]">Soybean (Glycine max)</option>
                          <option value="Mustard" className="bg-[#0E1E18] text-[#F3F7F5]">Mustard (Brassica nigra)</option>
                          <option value="Gram" className="bg-[#0E1E18] text-[#F3F7F5]">Gram / Chickpea (Cicer arietinum)</option>
                          <option value="Arhar" className="bg-[#0E1E18] text-[#F3F7F5]">Pigeon Pea / Tur (Cajanus cajan)</option>
                          <option value="Moong" className="bg-[#0E1E18] text-[#F3F7F5]">Green Gram / Moong (Vigna radiata)</option>
                          <option value="Urad" className="bg-[#0E1E18] text-[#F3F7F5]">Black Gram / Urad (Vigna mungo)</option>
                          <option value="Sunflower" className="bg-[#0E1E18] text-[#F3F7F5]">Sunflower (Helianthus annuus)</option>
                        </optgroup>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#8FA59B] block mb-1">Crop Variety / Seed Hybrid</label>
                      <input
                        type="text"
                        value={formData.crop_variety}
                        onChange={(e) => setFormData({ ...formData, crop_variety: e.target.value })}
                        placeholder="e.g. Arabica S.795 / Panniyur-1 / Pioneer 3302 / Arka Rakshak"
                        className="os-input w-full py-2.5 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-[#1B382D]">
                    <button
                      type="button"
                      onClick={() => {
                        if (!formData.name.trim()) {
                          alert('Please enter a Farm Name before proceeding.');
                          return;
                        }
                        setStep(2);
                      }}
                      className="os-btn-primary text-xs flex items-center gap-1.5"
                    >
                      <span>Next: Location & GPS</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Location & GPS Map */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1B382D] pb-3">
                    <div>
                      <h3 className="text-base font-bold font-heading text-[#F3F7F5] flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-400" />
                        <span>2. Farm Location & GPS Coordinates</span>
                      </h3>
                      <p className="text-xs text-[#8FA59B] mt-0.5">
                        Pinpoint your land on the map or use automatic GPS detection.
                      </p>
                    </div>

                    <button
                      type="button"
                      id="btn-use-current-location"
                      onClick={handleUseCurrentLocation}
                      disabled={isLocatingGps}
                      className={`py-2 px-3 text-xs flex items-center gap-1.5 shrink-0 rounded-xl font-bold transition-all cursor-pointer ${
                        gpsStatus === 'success'
                          ? 'bg-emerald-500 text-black shadow-md'
                          : 'os-btn-primary'
                      }`}
                    >
                      {isLocatingGps ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Locating...</span>
                        </>
                      ) : gpsStatus === 'success' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                          <span>Location detected</span>
                        </>
                      ) : (
                        <>
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Use Current Location</span>
                        </>
                      )}
                    </button>
                  </div>

                  {gpsMessage && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                      {isLocatingGps ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      <span>{gpsMessage}</span>
                    </div>
                  )}

                  {gpsError && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{gpsError}</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={formData.location_name}
                        onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                        placeholder="e.g. Mandya, Karnataka, India"
                        className="os-input w-full py-2.5 text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleFindLocation}
                      disabled={searchingLocation}
                      className="os-btn-secondary text-xs flex items-center gap-1.5"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>{searchingLocation ? 'Searching...' : 'Locate'}</span>
                    </button>
                  </div>

                  {/* Interactive Leaflet Map */}
                  <div className="rounded-2xl overflow-hidden border border-[#1B382D] bg-[#08120E]">
                    <FarmMap
                      latitude={formData.latitude}
                      longitude={formData.longitude}
                      onLocationSelect={handleLocationSelect}
                      className="h-72"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-[#08120E] p-3 rounded-2xl border border-[#1B382D]">
                    <div>
                      <span className="text-[#8FA59B] block font-semibold text-[10px]">Detected Latitude</span>
                      <span className="font-bold text-white">{formData.latitude?.toFixed(4)}° N</span>
                    </div>
                    <div>
                      <span className="text-[#8FA59B] block font-semibold text-[10px]">Detected Longitude</span>
                      <span className="font-bold text-white">{formData.longitude?.toFixed(4)}° E</span>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4 border-t border-[#1B382D]">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="os-btn-secondary text-xs flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="os-btn-primary text-xs flex items-center gap-1.5"
                    >
                      <span>Next: Soil & NPK</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Soil Chemistry */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <div className="border-b border-[#1B382D] pb-3">
                    <h3 className="text-base font-bold font-heading text-[#F3F7F5] flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-teal-400" />
                      <span>3. Soil Type & NPK Chemistry</span>
                    </h3>
                    <p className="text-xs text-[#8FA59B] mt-0.5">
                      Specify soil type and laboratory soil test values for precision nutrient advisory.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-[#8FA59B] block mb-1">Soil Type</label>
                      <select
                        value={formData.soil_type}
                        onChange={(e) => setFormData({ ...formData, soil_type: e.target.value })}
                        className="os-input w-full py-2.5 text-xs cursor-pointer"
                      >
                        <option value="Loam" className="bg-[#0E1E18]">Loam (Optimal Balance)</option>
                        <option value="Sandy Loam" className="bg-[#0E1E18]">Sandy Loam</option>
                        <option value="Clay" className="bg-[#0E1E18]">Clay (High Water Retention)</option>
                        <option value="Black Soil" className="bg-[#0E1E18]">Black Cotton Soil (Regur)</option>
                        <option value="Red Soil" className="bg-[#0E1E18]">Red / Laterite Soil</option>
                        <option value="Alluvial" className="bg-[#0E1E18]">Alluvial Soil</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#8FA59B] block mb-1">Soil pH Balance (1 - 14)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="3"
                        max="10"
                        value={formData.soil_ph}
                        onChange={(e) => setFormData({ ...formData, soil_ph: parseFloat(e.target.value) || 6.5 })}
                        className="os-input w-full py-2.5 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="text-xs font-bold text-emerald-300 block mb-1">Nitrogen (N) kg/ha</label>
                      <input
                        type="number"
                        value={formData.nitrogen}
                        onChange={(e) => setFormData({ ...formData, nitrogen: parseFloat(e.target.value) || 0 })}
                        className="os-input w-full py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-teal-300 block mb-1">Phosphorus (P) kg/ha</label>
                      <input
                        type="number"
                        value={formData.phosphorus}
                        onChange={(e) => setFormData({ ...formData, phosphorus: parseFloat(e.target.value) || 0 })}
                        className="os-input w-full py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-amber-300 block mb-1">Potassium (K) kg/ha</label>
                      <input
                        type="number"
                        value={formData.potassium}
                        onChange={(e) => setFormData({ ...formData, potassium: parseFloat(e.target.value) || 0 })}
                        className="os-input w-full py-2 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-4 border-t border-[#1B382D]">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="os-btn-secondary text-xs flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="os-btn-primary text-xs flex items-center gap-1.5"
                    >
                      <span>Next: Irrigation & Schedule</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: Crop Cycle & Irrigation */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <div className="border-b border-[#1B382D] pb-3">
                    <h3 className="text-base font-bold font-heading text-[#F3F7F5] flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-teal-400" />
                      <span>4. Irrigation Setup & Sowing Schedule</span>
                    </h3>
                    <p className="text-xs text-[#8FA59B] mt-0.5">Configure water sources and harvest timeline.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-[#8FA59B] block mb-1">Irrigation Method</label>
                      <select
                        value={formData.irrigation_method}
                        onChange={(e) => setFormData({ ...formData, irrigation_method: e.target.value })}
                        className="os-input w-full py-2.5 text-xs cursor-pointer"
                      >
                        <option value="Drip Irrigation" className="bg-[#0E1E18]">Drip Irrigation (High Efficiency)</option>
                        <option value="Sprinkler System" className="bg-[#0E1E18]">Sprinkler System</option>
                        <option value="Furrow / Flood Irrigation" className="bg-[#0E1E18]">Furrow / Flood Irrigation</option>
                        <option value="Manual / Rainfed" className="bg-[#0E1E18]">Manual / Rainfed</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#8FA59B] block mb-1">Water Source</label>
                      <select
                        value={formData.water_source}
                        onChange={(e) => setFormData({ ...formData, water_source: e.target.value })}
                        className="os-input w-full py-2.5 text-xs cursor-pointer"
                      >
                        <option value="Borewell" className="bg-[#0E1E18]">Borewell</option>
                        <option value="Canal" className="bg-[#0E1E18]">Irrigation Canal</option>
                        <option value="Farm Pond" className="bg-[#0E1E18]">Farm Pond / Rainwater Harvesting</option>
                        <option value="River / Well" className="bg-[#0E1E18]">Open Well / River</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-[#8FA59B] block mb-1">Sowing Date</label>
                      <input
                        type="date"
                        value={formData.sowing_date}
                        onChange={(e) => setFormData({ ...formData, sowing_date: e.target.value })}
                        className="os-input w-full py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#8FA59B] block mb-1">Expected Harvest Date</label>
                      <input
                        type="date"
                        value={formData.expected_harvest}
                        onChange={(e) => setFormData({ ...formData, expected_harvest: e.target.value })}
                        className="os-input w-full py-2 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-4 border-t border-[#1B382D]">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="os-btn-secondary text-xs flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={saving}
                      className="os-btn-primary text-xs flex items-center gap-1.5"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Initializing Sensors & Farm...</span>
                        </>
                      ) : (
                        <>
                          <span>Save & Launch Farm Plot 🌱</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 5: Success Screen */}
              {step === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="text-center py-10 space-y-5"
                >
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8" />
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-2xl font-bold font-heading text-[#F3F7F5]">Your Farm Plot is Ready 🌱</h3>
                    <p className="text-xs text-[#8FA59B] max-w-md mx-auto leading-relaxed">
                      <strong className="text-white">{formData.name}</strong> ({formData.crop} • {formData.size_acres} Acres) has been successfully created with initialized IoT sensors and microclimate weather feeds.
                    </p>
                  </div>

                  <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => navigate('/dashboard')}
                      className="os-btn-primary text-xs inline-flex items-center gap-1.5"
                    >
                      <span>Open Farm Command Center</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('manage');
                        setIsCompleted(false);
                      }}
                      className="os-btn-secondary text-xs"
                    >
                      Manage All Plots ({farms.length})
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR DELETING FARM */}
      <AnimatePresence>
        {deletingFarm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full os-card-elevated p-6 text-center space-y-4 shadow-2xl border-rose-500/40"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold font-heading text-[#F3F7F5]">Delete Farm Plot?</h3>
                <p className="text-xs text-[#8FA59B] leading-relaxed">
                  Are you sure you want to permanently delete <strong className="text-white">"{deletingFarm.name}"</strong>? All associated IoT telemetry, disease scan records, and irrigation schedules will be removed.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#08120E] border border-rose-500/20 text-[11px] text-rose-300 text-left flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>This action cannot be undone. Only this plot will be removed from your profile.</span>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeletingFarm(null)}
                  className="os-btn-secondary flex-1 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Plot</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
