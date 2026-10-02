import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FarmProvider } from './context/FarmContext';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import VoiceWidget from './components/VoiceWidget';
import BottomNav from './components/BottomNav';
import PublicLayout from './components/PublicLayout';
import ScrollToTop from './components/ScrollToTop';
import PageTransition from './components/PageTransition';

import Landing from './pages/Landing';
import AboutPage from './pages/AboutPage';
import FeaturesPage from './pages/FeaturesPage';
import AIFarmingPage from './pages/AIFarmingPage';
import ContactPage from './pages/ContactPage';
import Login from './pages/Login';
import Register from './pages/Register';
import FarmSetup from './pages/FarmSetup';
import MapViewPage from './pages/MapViewPage';
import Dashboard from './pages/Dashboard';
import WeatherPage from './pages/WeatherPage';
import IrrigationPage from './pages/IrrigationPage';
import FertilizerPage from './pages/FertilizerPage';
import SensorsPage from './pages/SensorsPage';
import CropHealthPage from './pages/CropHealthPage';
import CropRecommendation from './pages/CropRecommendation';
import CropCalendarPage from './pages/CropCalendarPage';
import FarmCalculatorPage from './pages/FarmCalculatorPage';
import FarmLedgerPage from './pages/FarmLedgerPage';
import SatellitePage from './pages/SatellitePage';
import GovernmentServicesPage from './pages/GovernmentServicesPage';
import GovernmentSchemesPage from './pages/GovernmentSchemesPage';
import YieldPrediction from './pages/YieldPrediction';
import AssistantPage from './pages/AssistantPage';
import MessagesPage from './pages/MessagesPage';
import MarketPrices from './pages/MarketPrices';
import AnalyticsPage from './pages/AnalyticsPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import OfficerDashboard from './pages/OfficerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import MarketplacePage from './pages/MarketplacePage';

const PUBLIC_PAGES = ['/', '/about', '/features', '/ai-farming', '/contact'];
const AUTH_PAGES = ['/login', '/register', '/forgot-password'];

// Layout wrapper managing public routes, auth gates, and protected dashboard workspace
function AppLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const isPublicPage = PUBLIC_PAGES.includes(location.pathname);
  const isAuthPage = AUTH_PAGES.includes(location.pathname);

  // 1. Unauthenticated Route Protection Gate
  if (!user) {
    if (isPublicPage) {
      return (
        <PublicLayout>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
              <Route path="/about" element={<PageTransition><AboutPage /></PageTransition>} />
              <Route path="/features" element={<PageTransition><FeaturesPage /></PageTransition>} />
              <Route path="/ai-farming" element={<PageTransition><AIFarmingPage /></PageTransition>} />
              <Route path="/contact" element={<PageTransition><ContactPage /></PageTransition>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </PublicLayout>
      );
    }

    if (isAuthPage) {
      return (
        <div className="min-h-screen bg-[#08120E]">
          <ScrollToTop />
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
              <Route path="/forgot-password" element={<PageTransition><Login /></PageTransition>} />
              <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </AnimatePresence>
        </div>
      );
    }

    return <Navigate to="/login" replace />;
  }

  // 2. Authenticated user visiting login/register -> redirect to dashboard
  if (isAuthPage) {
    return <Navigate to="/dashboard" replace />;
  }

  // 3. Authenticated user viewing public pages
  if (isPublicPage) {
    return (
      <PublicLayout>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
            <Route path="/about" element={<PageTransition><AboutPage /></PageTransition>} />
            <Route path="/features" element={<PageTransition><FeaturesPage /></PageTransition>} />
            <Route path="/ai-farming" element={<PageTransition><AIFarmingPage /></PageTransition>} />
            <Route path="/contact" element={<PageTransition><ContactPage /></PageTransition>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AnimatePresence>
      </PublicLayout>
    );
  }

  // 4. Authenticated Dashboard Workspace Routes (All Working AgroVision AI Tools)
  return (
    <div className="min-h-screen bg-[#04131B] flex text-slate-100 selection:bg-emerald-500">
      <ScrollToTop />
      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <Navbar toggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

        <main className="flex-1 pb-20 lg:pb-12">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
              <Route path="/farm-setup" element={<PageTransition><FarmSetup /></PageTransition>} />
              <Route path="/sensors" element={<PageTransition><SensorsPage /></PageTransition>} />
              <Route path="/iot" element={<PageTransition><SensorsPage /></PageTransition>} />
              <Route path="/map" element={<PageTransition><MapViewPage /></PageTransition>} />
              <Route path="/crop-health" element={<PageTransition><CropHealthPage /></PageTransition>} />
              <Route path="/disease-detection" element={<PageTransition><CropHealthPage /></PageTransition>} />
              <Route path="/satellite" element={<PageTransition><SatellitePage /></PageTransition>} />
              <Route path="/field-health" element={<PageTransition><SatellitePage /></PageTransition>} />
              <Route path="/crop-recommendation" element={<PageTransition><CropRecommendation /></PageTransition>} />
              <Route path="/weather" element={<PageTransition><WeatherPage /></PageTransition>} />
              <Route path="/irrigation" element={<PageTransition><IrrigationPage /></PageTransition>} />
              <Route path="/smart-irrigation" element={<PageTransition><IrrigationPage /></PageTransition>} />
              <Route path="/fertilizer" element={<PageTransition><FertilizerPage /></PageTransition>} />
              <Route path="/yield-prediction" element={<PageTransition><YieldPrediction /></PageTransition>} />
              <Route path="/ai-farm-agent" element={<PageTransition><AssistantPage /></PageTransition>} />
              <Route path="/assistant" element={<PageTransition><AssistantPage /></PageTransition>} />
              <Route path="/copilot" element={<PageTransition><AssistantPage /></PageTransition>} />
              <Route path="/market-prices" element={<PageTransition><MarketPrices /></PageTransition>} />
              <Route path="/calculator" element={<PageTransition><FarmCalculatorPage /></PageTransition>} />
              <Route path="/ledger" element={<PageTransition><FarmLedgerPage /></PageTransition>} />
              <Route path="/profit" element={<PageTransition><FarmLedgerPage /></PageTransition>} />
              <Route path="/crop-calendar" element={<PageTransition><CropCalendarPage /></PageTransition>} />
              <Route path="/government-schemes" element={<PageTransition><GovernmentSchemesPage /></PageTransition>} />
              <Route path="/government-services" element={<PageTransition><GovernmentSchemesPage /></PageTransition>} />
              <Route path="/analytics" element={<PageTransition><AnalyticsPage /></PageTransition>} />
              <Route path="/notifications" element={<PageTransition><NotificationsPage /></PageTransition>} />
              <Route path="/profile" element={<PageTransition><ProfilePage /></PageTransition>} />
              <Route path="/messages" element={<PageTransition><MessagesPage /></PageTransition>} />
              <Route path="/marketplace" element={<PageTransition><MarketplacePage /></PageTransition>} />
              <Route path="/admin" element={<PageTransition><AdminDashboard /></PageTransition>} />
              <Route path="/officer" element={<PageTransition><OfficerDashboard /></PageTransition>} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Floating Voice Assistant Widget */}
      <VoiceWidget />
    </div>
  );
}

// Error Boundary to prevent white screen on unexpected runtime error
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AgroVision Runtime Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#04131B] text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full glass-panel p-8 rounded-3xl border border-emerald-500/30 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold font-heading">Something went wrong</h2>
            <p className="text-xs text-slate-300">
              An unexpected error occurred. Please return to the dashboard or refresh.
            </p>
            {this.state.error && (
              <div className="p-3 rounded-xl bg-black/50 border border-rose-500/30 text-[11px] text-rose-300 font-mono text-left max-h-32 overflow-y-auto">
                {this.state.error.toString()}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { window.location.href = '/dashboard'; }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-glow-emerald cursor-pointer"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-bold text-xs cursor-pointer"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <FarmProvider>
          <Router>
            <AppLayout />
          </Router>
        </FarmProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
