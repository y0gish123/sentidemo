import VideoPanel from './components/VideoPanel'
import AgentLog from './components/AgentLog'
import AlertPanel from './components/AlertPanel'
import MapPanel from './components/MapPanel'
import IncidentReport from './components/IncidentReport'
import { usePipelineSocket } from './hooks/usePipelineSocket'

export default function App() {
  const { pipelineData, triggerPipeline, uploadAndAnalyze, isRunning } = usePipelineSocket()

  return (
    <div className='min-h-screen bg-[#0D1117] text-white font-sans flex flex-col' style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className='flex justify-between items-center px-5 py-3 border-b border-[#30363D] bg-[#0D1117] sticky top-0 z-50'>
        <div>
          <h1 className='text-xl font-bold tracking-widest text-red-500'>
            SENTINEL AI
          </h1>
          <p className='text-xs text-gray-500 uppercase tracking-widest mt-0.5'>
            Live Autonomous Traffic Monitoring System
          </p>
        </div>

        <div className='flex items-center gap-3'>
          {pipelineData.status && (
            <span className={`text-xs font-mono px-2 py-1 rounded border ${
              pipelineData.status === 'NO_ACCIDENT' ? 'border-green-700 text-green-400' :
              pipelineData.status === 'CRITICAL' ? 'border-red-700 text-red-400 animate-pulse' :
              pipelineData.status === 'UNCERTAIN' ? 'border-yellow-700 text-yellow-400' :
              'border-orange-700 text-orange-400'
            }`}>
              STATUS: {pipelineData.status}
            </span>
          )}

          <button
            onClick={() => triggerPipeline('/api/start')}
            disabled={isRunning}
            className={`px-5 py-2 rounded font-bold uppercase tracking-wider text-sm transition-all
              ${isRunning
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] border border-red-500/50 hover:shadow-[0_0_25px_rgba(220,38,38,0.8)]'
              }`}
          >
            {isRunning ? (
              <span className='flex items-center gap-2'>
                <span className='w-2 h-2 bg-red-400 rounded-full animate-pulse'></span>
                PIPELINE RUNNING...
              </span>
            ) : '⚡ START MONITORING'}
          </button>
        </div>
      </div>

      {/* 4-panel grid */}
      <div className='flex-grow grid grid-cols-2 grid-rows-2 gap-3 p-3 overflow-hidden'>
        <VideoPanel
          data={pipelineData.detection}
          isRunning={isRunning}
          onUpload={uploadAndAnalyze}
        />
        <AgentLog events={pipelineData.agentEvents} />
        <AlertPanel
          data={pipelineData.dispatch}
          triage={pipelineData.triage}
          status={pipelineData.status}
        />
        <MapPanel
          detection={pipelineData.detection}
          dispatch={pipelineData.dispatch}
          isRunning={isRunning}
        />
      </div>

      {/* Incident Report Strip */}
      <div className='px-3 pb-3'>
        <IncidentReport data={pipelineData} />
      </div>
    </div>
  )
}
