import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap, useMapEvents } from 'react-leaflet';
import {
  Satellite,
  Activity,
  Layers,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Droplets,
  Sprout,
  ShieldCheck,
  RefreshCw,
  Calendar,
  Eye,
  MapPin,
  Clock,
  Edit3,
  Save,
  RotateCcw,
  History
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// Map Recenter Helper Component
function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom() || 16, { animate: true });
    }
  }, [center, map]);
  return null;
}

// Map Click Handler for Drawing Custom Polygon Boundaries
function PolygonDrawHandler({ isDrawing, points, setPoints }) {
  useMapEvents({
    click(e) {
      if (!isDrawing) return;
      const newPt = [roundTo(e.latlng.lat, 6), roundTo(e.latlng.lng, 6)];
      setPoints((prev) => [...prev, newPt]);
    },
  });
  return null;
}

function roundTo(val, dec) {
  return Number(Math.round(val + 'e' + dec) + 'e-' + dec);
}

const NDVI_COLORS = {
  'Healthy': '#10B981',        // Emerald Green
  'Moderate Stress': '#F59E0B',// Amber
  'High Stress': '#EF4444'     // Rose/Red
};

const NDMI_COLORS = {
  'Healthy': '#0284C7',        // Ocean Blue (High Moisture)
  'Moderate Stress': '#10B981',// Green (Optimal)
  'High Stress': '#F43F5E'     // Rose (Moisture Deficit)
};

export default function SatellitePage() {
  const { activeFarm, farms, setActiveFarm } = useFarm();
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);

  // View & Layer Controls
  const [activeTab, setActiveTab] = useState('current'); // 'current', 'history', 'boundary'
  const [indexType, setIndexType] = useState('ndvi');     // 'ndvi', 'ndmi'
  const [mapLayer, setMapLayer] = useState('satellite');  // 'satellite', 'street'
  const [selectedHistoryPass, setSelectedHistoryPass] = useState(null);

  // Boundary Drawing State
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState([]);
  const [savingBoundary, setSavingBoundary] = useState(false);
  const [boundarySavedMsg, setBoundarySavedMsg] = useState(null);

  const fetchSatelliteData = async (force = false) => {
    if (!activeFarm) {
      setLoading(false);
      return;
    }

    if (force) setRefreshing(true);
    else setLoading(true);
    setErrorMsg(null);

    try {
      const url = force
        ? `/satellite/field-health/${activeFarm.id}?refresh=true`
        : `/satellite/field-health/${activeFarm.id}`;
      const res = await api.get(url);
      setData(res.data);
      if (res.data?.zones && res.data.zones.length > 0) {
        setSelectedZone(res.data.zones[0]);
      }
      if (res.data?.historical_timeline && res.data.historical_timeline.length > 0) {
        setSelectedHistoryPass(res.data.historical_timeline[0]);
      }
    } catch (err) {
      console.error('Error fetching satellite data:', err);
      setErrorMsg(
        err.response?.data?.detail ||
        'Unable to load satellite observation. Please verify farm GPS coordinates in Farm Setup.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSatelliteData();
  }, [activeFarm?.id]);

  const handleRefresh = () => {
    fetchSatelliteData(true);
  };

  const handleSaveBoundary = async () => {
    if (drawnPoints.length < 3) {
      alert('Please click at least 3 points on the map to define a field polygon.');
      return;
    }

    setSavingBoundary(true);
    setBoundarySavedMsg(null);
    try {
      const closedPoints = [...drawnPoints];
      if (
        closedPoints[0][0] !== closedPoints[closedPoints.length - 1][0] ||
        closedPoints[0][1] !== closedPoints[closedPoints.length - 1][1]
      ) {
        closedPoints.push(closedPoints[0]);
      }

      const geojsonPayload = {
        type: 'Feature',
        properties: {
          name: `Custom Field Boundary - ${activeFarm.name}`,
          crop: activeFarm.crop || 'Crop',
          updated_at: new Date().toISOString()
        },
        geometry: {
          type: 'Polygon',
          coordinates: [closedPoints.map((pt) => [pt[1], pt[0]])]
        }
      };

      await api.post(`/satellite/boundary/${activeFarm.id}`, {
        boundary_geojson: geojsonPayload
      });

      setBoundarySavedMsg('Field boundary updated successfully! Refreshing satellite pass...');
      setIsDrawing(false);
      setDrawnPoints([]);
      fetchSatelliteData(true);
      setTimeout(() => setBoundarySavedMsg(null), 4000);
    } catch (err) {
      console.error('Failed to save boundary:', err);
      alert('Failed to save boundary: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSavingBoundary(false);
    }
  };

  if (!activeFarm) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 flex items-center justify-center mx-auto shadow-sm">
          <Satellite className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-[#F3F7F5]">No Farm Selected</h2>
        <p className="text-xs text-[#8FA59B] max-w-md mx-auto">
          Please select or register a farm with GPS coordinates in Farm Setup to view Sentinel-2 remote sensing canopy vigor.
        </p>
      </div>
    );
  }

  const mapCenter = [
    data?.latitude || activeFarm.latitude || 12.9716,
    data?.longitude || activeFarm.longitude || 77.5946
  ];

  const whatChanged = data?.what_changed;
  const crossAnalysis = data?.cross_analysis;
  const historyTimeline = data?.historical_timeline || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto selection:bg-[#10B981] selection:text-black">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/20 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span> Sentinel-2 L2A Multispectral
            </span>
            <span className="text-[10px] font-medium text-[#8FA59B]">
              10m Optical & RedEdge Resolution
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F3F7F5] flex items-center gap-2.5">
            <Satellite className="w-6 h-6 text-[#10B981]" />
            <span>Satellite Field Health & Canopy Vigor</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8FA59B] mt-0.5">
            Multispectral earth observation and stress localization for{' '}
            <strong className="text-[#F3F7F5] font-semibold">{activeFarm.name}</strong> ({activeFarm.crop || 'Crop'} • {activeFarm.size_acres || 1.0} Acres).
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {farms.length > 1 && (
            <select
              value={activeFarm?.id || ''}
              onChange={(e) => {
                const found = farms.find((f) => f.id === parseInt(e.target.value));
                if (found) setActiveFarm(found);
              }}
              className="os-input text-xs font-semibold px-3 py-2 cursor-pointer bg-[#0E1E18]"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id} className="bg-[#0E1E18]">
                  🌱 {f.name} ({f.crop})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="os-btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#10B981]' : ''}`} />
            <span>{refreshing ? 'Querying STAC...' : 'Refresh Orbit Pass'}</span>
          </button>
        </div>
      </div>

      {/* Main View Mode Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0E1E18] p-1.5 rounded-xl border border-[#1B382D]">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { setActiveTab('current'); setIsDrawing(false); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'current'
                ? 'bg-[#10B981] text-[#08120E] font-bold shadow-sm'
                : 'text-[#8FA59B] hover:text-[#F3F7F5] hover:bg-[#11261F]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Current Pass</span>
          </button>

          <button
            onClick={() => { setActiveTab('history'); setIsDrawing(false); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-[#10B981] text-[#08120E] font-bold shadow-sm'
                : 'text-[#8FA59B] hover:text-[#F3F7F5] hover:bg-[#11261F]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historical Timeline</span>
          </button>

          <button
            onClick={() => { setActiveTab('boundary'); setIsDrawing(true); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'boundary'
                ? 'bg-[#10B981] text-[#08120E] font-bold shadow-sm'
                : 'text-[#8FA59B] hover:text-[#F3F7F5] hover:bg-[#11261F]'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Draw Field Boundary</span>
          </button>
        </div>

        {/* Index Switcher: NDVI vs NDMI */}
        <div className="flex items-center gap-1 bg-[#08120E] p-1 rounded-lg border border-[#1B382D] text-xs">
          <button
            onClick={() => setIndexType('ndvi')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
              indexType === 'ndvi' ? 'bg-[#10B981] text-[#08120E] font-bold' : 'text-[#8FA59B] hover:text-[#F3F7F5]'
            }`}
          >
            NDVI (Vegetation)
          </button>
          <button
            onClick={() => setIndexType('ndmi')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
              indexType === 'ndmi' ? 'bg-[#14B8A6] text-[#08120E] font-bold' : 'text-[#8FA59B] hover:text-[#F3F7F5]'
            }`}
          >
            NDMI (Moisture)
          </button>
        </div>
      </div>

      {/* Cloud-Cover Alert Banner */}
      {data?.is_cloud_covered && (
        <div className="os-card p-4 border-[#F59E0B]/30 bg-[#F59E0B]/5 text-xs text-[#F59E0B] flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="font-bold text-[#F59E0B]">Moderate Cloud Coverage ({data.cloud_cover_pct}%) Detected</h4>
            <p className="text-[#8FA59B] leading-relaxed">
              Atmospheric cloud interference was detected during this Sentinel-2 pass. Prior clear-sky observation baseline is used for cross-calibration.
            </p>
          </div>
        </div>
      )}

      {boundarySavedMsg && (
        <div className="os-card p-3 border-[#10B981]/40 text-xs text-[#10B981] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          <span>{boundarySavedMsg}</span>
        </div>
      )}

      {errorMsg ? (
        <div className="os-card p-6 border-[#EF4444]/30 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-[#EF4444] font-bold">
            <AlertOctagon className="w-4 h-4" />
            <span>Satellite Observation Unavailable</span>
          </div>
          <p className="text-[#8FA59B]">{errorMsg}</p>
          <button
            onClick={handleRefresh}
            className="os-btn-primary mt-2 px-3 py-1.5 text-xs cursor-pointer"
          >
            Retry Satellite Connection
          </button>
        </div>
      ) : loading && !data ? (
        <div className="p-12 text-center text-[#8FA59B] text-xs space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-[#10B981] mx-auto" />
          <p className="text-[#F3F7F5] font-semibold text-sm">Querying Sentinel-2 Planetary Engine...</p>
          <p>Computing multispectral NDVI canopy vigor and spatial moisture telemetry.</p>
        </div>
      ) : (
        <>
          {/* Top KPI Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. Overall Health */}
            <div className="os-card p-4 space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8FA59B] block">
                Canopy Health Status
              </span>
              <div className="flex items-center justify-between">
                <span
                  className={`text-lg font-bold ${
                    data?.health_status === 'Healthy'
                      ? 'text-[#10B981]'
                      : data?.health_status === 'Moderate Stress'
                      ? 'text-[#F59E0B]'
                      : 'text-[#EF4444]'
                  }`}
                >
                  {data?.health_status}
                </span>
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    data?.health_status === 'Healthy'
                      ? 'bg-[#10B981] animate-pulse'
                      : data?.health_status === 'Moderate Stress'
                      ? 'bg-[#F59E0B]'
                      : 'bg-[#EF4444]'
                  }`}
                />
              </div>
              <p className="text-[10px] text-[#8FA59B]">
                {data?.resolution_meters}m Multispectral Precision
              </p>
            </div>

            {/* 2. Mean Field NDVI or NDMI */}
            <div className="os-card p-4 space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8FA59B] block">
                {indexType === 'ndvi' ? 'Mean Field NDVI (Canopy)' : 'Mean Field NDMI (Moisture)'}
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-[#F3F7F5]">
                  {indexType === 'ndvi'
                    ? data?.mean_ndvi?.toFixed(2)
                    : data?.mean_ndmi?.toFixed(2) || '0.50'}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                    indexType === 'ndvi'
                      ? 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20'
                      : 'text-[#14B8A6] bg-[#14B8A6]/10 border-[#14B8A6]/20'
                  }`}
                >
                  {indexType === 'ndvi' ? 'Vegetation Vigor' : 'Canopy Water'}
                </span>
              </div>
              <div className="w-full bg-[#08120E] h-1.5 rounded-full overflow-hidden border border-[#1B382D]">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    indexType === 'ndvi'
                      ? 'bg-[#10B981]'
                      : 'bg-[#14B8A6]'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        10,
                        (((indexType === 'ndvi' ? data?.mean_ndvi : data?.mean_ndmi) || 0.6) + 0.2) * 100
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* 3. Affected Area */}
            <div className="os-card p-4 space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8FA59B] block">
                Stress Affected Area
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-[#F59E0B]">
                  {data?.affected_area_acres} <span className="text-xs font-normal text-[#8FA59B]">Acres</span>
                </span>
                <span className="text-[10px] text-[#8FA59B]">
                  of {data?.size_acres} Acres
                </span>
              </div>
              <p className="text-[10px] text-[#8FA59B]">
                {data?.affected_area_acres === 0
                  ? 'Uniform healthy canopy across plot'
                  : 'Localized in South-West Quadrant'}
              </p>
            </div>

            {/* 4. Latest Pass Date */}
            <div className="os-card p-4 space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8FA59B] block">
                Latest Orbit Pass
              </span>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#F3F7F5]">{data?.observation_date}</span>
                <span className="text-[10px] text-[#8FA59B] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  5-Day Cycle
                </span>
              </div>
              <p className="text-[10px] text-[#8FA59B]">
                Cloud Cover: <span className="text-[#10B981] font-semibold">{data?.cloud_cover_pct}%</span>
              </p>
            </div>
          </div>

          {/* Main Map & Detail Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Column: Interactive Satellite Map (7 Cols) */}
            <div className="lg:col-span-7 os-card p-4 sm:p-5 space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1B382D] pb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#10B981]" />
                  <h3 className="font-bold text-xs text-[#F3F7F5]">
                    {activeTab === 'boundary'
                      ? 'Draw Custom Field Boundary (Click Map Corners)'
                      : `Multispectral ${indexType.toUpperCase()} Canopy Map`}
                  </h3>
                </div>

                {/* Map Layer Switcher */}
                <div className="flex items-center gap-1 bg-[#08120E] p-1 rounded-lg border border-[#1B382D] text-[10px]">
                  <button
                    onClick={() => setMapLayer('satellite')}
                    className={`px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
                      mapLayer === 'satellite' ? 'bg-[#10B981] text-[#08120E] font-bold' : 'text-[#8FA59B] hover:text-[#F3F7F5]'
                    }`}
                  >
                    Satellite View
                  </button>
                  <button
                    onClick={() => setMapLayer('street')}
                    className={`px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
                      mapLayer === 'street' ? 'bg-[#10B981] text-[#08120E] font-bold' : 'text-[#8FA59B] hover:text-[#F3F7F5]'
                    }`}
                  >
                    Street View
                  </button>
                </div>
              </div>

              {/* Boundary Drawing Action Bar */}
              {activeTab === 'boundary' && (
                <div className="p-3 rounded-xl bg-[#08120E] border border-[#1B382D] text-xs flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[#8FA59B]">
                    <span className="font-bold text-[#10B981]">Points: {drawnPoints.length}</span>
                    <span className="text-[11px] ml-2">Click on the farm boundary corners on the map.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDrawnPoints([])}
                      className="os-btn-secondary px-2.5 py-1 text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Clear
                    </button>
                    <button
                      onClick={handleSaveBoundary}
                      disabled={savingBoundary || drawnPoints.length < 3}
                      className="os-btn-primary px-3 py-1 text-[11px] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3 h-3" />
                      {savingBoundary ? 'Saving...' : 'Save Boundary'}
                    </button>
                  </div>
                </div>
              )}

              {/* Leaflet Map View */}
              <div className="relative h-[380px] w-full rounded-xl overflow-hidden border border-[#1B382D]">
                <MapContainer
                  center={mapCenter}
                  zoom={16}
                  scrollWheelZoom={false}
                  style={{ height: '100%', width: '100%', background: '#08120E' }}
                >
                  <RecenterMap center={mapCenter} />
                  <PolygonDrawHandler isDrawing={activeTab === 'boundary'} points={drawnPoints} setPoints={setDrawnPoints} />

                  {mapLayer === 'satellite' ? (
                    <TileLayer
                      attribution='&copy; <a href="https://www.esri.com/">Esri World Imagery</a>'
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                      maxZoom={19}
                    />
                  ) : (
                    <TileLayer
                      attribution='&copy; OpenStreetMap contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      maxZoom={19}
                    />
                  )}

                  {/* Render Drawing Polygon Preview */}
                  {drawnPoints.length >= 2 && (
                    <Polygon
                      positions={drawnPoints}
                      pathOptions={{
                        color: '#38BDF8',
                        weight: 2,
                        dashArray: '4, 6',
                        fillColor: '#0284C7',
                        fillOpacity: 0.35
                      }}
                    />
                  )}

                  {/* Render Spatial Health Quadrants */}
                  {activeTab !== 'boundary' && data?.zones &&
                    data.zones.map((zone) => {
                      const colorMap = indexType === 'ndvi' ? NDVI_COLORS : NDMI_COLORS;
                      const color = colorMap[zone.health_status] || '#10B981';
                      const isSelected = selectedZone?.zone_id === zone.zone_id;
                      return (
                        <Polygon
                          key={zone.zone_id}
                          positions={zone.bounds}
                          pathOptions={{
                            color: isSelected ? '#FFFFFF' : color,
                            weight: isSelected ? 2.5 : 1.5,
                            fillColor: color,
                            fillOpacity: isSelected ? 0.6 : 0.4,
                          }}
                          eventHandlers={{
                            click: () => setSelectedZone(zone),
                          }}
                        >
                          <Popup>
                            <div className="p-1 text-xs text-slate-800 space-y-1">
                              <h4 className="font-bold text-emerald-900">{zone.name}</h4>
                              <p>NDVI: <strong>{zone.mean_ndvi}</strong> | NDMI: <strong>{zone.mean_ndmi}</strong></p>
                              <p>Status: <span className="font-bold">{zone.health_status}</span></p>
                              <p>Area: {zone.area_acres} Acres</p>
                              <p className="text-[10px] text-slate-600">{zone.stress_cause_hypothesis}</p>
                            </div>
                          </Popup>
                        </Polygon>
                      );
                    })}

                  {/* Farm Center Marker */}
                  <Marker position={mapCenter}>
                    <Popup>
                      <div className="p-1 text-xs">
                        <strong className="text-emerald-700">{activeFarm.name}</strong>
                        <p>{activeFarm.crop} • {activeFarm.size_acres} Acres</p>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>

                {/* Map Floating Legend */}
                <div className="absolute bottom-3 right-3 bg-[#08120E]/95 backdrop-blur-md p-2.5 rounded-lg border border-[#1B382D] text-[10px] space-y-1 z-[1000] shadow-md">
                  <span className="font-bold text-[#F3F7F5] block mb-0.5">
                    {indexType === 'ndvi' ? 'NDVI Vegetation Vigor' : 'NDMI Canopy Moisture'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                    <span className="text-[#8FA59B]">Healthy (&gt;0.65)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                    <span className="text-[#8FA59B]">Moderate Stress (0.45 - 0.65)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                    <span className="text-[#8FA59B]">High Stress (&lt;0.45)</span>
                  </div>
                </div>
              </div>

              {/* Selected Zone Quick Inspector */}
              {selectedZone && (
                <div className="p-3 rounded-xl bg-[#08120E] border border-[#1B382D] text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#F3F7F5] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#10B981]" />
                      {selectedZone.name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        selectedZone.health_status === 'Healthy'
                          ? 'bg-[#10B981]/15 text-[#10B981]'
                          : selectedZone.health_status === 'Moderate Stress'
                          ? 'bg-[#F59E0B]/15 text-[#F59E0B]'
                          : 'bg-[#EF4444]/15 text-[#EF4444]'
                      }`}
                    >
                      NDVI {selectedZone.mean_ndvi} • NDMI {selectedZone.mean_ndmi} • {selectedZone.health_status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8FA59B]">{selectedZone.stress_cause_hypothesis}</p>
                  <p className="text-[11px] text-[#10B981] font-medium">
                    → Recommendation: {selectedZone.recommended_action}
                  </p>
                </div>
              )}
            </div>

            {/* Right Column: "WHAT CHANGED?" + Historical Timeline or AI Cross-Correlation (5 Cols) */}
            <div className="lg:col-span-5 space-y-3.5">
              {activeTab === 'history' ? (
                /* Historical Timeline View */
                <div className="os-card p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1B382D] pb-2.5">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-[#10B981]" />
                      <h3 className="font-bold text-xs text-[#F3F7F5]">Sentinel-2 Orbital Timeline</h3>
                    </div>
                    <span className="text-[10px] text-[#8FA59B]">Past 5-Day Passes</span>
                  </div>

                  {historyTimeline.length === 0 ? (
                    <p className="text-xs text-[#8FA59B]">Historical data unavailable for this farm location.</p>
                  ) : (
                    <div className="space-y-2">
                      {historyTimeline.map((pass, idx) => (
                        <div
                          key={pass.scene_id || idx}
                          onClick={() => setSelectedHistoryPass(pass)}
                          className={`p-2.5 rounded-lg border transition-all cursor-pointer text-xs space-y-1 ${
                            selectedHistoryPass?.date === pass.date
                              ? 'bg-[#10B981]/10 border-[#10B981] text-[#F3F7F5]'
                              : 'bg-[#08120E] border-[#1B382D] text-[#8FA59B] hover:border-[#10B981]/40'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[#F3F7F5] flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-[#10B981]" />
                              Pass Date: {pass.date}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                pass.health_status === 'Healthy'
                                  ? 'bg-[#10B981]/15 text-[#10B981]'
                                  : 'bg-[#F59E0B]/15 text-[#F59E0B]'
                              }`}
                            >
                              NDVI {pass.mean_ndvi}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-[#8FA59B] pt-0.5">
                            <span>Platform: {pass.platform}</span>
                            <span>Cloud Cover: {pass.cloud_cover_pct}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Delta comparison info */}
                  <div className="p-3 rounded-lg bg-[#08120E] border border-[#1B382D] text-xs space-y-1">
                    <span className="font-semibold text-[#F3F7F5] block text-[11px]">Historical Comparison:</span>
                    <p className="text-[11px] text-[#8FA59B] leading-relaxed">
                      {data?.historical_comparison?.historical_status || 'Historical comparisons are evaluated across sequential 5-day Sentinel-2 passes.'}
                    </p>
                  </div>
                </div>
              ) : (
                /* "WHAT CHANGED?" Card */
                <div className="os-card p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1B382D] pb-2.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#10B981]" />
                      <h3 className="font-bold text-xs text-[#F3F7F5]">WHAT CHANGED?</h3>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                        whatChanged?.trend === 'IMPROVING'
                          ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                          : whatChanged?.trend === 'DECLINING'
                          ? 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
                          : 'bg-[#08120E] text-[#8FA59B]'
                      }`}
                    >
                      {whatChanged?.trend === 'IMPROVING' ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : whatChanged?.trend === 'DECLINING' ? (
                        <TrendingDown className="w-3 h-3" />
                      ) : (
                        <Minus className="w-3 h-3" />
                      )}
                      <span>{whatChanged?.ndvi_change_pct > 0 ? `+${whatChanged?.ndvi_change_pct}%` : `${whatChanged?.ndvi_change_pct}%`}</span>
                    </span>
                  </div>

                  {/* 5-Day Comparison Pill */}
                  <div className="grid grid-cols-2 gap-2 bg-[#08120E] p-2.5 rounded-lg border border-[#1B382D] text-xs">
                    <div>
                      <span className="text-[10px] text-[#8FA59B] block">Previous ({whatChanged?.previous_date}):</span>
                      <span className="font-bold text-[#F3F7F5]">NDVI {whatChanged?.previous_ndvi}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8FA59B] block">Current ({whatChanged?.current_date}):</span>
                      <span className="font-bold text-[#10B981]">NDVI {whatChanged?.current_ndvi}</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#8FA59B] leading-relaxed">
                    {whatChanged?.summary}
                  </p>

                  {/* Possible Reasons */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[11px] font-semibold text-[#F3F7F5] block">Agronomic Factors:</span>
                    <ul className="space-y-1 text-[11px] text-[#8FA59B]">
                      {whatChanged?.possible_reasons?.map((reason, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-[#10B981] shrink-0">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommended Action */}
                  <div className="p-3 rounded-lg bg-[#08120E] border border-[#1B382D] text-xs space-y-1">
                    <span className="font-bold text-[#10B981] flex items-center gap-1.5 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Recommended Action:
                    </span>
                    <p className="text-[11px] text-[#8FA59B]">{whatChanged?.recommended_action}</p>
                  </div>
                </div>
              )}

              {/* 2. Joint Cross-Correlation Card */}
              <div className="os-card p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#1B382D] pb-2.5">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#10B981]" />
                    <h3 className="font-bold text-xs text-[#F3F7F5]">
                      Cross-Correlation Telemetry
                    </h3>
                  </div>
                  <span className="text-[10px] text-[#8FA59B]">IoT + Satellite + Weather</span>
                </div>

                {/* Telemetry Matrix Bar */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-[#08120E] border border-[#1B382D]">
                    <span className="text-[9px] text-[#8FA59B] block">Soil Moisture</span>
                    <span className="font-bold text-[#10B981]">
                      {crossAnalysis?.soil_moisture_pct !== null && crossAnalysis?.soil_moisture_pct !== undefined
                        ? `${crossAnalysis.soil_moisture_pct}%`
                        : 'Calibrated'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#08120E] border border-[#1B382D]">
                    <span className="text-[9px] text-[#8FA59B] block">Rain 24h</span>
                    <span className="font-bold text-[#14B8A6]">
                      {crossAnalysis?.rain_prob_next_24h}%
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#08120E] border border-[#1B382D]">
                    <span className="text-[9px] text-[#8FA59B] block">Crop Stage</span>
                    <span className="font-bold text-[#F59E0B] truncate block">
                      {crossAnalysis?.crop_stage}
                    </span>
                  </div>
                </div>

                {/* Cross Analysis Diagnostic Alert */}
                <div
                  className={`p-3 rounded-lg border text-xs space-y-1 ${
                    crossAnalysis?.diagnosis_type === 'WATER_STRESS'
                      ? 'bg-[#F59E0B]/5 border-[#F59E0B]/30 text-[#F59E0B]'
                      : crossAnalysis?.diagnosis_type === 'BIOLOGICAL_OR_NUTRIENT_STRESS'
                      ? 'bg-[#EF4444]/5 border-[#EF4444]/30 text-[#EF4444]'
                      : 'bg-[#10B981]/5 border-[#10B981]/30 text-[#10B981]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>{crossAnalysis?.headline}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-[#8FA59B]">
                    {crossAnalysis?.detailed_explanation}
                  </p>
                </div>

                {/* Action steps */}
                <div className="space-y-1 text-[11px]">
                  <span className="font-semibold text-[#F3F7F5] block">Targeted Action Protocol:</span>
                  {crossAnalysis?.action_steps?.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-[#8FA59B]">
                      <span className="text-[#10B981] font-bold">{idx + 1}.</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>

                {/* Screening Disclaimer */}
                <div className="pt-2 border-t border-[#1B382D] text-[10px] text-[#8FA59B] leading-relaxed italic">
                  * {data?.screening_disclaimer || "Satellite vegetation (NDVI) and moisture (NDMI) indices are optical screening signals. Ground scouting with AgroVision Crop Health AI is recommended before chemical treatments."}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
