from pydantic import BaseModel
from typing import List, Optional

class IncidentResponse(BaseModel):
    incident_id: str
    timestamp: str 
    gps_coordinates: str
    crash_detected: bool
    frame_number: int
    severity_score: int
    severity_label: str
    triage_reasoning: str
    services_dispatched: List[str]
    ems_eta_minutes: int
    hospital_notified: bool
    hospital_message: str
    reroute_suggestion: str
    alert_message: str
