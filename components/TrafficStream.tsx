"use client";

import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Square, Activity, AlertCircle } from "lucide-react";

export default function TrafficStream() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [error, setError] = useState<string | null>(null);

  const startStream = async () => {
    setIsStreaming(true);
    setStatus("Connecting...");
    setError(null);

    const config: RTCConfiguration = {
      sdpSemantics: "unified-plan",
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

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg border-zinc-200 dark:border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-500" />
          <CardTitle>Real-Time Traffic Analytics</CardTitle>
        </div>
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
      </CardHeader>
      <CardContent>
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-zinc-800">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
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
  );
}
