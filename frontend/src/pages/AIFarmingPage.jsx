import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Sparkles,
  Bot,
  CloudSun,
  Cpu,
  Eye,
  Brain,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  Droplets,
  Layers,
  Clock,
  ShieldCheck,
  Compass,
  Database,
  History,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AIFarmingPage() {
  const shouldReduceMotion = useReducedMotion();
  const { user } = useAuth();

  // 5-Stage How The AI Works Flow
  const aiWorkflow = [
    {
      step: '01',
      name: 'Observe',
      desc: 'Collect available farm signals from weather forecasts, IoT sensors, soil records, and crop photographs.',
      icon: Eye,
      color: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10'
    },
    {
      step: '02',
      name: 'Understand',
      desc: 'Analyze crop growth stage, soil moisture deficit, ambient humidity, and potential disease signatures.',
      icon: Brain,
      color: 'text-teal-400',
      badgeBg: 'bg-teal-500/10'
    },
    {
      step: '03',
      name: 'Prioritize',
      desc: 'Identify what needs the farmer’s attention first (e.g. imminent rainfall, pest spread, or moisture drop).',
      icon: AlertCircle,
      color: 'text-amber-400',
      badgeBg: 'bg-amber-500/10'
    },
    {
      step: '04',
      name: 'Recommend',
      desc: 'Generate practical next steps with exact timings, dosing requirements, and preventive precautions.',
      icon: Sparkles,
      color: 'text-emerald-300',
      badgeBg: 'bg-emerald-500/10'
    },
    {
      step: '05',
      name: 'Learn from Farm History',
      desc: 'Use available historical harvest data and seasonal input records to improve future farm context.',
      icon: History,
      color: 'text-cyan-400',
      badgeBg: 'bg-cyan-500/10'
    }
  ];

  // 3-Layer Agricultural AI System
  const threeLayers = [
    {
      layer: 'Layer 1',
      title: 'AI Vision',
      question: '“What is this?”',
      desc: 'Computer vision neural networks inspect crop foliage images to detect leaf lesions, discoloration, blights, and physical stress markers.',
      icon: Eye,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20'
    },
    {
      layer: 'Layer 2',
      title: 'ML Models',
      question: '“What could be happening?”',
      desc: 'Statistical learning and regression models evaluate multi-factor suitability, harvest tonnage trajectories, and soil nutrient depletion.',
      icon: Brain,
      color: 'text-teal-400',
      bg: 'bg-teal-500/10',
      border: 'border-teal-500/20'
    },
    {
      layer: 'Layer 3',
      title: 'Agricultural Intelligence',
      question: '“What should the farmer do?”',
      desc: 'Agronomic rules engines translate diagnostic predictions into concrete daily farm actions, fertilizer quantities, and spray windows.',
      icon: Sparkles,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20'
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
          <span>AI FARM CO-PILOT</span>
        </motion.div>

        <motion.h1
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-[#F3F7F5] tracking-tight leading-[1.15] max-w-3xl mx-auto"
        >
          Your digital{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-300">
            farm co-pilot.
          </span>
        </motion.h1>

        <motion.p
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="text-xs sm:text-sm md:text-base text-[#8FA59B] max-w-2xl mx-auto leading-relaxed"
        >
          AgroVision AI brings multiple sources of farm information together and turns them into prioritized actions.
        </motion.p>
      </section>

      {/* ========================================================================= */}
      {/* 2. CENTRAL AI ARCHITECTURE FLOW DIAGRAM */}
      {/* ========================================================================= */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4 }}
          className="bg-[#0E1E18] border border-[#1B382D] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl space-y-6"
        >
          <div className="text-center space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#10B981] font-semibold">
              ARCHITECTURE OVERVIEW
            </span>
            <h2 className="text-lg sm:text-xl font-bold font-heading text-[#F3F7F5]">
              Autonomous Signal Fusion Pipeline
            </h2>
          </div>

          {/* Node 1: YOUR FARM */}
          <div className="flex flex-col items-center">
            <div className="w-full max-w-xs bg-[#13271F] border border-emerald-500/40 rounded-xl p-3.5 text-center shadow-md">
              <span className="text-[10px] font-mono text-emerald-400 font-semibold uppercase block">Primary Anchor</span>
              <span className="text-sm font-bold text-[#F3F7F5] flex items-center justify-center gap-1.5 mt-0.5">
                <Database className="w-4 h-4 text-emerald-400" />
                YOUR FARM
              </span>
            </div>

            <div className="w-px h-6 bg-[#1B382D] my-1 flex items-center justify-center">
              <ArrowDown className="w-3.5 h-3.5 text-[#10B981]" />
            </div>

            {/* 3 Input Streams */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
              <div className="bg-[#08120E] border border-[#1B382D] rounded-xl p-3 text-center space-y-1">
                <CloudSun className="w-5 h-5 text-amber-400 mx-auto" />
                <span className="text-xs font-bold text-[#F3F7F5] block">WEATHER</span>
                <span className="text-[10px] text-[#8FA59B] block">Precipitation & Temp</span>
              </div>

              <div className="bg-[#08120E] border border-[#1B382D] rounded-xl p-3 text-center space-y-1">
                <Cpu className="w-5 h-5 text-cyan-400 mx-auto" />
                <span className="text-xs font-bold text-[#F3F7F5] block">IoT SENSORS</span>
                <span className="text-[10px] text-[#8FA59B] block">Soil Moisture & NPK</span>
              </div>

              <div className="bg-[#08120E] border border-[#1B382D] rounded-xl p-3 text-center space-y-1">
                <Eye className="w-5 h-5 text-rose-400 mx-auto" />
                <span className="text-xs font-bold text-[#F3F7F5] block">CROP IMAGE</span>
                <span className="text-[10px] text-[#8FA59B] block">Foliage Pathology</span>
              </div>
            </div>

            <div className="w-px h-6 bg-[#1B382D] my-1 flex items-center justify-center">
              <ArrowDown className="w-3.5 h-3.5 text-[#10B981]" />
            </div>

            {/* Node 3: AI INTELLIGENCE */}
            <div className="w-full max-w-sm bg-gradient-to-r from-[#0C2419] via-[#0E2E20] to-[#0C2419] border border-emerald-500/50 rounded-xl p-3.5 text-center shadow-lg">
              <span className="text-[10px] font-mono text-emerald-300 font-semibold uppercase block">Multi-Signal Synthesis</span>
              <span className="text-sm font-bold text-[#F3F7F5] flex items-center justify-center gap-1.5 mt-0.5">
                <Brain className="w-4 h-4 text-emerald-400" />
                AI INTELLIGENCE
              </span>
            </div>

            <div className="w-px h-6 bg-[#1B382D] my-1 flex items-center justify-center">
              <ArrowDown className="w-3.5 h-3.5 text-[#10B981]" />
            </div>

            {/* Node 4: FARM RECOMMENDATION */}
            <div className="w-full max-w-xs bg-[#0E1E18] border border-[#1B382D] rounded-xl p-3 text-center">
              <span className="text-[10px] font-mono text-teal-400 font-semibold uppercase block">Agronomic Engine</span>
              <span className="text-xs font-bold text-[#F3F7F5] block mt-0.5">FARM RECOMMENDATION</span>
            </div>

            <div className="w-px h-6 bg-[#1B382D] my-1 flex items-center justify-center">
              <ArrowDown className="w-3.5 h-3.5 text-[#10B981]" />
            </div>

            {/* Node 5: TODAY'S FARM PLAN */}
            <div className="w-full max-w-sm bg-[#13271F] border border-emerald-500/60 rounded-xl p-4 text-center shadow-md">
              <span className="text-[10px] font-mono text-emerald-400 font-semibold uppercase block">Actionable Output</span>
              <span className="text-sm font-bold text-white flex items-center justify-center gap-2 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                TODAY'S FARM PLAN
              </span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* 3. HOW THE AI WORKS (5-Step Sequential Flow) */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-1.5">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#10B981]">
            THE PROCESS
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-heading text-[#F3F7F5]">
            How the AI Works
          </h2>
          <p className="text-xs sm:text-sm text-[#8FA59B] max-w-lg mx-auto">
            From raw signal ingestion to prioritized daily actions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {aiWorkflow.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.step}
                initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.3, delay: idx * 0.06 }}
                className="bg-[#0E1E18] border border-[#1B382D] rounded-2xl p-5 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-mono font-black text-emerald-400">{step.step}</span>
                    <div className={`w-8 h-8 rounded-lg ${step.badgeBg} border border-[#1B382D] flex items-center justify-center ${step.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-[#F3F7F5] font-heading">{step.name}</h3>
                  <p className="text-xs text-[#8FA59B] leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. AI FARM AGENT — DASHBOARD-STYLE PREVIEW */}
      {/* ========================================================================= */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.35 }}
          className="bg-[#0E1E18] border border-[#1B382D] rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl"
        >
          {/* Header with Example Disclaimer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1B382D]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base sm:text-lg font-bold font-heading text-[#F3F7F5]">
                  AI Farm Agent
                </h2>
              </div>
              <p className="text-xs text-[#8FA59B]">
                Synthesizes field signals into a single daily farm agenda.
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 text-emerald-400 text-[11px] font-mono font-semibold self-start sm:self-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Example AI Farm Plan</span>
            </div>
          </div>

          {/* Today's Farm Plan Card Preview */}
          <div className="space-y-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#577366] font-semibold">
              TODAY'S PRIORITIZED ACTIONS
            </span>

            {/* Item 1: Delay Irrigation */}
            <div className="bg-[#08120E] border border-[#1B382D] hover:border-[#265040] rounded-xl p-4 flex items-start gap-3.5 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                <CloudSun className="w-4 h-4" />
              </div>
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-[#F3F7F5]">Delay Irrigation</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    High Priority
                  </span>
                </div>
                <p className="text-xs text-[#8FA59B] leading-relaxed">
                  Rain is expected within the next 12 hours. Postponing irrigation will prevent waterlogging and conserve pump energy.
                </p>
              </div>
            </div>

            {/* Item 2: Inspect Lower Leaves */}
            <div className="bg-[#08120E] border border-[#1B382D] hover:border-[#265040] rounded-xl p-4 flex items-start gap-3.5 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
                <Eye className="w-4 h-4" />
              </div>
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-[#F3F7F5]">Inspect Lower Leaves</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    Attention
                  </span>
                </div>
                <p className="text-xs text-[#8FA59B] leading-relaxed">
                  Continuous high humidity and canopy density create conditions for early fungal spots. Check underside foliage in Plot 1.
                </p>
              </div>
            </div>

            {/* Item 3: Monitor Soil Moisture */}
            <div className="bg-[#08120E] border border-[#1B382D] hover:border-[#265040] rounded-xl p-4 flex items-start gap-3.5 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-400 shrink-0 mt-0.5">
                <Droplets className="w-4 h-4" />
              </div>
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-[#F3F7F5]">Monitor Soil Moisture</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                    Optimal
                  </span>
                </div>
                <p className="text-xs text-[#8FA59B] leading-relaxed">
                  Current root zone moisture is at 62%, which is adequate for the current vegetative growth stage.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* 5. 3-LAYER AGRICULTURAL AI SYSTEM */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-1.5">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#10B981]">
            AGROVISION ARCHITECTURE
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-heading text-[#F3F7F5]">
            3-Layer Agricultural AI
          </h2>
          <p className="text-xs sm:text-sm text-[#8FA59B] max-w-lg mx-auto">
            How vision, predictive machine learning, and agronomy work together.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {threeLayers.map((l, idx) => {
            const Icon = l.icon;
            return (
              <motion.div
                key={l.layer}
                initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.3, delay: idx * 0.08 }}
                className="bg-[#0E1E18] border border-[#1B382D] rounded-2xl p-6 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#577366] font-semibold uppercase">
                      {l.layer}
                    </span>
                    <div className={`w-9 h-9 rounded-xl ${l.bg} border ${l.border} flex items-center justify-center ${l.color}`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#F3F7F5] font-heading">
                      {l.title}
                    </h3>
                    <p className="text-xs font-mono font-semibold text-emerald-400 mt-0.5">
                      {l.question}
                    </p>
                  </div>

                  <p className="text-xs text-[#8FA59B] leading-relaxed">
                    {l.desc}
                  </p>
                </div>
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
            Put Farm Intelligence to Work
          </h2>
          <p className="text-xs sm:text-sm text-[#8FA59B] max-w-lg mx-auto leading-relaxed">
            Get personalized irrigation timing, crop health scans, and autonomous farm action plans tailored to your land.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              to={user ? "/dashboard" : "/register"}
              className="os-btn-primary px-6 py-2.5 text-xs sm:text-sm flex items-center gap-2"
            >
              <span>{user ? "Open Farm Dashboard" : "Get Started Free"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
