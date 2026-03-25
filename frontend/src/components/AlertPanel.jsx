import React from 'react';

export default function AlertPanel({ data, triage }) {
  const isCritical = triage?.severity_score >= 7;

  return (
    <div className={`bg-[#161B22] border rounded-lg p-4 flex flex-col relative transition-colors duration-500 h-full ${isCritical ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-[#30363D]'}`}>
      <div className='text-sm font-semibold uppercase tracking-wider text-gray-300 mb-4'>
        Dispatch Alert Status
      </div>

      {!data ? (
        <div className='flex items-center justify-center flex-grow text-gray-500 italic'>
          Awaiting triage data...
        </div>
      ) : (
        <div className='space-y-4 animate-pulse flex flex-col justify-around h-full'>
           
           <div className='flex items-center justify-between p-3 bg-black/40 rounded border border-red-900/50'>
              <span className='text-gray-300'>Services Dispatched</span>
              <div className='flex gap-2 flex-wrap justify-end'>
                 {data.services_dispatched?.map(s => (
                    <span key={s} className='bg-red-900/50 text-red-400 text-xs px-2 py-1 uppercase tracking-wider rounded'>{s}</span>
                 ))}
              </div>
           </div>

           <div className='flex items-center justify-between p-3 bg-black/40 rounded border border-blue-900/50'>
              <span className='text-gray-300'>EMS ETA</span>
              <span className='text-2xl font-bold text-blue-400'>{data.ems_eta_minutes} min</span>
           </div>

           <div className='p-3 bg-black/40 rounded border border-orange-900/50'>
              <div className='text-xs text-orange-400 mb-1 uppercase tracking-wider'>Hospital Network</div>
              <div className='text-sm text-gray-200'>{data.hospital_message}</div>
           </div>

        </div>
      )}
    </div>
  );
}
