import React, { useState, useEffect } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  Cpu,
  Droplets,
  Thermometer,
  Zap,
  Activity,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Radio,
  Wifi,
  Sun,
  Layers,
  Sparkles
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../services/api';

export default function SensorsPage() {
  const { activeFarm, isSimulation, setIsSimulation } = useFarm();
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSensorData = () => {
    if (activeFarm) {
      setLoading(true);
      api.get(`/sensors/${activeFarm.id}`)
        .then((res) => setSensors(res.data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchSensorData();
    const interval = setInterval(fetchSensorData, 8000); // Live telemetry polling
    return () => clearInterval(interval);
  }, [activeFarm]);

  // Telemetry historical chart data
  const telemetryHistory = [
    { time: '06:00', moisture: 48, temp: 22, humidity: 75 },
    { time: '08:00', moisture: 46, temp: 24, humidity: 71 },
    { time: '10:00', moisture: 44, temp: 26, humidity: 68 },
    { time: '12:00', moisture: 42, temp: 29, humidity: 62 },
    { time: '14:00', moisture: 41, temp: 30, humidity: 59 },
    { time: '16:00', moisture: 43, temp: 28, humidity: 65 },
    { time: '18:00', moisture: 45, temp: 25, humidity: 70 },
    { time: '20:00', moisture: 47, temp: 23, humidity: 74 },
  ];

  const getSensorIcon = (name) => {
    const n = name?.toLowerCase() || '';
    if (n.includes('moisture')) return <Droplets className="w-5 h-5 text-teal-400" />;
    if (n.includes('temp')) return <Thermometer className="w-5 h-5 text-amber-400" />;
    if (n.includes('solar') || n.includes('light')) return <Sun className="w-5 h-5 text-yellow-400" />;
    return <Cpu className="w-5 h-5 text-emerald-400" />;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto selection:bg-emerald-500 selection:text-black">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#1B382D] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="os-status-pill os-status-emerald">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ESP32 / LoRaWAN Mesh
            </span>
            <span className="text-[11px] text-[#8FA59B]">Sub-GHz Wireless Gateway</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-[#F3F7F5] flex items-center gap-2.5">
            <Cpu className="w-7 h-7 text-emerald-400" />
            <span>IoT Wireless Sensor Telemetry</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8FA59B] mt-1">
            Real-time in-ground probe telemetry, capacitive soil moisture readings, and microclimate sensors for{' '}
            <strong className="text-emerald-400">{activeFarm?.name || 'Active Farm'}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchSensorData}
            className="os-btn-secondary p-2.5"
            title="Refresh Sensor Readings"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsSimulation(!isSimulation)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer ${
              isSimulation
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>{isSimulation ? 'Simulated Hardware Mode' : 'Physical Hardware Ready'}</span>
          </button>
        </div>
      </div>

      {/* Mode Information Card */}
      <div className="p-4 rounded-2xl bg-[#0E1E18] border border-[#1B382D] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-[#F3F7F5]">
              {isSimulation
                ? 'Telemetry Simulation Active (Development & Demo)'
                : 'Hardware Ingestion Gateway Listening (Production)'}
            </p>
            <p className="text-[11px] text-[#8FA59B] mt-0.5">
              {isSimulation
                ? 'Generating real-world calibrated variations for moisture, temperature, and ambient EC testing.'
                : 'Send POST payloads with API keys to `/api/sensors/readings` from your ESP32 / Arduino LoRa nodes.'}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#08120E] border border-[#1B382D] text-[#8FA59B] self-start sm:self-auto">
          Polling: Every 8s
        </span>
      </div>

      {/* Sensor Node Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sensors.map((sensor) => (
          <div key={sensor.id} className="os-card p-5 space-y-3.5">
            <div className="flex items-start justify-between border-b border-[#1B382D] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#08120E] border border-[#1B382D] flex items-center justify-center shrink-0">
                  {getSensorIcon(sensor.name)}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#F3F7F5]">{sensor.name}</h3>
                  <span className="text-[10px] text-[#8FA59B] uppercase font-semibold">{sensor.model}</span>
                </div>
              </div>

              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                  sensor.status === 'Online'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                }`}
              >
                <CheckCircle className="w-3 h-3" /> {sensor.status}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-3xl sm:text-4xl font-bold font-heading text-emerald-400">{sensor.current_value}</span>
                <span className="text-sm text-[#8FA59B] font-bold ml-1.5">{sensor.unit}</span>
              </div>
              <span className="text-[10px] text-[#8FA59B]">
                Updated: {new Date(sensor.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Recharts Area Telemetry Chart */}
      <div className="os-card-elevated p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1B382D] pb-3">
          <h3 className="text-base font-bold font-heading text-[#F3F7F5] flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>24-Hour Soil Moisture & Air Temperature Trend</span>
          </h3>
          <span className="text-[11px] text-[#8FA59B]">LoRa Node #01 Ground Probe</span>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={telemetryHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="moistureGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(27, 56, 45, 0.6)" vertical={false} />
              <XAxis dataKey="time" stroke="#8FA59B" fontSize={11} tickLine={false} axisLine={{ stroke: '#1B382D' }} />
              <YAxis stroke="#8FA59B" fontSize={11} tickLine={false} axisLine={{ stroke: '#1B382D' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0E1E18',
                  borderColor: '#1B382D',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#F3F7F5'
                }}
              />
              <Area
                type="monotone"
                dataKey="moisture"
                name="Soil Moisture (%)"
                stroke="#14B8A6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#moistureGrad)"
                dot={{ r: 3, fill: '#14B8A6' }}
              />
              <Area
                type="monotone"
                dataKey="temp"
                name="Air Temp (°C)"
                stroke="#F59E0B"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#tempGrad)"
                dot={{ r: 3, fill: '#F59E0B' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
