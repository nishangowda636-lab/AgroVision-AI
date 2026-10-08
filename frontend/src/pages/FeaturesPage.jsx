import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Bug,
  Droplets,
  CloudSun,
  Cpu,
  TrendingUp,
  BarChart3,
  Bot,
  Activity,
  ArrowRight,
  ChevronRight,
  Sprout,
  Compass,
  FileSpreadsheet,
  CheckCircle2,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function FeaturesPage() {
  const shouldReduceMotion = useReducedMotion();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedFeature, setSelectedFeature] = useState(null);

  // 3 Prescribed Feature Categories
  const categories = [
    { id: 'all', name: 'All Capabilities' },
    { id: 'farm-intelligence', name: 'Farm Intelligence' },
    { id: 'field-environment', name: 'Field & Environment' },
    { id: 'ai-management', name: 'AI & Farm Management' }
  ];

  const features = [
    // Category 1: FARM INTELLIGENCE
    {
      id: 'crop-health',
      categoryId: 'farm-intelligence',
      categoryName: 'Farm Intelligence',
      title: 'Crop Health',
      icon: Bug,
      iconColor: 'text-rose-400',
      badgeBg: 'bg-rose-500/10',
      badgeBorder: 'border-rose-500/20',
      desc: 'Analyze crop images and identify possible disease or stress conditions.',
      details: 'Computer vision diagnostics evaluate foliage photographs to identify leaf spots, blights, and nutrient deficiencies with confidence metrics and treatment advice.',
      tags: ['Vision Pathology', 'Severity Analysis', 'Treatment Guidance']
    },
    {
      id: 'crop-recommendation',
      categoryId: 'farm-intelligence',
      categoryName: 'Farm Intelligence',
      title: 'Crop Recommendation',
      icon: Sprout,
      iconColor: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10',
      badgeBorder: 'border-emerald-500/20',
      desc: 'Evaluate soil chemistry, climate and season to find the most suitable crops.',
      details: 'Evaluates soil NPK, pH, regional rainfall patterns, and temperature curves to score crop varieties with highest seasonal viability.',
      tags: ['Soil NPK Matching', 'Seasonal Viability', 'Climate Alignment']
    },
    {
      id: 'yield-prediction',
      categoryId: 'farm-intelligence',
      categoryName: 'Farm Intelligence',
      title: 'Yield Prediction',
      icon: TrendingUp,
      iconColor: 'text-teal-400',
      badgeBg: 'bg-teal-500/10',
      badgeBorder: 'border-teal-500/20',
      desc: 'Forecast harvest potential and milestone targets based on farm inputs.',
      details: 'Machine learning regression models estimate expected yield per acre and track crop milestone progression throughout the growing cycle.',
      tags: ['Harvest Forecasting', 'Growth Milestones', 'Acreage Tonnage']
    },

    // Category 2: FIELD & ENVIRONMENT
    {
      id: 'weather-intelligence',
      categoryId: 'field-environment',
      categoryName: 'Field & Environment',
      title: 'Weather Intelligence',
      icon: CloudSun,
      iconColor: 'text-amber-400',
      badgeBg: 'bg-amber-500/10',
      badgeBorder: 'border-amber-500/20',
      desc: 'Transform meteorological forecasts into actionable field precautions and spray windows.',
      details: 'Hyperlocal 7-day precipitation forecasts, wind speed metrics, and humidity alerts converted into practical spray windows and frost warnings.',
      tags: ['Spray Timing', 'Rainfall Alerts', 'Microclimate Radar']
    },
    {
      id: 'iot-sensors',
      categoryId: 'field-environment',
      categoryName: 'Field & Environment',
      title: 'IoT Sensors',
      icon: Cpu,
      iconColor: 'text-cyan-400',
      badgeBg: 'bg-cyan-500/10',
      badgeBorder: 'border-cyan-500/20',
      desc: 'Connect soil and ambient telemetry to monitor moisture, thermal, and electrical metrics.',
      details: 'Ingests wireless sensor telemetry for soil moisture, soil temperature, and NPK metrics with fallback to microclimate simulation.',
      tags: ['Soil Moisture Telemetry', 'Thermal Monitoring', 'Sensor Status']
    },
    {
      id: 'smart-irrigation',
      categoryId: 'field-environment',
      categoryName: 'Field & Environment',
      title: 'Smart Irrigation',
      icon: Droplets,
      iconColor: 'text-teal-400',
      badgeBg: 'bg-teal-500/10',
      badgeBorder: 'border-teal-500/20',
      desc: 'Calculate optimal water requirements and pump runtimes based on soil deficit.',
      details: 'Combines crop evapotranspiration coefficients, weather forecasts, and root zone moisture to calculate precision pump runtimes.',
      tags: ['Evapotranspiration Deficit', 'Pump Runtimes', 'Water Conservation']
    },

    // Category 3: AI & FARM MANAGEMENT
    {
      id: 'ai-farm-agent',
      categoryId: 'ai-management',
      categoryName: 'AI & Farm Management',
      title: 'AI Farm Agent',
      icon: Bot,
      iconColor: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10',
      badgeBorder: 'border-emerald-500/20',
      desc: 'Synthesize all farm signals into an autonomous daily prioritized action plan.',
      details: 'Your digital farm co-pilot synthesizes weather, crop images, sensor readings, and calendar stage into a prioritized daily action list.',
      tags: ['Daily Prioritization', 'Autonomous Co-Pilot', 'Multi-Signal Fusion']
    },
    {
      id: 'fertilizer-advisor',
      categoryId: 'ai-management',
      categoryName: 'AI & Farm Management',
      title: 'Fertilizer Advisor',
      icon: Activity,
      iconColor: 'text-teal-300',
      badgeBg: 'bg-teal-500/10',
      badgeBorder: 'border-teal-500/20',
      desc: 'Calculate precise NPK nutrient dosing and fertilizer recommendations for your crop stage.',
      details: 'Recommends exact fertilizer types (Urea, DAP, MOP) and application quantities tailored to current soil reserves and growth stage.',
      tags: ['NPK Dosing Calculator', 'Stage Matching', 'Nutrient Balance']
    },
    {
      id: 'farm-ledger',
      categoryId: 'ai-management',
      categoryName: 'AI & Farm Management',
      title: 'Farm Ledger',
      icon: FileSpreadsheet,
      iconColor: 'text-amber-400',
      badgeBg: 'bg-amber-500/10',
      badgeBorder: 'border-amber-500/20',
      desc: 'Track operational expenses, seasonal costs, and harvest revenue in one simple ledger.',
      details: 'Record seeds, fertilizer purchases, labor, machinery costs, and market sales to maintain a transparent financial balance sheet.',
      tags: ['Cost Accounting', 'Income Tracking', 'Seasonal Balance Sheet']
    },
    {
      id: 'analytics',
      categoryId: 'ai-management',
      categoryName: 'AI & Farm Management',
      title: 'Analytics',
      icon: BarChart3,
      iconColor: 'text-cyan-400',
      badgeBg: 'bg-cyan-500/10',
      badgeBorder: 'border-cyan-500/20',
      desc: 'Review performance charts, input utilization metrics, and season-over-season trends.',
      details: 'Visualize yield milestones, resource utilization efficiencies, and field health trajectories across crop cycles.',
      tags: ['Performance Charts', 'Resource Efficiency', 'Trend Diagnostics']
    }
  ];

  // Grouped features for categorized layout
  const filteredFeatures = activeCategory === 'all'
    ? features
    : features.filter(f => f.categoryId === activeCategory);

  const farmIntelFeatures = features.filter(f => f.categoryId === 'farm-intelligence');
  const fieldEnvFeatures = features.filter(f => f.categoryId === 'field-environment');
  const aiMgmtFeatures = features.filter(f => f.categoryId === 'ai-management');

  return (
    <div className="space-y-16 sm:space-y-20 pb-16 selection:bg-emerald-500 selection:text-black">
      {/* ========================================================================= */}
      {/* 1. SHARED HERO SECTION */}
      {/* ========================================================================= */}
      <section className="pt-4 sm:pt-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/25 text-[#10B981] text-xs font-mono font-semibold"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
          <span>OS CAPABILITY OVERVIEW</span>
        </motion.div>

        <motion.h1
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-[#F3F7F5] tracking-tight leading-[1.15] max-w-3xl mx-auto"
        >
          Everything AgroVision AI brings to{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-300">
            your farm.
          </span>
        </motion.h1>

        <motion.p
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="text-xs sm:text-sm md:text-base text-[#8FA59B] max-w-2xl mx-auto leading-relaxed"
        >
          Explore the intelligence, monitoring and management capabilities available across the platform.
        </motion.p>

        {/* Category Filter Pills */}
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="flex flex-wrap items-center justify-center gap-1.5 pt-4"
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
                activeCategory === cat.id
                  ? 'bg-[#10B981]/15 text-[#F3F7F5] border border-[#10B981]/30 font-bold'
                  : 'text-[#8FA59B] hover:text-[#F3F7F5] hover:bg-[#0E1E18] border border-transparent'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* 2. CATEGORIZED COMPACT FEATURE MODULES */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Category 1: FARM INTELLIGENCE */}
        {(activeCategory === 'all' || activeCategory === 'farm-intelligence') && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[#1B382D]">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <h2 className="text-base sm:text-lg font-bold font-heading text-[#F3F7F5]">
                Category 1: Farm Intelligence
              </h2>
              <span className="text-xs text-[#577366] font-mono ml-auto">
                {farmIntelFeatures.length} Modules
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {farmIntelFeatures.map((f, idx) => (
                <FeatureModuleCard
                  key={f.id}
                  feature={f}
                  isSelected={selectedFeature === f.id}
                  onToggle={() => setSelectedFeature(selectedFeature === f.id ? null : f.id)}
                  delay={idx * 0.05}
                />
              ))}
            </div>
          </div>
        )}

        {/* Category 2: FIELD & ENVIRONMENT */}
        {(activeCategory === 'all' || activeCategory === 'field-environment') && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[#1B382D]">
              <span className="w-2 h-2 rounded-full bg-teal-400" />
              <h2 className="text-base sm:text-lg font-bold font-heading text-[#F3F7F5]">
                Category 2: Field & Environment
              </h2>
              <span className="text-xs text-[#577366] font-mono ml-auto">
                {fieldEnvFeatures.length} Modules
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {fieldEnvFeatures.map((f, idx) => (
                <FeatureModuleCard
                  key={f.id}
                  feature={f}
                  isSelected={selectedFeature === f.id}
                  onToggle={() => setSelectedFeature(selectedFeature === f.id ? null : f.id)}
                  delay={idx * 0.05}
                />
              ))}
            </div>
          </div>
        )}

        {/* Category 3: AI & FARM MANAGEMENT */}
        {(activeCategory === 'all' || activeCategory === 'ai-management') && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[#1B382D]">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <h2 className="text-base sm:text-lg font-bold font-heading text-[#F3F7F5]">
                Category 3: AI & Farm Management
              </h2>
              <span className="text-xs text-[#577366] font-mono ml-auto">
                {aiMgmtFeatures.length} Modules
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {aiMgmtFeatures.map((f, idx) => (
                <FeatureModuleCard
                  key={f.id}
                  feature={f}
                  isSelected={selectedFeature === f.id}
                  onToggle={() => setSelectedFeature(selectedFeature === f.id ? null : f.id)}
                  delay={idx * 0.05}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 3. PLATFORM SPECIFICATION SUMMARY CARD */}
      {/* ========================================================================= */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.35 }}
          className="bg-[#0E1E18] border border-[#1B382D] rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>UNIFIED WORKSPACE</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold font-heading text-[#F3F7F5]">
              Seamless Integration Across All Modules
            </h3>
            <p className="text-xs text-[#8FA59B] max-w-xl leading-relaxed">
              All tools share the same authenticated farm context. Weather data informs irrigation runtimes, soil reports adjust fertilizer dosing, and crop images trigger stage-specific advisories.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <Link
              to={user ? "/dashboard" : "/register"}
              className="os-btn-primary px-5 py-2.5 text-xs font-bold flex items-center gap-2"
            >
              <span>{user ? "View Dashboard" : "Get Started"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

// Compact Horizontal Feature Module Card
function FeatureModuleCard({ feature, isSelected, onToggle, delay = 0 }) {
  const shouldReduceMotion = useReducedMotion();
  const Icon = feature.icon;

  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.3, delay }}
      onClick={onToggle}
      className={`group bg-[#0E1E18] border rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-3 cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'border-[#10B981] bg-[#11261F] shadow-[0_8px_20px_rgba(0,0,0,0.5)]'
          : 'border-[#1B382D] hover:border-[#265040] hover:bg-[#11261F]'
      }`}
    >
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className={`w-9 h-9 rounded-lg ${feature.badgeBg} border ${feature.badgeBorder} flex items-center justify-center ${feature.iconColor}`}>
            <Icon className="w-4.5 h-4.5" />
          </div>

          <div className="flex items-center gap-1 text-xs font-mono text-[#577366] group-hover:text-emerald-400 transition-colors">
            <span className="text-[10px] uppercase">{isSelected ? 'Hide' : 'Details'}</span>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isSelected ? 'rotate-90 text-emerald-400' : 'group-hover:translate-x-0.5'}`} />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-[#F3F7F5] font-heading group-hover:text-emerald-300 transition-colors">
            {feature.title}
          </h3>
          <p className="text-xs text-[#8FA59B] leading-relaxed mt-1 line-clamp-2">
            {feature.desc}
          </p>
        </div>
      </div>

      {/* Expanded Spec Preview */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="pt-3 border-t border-[#1B382D] space-y-2 text-xs text-[#8FA59B]"
          >
            <p className="leading-relaxed text-[11px]">
              {feature.details}
            </p>
            <div className="flex flex-wrap gap-1 pt-1">
              {feature.tags.map((tag, tIdx) => (
                <span
                  key={tIdx}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#08120E] border border-[#1B382D] text-emerald-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
