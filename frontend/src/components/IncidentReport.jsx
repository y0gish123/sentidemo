import React from 'react';

export default function IncidentReport({ data }) {
  const complete = data?.complete;
  const t = data?.triage;
  const d = data?.detection;
  const disp = data?.dispatch;

  if (!complete) return null;

  const severityColor = 
    t?.severity_score >= 7 ? 'bg-red-900 text-red-300 border-red-500' :
    t?.severity_score >= 4 ? 'bg-yellow-900 text-yellow-300 border-yellow-500' :
    'bg-green-900 text-green-300 border-green-500';

  return (
    <div className='bg-[#161B22] border border-[#30363D] rounded-lg p-4 animate-fade-in transition-all'>
      <div className='flex items-center justify-between'>
        <div className='flex gap-6 items-center'>
          <div>
            <div className='text-xs text-gray-500 uppercase font-bold tracking-wider mb-1'>Incident ID</div>
            <div className='font-mono text-gray-200'>{disp?.incident_id || 'N/A'}</div>
          </div>
          <div>
            <div className='text-xs text-gray-500 uppercase font-bold tracking-wider mb-1'>Timestamp</div>
            <div className='text-gray-200'>{d?.timestamp ? new Date(d.timestamp).toLocaleTimeString() : 'N/A'}</div>
          </div>
          <div>
            <div className={`px-4 py-1 rounded border capitalize font-bold tracking-widest text-sm ${severityColor}`}>
              {t?.severity_label || 'UNKNOWN'}
            </div>
          </div>
        </div>
        
        <div className='text-right'>
           <div className='text-xs text-gray-500 uppercase font-bold tracking-wider mb-1'>Coordinating Agents</div>
           <div className='flex gap-2 justify-end'>
              <span className='px-2 py-0.5 bg-[#0D1117] border border-[#30363D] text-xs text-gray-300 rounded'>Detection [YOLOv8]</span>
              <span className='px-2 py-0.5 bg-[#0D1117] border border-[#30363D] text-xs text-gray-300 rounded'>Triage [Claude]</span>
              <span className='px-2 py-0.5 bg-[#0D1117] border border-[#30363D] text-xs text-gray-300 rounded'>Dispatch</span>
           </div>
        </div>
      </div>
    </div>
  );
}
