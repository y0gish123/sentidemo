import { useState, useEffect, useCallback, useRef } from 'react';

export function usePipelineSocket() {
  const [pipelineData, setPipelineData] = useState({
    agentEvents: [],
    detection: null,
    triage: null,
    dispatch: null,
    complete: false
  });
  const [isRunning, setIsRunning] = useState(false);
  const ws = useRef(null);

  useEffect(() => {
    const connectWS = () => {
      ws.current = new WebSocket('ws://localhost:8000/ws/pipeline');

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'log' || data.type === 'event') {
            // Append live agent log messages
            setPipelineData(prev => ({
              ...prev,
              agentEvents: [...prev.agentEvents, { time: new Date().toLocaleTimeString(), text: data.message }]
            }));

          } else if (data.type === 'result') {
            // Pipeline complete — unpack all structured fields
            const result = data.data;
            setPipelineData(prev => ({
              ...prev,
              detection: {
                crash_detected: result.crash_detected,
                frame_number: result.frame_number,
                gps_coordinates: result.gps_coordinates,
                timestamp: result.timestamp
              },
              triage: {
                severity_score: result.severity_score,
                severity_label: result.severity_label,
                triage_reasoning: result.triage_reasoning
              },
              dispatch: {
                services_dispatched: result.services_dispatched,
                ems_eta_minutes: result.ems_eta_minutes,
                alert_message: result.alert_message,
                hospital_notified: result.hospital_notified,
                hospital_message: result.hospital_message,
                reroute_suggestion: result.reroute_suggestion,
                incident_id: result.incident_id
              },
              complete: true,
              agentEvents: [
                ...prev.agentEvents,
                { time: new Date().toLocaleTimeString(), text: '✅ SENTINEL Pipeline Complete.' }
              ]
            }));
            setIsRunning(false);

          } else if (data.type === 'error') {
            setPipelineData(prev => ({
              ...prev,
              agentEvents: [...prev.agentEvents, { time: new Date().toLocaleTimeString(), text: `❌ ${data.message}` }]
            }));
            setIsRunning(false);
          }
        } catch (e) {
          // Raw text fallback
          setPipelineData(prev => ({
            ...prev,
            agentEvents: [...prev.agentEvents, { time: new Date().toLocaleTimeString(), text: event.data }]
          }));
        }
      };

      ws.current.onclose = () => {
        setTimeout(connectWS, 3000);
      };
    };

    connectWS();

    return () => {
      if (ws.current) ws.current.close();
    };
  }, []);

  const triggerPipeline = useCallback(async () => {
    setIsRunning(true);
    setPipelineData({
      agentEvents: [{ time: new Date().toLocaleTimeString(), text: '🚀 Starting SENTINEL Pipeline...' }],
      detection: null,
      triage: null,
      dispatch: null,
      complete: false
    });

    try {
      // Just fire and forget — results come back via WebSocket
      await fetch('http://localhost:8000/api/simulate', { method: 'POST' });
    } catch (e) {
      setPipelineData(prev => ({
        ...prev,
        agentEvents: [...prev.agentEvents, { time: new Date().toLocaleTimeString(), text: '❌ Error: Cannot reach backend.' }]
      }));
      setIsRunning(false);
    }
  }, []);

  return { pipelineData, triggerPipeline, isRunning };
}
