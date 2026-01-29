"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, GripVertical } from "lucide-react";

export interface Lane {
    name: string;
    line_a: number[]; // [x1, y1, x2, y2] in pixels
    line_b: number[]; // [x1, y1, x2, y2] in pixels
    distance: number;
}

interface LaneConfigProps {
    width: number;
    height: number;
    lanes: Lane[];
    onLanesChange: (lanes: Lane[]) => void;
}

type DragTarget = {
    laneIdx: number;
    line: 'a' | 'b';
    point: 0 | 1; // 0 = start point, 1 = end point
} | null;

export function LaneConfig({ width, height, lanes, onLanesChange }: LaneConfigProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [dragTarget, setDragTarget] = useState<DragTarget>(null);
    const [selectedLane, setSelectedLane] = useState<number | null>(null);

    // Colors for different lanes
    const laneColors = [
        { a: '#00FFFF', b: '#FF00FF' }, // Cyan / Magenta
        { a: '#00FF00', b: '#FFFF00' }, // Green / Yellow
        { a: '#FF6B6B', b: '#4ECDC4' }, // Red / Teal
        { a: '#A855F7', b: '#F97316' }, // Purple / Orange
    ];

    const getColor = (laneIdx: number, line: 'a' | 'b') => {
        const colors = laneColors[laneIdx % laneColors.length];
        return line === 'a' ? colors.a : colors.b;
    };

    const handleMouseDown = (laneIdx: number, line: 'a' | 'b', point: 0 | 1) => (e: React.MouseEvent) => {
        e.preventDefault();
        setDragTarget({ laneIdx, line, point });
        setSelectedLane(laneIdx);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!dragTarget || !svgRef.current) return;

        const rect = svgRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(width, e.clientX - rect.left));
        const y = Math.max(0, Math.min(height, e.clientY - rect.top));

        const newLanes = [...lanes];
        const lane = newLanes[dragTarget.laneIdx];
        const lineKey = dragTarget.line === 'a' ? 'line_a' : 'line_b';
        const line = [...lane[lineKey]];

        if (dragTarget.point === 0) {
            line[0] = x;
            line[1] = y;
        } else {
            line[2] = x;
            line[3] = y;
        }

        lane[lineKey] = line;
        onLanesChange(newLanes);
    };

    const handleMouseUp = () => {
        setDragTarget(null);
    };

    const addLane = () => {
        const newLane: Lane = {
            name: `Lane ${lanes.length + 1}`,
            line_a: [width * 0.3, height * 0.4, width * 0.7, height * 0.4],
            line_b: [width * 0.3, height * 0.6, width * 0.7, height * 0.6],
            distance: 5.0
        };
        onLanesChange([...lanes, newLane]);
        setSelectedLane(lanes.length);
    };

    const removeLane = (idx: number) => {
        const newLanes = lanes.filter((_, i) => i !== idx);
        onLanesChange(newLanes);
        if (selectedLane === idx) {
            setSelectedLane(null);
        } else if (selectedLane !== null && selectedLane > idx) {
            setSelectedLane(selectedLane - 1);
        }
    };

    const updateLaneName = (idx: number, name: string) => {
        const newLanes = [...lanes];
        newLanes[idx].name = name;
        onLanesChange(newLanes);
    };

    const updateLaneDistance = (idx: number, distance: number) => {
        const newLanes = [...lanes];
        newLanes[idx].distance = distance;
        onLanesChange(newLanes);
    };

    return (
        <div className="absolute inset-0 z-40 pointer-events-none">
            {/* SVG Overlay for drawing lines */}
            <svg
                ref={svgRef}
                className="absolute inset-0 w-full h-full cursor-crosshair pointer-events-auto"
                style={{ width, height }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {lanes.map((lane, laneIdx) => (
                    <g key={laneIdx} opacity={selectedLane === null || selectedLane === laneIdx ? 1 : 0.4}>
                        {/* Line A (Entry) */}
                        <line
                            x1={lane.line_a[0]} y1={lane.line_a[1]}
                            x2={lane.line_a[2]} y2={lane.line_a[3]}
                            stroke={getColor(laneIdx, 'a')}
                            strokeWidth={3}
                            strokeDasharray={selectedLane === laneIdx ? "none" : "5,5"}
                        />
                        {/* Line A Label */}
                        <text
                            x={(lane.line_a[0] + lane.line_a[2]) / 2}
                            y={(lane.line_a[1] + lane.line_a[3]) / 2 - 8}
                            fill={getColor(laneIdx, 'a')}
                            fontSize="12"
                            textAnchor="middle"
                            fontWeight="bold"
                        >
                            {lane.name} A
                        </text>
                        {/* Line A endpoints */}
                        <circle
                            cx={lane.line_a[0]} cy={lane.line_a[1]} r={8}
                            fill={getColor(laneIdx, 'a')}
                            stroke="white" strokeWidth={2}
                            className="cursor-grab"
                            onMouseDown={handleMouseDown(laneIdx, 'a', 0)}
                        />
                        <circle
                            cx={lane.line_a[2]} cy={lane.line_a[3]} r={8}
                            fill={getColor(laneIdx, 'a')}
                            stroke="white" strokeWidth={2}
                            className="cursor-grab"
                            onMouseDown={handleMouseDown(laneIdx, 'a', 1)}
                        />

                        {/* Line B (Exit) */}
                        <line
                            x1={lane.line_b[0]} y1={lane.line_b[1]}
                            x2={lane.line_b[2]} y2={lane.line_b[3]}
                            stroke={getColor(laneIdx, 'b')}
                            strokeWidth={3}
                            strokeDasharray={selectedLane === laneIdx ? "none" : "5,5"}
                        />
                        {/* Line B Label */}
                        <text
                            x={(lane.line_b[0] + lane.line_b[2]) / 2}
                            y={(lane.line_b[1] + lane.line_b[3]) / 2 - 8}
                            fill={getColor(laneIdx, 'b')}
                            fontSize="12"
                            textAnchor="middle"
                            fontWeight="bold"
                        >
                            {lane.name} B
                        </text>
                        {/* Line B endpoints */}
                        <circle
                            cx={lane.line_b[0]} cy={lane.line_b[1]} r={8}
                            fill={getColor(laneIdx, 'b')}
                            stroke="white" strokeWidth={2}
                            className="cursor-grab"
                            onMouseDown={handleMouseDown(laneIdx, 'b', 0)}
                        />
                        <circle
                            cx={lane.line_b[2]} cy={lane.line_b[3]} r={8}
                            fill={getColor(laneIdx, 'b')}
                            stroke="white" strokeWidth={2}
                            className="cursor-grab"
                            onMouseDown={handleMouseDown(laneIdx, 'b', 1)}
                        />
                    </g>
                ))}
            </svg>
        </div>
    );
}

interface LaneConfigPanelProps {
    lanes: Lane[];
    onLanesChange: (lanes: Lane[]) => void;
    onSave: () => void;
    onCancel: () => void;
    width: number;
    height: number;
}

export function LaneConfigPanel({ lanes, onLanesChange, onSave, onCancel, width, height }: LaneConfigPanelProps) {
    const addLane = () => {
        const newLane: Lane = {
            name: `Lane ${lanes.length + 1}`,
            line_a: [width * 0.3, height * 0.4, width * 0.7, height * 0.4],
            line_b: [width * 0.3, height * 0.6, width * 0.7, height * 0.6],
            distance: 5.0
        };
        onLanesChange([...lanes, newLane]);
    };

    const removeLane = (idx: number) => {
        onLanesChange(lanes.filter((_, i) => i !== idx));
    };

    const updateLane = (idx: number, field: keyof Lane, value: any) => {
        const newLanes = [...lanes];
        (newLanes[idx] as any)[field] = value;
        onLanesChange(newLanes);
    };

    return (
        <Card className="p-4 border-zinc-200 dark:border-zinc-800 animate-in fade-in slide-in-from-top-4">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Lane Configuration</h3>
                    <Button onClick={addLane} size="sm" variant="outline" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Lane
                    </Button>
                </div>

                <p className="text-xs text-zinc-500">
                    Each lane has two lines: <span className="text-cyan-500 font-bold">Line A (Entry)</span> and <span className="text-pink-500 font-bold">Line B (Exit)</span>. 
                    Speed is calculated as: distance (meters) / time to cross from A to B.
                </p>

                {lanes.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500">
                        No lanes configured. Click "Add Lane" to create one.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {lanes.map((lane, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                <GripVertical className="h-4 w-4 text-zinc-400" />
                                <div className="flex-1 flex items-center gap-3">
                                    <Input
                                        value={lane.name}
                                        onChange={(e) => updateLane(idx, 'name', e.target.value)}
                                        placeholder="Lane name"
                                        className="w-32"
                                    />
                                    <div className="flex items-center gap-2">
                                        <Label className="text-xs text-zinc-500 whitespace-nowrap">Distance (m):</Label>
                                        <Input
                                            type="number"
                                            value={lane.distance}
                                            onChange={(e) => updateLane(idx, 'distance', parseFloat(e.target.value) || 0)}
                                            className="w-20"
                                            min={0.1}
                                            step={0.5}
                                        />
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => removeLane(idx)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <Button variant="ghost" onClick={onCancel} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        Cancel
                    </Button>
                    <Button onClick={onSave} className="bg-green-600 hover:bg-green-700 text-white">
                        Save Configuration
                    </Button>
                </div>
            </div>
        </Card>
    );
}
