import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { TRANSLATIONS } from '../locales/translations';

const AuthContext = createContext();

export const LANGUAGES = [
  { code: 'English', label: 'English' },
  { code: 'Kannada', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'Hindi', label: 'हिन्दी (Hindi)' },
];

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('agrovision_token') || null);
  const [user, setUser] = useState(() => {
    const savedToken = localStorage.getItem('agrovision_token');
    const savedUser = localStorage.getItem('agrovision_user');
    if (!savedToken || !savedUser) return null;
    try {
      return JSON.parse(savedUser);
    } catch {
      return null;
    }
  });
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('agrovision_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u.preferred_language) return u.preferred_language;
      } catch (e) {}
    }
    return 'English';
  });
  const [loading, setLoading] = useState(false);

  // Synchronize on global 401 logout events
  useEffect(() => {
    const handleLogoutEvent = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener('agrovision_auth_logout', handleLogoutEvent);
    return () => window.removeEventListener('agrovision_auth_logout', handleLogoutEvent);
  }, []);

  // Verify session on mount if token exists
  useEffect(() => {
    const verifySession = async () => {
      const savedToken = localStorage.getItem('agrovision_token');
      if (savedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data) {
            setUser(res.data);
            localStorage.setItem('agrovision_user', JSON.stringify(res.data));
            if (res.data.preferred_language) {
              setLanguage(res.data.preferred_language);
            }
          }
        } catch (err) {
          console.warn('Session verification failed, logging out.');
          localStorage.removeItem('agrovision_token');
          localStorage.removeItem('agrovision_user');
          setToken(null);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };
    verifySession();
  }, []);

  // Translation lookup function
  const t = useCallback((key, fallback) => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS['English'];
    return langDict?.[key] || TRANSLATIONS['English']?.[key] || fallback || key;
  }, [language]);

  const extractErrorMessage = (err, defaultMsg) => {
    if (err.response?.data?.detail) {
      const detail = err.response.data.detail;
      if (typeof detail === 'string') return detail;
      if (Array.isArray(detail)) {
        return detail.map((d) => d.msg || JSON.stringify(d)).join(', ');
      }
      return JSON.stringify(detail);
    }
    if (err.message === 'Network Error' || !err.response) {
      return 'Cannot connect to backend server. Please make sure the backend is running on http://localhost:8000.';
    }
    return err.message || defaultMsg;
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { access_token, user: userData } = res.data;
      localStorage.setItem('agrovision_token', access_token);
      localStorage.setItem('agrovision_user', JSON.stringify(userData));
      setToken(access_token);
      setUser(userData);
      const userLang = userData.preferred_language || 'English';
      setLanguage(userLang);
      return { success: true };
    } catch (err) {
      return { success: false, error: extractErrorMessage(err, 'Login failed') };
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', formData);
      // Do NOT automatically log in or save tokens to localStorage.
      // User must explicitly log in after account creation.
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, error: extractErrorMessage(err, 'Registration failed') };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('agrovision_token');
    localStorage.removeItem('agrovision_user');
    setToken(null);
    setUser(null);
  };

  const changeLanguage = async (lang) => {
    setLanguage(lang);
    if (user) {
      const updated = { ...user, preferred_language: lang };
      setUser(updated);
      localStorage.setItem('agrovision_user', JSON.stringify(updated));
      try {
        await api.put('/auth/language', { language: lang });
      } catch (e) {
        console.warn('Language preference saved locally');
      }
    }
  };

  const updateUserProfile = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('agrovision_user', JSON.stringify(updatedUser));
    if (updatedUser.preferred_language) {
      setLanguage(updatedUser.preferred_language);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, language, changeLanguage, updateUserProfile, t, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
