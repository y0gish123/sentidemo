import cv2
import os
import itertools

def calculate_iou(boxA, boxB):
    # Determine the (x, y)-coordinates of the intersection rectangle
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2])
    yB = min(boxA[3], boxB[3])

    # Compute the area of intersection rectangle
    interArea = max(0, xB - xA + 1) * max(0, yB - yA + 1)
    if interArea == 0:
        return 0.0

    # Compute the area of both the prediction and ground-truth rectangles
    boxAArea = (boxA[2] - boxA[0] + 1) * (boxA[3] - boxA[1] + 1)
    boxBArea = (boxB[2] - boxB[0] + 1) * (boxB[3] - boxB[1] + 1)

    # Compute the intersection over union by taking the intersection
    # area and dividing it by the sum of prediction + ground-truth
    # areas - the intersection area
    iou = interArea / float(boxAArea + boxBArea - interArea)
    return iou

def run_yolo_detection(video_path: str) -> dict:
    from ultralytics import YOLO
    model_path = os.getenv('YOLO_MODEL_PATH', 'yolov8n.pt')
    try:
        model = YOLO(model_path)
    except Exception as e:
        print(f"Error loading YOLO model: {e}")
        return {'crash_detected': False, 'confidence': 0.0, 'vehicles_detected': 0}

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {'crash_detected': False, 'confidence': 0.0, 'vehicles_detected': 0}
        
    frame_num = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret: break
        frame_num += 1
        
        # Prevent infinite CPU scanning for long demo videos: cap at 30 frames (1 second)
        if frame_num > 30:
            break
            
        # Skip frames to speed up CPU inference (process 1 out of every 3 frames)
        if frame_num % 3 != 0:
            continue
            
        # Resize to 640x640 before YOLO to improve speed
        frame_resized = cv2.resize(frame, (640, 640))
        results = model(frame_resized)
        
        boxes = results[0].boxes
        vehicle_boxes = [b for b in boxes if int(b.cls) in [2, 3, 5, 7]]
        
        if len(vehicle_boxes) >= 2:
            confidences = [float(b.conf) for b in vehicle_boxes]
            avg_conf = sum(confidences) / len(confidences)
            
            # Check for bounding box overlap to signify a collision event
            # Ensure high general confidence
            if avg_conf > 0.50:
                bboxes = [b.xyxy[0].tolist() for b in vehicle_boxes]
                # Check all pairs of vehicles
                for box1, box2 in itertools.combinations(bboxes, 2):
                    iou = calculate_iou(box1, box2)
                    if iou > 0.05: # High intersection indicates collision in 2D space
                        cap.release()
                        return {
                            'crash_detected': True,
                            'frame_number': frame_num,
                            'confidence': round(avg_conf, 2),
                            'vehicles_detected': len(vehicle_boxes),
                        }
                
    cap.release()
    return {'crash_detected': False, 'confidence': 0.0, 'vehicles_detected': 0}
