import React from 'react';

export default function VideoPanel({ data, isRunning }) {
  const crashDetected = data?.crash_detected;

  return (
    <div className='bg-[#161B22] border border-[#30363D] rounded-lg p-3 flex flex-col relative overflow-hidden'>
      <div className='text-sm font-semibold uppercase tracking-wider text-gray-300 mb-2'>
        Live Camera Feed
      </div>
      <div className='flex-grow bg-black rounded relative flex items-center justify-center overflow-hidden'>
        {isRunning && !crashDetected ? (
           <div className='absolute inset-0 bg-blue-500/10 animate-pulse'></div>
        ) : null}
        
        <video 
          src="http://localhost:8000/api/stream-video" 
          className="w-full h-full object-cover opacity-80"
          autoPlay 
          muted 
          loop 
          playsInline
        />

        {crashDetected && (
          <div className='absolute inset-0 border-4 border-red-500 bg-red-500/20 flex flex-col items-center justify-center z-10'>
            <div className='bg-red-500 text-white font-bold px-4 py-1 text-xl tracking-widest rounded-sm animate-bounce'>
              CRASH DETECTED
            </div>
            <div className='mt-2 bg-black/80 px-2 py-1 text-xs text-red-400 font-mono'>
              FRAME: {data?.frame_number} | CONF: 92%
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
