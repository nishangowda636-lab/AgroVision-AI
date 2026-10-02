import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  MessageSquare,
  LifeBuoy,
  Lightbulb,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ContactPage() {
  const shouldReduceMotion = useReducedMotion();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'general',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState(0); // first item open by default

  const contactCategories = [
    {
      id: 'general',
      title: 'General Inquiries',
      desc: 'Questions about platform capabilities, crop support, or onboarding.',
      icon: MessageSquare,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10'
    },
    {
      id: 'support',
      title: 'Product Support',
      desc: 'Assistance with farm setup, field boundaries, or sensor telemetry.',
      icon: LifeBuoy,
      color: 'text-teal-400',
      bg: 'bg-teal-500/10'
    },
    {
      id: 'feedback',
      title: 'Feedback & Ideas',
      desc: 'Suggest new agronomic tools or regional features for future updates.',
      icon: Lightbulb,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10'
    }
  ];

  const faqs = [
    {
      q: 'How does AgroVision AI work?',
      a: 'AgroVision AI integrates your farm location, soil profile, weather forecasts, and field observations. Its machine learning models and agronomic rules translate these signals into clear daily guidance — including irrigation runtimes, disease diagnoses, and fertilizer schedules.'
    },
    {
      q: 'What information do I need to set up a farm?',
      a: 'To set up your digital field, you simply provide your farm coordinates or location, approximate land acreage, primary crop type, and soil texture. You can add or refine plot boundaries at any time.'
    },
    {
      q: 'Can I connect IoT sensors?',
      a: 'Yes. AgroVision AI supports wireless soil moisture and environmental telemetry probes. If hardware is not connected, the platform operates in intelligent microclimate simulation mode using localized weather and soil databases.'
    },
    {
      q: 'Does AgroVision support crop image analysis?',
      a: 'Yes. You can photograph crop foliage and upload images to the Crop Health Scanner. The deep-learning vision engine analyzes symptoms for early disease markers, blights, and nutrient stress.'
    },
    {
      q: 'How does the AI Farm Agent work?',
      a: 'The AI Farm Agent acts as your digital co-pilot. It synthesizes weather forecasts, crop stage timelines, and soil moisture levels to generate a single, prioritized daily action checklist for your farm.'
    }
  ];

  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Please enter your name.';
    if (!formData.email.trim()) {
      errs.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!formData.message.trim()) {
      errs.message = 'Please enter your message.';
    } else if (formData.message.trim().length < 10) {
      errs.message = 'Message must be at least 10 characters.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    // Simulate clean submission handling without exposing internal technical details
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({ name: '', email: '', subject: 'general', message: '' });
      setErrors({});
    }, 600);
  };

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
          <span>CONTACT AGROVISION AI</span>
        </motion.div>

        <motion.h1
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-[#F3F7F5] tracking-tight leading-[1.15] max-w-3xl mx-auto"
        >
          Have a question about{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-300">
            AgroVision AI?
          </span>
        </motion.h1>

        <motion.p
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="text-xs sm:text-sm md:text-base text-[#8FA59B] max-w-2xl mx-auto leading-relaxed"
        >
          Reach out to our agricultural support and technical team. We're here to help you get the most out of your digital farm.
        </motion.p>
      </section>

      {/* ========================================================================= */}
      {/* 2. TWO-COLUMN LAYOUT: CHANNELS & CONTACT FORM */}
      {/* ========================================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Support Categories & Direct Channels (5 cols) */}
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.35 }}
            className="lg:col-span-5 space-y-6"
          >
            {/* Category Cards */}
            <div className="space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#577366] font-semibold block">
                HOW WE CAN HELP
              </span>

              {contactCategories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <div
                    key={cat.id}
                    className="bg-[#0E1E18] border border-[#1B382D] hover:border-[#265040] rounded-xl p-4 flex items-start gap-3.5 transition-colors"
                  >
                    <div className={`w-9 h-9 rounded-lg ${cat.bg} border border-[#1B382D] flex items-center justify-center ${cat.color} shrink-0 mt-0.5`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="text-xs sm:text-sm font-bold text-[#F3F7F5] font-heading">
                        {cat.title}
                      </h3>
                      <p className="text-xs text-[#8FA59B] leading-relaxed">
                        {cat.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Direct Channels Box */}
            <div className="bg-[#0E1E18] border border-[#1B382D] rounded-xl p-5 space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#10B981] font-semibold block">
                DIRECT CONTACT CHANNELS
              </span>

              <div className="space-y-2.5 text-xs text-[#8FA59B]">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-[#F3F7F5] block">Email Support</span>
                    <span className="text-[11px]">support@agrovision.ai</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-teal-400 shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-[#F3F7F5] block">Kisan Call Center</span>
                    <span className="text-[11px]">Toll-free: 1551</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-[#F3F7F5] block">Operating Hours</span>
                    <span className="text-[11px]">Mon – Sat, 06:00 AM – 08:00 PM IST</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* RIGHT COLUMN: Contact Form (7 cols) */}
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.35, delay: 0.08 }}
            className="lg:col-span-7 bg-[#0E1E18] border border-[#1B382D] rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl"
          >
            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-bold font-heading text-[#F3F7F5]">
                Send a Message
              </h2>
              <p className="text-xs text-[#8FA59B]">
                Fill out the form below and an agricultural specialist will respond promptly.
              </p>
            </div>

            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-6 text-center space-y-3"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#F3F7F5]">
                  Your message has been sent successfully.
                </h3>
                <p className="text-xs text-[#8FA59B] max-w-sm mx-auto leading-relaxed">
                  Thank you for reaching out. Our team will review your inquiry and get back to you shortly.
                </p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="os-btn-secondary px-4 py-2 text-xs cursor-pointer inline-block mt-2"
                >
                  Send Another Inquiry
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="text-xs font-bold text-[#8FA59B] block mb-1.5">
                    Your Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: null });
                    }}
                    placeholder="Enter your full name"
                    className={`os-input w-full px-3.5 py-2.5 text-xs ${
                      errors.name ? 'border-rose-500/60 focus:border-rose-400' : ''
                    }`}
                  />
                  {errors.name && (
                    <span className="text-[11px] text-rose-400 block mt-1">
                      {errors.name}
                    </span>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs font-bold text-[#8FA59B] block mb-1.5">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: null });
                    }}
                    placeholder="farmer@example.com"
                    className={`os-input w-full px-3.5 py-2.5 text-xs ${
                      errors.email ? 'border-rose-500/60 focus:border-rose-400' : ''
                    }`}
                  />
                  {errors.email && (
                    <span className="text-[11px] text-rose-400 block mt-1">
                      {errors.email}
                    </span>
                  )}
                </div>

                {/* Subject Topic */}
                <div>
                  <label className="text-xs font-bold text-[#8FA59B] block mb-1.5">
                    Inquiry Topic
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="os-input w-full px-3.5 py-2.5 text-xs bg-[#0A1612] cursor-pointer"
                  >
                    <option value="general" className="bg-[#08120E] text-[#F3F7F5]">
                      General Question / Onboarding
                    </option>
                    <option value="support" className="bg-[#08120E] text-[#F3F7F5]">
                      Technical & Sensor Support
                    </option>
                    <option value="agronomy" className="bg-[#08120E] text-[#F3F7F5]">
                      Crop Diagnostic Question
                    </option>
                    <option value="feedback" className="bg-[#08120E] text-[#F3F7F5]">
                      Feature Suggestion & Feedback
                    </option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="text-xs font-bold text-[#8FA59B] block mb-1.5">
                    Message <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) => {
                      setFormData({ ...formData, message: e.target.value });
                      if (errors.message) setErrors({ ...errors, message: null });
                    }}
                    placeholder="Describe your inquiry, crop question, or farm details..."
                    className={`os-input w-full px-3.5 py-2.5 text-xs resize-none ${
                      errors.message ? 'border-rose-500/60 focus:border-rose-400' : ''
                    }`}
                  />
                  {errors.message && (
                    <span className="text-[11px] text-rose-400 block mt-1">
                      {errors.message}
                    </span>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="os-btn-primary w-full py-2.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Sending message...</span>
                  ) : (
                    <>
                      <span>Send Message</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. FREQUENTLY ASKED QUESTIONS (Accordion) */}
      {/* ========================================================================= */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-1.5">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#10B981]">
            QUESTIONS & ANSWERS
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-heading text-[#F3F7F5]">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-[#8FA59B] max-w-md mx-auto">
            Everything you need to know about the AgroVision AI platform.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <motion.div
                key={idx}
                initial={shouldReduceMotion ? {} : { opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.25, delay: idx * 0.04 }}
                className={`bg-[#0E1E18] border rounded-xl overflow-hidden transition-colors ${
                  isOpen ? 'border-[#10B981]/50 bg-[#11261F]' : 'border-[#1B382D] hover:border-[#265040]'
                }`}
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left font-bold text-xs sm:text-sm text-[#F3F7F5] flex items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#8FA59B] shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-emerald-400' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="px-4 pb-4 pt-1 text-xs text-[#8FA59B] leading-relaxed border-t border-[#1B382D]/60"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
