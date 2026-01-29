"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { GripVertical } from "lucide-react";

interface PlateLineConfigProps {
    width: number;
    height: number;
    plateLine: number[] | null; // [x1, y1, x2, y2] in pixels
    onPlateLineChange: (line: number[] | null) => void;
}

// Overlay for drawing/editing the plate line on top of video
export function PlateLineOverlay({ width, height, plateLine, onPlateLineChange }: PlateLineConfigProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [dragging, setDragging] = useState<"start" | "end" | null>(null);
    const [localLine, setLocalLine] = useState<number[]>(
        plateLine || [width * 0.2, height * 0.6, width * 0.8, height * 0.6]
    );

    useEffect(() => {
        if (plateLine && plateLine.length === 4) {
            setLocalLine(plateLine);
        }
    }, [plateLine]);

    const handleWindowMouseMove = (e: MouseEvent) => {
        if (!dragging || !svgRef.current) return;
        
        const rect = svgRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(width, e.clientX - rect.left));
        const y = Math.max(0, Math.min(height, e.clientY - rect.top));
        
        setLocalLine(prev => {
            if (dragging === "start") {
                return [x, y, prev[2], prev[3]];
            } else {
                return [prev[0], prev[1], x, y];
            }
        });
    };

    const handleWindowMouseUp = () => {
        if (dragging) {
            onPlateLineChange(localLine);
            setDragging(null);
        }
    };

    // Effect to attach/detach global listeners
    useEffect(() => {
        if (dragging) {
            window.addEventListener("mousemove", handleWindowMouseMove);
            window.addEventListener("mouseup", handleWindowMouseUp);
        }
        return () => {
            window.removeEventListener("mousemove", handleWindowMouseMove);
            window.removeEventListener("mouseup", handleWindowMouseUp);
        };
    }, [dragging, localLine]); // Depend on localLine to keep state fresh in closure


    const handleMouseDown = (point: "start" | "end") => (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(point);
    };

    return (
        <svg
            ref={svgRef}
            className="absolute inset-0 z-40 pointer-events-none"
            width={width}
            height={height}
        >
            {/* Main line */}
            <line
                x1={localLine[0]}
                y1={localLine[1]}
                x2={localLine[2]}
                y2={localLine[3]}
                stroke="#FF00FF"
                strokeWidth={3}
                strokeDasharray="8 4"
                className="pointer-events-auto cursor-grab"
            />
            
            {/* Start point handle */}
            <circle
                cx={localLine[0]}
                cy={localLine[1]}
                r={10}
                fill="#FF00FF"
                stroke="white"
                strokeWidth={2}
                className="cursor-grab active:cursor-grabbing pointer-events-auto"
                onMouseDown={handleMouseDown("start")}
            />
            
            {/* End point handle */}
            <circle
                cx={localLine[2]}
                cy={localLine[3]}
                r={10}
                fill="#FF00FF"
                stroke="white"
                strokeWidth={2}
                className="cursor-grab active:cursor-grabbing pointer-events-auto"
                onMouseDown={handleMouseDown("end")}
            />
            
            {/* Label */}
            <text
                x={(localLine[0] + localLine[2]) / 2}
                y={(localLine[1] + localLine[3]) / 2 - 15}
                fill="#FF00FF"
                textAnchor="middle"
                fontSize="14"
                fontWeight="bold"
                style={{ textShadow: "0 0 3px black, 0 0 3px black" }}
                className="pointer-events-auto select-none"
            >
                PLATE CAPTURE LINE
            </text>
        </svg>
    );
}

interface PlateLineConfigPanelProps {
    plateLine: number[] | null;
    onPlateLineChange: (line: number[] | null) => void;
    onSave: () => void;
    onCancel: () => void;
    width: number;
    height: number;
}

// Side panel for plate line controls
export function PlateLineConfigPanel({ 
    plateLine, 
    onPlateLineChange, 
    onSave, 
    onCancel,
    width,
    height 
}: PlateLineConfigPanelProps) {
    const hasLine = plateLine && plateLine.length === 4;

    const handleAddLine = () => {
        // Default: horizontal line at 60% height
        onPlateLineChange([width * 0.2, height * 0.6, width * 0.8, height * 0.6]);
    };

    const handleRemoveLine = () => {
        onPlateLineChange(null);
    };

    return (
        <Card className="p-4 border-zinc-200 dark:border-zinc-800">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900">
                        <GripVertical className="h-4 w-4 text-fuchsia-600" />
                    </div>
                    <h3 className="font-semibold">Plate Capture Line</h3>
                </div>

                <p className="text-xs text-zinc-500">
                    When a vehicle's center crosses this line, its plate will be captured.
                    Drag the endpoints to position the line.
                </p>

                {!hasLine ? (
                    <Button onClick={handleAddLine} className="w-full">
                        Add Plate Line
                    </Button>
                ) : (
                    <Button 
                        variant="outline" 
                        onClick={handleRemoveLine}
                        className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                        Remove Line
                    </Button>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <Button variant="ghost" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={onSave}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        Save
                    </Button>
                </div>
            </div>
        </Card>
    );
}
