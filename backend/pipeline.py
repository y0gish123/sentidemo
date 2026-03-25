"""
SENTINEL AI — Standalone Pipeline
No CrewAI dependency. Runs sequentially, streams logs via WebSocket.
Handles: crash detection → triage (LLM or rule-based) → dispatch.
NEVER raises — always returns a valid dict.
"""
import os
import asyncio
import random
import re
from datetime import datetime
from utils.yolo_runner import run_yolo_detection

# GPS coordinates for Bengaluru demo
DEMO_GPS = "12.9716° N, 77.5946° E"


# ─── Helpers ──────────────────────────────────────────────────────────────────

async def _log(manager, msg: str):
    """Broadcast a log line to all WebSocket clients."""
    if manager:
        await manager.broadcast({'type': 'log', 'message': msg})


def _rule_based_triage(detection: dict) -> dict:
    """Fallback when Gemini is unavailable or over quota."""
    vehicles = detection.get('vehicles_detected', 0)
    confidence = detection.get('confidence', 0)

    if vehicles >= 2 and confidence >= 0.7:
        return {
            'severity_score': 8,
            'severity_label': 'CRITICAL',
            'triage_reasoning': (
                f'Rule-based assessment: {vehicles} vehicles detected with '
                f'{confidence:.0%} confidence. High-speed collision probable. '
                'Immediate medical response required.'
            )
        }
    else:
        return {
            'severity_score': 4,
            'severity_label': 'MODERATE',
            'triage_reasoning': (
                f'Rule-based assessment: {vehicles} vehicles detected with '
                f'{confidence:.0%} confidence. Minor to moderate impact likely. '
                'Police response recommended.'
            )
        }


def _llm_triage(detection: dict) -> dict:
    """Try to call Gemini for triage. Returns None on any failure."""
    try:
        from google import genai
        api_key = os.environ.get("GEMINI_API_KEY", "")
        if not api_key:
            return None

        client = genai.Client(api_key=api_key)
        prompt = f"""You are an emergency triage specialist.
A traffic accident was detected with these metrics:
- Vehicles involved: {detection.get('vehicles_detected', '?')}
- Crash confidence: {detection.get('confidence', 0):.0%}
- Video frame: {detection.get('frame_number', '?')}
- Location: {DEMO_GPS}

Respond with ONLY this JSON (no markdown):
{{
  "severity_score": <1-10 integer>,
  "severity_label": "<MINOR|MODERATE|CRITICAL>",
  "triage_reasoning": "<2-3 sentence reasoning>"
}}"""

        resp = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        text = resp.text.strip()
        # Strip markdown code fences if present
        text = re.sub(r'^```[a-z]*\n?', '', text)
        text = re.sub(r'\n?```$', '', text)
        import json
        return json.loads(text)
    except Exception as e:
        print(f"[SENTINEL] LLM triage failed: {e}. Using rule-based fallback.")
        return None


def _dispatch(severity_score: int, incident_id: str, gps: str) -> dict:
    """Determine services and generate alert based on severity score."""
    if severity_score >= 7:
        services = ['Ambulance', 'Police', 'Fire Department']
        hospital_notified = True
        hospital_message = (
            f'Trauma alert sent to nearest hospital. GPS: {gps}. '
            'Prepare for incoming critical patients.'
        )
        reroute = 'Traffic rerouted via alternate corridor. Expect 15-min delay.'
    else:
        services = ['Police']
        hospital_notified = False
        hospital_message = 'Hospital not notified — moderate incident.'
        reroute = 'Minor congestion expected. Drive cautiously.'

    return {
        'services_dispatched': services,
        'ems_eta_minutes': 4,
        'hospital_notified': hospital_notified,
        'hospital_message': hospital_message,
        'reroute_suggestion': reroute,
        'incident_id': incident_id,
        'alert_message': (
            f'SENTINEL ALERT [{incident_id}] — '
            f'{", ".join(services)} dispatched to {gps}. ETA: 4 minutes.'
        )
    }


# ─── Main Pipeline ─────────────────────────────────────────────────────────────

async def run_pipeline(video_path: str, manager=None) -> dict:
    """
    Full 3-stage pipeline. Returns a valid dict always.
    Streams structured logs over the WebSocket manager.
    """
    timestamp = datetime.now().isoformat()
    incident_id = f'SENTINEL-{datetime.now().strftime("%Y%m%d")}-{random.randint(100,999)}'

    try:
        # ── STAGE 1: Detection ──────────────────────────────────────────────
        await _log(manager, '[DETECTION] Initializing YOLO model...')
        await asyncio.sleep(0.3)

        detection = await asyncio.to_thread(run_yolo_detection, video_path)

        crash = detection.get('crash_detected', False)
        conf = detection.get('confidence', 0.0)
        vehicles = detection.get('vehicles_detected', 0)

        await _log(manager, f'[DETECTION] Scan complete — crash_detected={crash}, confidence={conf:.0%}, vehicles={vehicles}')
        await asyncio.sleep(0.3)

        # ── NO CRASH BRANCH ────────────────────────────────────────────────
        if not crash:
            await _log(manager, '[DETECTION] No collision detected. Pipeline complete.')
            result = {
                'status': 'NO_ACCIDENT',
                'message': 'No accident detected in the provided video.',
                'crash_detected': False,
                'confidence': conf,
                'vehicles_detected': vehicles,
                'frame_number': detection.get('frame_number', 0),
                'incident_id': incident_id,
                'timestamp': timestamp,
                'gps_coordinates': DEMO_GPS,
                'severity_score': 0,
                'severity_label': 'NONE',
                'triage_reasoning': 'No accident detected — triage not required.',
                'services_dispatched': [],
                'ems_eta_minutes': 0,
                'hospital_notified': False,
                'hospital_message': '',
                'reroute_suggestion': '',
                'alert_message': 'No incident to report.'
            }
            if manager:
                await manager.broadcast({'type': 'result', 'data': result})
            return result

        # ── UNCERTAIN BRANCH ───────────────────────────────────────────────
        if conf < 0.6:
            await _log(manager, f'[DETECTION] Low confidence ({conf:.0%}). Flagging as UNCERTAIN — requires human verification.')

        # ── STAGE 2: Triage ────────────────────────────────────────────────
        await _log(manager, '[TRIAGE] Assessing injury severity via Gemini AI...')
        await asyncio.sleep(0.3)

        triage = _llm_triage(detection)
        if triage is None:
            await _log(manager, '[TRIAGE] LLM unavailable — applying rule-based triage fallback...')
            triage = _rule_based_triage(detection)

        score = triage.get('severity_score', 4)
        label = triage.get('severity_label', 'MODERATE')
        reasoning = triage.get('triage_reasoning', '')

        await _log(manager, f'[TRIAGE] Severity: {label} (score {score}/10)')
        await _log(manager, f'[TRIAGE] Reasoning: {reasoning[:120]}...' if len(reasoning) > 120 else f'[TRIAGE] Reasoning: {reasoning}')
        await asyncio.sleep(0.3)

        # ── STAGE 3: Dispatch ──────────────────────────────────────────────
        await _log(manager, '[DISPATCH] Coordinating emergency response...')
        await asyncio.sleep(0.3)

        dispatch = _dispatch(score, incident_id, DEMO_GPS)

        await _log(manager, f'[DISPATCH] Services dispatched: {", ".join(dispatch["services_dispatched"])}')
        await _log(manager, f'[DISPATCH] EMS ETA: {dispatch["ems_eta_minutes"]} minutes | Hospital notified: {dispatch["hospital_notified"]}')
        await asyncio.sleep(0.3)

        # ── Final Result ───────────────────────────────────────────────────
        status = 'UNCERTAIN' if conf < 0.6 else label

        result = {
            'status': status,
            'incident_id': incident_id,
            'timestamp': timestamp,
            'gps_coordinates': DEMO_GPS,
            # Detection
            'crash_detected': True,
            'confidence': conf,
            'vehicles_detected': vehicles,
            'frame_number': detection.get('frame_number', 0),
            # Triage
            'severity_score': score,
            'severity_label': label,
            'triage_reasoning': reasoning,
            # Dispatch
            **dispatch,
            # Message for UNCERTAIN
            'message': 'Requires human verification.' if conf < 0.6 else None
        }

        await _log(manager, f'[SENTINEL] Pipeline complete. Incident ID: {incident_id}')
        if manager:
            await manager.broadcast({'type': 'result', 'data': result})
        return result

    except Exception as e:
        import traceback
        traceback.print_exc()
        error_result = {
            'status': 'ERROR',
            'incident_id': incident_id,
            'timestamp': timestamp,
            'gps_coordinates': DEMO_GPS,
            'crash_detected': False,
            'confidence': 0.0,
            'vehicles_detected': 0,
            'frame_number': 0,
            'severity_score': 0,
            'severity_label': 'ERROR',
            'triage_reasoning': f'Pipeline error: {str(e)}',
            'services_dispatched': [],
            'ems_eta_minutes': 0,
            'hospital_notified': False,
            'hospital_message': '',
            'reroute_suggestion': '',
            'alert_message': f'Pipeline encountered an error: {str(e)}',
            'message': str(e)
        }
        if manager:
            await manager.broadcast({'type': 'error', 'message': str(e)})
            await manager.broadcast({'type': 'result', 'data': error_result})
        return error_result
