"use client";

import React from "react";
import { Stage, Layer, Line, Circle, Text, Group } from "react-konva";

interface ZoneConfigProps {
  width: number;
  height: number;
  points: number[]; // [x1, y1, x2, y2, x3, y3, x4, y4]
  onPointsChange: (newPoints: number[]) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function ZoneConfig({ width, height, points, onPointsChange, onSave, onCancel }: ZoneConfigProps) {
  
  const handlePointDrag = (e: any, index: number) => {
    const node = e.target;
    const newPoints = [...points];
    newPoints[index * 2] = node.x();
    newPoints[index * 2 + 1] = node.y();
    onPointsChange(newPoints);
  };

  const handleBodyDragEnd = (e: any) => {
    const node = e.target;
    const dx = node.x();
    const dy = node.y();
    
    node.position({ x: 0, y: 0 });

    const newPoints = points.map((val, i) => {
        return i % 2 === 0 ? val + dx : val + dy;
    });
    
    onPointsChange(newPoints);
  };

  // Helper to get edge center for labels
  const getEdgeCenter = (i1: number, i2: number) => {
      const idx1 = i1 % 4;
      const idx2 = i2 % 4;
      const x = (points[idx1 * 2] + points[idx2 * 2]) / 2;
      const y = (points[idx1 * 2 + 1] + points[idx2 * 2 + 1]) / 2;
      return { x, y };
  };

  return (
    <div className="absolute inset-0 z-50">
        {/* Helper Instructions / Controls */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-sm font-medium z-50 flex gap-4 items-center">
            <span>Drag corners to define intersection zone</span>
            <div className="h-4 w-px bg-white/20" />
            <button onClick={onCancel} className="hover:text-red-400">Cancel</button>
            <button onClick={onSave} className="text-green-400 hover:text-green-300 font-bold">Save Zone</button>
        </div>

      <div className="absolute inset-0 pointer-events-auto">
        <Stage width={width} height={height}>
          <Layer>
            {/* Polygon Body (Draggable) */}
            <Group draggable onDragEnd={handleBodyDragEnd}>
                <Line
                    points={points}
                    closed
                    fill="rgba(0, 255, 0, 0.1)"
                    stroke="#00ff00"
                    strokeWidth={2}
                />
                
                {/* Edge Numbers */}
                {[0, 1, 2, 3].map((i) => {
                    const center = getEdgeCenter(i, i + 1);
                    return (
                        <Group key={i} x={center.x} y={center.y}>
                            <Circle radius={10} fill="white" />
                            <Text 
                                text={String(i + 1)} 
                                x={-4} y={-5}
                                fontSize={12} 
                                fontStyle="bold"
                                fill="black"
                            />
                        </Group>
                    );
                })}
            </Group>

            {/* Corner Handles */}
            {[0, 1, 2, 3].map((i) => (
                <Circle
                    key={i}
                    x={points[i * 2]}
                    y={points[i * 2 + 1]}
                    radius={8}
                    fill="white"
                    stroke="black"
                    strokeWidth={1}
                    draggable
                    onDragMove={(e) => handlePointDrag(e, i)}
                    hitStrokeWidth={20}
                />
            ))}

          </Layer>
        </Stage>
      </div>
    </div>
  );
}
