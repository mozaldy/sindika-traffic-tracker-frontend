"use client";

import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Upload } from "lucide-react";

interface VideoSelectorProps {
  onSelect: (videoName: string) => void;
  selectedVideo: string;
}

export function VideoSelector({ onSelect, selectedVideo }: VideoSelectorProps) {
  const [videos, setVideos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const fetchVideos = async () => {
    try {
      const res = await fetch("/api/videos", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setVideos(data.videos || []);
        // If no video selected yet and list not empty, select first
        if (!selectedVideo && data.videos.length > 0) {
           onSelect(data.videos[0]);
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
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        await fetchVideos();
        onSelect(file.name); // Auto-select uploaded file
      } else {
        alert("Upload failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading file");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-lg mt-8 p-4 border rounded-lg bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
      <div className="flex flex-col gap-2">
        <Label>Select Traffic Source</Label>
        <div className="flex gap-2">
          <Select value={selectedVideo} onValueChange={onSelect}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a video..." />
            </SelectTrigger>
            <SelectContent>
              {videos.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchVideos}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
         <Label>Or Upload New Video</Label>
         <div className="flex gap-2 items-center">
            <Input 
                type="file" 
                accept=".mp4,.avi,.mov" 
                onChange={handleUpload} 
                disabled={isUploading}
            />
            {isUploading && <span className="text-sm text-zinc-500">Uploading...</span>}
         </div>
      </div>
    </div>
  );
}
