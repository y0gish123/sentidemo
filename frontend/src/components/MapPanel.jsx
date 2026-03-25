import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 14, { animate: true });
    }
  }, [center, map]);
  return null;
}

export default function MapPanel({ location, route, isRunning }) {
  const [center, setCenter] = useState([12.9716, 77.5946]); // Default map center
  const [showLocation, setShowLocation] = useState(false);

  useEffect(() => {
    if (location) {
      try {
        const parts = location.split(',');
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        if (!isNaN(lat) && !isNaN(lng)) {
          setCenter([lat, lng]);
          setShowLocation(true);
        }
      } catch (e) {}
    } else if (isRunning) {
      setShowLocation(false);
    }
  }, [location, isRunning]);

  // Mock routes for demo visual
  const ambulanceRoute = showLocation ? [
    [center[0] - 0.015, center[1] - 0.01],
    [center[0] - 0.005, center[1] - 0.005],
    center
  ] : [];

  const trafficReroute = showLocation ? [
    [center[0] + 0.005, center[1] - 0.01],
    [center[0] + 0.01, center[1] + 0.01]
  ] : [];

  return (
    <div className='bg-[#161B22] border border-[#30363D] rounded-lg p-3 flex flex-col relative z-0 h-full'>
      <div className='text-sm font-semibold uppercase tracking-wider text-gray-300 mb-2'>
        Live Response Map
      </div>
      <div className='flex-grow bg-black rounded overflow-hidden relative border border-[#30363D]'>
        <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%', zIndex: 1 }} zoomControl={false}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; CARTO'
          />
          <MapUpdater center={center} />
          
          {showLocation && (
            <>
              <Marker position={center} zIndexOffset={100} />
              <Polyline positions={ambulanceRoute} color="#EF4444" weight={4} dashArray="10, 10" />
              <Polyline positions={trafficReroute} color="#3B82F6" weight={4} />
            </>
          )}
        </MapContainer>
        
        {showLocation && (
           <div className='absolute bottom-2 left-2 right-2 bg-black/80 px-3 py-2 text-xs border border-gray-700 flex justify-between rounded z-[1000]'>
              <span className='text-red-400 font-mono font-bold tracking-widest'>● {location}</span>
              {route && <span className='text-blue-400 font-bold tracking-widest'>REROUTE ACTIVE</span>}
           </div>
        )}
      </div>
    </div>
  );
}
