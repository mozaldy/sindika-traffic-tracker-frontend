"use client";

import React from "react";
import { Stage, Layer, Line, Circle, Text, Group } from "react-konva";

interface LineConfigProps {
  width: number;
  height: number;
  points: number[]; // [x1, y1, x2, y2, x3, y3, x4, y4] -> Top-Left, Top-Right, Bottom-Right, Bottom-Left
  onPointsChange: (newPoints: number[]) => void;
  distance: number;
  onDistanceChange: (newDistance: number) => void;
}

export function LineConfig({ width, height, points, onPointsChange, distance, onDistanceChange }: LineConfigProps) {
  
  const handlePointDrag = (e: any, index: number) => {
    const node = e.target;
    // Enforce bounds? Optional. For now just let them drag.
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
  const getCenter = (i1: number, i2: number) => {
      const x = (points[i1 * 2] + points[i2 * 2]) / 2;
      const y = (points[i1 * 2 + 1] + points[i2 * 2 + 1]) / 2;
      return { x, y };
  };

  // We assume:
  // Edge 0: p0 -> p1 (Top/Start)
  // Edge 1: p1 -> p2 (Right)
  // Edge 2: p2 -> p3 (Bottom/End)
  // Edge 3: p3 -> p0 (Left)
  const startCenter = getCenter(0, 1);
  const endCenter = getCenter(3, 2);

  return (
    <div className="absolute inset-0 z-50 pointer-events-none">
      <div className="pointer-events-auto absolute inset-0">
        <Stage width={width} height={height}>
          <Layer>
            {/* Polygon Body (Draggable) */}
            <Group draggable onDragEnd={handleBodyDragEnd}>
                <Line
                    points={points}
                    closed
                    fill="rgba(255, 255, 255, 0.1)"
                    stroke="white"
                    strokeWidth={2}
                    dash={[10, 5]}
                />
                
                {/* Specific Edges Visualization */}
                {/* Start Line (Green) - P0 to P1 */}
                <Line 
                    points={[points[0], points[1], points[2], points[3]]}
                    stroke="#00ff00"
                    strokeWidth={4}
                    lineCap="round"
                />
                <Text 
                    x={startCenter.x} y={startCenter.y - 20} 
                    text="START" 
                    fill="#00ff00" 
                    fontSize={16} 
                    fontStyle="bold"
                    shadowColor="black"
                    shadowBlur={2}
                />

                {/* End Line (Red) - P3 to P2 (Note: points array is P0..P3. 
                    P2 is index 2 (4,5), P3 is index 3 (6,7). 
                    We draw line between P3 and P2.
                */}
                <Line 
                    points={[points[6], points[7], points[4], points[5]]}
                    stroke="#ff0000"
                    strokeWidth={4}
                    lineCap="round"
                />
                 <Text 
                    x={endCenter.x} y={endCenter.y + 10} 
                    text="END" 
                    fill="#ff0000" 
                    fontSize={16} 
                    fontStyle="bold"
                    shadowColor="black"
                    shadowBlur={2}
                />
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

        {/* Distance Input Overlay (Right Edge: P1->P2) */}
        {(() => {
            // P1 is index 2,3. P2 is index 4,5
            const x1 = points[2];
            const y1 = points[3];
            const x2 = points[4];
            const y2 = points[5];
            
            const cx = (x1 + x2) / 2;
            const cy = (y1 + y2) / 2;
            
            return (
                <>
                <style>{`
                    .no-spinner::-webkit-outer-spin-button,
                    .no-spinner::-webkit-inner-spin-button {
                        -webkit-appearance: none;
                        margin: 0;
                    }
                    .no-spinner {
                        -moz-appearance: textfield;
                    }
                `}</style>
                <div 
                    style={{ 
                        position: 'absolute', 
                        left: cx, 
                        top: cy,
                        transform: 'translate(-50%, -50%)'
                    }}
                    className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded backdrop-blur-sm pointer-events-auto"
                >
                     <input 
                        type="number"
                        value={distance || ''}
                        onChange={(e) => onDistanceChange(parseFloat(e.target.value))}
                        className="w-12 bg-transparent text-white text-center font-bold outline-none border-b border-white/50 focus:border-white text-sm no-spinner"
                        placeholder="Dist"
                     />
                     <span className="text-white text-xs font-medium">m</span>
                </div>
                </>
            );
        })()}
      </div>
    </div>
  );
}
