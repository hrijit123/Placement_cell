import json
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
import time
import jwt
import os
import tensorflow as tf
from pydantic import BaseModel, ValidationError

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT Secret from environment (should match NEXTAUTH_SECRET)
JWT_SECRET = os.getenv("NEXTAUTH_SECRET", "sevaparmodharma-secret-key-12345")

# Load actual model
try:
    print("Loading ISL Model...")
    model = tf.keras.models.load_model('ready_model_nn.h5')
    print("Model loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

# We assume standard 5 classes for now or mapped classes based on what the model outputs
ISL_CLASSES = ['A', 'B', 'C', 'L', 'Y'] # Placeholder map, update this based on your actual training labels

class Landmark(BaseModel):
    x: float
    y: float
    z: float

class PayloadSchema(BaseModel):
    landmarks: list[Landmark]

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[WebSocket, dict] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[websocket] = {
            "last_message_time": time.time(),
            "messages_this_second": 0
        }

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            del self.active_connections[websocket]

    def check_rate_limit(self, websocket: WebSocket) -> bool:
        """Simple per-connection token bucket rate limiter (Max 30 msg/sec)"""
        now = time.time()
        conn_data = self.active_connections.get(websocket)
        if not conn_data: return False
        
        if now - conn_data["last_message_time"] > 1.0:
            conn_data["messages_this_second"] = 1
            conn_data["last_message_time"] = now
            return True
        else:
            conn_data["messages_this_second"] += 1
            if conn_data["messages_this_second"] > 30:
                return False
            return True

manager = ConnectionManager()

def run_inference(landmarks_array):
    if model is None:
        return "MODEL_ERROR"
    # Flatten or shape the landmarks as the model expects
    # The ready_model_nn.h5 expects 21 * 3 = 63 features, likely flattened
    flattened = landmarks_array.flatten().reshape(1, -1)
    preds = model.predict(flattened, verbose=0)
    idx = np.argmax(preds[0])
    if idx < len(ISL_CLASSES):
        return ISL_CLASSES[idx]
    return str(idx) # Fallback if we have more classes

@app.websocket("/ws/translate")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(None)):
    # 1. Authentication (JWT)
    if not token:
        await websocket.close(code=1008, reason="Missing Token")
        return
        
    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = decoded.get("userId")
        if not user_id:
            raise ValueError("Invalid payload")
    except Exception as e:
        await websocket.close(code=1008, reason=f"Unauthorized: {str(e)}")
        return

    # 2. Connection Accepted
    await manager.connect(websocket)
    try:
        while True:
            # 3. Rate Limiting
            if not manager.check_rate_limit(websocket):
                await websocket.send_json({"error": "Rate limit exceeded"})
                # Skip processing this frame
                data = await websocket.receive_text()
                continue

            data = await websocket.receive_text()
            
            # 4. Input Validation with Pydantic
            try:
                payload = PayloadSchema.parse_raw(data)
            except ValidationError as e:
                await websocket.send_json({"error": "Invalid payload shape"})
                continue
                
            if len(payload.landmarks) != 21:
                await websocket.send_json({"error": "Expected 21 landmarks"})
                continue

            # Convert to numpy array for ML model
            np_landmarks = np.array([[lm.x, lm.y, lm.z] for lm in payload.landmarks])
            
            # 5. Run real inference
            try:
                prediction = run_inference(np_landmarks)
                await websocket.send_json({"prediction": prediction})
            except Exception as e:
                print(f"Inference error: {e}")
                await websocket.send_json({"error": "Inference failed"})

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"Connection Error: {e}")
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
