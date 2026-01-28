"use client";

import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Play, Square, Activity, AlertCircle, RefreshCw, Upload, Filter, Film } from "lucide-react";
import dynamic from "next/dynamic";

const ZoneConfig = dynamic(
  () => import('./ZoneConfig').then((mod) => mod.ZoneConfig),
  { ssr: false }
);

interface TrafficStreamProps {
  videoSource?: string;
  onVideoSourceChange?: (videoName: string) => void;
  targetClasses?: string[];
  onTargetClassesChange?: (classes: string[]) => void;
}

const AVAILABLE_CLASSES = ["person", "car", "motorcycle", "truck", "bus"];

export default function TrafficStream({ 
    videoSource, 
    onVideoSourceChange,
    targetClasses = ["person", "car", "motorcycle", "truck", "bus"],
    onTargetClassesChange
}: TrafficStreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [error, setError] = useState<string | null>(null);
  
  // Ref to keep track if we are currently negotiating to avoid race conditions if source changes rapidly
  const isNegotiating = useRef(false);

  const [showConfig, setShowConfig] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Video Selection & Filter State
  const [videos, setVideos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchVideos = async () => {
    try {
      const res = await fetch("/api/videos", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setVideos(data.videos || []);
        // If no video selected yet and list not empty, select first
        if (!videoSource && data.videos.length > 0 && onVideoSourceChange) {
           onVideoSourceChange(data.videos[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch videos:", err);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload", true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        setUploadProgress(percentComplete);
      }
    };

    xhr.onload = async () => {
      if (xhr.status === 200) {
        await fetchVideos();
        if (onVideoSourceChange) onVideoSourceChange(file.name); 
      } else {
        alert("Upload failed");
      }
      setIsUploading(false);
      setUploadProgress(0);
      e.target.value = "";
    };

    xhr.onerror = () => {
      console.error("Upload error");
      alert("Error uploading file");
      setIsUploading(false);
      setUploadProgress(0);
    };

    xhr.send(formData);
  };

  const handleClassToggle = (cls: string) => {
      if (!onTargetClassesChange) return;
      if (targetClasses.includes(cls)) {
          onTargetClassesChange(targetClasses.filter((c) => c !== cls));
      } else {
          onTargetClassesChange([...targetClasses, cls]);
      }
  };

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
  const [originalConfig, setOriginalConfig] = useState<any>(null);

  const startConfig = () => {
      if (zoneConfig) {
          setOriginalConfig(JSON.parse(JSON.stringify(zoneConfig)));
      }
      setShowConfig(true);
  };

  const cancelConfig = () => {
      if (originalConfig) {
          setZoneConfig(originalConfig);
      }
      setShowConfig(false);
  };
  
  // Initialize config when showing overlay if not already set, OR populate from API
  useEffect(() => {
      if (dimensions.width > 0) {
           if (!zoneConfig) {
               // Load Config from server
               fetch("/api/config/lines")
               .then(res => res.json())
               .then(data => {
                   const width = dimensions.width;
                   const height = dimensions.height;
                   
                   if (data.polygon) {
                       setZoneConfig({
                           points: data.polygon.map((p:number, i:number) => i % 2 === 0 ? p * width : p * height),
                           distance: data.distance
                       });
                   } else if (data.line1 && data.line2) {
                        // Backward compatibility
                        const l1 = data.line1;
                        const l2 = data.line2;
                        setZoneConfig({
                             points: [
                                 l1[0] * width, l1[1] * height, 
                                 l1[2] * width, l1[3] * height, 
                                 l2[2] * width, l2[3] * height, 
                                 l2[0] * width, l2[1] * height  
                             ],
                             distance: data.distance
                        });
                   } else if (showConfig) {
                       // Default Rect
                       setZoneConfig({
                           points: [
                               width * 0.3, height * 0.3, 
                               width * 0.7, height * 0.3, 
                               width * 0.7, height * 0.7, 
                               width * 0.3, height * 0.7  
                           ],
                           distance: 5
                       })
                   }
               })
               .catch(err => {
                   console.error("Config fetch failed", err);
                   if (showConfig) {
                        const width = dimensions.width;
                        const height = dimensions.height;
                        setZoneConfig({
                            points: [
                                width * 0.3, height * 0.3,
                                width * 0.7, height * 0.3,
                                width * 0.7, height * 0.7,
                                width * 0.3, height * 0.7 
                            ],
                            distance: 5
                        })
                   }
               })
           }
      }
  }, [showConfig, dimensions]);

  // Handle saving config
  const handleSaveConfig = async () => {
     if (!zoneConfig) return;
     console.log("Saving Config:", zoneConfig);
     
     // Normalize to 0-1 scale
     const normalizedPoints = zoneConfig.points.map((p: number, i: number) => 
         i % 2 === 0 ? p / dimensions.width : p / dimensions.height
     );

     const normalizedConfig = {
         polygon: normalizedPoints, // Use 'polygon' for backend
         distance: zoneConfig.distance
     };

     try {
         // Post to /api/config/zone as in friend's update, or /api/config/lines (both work now)
         await fetch("/api/config/zone", {
             method: "POST",
             headers: {"Content-Type": "application/json"},
             body: JSON.stringify(normalizedConfig)
         });
         setShowConfig(false);
         // Also update original config so cancel works for subsequent edits
         setOriginalConfig(JSON.parse(JSON.stringify(zoneConfig)));
     } catch(e) {
         console.error(e);
     }
  };

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Fetch Preview
  useEffect(() => {
    if (videoSource) {
        setPreviewUrl(`/api/video_preview?video_source=${encodeURIComponent(videoSource)}`);
    } else {
        setPreviewUrl(null);
    }
  }, [videoSource]);

  const togglePlayPause = () => {
      if (videoRef.current) {
          if (videoRef.current.paused) {
              videoRef.current.play();
              setIsPaused(false);
          } else {
              videoRef.current.pause();
              setIsPaused(true);
          }
      }
  };

  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto w-full">
        <Card className="w-full shadow-lg border-zinc-200 dark:border-zinc-800">
        <CardHeader className="flex flex-col gap-4">
            <div className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    <CardTitle>Real-Time Traffic Analytics</CardTitle>
                </div>

            </div>
            
            {/* Toolbar - Consolidated Controls */}
            <div className="flex flex-wrap items-center gap-3 w-full p-2 bg-zinc-50 dark:bg-zinc-900 rounded-md border border-zinc-200 dark:border-zinc-800">
                {/* Traffic Source */}
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <Film className="h-4 w-4 text-zinc-500" />
                    <Select value={videoSource} onValueChange={onVideoSourceChange}>
                        <SelectTrigger className="w-full h-9 bg-white dark:bg-zinc-800">
                          <SelectValue placeholder="Select Source..." />
                        </SelectTrigger>
                        <SelectContent>
                          {videos.map((v) => (
                            <SelectItem key={v} value={v}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Upload Button */}
                 <div className="relative">
                     <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9" 
                        title="Upload Video"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                         {isUploading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                     </Button>
                     <input 
                         ref={fileInputRef}
                         type="file" 
                         accept=".mp4,.avi,.mov" 
                         onChange={handleUpload} 
                         disabled={isUploading}
                         className="hidden"
                     />
                 </div>

                <div className="h-6 w-px bg-zinc-300 dark:bg-zinc-700 mx-1" />

                {/* Filter Objects */}
                <div className="relative">
                    <Button 
                        variant={showFilters ? "secondary" : "ghost"}
                        size="sm"
                        className="h-9 gap-2"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter className="h-4 w-4" />
                        <span className="hidden sm:inline">Filters</span>
                        {targetClasses.length < AVAILABLE_CLASSES.length && (
                             <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                                {targetClasses.length}
                             </Badge>
                        )}
                    </Button>
                    
                    {/* Filter Dropdown */}
                    {showFilters && (
                        <div className="absolute top-10 left-0 z-50 w-56 p-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-lg animate-in fade-in zoom-in-95 duration-200">
                             <Label className="text-xs text-zinc-500 mb-2 px-2 block">Detected Classes</Label>
                             <div className="flex flex-col gap-1">
                                {AVAILABLE_CLASSES.map(cls => (
                                    <div key={cls} className="flex items-center space-x-2 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded cursor-pointer" onClick={() => handleClassToggle(cls)}>
                                        <Checkbox 
                                            id={`filter-${cls}`} 
                                            checked={targetClasses.includes(cls)}
                                            onCheckedChange={() => handleClassToggle(cls)}
                                        />
                                        <Label htmlFor={`filter-${cls}`} className="cursor-pointer capitalize flex-1">{cls}</Label>
                                    </div>
                                ))}
                             </div>
                        </div>
                    )}
                </div>

                <div className="flex-1" /> {/* Spacer */}

                {/* Config Controls */}
                {!showConfig ? (
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        className="h-9"
                        onClick={startConfig}
                        disabled={!isStreaming && status !== "Live" && !previewUrl}
                    >
                        Configure Zone
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-9 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={cancelConfig}
                        >
                            Cancel
                        </Button>
                        <Button 
                            size="sm" 
                            className="h-9 bg-green-600 hover:bg-green-700 text-white"
                            onClick={handleSaveConfig}
                        >
                            Save Config
                        </Button>
                    </div>
                )}
            </div>
            
        </CardHeader>
        <CardContent>
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-zinc-800">
            {/* Preview Image */}
            {!isStreaming && status !== "Live" && !error && previewUrl && (
                <img 
                    src={previewUrl} 
                    alt="Video Preview" 
                    className="absolute inset-0 w-full h-full object-contain z-10"
                    onLoad={(e) => {
                         const target = e.currentTarget;
                         setDimensions({
                             width: target.offsetWidth,
                             height: target.offsetHeight
                         })
                    }}
                />
            )}
            
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onPlaying={onVideoReady}
                className="w-full h-full object-contain relative z-20"
                style={{ opacity: (isStreaming || status === "Live") ? 1 : 0 }}
            />
            
            {!isStreaming && status !== "Live" && !previewUrl && !error && (
                <div className="absolute inset-0 flex items-center justify-center text-zinc-500 bg-zinc-900/50 z-30">
                <p>Stream Offline</p>
                </div>
            )}
            
            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 bg-zinc-900/80 gap-2 z-40">
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

            <div className="flex justify-center mt-4 mb-2">
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

            <div className="flex justify-center gap-4 mt-2">
            {!isStreaming ? (
                <Button
                onClick={startStream}
                size="lg"
                className="w-32 gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                <Play className="h-4 w-4" /> Play
                </Button>
            ) : (
                <div className="flex gap-4">
                     {/* Pause / Continue */}
                     <Button
                        onClick={togglePlayPause}
                        size="lg"
                        className="w-32 gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {isPaused ? <Play className="h-4 w-4" /> : <div className="h-4 w-4 border-l-4 border-r-4 border-white mr-1" />} 
                        {isPaused ? "Continue" : "Pause"}
                    </Button>
                    
                    {/* Stop Button (Reset) */}
                    <Button
                        onClick={stopStream}
                        variant="destructive"
                        size="lg"
                        className="w-32 gap-2"
                    >
                        <Square className="h-4 w-4" /> Stop
                    </Button>
                </div>
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
                         Save Zone Config
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
