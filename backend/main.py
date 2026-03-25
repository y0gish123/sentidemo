from fastapi import FastAPI, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.websockets import WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from database import save_incident, get_incidents
from models import IncidentResponse
import json
import asyncio
import os

app = FastAPI(title='SENTINEL')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*']
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

async def run_pipeline_and_broadcast(video_path: str):
    """Run the full CrewAI pipeline in background and stream results to all WS clients."""
    from crew import run_sentinel_pipeline

    await manager.broadcast({'type': 'log', 'message': f'[DETECTION] Initializing YOLO model and scanning: {video_path}'})

    try:
        # Run blocking pipeline in thread so we don't block the event loop
        result = await asyncio.to_thread(run_sentinel_pipeline, video_path, manager=manager)

        # Broadcast each agent's result individually
        await manager.broadcast({'type': 'log', 'message': '[DETECTION] YOLO scan complete. Crash analysis done.'})
        await manager.broadcast({'type': 'log', 'message': f'[TRIAGE] Severity: {result.get("severity_label","?")} | Score: {result.get("severity_score","?")}'})
        await manager.broadcast({'type': 'log', 'message': f'[DISPATCH] Incident ID: {result.get("incident_id","?")} | EMS ETA: {result.get("ems_eta_minutes","?")} min'})
        await manager.broadcast({'type': 'log', 'message': f'[DISPATCH] Services: {", ".join(result.get("services_dispatched",[]))}'})

        # Broadcast the final complete structured result
        await manager.broadcast({'type': 'result', 'data': result})

        # Persist
        try:
            save_incident(result)
        except Exception as db_err:
            print(f"DB save failed (non-critical): {db_err}")

    except Exception as e:
        import traceback
        traceback.print_exc()
        await manager.broadcast({'type': 'error', 'message': f'Pipeline error: {str(e)}'})


@app.post('/api/simulate')
async def simulate_crash(background_tasks: BackgroundTasks):
    """Trigger the pipeline. Results stream via WebSocket."""
    background_tasks.add_task(run_pipeline_and_broadcast, 'demo_videos/crash_sample.mp4')
    return {'status': 'Pipeline started. Listen on WebSocket /ws/pipeline for events.'}


@app.post('/api/upload-video')
async def upload_video(file: UploadFile = File(...), background_tasks: BackgroundTasks = None):
    import os
    os.makedirs('uploads', exist_ok=True)
    path = f'uploads/{file.filename}'
    with open(path, 'wb') as f:
        f.write(await file.read())
    background_tasks.add_task(run_pipeline_and_broadcast, path)
    return {'status': f'Processing {file.filename}. Listen on WebSocket.'}


@app.get('/api/incidents')
async def fetch_incidents():
    return get_incidents()


@app.get('/api/stream-video')
async def stream_video():
    """Serve the crash demo video with proper Content-Type for browser playback."""
    video_path = 'demo_videos/crash_sample.mp4'
    if not os.path.exists(video_path):
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Video not found")
    return FileResponse(
        video_path,
        media_type='video/mp4',
        headers={"Accept-Ranges": "bytes"}
    )


@app.get('/api/health')
async def health_check():
    return {"status": "ok"}


@app.websocket('/ws/pipeline')
async def pipeline_ws(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
