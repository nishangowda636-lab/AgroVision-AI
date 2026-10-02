import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Droplets,
  CloudSun,
  Bot,
  Bug,
  Cpu,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  Eye,
  Check,
  Compass
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const shouldReduceMotion = useReducedMotion();
  const { user } = useAuth();

  // Core Value Capabilities (4 Main Ideas)
  const coreCapabilities = [
    {
      icon: Eye,
      title: 'Understand',
      subtitle: 'Know your crop and field condition.',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      desc: 'Get clarity on canopy health, soil moisture levels, and vegetation status across all farm plots.'
    },
    {
      icon: CloudSun,
      title: 'Predict',
      subtitle: 'Understand weather and upcoming conditions.',
      color: 'text-teal-400',
      bg: 'bg-teal-500/10',
      border: 'border-teal-500/20',
      desc: 'Anticipate rainfall windows, temperature fluctuations, and humidity-driven disease risks.'
    },
    {
      icon: Droplets,
      title: 'Decide',
      subtitle: 'Make smarter irrigation and input decisions.',
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      desc: 'Determine optimal irrigation runtimes and targeted fertilizer requirements to prevent waste.'
    },
    {
      icon: Bot,
      title: 'Act',
      subtitle: 'Get prioritized recommendations from your AI farm co-pilot.',
      color: 'text-emerald-300',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      desc: 'Receive clear, prioritized daily action items synthesized from your real field signals.'
    }
  ];

  // How AgroVision Works (4-Step Visual Flow)
  const workflowSteps = [
    {
      step: '01',
      title: 'SET UP YOUR FARM',
      desc: 'Add farm location, area, crop and soil information to build your digital field profile.',
      icon: MapPin,
      color: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10'
    },
    {
      step: '02',
      title: 'CONNECT YOUR DATA',
      desc: 'Weather, IoT sensors, crop images and field information flow into the platform.',
      icon: Cpu,
      color: 'text-teal-400',
      badgeBg: 'bg-teal-500/10'
    },
    {
      step: '03',
      title: 'AI ANALYZES YOUR FARM',
      desc: 'AI models combine available farm information and evaluate cross-field conditions.',
      icon: Sparkles,
      color: 'text-cyan-400',
      badgeBg: 'bg-cyan-500/10'
    },
    {
      step: '04',
      title: 'GET PRACTICAL ACTIONS',
      desc: 'Receive recommendations, alerts and a daily farm plan tailored to your field needs.',
      icon: CheckCircle2,
      color: 'text-emerald-300',
      badgeBg: 'bg-emerald-500/10'
    }
  ];

  // Why AgroVision AI (4 Principles)
  const principles = [
    {
      title: 'Farmer First',
      desc: 'Simple actions instead of complicated data.',
      detail: 'Clear, actionable advisories designed for practical decisions in the field rather than complex raw numbers.',
      icon: CheckCircle2,
      color: 'text-emerald-400'
    },
    {
      title: 'Context Aware',
      desc: 'Recommendations use your farm conditions when data is available.',
      detail: 'Advisories dynamically adapt based on your specific crop stage, soil profile, and localized microclimate.',
      icon: Compass,
      color: 'text-teal-400'
    },
    {
      title: 'AI Assisted',
      desc: 'AI helps analyze information and prioritize actions.',
      detail: 'Synthesizes multiple field signals into a single daily plan, highlighting urgent tasks first.',
      icon: Bot,
      color: 'text-cyan-400'
    },
    {
      title: 'Transparent',
      desc: 'When information is missing or uncertain, the system should make that clear.',
      detail: 'Confidence indicators and clear data notices ensure you always know the basis of every recommendation.',
      icon: ShieldCheck,
      color: 'text-emerald-300'
    }
  ];

  // 3 Feature Categories (Explore Ecosystem)
  const ecosystemCategories = [
    {
      icon: Eye,
      title: 'Farm Intelligence',
      badge: 'Crop & Agronomy',
      color: 'text-emerald-400',
      desc: 'Crop health, recommendations and yield insights.',
      items: ['AI Crop Disease Detection', 'Soil-Matched Crop Suitability', 'Harvest Yield Forecasting']
    },
    {
      icon: CloudSun,
      title: 'Environmental Intelligence',
      badge: 'Climate & Water',
      color: 'text-teal-400',
      desc: 'Weather, irrigation and field monitoring.',
      items: ['Hyperlocal Weather Radar', 'Smart Irrigation Scheduling', 'Wireless IoT Soil Telemetry']
    },
    {
      icon: Bot,
      title: 'AI Farm Management',
      badge: 'Operations & Co-Pilot',
      color: 'text-cyan-400',
      desc: 'AI Farm Agent, farm planning, ledger and analytics.',
      items: ['Autonomous Farm Co-Pilot', 'Daily Action Prioritization', 'Input Expense & Harvest Ledger']
    }
  ];

  return (
    <div className="space-y-20 sm:space-y-24 pb-16 selection:bg-emerald-500 selection:text-black">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION & VISUAL PREVIEW */}
      {/* ========================================================================= */}
      <section className="pt-4 sm:pt-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Column: Hero Copy */}
          <div className="lg:col-span-7 space-y-5 text-left">
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/25 text-[#10B981] text-xs font-mono font-semibold"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span>AI-POWERED SMART AGRICULTURE</span>
            </motion.div>

            <div className="space-y-2">
              <motion.h1
                initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-[#F3F7F5] tracking-tight leading-[1.15]"
              >
                Smarter Farms. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-300">
                  Better Decisions.
                </span>
              </motion.h1>

              <motion.p
                initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
                className="text-sm sm:text-base font-semibold text-emerald-400/90"
              >
                AI-powered intelligence for every stage of your farming journey.
              </motion.p>
            </div>

            <motion.p
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15 }}
              className="text-xs sm:text-sm text-[#8FA59B] leading-relaxed max-w-xl"
            >
              AgroVision AI brings together farm data, weather intelligence, crop health, soil conditions, IoT sensors and AI-powered recommendations to help farmers make practical decisions.
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.2 }}
              className="flex flex-wrap items-center gap-3 pt-1"
            >
              <Link
                to={user ? "/dashboard" : "/register"}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-[#08120E] font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/15 hover:shadow-emerald-500/25 transition-all duration-200 active:scale-[0.98]"
              >
                <span>{user ? "Go to Dashboard" : "Get Started Free"}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0E1E18] hover:bg-[#1B382D]/40 text-[#F3F7F5] border border-[#1B382D] text-xs sm:text-sm font-medium transition-all duration-200 hover:border-emerald-500/30 active:scale-[0.98]"
              >
                <span>Explore AgroVision</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#8FA59B]" />
              </a>
            </motion.div>

            {/* Trust Status Line */}
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.25 }}
              className="pt-2 flex items-center gap-2 text-[11px] text-[#8FA59B]/90 font-medium"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
              <span>One platform for understanding, monitoring and managing your farm.</span>
            </motion.div>
          </div>

          {/* Right Column: Hero Visual Intelligence Preview */}
          <div className="lg:col-span-5">
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="rounded-xl bg-[#0E1E18] border border-[#1B382D] p-5 shadow-xl shadow-black/40 relative overflow-hidden"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-[#1B382D]">
                <div className="flex items-center gap-2">
                  <span className="text-base">🌱</span>
                  <span className="text-xs font-mono font-bold tracking-wider text-[#F3F7F5] uppercase">
                    FARM INTELLIGENCE
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  AgroVision Intelligence Preview
                </span>
              </div>

              {/* Metric Rows */}
              <div className="py-4 space-y-3">
                <div className="flex items-center justify-between text-xs py-1 border-b border-[#1B382D]/40">
                  <span className="text-[#8FA59B]">Farm Health</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-[#08120E] rounded-full overflow-hidden">
                      <div className="w-[88%] h-full bg-emerald-400 rounded-full" />
                    </div>
                    <span className="font-mono font-bold text-[#F3F7F5]">88</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs py-1 border-b border-[#1B382D]/40">
                  <span className="text-[#8FA59B]">Soil Moisture</span>
                  <div className="flex items-center gap-1.5 font-mono font-semibold text-teal-300">
                    <Droplets className="w-3.5 h-3.5 text-teal-400" />
                    <span>41%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs py-1 border-b border-[#1B382D]/40">
                  <span className="text-[#8FA59B]">Weather</span>
                  <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                    <CloudSun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Rain</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-[#8FA59B]">Crop Health</span>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Healthy
                  </span>
                </div>
              </div>

              {/* AI Insight Box */}
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>✨ AI Insight</span>
                </div>
                <p className="text-[11px] text-[#F3F7F5]/90 leading-snug">
                  Rain expected tomorrow. Consider delaying irrigation.
                </p>
              </div>

              {/* Subtle Disclaimer Footer */}
              <div className="mt-3 pt-2 text-[10px] text-[#8FA59B]/60 text-center font-mono">
                Design Preview • Illustrative Farm Data
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. VALUE PROPOSITION: 4 Core Capabilities */}
      {/* ========================================================================= */}
      <section id="core-value" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] text-xs font-mono font-semibold">
            CORE CAPABILITIES
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-heading text-[#F3F7F5] tracking-tight">
            From farm data to practical decisions.
          </h2>
          <p className="text-xs sm:text-sm text-[#8FA59B] leading-relaxed">
            AgroVision AI connects information from your farm and turns it into clear, actionable guidance.
          </p>
        </div>

        {/* 4 Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {coreCapabilities.map((cap, idx) => {
            const Icon = cap.icon;
            return (
              <motion.div
                key={cap.title}
                initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.3, delay: idx * 0.06 }}
                className="p-5 rounded-xl bg-[#0E1E18] border border-[#1B382D] hover:border-emerald-500/40 transition-all duration-200 group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className={`w-9 h-9 rounded-lg ${cap.bg} border ${cap.border} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${cap.color}`} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#F3F7F5] group-hover:text-emerald-300 transition-colors">
                      {cap.title}
                    </h3>
                    <p className="text-xs font-semibold text-emerald-400/90 mt-0.5">
                      {cap.subtitle}
                    </p>
                  </div>
                  <p className="text-xs text-[#8FA59B] leading-relaxed">
                    {cap.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. HOW AGROVISION WORKS (4-Step Visual Flow) */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-mono font-semibold">
            THE PROCESS
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-heading text-[#F3F7F5] tracking-tight">
            How AgroVision AI works
          </h2>
          <p className="text-xs sm:text-sm text-[#8FA59B]">
            A continuous intelligence cycle transforming field signals into daily farm actions.
          </p>
        </div>

        {/* 4-Step Sequence */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
          {workflowSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.step}
                initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.3, delay: idx * 0.08 }}
                className="p-5 rounded-xl bg-[#0E1E18] border border-[#1B382D] relative overflow-hidden flex flex-col justify-between group hover:border-teal-500/30 transition-all duration-200"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-mono font-bold text-emerald-400/80">
                      {step.step}
                    </span>
                    <div className={`p-1.5 rounded-md ${step.badgeBg}`}>
                      <Icon className={`w-4 h-4 ${step.color}`} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-bold text-[#F3F7F5] tracking-wider uppercase">
                      {step.title}
                    </h3>
                    <p className="text-xs text-[#8FA59B] mt-2 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. AI FARM CO-PILOT SECTION */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-[#0E1E18] border border-[#1B382D] p-6 sm:p-8 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: AI Farm Agent Story */}
            <div className="lg:col-span-6 space-y-4 text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono font-semibold">
                <Bot className="w-3.5 h-3.5" />
                <span>AI FARM CO-PILOT</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold font-heading text-[#F3F7F5] tracking-tight">
                Your digital farm co-pilot.
              </h2>

              <p className="text-xs sm:text-sm text-[#8FA59B] leading-relaxed">
                Instead of checking every farming condition separately, AgroVision AI brings important information together and helps prioritize what needs your attention.
              </p>

              <div className="pt-2">
                <Link
                  to="/ai-farming"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all duration-200"
                >
                  <span>Explore AI Farming</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Right Column: Today's Farm Plan Preview */}
            <div className="lg:col-span-6">
              <div className="rounded-xl bg-[#08120E] border border-[#1B382D] p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-[#1B382D]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-mono font-bold tracking-wider text-[#F3F7F5]">
                      TODAY'S FARM PLAN
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#1B382D]/50 text-[#8FA59B] border border-[#1B382D]">
                    Example AI Farm Plan
                  </span>
                </div>

                {/* Plan Items */}
                <div className="space-y-2.5">
                  <div className="p-3 rounded-lg bg-[#0E1E18] border border-amber-500/20 flex items-start gap-3">
                    <span className="text-base mt-0.5">🌧</span>
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#F3F7F5]">Delay irrigation</span>
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                          Action
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8FA59B]">
                        Rain is expected.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0E1E18] border border-emerald-500/20 flex items-start gap-3">
                    <span className="text-base mt-0.5">🌱</span>
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#F3F7F5]">Inspect crop leaves</span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          Attention
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8FA59B]">
                        Humidity conditions require attention.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0E1E18] border border-teal-500/20 flex items-start gap-3">
                    <span className="text-base mt-0.5">💧</span>
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#F3F7F5]">Monitor soil moisture</span>
                        <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded">
                          Stable
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8FA59B]">
                        Current conditions are adequate.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. CROP + WEATHER INTELLIGENCE (Combined Visual Section) */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono font-semibold">
            FIELD REASONING
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-heading text-[#F3F7F5] tracking-tight">
            Understand what your farm conditions mean.
          </h2>
          <p className="text-xs sm:text-sm text-[#8FA59B]">
            AgroVision combines environmental indicators to generate clear agronomic actions.
          </p>
        </div>

        {/* Combined Intelligence Flow */}
        <div className="p-6 rounded-2xl bg-[#0E1E18] border border-[#1B382D] space-y-6">
          {/* Signal Synthesis Banner */}
          <div className="p-3.5 rounded-xl bg-[#08120E] border border-[#1B382D] flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-mono text-center">
            <span className="px-2.5 py-1 rounded bg-[#1B382D]/40 text-[#F3F7F5]">Weather</span>
            <span className="text-emerald-400 font-bold">+</span>
            <span className="px-2.5 py-1 rounded bg-[#1B382D]/40 text-[#F3F7F5]">Crop Condition</span>
            <span className="text-emerald-400 font-bold">+</span>
            <span className="px-2.5 py-1 rounded bg-[#1B382D]/40 text-[#F3F7F5]">Soil / IoT</span>
            <span className="text-emerald-400 font-bold">+</span>
            <span className="px-2.5 py-1 rounded bg-[#1B382D]/40 text-[#F3F7F5]">Farm Context</span>
            <span className="text-emerald-400 font-bold text-sm">➔</span>
            <span className="px-3 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
              AI Intelligence ➔ Actionable Guidance
            </span>
          </div>

          {/* 3 Illustrative Scenario Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#08120E] border border-[#1B382D] space-y-2">
              <div className="text-xs font-mono font-bold text-amber-400">
                Rain expected
              </div>
              <div className="text-sm font-bold text-[#F3F7F5] flex items-center gap-1.5">
                <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Delay irrigation</span>
              </div>
              <p className="text-xs text-[#8FA59B] leading-relaxed">
                Prevents field waterlogging and saves pump electricity by utilizing forecasted precipitation.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#08120E] border border-[#1B382D] space-y-2">
              <div className="text-xs font-mono font-bold text-teal-400">
                High humidity
              </div>
              <div className="text-sm font-bold text-[#F3F7F5] flex items-center gap-1.5">
                <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Inspect crop for fungal symptoms</span>
              </div>
              <p className="text-xs text-[#8FA59B] leading-relaxed">
                Alerts you to inspect lower leaves early before spore proliferation damages yield.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#08120E] border border-[#1B382D] space-y-2">
              <div className="text-xs font-mono font-bold text-cyan-400">
                Low soil moisture
              </div>
              <div className="text-sm font-bold text-[#F3F7F5] flex items-center gap-1.5">
                <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Check irrigation requirement</span>
              </div>
              <p className="text-xs text-[#8FA59B] leading-relaxed">
                Calculates precise water volume based on root depth to protect vegetative growth.
              </p>
            </div>
          </div>

          <div className="text-[11px] text-center text-[#8FA59B]/70 font-mono">
            * Illustrative examples demonstrating multi-signal reasoning logic.
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. AI CROP ANALYSIS (3-Layer Pipeline) */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-semibold">
            IMAGE INTELLIGENCE
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-heading text-[#F3F7F5] tracking-tight">
            See what is happening to your crops.
          </h2>
          <p className="text-xs sm:text-sm text-[#8FA59B]">
            Upload a leaf, plant, fruit or seed image to diagnose symptoms and receive agricultural advice.
          </p>
        </div>

        {/* 3-Layer Visual Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-[#0E1E18] border border-[#1B382D] space-y-3 relative group hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-emerald-400 font-bold">LAYER 01</span>
              <Eye className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F3F7F5]">AI Vision</h3>
              <p className="text-xs text-emerald-400/90 font-medium">"What is this?"</p>
            </div>
            <p className="text-xs text-[#8FA59B] leading-relaxed">
              Identifies the crop species and image quality.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#0E1E18] border border-[#1B382D] space-y-3 relative group hover:border-teal-500/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-teal-400 font-bold">LAYER 02</span>
              <Bug className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F3F7F5]">ML Disease Model</h3>
              <p className="text-xs text-teal-400/90 font-medium">"What could be wrong?"</p>
            </div>
            <p className="text-xs text-[#8FA59B] leading-relaxed">
              Analyzes supported disease conditions and symptoms.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#0E1E18] border border-[#1B382D] space-y-3 relative group hover:border-cyan-500/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-cyan-400 font-bold">LAYER 03</span>
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F3F7F5]">Agricultural Intelligence</h3>
              <p className="text-xs text-cyan-400/90 font-medium">"What should I do?"</p>
            </div>
            <p className="text-xs text-[#8FA59B] leading-relaxed">
              Provides practical guidance and preventive treatment steps.
            </p>
          </div>
        </div>

        <div className="text-center pt-6">
          <Link
            to="/features"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0E1E18] hover:bg-[#1B382D]/40 text-[#F3F7F5] border border-[#1B382D] text-xs font-medium transition-all"
          >
            <span>Explore Crop Health</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FARM INTELLIGENCE PREVIEW (Dashboard Preview Section) */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-semibold">
            UNIFIED VIEW
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-heading text-[#F3F7F5] tracking-tight">
            One view of your farm.
          </h2>
          <p className="text-xs sm:text-sm text-[#8FA59B]">
            A unified dashboard bringing all your critical farm telemetry together in one place.
          </p>
        </div>

        {/* Dashboard Preview Shell */}
        <div className="rounded-2xl bg-[#0E1E18] border border-[#1B382D] p-5 sm:p-7 shadow-2xl shadow-black/50 space-y-6">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#1B382D]">
            <div className="flex items-center gap-3">
              <span className="text-lg">🌾</span>
              <div>
                <h3 className="text-sm font-bold text-[#F3F7F5]">Green Valley Farms — Plot A</h3>
                <p className="text-[11px] text-[#8FA59B]">4.5 Acres • Silt Loam Soil • Tomato (Vegetative)</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              Dashboard Preview
            </span>
          </div>

          {/* 4 Quick Stat Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-[#08120E] border border-[#1B382D]">
              <div className="text-[11px] text-[#8FA59B]">Farm Health</div>
              <div className="text-base font-bold font-mono text-emerald-400 mt-1">88</div>
              <div className="text-[10px] text-[#8FA59B] mt-0.5">Optimal condition</div>
            </div>
            <div className="p-3 rounded-lg bg-[#08120E] border border-[#1B382D]">
              <div className="text-[11px] text-[#8FA59B]">Weather</div>
              <div className="text-base font-bold font-mono text-[#F3F7F5] mt-1">Rain</div>
              <div className="text-[10px] text-amber-400 mt-0.5">Precipitation expected</div>
            </div>
            <div className="p-3 rounded-lg bg-[#08120E] border border-[#1B382D]">
              <div className="text-[11px] text-[#8FA59B]">Crop Health</div>
              <div className="text-base font-bold font-mono text-emerald-400 mt-1">Healthy</div>
              <div className="text-[10px] text-[#8FA59B] mt-0.5">Diagnostic clear</div>
            </div>
            <div className="p-3 rounded-lg bg-[#08120E] border border-[#1B382D]">
              <div className="text-[11px] text-[#8FA59B]">Soil Moisture</div>
              <div className="text-base font-bold font-mono text-teal-300 mt-1">41%</div>
              <div className="text-[10px] text-teal-400 mt-0.5">Root zone normal</div>
            </div>
          </div>

          {/* 2-Column Overview: Actions & AI Insight */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-6 p-4 rounded-xl bg-[#08120E] border border-[#1B382D] space-y-2.5">
              <div className="text-xs font-mono font-bold text-[#F3F7F5] flex items-center justify-between">
                <span>TODAY'S ACTIONS</span>
                <span className="text-[10px] text-emerald-400">2 Items Active</span>
              </div>
              <div className="space-y-2">
                <div className="p-2.5 rounded bg-[#0E1E18] border border-[#1B382D] flex items-center justify-between text-xs">
                  <span className="text-[#F3F7F5]">Postpone drip irrigation for 24h</span>
                  <span className="text-[10px] font-mono text-amber-400">Rain Alert</span>
                </div>
                <div className="p-2.5 rounded bg-[#0E1E18] border border-[#1B382D] flex items-center justify-between text-xs">
                  <span className="text-[#F3F7F5]">Inspect tomato foliage for blight</span>
                  <span className="text-[10px] font-mono text-teal-400">Humidity Alert</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 p-4 rounded-xl bg-[#08120E] border border-[#1B382D] space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono font-bold text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>AI INSIGHT</span>
                </div>
                <p className="text-xs text-[#8FA59B] mt-2 leading-relaxed">
                  "Weather and soil moisture sensors indicate adequate field hydration. High relative humidity elevates fungal vulnerability. Recommended action: inspect lower leaves before next fertilization cycle."
                </p>
              </div>
              <div className="text-[10px] text-emerald-400/80 font-mono">
                Generated from microclimate + soil telemetry
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-2 text-center">
            <Link
              to={user ? "/dashboard" : "/login"}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-[#08120E] font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/15 transition-all"
            >
              <span>{user ? "Open Dashboard" : "Enter AgroVision AI"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. WHY AGROVISION AI (4 Principles) */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-semibold">
            PHILOSOPHY
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-heading text-[#F3F7F5] tracking-tight">
            Built around the farmer.
          </h2>
          <p className="text-xs sm:text-sm text-[#8FA59B]">
            Four core principles guiding every recommendation and feature.
          </p>
        </div>

        {/* 4 Principle Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {principles.map((pr, idx) => {
            const Icon = pr.icon;
            return (
              <motion.div
                key={pr.title}
                initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.3, delay: idx * 0.06 }}
                className="p-5 rounded-xl bg-[#0E1E18] border border-[#1B382D] space-y-2.5 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${pr.color}`} />
                    <h3 className="text-sm font-bold text-[#F3F7F5]">{pr.title}</h3>
                  </div>
                  <p className="text-xs font-semibold text-emerald-400/90">
                    {pr.desc}
                  </p>
                  <p className="text-xs text-[#8FA59B] leading-relaxed">
                    {pr.detail}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. FEATURE PREVIEW (3 Categories Only) */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-mono font-semibold">
            ECOSYSTEM OVERVIEW
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-heading text-[#F3F7F5] tracking-tight">
            Explore the AgroVision ecosystem
          </h2>
          <p className="text-xs sm:text-sm text-[#8FA59B]">
            Three interconnected pillars providing end-to-end farm intelligence.
          </p>
        </div>

        {/* 3 Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {ecosystemCategories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <motion.div
                key={cat.title}
                initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.3, delay: idx * 0.08 }}
                className="p-6 rounded-xl bg-[#0E1E18] border border-[#1B382D] hover:border-emerald-500/30 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-[#08120E] border border-[#1B382D] flex items-center justify-center">
                      <Icon className={`w-4 h-4 ${cat.color}`} />
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#1B382D]/40 text-[#8FA59B]">
                      {cat.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#F3F7F5]">{cat.title}</h3>
                    <p className="text-xs text-[#8FA59B] mt-1">{cat.desc}</p>
                  </div>

                  {/* Feature Highlights */}
                  <div className="space-y-1.5 pt-1">
                    {cat.items.map((item) => (
                      <div key={item} className="flex items-center gap-2 text-xs text-[#F3F7F5]/90">
                        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center pt-8">
          <Link
            to="/features"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs sm:text-sm font-bold transition-all"
          >
            <span>View All Features</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. FINAL CALL TO ACTION */}
      {/* ========================================================================= */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-b from-[#0E1E18] to-[#08120E] border border-[#1B382D] p-8 sm:p-10 text-center space-y-5 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6 text-emerald-400" />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-[#F3F7F5] tracking-tight">
              Ready to make better decisions for your farm?
            </h2>
            <p className="text-xs sm:text-sm text-[#8FA59B] leading-relaxed">
              Set up your farm and let AgroVision AI turn your farm data into practical intelligence.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to={user ? "/dashboard" : "/register"}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-[#08120E] font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all active:scale-[0.98]"
            >
              <span>{user ? "Go to Dashboard" : "Get Started Free"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            {!user && (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0E1E18] hover:bg-[#1B382D]/40 text-[#F3F7F5] border border-[#1B382D] text-xs sm:text-sm font-medium transition-all active:scale-[0.98]"
              >
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
