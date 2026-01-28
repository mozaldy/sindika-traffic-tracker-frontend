"use client";

import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Square, Activity, AlertCircle } from "lucide-react";
import dynamic from "next/dynamic";

const ZoneConfig = dynamic(
  () => import('./ZoneConfig').then((mod) => mod.ZoneConfig),
  { ssr: false }
);

interface TrafficStreamProps {
  videoSource?: string;
  targetClasses?: string[];
}

export default function TrafficStream({ videoSource, targetClasses }: TrafficStreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [error, setError] = useState<string | null>(null);
  
  // Ref to keep track if we are currently negotiating to avoid race conditions if source changes rapidly
  const isNegotiating = useRef(false);

  const [showConfig, setShowConfig] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Update dimensions when video plays
  const onVideoReady = () => {
    if (videoRef.current) {
        setDimensions({
            width: videoRef.current.offsetWidth,
            height: videoRef.current.offsetHeight
        })
    }
  }

  const startStream = async () => {
    if (isNegotiating.current) return;
    isNegotiating.current = true;
    
    setIsStreaming(true);
    setStatus("Connecting...");
    setError(null);
    
    // Close existing connection if any
    if (pcRef.current) {
        pcRef.current.close();
    }

    const config: RTCConfiguration = {
      iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
    };

    const pc = new RTCPeerConnection(config);
    pcRef.current = pc;

    // Handle incoming tracks
    pc.addEventListener("track", (evt) => {
      if (evt.track.kind === "video" && videoRef.current) {
        videoRef.current.srcObject = evt.streams[0];
      }
    });

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setStatus("Live");
      } else if (pc.connectionState === "failed") {
        setStatus("Connection Failed");
        stopStream();
      }
    };

    try {
      // Create Offer
      pc.addTransceiver("video", { direction: "recvonly" });
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Wait for ICE gathering
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === "complete") {
          resolve();
        } else {
          const checkState = () => {
            if (pc.iceGatheringState === "complete") {
              pc.removeEventListener("icegatheringstatechange", checkState);
              resolve();
            }
          };
          pc.addEventListener("icegatheringstatechange", checkState);
        }
      });

      // Send Offer to Backend
      const response = await fetch("/api/offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sdp: pc.localDescription?.sdp,
          type: pc.localDescription?.type,
          video_source: videoSource,
          target_classes: targetClasses,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const answer = await response.json();
      await pc.setRemoteDescription(answer);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to start stream");
      setStatus("Error");
      stopStream();
    } finally {
      isNegotiating.current = false;
    }
  };

  const stopStream = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setStatus("Stopped");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  // State for ZONE configuration
  // zone is [x1, y1, x2, y2, x3, y3, x4, y4]
  const [zoneConfig, setZoneConfig] = useState<any>(null); 
  
  // Initialize config when showing overlay if not already set
  useEffect(() => {
      if (showConfig && !zoneConfig && dimensions.width > 0) {
          const w = dimensions.width;
          const h = dimensions.height;
          // Default rect in center
          setZoneConfig({
              points: [
                  w * 0.3, h * 0.3, // TL
                  w * 0.7, h * 0.3, // TR
                  w * 0.7, h * 0.7, // BR
                  w * 0.3, h * 0.7  // BL
              ],
              distance: 5
          })
      }
  }, [showConfig, dimensions, zoneConfig]);

  // Handle saving config
  const handleSaveConfig = async () => {
     if (!zoneConfig) return;
     console.log("Saving Config:", zoneConfig);
     
     // Normalize to 0-1 scale
     const normalizedPoints = zoneConfig.points.map((p: number, i: number) => 
         i % 2 === 0 ? p / dimensions.width : p / dimensions.height
     );

     const normalizedConfig = {
         zone: normalizedPoints,
         distance: zoneConfig.distance
     };

     try {
         await fetch("/api/config/zone", {
             method: "POST",
             headers: {"Content-Type": "application/json"},
             body: JSON.stringify(normalizedConfig)
         });
         setShowConfig(false);
     } catch(e) {
         console.error(e);
     }
  };

  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto">
        <Card className="w-full shadow-lg border-zinc-200 dark:border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            <CardTitle>Real-Time Traffic Analytics</CardTitle>
            </div>
            <div className="flex items-center gap-2">
                <Button 
                    variant={showConfig ? "secondary" : "outline"} 
                    size="sm" 
                    onClick={() => setShowConfig(!showConfig)}
                    disabled={!isStreaming && status !== "Live"}
                >
                    {showConfig ? "Hide Config" : "Configure Zone"}
                </Button>
                <Badge
                variant={
                    status === "Live"
                    ? "default"
                    : status === "Error"
                    ? "destructive"
                    : "secondary"
                }
                className="text-sm px-3 py-1"
                >
                {status}
                </Badge>
            </div>
        </CardHeader>
        <CardContent>
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-zinc-800">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onPlaying={onVideoReady}
                className="w-full h-full object-contain"
            />
            {!isStreaming && status !== "Live" && !error && (
                <div className="absolute inset-0 flex items-center justify-center text-zinc-500 bg-zinc-900/50">
                <p>Stream Offline</p>
                </div>
            )}
            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 bg-zinc-900/80 gap-2">
                <AlertCircle className="h-8 w-8" />
                <p>{error}</p>
                </div>
            )}
            
            {/* Config Overlay */}
            {showConfig && dimensions.width > 0 && zoneConfig && (
                // @ts-ignore
                <ZoneConfig 
                    width={dimensions.width} 
                    height={dimensions.height}
                    points={zoneConfig.points}
                    onPointsChange={(pts: number[]) => {
                        setZoneConfig((prev:any) => ({
                            ...prev,
                            points: pts
                        }))
                    }}
                />
            )}
            </div>

            <div className="flex justify-center gap-4 mt-6">
            {!isStreaming ? (
                <Button
                onClick={startStream}
                size="lg"
                className="w-32 gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                <Play className="h-4 w-4" /> Start
                </Button>
            ) : (
                <Button
                onClick={stopStream}
                variant="destructive"
                size="lg"
                className="w-32 gap-2"
                >
                <Square className="h-4 w-4" /> Stop
                </Button>
            )}
            </div>
        </CardContent>
        </Card>
        
        {/* Speed Config Controls */}
        {showConfig && zoneConfig && (
             <Card className="p-4 border-zinc-200 dark:border-zinc-800 animate-in fade-in slide-in-from-top-4">
                <div className="flex items-end gap-4">
                     <div className="flex flex-col gap-2 flex-grow">
                        <label className="text-sm font-medium">Approximate Zone Diameter/Crossing Distance (Meters)</label>
                        <input 
                            type="number" 
                            className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
                            value={zoneConfig.distance || ''}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setZoneConfig({...zoneConfig, distance: isNaN(val) ? 0 : val})
                            }}
                        />
                     </div>
                     <Button onClick={handleSaveConfig} className="bg-green-600 hover:bg-green-700 text-white">
                         Save Zone
                     </Button>
                </div>
                <p className="text-xs text-zinc-500 mt-2">
                    Drag the corners to cover the intersection. The system will detect when vehicles enter and exit this zone.
                    Direction is calculated from the Entry point to the Exit point.
                </p>
             </Card>
        )}
    </div>
  );
}
