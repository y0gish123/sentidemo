import React, { useRef, useState } from 'react';

export default function VideoPanel({ data, isRunning, onUpload }) {
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const crashDetected = data?.crash_detected;
  const confidence = data?.confidence ?? 0;

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    if (onUpload) onUpload(file);
  };

  const videoSrc = previewUrl || 'http://localhost:8000/api/stream-video';

  return (
    <div className='bg-[#161B22] border border-[#30363D] rounded-lg p-3 flex flex-col relative overflow-hidden'>
      {/* Header */}
      <div className='flex justify-between items-center mb-2'>
        <span className='text-sm font-semibold uppercase tracking-wider text-gray-300'>
          Live Camera Feed
        </span>
        <button
          onClick={() => fileInputRef.current?.click()}
          className='text-xs px-2 py-1 rounded border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 transition-colors'
        >
          📁 Upload Video
        </button>
        <input
          ref={fileInputRef}
          type='file'
          accept='video/mp4,video/*'
          className='hidden'
          onChange={handleFile}
        />
      </div>

      {/* Video Area */}
      <div className='flex-grow bg-black rounded relative flex items-center justify-center overflow-hidden' style={{ minHeight: '200px' }}>
        {isRunning && !crashDetected && (
          <div className='absolute inset-0 border border-blue-500/30 animate-pulse pointer-events-none z-10' />
        )}

        <video
          key={videoSrc}
          src={videoSrc}
          className='w-full h-full object-cover'
          style={{ opacity: isRunning ? 1 : 0.75 }}
          autoPlay
          muted
          loop
          playsInline
        />

        {/* Detection Overlay */}
        {crashDetected && (
          <div className='absolute inset-0 border-4 border-red-500 bg-red-500/10 flex flex-col items-center justify-center z-20'>
            <div className='bg-red-600 text-white font-bold px-5 py-2 text-lg tracking-widest rounded animate-bounce shadow-lg'>
              ⚠ CRASH DETECTED
            </div>
            <div className='mt-2 bg-black/80 px-3 py-1 text-xs text-red-300 font-mono'>
              FRAME: {data?.frame_number} | CONF: {(confidence * 100).toFixed(0)}%
            </div>
          </div>
        )}

        {/* Uncertain overlay */}
        {!crashDetected && data && confidence > 0 && confidence < 0.6 && (
          <div className='absolute bottom-0 left-0 right-0 bg-yellow-900/80 text-yellow-300 text-xs text-center py-1 font-mono'>
            ⚠ LOW CONFIDENCE — Requires Human Verification
          </div>
        )}
      </div>
    </div>
  );
}
