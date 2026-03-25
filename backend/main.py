from fastapi import FastAPI, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.websockets import WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from database import save_incident, get_incidents
from models import IncidentResponse
import json
import asyncio
import os

app = FastAPI(title='SENTINEL AI')

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


async def _run_and_broadcast(video_path: str):
    """Run pipeline in background thread, broadcast results."""
    from pipeline import run_pipeline
    try:
        result = await run_pipeline(video_path, manager=manager)
        # Persist to database (non-critical)
        try:
            save_incident(result)
        except Exception as e:
            print(f"[DB] Non-critical save error: {e}")
    except Exception as e:
        await manager.broadcast({'type': 'error', 'message': str(e)})


@app.post('/api/start')
async def start_monitoring(background_tasks: BackgroundTasks):
    """Trigger pipeline with demo video. Results stream via WebSocket."""
    video_path = 'demo_videos/crash_sample.mp4'
    if not os.path.exists(video_path):
        return {'status': 'error', 'message': f'Demo video not found at {video_path}'}
    background_tasks.add_task(_run_and_broadcast, video_path)
    return {'status': 'started', 'message': 'Pipeline started. Listen on /ws/pipeline.'}


@app.post('/api/upload-video')
async def upload_video(file: UploadFile = File(...), background_tasks: BackgroundTasks = None):
    """Accept any uploaded MP4 and run detection pipeline on it."""
    os.makedirs('uploads', exist_ok=True)
    # Sanitize filename
    safe_name = os.path.basename(file.filename or 'uploaded.mp4')
    path = f'uploads/{safe_name}'
    contents = await file.read()
    with open(path, 'wb') as f:
        f.write(contents)
    if background_tasks:
        background_tasks.add_task(_run_and_broadcast, path)
    return {'status': 'started', 'message': f'Processing {safe_name}. Listen on /ws/pipeline.'}


@app.get('/api/incidents')
async def fetch_incidents():
    return get_incidents()


@app.get('/api/stream-video')
async def stream_video():
    """Serve demo video with proper Content-Type for browser playback."""
    video_path = 'demo_videos/crash_sample.mp4'
    if not os.path.exists(video_path):
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail='Demo video not found. Add crash_sample.mp4 to demo_videos/')
    return FileResponse(video_path, media_type='video/mp4', headers={"Accept-Ranges": "bytes"})


@app.get('/api/health')
async def health_check():
    return {'status': 'ok', 'model': 'gemini-2.5-flash', 'database': 'mongodb'}


@app.websocket('/ws/pipeline')
async def pipeline_ws(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
