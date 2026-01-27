"use client";

import { useState } from "react";
import TrafficStream from "@/components/TrafficStream";
import { VideoSelector } from "@/components/VideoSelector";
import { ClassSelector } from "@/components/ClassSelector";
import { TrafficLog } from "@/components/TrafficLog";

export default function Home() {
  const [videoSource, setVideoSource] = useState<string>("");
  const [targetClasses, setTargetClasses] = useState<string[]>(["person", "car", "motorcycle", "truck", "bus"]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-8">
      <div className="w-full max-w-5xl space-y-8 flex flex-col items-center">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl text-zinc-900 dark:text-zinc-50">
            Sindika Traffic Analytics
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Real-time object detection and tracking via WebRTC
          </p>
        </div>

        <TrafficStream 
          videoSource={videoSource}
          targetClasses={targetClasses}
        />

        <div className="flex flex-col md:flex-row gap-4 w-full max-w-4xl justify-center">
            <VideoSelector 
              selectedVideo={videoSource} 
              onSelect={setVideoSource} 
            />
            
            <ClassSelector
              selectedClasses={targetClasses}
              onChange={setTargetClasses}
            />
        </div>

        <TrafficLog />
        
        <div className="text-center text-sm text-zinc-500">
           Powered by RF-DETR & WebSocket
        </div>
      </div>
    </main>
  );
}
