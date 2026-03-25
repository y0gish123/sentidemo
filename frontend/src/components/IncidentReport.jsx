import React from 'react';

export default function IncidentReport({ data }) {
  const { detection, triage, dispatch, status } = data || {};

  if (!dispatch && status !== 'NO_ACCIDENT') {
    return (
      <div className='bg-[#161B22] border border-[#30363D] rounded-lg p-3'>
        <div className='text-xs font-semibold uppercase tracking-wider text-gray-500'>
          Incident Report — Awaiting Data...
        </div>
      </div>
    );
  }

  const isCritical = triage?.severity_score >= 7;
  const labelColor = status === 'NO_ACCIDENT' ? 'text-green-400' :
                     isCritical ? 'text-red-400' :
                     status === 'UNCERTAIN' ? 'text-yellow-400' : 'text-orange-400';

  return (
    <div className='bg-[#161B22] border border-[#30363D] rounded-lg p-3'>
      <div className='text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2'>
        Incident Report
        {dispatch?.incident_id && (
          <span className='ml-3 text-gray-600 font-mono normal-case'>#{dispatch.incident_id}</span>
        )}
      </div>
      <div className='flex flex-wrap gap-x-6 gap-y-1 text-xs'>
        <div><span className='text-gray-500'>Status: </span><span className={`font-bold ${labelColor}`}>{status || '—'}</span></div>
        <div><span className='text-gray-500'>Time: </span><span className='text-gray-300'>{detection?.timestamp ? new Date(detection.timestamp).toLocaleTimeString() : '—'}</span></div>
        <div><span className='text-gray-500'>GPS: </span><span className='text-gray-300 font-mono'>{detection?.gps_coordinates || '—'}</span></div>
        <div><span className='text-gray-500'>Crash: </span><span className={detection?.crash_detected ? 'text-red-400 font-bold' : 'text-green-400'}>{detection?.crash_detected ? 'YES' : 'NO'}</span></div>
        <div><span className='text-gray-500'>Confidence: </span><span className='text-gray-300'>{detection?.confidence != null ? `${(detection.confidence * 100).toFixed(0)}%` : '—'}</span></div>
        {triage && <>
          <div><span className='text-gray-500'>Severity: </span><span className={`font-bold ${labelColor}`}>{triage.severity_label} ({triage.severity_score}/10)</span></div>
          <div className='w-full'><span className='text-gray-500'>Reasoning: </span><span className='text-gray-400'>{triage.triage_reasoning}</span></div>
        </>}
        {dispatch && <>
          <div><span className='text-gray-500'>Services: </span><span className='text-gray-300'>{dispatch.services_dispatched?.join(', ') || '—'}</span></div>
          <div><span className='text-gray-500'>EMS ETA: </span><span className='text-gray-300'>{dispatch.ems_eta_minutes} min</span></div>
          <div><span className='text-gray-500'>Hospital: </span><span className={dispatch.hospital_notified ? 'text-blue-400' : 'text-gray-500'}>{dispatch.hospital_notified ? 'Notified' : 'Not Required'}</span></div>
        </>}
      </div>
    </div>
  );
}
