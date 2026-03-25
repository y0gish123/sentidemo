import React from 'react';

export default function SimulateButton({ onClick, isRunning }) {
  return (
    <button
      onClick={onClick}
      disabled={isRunning}
      className={`px-6 py-3 rounded-md font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center min-w-[200px]
        ${isRunning 
          ? 'bg-gray-800 text-gray-400 cursor-not-allowed border border-gray-700' 
          : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] border border-red-400/50 hover:shadow-[0_0_25px_rgba(220,38,38,0.8)]'
        }
      `}
    >
      {isRunning ? (
        <>
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-3"></span>
          PIPELINE RUNNING...
        </>
      ) : (
        'SIMULATE CRASH'
      )}
    </button>
  );
}
