import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const FarmContext = createContext();

export const FarmProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [farms, setFarms] = useState([]);
  const [activeFarm, setActiveFarm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSimulation, setIsSimulation] = useState(true);

  const fetchFarms = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.get('/farms');
      setFarms(res.data);
      if (res.data.length > 0) {
        // Keep active farm if selected, else default to first
        setActiveFarm((prev) => {
          if (!prev) return res.data[0];
          const found = res.data.find((f) => f.id === prev.id);
          return found || res.data[0];
        });
      } else {
        setActiveFarm(null);
      }
    } catch (err) {
      console.error('Error fetching farms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchFarms();
    } else {
      setFarms([]);
      setActiveFarm(null);
    }
  }, [token]);

  const deleteFarm = async (farmId) => {
    try {
      await api.delete(`/farms/${farmId}`);
      const remaining = farms.filter((f) => f.id !== farmId);
      setFarms(remaining);
      if (activeFarm && activeFarm.id === farmId) {
        if (remaining.length > 0) {
          setActiveFarm(remaining[0]);
        } else {
          setActiveFarm(null);
        }
      }
      return { success: true };
    } catch (err) {
      console.error('Error deleting farm:', err);
      return { success: false, error: err.response?.data?.detail || err.message };
    }
  };

  return (
    <FarmContext.Provider
      value={{
        farms,
        activeFarm,
        setActiveFarm,
        fetchFarms,
        deleteFarm,
        loading,
        isSimulation,
        setIsSimulation,
      }}
    >
      {children}
    </FarmContext.Provider>
  );
};

export const useFarm = () => useContext(FarmContext);
