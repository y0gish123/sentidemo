import { useState, useEffect, useCallback, useRef } from 'react';

const INITIAL_STATE = {
  agentEvents: [],
  detection: null,
  triage: null,
  dispatch: null,
  status: null,
  complete: false
};

export function usePipelineSocket() {
  const [pipelineData, setPipelineData] = useState(INITIAL_STATE);
  const [isRunning, setIsRunning] = useState(false);
  const ws = useRef(null);

  useEffect(() => {
    const connectWS = () => {
      ws.current = new WebSocket('ws://localhost:8000/ws/pipeline');

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'log' || data.type === 'event') {
            setPipelineData(prev => ({
              ...prev,
              agentEvents: [...prev.agentEvents, {
                time: new Date().toLocaleTimeString(),
                text: data.message
              }]
            }));

          } else if (data.type === 'result') {
            const r = data.data;
            setPipelineData(prev => ({
              ...prev,
              status: r.status,
              detection: {
                crash_detected: r.crash_detected,
                confidence: r.confidence,
                vehicles_detected: r.vehicles_detected,
                frame_number: r.frame_number,
                gps_coordinates: r.gps_coordinates,
                timestamp: r.timestamp
              },
              triage: r.crash_detected ? {
                severity_score: r.severity_score,
                severity_label: r.severity_label,
                triage_reasoning: r.triage_reasoning
              } : null,
              dispatch: r.crash_detected ? {
                services_dispatched: r.services_dispatched,
                ems_eta_minutes: r.ems_eta_minutes,
                alert_message: r.alert_message,
                hospital_notified: r.hospital_notified,
                hospital_message: r.hospital_message,
                reroute_suggestion: r.reroute_suggestion,
                incident_id: r.incident_id
              } : null,
              complete: true,
              agentEvents: [
                ...prev.agentEvents,
                {
                  time: new Date().toLocaleTimeString(),
                  text: r.status === 'NO_ACCIDENT'
                    ? '✅ Scan complete — No accident detected.'
                    : `✅ Pipeline complete — Incident: ${r.incident_id}`
                }
              ]
            }));
            setIsRunning(false);

          } else if (data.type === 'error') {
            setPipelineData(prev => ({
              ...prev,
              agentEvents: [...prev.agentEvents, {
                time: new Date().toLocaleTimeString(),
                text: `❌ ${data.message}`
              }]
            }));
            setIsRunning(false);
          }
        } catch {
          setPipelineData(prev => ({
            ...prev,
            agentEvents: [...prev.agentEvents, {
              time: new Date().toLocaleTimeString(),
              text: event.data
            }]
          }));
        }
      };

      ws.current.onclose = () => setTimeout(connectWS, 3000);
    };

    connectWS();
    return () => { if (ws.current) ws.current.close(); };
  }, []);

  const triggerPipeline = useCallback(async (endpoint = '/api/start', options = {}) => {
    setIsRunning(true);
    setPipelineData({
      ...INITIAL_STATE,
      agentEvents: [{ time: new Date().toLocaleTimeString(), text: '🚀 Starting SENTINEL Pipeline...' }]
    });
    try {
      await fetch(`http://localhost:8000${endpoint}`, { method: 'POST', ...options });
    } catch {
      setPipelineData(prev => ({
        ...prev,
        agentEvents: [...prev.agentEvents, {
          time: new Date().toLocaleTimeString(),
          text: '❌ Cannot reach backend. Is the server running?'
        }]
      }));
      setIsRunning(false);
    }
  }, []);

  const uploadAndAnalyze = useCallback(async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    await triggerPipeline('/api/upload-video', { body: formData });
  }, [triggerPipeline]);

  return { pipelineData, triggerPipeline, uploadAndAnalyze, isRunning };
}
