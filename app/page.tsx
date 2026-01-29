"use client";

import { useState } from "react";
import TrafficStream from "@/components/TrafficStream";
import { TrafficLog } from "@/components/TrafficLog";

export default function Home() {
  const [videoSource, setVideoSource] = useState<string>("");
  const [targetClasses, setTargetClasses] = useState<string[]>(["person", "car", "motorcycle", "truck", "bus"]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-8">
      <div className="w-full max-w-8xl space-y-8 flex flex-col items-center">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl text-zinc-900 dark:text-zinc-50">
            Sindika Traffic Tracking Analytic
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Real-time object detection and tracking with WebRTC
          </p>
        </div>

        <TrafficStream 
          videoSource={videoSource}
          onVideoSourceChange={setVideoSource}
          targetClasses={targetClasses}
          onTargetClassesChange={setTargetClasses}
        />

        <TrafficLog />
        
        <div className="text-center text-sm text-zinc-500">
           Powered by RF-DETR & WebSocket
        </div>
      </div>
    </main>
  );
}
