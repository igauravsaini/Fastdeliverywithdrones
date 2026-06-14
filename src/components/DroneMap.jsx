import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const PRESETS = [
  { name: 'Shibuya, Tokyo', lat: 35.6895, lng: 139.6917 },
  { name: 'Central Park, NY', lat: 40.7850, lng: -73.9682 },
  { name: 'London Bridge, UK', lat: 51.5055, lng: -0.0754 },
  { name: 'Taj Mahal, India', lat: 27.1751, lng: 78.0421 },
  { name: 'Eiffel Tower, Paris', lat: 48.8584, lng: 2.2945 },
];

export default function DroneMap({ drones, userLocation, setUserLocation }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({}); // Stores static markers (Warehouse, Relay, Destination)
  const droneMarkersRef = useRef({}); // Stores active drone markers
  const polylineRef = useRef(null); // Flight path polyline
  const [customLat, setCustomLat] = useState('');
  const [customLng, setCustomLng] = useState('');

  // 1. Initialize Map Once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      center: [userLocation.lat, userLocation.lng],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    // CartoDB Dark Matter tile layer (sleek dark themed map)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Update Map Center, Static Markers & Path when userLocation changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Set view to user location
    map.setView([userLocation.lat, userLocation.lng], 13);

    // Clear old static markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    // Coordinates
    const destLat = userLocation.lat;
    const destLng = userLocation.lng;
    const whLat = destLat + 0.012;
    const whLng = destLng - 0.015;
    const relayLat = destLat + 0.006;
    const relayLng = destLng - 0.007;

    // Emojis as DivIcons
    const createEmojiIcon = (emoji, label) => L.divIcon({
      html: `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <div style="font-size: 22px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">${emoji}</div>
          <div style="background: rgba(10,14,26,0.85); border: 1px solid rgba(255,255,255,0.15); color: #94a3b8; font-size: 8px; padding: 2px 5px; border-radius: 4px; white-space: nowrap; margin-top: 2px;">${label}</div>
        </div>
      `,
      className: 'custom-map-icon',
      iconSize: [60, 40],
      iconAnchor: [30, 20]
    });

    const whMarker = L.marker([whLat, whLng], { icon: createEmojiIcon('🏭', 'Warehouse') }).addTo(map);
    const relayMarker = L.marker([relayLat, relayLng], { icon: createEmojiIcon('📡', 'Relay Hub') }).addTo(map);
    const destMarker = L.marker([destLat, destLng], { icon: createEmojiIcon('📍', userLocation.name) }).addTo(map);

    markersRef.current = { warehouse: whMarker, relay: relayMarker, destination: destMarker };

    // Draw Flight Path Polyline
    const pathCoords = [[whLat, whLng], [relayLat, relayLng], [destLat, destLng]];
    polylineRef.current = L.polyline(pathCoords, {
      color: '#3b82f6',
      weight: 2.5,
      opacity: 0.6,
      dashArray: '5, 8'
    }).addTo(map);

  }, [userLocation]);

  // 3. Update Drone Markers Realtime
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const activeDroneIds = new Set();

    drones.forEach(drone => {
      const isFlight = ['IN_FLIGHT', 'DELIVERING', 'RETURNING'].includes(drone.state);

      if (isFlight && drone.flightPath && drone.flightPath.length >= 2) {
        activeDroneIds.add(drone.id);

        let lat, lng;

        if (drone.state === 'RETURNING') {
          // Fly directly from destination back to warehouse
          const from = drone.flightPath[drone.flightPath.length - 1];
          const to = drone.flightPath[0];
          const p = drone.progress;
          lat = from.lat + (to.lat - from.lat) * p;
          lng = from.lng + (to.lng - from.lng) * p;
        } else {
          const leg = Math.min(drone.currentLeg, drone.flightPath.length - 2);
          const from = drone.flightPath[leg];
          const to = drone.flightPath[leg + 1];
          const p = drone.progress;
          lat = from.lat + (to.lat - from.lat) * p;
          lng = from.lng + (to.lng - from.lng) * p;
        }

        // Create or update drone marker
        if (!droneMarkersRef.current[drone.id]) {
          const droneIcon = L.divIcon({
            html: `
              <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative;">
                <div style="font-size: 24px; filter: drop-shadow(0 0 8px #f97316); animation: droneMapFloat 1.5s ease-in-out infinite;">🛸</div>
                <div style="background: rgba(249,115,22,0.9); color: #fff; font-size: 8px; font-weight: bold; padding: 1px 4px; border-radius: 3px; white-space: nowrap; margin-top: 1px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${drone.id}</div>
              </div>
            `,
            className: 'custom-drone-icon',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          });

          droneMarkersRef.current[drone.id] = L.marker([lat, lng], { icon: droneIcon }).addTo(map);
        } else {
          droneMarkersRef.current[drone.id].setLatLng([lat, lng]);
        }
      }
    });

    // Remove any markers for inactive drones
    Object.keys(droneMarkersRef.current).forEach(id => {
      if (!activeDroneIds.has(id)) {
        droneMarkersRef.current[id].remove();
        delete droneMarkersRef.current[id];
      }
    });

  }, [drones]);

  // Request GPS
  const handleGeolocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            name: 'Your Location'
          });
        },
        () => alert('Unable to fetch location. Please enter coordinates manually.')
      );
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      setUserLocation({ lat, lng, name: 'Custom Marker' });
    } else {
      alert('Invalid coordinates. Lat: [-90, 90], Lng: [-180, 180]');
    }
  };

  const activeFlights = drones.filter(d => ['IN_FLIGHT', 'DELIVERING', 'RETURNING'].includes(d.state));

  return (
    <div className="drone-map">
      <div className="panel-subtitle">🗾 Live Google Maps Drone Simulation</div>
      
      {/* Map settings */}
      <div className="map-settings-bar">
        <select 
          className="map-select" 
          value={userLocation.name}
          onChange={(e) => {
            const p = PRESETS.find(pr => pr.name === e.target.value);
            if (p) setUserLocation(p);
          }}
        >
          <option disabled value="">Select Preset Destination</option>
          {PRESETS.map(p => (
            <option key={p.name} value={p.name}>{p.name}</option>
          ))}
          {userLocation.name === 'Your Location' && <option value="Your Location">📍 Your Detected Location</option>}
          {userLocation.name === 'Custom Marker' && <option value="Custom Marker">🔧 Custom Coordinates</option>}
        </select>

        <button className="gps-btn" onClick={handleGeolocate} title="Use My Device Location">
          GPS
        </button>
      </div>

      {/* Manual Coord Input */}
      <form className="map-coord-form" onSubmit={handleCustomSubmit}>
        <input 
          type="number" 
          step="0.0001" 
          placeholder="Lat" 
          value={customLat} 
          onChange={e => setCustomLat(e.target.value)} 
          required 
        />
        <input 
          type="number" 
          step="0.0001" 
          placeholder="Lng" 
          value={customLng} 
          onChange={e => setCustomLng(e.target.value)} 
          required 
        />
        <button type="submit">Go</button>
      </form>

      {/* Leaflet Map Target */}
      <div 
        ref={mapContainerRef} 
        style={{ 
          height: '240px', 
          width: '92%', 
          margin: '8px auto', 
          borderRadius: '8px', 
          border: '1px solid var(--border-glass)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 1
        }} 
      />

      {activeFlights.length > 0 ? (
        <div className="active-flights-info">
          {activeFlights.map(d => (
            <div key={d.id} className="flight-info-row">
              <span className="drone-pulse-dot" />
              <span>
                <strong>{d.id}</strong>: {d.state} ({Math.round(d.progress * 100)}%)
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="drone-map-empty">Drones Docked. Waiting for packaging dispatch...</div>
      )}
    </div>
  );
}
