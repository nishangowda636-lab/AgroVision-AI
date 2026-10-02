import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Database,
  Brain,
  Sprout,
  ShieldCheck,
  Compass,
  Eye,
  Activity,
  ArrowDown,
  Layers,
  Check,
  Zap,
  Cpu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AboutPage() {
  const shouldReduceMotion = useReducedMotion();
  const { user } = useAuth();

  // 3-Step Approach Sections
  const approachSteps = [
    {
      num: '01',
      title: 'Understand the Farm',
      subtitle: 'Context & Baseline Telemetry',
      desc: 'Farm location, crop type, soil profile, weather data, and available sensor information create the foundational farm context.',
      icon: Database,
      accent: 'emerald',
      color: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      signals: ['Field GPS Coordinates', 'Soil NPK & Texture Profile', 'Hyperlocal Microclimate', 'IoT Telemetry']
    },
    {
      num: '02',
      title: 'Understand the Crop',
      subtitle: 'Visual & Agronomic Diagnosis',
      desc: 'AI vision, crop intelligence, and field monitoring help identify crop conditions, growth stages, and health indicators.',
      icon: Eye,
      accent: 'teal',
      color: 'text-teal-400',
      badgeBg: 'bg-teal-500/10',
      borderColor: 'border-teal-500/20',
      signals: ['Foliage Pathology Scans', 'Growth Stage Verification', 'Stress & Nutrient Indexing', 'Canopy Status']
    },
    {
      num: '03',
      title: 'Recommend the Next Action',
      subtitle: 'Actionable Precision Guidance',
      desc: 'Weather forecasts, irrigation requirements, fertilizer needs, and farm intelligence are combined into practical guidance.',
      icon: Sparkles,
      accent: 'cyan',
      color: 'text-cyan-400',
      badgeBg: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20',
      signals: ['Watering Runtimes', 'Targeted NPK Dosing', 'Spray Timing Safety', 'Prioritized Daily Tasks']
    }
  ];

  // 3 Core Principles for Real Farm Decisions
  const principles = [
    {
      title: 'Farmer First',
      desc: 'Simple, high-clarity guidance designed for practical execution in the field rather than complex raw numbers.',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10'
    },
    {
      title: 'Actionable',
      desc: 'Direct recommendations on when to irrigate, apply nutrients, inspect foliage, or prepare for harvest.',
      icon: Compass,
      color: 'text-teal-400',
      bg: 'bg-teal-500/10'
    },
    {
      title: 'Transparent',
      desc: 'Clear data notices and confidence indicators so farmers always understand the reason behind every advisory.',
      icon: ShieldCheck,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10'
    }
  ];

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
          <span>ABOUT AGROVISION AI</span>
        </motion.div>

        <motion.h1
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-[#F3F7F5] tracking-tight leading-[1.15] max-w-3xl mx-auto"
        >
          Technology built around{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-300">
            the farmer.
          </span>
        </motion.h1>

        <motion.p
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="text-xs sm:text-sm md:text-base text-[#8FA59B] max-w-2xl mx-auto leading-relaxed"
        >
          AgroVision AI is a farmer-focused digital agriculture platform designed to turn farm data into practical decisions.
        </motion.p>
      </section>

      {/* ========================================================================= */}
      {/* 2. CORE TRANSFORMATION VISUAL FLOW */}
      {/* FARM DATA + AI + AGRICULTURAL INTELLIGENCE => BETTER FARM DECISIONS */}
      {/* ========================================================================= */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4 }}
          className="bg-[#0E1E18] border border-[#1B382D] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden"
        >
          {/* Subtle Ambient Light */}
          <div className="absolute top-0 right-1/4 w-96 h-48 bg-emerald-500/5 blur-[90px] pointer-events-none rounded-full" />

          {/* Section Header inside Container */}
          <div className="text-center space-y-1.5 mb-8">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#10B981] font-semibold">
              THE AGROVISION CORE FORMULA
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-[#F3F7F5] font-heading">
              How Data Becomes Practical Guidance
            </h2>
          </div>

          {/* 3 Input Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch relative">
            {/* 1: Farm Data */}
            <div className="bg-[#08120E] border border-[#1B382D] rounded-xl p-5 flex flex-col justify-between space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                  <Database className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold uppercase">Signal Ingestion</span>
                  <h3 className="text-sm font-bold text-[#F3F7F5]">Farm Data</h3>
                </div>
              </div>
              <p className="text-xs text-[#8FA59B] leading-relaxed">
                Coordinates, soil type, weather forecasts, crop records, and connected field sensors.
              </p>
            </div>

            {/* + Sign on desktop */}
            <div className="hidden md:flex absolute left-[32.5%] top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-[#13271F] border border-[#1B382D] items-center justify-center text-[#10B981] text-xs font-bold shadow">
              +
            </div>

            {/* 2: AI Models */}
            <div className="bg-[#08120E] border border-[#1B382D] rounded-xl p-5 flex flex-col justify-between space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-400">
                  <Brain className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-teal-400 font-semibold uppercase">Processing Engine</span>
                  <h3 className="text-sm font-bold text-[#F3F7F5]">AI Models</h3>
                </div>
              </div>
              <p className="text-xs text-[#8FA59B] leading-relaxed">
                Computer vision leaf pathology, machine learning suitability, and yield prediction curves.
              </p>
            </div>

            {/* + Sign on desktop */}
            <div className="hidden md:flex absolute left-[66%] top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-[#13271F] border border-[#1B382D] items-center justify-center text-[#10B981] text-xs font-bold shadow">
              +
            </div>

            {/* 3: Agricultural Intelligence */}
            <div className="bg-[#08120E] border border-[#1B382D] rounded-xl p-5 flex flex-col justify-between space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400">
                  <Sprout className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 font-semibold uppercase">Agronomic Logic</span>
                  <h3 className="text-sm font-bold text-[#F3F7F5]">Agricultural Intel</h3>
                </div>
              </div>
              <p className="text-xs text-[#8FA59B] leading-relaxed">
                Crop growth stages, soil moisture deficits, regional spray timings, and fertilizer balance.
              </p>
            </div>
          </div>

          {/* Arrow Down Indicator */}
          <div className="flex justify-center my-4">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981]">
              <ArrowDown className="w-4 h-4" />
            </div>
          </div>

          {/* Outcome: Better Farm Decisions */}
          <div className="bg-gradient-to-r from-[#0E291E] via-[#0D241C] to-[#0E291E] border border-emerald-500/35 rounded-xl p-5 text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold font-mono text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>THE PRACTICAL RESULT</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#F3F7F5] font-heading">
              Better Farm Decisions
            </h3>
            <p className="text-xs text-[#8FA59B] max-w-xl mx-auto leading-relaxed">
              Clear, prioritized daily actions: when to irrigate, exact fertilizer dosing, disease treatments, and optimal harvesting windows.
            </p>
          </div>
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* 3. OUR APPROACH (3 Large but Compact Sections) */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#10B981]">
            OUR APPROACH
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-heading text-[#F3F7F5]">
            Three Steps from Context to Action
          </h2>
          <p className="text-xs sm:text-sm text-[#8FA59B] max-w-xl mx-auto">
            A structured agronomic workflow that respects the reality of field conditions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {approachSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.num}
                initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.35, delay: idx * 0.08 }}
                className="bg-[#0E1E18] border border-[#1B382D] hover:border-[#265040] rounded-2xl p-6 flex flex-col justify-between space-y-4 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black font-mono text-emerald-400">
                      {step.num}
                    </span>
                    <div className={`w-10 h-10 rounded-xl ${step.badgeBg} border ${step.borderColor} flex items-center justify-center ${step.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#F3F7F5] font-heading">
                      {step.title}
                    </h3>
                    <p className="text-[11px] font-mono font-semibold text-[#10B981] mt-0.5">
                      {step.subtitle}
                    </p>
                  </div>

                  <p className="text-xs text-[#8FA59B] leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                {/* Signal Indicators */}
                <div className="pt-3 border-t border-[#1B382D] space-y-1.5">
                  <span className="text-[10px] font-mono text-[#577366] uppercase tracking-wider block">
                    Key Components:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {step.signals.map((sig, sIdx) => (
                      <span
                        key={sIdx}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-[#08120E] border border-[#1B382D] text-[#8FA59B]"
                      >
                        <Check className="w-2.5 h-2.5 text-emerald-400" />
                        {sig}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. OUR VISION STATEMENT */}
      {/* ========================================================================= */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.35 }}
          className="bg-gradient-to-br from-[#0E1E18] to-[#0A1612] border border-[#1B382D] rounded-2xl sm:rounded-3xl p-7 sm:p-10 text-center space-y-4 shadow-xl relative"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-semibold">
            <Sprout className="w-3.5 h-3.5" />
            <span>OUR VISION</span>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-heading text-[#F3F7F5] max-w-2xl mx-auto leading-snug">
            “Make advanced agricultural intelligence accessible and understandable for farmers.”
          </h2>

          <p className="text-xs sm:text-sm text-[#8FA59B] max-w-xl mx-auto leading-relaxed">
            Smart farming shouldn't require complex data science. AgroVision AI bridges agronomic research, field observations, and predictive algorithms into straightforward, everyday recommendations.
          </p>
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* 5. BUILT FOR REAL FARM DECISIONS (Only 3 Principles) */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-1.5">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#10B981]">
            CORE VALUES
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-heading text-[#F3F7F5]">
            Built for Real Farm Decisions
          </h2>
          <p className="text-xs sm:text-sm text-[#8FA59B] max-w-md mx-auto">
            Every feature is designed around clarity, utility, and grower confidence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {principles.map((p, idx) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.3, delay: idx * 0.08 }}
                className="bg-[#0E1E18] border border-[#1B382D] rounded-2xl p-6 space-y-3"
              >
                <div className={`w-10 h-10 rounded-xl ${p.bg} border border-[#1B382D] flex items-center justify-center ${p.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#F3F7F5] font-heading">
                  {p.title}
                </h3>
                <p className="text-xs text-[#8FA59B] leading-relaxed">
                  {p.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. CALL TO ACTION BANNER */}
      {/* ========================================================================= */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.35 }}
          className="bg-[#0E1E18] border border-[#1B382D] rounded-2xl sm:rounded-3xl p-8 sm:p-10 text-center space-y-5 shadow-2xl"
        >
          <h2 className="text-2xl sm:text-3xl font-bold font-heading text-[#F3F7F5]">
            Ready to Make Better Farm Decisions?
          </h2>
          <p className="text-xs sm:text-sm text-[#8FA59B] max-w-lg mx-auto leading-relaxed">
            Set up your digital farm in minutes and access tailored crop health diagnostics, irrigation schedules, and AI recommendations.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              to={user ? "/dashboard" : "/register"}
              className="os-btn-primary px-6 py-2.5 text-xs sm:text-sm flex items-center gap-2"
            >
              <span>{user ? "Open Farm Dashboard" : "Get Started Free"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/features"
              className="os-btn-secondary px-5 py-2.5 text-xs sm:text-sm"
            >
              Explore Features
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
