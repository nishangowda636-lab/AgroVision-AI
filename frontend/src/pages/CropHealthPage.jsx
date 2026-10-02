import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useFarm } from '../context/FarmContext';
import {
  Heart,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Activity,
  PhoneCall,
  Sprout,
  ArrowRight,
  Eye,
  X,
  Layers,
  CloudRain
} from 'lucide-react';
import api from '../services/api';

const PLANT_PARTS = [
  { label: 'Auto Detect', val: 'Auto', icon: '✨' },
  { label: 'Leaf / Foliage', val: 'Leaf', icon: '🍃' },
  { label: 'Whole Plant', val: 'Plant', icon: '🌱' },
  { label: 'Fruit', val: 'Fruit', icon: '🍅' },
  { label: 'Vegetable', val: 'Vegetable', icon: '🥦' },
  { label: 'Rhizome / Tuber', val: 'Rhizome', icon: '🥔' },
  { label: 'Seed / Grain', val: 'Seed', icon: '🌾' },
  { label: 'Stem / Branch', val: 'Stem', icon: '🎋' },
  { label: 'Insect / Pest', val: 'Pest', icon: '🐛' },
];

const PART_INSTRUCTIONS = {
  Auto: 'Upload a clear leaf, whole plant, fruit, vegetable, rhizome/tuber, or seed image.',
  Leaf: 'Upload a clear crop leaf image.',
  Plant: 'Upload a clear whole-plant image.',
  Fruit: 'Upload a clear fruit image.',
  Vegetable: 'Upload a clear vegetable, root, or tuber image.',
  Rhizome: 'Upload a clear rhizome, tuber, or root crop image.',
  Seed: 'Upload a clear seed image.',
  Stem: 'Upload a clear stem or branch image.',
  Pest: 'Upload a clear insect or pest image.',
};

export default function CropHealthPage() {
  const { activeFarm } = useFarm();
  const navigate = useNavigate();

  const [images, setImages] = useState([]);
  const [activePart, setActivePart] = useState('Auto');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('scanner'); // 'scanner' | 'history'
  const [analysisStep, setAnalysisStep] = useState(1);

  useEffect(() => {
    fetchHistory();
  }, [activeFarm?.id]);

  const fetchHistory = () => {
    if (!activeFarm) return;
    api.get('/disease/history', { params: { farm_id: activeFarm.id } })
      .then((res) => setHistory(res.data || []))
      .catch((err) => console.error('Error fetching disease history:', err));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newImages = files.slice(0, 4 - images.length).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      part: activePart
    }));

    setImages((prev) => [...prev, ...newImages].slice(0, 4));
    setResult(null);
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[index].previewUrl);
      copy.splice(index, 1);
      return copy;
    });
  };

  const handleAnalyze = async () => {
    if (images.length === 0) return;
    setAnalyzing(true);
    setAnalysisStep(1);

    const stepTimer1 = setTimeout(() => setAnalysisStep(2), 600);
    const stepTimer2 = setTimeout(() => setAnalysisStep(3), 1200);
    const stepTimer3 = setTimeout(() => setAnalysisStep(4), 1800);

    const formData = new FormData();
    if (images.length > 0 && images[0].file) {
      formData.append('file', images[0].file);
    }
    if (images.length > 1) {
      images.slice(1).forEach((img) => formData.append('files', img.file));
    }

    const partsList = images.map((img) => img.part);
    formData.append('plant_parts', JSON.stringify(partsList));
    formData.append('plant_part', partsList[0] || activePart || 'Auto');

    if (activeFarm) {
      formData.append('farm_id', activeFarm.id);
    }

    try {
      const res = await api.post('/crop-health/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
      fetchHistory();
    } catch (err) {
      alert('Error analyzing image: ' + (err.response?.data?.detail || err.message));
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setAnalyzing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto selection:bg-[#10B981] selection:text-black">
      {/* Header */}
      <div className="border-b border-[#1B382D] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F3F7F5] flex items-center gap-2.5 font-heading">
            <Heart className="w-7 h-7 text-[#10B981]" />
            <span>AI Crop & Plant Analyzer</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8FA59B] mt-0.5">
            {PART_INSTRUCTIONS[activePart] || PART_INSTRUCTIONS.Auto}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-[#0E1E18] p-1 rounded-xl border border-[#1B382D] text-xs">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              activeTab === 'scanner' ? 'bg-[#10B981] text-[#061811]' : 'text-[#8FA59B] hover:text-[#F3F7F5]'
            }`}
          >
            📸 Scanner
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              activeTab === 'history' ? 'bg-[#10B981] text-[#061811]' : 'text-[#8FA59B] hover:text-[#F3F7F5]'
            }`}
          >
            Scan History ({history.length})
          </button>
        </div>
      </div>

      {activeTab === 'scanner' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Upload & Part Selector */}
          <div className="lg:col-span-5 space-y-4">
            <div className="os-card p-5 space-y-4">
              {/* Plant Part Selector Options */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#8FA59B] block">
                  Select Plant Part Category
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {PLANT_PARTS.map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => {
                        setActivePart(p.val);
                        // If images exist without analysis, update active images part tag
                        if (images.length > 0) {
                          setImages((prev) => prev.map((img) => ({ ...img, part: p.val })));
                        }
                      }}
                      className={`p-2 rounded-lg text-xs font-medium flex flex-col items-center gap-0.5 transition-colors cursor-pointer ${
                        activePart === p.val
                          ? 'bg-[#10B981] text-[#061811] font-bold'
                          : 'bg-[#0A1612] border border-[#1B382D] text-[#8FA59B] hover:text-[#F3F7F5]'
                      }`}
                    >
                      <span className="text-sm">{p.icon}</span>
                      <span className="text-[10px] truncate max-w-full">{p.val}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Central Drop & Upload Zone */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[#8FA59B]">
                  <span>Uploaded Images ({images.length}/4)</span>
                  <span className="text-[11px] text-[#10B981]">Multi-angle diagnosis</span>
                </div>

                {images.length < 4 && (
                  <div className="border border-dashed border-[#1B382D] hover:border-[#10B981] rounded-xl p-6 text-center transition-colors bg-[#0A1612] relative cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-[#10B981]/15 text-[#10B981] flex items-center justify-center mx-auto">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#F3F7F5]">
                          {images.length === 0 ? 'Click to browse or drop photos' : '+ Add additional angle'}
                        </p>
                        <p className="text-[11px] text-[#8FA59B] mt-0.5">
                          {activePart === 'Auto' ? 'Hold camera steady at 15–20 cm under daylight' : PART_INSTRUCTIONS[activePart]}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Thumbnails */}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative rounded-xl overflow-hidden border border-[#1B382D] bg-[#0A1612]">
                        <img src={img.previewUrl} alt={`Scan ${idx + 1}`} className="w-full h-24 object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/80 hover:bg-[#EF4444] text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-black/80 text-[10px] text-[#10B981] font-mono">
                          {img.part}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4-Step Analysis Pipeline Visualizer */}
              {analyzing && (
                <div className="p-3.5 rounded-xl bg-[#0A1612] border border-[#1B382D] space-y-2 text-xs">
                  <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider block">
                    Diagnostic Analysis Flow
                  </span>
                  <div className="space-y-1.5 text-[11px]">
                    <div className={`flex items-center gap-2 ${analysisStep >= 1 ? 'text-[#10B981] font-semibold' : 'text-[#577366]'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>1. Identify: Plant Part & Species Category</span>
                    </div>
                    <div className={`flex items-center gap-2 ${analysisStep >= 2 ? 'text-[#10B981] font-semibold' : 'text-[#577366]'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>2. Usability: Quality & Blur Screening</span>
                    </div>
                    <div className={`flex items-center gap-2 ${analysisStep >= 3 ? 'text-[#10B981] font-semibold' : 'text-[#577366]'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>3. Analyze: Pathogen & Foliar Conditions</span>
                    </div>
                    <div className={`flex items-center gap-2 ${analysisStep >= 4 ? 'text-[#10B981] font-semibold' : 'text-[#577366]'}`}>
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      <span>4. Recommend: Validated Agronomic Advice</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleAnalyze}
                disabled={images.length === 0 || analyzing}
                className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  images.length === 0 || analyzing
                    ? 'bg-[#13271F] text-[#577366] border border-[#1B382D] cursor-not-allowed'
                    : 'os-btn-primary'
                }`}
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Image...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Analyze Crop ({images.length} Image{images.length > 1 ? 's' : ''})</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: 3-Layer Diagnostic Result */}
          <div className="lg:col-span-7">
            {result ? (
              (() => {
                const isNotSupported = result.analysis_status === 'NOT_SUPPORTED';
                const isLowConfidence = result.analysis_status === 'LOW_CONFIDENCE' || (result.identified_crop === 'Unknown' && !isNotSupported);
                const displayPart = result.plant_part || result.image_type || activePart || 'Leaf';
                const cropName = (isLowConfidence || isNotSupported) ? 'Unknown' : (result.identified_crop || result.crop_name || result.detected_crop || 'Unknown');
                const diseaseName = isNotSupported
                  ? (result.disease || `Not Supported for ${displayPart}`)
                  : isLowConfidence 
                    ? (result.message || 'Crop could not be identified reliably') 
                    : (result.disease || result.disease_name || result.detected_problem || 'Healthy Foliage');
                const primaryConf = (isLowConfidence || isNotSupported)
                  ? (result.crop_confidence !== undefined && result.crop_confidence !== null ? result.crop_confidence : (result.confidence || 0))
                  : (result.disease_confidence !== undefined && result.disease_confidence !== null ? result.disease_confidence : (result.confidence || 0));

                const isHealthy = result.health_status === 'Healthy' || 
                  (typeof result.severity === 'string' && (result.severity.toLowerCase().includes('healthy') || result.severity.toLowerCase().includes('optimal'))) ||
                  (typeof diseaseName === 'string' && diseaseName.toLowerCase().includes('healthy'));

                const getOptimalHealthText = (part) => {
                  const p = (part || '').toLowerCase();
                  if (p.includes('rhizome') || p.includes('tuber') || p.includes('root') || p.includes('vegetable')) {
                    return '✓ Optimal Rhizome & Produce Quality (Healthy & Firm)';
                  }
                  if (p.includes('fruit')) {
                    return '✓ Optimal Fruit Quality (Blemish-Free & Market-Ready)';
                  }
                  if (p.includes('seed') || p.includes('grain')) {
                    return '✓ Optimal Seed & Grain Quality (Sound & Viable)';
                  }
                  if (p.includes('leaf') || p.includes('foliage')) {
                    return '✓ Optimal Foliar & Leaf Health';
                  }
                  if (p.includes('stem') || p.includes('branch')) {
                    return '✓ Optimal Stem & Vascular Health';
                  }
                  return '✓ Optimal Crop & Canopy Health';
                };

                return (
                  <div className={`os-card p-6 space-y-5 ${(isLowConfidence || isNotSupported) ? 'border-amber-500/40 bg-[#0E1A14]' : ''}`}>
                    {/* 1. Identification Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[#1B382D] pb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                            (isLowConfidence || isNotSupported)
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' 
                              : 'bg-[#10B981]/15 text-[#10B981]'
                          }`}>
                            IDENTIFIED CROP: {cropName}
                          </span>
                          {result.companion_crop && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono bg-blue-500/15 text-blue-400 border border-blue-500/30">
                              COMPANION: {result.companion_crop}
                            </span>
                          )}
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#0A1612] text-[#8FA59B] border border-[#1B382D]">
                            TYPE: {displayPart}
                          </span>
                          {!isLowConfidence && !isNotSupported && result.crop_confidence !== undefined && result.crop_confidence !== null && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30">
                              Crop Conf: {result.crop_confidence}%
                            </span>
                          )}
                        </div>
                        <h2 className={`text-xl font-bold font-heading ${(isLowConfidence || isNotSupported) ? 'text-amber-300' : 'text-[#F3F7F5]'}`}>
                          {diseaseName}
                        </h2>
                      </div>

                      <div className="text-right">
                        <span className={`text-2xl font-black ${(isLowConfidence || isNotSupported) ? 'text-amber-400' : isHealthy ? 'text-[#10B981]' : (result.severity === 'Critical' || result.severity === 'High') ? 'text-red-400' : 'text-[#10B981]'}`}>
                          {primaryConf}%
                        </span>
                        <span className="text-[10px] text-[#8FA59B] block">
                          {(isLowConfidence || isNotSupported) ? 'Crop Confidence' : isHealthy ? 'Health Confidence' : 'Disease Confidence'}
                        </span>
                      </div>
                    </div>

                    {/* Health Status Indicator */}
                    <div className={`p-3 rounded-xl bg-[#0A1612] border flex items-center justify-between text-xs ${
                      (isLowConfidence || isNotSupported) ? 'border-amber-500/30' : 'border-[#1B382D]'
                    }`}>
                      <span className="text-[#8FA59B]">HEALTH EVALUATION:</span>
                      <span className={`font-bold ${
                        isNotSupported
                          ? 'text-amber-400'
                          : isLowConfidence 
                            ? 'text-amber-400' 
                            : isHealthy 
                              ? 'text-[#10B981]' 
                              : 'text-[#F59E0B]'
                      }`}>
                        {isNotSupported
                          ? '⚠️ Plant Part Not Supported by Validated Model'
                          : isLowConfidence 
                            ? '⚠️ Identification Confidence Below Threshold (< 65%)'
                            : isHealthy 
                              ? getOptimalHealthText(displayPart) 
                              : (result.health_status || 'Possible Issue')}
                      </span>
                    </div>

                    {/* Observations */}
                    <div className="space-y-1.5 text-xs">
                      <span className="font-bold text-[#F3F7F5] block flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-[#10B981]" />
                        OBSERVATIONS
                      </span>
                      {Array.isArray(result.visual_observations) && result.visual_observations.length > 0 ? (
                        <div className="space-y-1.5">
                          {result.visual_observations.map((obs, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-[#8FA59B] leading-relaxed">
                              <span className="text-[#10B981] mt-0.5">•</span>
                              <span>{obs}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[#8FA59B] leading-relaxed">
                          {result.visible_symptoms || result.explanation || result.message || 'Diagnostic visual features processed.'}
                        </p>
                      )}
                      {result.companion_observations && (
                        <div className="mt-2.5 p-2.5 rounded-lg bg-blue-950/20 border border-blue-800/30 text-blue-300 text-xs flex items-start gap-2">
                          <Sprout className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-blue-200">Companion Crop Insights: </span>
                            <span>{result.companion_observations}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Recommended Action */}
                    <div className={`p-4 rounded-xl bg-[#0A1612] border space-y-2 text-xs ${
                      (isLowConfidence || isNotSupported) ? 'border-amber-500/30' : 'border-[#1B382D]'
                    }`}>
                      <span className={`font-bold block flex items-center gap-1.5 ${(isLowConfidence || isNotSupported) ? 'text-amber-400' : 'text-[#10B981]'}`}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {(isLowConfidence || isNotSupported) ? 'NEXT STEPS' : 'RECOMMENDED ACTION'}
                      </span>
                      <p className="text-[#F3F7F5] leading-relaxed whitespace-pre-line">
                        {result.recommendation || result.recommended_next_steps || result.next_steps || (
                          activePart === 'Leaf'
                            ? 'Capture a clear photo of the crop leaf holding camera steady at 15–20 cm under daylight.'
                            : `Upload a clear photo of the crop ${activePart.toLowerCase()} holding camera steady under daylight.`
                        )}
                      </p>
                    </div>

                    {/* Weather Consideration */}
                    {!isLowConfidence && !isNotSupported && (
                      <div className="p-3.5 rounded-xl bg-[#0A1612] border border-[#1B382D] space-y-1 text-xs">
                        <span className="font-bold text-[#14B8A6] block flex items-center gap-1.5">
                          <CloudRain className="w-3.5 h-3.5" />
                          WEATHER CONSIDERATION
                        </span>
                        <p className="text-[#8FA59B] leading-relaxed text-[11px]">
                          {result.weather_correlation || (
                            (displayPart.toLowerCase().includes('rhizome') || displayPart.toLowerCase().includes('tuber') || displayPart.toLowerCase().includes('fruit'))
                              ? 'Store harvested produce in a well-ventilated dry area shielded from rainfall and excessive ambient humidity.'
                              : 'Avoid foliar sprays before rain events. Optimal spraying window is early morning (07:00–09:00 AM).'
                          )}
                        </p>
                      </div>
                    )}

                    {/* KVK Agronomist Hotline */}
                    <div className="pt-2 border-t border-[#1B382D] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#8FA59B]">
                      <span>Need in-person agronomist advice?</span>
                      <a
                        href="tel:1551"
                        className="inline-flex items-center gap-1.5 text-[#10B981] font-bold hover:underline"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Call Kisan Call Center (1551)</span>
                      </a>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="os-card p-12 text-center space-y-3 flex flex-col items-center justify-center min-h-[380px]">
                <div className="w-12 h-12 rounded-2xl bg-[#0A1612] text-[#8FA59B] border border-[#1B382D] flex items-center justify-center">
                  <Sprout className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h3 className="text-sm font-bold text-[#F3F7F5]">Upload a Plant Image to Begin</h3>
                  <p className="text-xs text-[#8FA59B]">
                    Take a photo of leaves, fruit, or stem on your {activeFarm?.crop || 'farm'} to receive instant identification, health evaluation, and recommended actions.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* History View */
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[#F3F7F5]">Past Pathology Scans for {activeFarm?.name}</h3>
          {history.length === 0 ? (
            <div className="os-card p-8 text-center text-xs text-[#8FA59B]">
              No past scans logged yet. Upload an image to record your first diagnostic scan.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {history.map((item) => (
                <div key={item.id} className="os-card p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#F3F7F5]">{item.detected_problem}</span>
                    <span className="text-[10px] font-mono text-[#10B981]">{item.confidence}% Conf.</span>
                  </div>
                  <p className="text-[11px] text-[#8FA59B] line-clamp-2">
                    {item.visible_symptoms || item.explanation}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-[#577366] pt-1 border-t border-[#1B382D]">
                    <span>Crop: {item.detected_crop}</span>
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
