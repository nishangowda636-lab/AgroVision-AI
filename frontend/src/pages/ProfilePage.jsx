import React, { useState, useEffect } from 'react';
import { useAuth, LANGUAGES } from '../context/AuthContext';
import { useFarm } from '../context/FarmContext';
import {
  User,
  Globe,
  Shield,
  Sprout,
  Check,
  MapPin,
  Bell,
  Layers,
  KeyRound,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import api from '../services/api';

export default function ProfilePage() {
  const { user, language, changeLanguage, updateUserProfile, t } = useAuth();
  const { farms } = useFarm();

  const [activeTab, setActiveTab] = useState('personal');
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [location, setLocation] = useState(user?.location || 'Mandya, Karnataka');

  // Preferences
  const [tempUnit, setTempUnit] = useState(user?.temperature_unit || 'C');
  const [areaUnit, setAreaUnit] = useState(user?.area_unit || 'Acres');
  const [currency, setCurrency] = useState(user?.currency || 'INR');
  const [notifyWeather, setNotifyWeather] = useState(user?.notify_weather ?? true);
  const [notifyDisease, setNotifyDisease] = useState(user?.notify_disease ?? true);
  const [notifyMarket, setNotifyMarket] = useState(user?.notify_market ?? true);
  const [notifyIrrigation, setNotifyIrrigation] = useState(user?.notify_irrigation ?? true);

  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [feedback, setFeedback] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
      setLocation(user.location || 'Mandya, Karnataka');
      setTempUnit(user.temperature_unit || 'C');
      setAreaUnit(user.area_unit || 'Acres');
      setCurrency(user.currency || 'INR');
      setNotifyWeather(user.notify_weather ?? true);
      setNotifyDisease(user.notify_disease ?? true);
      setNotifyMarket(user.notify_market ?? true);
      setNotifyIrrigation(user.notify_irrigation ?? true);
    }
  }, [user]);

  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await api.put('/auth/profile', {
        full_name: fullName,
        phone,
        location,
        temperature_unit: tempUnit,
        area_unit: areaUnit,
        currency,
        notify_weather: notifyWeather,
        notify_disease: notifyDisease,
        notify_market: notifyMarket,
        notify_irrigation: notifyIrrigation
      });
      updateUserProfile(res.data);
      setFeedback({ type: 'success', text: t('prof.saved_success', 'Profile and preferences updated successfully!') });
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.detail || 'Failed to save changes.' });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setFeedback({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }
    setSaving(true);
    try {
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      setFeedback({ type: 'success', text: 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.detail || 'Failed to change password.' });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto selection:bg-[#10B981] selection:text-black">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1 border-b border-[#1B382D]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/20 uppercase tracking-wider">
              Account Management
            </span>
            <span className="text-[10px] font-medium text-[#8FA59B]">
              Farmer Credentials & Regional Preferences
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F3F7F5] flex items-center gap-2.5">
            <User className="w-6 h-6 text-[#10B981]" />
            <span>{t('prof.title', 'Farmer Profile & Account Settings')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8FA59B] mt-0.5">
            {t('prof.subtitle', 'Manage personal credentials, registered farms, language, preferences, and notifications.')}
          </p>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all ${
            feedback.type === 'error'
              ? 'bg-[#EF4444]/10 border-[#EF4444]/40 text-[#EF4444]'
              : 'bg-[#10B981]/10 border-[#10B981]/40 text-[#10B981]'
          }`}
        >
          {feedback.type === 'error' ? <AlertCircle className="w-4 h-4 text-[#EF4444]" /> : <CheckCircle2 className="w-4 h-4 text-[#10B981]" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Profile Overview Card & Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Column: Avatar & Navigation Tabs */}
        <div className="space-y-3 lg:col-span-1">
          {/* Avatar Card */}
          <div className="os-card p-5 text-center space-y-2.5">
            <div className="w-16 h-16 rounded-2xl bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] font-extrabold text-2xl flex items-center justify-center mx-auto">
              {user?.full_name?.charAt(0) || 'F'}
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#F3F7F5]">{user?.full_name}</h3>
              <p className="text-xs text-[#8FA59B] truncate">{user?.email}</p>
              <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/25 uppercase">
                Farmer
              </span>
            </div>
          </div>

          {/* Tab Navigation Menu */}
          <div className="os-card p-1.5 space-y-1 text-xs">
            {[
              { id: 'personal', label: t('prof.personal_tab', 'Personal Info'), icon: User },
              { id: 'farms', label: t('prof.farms_tab', 'My Farms'), icon: Sprout },
              { id: 'language', label: t('prof.language_tab', 'Language (11)'), icon: Globe },
              { id: 'preferences', label: t('prof.pref_tab', 'Units & Alerts'), icon: Layers },
              { id: 'security', label: t('prof.security_tab', 'Security'), icon: Shield },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full px-3 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all cursor-pointer text-left ${
                    active
                      ? 'bg-[#10B981] text-[#08120E] font-bold shadow-sm'
                      : 'text-[#8FA59B] hover:bg-[#11261F] hover:text-[#F3F7F5]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Tab Content Panels */}
        <div className="lg:col-span-3">
          {/* Tab 1: Personal Info */}
          {activeTab === 'personal' && (
            <div className="os-card p-5 sm:p-6 space-y-5">
              <div className="border-b border-[#1B382D] pb-3">
                <h3 className="text-sm font-bold text-[#F3F7F5] uppercase tracking-wide">Personal Information</h3>
                <p className="text-xs text-[#8FA59B] mt-0.5">Update contact details and primary farming district.</p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[#8FA59B] font-medium block">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="os-input font-semibold"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[#8FA59B] font-medium block">Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="os-input font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[#8FA59B] font-medium block">Email Address (Read-only)</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="os-input opacity-50 cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[#8FA59B] font-medium block">Primary Farming District</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Mandya, Karnataka"
                      className="os-input font-semibold"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="os-btn-primary px-5 py-2 text-xs cursor-pointer"
                  >
                    {saving ? 'Saving...' : t('prof.save_btn', 'Save Changes')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab 2: My Farms Summary */}
          {activeTab === 'farms' && (
            <div className="os-card p-5 sm:p-6 space-y-4">
              <div className="border-b border-[#1B382D] pb-3">
                <h3 className="text-sm font-bold text-[#F3F7F5] uppercase tracking-wide">Registered Plots ({farms.length})</h3>
                <p className="text-xs text-[#8FA59B] mt-0.5">Agricultural plots associated with this account.</p>
              </div>

              <div className="space-y-2.5">
                {farms.map((f) => (
                  <div
                    key={f.id}
                    className="p-3.5 rounded-xl bg-[#08120E] border border-[#1B382D] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-xs text-[#F3F7F5] flex items-center gap-1.5">
                        <Sprout className="w-4 h-4 text-[#10B981]" />
                        <span>{f.name}</span>
                      </h4>
                      <p className="text-[#8FA59B]">
                        {f.crop} • {f.size_acres} Acres • {f.soil_type} Soil (pH {f.soil_ph})
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] font-semibold text-[10px]">
                        {f.irrigation_method || 'Drip Irrigation'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Language Settings */}
          {activeTab === 'language' && (
            <div className="os-card p-5 sm:p-6 space-y-4">
              <div className="border-b border-[#1B382D] pb-3">
                <h3 className="text-sm font-bold text-[#F3F7F5] uppercase tracking-wide">Select Dashboard Language</h3>
                <p className="text-xs text-[#8FA59B] mt-0.5">
                  Real-time translation for dashboard, voice assistant, and advisories.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {LANGUAGES.map((lang) => {
                  const isSelected = language === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#10B981]/15 border-[#10B981] text-[#F3F7F5] font-bold'
                          : 'bg-[#08120E] border-[#1B382D] text-[#8FA59B] hover:border-[#10B981]/40 hover:text-[#F3F7F5]'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold block">{lang.label}</span>
                        <span className="text-[10px] text-[#8FA59B]">{lang.code}</span>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#10B981] text-[#08120E] flex items-center justify-center font-bold text-xs">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 4: Preferences & Units */}
          {activeTab === 'preferences' && (
            <div className="os-card p-5 sm:p-6 space-y-4">
              <div className="border-b border-[#1B382D] pb-3">
                <h3 className="text-sm font-bold text-[#F3F7F5] uppercase tracking-wide">Units & Notification Alerts</h3>
                <p className="text-xs text-[#8FA59B] mt-0.5">Measurement units and automated agronomic push alerts.</p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                {/* Units */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[#8FA59B] font-medium block">Temperature Unit</label>
                    <select
                      value={tempUnit}
                      onChange={(e) => setTempUnit(e.target.value)}
                      className="os-input font-semibold"
                    >
                      <option value="C">Celsius (°C)</option>
                      <option value="F">Fahrenheit (°F)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[#8FA59B] font-medium block">Area Unit</label>
                    <select
                      value={areaUnit}
                      onChange={(e) => setAreaUnit(e.target.value)}
                      className="os-input font-semibold"
                    >
                      <option value="Acres">Acres</option>
                      <option value="Hectares">Hectares</option>
                      <option value="Guntas">Guntas</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[#8FA59B] font-medium block">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="os-input font-semibold"
                    >
                      <option value="INR">₹ INR (Indian Rupee)</option>
                      <option value="USD">$ USD</option>
                    </select>
                  </div>
                </div>

                {/* Notifications Toggles */}
                <div className="space-y-2.5 pt-1">
                  <span className="text-[11px] font-bold text-[#8FA59B] uppercase tracking-wider block">
                    Automated Notifications
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { label: 'Weather & Rain Alerts', val: notifyWeather, set: setNotifyWeather, desc: 'Rain locks and storm forecast warnings' },
                      { label: 'Crop Disease Alerts', val: notifyDisease, set: setNotifyDisease, desc: 'Scouting reminders based on microclimate' },
                      { label: 'Mandi Price Spikes', val: notifyMarket, set: setNotifyMarket, desc: 'Notifies when crop market rates surge >10%' },
                      { label: 'Smart Irrigation Triggers', val: notifyIrrigation, set: setNotifyIrrigation, desc: 'Borewell pump auto-start and cutoff logs' },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-[#08120E] border border-[#1B382D] flex items-center justify-between gap-2.5"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-[#F3F7F5] block text-xs">{item.label}</span>
                          <span className="text-[10px] text-[#8FA59B]">{item.desc}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={item.val}
                          onChange={(e) => item.set(e.target.checked)}
                          className="w-4 h-4 accent-[#10B981] cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="os-btn-primary px-5 py-2 text-xs cursor-pointer"
                  >
                    {saving ? 'Saving...' : t('prof.save_btn', 'Save Preferences')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab 5: Security */}
          {activeTab === 'security' && (
            <div className="os-card p-5 sm:p-6 space-y-4">
              <div className="border-b border-[#1B382D] pb-3">
                <h3 className="text-sm font-bold text-[#F3F7F5] uppercase tracking-wide">Security & Password</h3>
                <p className="text-xs text-[#8FA59B] mt-0.5">Change your login password and manage session security.</p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-3 text-xs max-w-md">
                <div className="space-y-1">
                  <label className="text-[#8FA59B] font-medium block">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="os-input font-semibold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#8FA59B] font-medium block">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="os-input font-semibold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#8FA59B] font-medium block">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="os-input font-semibold"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="os-btn-primary px-5 py-2 text-xs cursor-pointer"
                  >
                    {saving ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
