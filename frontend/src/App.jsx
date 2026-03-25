import VideoPanel from './components/VideoPanel'
import AgentLog from './components/AgentLog'
import AlertPanel from './components/AlertPanel'
import MapPanel from './components/MapPanel'
import IncidentReport from './components/IncidentReport'
import SimulateButton from './components/SimulateButton'
import { usePipelineSocket } from './hooks/usePipelineSocket'

export default function App() {
  const { pipelineData, triggerPipeline, isRunning } = usePipelineSocket()
  
  return (
    <div className='min-h-screen bg-[#0D1117] text-white p-4 font-sans flex flex-col'>
      {/* Header */}
      <div className='flex justify-between items-center mb-4 border-b border-[#30363D] pb-3'>
        <h1 className='text-2xl font-bold text-red-500'>
          SENTINEL
          <span className='text-sm text-gray-400 ml-3 font-normal uppercase tracking-widest'>
            Agentic Emergency Response System
          </span>
        </h1>
        <SimulateButton onClick={triggerPipeline} isRunning={isRunning} />
      </div>

      {/* 4-panel grid */}
      <div className='grid grid-cols-2 grid-rows-2 gap-3 h-[75vh] mb-3 flex-grow'>
        <VideoPanel data={pipelineData?.detection} isRunning={isRunning} />
        <AgentLog events={pipelineData?.agentEvents} />
        <AlertPanel data={pipelineData?.dispatch} triage={pipelineData?.triage} />
        <MapPanel location={pipelineData?.detection?.gps_coordinates} route={pipelineData?.dispatch?.reroute_suggestion} isRunning={isRunning} />
      </div>

      {/* Incident report strip */}
      <IncidentReport data={pipelineData} />
    </div>
  )
}
