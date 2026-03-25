# 🚨 SENTINEL — Agentic Emergency Response System

A multi-agent AI system that uses **YOLOv8** to detect vehicle collisions in dashcam footage and then orchestrates **3 Gemini AI Agents** via CrewAI to perform real-time emergency triage and dispatch.

---

## 🏗️ Architecture

```
Video Feed → YOLO (Collision Detection) → Detection Agent →
Triage Agent → Dispatch Agent → React Dashboard (WebSocket)
```

- **Backend:** FastAPI + CrewAI + YOLOv8
- **Frontend:** React + Vite + Tailwind CSS + Leaflet Map
- **LLM:** Google Gemini 2.5 Flash
- **Real-time:** WebSocket streaming (no HTTP polling)

---

## ⚙️ Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- A Google AI Studio API Key with access to Gemini 2.5 Flash → https://aistudio.google.com

---

### 1. Clone / Copy the project

Make sure you have the full `SENTINEL` folder.

---

### 2. Create Environment File

Create a file called `.env` in the **root** of the project:

```
GEMINI_API_KEY=your_gemini_api_key_here
YOLO_MODEL_PATH=yolov8n.pt
```

---

### 3. Set up Python backend

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate it
# Windows:
.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

> The first run will automatically download `yolov8n.pt` (~6MB).

---

### 4. Add a crash video

Create a folder called `demo_videos` inside the project root and add an MP4 video of a car crash named `crash_sample.mp4`.

You can use [yt-dlp](https://github.com/yt-dlp/yt-dlp) to download one:

```bash
pip install yt-dlp
yt-dlp -f "best[ext=mp4]" "ytsearch1:car crash dashcam short" -o "demo_videos/crash_sample.mp4"
```

---

### 5. Set up React frontend

```bash
cd frontend
npm install
```

---

## 🚀 Running the App

You need **two terminals** open simultaneously.

**Terminal 1 — Backend:**
```bash
cd backend
# Make sure virtual environment is active
python -m uvicorn main:app --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Then open your browser at: **http://localhost:5173**

---

## 🎯 How to Use

1. Open the dashboard at `http://localhost:5173`
2. Click the red **SIMULATE CRASH** button
3. Watch the Agent Activity Log for real-time streaming updates:
   - `[DETECTION]` — YOLO scans the video for vehicle collisions
   - `[TRIAGE]` — Gemini assesses injury severity (1–10 score)
   - `[DISPATCH]` — Coordinates emergency services and hospital routing
4. The Live Response Map will update with the incident location
5. The Dispatch Alert panel will show EMS ETA and services dispatched

---

## 📁 Project Structure

```
SENTINEL/
├── .env                    # API keys (DO NOT SHARE)
├── backend/
│   ├── main.py             # FastAPI server + WebSocket streaming
│   ├── crew.py             # CrewAI orchestration pipeline
│   ├── models.py           # Pydantic response models
│   ├── database.py         # SQLite incident logging
│   ├── requirements.txt    # Python dependencies
│   ├── agents/
│   │   ├── detection_agent.py   # YOLO crash detection agent
│   │   ├── triage_agent.py      # Medical severity triage agent
│   │   ├── dispatch_agent.py    # Emergency dispatch agent
│   │   └── tools.py             # YOLO tool wrapper for CrewAI
│   └── utils/
│       └── yolo_runner.py       # YOLOv8 + IoU collision math
├── demo_videos/
│   └── crash_sample.mp4    # Your crash video (provide your own)
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── components/
    │   │   ├── VideoPanel.jsx      # Live camera feed
    │   │   ├── AgentLog.jsx        # Real-time agent activity
    │   │   ├── AlertPanel.jsx      # Dispatch status
    │   │   ├── MapPanel.jsx        # Leaflet incident map
    │   │   ├── IncidentReport.jsx  # Full incident report
    │   │   └── SimulateButton.jsx
    │   └── hooks/
    │       └── usePipelineSocket.js  # WebSocket hook
    └── package.json
```

---

## 📦 Backend Requirements

```
fastapi
uvicorn
crewai
google-genai
ultralytics
opencv-python
python-dotenv
litellm
```

---

## ⚠️ Notes

- The free tier Gemini API key has a daily limit of ~20 requests per day. If you hit it, wait until midnight for the quota to reset.
- The pipeline runs the 3 AI agents **sequentially** and typically takes 15–40 seconds depending on your internet speed.
- All results stream live to the dashboard via WebSocket — no page refresh needed.
