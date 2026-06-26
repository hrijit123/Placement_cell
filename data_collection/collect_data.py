import cv2
import mediapipe as mp
import numpy as np
import csv
import os

# Initialize MediaPipe Hands
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7
)

DATA_FILE = 'data.csv'

def append_to_csv(label, landmarks):
    # Flatten the landmarks to a 1D list [x0, y0, x1, y1, ...]
    row = [label]
    for lm in landmarks:
        row.extend([lm[0], lm[1]])
        
    file_exists = os.path.isfile(DATA_FILE)
    
    with open(DATA_FILE, mode='a', newline='') as f:
        writer = csv.writer(f)
        # Write header if file doesn't exist
        if not file_exists:
            header = ['label']
            for i in range(21):
                header.extend([f'x{i}', f'y{i}'])
            writer.writerow(header)
            
        writer.writerow(row)
        
def process_landmarks(hand_landmarks, image_width, image_height):
    # Convert normalized coordinates to pixel coordinates
    pixel_landmarks = []
    for lm in hand_landmarks.landmark:
        pixel_landmarks.append((lm.x * image_width, lm.y * image_height))
        
    # Normalization: Make the coordinates relative to the wrist (landmark 0)
    # This ensures translation invariance
    wrist_x, wrist_y = pixel_landmarks[0]
    
    normalized_landmarks = []
    for x, y in pixel_landmarks:
        norm_x = x - wrist_x
        norm_y = y - wrist_y
        normalized_landmarks.append((norm_x, norm_y))
        
    # Scale normalization: divide by maximum absolute value to keep values between -1 and 1
    # This helps if the hand is closer or further from the camera
    flat_coords = [coord for point in normalized_landmarks for coord in point]
    max_val = max(abs(val) for val in flat_coords)
    
    if max_val > 0:
        normalized_landmarks = [(x / max_val, y / max_val) for x, y in normalized_landmarks]
        
    return normalized_landmarks

def main():
    cap = cv2.VideoCapture(0)
    
    print("ISL Data Collection Script Started.")
    print("Press a letter key (A-Z) to record the current hand gesture with that label.")
    print("Press 'ESC' or 'Q' to quit.")
    
    while cap.isOpened():
        success, image = cap.read()
        if not success:
            print("Ignoring empty camera frame.")
            continue

        # Flip the image horizontally for a later selfie-view display
        image = cv2.flip(image, 1)
        image_height, image_width, _ = image.shape
        
        # Convert the BGR image to RGB
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Process the image and find hands
        results = hands.process(image_rgb)
        
        # Draw hand landmarks
        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                mp_drawing.draw_landmarks(
                    image,
                    hand_landmarks,
                    mp_hands.HAND_CONNECTIONS)
                
                # Instructions
                cv2.putText(image, "Press A-Z to save gesture", (10, 30), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        else:
            cv2.putText(image, "No hand detected", (10, 30), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                        
        cv2.imshow('ISL Data Collection', image)
        
        # Handle keypresses
        key = cv2.waitKey(5) & 0xFF
        
        if key == 27 or key == ord('q'): # ESC or q
            break
        elif 97 <= key <= 122: # 'a' to 'z'
            char = chr(key).upper()
            if results.multi_hand_landmarks:
                # Assuming 1 hand for now
                hand_landmarks = results.multi_hand_landmarks[0]
                normalized_lms = process_landmarks(hand_landmarks, image_width, image_height)
                append_to_csv(char, normalized_lms)
                print(f"Saved gesture for: {char}")
                
                # Visual feedback
                cv2.putText(image, f"SAVED: {char}", (10, 70), 
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)
                cv2.imshow('ISL Data Collection', image)
                cv2.waitKey(200) # Small pause for visual feedback
            else:
                print(f"Tried to save '{char}' but no hand detected.")
                
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
