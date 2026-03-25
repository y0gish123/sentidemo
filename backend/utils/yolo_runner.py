"""
YOLO Runner — loads model ONCE globally, processes every 3rd frame.
Returns crash_detected, confidence, vehicles_detected, frame_number, status.
"""
import cv2
import os
import itertools

# ── Load model once at module import time ──────────────────────────────────
_model = None

def _get_model():
    global _model
    if _model is None:
        from ultralytics import YOLO
        model_path = os.getenv('YOLO_MODEL_PATH', 'yolov8n.pt')
        _model = YOLO(model_path)
        print("[SENTINEL] YOLO model loaded globally.")
    return _model


def calculate_iou(boxA, boxB):
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2])
    yB = min(boxA[3], boxB[3])
    inter = max(0, xB - xA + 1) * max(0, yB - yA + 1)
    if inter == 0:
        return 0.0
    aA = (boxA[2] - boxA[0] + 1) * (boxA[3] - boxA[1] + 1)
    aB = (boxB[2] - boxB[0] + 1) * (boxB[3] - boxB[1] + 1)
    return inter / float(aA + aB - inter)


def run_yolo_detection(video_path: str) -> dict:
    """
    Scan up to 90 frames (every 3rd frame) of the video.
    Returns a structured detection result.
    """
    fallback = {
        'crash_detected': False,
        'confidence': 0.0,
        'vehicles_detected': 0,
        'frame_number': 0,
        'status': 'NO_ACCIDENT'
    }

    if not os.path.exists(video_path):
        print(f"[YOLO] File not found: {video_path}")
        return fallback

    try:
        model = _get_model()
    except Exception as e:
        print(f"[YOLO] Model load error: {e}")
        return fallback

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"[YOLO] Cannot open video: {video_path}")
        return fallback

    frame_num = 0
    best_result = None
    best_conf = 0.0

    try:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            frame_num += 1

            # Hard cap: only scan first 90 frames (~3 seconds at 30fps)
            if frame_num > 90:
                break

            # Skip 2 out of every 3 frames
            if frame_num % 3 != 0:
                continue

            frame_resized = cv2.resize(frame, (640, 640))
            results = model(frame_resized, verbose=False)
            boxes = results[0].boxes

            # Vehicle classes: car=2, motorcycle=3, bus=5, truck=7
            vehicle_boxes = [b for b in boxes if int(b.cls) in [2, 3, 5, 7]]

            if len(vehicle_boxes) >= 2:
                confidences = [float(b.conf) for b in vehicle_boxes]
                avg_conf = sum(confidences) / len(confidences)

                bboxes = [b.xyxy[0].tolist() for b in vehicle_boxes]
                for box1, box2 in itertools.combinations(bboxes, 2):
                    iou = calculate_iou(box1, box2)
                    if iou > 0.05 and avg_conf > best_conf:
                        best_conf = avg_conf
                        best_result = {
                            'crash_detected': True,
                            'confidence': round(avg_conf, 3),
                            'vehicles_detected': len(vehicle_boxes),
                            'frame_number': frame_num,
                            'status': 'CRITICAL' if avg_conf >= 0.7 else 'UNCERTAIN'
                        }
    finally:
        cap.release()

    if best_result:
        return best_result

    # No crash found — return best vehicle count we saw
    return {
        'crash_detected': False,
        'confidence': round(best_conf, 3),
        'vehicles_detected': 0,
        'frame_number': frame_num,
        'status': 'NO_ACCIDENT'
    }
