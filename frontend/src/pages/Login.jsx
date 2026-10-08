import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, ShieldCheck, KeyRound, ArrowLeft } from 'lucide-react';
import AgroVisionLogo from '../components/AgroVisionLogo';

export default function Login() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.registeredEmail || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(location.pathname.includes('forgot-password'));
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    
    const res = await login(email, password);
    if (res.success) {
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 400);
    } else {
      setError(
        res.error && res.error.toLowerCase().includes('network')
          ? 'Unable to connect to AgroVision AI. Please try again.'
          : 'Email or password is incorrect.'
      );
    }
  };

  const handleDemoLogin = async () => {
    setEmail('nishan@agrovision.ai');
    setPassword('password123');
    setError('');
    
    const res = await login('nishan@agrovision.ai', 'password123');
    if (res.success) {
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 400);
    } else {
      setError('Demo login failed. Please check network connection.');
    }
  };

  const handleForgotPasswordSubmit = (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setResetSent(true);
  };

  return (
    <div className="min-h-screen bg-[#08120E] flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-emerald-500 selection:text-black relative overflow-hidden">
      {/* Subtle Atmospheric Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-emerald-500/5 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_0.75px,transparent_0.75px)] [background-size:32px_32px] opacity-[0.06] pointer-events-none" />

      {/* Main Centered Authentication Workspace Card */}
      <motion.div
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[450px] bg-[#0E1E18] border border-[#1B382D] rounded-3xl p-7 sm:p-9 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] space-y-6"
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

          {!forgotPasswordMode ? (
            <div className="space-y-1.5 pt-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#10B981]/10 border border-[#10B981]/25 text-[#10B981] text-[10px] font-mono font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                <span>Secure Farmer Access</span>
              </div>
              <h2 className="text-2xl font-bold font-heading text-[#F3F7F5] tracking-tight">
                Welcome Back
              </h2>
              <p className="text-xs text-[#8FA59B]">
                Sign in to access your farm intelligence.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 pt-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[10px] font-mono font-semibold">
                <KeyRound className="w-3 h-3 text-amber-400" />
                <span>Password Recovery</span>
              </div>
              <h2 className="text-2xl font-bold font-heading text-[#F3F7F5] tracking-tight">
                Reset Password
              </h2>
              <p className="text-xs text-[#8FA59B]">
                Enter your registered farm email to receive a reset link.
              </p>
            </div>
          )}
        </div>

        {/* Registration / Action Success Notice */}
        {location.state?.successMessage && !error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2.5"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{location.state.successMessage}</span>
          </motion.div>
        )}

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

        <AnimatePresence mode="wait">
          {!forgotPasswordMode ? (
            /* STANDARD SIGN-IN FORM */
            <motion.form
              key="signin-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-[#8FA59B] block mb-1.5">Email Address</label>
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#8FA59B]">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setForgotPasswordMode(true);
                      setResetEmail(email);
                    }}
                    className="text-[11px] text-emerald-400 hover:underline font-semibold cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-[#8FA59B] absolute left-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
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
                className="os-btn-primary w-full py-3 text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-1"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-slate-900" />
                    <span>Access Granted! Redirecting...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Farm Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-[#1B382D]"></div>
                <span className="flex-shrink mx-3 text-[11px] text-[#577366] font-mono uppercase">or</span>
                <div className="flex-grow border-t border-[#1B382D]"></div>
              </div>

              {/* Secondary Demo Login */}
              <button
                type="button"
                disabled={loading || isSuccess}
                onClick={handleDemoLogin}
                className="os-btn-secondary w-full py-2.5 text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Try Demo Farmer Account</span>
              </button>

              {/* Register Link */}
              <div className="text-center pt-2">
                <p className="text-xs text-[#8FA59B]">
                  New to AgroVision AI?{' '}
                  <Link to="/register" className="text-emerald-400 font-bold hover:underline">
                    Create Free Account
                  </Link>
                </p>
              </div>
            </motion.form>
          ) : (
            /* FORGOT PASSWORD FORM */
            <motion.form
              key="forgot-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleForgotPasswordSubmit}
              className="space-y-4"
            >
              {resetSent ? (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h4 className="font-bold text-sm text-[#F3F7F5]">Recovery Link Dispatched</h4>
                  <p className="text-xs text-[#8FA59B] leading-relaxed">
                    Instructions have been sent to <strong className="text-white">{resetEmail}</strong>. If you need immediate assistance, contact your local KVK extension officer.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-[#8FA59B] block mb-1.5">Registered Email</label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-[#8FA59B] absolute left-3.5 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="farmer@agrovision.ai"
                      className="os-input w-full pl-10 pr-4 py-2.5 text-xs"
                    />
                  </div>
                </div>
              )}

              {!resetSent ? (
                <button
                  type="submit"
                  className="os-btn-primary w-full py-3 text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Send Reset Link</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  setForgotPasswordMode(false);
                  setResetSent(false);
                }}
                className="os-btn-secondary w-full py-2.5 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Footer Branding */}
      <div className="relative z-10 text-center pt-6 text-[11px] text-[#577366] select-none">
        AgroVision AI • Digital Farm Operating System
      </div>
    </div>
  );
}
