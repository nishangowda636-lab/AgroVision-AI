import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, MapPin, Search, Loader2 } from 'lucide-react';

// Custom Emerald SVG Marker Icon
const emeraldMarkerSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="32" height="48">
  <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24c0-6.63-5.37-12-12-12z" fill="#10B981" stroke="#041E15" stroke-width="1.8"/>
  <circle cx="12" cy="12" r="5" fill="#06131D"/>
  <circle cx="12" cy="12" r="3" fill="#34D399"/>
</svg>`;

const emeraldIcon = L.divIcon({
  className: 'custom-emerald-pin',
  html: emeraldMarkerSvg,
  iconSize: [32, 48],
  iconAnchor: [16, 48],
  popupAnchor: [0, -42]
});

// Helper component to smoothly re-center map view whenever position changes
function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom() || 13, { animate: true });
    }
  }, [center, map]);
  return null;
}

// Reverse geocode lat/lng to get human readable location name (e.g. "Mandya, Karnataka, India")
export const reverseGeocode = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.address) {
      const a = data.address;
      const locality = a.city || a.town || a.village || a.suburb || a.hamlet || a.county || a.state_district;
      const district = a.state_district || a.county;
      const state = a.state;
      const country = a.country || 'India';

      const parts = [];
      if (locality) parts.push(locality);
      if (district && district !== locality) parts.push(district);
      if (state && state !== locality && state !== district) parts.push(state);
      if (country) parts.push(country);

      return parts.length > 0 ? parts.join(', ') : data.display_name.split(',').slice(0, 3).join(', ');
    }
    return data?.display_name ? data.display_name.split(',').slice(0, 3).join(', ') : null;
  } catch (err) {
    console.warn('Reverse geocode error:', err);
    return null;
  }
};

// Click and drag listener on map
function LocationMarker({ position, setPosition, onLocationSelect }) {
  useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng;
      const newPos = [lat, lng];
      setPosition(newPos);
      const locationName = await reverseGeocode(lat, lng);
      if (onLocationSelect) {
        onLocationSelect(lat, lng, locationName);
      }
    },
  });

  return position ? (
    <Marker
      position={position}
      icon={emeraldIcon}
      draggable={true}
      eventHandlers={{
        async dragend(e) {
          const marker = e.target;
          const { lat, lng } = marker.getLatLng();
          setPosition([lat, lng]);
          const locationName = await reverseGeocode(lat, lng);
          if (onLocationSelect) {
            onLocationSelect(lat, lng, locationName);
          }
        },
      }}
    >
      <Popup>
        <div className="text-xs space-y-1 p-1">
          <p className="font-bold text-emerald-600">📍 Selected Farm Location</p>
          <p className="text-slate-800 font-mono text-[11px]">Lat: {position[0].toFixed(4)}° N</p>
          <p className="text-slate-800 font-mono text-[11px]">Lng: {position[1].toFixed(4)}° E</p>
          <p className="text-[10px] text-slate-500 italic">Drag pin or click map to adjust position</p>
        </div>
      </Popup>
    </Marker>
  ) : null;
}

export default function FarmMap({
  initialLat,
  initialLng,
  latitude,
  longitude,
  onLocationSelect,
  farmName = 'My Farm',
  className = 'h-96'
}) {
  const defaultLat = latitude ?? initialLat ?? 12.9716;
  const defaultLng = longitude ?? initialLng ?? 77.5946;

  const [position, setPosition] = useState([defaultLat, defaultLng]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');

  useEffect(() => {
    const lat = latitude ?? initialLat;
    const lng = longitude ?? initialLng;
    if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
      setPosition([lat, lng]);
    }
  }, [latitude, longitude, initialLat, initialLng]);

  const handleGetCurrentLocation = () => {
    if (locating) return;

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setLocating(true);
    setLocationStatus('Locating...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPosition([lat, lng]);
        setLocationStatus('Location detected');

        const defaultName = `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
        if (onLocationSelect) {
          onLocationSelect(lat, lng, defaultName);
        }

        try {
          const locationName = await reverseGeocode(lat, lng);
          if (locationName && onLocationSelect) {
            onLocationSelect(lat, lng, locationName);
          }
        } catch (err) {
          console.warn('Reverse geocode error:', err);
        }

        setTimeout(() => {
          setLocationStatus('');
        }, 2500);
      },
      (error) => {
        setLocating(false);
        setLocationStatus('');
        let msg = 'Could not acquire GPS location.';
        if (error.code === 1 || error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission was denied. Please allow location access in your browser and try again.';
        } else if (error.code === 2 || error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Your current location could not be determined. Please check your device location/GPS and try again.';
        } else if (error.code === 3 || error.code === error.TIMEOUT) {
          msg = 'Location request timed out. Please try again.';
        }
        alert(msg);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setPosition([lat, lng]);
        const formatted = await reverseGeocode(lat, lng) || data[0].display_name.split(',').slice(0, 3).join(', ');
        if (onLocationSelect) {
          onLocationSelect(lat, lng, formatted);
        }
      } else {
        alert(`Location "${searchQuery}" not found. Try searching for a nearby district, taluk, or city name.`);
      }
    } catch (err) {
      alert('Error searching for location on the map. Please try clicking the map directly.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className={`relative w-full ${className} rounded-2xl overflow-hidden border border-emerald-500/30 shadow-xl bg-[#04131B]`}>
      <MapContainer
        center={position}
        zoom={13}
        scrollWheelZoom={false}
        style={{ width: '100%', height: '100%', zIndex: 1 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap center={position} />
        <LocationMarker position={position} setPosition={setPosition} onLocationSelect={onLocationSelect} />
      </MapContainer>

      {/* Top Search & GPS Control Overlay (High z-index to guarantee clickability above Leaflet layers) */}
      <div className="absolute top-3 left-3 right-3 z-[1001] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pointer-events-auto">
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center gap-1.5 bg-[#06131D]/95 p-1.5 rounded-xl border border-emerald-500/40 shadow-xl backdrop-blur-md w-full sm:w-80"
        >
          <Search className="w-4 h-4 text-emerald-400 ml-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search town, district, or village..."
            className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-slate-400 px-1"
          />
          <button
            type="submit"
            disabled={searching}
            className="px-3 py-1 bg-emerald-500 text-black text-[11px] font-bold rounded-lg hover:bg-emerald-400 shrink-0 cursor-pointer disabled:opacity-50"
          >
            {searching ? 'Finding...' : 'Search'}
          </button>
        </form>

        <button
          onClick={handleGetCurrentLocation}
          disabled={locating}
          type="button"
          id="btn-farm-map-current-location"
          className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 border border-emerald-400/50 text-white text-xs font-bold shadow-xl hover:from-emerald-500 hover:to-teal-500 transition-all cursor-pointer backdrop-blur-md shrink-0 active:scale-95 disabled:opacity-60"
        >
          {locating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              <span>Locating...</span>
            </>
          ) : locationStatus === 'Location detected' ? (
            <>
              <MapPin className="w-3.5 h-3.5 text-emerald-300" />
              <span>Location detected</span>
            </>
          ) : (
            <>
              <Navigation className="w-3.5 h-3.5 text-white animate-pulse" />
              <span>Use Current Location</span>
            </>
          )}
        </button>
      </div>

      {/* Bottom Coordinates & Live Status Badge */}
      <div className="absolute bottom-3 left-3 z-[1001] px-3 py-1.5 rounded-xl bg-[#06131D]/90 border border-emerald-500/30 text-[11px] text-slate-200 backdrop-blur-md flex items-center gap-2 shadow-lg">
        {locationStatus ? (
          <span className="text-amber-300 font-semibold animate-pulse">{locationStatus}</span>
        ) : (
          <>
            <span className="font-semibold text-emerald-400">Lat:</span> {position[0].toFixed(4)}° N |{' '}
            <span className="font-semibold text-emerald-400">Lng:</span> {position[1].toFixed(4)}° E
          </>
        )}
      </div>
    </div>
  );
}

