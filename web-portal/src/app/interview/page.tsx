"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

export default function InterviewRoom() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [translation, setTranslation] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [translationStatus, setTranslationStatus] = useState<"connecting" | "connected" | "unavailable">("connecting");
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // 1. Fetch Auth Token for WebSocket
    const initWebSocket = async () => {
      try {
        const res = await fetch("/api/ws-auth");
        if (!res.ok) {
          // 401 = not signed in, 403 = wrong role; either way translation can't start
          setTranslationStatus("unavailable");
          return;
        }
        const { token } = await res.json();

        // 2. Initialize WebSocket with Token
        const mlServiceUrl = process.env.NEXT_PUBLIC_ML_SERVICE_URL;
        const wsHost = window.location.hostname;
        const wsUrl = mlServiceUrl 
          ? `${mlServiceUrl}?token=${token}` 
          : `ws://${wsHost}:8000/ws/translate?token=${token}`;
          
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => setTranslationStatus("connected");
        // The ML translation service may be offline (it is disabled in the current deployment)
        wsRef.current.onerror = () => setTranslationStatus("unavailable");
        wsRef.current.onclose = () => setTranslationStatus((s) => (s === "connected" ? "unavailable" : s));

        wsRef.current.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.prediction) {
            setTranslation((prev) => {
              const lastChar = prev.slice(-1);
              if (lastChar !== data.prediction) {
                 return prev + data.prediction;
              }
              return prev;
            });
          }
        };
      } catch (err) {
        console.error("WS Auth Error:", err);
        setTranslationStatus("unavailable");
      }
    };

    initWebSocket();

    return () => {
      wsRef.current?.close();
    };
  }, []);

  const startInterview = async () => {
    if (!isScriptLoaded || typeof window === 'undefined' || !window.Hands || !window.Camera) {
      alert("MediaPipe is still loading. Please wait a second and try again.");
      return;
    }
    
    setIsJoined(true);
      const hands = new window.Hands({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      hands.onResults((results: any) => {
        // Draw landmarks on canvas
        const canvasCtx = canvasRef.current?.getContext("2d");
        if (canvasCtx && canvasRef.current && videoRef.current) {
          canvasCtx.save();
          canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);
          
          if (results.multiHandLandmarks) {
            for (const landmarks of results.multiHandLandmarks) {
              window.drawConnectors(canvasCtx, landmarks, window.HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
              window.drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 1 });
              
              // Send landmarks to ML backend
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ landmarks }));
              }
            }
          }
          canvasCtx.restore();
        }
      });

      if (videoRef.current) {
        const camera = new window.Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current) {
               await hands.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480
        });
        camera.start();
      }
  };

  return (
    <div className="min-h-screen bg-[#2C241B] text-[#FDFBF7] font-sans flex flex-col">
      {/* MediaPipe CDNs */}
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" />
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js" />
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js" />
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js" onLoad={() => setIsScriptLoaded(true)} />

      <header className="p-6 border-b border-[#4A3F35] flex justify-between items-center bg-[#1E1913]">
        <h1 className="text-2xl font-serif text-[#E1D8C9]">ISL Interview Portal</h1>
        <div className="text-[#8B7D6B] text-sm">Tech Corp India - Senior ISL UI Engineer</div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {!isJoined ? (
          <div className="bg-[#FAF8F3] text-[#2C241B] p-10 rounded shadow-lg text-center max-w-md">
            <h2 className="text-3xl font-serif mb-4">Ready to join?</h2>
            <p className="text-[#6B5E4C] mb-8">Your camera will be used to translate Indian Sign Language in real-time during the interview.</p>
            {translationStatus === "unavailable" && (
              <div className="mb-6 px-4 py-3 rounded bg-[#F5EDE0] border border-[#D9C7A8] text-[#7A5C2E] text-sm text-left" role="alert">
                <strong className="block mb-1">Live translation is unavailable.</strong>
                You can still join, but ISL-to-text captions will not appear. Make sure you are signed in as a student or recruiter, and that the translation service is running.
              </div>
            )}
            <button 
              onClick={startInterview}
              disabled={!isScriptLoaded}
              className={`px-8 py-3 font-semibold rounded w-full transition-colors ${isScriptLoaded ? 'bg-[#2D4A22] text-[#FDFBF7] hover:bg-[#3C5A31]' : 'bg-[#4A3F35] text-[#8B7D6B] cursor-not-allowed'}`}
            >
              {isScriptLoaded ? "Join Interview" : "Loading AI Models..."}
            </button>
          </div>
        ) : (
          <div className="w-full max-w-5xl flex flex-col items-center">
            {/* Video Container */}
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border-2 border-[#4A3F35] shadow-2xl">
              <video ref={videoRef} className="hidden" playsInline></video>
              <canvas 
                ref={canvasRef} 
                className="w-full h-full object-cover"
                width={640}
                height={480}
              ></canvas>
              
              {/* Recruiter Video Mock */}
              <div className="absolute top-4 right-4 w-48 aspect-video bg-[#3E362E] border border-[#6B5E4C] rounded overflow-hidden flex items-center justify-center shadow-lg">
                <span className="text-[#8B7D6B] text-xs font-semibold uppercase">Recruiter Feed</span>
              </div>

              {/* Real-time Closed Captions */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-3/4 text-center">
                <div className="bg-black/60 backdrop-blur-sm p-4 rounded text-2xl font-semibold text-white tracking-wide shadow-lg border border-white/10">
                  {translationStatus === "unavailable"
                    ? "⚠ Translation service offline — captions disabled"
                    : translation || "Waiting for signs..."}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="mt-8 flex gap-4">
              <button className="w-14 h-14 rounded-full bg-[#4A3F35] flex items-center justify-center hover:bg-[#6B5E4C] transition-colors">
                🎤
              </button>
              <button className="w-14 h-14 rounded-full bg-[#4A3F35] flex items-center justify-center hover:bg-[#6B5E4C] transition-colors">
                📹
              </button>
              <button className="w-14 h-14 rounded-full bg-[#8B2323] flex items-center justify-center hover:bg-[#A32A2A] transition-colors">
                📞
              </button>
            </div>
            
            <div className="mt-4 text-[#8B7D6B] flex gap-4">
               <button onClick={() => setTranslation("")} className="text-sm underline hover:text-[#E1D8C9]">Clear Captions</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Add TypeScript definitions for MediaPipe globals
declare global {
  interface Window {
    Hands: any;
    Camera: any;
    drawConnectors: any;
    drawLandmarks: any;
    HAND_CONNECTIONS: any;
  }
}
