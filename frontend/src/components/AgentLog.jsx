import React, { useEffect, useRef } from 'react';

export default function AgentLog({ events = [] }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  return (
    <div className='bg-[#161B22] border border-[#30363D] rounded-lg p-3 flex flex-col h-full'>
      <div className='text-sm font-semibold uppercase tracking-wider text-gray-300 mb-2 flex justify-between'>
        <span>Agent Activity Log</span>
        <span className='text-xs text-green-500 animate-pulse'>● LIVE</span>
      </div>
      <div 
        ref={scrollRef}
        className='flex-grow bg-black rounded p-3 overflow-y-auto font-mono text-sm text-green-400 h-full'
        style={{ scrollBehavior: 'smooth' }}
      >
        {events.map((evt, idx) => (
          <div key={idx} className='mb-1 flex'>
            <span className='text-gray-500 mr-2'>[{evt.time}]</span>
            <span className='break-all whitespace-pre-wrap'>{evt.text}</span>
          </div>
        ))}
        <div className='animate-pulse text-green-400 mt-1'>_</div>
      </div>
    </div>
  );
}
