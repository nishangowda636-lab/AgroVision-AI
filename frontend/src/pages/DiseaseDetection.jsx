import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useFarm } from '../context/FarmContext';
import {
  Bug,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  AlertTriangle,
  Shield,
  History,
  ArrowRight,
  Calendar,
  Sparkles,
  RefreshCw,
  HelpCircle,
  Activity,
  Check
} from 'lucide-react';
import api from '../services/api';

export default function DiseaseDetection() {
  const { activeFarm } = useFarm();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [plantPart, setPlantPart] = useState('Leaf');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const plantParts = [
    { label: 'Leaf / Foliage', val: 'Leaf', icon: '🍃' },
    { label: 'Whole Plant', val: 'Plant', icon: '🌱' },
    { label: 'Fruit / Pod', val: 'Fruit', icon: '🍅' },
    { label: 'Stem / Branch', val: 'Stem', icon: '🎋' },
    { label: 'Seed / Grain', val: 'Seed', icon: '🌾' },
    { label: 'Insect / Pest', val: 'Pest', icon: '🐛' },
  ];

  useEffect(() => {
    fetchHistory();
  }, [activeFarm]);

  const fetchHistory = () => {
    api.get('/disease/history', { params: { farm_id: activeFarm?.id || null } })
      .then((res) => setHistory(res.data))
      .catch((err) => console.error(err));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setAnalyzing(true);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('plant_part', plantPart);
    if (activeFarm) {
      formData.append('farm_id', activeFarm.id);
    }

    try {
      const res = await api.post('/disease/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
      fetchHistory();
    } catch (err) {
      alert('Error analyzing image: ' + (err.response?.data?.detail || err.message));
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-6xl mx-auto selection:bg-emerald-500 selection:text-black">
      {/* Header */}
      <div className="border-b border-emerald-500/20 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <Bug className="w-8 h-8 text-rose-400" />
            <span>AI Crop Doctor & Disease Scanner</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Real-time plant pathology diagnosis and precision treatment steps for{' '}
            <span className="text-emerald-400 font-bold">{activeFarm?.name || 'Your Farm'}</span>.
          </p>
        </div>
        <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-rose-950/70 border border-rose-500/30 text-rose-300 self-start sm:self-auto">
          30+ Crop Pathologies Supported
        </span>
      </div>

      {/* Plant Part Specimen Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-300">Select Plant Specimen or Part to Inspect:</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {plantParts.map((p) => (
            <button
              key={p.val}
              type="button"
              onClick={() => setPlantPart(p.val)}
              className={`p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                plantPart === p.val
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-black shadow-md border-emerald-400'
                  : 'bg-[#061924] border-emerald-500/20 text-slate-300 hover:border-emerald-500/40'
              }`}
            >
              <span>{p.icon}</span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Column Analysis Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left: Drag & Drop Upload + Image Preview with Scanning Animation */}
        <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30 space-y-5 bg-[#06131D]">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-400" /> 1. Upload {plantPart} Photo
          </h3>

          <div
            onClick={() => document.getElementById('cropFileInput').click()}
            className="relative border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 rounded-2xl p-6 text-center bg-[#04131B] transition-all cursor-pointer overflow-hidden min-h-[220px] flex items-center justify-center"
          >
            <input
              id="cropFileInput"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {previewUrl ? (
              <div className="relative w-full h-full space-y-3">
                <div className="relative rounded-2xl overflow-hidden max-h-64 mx-auto border border-emerald-500/30">
                  <img
                    src={previewUrl}
                    alt="Crop Specimen Preview"
                    className="w-full max-h-64 object-cover"
                  />

                  {/* Animated Laser Scanning Beam when Analyzing */}
                  {analyzing && (
                    <motion.div
                      animate={{ top: ['0%', '95%', '0%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="absolute left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-teal-400 to-rose-500 shadow-[0_0_15px_#f43f5e] z-20"
                    />
                  )}

                  {analyzing && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                      <div className="p-3 rounded-2xl bg-black/80 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                        <span>Analyzing crop health...</span>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-emerald-400 font-semibold truncate">Image selected: {selectedFile.name}</p>
              </div>
            ) : (
              <div className="space-y-2 py-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-200">Click to upload or drag {plantPart} photo</p>
                <p className="text-[10px] text-slate-400">Supports JPG, PNG, WEBP from smartphone camera</p>
              </div>
            )}
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!selectedFile || analyzing}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-extrabold text-xs shadow hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {analyzing ? 'Analyzing Specimen Features...' : `Diagnose ${plantPart} Health Now`} <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Farmer-Friendly Structured Diagnosis Report */}
        <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30 space-y-5 bg-[#06131D]">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" /> 2. AI Diagnostic Report
          </h3>

          {!result ? (
            <div className="p-12 text-center text-slate-400 text-xs space-y-2 bg-[#04131B] rounded-2xl border border-emerald-500/10">
              <Bug className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="font-semibold text-slate-300">No crop image analyzed yet.</p>
              <p className="text-[11px] text-slate-400">Upload a leaf or specimen photo to generate a full pathology breakdown.</p>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {/* Primary Detection Banner */}
              <div className="p-4 rounded-2xl bg-[#04131B] border border-rose-500/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Disease Detected</span>
                  <h4 className="text-lg font-black text-white">{result.detected_problem}</h4>
                  <p className="text-[11px] text-emerald-400 font-semibold">{result.detected_crop || 'Plant Foliage'}</p>
                </div>
                <div className="text-right space-y-1">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-sm border border-emerald-500/40 block">
                    {result.confidence}%
                  </span>
                  <span className="text-[10px] text-slate-400 block font-medium">Confidence</span>
                </div>
              </div>

              {/* Severity Badge */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#04131B] border border-emerald-500/20">
                <span className="text-slate-300 font-semibold">Severity Rating</span>
                <span
                  className={`px-3 py-0.5 rounded-full font-bold text-[11px] ${
                    result.severity === 'High'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : result.severity === 'Moderate'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {result.severity} Severity
                </span>
              </div>

              {/* 5 Farmer-Friendly Structured Breakdown Cards */}
              <div className="space-y-3 bg-[#04131B] p-4 rounded-2xl border border-emerald-500/20">
                <div>
                  <h5 className="font-bold text-emerald-400 mb-0.5 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> What happened?
                  </h5>
                  <p className="text-slate-300 leading-relaxed">{result.explanation}</p>
                </div>

                <div>
                  <h5 className="font-bold text-amber-400 mb-0.5 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5" /> Possible Cause
                  </h5>
                  <p className="text-slate-300 leading-relaxed">{result.possible_causes}</p>
                </div>

                <div>
                  <h5 className="font-bold text-teal-400 mb-0.5 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> What should I do? (Action Steps)
                  </h5>
                  <p className="text-slate-300 whitespace-pre-line leading-relaxed">{result.next_steps}</p>
                </div>

                <div>
                  <h5 className="font-bold text-emerald-300 mb-0.5 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" /> Prevention
                  </h5>
                  <p className="text-slate-300 leading-relaxed">{result.prevention}</p>
                </div>

                {result.monitoring_plan && (
                  <div className="pt-2 border-t border-emerald-500/15">
                    <h5 className="font-bold text-amber-300 mb-0.5 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Monitor for (Next 7 Days)
                    </h5>
                    <p className="text-slate-300 whitespace-pre-line leading-relaxed">{result.monitoring_plan}</p>
                  </div>
                )}
              </div>

              {/* Farmer Expert Advisory Note */}
              <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-bold block">Agronomist Recommendation:</span>
                  Isolate affected branches. If symptoms persist after recommended organic/chemical spraying, request an on-field Extension Officer check.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Disease Detection History */}
      <div className="space-y-4 pt-2">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <History className="w-5 h-5 text-emerald-400" /> Recent Disease Detection History
        </h3>

        {history.length === 0 ? (
          <div className="p-8 rounded-3xl glass-panel text-center text-xs text-slate-400 bg-[#06131D]">
            No crop analysis records saved yet. Upload your first crop photo above.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map((record) => (
              <div key={record.id} className="glass-panel p-4 rounded-2xl border border-emerald-500/20 space-y-2 bg-[#061924]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">{record.detected_crop || 'Crop'}</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">{record.confidence}% Confidence</span>
                </div>
                <p className="text-xs text-slate-300 font-medium">{record.detected_problem}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-emerald-500/10">
                  <span>Severity: {record.severity}</span>
                  <span>{new Date(record.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
