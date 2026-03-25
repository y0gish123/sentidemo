import React, { useEffect, useRef } from 'react';

export default function AgentLog({ events = [] }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  return (
    <div className='bg-[#161B22] border border-[#30363D] rounded-lg p-3 flex flex-col'>
      <div className='flex justify-between items-center mb-2'>
        <span className='text-sm font-semibold uppercase tracking-wider text-gray-300'>
          Agent Activity Log
        </span>
        <span className='flex items-center gap-1 text-xs text-green-400'>
          <span className='w-2 h-2 rounded-full bg-green-400 animate-pulse'></span>
          LIVE
        </span>
      </div>
      <div className='flex-grow bg-black rounded p-3 font-mono text-xs overflow-y-auto' style={{ minHeight: '160px', maxHeight: '100%' }}>
        {events.length === 0 && (
          <span className='text-gray-600'>Awaiting pipeline trigger...</span>
        )}
        {events.map((ev, i) => {
          const isError = ev.text.includes('❌');
          const isSuccess = ev.text.includes('✅');
          const isDetection = ev.text.includes('[DETECTION]');
          const isTriage = ev.text.includes('[TRIAGE]');
          const isDispatch = ev.text.includes('[DISPATCH]');
          const isSentinel = ev.text.includes('[SENTINEL]');

          let color = 'text-green-400';
          if (isError) color = 'text-red-400';
          else if (isSuccess) color = 'text-emerald-400';
          else if (isTriage) color = 'text-yellow-400';
          else if (isDispatch) color = 'text-blue-400';
          else if (isSentinel) color = 'text-purple-400';

          return (
            <div key={i} className={`mb-1 leading-relaxed ${color}`}>
              <span className='text-gray-500 mr-2'>[{ev.time}]</span>
              {ev.text}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
