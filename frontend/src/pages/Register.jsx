import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth, LANGUAGES } from '../context/AuthContext';
import { User, Phone, Mail, Lock, Globe, Eye, EyeOff, ArrowRight, CheckCircle2, Sprout } from 'lucide-react';
import AgroVisionLogo from '../components/AgroVisionLogo';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [language, setLanguage] = useState('English');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const res = await register({
      full_name: fullName,
      phone,
      email,
      password,
      preferred_language: language,
    });

    if (res.success) {
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 400);
    } else {
      setError(
        res.error && res.error.toLowerCase().includes('already registered')
          ? 'This email address is already registered. Please sign in instead.'
          : res.error || 'Registration failed. Please check your details.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#08120E] flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-emerald-500 selection:text-black relative overflow-hidden">
      {/* Subtle Atmospheric Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-emerald-500/5 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_0.75px,transparent_0.75px)] [background-size:32px_32px] opacity-[0.06] pointer-events-none" />

      {/* Main Centered Registration Workspace Card */}
      <motion.div
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[480px] bg-[#0E1E18] border border-[#1B382D] rounded-3xl p-7 sm:p-9 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] space-y-6 my-6"
      >
        {/* Brand Header with Official Centered Logo */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-block focus:outline-none">
            <AgroVisionLogo
              variant="sidebar"
              className="mx-auto block"
              imgClassName="max-h-[88px] w-auto max-w-[160px] object-contain block mx-auto"
            />
          </Link>

          <div className="space-y-1.5 pt-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#10B981]/10 border border-[#10B981]/25 text-[#10B981] text-[10px] font-mono font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span>New Farmer Registration</span>
            </div>
            <h2 className="text-2xl font-bold font-heading text-[#F3F7F5] tracking-tight">
              Create Account
            </h2>
            <p className="text-xs text-[#8FA59B]">
              Register your farm to access intelligent telemetry and AI models.
            </p>
          </div>
        </div>

        {/* Inline Error Notice */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-semibold"
          >
            {error}
          </motion.div>
        )}

        {/* REGISTRATION FORM */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-bold text-[#8FA59B] block mb-1">Full Name</label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-[#8FA59B] absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                required
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ramesh Gowda"
                className="os-input w-full pl-10 pr-4 py-2.5 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#8FA59B] block mb-1">Phone Number</label>
              <div className="relative flex items-center">
                <Phone className="w-4 h-4 text-[#8FA59B] absolute left-3.5 pointer-events-none" />
                <input
                  type="tel"
                  required
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="os-input w-full pl-10 pr-4 py-2.5 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#8FA59B] block mb-1">Language</label>
              <div className="relative flex items-center">
                <Globe className="w-4 h-4 text-[#8FA59B] absolute left-3.5 pointer-events-none" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="os-input w-full pl-10 pr-4 py-2.5 text-xs cursor-pointer"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.label} className="bg-[#0E1E18]">
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#8FA59B] block mb-1">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-[#8FA59B] absolute left-3.5 pointer-events-none" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="farmer@agrovision.ai"
                className="os-input w-full pl-10 pr-4 py-2.5 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#8FA59B] block mb-1">Password</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-[#8FA59B] absolute left-3.5 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="os-input w-full pl-10 pr-10 py-2.5 text-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-[#8FA59B] hover:text-white cursor-pointer"
                aria-label="Toggle Password Visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Primary CTA */}
          <button
            type="submit"
            disabled={loading || isSuccess}
            className="os-btn-primary w-full py-3 text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-2"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                <span>Creating Farm Account...</span>
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-slate-900" />
                <span>Account Created! Launching...</span>
              </>
            ) : (
              <>
                <span>Create Farm Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Sign In Link */}
        <div className="text-center pt-1 border-t border-[#1B382D]">
          <p className="text-xs text-[#8FA59B]">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-400 font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>

      {/* Footer Branding */}
      <div className="relative z-10 text-center text-[11px] text-[#577366] select-none pb-4">
        AgroVision AI • Digital Farm Operating System
      </div>
    </div>
  );
}
