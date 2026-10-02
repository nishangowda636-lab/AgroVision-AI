import React, { useState, useEffect } from 'react';
import { useFarm } from '../context/FarmContext';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Layers, Sprout, Droplets, ArrowRight, RefreshCw, ChevronRight } from 'lucide-react';

// Custom SVG Pin for Farms
const createCustomFarmPin = (isSelected) => {
  const color = isSelected ? '#10B981' : '#059669';
  const label = '🌱';

  return L.divIcon({
    className: 'custom-agro-pin',
    html: `
      <div style="position:relative; width:36px; height:48px;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="36" height="48">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24c0-6.63-5.37-12-12-12z" fill="${color}" stroke="#08120E" stroke-width="1.5"/>
          <circle cx="12" cy="12" r="7" fill="#08120E"/>
        </svg>
        <span style="position:absolute; top:4px; left:0; right:0; text-align:center; font-size:12px; font-weight:bold; color:#FFF;">${label}</span>
      </div>`,
    iconSize: [36, 48],
    iconAnchor: [18, 48],
    popupAnchor: [0, -44]
  });
};

function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
}

export default function MapViewPage() {
  const { farms, activeFarm, setActiveFarm } = useFarm();
  const [selectedFarm, setSelectedFarm] = useState(activeFarm || (farms.length > 0 ? farms[0] : null));
  const [mapMode, setMapMode] = useState('street');

  useEffect(() => {
    if (activeFarm) {
      setSelectedFarm(activeFarm);
    } else if (farms.length > 0) {
      setSelectedFarm(farms[0]);
    }
  }, [activeFarm, farms]);

  const mapCenter = selectedFarm
    ? [selectedFarm.latitude || 12.9716, selectedFarm.longitude || 77.5946]
    : [12.9716, 77.5946];

  const handleUseCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          if (selectedFarm) {
            setSelectedFarm({ ...selectedFarm, latitude: lat, longitude: lng });
          }
        },
        (error) => {
          alert(`Could not retrieve location (${error.message}).`);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      alert("Geolocation is not supported in this browser.");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto selection:bg-emerald-500 selection:text-black">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#1B382D] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="os-status-pill os-status-emerald">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              GIS Coordinates
            </span>
            <span className="text-[11px] text-[#8FA59B]">Geospatial Farm Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-[#F3F7F5] flex items-center gap-2.5">
            <MapPin className="w-7 h-7 text-emerald-400" />
            <span>Interactive Farm Plot Map</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8FA59B] mt-1">
            Geospatial tracking of your registered farms, GPS coordinates, and satellite layer views.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setMapMode(mapMode === 'street' ? 'satellite' : 'street')}
            className="os-btn-secondary flex items-center gap-1.5 text-xs"
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>{mapMode === 'street' ? 'Satellite Imagery' : 'Map View'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Map + Farm List Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Interactive Map Container */}
        <div className="lg:col-span-2 relative h-[520px] rounded-3xl overflow-hidden border border-[#1B382D] shadow-2xl">
          <MapContainer center={mapCenter} zoom={11} scrollWheelZoom={true} style={{ width: '100%', height: '100%' }}>
            {mapMode === 'street' ? (
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            ) : (
              <TileLayer
                attribution='Tiles &copy; Esri &mdash; Source: Esri'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            )}
            <RecenterMap center={mapCenter} />

            {/* Farm Pins */}
            {farms.map((farm) => {
              const isSelected = selectedFarm?.id === farm.id;
              const pos = [farm.latitude || 12.9716, farm.longitude || 77.5946];

              return (
                <Marker
                  key={`farm-${farm.id}`}
                  position={pos}
                  icon={createCustomFarmPin(isSelected)}
                  eventHandlers={{
                    click: () => {
                      setSelectedFarm(farm);
                      setActiveFarm(farm);
                    },
                  }}
                >
                  <Popup>
                    <div className="text-xs space-y-1 p-1">
                      <p className="font-extrabold text-emerald-700 text-sm">{farm.name}</p>
                      <p className="text-slate-700">Crop: <strong>{farm.crop}</strong></p>
                      <p className="text-slate-700">Size: <strong>{farm.size_acres} Acres</strong></p>
                      <p className="text-slate-700">Soil: {farm.soil_type} (pH {farm.soil_ph})</p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Quick Controls overlay on map */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            <button
              onClick={handleUseCurrentLocation}
              type="button"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#08120E]/90 border border-[#1B382D] text-emerald-300 text-xs font-bold shadow-lg hover:bg-[#0E1E18] transition-all cursor-pointer backdrop-blur-md"
            >
              <Navigation className="w-3.5 h-3.5 text-emerald-400" />
              <span>Current GPS</span>
            </button>
          </div>
        </div>

        {/* Right Farm Details & Selection Panel */}
        <div className="os-card-elevated p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-base font-bold font-heading text-[#F3F7F5] flex items-center gap-2">
              <Sprout className="w-4 h-4 text-emerald-400" />
              <span>Registered Farms ({farms.length})</span>
            </h3>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {farms.map((farm) => {
                const isSelected = selectedFarm?.id === farm.id;
                return (
                  <button
                    key={farm.id}
                    onClick={() => {
                      setSelectedFarm(farm);
                      setActiveFarm(farm);
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#122820] border-emerald-400 ring-1 ring-emerald-400/50'
                        : 'bg-[#08120E] border-[#1B382D] hover:border-emerald-500/40 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#F3F7F5]">{farm.name}</span>
                      <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10">
                        {farm.crop}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8FA59B] mt-1 truncate">
                      📍 {farm.location_name} • {farm.size_acres} Acres
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Selected Farm Detailed Card */}
            {selectedFarm && (
              <div className="bg-[#08120E] p-4 rounded-2xl border border-[#1B382D] space-y-2 text-xs">
                <h4 className="font-bold text-emerald-400 border-b border-[#1B382D] pb-1.5">
                  Farm Telemetry Summary
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[#8FA59B]">
                  <div><span className="text-slate-400">Soil Type:</span> <strong className="text-white">{selectedFarm.soil_type}</strong></div>
                  <div><span className="text-slate-400">Soil pH:</span> <strong className="text-white">{selectedFarm.soil_ph}</strong></div>
                  <div><span className="text-slate-400">Water Source:</span> <strong className="text-white">{selectedFarm.water_source}</strong></div>
                  <div><span className="text-slate-400">Irrigation:</span> <strong className="text-white">{selectedFarm.irrigation_method}</strong></div>
                </div>
                <div className="pt-1 text-[11px] text-emerald-300 font-semibold">
                  Soil N-P-K: [{selectedFarm.nitrogen} - {selectedFarm.phosphorus} - {selectedFarm.potassium}] kg/ha
                </div>
              </div>
            )}
          </div>

          <div className="pt-2">
            <Link
              to="/farm-setup"
              className="os-btn-primary w-full text-xs flex items-center justify-center gap-1.5"
            >
              <span>Manage & Edit Farm Plots</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
