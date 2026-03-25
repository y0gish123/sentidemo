import React, { useEffect, useRef } from 'react';

const DEFAULT_CENTER = [12.9716, 77.5946]; // Bengaluru
const ACCIDENT_POS = [12.9750, 77.5996];
const HOSPITAL_POS = [12.9700, 77.5850];

export default function MapPanel({ detection, dispatch, isRunning }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const layersRef = useRef([]);

  useEffect(() => {
    if (mapInstance.current) return;
    import('leaflet').then(L => {
      const map = L.default.map(mapRef.current, {
        center: DEFAULT_CENTER,
        zoom: 14,
        zoomControl: false,
        attributionControl: true,
      });

      L.default.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© Leaflet | © CARTO',
        maxZoom: 19
      }).addTo(map);

      L.default.control.zoom({ position: 'bottomright' }).addTo(map);
      mapInstance.current = map;
    });
  }, []);

  useEffect(() => {
    if (!mapInstance.current) return;
    import('leaflet').then(L => {
      // Clear previous layers
      layersRef.current.forEach(l => {
        try { mapInstance.current.removeLayer(l); } catch {}
      });
      layersRef.current = [];

      if (!detection?.crash_detected) return;

      const L_ = L.default;

      // Accident marker (red)
      const accidentIcon = L_.divIcon({
        html: `<div style="background:red;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 8px red;animation:pulse 1s infinite"></div>`,
        className: '',
        iconAnchor: [8, 8]
      });
      const accidentMarker = L_.marker(ACCIDENT_POS, { icon: accidentIcon })
        .addTo(mapInstance.current)
        .bindPopup('🚨 Accident Location');
      layersRef.current.push(accidentMarker);

      // Hospital marker (blue)
      const hospIcon = L_.divIcon({
        html: `<div style="background:#3b82f6;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 0 6px #3b82f6"></div>`,
        className: '',
        iconAnchor: [7, 7]
      });
      const hospMarker = L_.marker(HOSPITAL_POS, { icon: hospIcon })
        .addTo(mapInstance.current)
        .bindPopup('🏥 Nearest Hospital');
      layersRef.current.push(hospMarker);

      // Ambulance route (red line)
      if (dispatch?.hospital_notified) {
        const route = L_.polyline([ACCIDENT_POS, HOSPITAL_POS], {
          color: '#ef4444', weight: 4, opacity: 0.9, dashArray: '8,6'
        }).addTo(mapInstance.current);
        route.bindPopup('🚑 Ambulance Route');
        layersRef.current.push(route);
      }

      // Traffic reroute (blue line)
      const rerouteEnd = [12.9780, 77.5920];
      const rerouteLine = L_.polyline([ACCIDENT_POS, rerouteEnd], {
        color: '#3b82f6', weight: 3, opacity: 0.7, dashArray: '6,4'
      }).addTo(mapInstance.current);
      rerouteLine.bindPopup('🔵 Traffic Reroute');
      layersRef.current.push(rerouteLine);

      mapInstance.current.setView(ACCIDENT_POS, 15, { animate: true });
    });
  }, [detection, dispatch]);

  return (
    <div className='bg-[#161B22] border border-[#30363D] rounded-lg p-3 flex flex-col'>
      <div className='flex justify-between items-center mb-2'>
        <span className='text-sm font-semibold uppercase tracking-wider text-gray-300'>
          Live Response Map
        </span>
        {detection?.crash_detected && (
          <span className='text-xs text-red-400 font-mono'>
            📍 {detection.gps_coordinates}
          </span>
        )}
      </div>
      <div className='flex-grow rounded overflow-hidden' style={{ minHeight: '200px' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: '200px' }} />
      </div>
      {detection?.crash_detected && (
        <div className='mt-2 flex gap-3 text-xs text-gray-400'>
          <span className='flex items-center gap-1'><span className='w-3 h-0.5 bg-red-500 inline-block'></span> Ambulance Route</span>
          <span className='flex items-center gap-1'><span className='w-3 h-0.5 bg-blue-500 inline-block'></span> Traffic Reroute</span>
        </div>
      )}
    </div>
  );
}
